"""
Portfolio Intelligence Orchestration Workflow — Microsoft Agent Framework (MAF)

Full Sense → Think → Act pipeline for portfolio construction from client metadata:

  Sense:  [News + Market] → [Theme Extraction]  ──GATE-1: Activate Themes──
  Think:  [Universe Mapping] → [Fundamentals ║ Technicals] (parallel)
          → [Portfolio Construction]  ──GATE-2: Advisor Approval──
  Act:    [Backtest] → [Risk Check] → [Rebalance Plan] ──GATE-3: Execute──

All human-in-the-loop checkpoints saved to Cosmos DB.
Advisor must explicitly approve at each gate before the workflow proceeds.
"""
from __future__ import annotations

import asyncio
import json
import logging
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional

from backend.app.agents import (
    BacktestingAgent,
    NewsAgent,
    PortfolioConstructionAgent,
    RebalanceAgent,
)
from backend.app.models.audit import AuditEntry, AuditEventType
from backend.app.models.portfolio import PortfolioStatus
from backend.app.persistence.cosmos_store import get_cosmos_store

logger = logging.getLogger(__name__)


class PortfolioGate(str, Enum):
    THEME_ACTIVATION = "theme_activation"
    PORTFOLIO_APPROVAL = "portfolio_approval"
    TRADE_EXECUTION = "trade_execution"


class PortfolioWorkflowStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    AWAITING_APPROVAL = "awaiting_approval"
    APPROVED = "approved"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class PortfolioWorkflowState:
    run_id: str
    client_id: str
    advisor_id: str
    mandate: str
    investment_amount: float
    status: PortfolioWorkflowStatus = PortfolioWorkflowStatus.PENDING
    gate: Optional[PortfolioGate] = None

    # Sense outputs
    market_news: dict[str, Any] = field(default_factory=dict)
    themes: list[dict[str, Any]] = field(default_factory=list)
    activated_themes: list[dict[str, Any]] = field(default_factory=list)

    # Think outputs
    universe: list[str] = field(default_factory=list)
    fundamental_scores: dict[str, Any] = field(default_factory=dict)
    technical_scores: dict[str, Any] = field(default_factory=dict)
    portfolio_proposal: dict[str, Any] = field(default_factory=dict)

    # Act outputs
    backtest_result: dict[str, Any] = field(default_factory=dict)
    rebalance_report: dict[str, Any] = field(default_factory=dict)

    # Approvals
    approved_by: str = ""
    approval_notes: str = ""

    started_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None
    error: str = ""
    current_step: str = ""  # human-readable progress label shown in UI


_running_workflows: dict[str, PortfolioWorkflowState] = {}


class PortfolioWorkflow:
    """Orchestrates the full portfolio construction pipeline."""

    def __init__(
        self,
        client_id: str,
        advisor_id: str,
        mandate: str,
        investment_amount: float = 50_000.0,
    ) -> None:
        self.run_id = str(uuid.uuid4())
        self.client_id = client_id
        self.advisor_id = advisor_id
        self.state = PortfolioWorkflowState(
            run_id=self.run_id,
            client_id=client_id,
            advisor_id=advisor_id,
            mandate=mandate,
            investment_amount=investment_amount,
        )
        _running_workflows[self.run_id] = self.state

        # Agents
        self.news = NewsAgent()
        self.portfolio = PortfolioConstructionAgent()
        self.backtesting = BacktestingAgent()
        self.rebalance = RebalanceAgent()

    async def run(
        self,
        client_profile: dict[str, Any],
        auto_approve_gates: bool = False,
        run_backtest: bool = True,
    ) -> str:
        """
        Execute the full portfolio pipeline.
        Returns run_id. Poll /api/portfolio/runs/{run_id} for status.
        """
        self.state.status = PortfolioWorkflowStatus.RUNNING
        store = get_cosmos_store()

        try:
            await self._log(AuditEventType.PORTFOLIO_RUN_STARTED, "Portfolio workflow started")

            # ── SENSE: Market Intelligence + Theme Extraction ──────────────────
            logger.info("portfolio_step_sense run_id=%s", self.run_id)
            self.state.current_step = "Scanning market news & grounding themes"
            tickers = [h.get("symbol", "") for h in client_profile.get("holdings", [])]
            market_news = await asyncio.get_running_loop().run_in_executor(
                None, self.news.run_daily_scan, tickers, [], client_profile
            )
            self.state.market_news = market_news if isinstance(market_news, dict) else {}

            # Extract themes from news
            themes_raw: list[dict[str, Any]] = self.state.market_news.get("market_themes", [])
            self.state.themes = themes_raw

            # ── GATE-1: Theme Activation ───────────────────────────────────────
            self.state.current_step = "Gate 1 — awaiting theme approval"
            await self._log(AuditEventType.PORTFOLIO_GATE_REACHED, "Gate 1: Theme activation")
            if auto_approve_gates:
                self.state.activated_themes = themes_raw
                await self._log(AuditEventType.PORTFOLIO_GATE_APPROVED, "Gate 1 auto-approved")
                await self._run_think(client_profile, run_backtest=run_backtest)
            else:
                self.state.gate = PortfolioGate.THEME_ACTIVATION
                self.state.status = PortfolioWorkflowStatus.AWAITING_APPROVAL
                await self._save_checkpoint(PortfolioGate.THEME_ACTIVATION, {"themes": themes_raw, "market_news": self.state.market_news})
                return self.run_id  # Pause here; client polls for gate status

            # ── ACT: Backtest + Persist ────────────────────────────────────────
            self.state.current_step = "Running backtest & persisting"
            if run_backtest:
                await self._run_backtest(client_profile)

            await self._finalize(client_profile)
            return self.run_id

        except Exception as exc:
            logger.error("portfolio_workflow_error run_id=%s error=%s", self.run_id, exc)
            self.state.status = PortfolioWorkflowStatus.FAILED
            self.state.error = str(exc)
            await self._log(AuditEventType.AGENT_FAILED, f"Workflow failed: {exc}")
            return self.run_id

    async def retry_step(
        self,
        step: str,
        client_profile: dict[str, Any] | None = None,
        run_backtest: bool = True,
    ) -> None:
        """
        Re-run a specific step without starting from scratch.
        step: "sense" | "think"
        """
        self.state.status = PortfolioWorkflowStatus.RUNNING
        self.state.gate = None
        self.state.error = ""
        cp = client_profile or {}

        if step == "sense":
            try:
                self.state.current_step = "Retrying: scanning market news & grounding themes"
                tickers = [h.get("symbol", "") for h in cp.get("holdings", [])]
                market_news = await asyncio.get_running_loop().run_in_executor(
                    None, self.news.run_daily_scan, tickers, [], cp
                )
                self.state.market_news = market_news if isinstance(market_news, dict) else {}
                themes_raw: list[dict[str, Any]] = self.state.market_news.get("market_themes", [])
                self.state.themes = themes_raw
                self.state.current_step = "Gate 1 — awaiting theme approval"
                await self._log(AuditEventType.PORTFOLIO_GATE_REACHED, "Gate 1 (retry): Theme activation")
                self.state.gate = PortfolioGate.THEME_ACTIVATION
                self.state.status = PortfolioWorkflowStatus.AWAITING_APPROVAL
                await self._save_checkpoint(PortfolioGate.THEME_ACTIVATION, {"themes": themes_raw, "market_news": self.state.market_news})
            except Exception as exc:
                logger.error("retry_sense_error run_id=%s error=%s", self.run_id, exc)
                self.state.status = PortfolioWorkflowStatus.FAILED
                self.state.error = str(exc)

        elif step == "think":
            await self._run_think(cp, run_backtest=run_backtest)

    async def _resolve_checkpoints(self, resolution: str = "resolved") -> None:
        """Mark all pending checkpoints for this run as resolved/rejected in Cosmos."""
        try:
            store = get_cosmos_store()
            cps = await store.query(
                "checkpoints",
                "SELECT * FROM c WHERE c.workflow_id = @wid AND c.workflow_type = 'portfolio' AND c.status = 'awaiting_approval'",
                [{"name": "@wid", "value": self.run_id}],
            )
            for cp in cps:
                cp["status"] = resolution
                await store.upsert("checkpoints", cp)
        except Exception as exc:
            logger.warning("resolve_checkpoints_failed run_id=%s error=%s", self.run_id, exc)

    async def resume_after_gate(
        self,
        gate: PortfolioGate,
        approved: bool,
        approved_by: str,
        notes: str = "",
        client_profile: dict[str, Any] | None = None,
        run_backtest: bool = True,
    ) -> None:
        """Resume workflow after advisor approves or rejects a gate."""
        # Always clear the pending checkpoint in Cosmos so it leaves the dashboard
        await self._resolve_checkpoints("resolved" if approved else "rejected")

        if not approved:
            self.state.status = PortfolioWorkflowStatus.FAILED
            self.state.error = f"Gate {gate} rejected by {approved_by}: {notes}"
            await self._log(AuditEventType.PORTFOLIO_GATE_REJECTED, f"Gate rejected: {notes}")
            return

        self.state.approved_by = approved_by
        self.state.approval_notes = notes
        self.state.gate = None
        self.state.status = PortfolioWorkflowStatus.RUNNING
        await self._log(AuditEventType.PORTFOLIO_GATE_APPROVED, f"Gate {gate} approved by {approved_by}")

        if gate == PortfolioGate.THEME_ACTIVATION:
            self.state.activated_themes = self.state.themes
            self.state.current_step = "Building universe & scoring positions"
            await self._run_think(client_profile or {}, run_backtest=run_backtest)

        elif gate == PortfolioGate.PORTFOLIO_APPROVAL:
            self.state.current_step = "Running backtest & persisting portfolio"
            if run_backtest and client_profile:
                await self._run_backtest(client_profile)
            await self._finalize(client_profile or {})

        elif gate == PortfolioGate.TRADE_EXECUTION:
            self.state.current_step = "Executing trades"
            await self._execute_trades()

    async def _run_think(
        self,
        client_profile: dict[str, Any],
        run_backtest: bool = True,
    ) -> None:
        """Execute the Think + Gate-2 + Act steps after Gate-1 approval."""
        try:
            self.state.current_step = "Building universe & scoring positions"
            logger.info("portfolio_step_think run_id=%s", self.run_id)
            universe = self._derive_universe(self.state.activated_themes, client_profile)
            self.state.universe = universe

            self.state.current_step = "Constructing portfolio proposal"
            proposal = await asyncio.get_running_loop().run_in_executor(
                None,
                self.portfolio.construct,
                client_profile,
                self.state.activated_themes,
                universe,
                None,
                None,
                self.state.investment_amount,
            )
            # Merge duplicate symbols — the model sometimes splits a single ticker into
            # multiple tranches (e.g. three TLT rows at 10% each to hit a 30% target).
            # Aggregate their weights rather than discarding duplicates.
            positions = proposal.get("positions", [])
            import re as _re
            merged: dict[str, dict] = {}
            for p in positions:
                key = (p.get("symbol") or p.get("ticker") or "").upper()
                if not key:
                    continue
                if key in merged:
                    merged[key]["weight"] = round(
                        float(merged[key].get("weight", 0)) + float(p.get("weight", 0)), 6
                    )
                    if "target_weight" in p or "target_weight" in merged[key]:
                        merged[key]["target_weight"] = merged[key]["weight"]
                else:
                    entry = dict(p)
                    # Strip tranche suffixes from display names
                    entry["name"] = _re.sub(
                        r"\s*\(tranche\s*\d+\)", "", entry.get("name", ""), flags=_re.IGNORECASE
                    ).strip()
                    merged[key] = entry
            deduped = list(merged.values())
            # Renormalise weights so they always sum to 1.0
            total_w = sum(float(p.get("weight", 0)) for p in deduped)
            if total_w <= 0 and deduped:
                # LLM returned zero/missing weights — assign equal distribution
                equal_w = round(1.0 / len(deduped), 6)
                for p in deduped:
                    p["weight"] = equal_w
                    if "target_weight" in p:
                        p["target_weight"] = equal_w
            elif total_w > 0 and abs(total_w - 1.0) > 0.001:
                for p in deduped:
                    p["weight"] = round(float(p.get("weight", 0)) / total_w, 6)
                    if "target_weight" in p:
                        p["target_weight"] = p["weight"]
            proposal["positions"] = deduped
            self.state.portfolio_proposal = proposal

            self.state.current_step = "Gate 2 — awaiting portfolio approval"
            await self._log(AuditEventType.PORTFOLIO_GATE_REACHED, "Gate 2: Portfolio approval")
            self.state.gate = PortfolioGate.PORTFOLIO_APPROVAL
            self.state.status = PortfolioWorkflowStatus.AWAITING_APPROVAL
            await self._save_checkpoint(
                PortfolioGate.PORTFOLIO_APPROVAL,
                {"portfolio_proposal": proposal},
            )
            store = get_cosmos_store()
            await store.save_portfolio({
                "proposal_id": self.run_id,
                "client_id": self.client_id,
                "advisor_id": self.advisor_id,
                "run_id": self.run_id,
                "status": PortfolioStatus.PENDING_APPROVAL.value,
                "positions": proposal.get("positions", []),
                "themes": proposal.get("themes", []),
                "metrics": proposal.get("risk_metrics", {}),
                "rationale": proposal.get("portfolio_rationale", ""),
                "mandate": self.state.mandate,
                "investment_amount": self.state.investment_amount,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
        except Exception as exc:
            logger.error("portfolio_think_error run_id=%s error=%s", self.run_id, exc)
            self.state.status = PortfolioWorkflowStatus.FAILED
            self.state.error = str(exc)
            await self._log(AuditEventType.AGENT_FAILED, f"Think step failed: {exc}")

    async def _run_backtest(self, client_profile: dict[str, Any]) -> None:
        """Run historical backtesting on the proposed portfolio."""
        from datetime import date, timedelta
        end_date = date.today().isoformat()
        start_date = (date.today().replace(year=date.today().year - 3)).isoformat()

        result = await asyncio.get_running_loop().run_in_executor(
            None,
            self.backtesting.analyze_backtest_results,
            self.state.portfolio_proposal.get("positions", []),
            {},  # price_data — in production fetched from yfinance/market data service
            start_date,
            end_date,
            self.state.investment_amount,
        )
        self.state.backtest_result = result if isinstance(result, dict) else {}
        await self._log(AuditEventType.BACKTEST_COMPLETED, "Backtest completed")

    async def _finalize(self, client_profile: dict[str, Any]) -> None:
        """Persist the approved portfolio and mark workflow complete."""
        store = get_cosmos_store()
        await store.save_portfolio({
            "proposal_id": self.run_id,
            "client_id": self.client_id,
            "advisor_id": self.advisor_id,
            "run_id": self.run_id,
            "status": PortfolioStatus.APPROVED.value,
            "positions": self.state.portfolio_proposal.get("positions", []),
            "themes": self.state.portfolio_proposal.get("themes", []),
            "metrics": self.state.portfolio_proposal.get("risk_metrics", {}),
            "rationale": self.state.portfolio_proposal.get("portfolio_rationale", ""),
            "mandate": self.state.mandate,
            "investment_amount": self.state.investment_amount,
            "backtest": self.state.backtest_result,
            "approved_by": self.state.approved_by,
            "approved_at": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        self.state.status = PortfolioWorkflowStatus.COMPLETED
        self.state.completed_at = datetime.now(timezone.utc)
        await self._log(AuditEventType.PORTFOLIO_PROPOSAL_CREATED, "Portfolio approved and persisted")

    async def _execute_trades(self) -> None:
        """Trade execution stub — in production integrates with broker API."""
        logger.info("trade_execution_stub run_id=%s", self.run_id)
        self.state.status = PortfolioWorkflowStatus.COMPLETED
        await self._log(AuditEventType.TRADES_EXECUTED, "Trades executed (paper trading)")

    # ── Autonomous Watch Cycle ─────────────────────────────────────────────────

    async def run_watch_cycle(
        self,
        portfolio: dict[str, Any],
        client_profile: dict[str, Any],
    ) -> tuple[dict[str, Any], list[dict[str, Any]]]:
        """Autonomous 30-minute watch cycle running three agents in sequence.

        1. NewsAgent    — Bing-grounded scan of current portfolio tickers
        2. MarketRegimeAgent — VIX/ATR/selloff risk classification
        3. RiskAdvisoryAgent — Synthesize accumulated data into advisory

        Agents 1 and 2 run in parallel. Agent 3 consumes their output.

        Args:
            portfolio:      The full portfolio document from Cosmos.
            client_profile: Client CRM data for contextualisation.
        Returns:
            Tuple of (watch_snapshot dict, updated_news_history list).
            Caller is responsible for persisting both back to the portfolio doc.
        """
        from backend.app.agents.market_regime_agent import MarketRegimeAgent
        from backend.app.agents.risk_advisory_agent import RiskAdvisoryAgent

        loop = asyncio.get_running_loop()
        positions = portfolio.get("positions", [])
        tickers = [
            (p.get("symbol") or p.get("ticker") or "").upper()
            for p in positions
            if (p.get("symbol") or p.get("ticker"))
        ]

        regime_agent = MarketRegimeAgent()

        # ── Step 1 + 2: News scan and regime analysis in parallel ─────────────
        news_task = loop.run_in_executor(
            None, self.news.run_daily_scan, tickers, [], client_profile
        )
        regime_task = loop.run_in_executor(
            None, regime_agent.analyze, tickers
        )

        news_result_raw, regime_result_raw = await asyncio.gather(
            news_task, regime_task, return_exceptions=True
        )

        news_result: dict[str, Any] = (
            news_result_raw if isinstance(news_result_raw, dict) else {}
        )
        regime_result: dict[str, Any] = (
            regime_result_raw if isinstance(regime_result_raw, dict) else {}
        )

        if isinstance(news_result_raw, Exception):
            logger.warning("watch_cycle_news_failed portfolio=%s error=%s",
                           portfolio.get("proposal_id"), news_result_raw)
        if isinstance(regime_result_raw, Exception):
            logger.warning("watch_cycle_regime_failed portfolio=%s error=%s",
                           portfolio.get("proposal_id"), regime_result_raw)

        # ── Rolling news history (keep last 6 snapshots ≈ 3 hours) ───────────
        news_history: list[dict[str, Any]] = portfolio.get("news_history", [])
        if news_result:
            news_history.append({
                "news": news_result,
                "captured_at": datetime.now(timezone.utc).isoformat(),
            })
        news_history = news_history[-6:]

        # ── Step 3: Risk advisory synthesis ───────────────────────────────────
        risk_agent = RiskAdvisoryAgent()
        last_rebalance_doc = portfolio.get("last_rebalance_result", {})
        rebalance_data = (
            last_rebalance_doc.get("rebalance")
            if isinstance(last_rebalance_doc, dict)
            else None
        )

        try:
            advisory_result = await loop.run_in_executor(
                None,
                risk_agent.synthesize,
                portfolio,
                news_history,
                regime_result,
                rebalance_data,
            )
            if not isinstance(advisory_result, dict):
                advisory_result = {}
        except Exception as exc:
            logger.warning("watch_cycle_advisory_failed portfolio=%s error=%s",
                           portfolio.get("proposal_id"), exc)
            advisory_result = {}

        snapshot: dict[str, Any] = {
            "cycle_at": datetime.now(timezone.utc).isoformat(),
            "news": news_result,
            "regime": regime_result,
            "advisory": advisory_result,
            "tickers_scanned": tickers,
        }

        logger.info(
            "watch_cycle_complete portfolio=%s regime=%s selloff=%s",
            portfolio.get("proposal_id"),
            regime_result.get("regime", "?"),
            regime_result.get("selloff_risk", "?"),
        )
        return snapshot, news_history

    # Theme keyword → representative liquid tickers for initial screening
    _THEME_UNIVERSE: dict[str, list[str]] = {
        "geopolitical": ["LMT", "RTX", "NOC", "GD", "BA", "GLD", "IAU", "SLV", "XOM", "CVX", "COP", "DVN", "TLT", "BIL"],
        "war": ["LMT", "RTX", "NOC", "GD", "BA", "GLD", "IAU", "XOM", "CVX"],
        "inflation": ["GLD", "IAU", "TIPS", "BRK-B", "XOM", "CVX", "COP", "AMT", "PLD"],
        "interest rate": ["TLT", "IEF", "SHY", "BIL", "GS", "JPM", "BAC", "WFC", "BRK-B"],
        "tech": ["AAPL", "MSFT", "NVDA", "GOOGL", "META", "AMZN", "TSM", "AVGO", "AMD", "INTC", "QCOM"],
        "ai": ["NVDA", "MSFT", "GOOGL", "META", "AMZN", "TSM", "AVGO", "AMD", "PLTR", "SOUN", "SMCI"],
        "regulation": ["BRK-B", "JPM", "V", "MA", "UNH", "JNJ", "PFE", "ABBV", "MRK"],
        "disruption": ["NVDA", "MSFT", "GOOGL", "META", "TSLA", "AMZN", "NFLX", "SQ", "PYPL"],
        "energy": ["XOM", "CVX", "COP", "SLB", "HAL", "DVN", "MPC", "PSX", "FANG"],
        "healthcare": ["UNH", "JNJ", "LLY", "ABBV", "MRK", "TMO", "ABT", "DHR", "BMY"],
        "consumer": ["AMZN", "WMT", "COST", "TGT", "HD", "LOW", "MCD", "SBUX", "NKE"],
        "defensive": ["PG", "KO", "PEP", "JNJ", "MRK", "NEE", "D", "SO", "GLD", "TLT", "BIL"],
        "risk-off": ["GLD", "IAU", "TLT", "BIL", "VIX", "LMT", "NOC", "PG", "KO", "JNJ"],
        "volatility": ["GLD", "TLT", "BIL", "PG", "KO", "JNJ", "LMT", "RTX"],
        "default": ["SPY", "QQQ", "IWM", "GLD", "TLT", "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA",
                    "JPM", "BAC", "UNH", "XOM", "JNJ", "PG", "V", "MA", "BRK-B", "HD"],
    }

    def _derive_universe(
        self, themes: list[dict[str, Any]], client_profile: dict[str, Any]
    ) -> list[str]:
        """
        Derive ticker universe from themes + client holdings.
        Uses keyword mapping so the portfolio agent always has candidates to score.
        """
        universe: set[str] = set()

        # 1. Tickers explicitly listed on themes (if any agent provided them)
        for theme in themes:
            for ticker in theme.get("tickers", []):
                universe.add(ticker.upper())

        # 2. Keyword mapping from theme names / descriptions
        for theme in themes:
            text = (
                theme.get("theme", "") + " " + theme.get("description", "")
            ).lower()
            for keyword, tickers in self._THEME_UNIVERSE.items():
                if keyword in text:
                    universe.update(tickers)

        # 3. Always include existing client holdings so the agent can evaluate
        for holding in client_profile.get("holdings", []):
            sym = holding.get("symbol", "").strip().upper()
            if sym:
                universe.add(sym)

        # 4. Guarantee a non-empty universe with a liquid default basket
        if not universe:
            universe.update(self._THEME_UNIVERSE["default"])

        return sorted(universe)[:60]  # cap at 60 for analysis

    async def _save_checkpoint(self, gate: PortfolioGate, payload: dict[str, Any]) -> None:
        store = get_cosmos_store()
        checkpoint = {
            "checkpoint_id": str(uuid.uuid4()),
            "workflow_id": self.run_id,
            "run_id": self.run_id,
            "workflow_type": "portfolio",
            "gate": gate.value,
            "status": "awaiting_approval",
            "client_id": self.client_id,
            "advisor_id": self.advisor_id,
            "payload": payload,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await store.save_checkpoint(checkpoint)

    async def _log(self, event_type: AuditEventType, description: str) -> None:
        entry = AuditEntry(
            event_type=event_type,
            session_id=self.run_id,
            client_id=self.client_id,
            advisor_id=self.advisor_id,
            description=description,
        )
        try:
            store = get_cosmos_store()
            await store.log_audit(entry.model_dump())
        except Exception as exc:
            logger.warning("audit_log_failed error=%s", exc)


def get_portfolio_workflow(run_id: str) -> Optional[PortfolioWorkflowState]:
    return _running_workflows.get(run_id)


async def get_or_recover_portfolio_workflow(run_id: str) -> Optional[PortfolioWorkflowState]:
    """Return in-memory state, or rehydrate from Cosmos checkpoint on cache miss."""
    state = _running_workflows.get(run_id)
    if state:
        return state

    store = get_cosmos_store()
    checkpoints = await store.query(
        "checkpoints",
        "SELECT * FROM c WHERE c.workflow_id = @wid AND c.workflow_type = 'portfolio' AND c.status = 'awaiting_approval' ORDER BY c.created_at DESC",
        [{"name": "@wid", "value": run_id}],
        max_items=1,
    )
    if not checkpoints:
        return None
    cp = checkpoints[0]
    state = PortfolioWorkflowState(
        run_id=run_id,
        client_id=cp.get("client_id", ""),
        advisor_id=cp.get("advisor_id", ""),
        mandate=cp.get("mandate", "balanced"),
        investment_amount=float(cp.get("investment_amount", 0)),
        status=PortfolioWorkflowStatus.AWAITING_APPROVAL,
        gate=PortfolioGate(cp["gate"]) if cp.get("gate") else None,
    )
    # Restore any payload data from the checkpoint
    payload = cp.get("payload") or {}
    if payload.get("themes"):
        state.themes = payload["themes"]
    if payload.get("market_news"):
        state.market_news = payload["market_news"]
    if payload.get("portfolio_proposal") or payload.get("proposal") or payload.get("positions"):
        state.portfolio_proposal = (
            payload.get("portfolio_proposal")
            or payload.get("proposal")
            or {"positions": payload.get("positions", [])}
        )
    _running_workflows[run_id] = state
    return state
