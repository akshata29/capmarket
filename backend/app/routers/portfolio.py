"""
Portfolio Intelligence API Router — portfolio construction, approval, backtesting.

Endpoints:
  POST   /api/portfolio/run             Start portfolio construction workflow
  GET    /api/portfolio/runs/{run_id}   Get workflow status and result
  POST   /api/portfolio/runs/{id}/gate  Approve or reject a workflow gate
  GET    /api/portfolio/client/{cid}    List portfolios for client
  GET    /api/portfolio/{id}            Get portfolio proposal
  POST   /api/portfolio/{id}/approve    Final advisor approval
  POST   /api/portfolio/{id}/rebalance  Trigger rebalance check
  GET    /api/portfolio/checkpoints     Get pending human-in-the-loop checkpoints
"""
from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query
from pydantic import BaseModel

from backend.app.models.portfolio import (
    ApproveProposalRequest,
    RejectProposalRequest,
    RunPortfolioRequest,
)
from backend.app.orchestration.portfolio_workflow import (
    PortfolioGate,
    PortfolioWorkflow,
    PortfolioWorkflowStatus,
    get_portfolio_workflow,
    get_or_recover_portfolio_workflow,
)
from backend.app.persistence.cosmos_store import get_cosmos_store

router = APIRouter()
logger = logging.getLogger(__name__)


def _enrich_positions(
    positions: list[dict],
    inception_date: str,
    investment_amount: float,
) -> list[dict]:
    """Fetch current + historical prices from yFinance and fill in shares,
    entry_price, current_price, market_value, unrealized_pnl for each position."""
    # Guard: treat zero/missing investment_amount as 100k so position math works
    if investment_amount <= 0:
        investment_amount = 100_000.0
    try:
        import yfinance as yf  # type: ignore
    except ImportError:
        logger.warning("yfinance not installed — positions returned unenriched")
        return positions

    tickers = [
        (p.get("symbol") or p.get("ticker") or "").upper()
        for p in positions if (p.get("symbol") or p.get("ticker"))
    ]
    if not tickers:
        return positions

    import datetime as _dttm
    today = _dttm.date.today()

    try:
        # Fetch current prices — look back 14 calendar days to always catch last trading close
        tickers_str = " ".join(tickers)
        cur_start = (today - _dttm.timedelta(days=14)).isoformat()
        cur_end   = (today + _dttm.timedelta(days=1)).isoformat()
        batch = yf.download(tickers_str, start=cur_start, end=cur_end, interval="1d", progress=False, auto_adjust=True)
        close = batch["Close"] if "Close" in batch else batch
        latest_prices: dict[str, float] = {}
        if hasattr(close, "iloc"):
            if len(tickers) == 1:
                vals = close.dropna()
                if not vals.empty:
                    latest_prices[tickers[0]] = float(vals.iloc[-1])
            else:
                for t in tickers:
                    try:
                        vals = close[t].dropna()
                        if not vals.empty:
                            latest_prices[t] = float(vals.iloc[-1])
                    except Exception:
                        pass

        # Fetch inception-date prices — look BACK from inception to find last trading day on/before it
        try:
            inc = _dttm.date.fromisoformat(inception_date)
            # Go back 14 calendar days before inception; end just after inception day
            inc_start = (inc - _dttm.timedelta(days=14)).isoformat()
            inc_end   = (min(inc + _dttm.timedelta(days=1), today + _dttm.timedelta(days=1))).isoformat()
            hist = yf.download(
                tickers_str, start=inc_start, end=inc_end,
                interval="1d", progress=False, auto_adjust=True
            )
            hist_close = hist["Close"] if "Close" in hist else hist
            entry_prices: dict[str, float] = {}
            if len(tickers) == 1:
                vals = hist_close.dropna()
                if not vals.empty:
                    entry_prices[tickers[0]] = float(vals.iloc[-1])  # last price on/before inception
            else:
                for t in tickers:
                    try:
                        vals = hist_close[t].dropna()
                        if not vals.empty:
                            entry_prices[t] = float(vals.iloc[-1])
                    except Exception:
                        pass
        except Exception:
            entry_prices = {}

    except Exception as exc:
        logger.warning("yfinance_batch_failed error=%s", exc)
        return positions

    enriched = []
    n_positions = len(positions)
    logger.info(
        "enrich_positions n=%d inv=%.0f entry_prices=%d latest_prices=%d",
        n_positions, investment_amount, len(entry_prices), len(latest_prices),
    )
    for p in positions:
        p = dict(p)  # shallow copy — don't mutate stored doc
        sym = (p.get("symbol") or p.get("ticker") or "").upper()
        weight = float(p.get("weight") or 0.0)
        # Fallback: equal distribution if weight is missing/zero
        if weight <= 0 and n_positions > 0:
            weight = 1.0 / n_positions
        allocated = investment_amount * weight

        entry_px = entry_prices.get(sym) or float(p.get("entry_price") or 0)
        current_px = latest_prices.get(sym) or float(p.get("current_price") or 0)

        if entry_px > 0 and allocated > 0:
            shares = allocated / entry_px
        else:
            shares = float(p.get("shares") or 0)

        cost_basis = shares * entry_px if shares and entry_px else allocated
        mkt_val    = shares * current_px if shares and current_px else float(p.get("market_value") or 0)
        pnl        = mkt_val - cost_basis if cost_basis else 0.0
        pnl_pct    = pnl / cost_basis if cost_basis else 0.0

        p["entry_price"]       = round(entry_px, 4)
        p["current_price"]     = round(current_px, 4)
        p["shares"]            = round(shares, 4)
        p["market_value"]      = round(mkt_val, 2)
        p["cost_basis_total"]  = round(cost_basis, 2)
        p["unrealized_pnl"]    = round(pnl, 2)
        p["unrealized_pnl_pct"]= round(pnl_pct, 6)
        enriched.append(p)

    return enriched


# Track running workflows
_workflows: dict[str, PortfolioWorkflow] = {}


class GateDecisionRequest(BaseModel):
    approved: bool
    approved_by: str
    notes: str = ""
    client_profile: Optional[dict[str, Any]] = None
    run_backtest: bool = True


class RetryStepRequest(BaseModel):
    step: str  # "sense" | "think"
    client_profile: Optional[dict[str, Any]] = None
    run_backtest: bool = True


@router.post("/run", response_model=dict)
async def run_portfolio(
    request: RunPortfolioRequest,
    background_tasks: BackgroundTasks,
) -> dict[str, Any]:
    """Start the portfolio construction workflow for a client."""
    wf = PortfolioWorkflow(
        client_id=request.client_id,
        advisor_id=request.advisor_id,
        mandate=request.mandate,
        investment_amount=request.investment_amount,
    )
    _workflows[wf.run_id] = wf

    # Use the full client profile from the request body when provided.
    # Fall back to fetching from Cosmos so the workflow always has risk profile,
    # meeting extractions, goals, concerns, and recommendations from the last meeting.
    profile = request.client_profile or {}
    if not profile or not profile.get("risk_tolerance"):
        store = get_cosmos_store()
        cosmos_client = await store.get_client(request.client_id, request.advisor_id)
        if cosmos_client:
            profile = {**cosmos_client, **(profile or {})}
    if not profile:
        profile = {"client_id": request.client_id}

    async def execute():
        await wf.run(
            client_profile=profile,
            auto_approve_gates=request.auto_approve_gates,
            run_backtest=request.run_backtest,
        )

    background_tasks.add_task(execute)

    logger.info("portfolio_run_started run_id=%s client=%s", wf.run_id, request.client_id)
    return {
        "run_id": wf.run_id,
        "status": "running",
        "client_id": request.client_id,
        "message": "Portfolio workflow started. Poll /runs/{run_id} for status.",
    }


@router.get("/runs/{run_id}", response_model=dict)
async def get_run_status(run_id: str) -> dict[str, Any]:
    """Get the current status of a portfolio construction workflow."""
    state = await get_or_recover_portfolio_workflow(run_id)
    if not state:
        # Try loading final proposal from Cosmos (completed runs no longer in memory)
        store = get_cosmos_store()
        portfolio = await store.get_portfolio_by_run_id(run_id)
        if portfolio:
            port_status = portfolio.get("status", "")
            # Rejected/dismissed runs: return failed state, not completed
            if port_status in ("rejected", "dismissed"):
                return {
                    "run_id": run_id,
                    "status": "failed",
                    "error": "Dismissed by advisor",
                    "current_step": "",
                    "gate": None,
                    "themes": [],
                    "market_news": {},
                    "proposal": {},
                    "backtest": {},
                }
            return {
                "run_id": run_id,
                "status": "completed",
                "proposal": portfolio,
                "backtest": portfolio.get("backtest"),
            }
        raise HTTPException(404, "Workflow run not found")

    return {
        "run_id": run_id,
        "status": state.status.value,
        "gate": state.gate.value if state.gate else None,
        "current_step": state.current_step,
        "themes": state.themes,
        "activated_themes": state.activated_themes,
        "market_news": state.market_news,
        "universe_size": len(state.universe),
        "proposal": state.portfolio_proposal,
        "backtest": state.backtest_result,
        "error": state.error,
        "started_at": state.started_at.isoformat(),
    }


@router.post("/runs/{run_id}/gate", response_model=dict)
async def resolve_gate(
    run_id: str,
    request: GateDecisionRequest,
    background_tasks: BackgroundTasks,
) -> dict[str, Any]:
    """Advisor approves or rejects a workflow gate (human-in-the-loop)."""
    state = await get_or_recover_portfolio_workflow(run_id)
    if not state:
        raise HTTPException(404, "Workflow run not found")

    wf = _workflows.get(run_id)
    if not wf:
        # Reconstruct workflow for resumption
        wf = PortfolioWorkflow(
            client_id=state.client_id,
            advisor_id=state.advisor_id,
            mandate=state.mandate,
            investment_amount=state.investment_amount,
        )
        wf.run_id = run_id
        wf.state = state
        _workflows[run_id] = wf

    gate = state.gate
    if not gate:
        raise HTTPException(400, "No gate is currently active for this workflow")

    async def resume():
        await wf.resume_after_gate(
            gate=gate,
            approved=request.approved,
            approved_by=request.approved_by,
            notes=request.notes,
            client_profile=request.client_profile,
            run_backtest=request.run_backtest,
        )

    background_tasks.add_task(resume)

    action = "approved" if request.approved else "rejected"
    return {
        "run_id": run_id,
        "status": state.status.value,
        "gate": state.gate.value if state.gate else None,
        "current_step": state.current_step,
        "themes": state.themes,
        "activated_themes": state.activated_themes,
        "market_news": state.market_news,
        "universe_size": len(state.universe),
        "proposal": state.portfolio_proposal,
        "backtest": state.backtest_result,
        "error": state.error,
        "started_at": state.started_at.isoformat(),
        "action": action,
    }


@router.post("/runs/{run_id}/retry", response_model=dict)
async def retry_step(
    run_id: str,
    request: RetryStepRequest,
    background_tasks: BackgroundTasks,
) -> dict[str, Any]:
    """Re-run a specific workflow step (sense or think) without restarting."""
    if request.step not in ("sense", "think"):
        raise HTTPException(400, "step must be 'sense' or 'think'")

    state = await get_or_recover_portfolio_workflow(run_id)
    if not state:
        raise HTTPException(404, "Workflow run not found")

    wf = _workflows.get(run_id)
    if not wf:
        wf = PortfolioWorkflow(
            client_id=state.client_id,
            advisor_id=state.advisor_id,
            mandate=state.mandate,
            investment_amount=state.investment_amount,
        )
        wf.run_id = run_id
        wf.state = state
        _workflows[run_id] = wf

    cp = request.client_profile
    if not cp or not cp.get("risk_tolerance"):
        store = get_cosmos_store()
        cosmos_client = await store.get_client(state.client_id, state.advisor_id)
        if cosmos_client:
            cp = {**cosmos_client, **(cp or {})}
    if not cp:
        cp = {"client_id": state.client_id}

    async def run_retry():
        await wf.retry_step(request.step, client_profile=cp, run_backtest=request.run_backtest)

    background_tasks.add_task(run_retry)
    logger.info("portfolio_retry run_id=%s step=%s", run_id, request.step)
    return {
        "run_id": run_id,
        "status": "running",
        "step": request.step,
        "message": f"Retrying {request.step} step. Poll /runs/{run_id} for status.",
    }


@router.get("/checkpoints", response_model=list)
async def get_pending_checkpoints() -> list[dict[str, Any]]:
    """Get all human-in-the-loop checkpoints pending advisor review."""
    store = get_cosmos_store()
    return await store.get_pending_checkpoints()


@router.delete("/checkpoints/{run_id}", response_model=dict)
async def delete_checkpoint(run_id: str) -> dict[str, Any]:
    """Dismiss/cancel a pending checkpoint (marks it resolved)."""
    store = get_cosmos_store()
    checkpoints = await store.query(
        "checkpoints",
        "SELECT * FROM c WHERE c.workflow_id = @wid AND c.workflow_type = 'portfolio'",
        [{"name": "@wid", "value": run_id}],
    )
    for cp in checkpoints:
        cp["status"] = "dismissed"
        await store.upsert("checkpoints", cp)
    # Mark the portfolio document as rejected so it is excluded from client history
    portfolio = await store.get_portfolio_by_run_id(run_id)
    if portfolio and portfolio.get("status") not in ("approved",):
        portfolio["status"] = "rejected"
        await store.save_portfolio(portfolio)
    # Also mark in-memory workflow as failed so polling stops
    from backend.app.orchestration.portfolio_workflow import _running_workflows
    state = _running_workflows.get(run_id)
    if state:
        from backend.app.orchestration.portfolio_workflow import PortfolioWorkflowStatus
        state.status = PortfolioWorkflowStatus.FAILED
        state.error = "Dismissed by advisor"
    return {"run_id": run_id, "status": "dismissed"}


@router.get("/advisor/{advisor_id}", response_model=list)
async def list_advisor_portfolios(advisor_id: str) -> list[dict[str, Any]]:
    """List all portfolios for an advisor (across all clients)."""
    store = get_cosmos_store()
    return await store.list_portfolios_for_advisor(advisor_id)


@router.post("/{portfolio_id}/monitor", response_model=dict)
async def monitor_portfolio(
    portfolio_id: str,
    client_id: str = Query(...),
) -> dict[str, Any]:
    """
    Run a one-shot monitoring pass on an active portfolio:
    - NewsAgent re-scans for market events relevant to current positions
    - RebalanceAgent checks for drift / threshold triggers
    Returns a monitoring report without side-effects (no auto-trades).
    """
    import asyncio as _asyncio
    store = get_cosmos_store()
    portfolio = await store.get_portfolio(portfolio_id, client_id)
    if not portfolio:
        raise HTTPException(404, "Portfolio not found")

    client = await store.get_client(client_id, portfolio.get("advisor_id", ""))
    client_profile: dict[str, Any] = client or {"client_id": client_id}

    positions = portfolio.get("positions", [])
    tickers = [
        (p.get("symbol") or p.get("ticker") or "").upper()
        for p in positions if (p.get("symbol") or p.get("ticker"))
    ]

    from backend.app.agents.news_agent import NewsAgent
    from backend.app.agents.rebalance_agent import RebalanceAgent

    news_agent = NewsAgent()
    rebalance_agent = RebalanceAgent()

    loop = _asyncio.get_running_loop()

    # Run news scan
    try:
        news_result = await loop.run_in_executor(
            None, news_agent.run_daily_scan, tickers, [], client_profile
        )
    except Exception as exc:
        logger.warning("monitor_news_failed portfolio_id=%s error=%s", portfolio_id, exc)
        news_result = {}

    # Run rebalance check
    target_weights = {
        (p.get("symbol") or p.get("ticker", "")).upper(): p.get("weight", 0)
        for p in positions
    }
    current_portfolio = {
        "positions": positions,
        "target_weights": target_weights,
        "portfolio_id": portfolio_id,
        "mandate": portfolio.get("mandate", "balanced"),
    }
    try:
        rebalance_result = await loop.run_in_executor(
            None,
            rebalance_agent.check_rebalance_triggers,
            current_portfolio,
            {"weights": target_weights},
            None,
        )
    except Exception as exc:
        logger.warning("monitor_rebalance_failed portfolio_id=%s error=%s", portfolio_id, exc)
        rebalance_result = {}

    # Persist monitoring snapshot
    from datetime import datetime, timezone
    snapshot = {
        "monitored_at": datetime.now(timezone.utc).isoformat(),
        "news": news_result,
        "rebalance": rebalance_result,
        "tickers_scanned": tickers,
    }
    portfolio["last_monitored"] = snapshot["monitored_at"]
    portfolio["last_monitor_result"] = snapshot
    await store.save_portfolio(portfolio)

    return snapshot


@router.get("/client/{client_id}", response_model=list)
async def list_client_portfolios(client_id: str) -> list[dict[str, Any]]:
    """List all portfolio proposals for a client."""
    store = get_cosmos_store()
    return await store.list_portfolios_for_client(client_id)


@router.get("/{proposal_id}", response_model=dict)
async def get_portfolio(
    proposal_id: str,
    client_id: str = Query(...),
) -> dict[str, Any]:
    """Get a specific portfolio proposal."""
    store = get_cosmos_store()
    proposal = await store.get_portfolio(proposal_id, client_id)
    if not proposal:
        raise HTTPException(404, "Portfolio proposal not found")
    return proposal


@router.post("/{proposal_id}/approve", response_model=dict)
async def approve_portfolio(
    proposal_id: str,
    request: ApproveProposalRequest,
    client_id: str = Query(...),
) -> dict[str, Any]:
    """Advisor approves a portfolio proposal for execution."""
    store = get_cosmos_store()
    proposal = await store.get_portfolio(proposal_id, client_id)
    if not proposal:
        raise HTTPException(404, "Portfolio proposal not found")

    proposal["status"] = "approved"
    proposal["approved_by"] = request.approved_by
    proposal["approved_at"] = datetime.now(timezone.utc).isoformat()
    proposal["approval_notes"] = request.notes
    await store.save_portfolio(proposal)

    return {"status": "approved", "proposal_id": proposal_id, "approved_by": request.approved_by}


@router.post("/{proposal_id}/reject", response_model=dict)
async def reject_portfolio(
    proposal_id: str,
    request: RejectProposalRequest,
    client_id: str = Query(...),
) -> dict[str, Any]:
    """Advisor rejects a portfolio proposal."""
    store = get_cosmos_store()
    proposal = await store.get_portfolio(proposal_id, client_id)
    if not proposal:
        raise HTTPException(404, "Portfolio proposal not found")

    proposal["status"] = "rejected"
    proposal["rejection_reason"] = request.reason
    proposal["rejected_by"] = request.rejected_by
    await store.save_portfolio(proposal)

    return {"status": "rejected", "proposal_id": proposal_id}


# ── Backtesting ───────────────────────────────────────────────────────────────

class RunBacktestRequest(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    benchmark: str = "SPY"
    scenarios: Optional[list[str]] = None


@router.post("/{portfolio_id}/backtest", response_model=dict)
async def run_backtest(
    portfolio_id: str,
    request: RunBacktestRequest,
    client_id: str = Query(...),
) -> dict[str, Any]:
    """Run full backtesting analysis + scenario analysis on a portfolio."""
    import asyncio as _asyncio
    from datetime import date, timedelta
    from backend.app.agents.backtesting_agent import BacktestingAgent

    store = get_cosmos_store()
    portfolio = await store.get_portfolio(portfolio_id, client_id)
    if not portfolio:
        raise HTTPException(404, "Portfolio not found")

    positions = portfolio.get("positions", [])
    end = request.end_date or date.today().isoformat()
    start = request.start_date or (date.today() - timedelta(days=365 * 3)).isoformat()

    agent = BacktestingAgent()
    loop = _asyncio.get_running_loop()

    backtest = await loop.run_in_executor(
        None,
        agent.analyze_backtest_results,
        positions, {}, start, end,
        float(portfolio.get("investment_amount", 100_000)),
        request.benchmark,
    )
    scenarios = await loop.run_in_executor(
        None,
        agent.generate_scenario_analysis,
        {"positions": positions, "mandate": portfolio.get("mandate", "balanced")},
        request.scenarios,
    )

    result = {
        "portfolio_id": portfolio_id,
        "run_at": datetime.now(timezone.utc).isoformat(),
        "start_date": start,
        "end_date": end,
        "benchmark": request.benchmark,
        "backtest": backtest,
        "scenarios": scenarios,
    }
    # Persist to history (keep last 10) and update latest snapshot
    history: list = portfolio.get("backtest_history", [])
    history.insert(0, result)
    portfolio["backtest_history"] = history[:10]
    portfolio["backtest"] = backtest
    portfolio["last_backtest_run"] = result["run_at"]
    await store.save_portfolio(portfolio)
    return result


@router.get("/{portfolio_id}/backtest-history", response_model=dict)
async def get_backtest_history(
    portfolio_id: str,
    client_id: str = Query(...),
) -> dict[str, Any]:
    """Return all past backtest runs for a portfolio (latest first)."""
    store = get_cosmos_store()
    portfolio = await store.get_portfolio(portfolio_id, client_id)
    if not portfolio:
        raise HTTPException(404, "Portfolio not found")
    history = portfolio.get("backtest_history", [])
    # Strip heavyweight equity-curve data for list view
    summary = [
        {
            "run_at": r.get("run_at"),
            "start_date": r.get("start_date"),
            "end_date": r.get("end_date"),
            "benchmark": r.get("benchmark"),
            "total_return_pct": (r.get("backtest") or {}).get("performance", {}).get("total_return_pct"),
            "sharpe": (r.get("backtest") or {}).get("performance", {}).get("sharpe"),
            "max_drawdown": (r.get("backtest") or {}).get("performance", {}).get("max_drawdown"),
        }
        for r in history
    ]
    return {"portfolio_id": portfolio_id, "runs": summary, "full_history": history}


# ── Rebalance ─────────────────────────────────────────────────────────────────

@router.post("/{portfolio_id}/rebalance", response_model=dict)
async def check_rebalance(
    portfolio_id: str,
    client_id: str = Query(...),
) -> dict[str, Any]:
    """
    Run autonomous rebalance analysis:
    1. News scan for position-specific events
    2. Rebalance trigger check (drift, vol breach, theme degradation)
    Returns proposed trades requiring advisor approval.
    """
    import asyncio as _asyncio
    from backend.app.agents.news_agent import NewsAgent
    from backend.app.agents.rebalance_agent import RebalanceAgent

    store = get_cosmos_store()
    portfolio = await store.get_portfolio(portfolio_id, client_id)
    if not portfolio:
        raise HTTPException(404, "Portfolio not found")

    client = await store.get_client(client_id, portfolio.get("advisor_id", ""))
    client_profile: dict[str, Any] = client or {"client_id": client_id}
    positions = portfolio.get("positions", [])
    tickers = [(p.get("symbol") or p.get("ticker") or "").upper() for p in positions if (p.get("symbol") or p.get("ticker"))]
    target_weights = {(p.get("symbol") or p.get("ticker", "")).upper(): p.get("weight", 0) for p in positions}

    news_agent = NewsAgent()
    rebalance_agent = RebalanceAgent()
    loop = _asyncio.get_running_loop()

    news_result = {}
    try:
        news_result = await loop.run_in_executor(None, news_agent.run_daily_scan, tickers, [], client_profile)
    except Exception as exc:
        logger.warning("rebalance_news_failed portfolio_id=%s error=%s", portfolio_id, exc)

    rebalance_result = {}
    try:
        rebalance_result = await loop.run_in_executor(
            None,
            rebalance_agent.check_rebalance_triggers,
            {"positions": positions, "target_weights": target_weights, "mandate": portfolio.get("mandate", "balanced")},
            {"weights": target_weights},
            {"portfolio_impacts": news_result.get("portfolio_impacts", [])},
        )
    except Exception as exc:
        logger.warning("rebalance_check_failed portfolio_id=%s error=%s", portfolio_id, exc)

    result = {
        "portfolio_id": portfolio_id,
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "news": news_result,
        "rebalance": rebalance_result,
        "tickers": tickers,
    }
    portfolio["last_rebalance_check"] = result["checked_at"]
    portfolio["last_rebalance_result"] = result
    await store.save_portfolio(portfolio)

    import uuid as _uuid
    report = dict(result)
    report["rebalance_id"] = str(_uuid.uuid4())
    report["client_id"] = client_id
    report["advisor_id"] = portfolio.get("advisor_id", "")
    report["created_at"] = result["checked_at"]
    try:
        await store.save_rebalance_report(report)
    except Exception as exc:
        logger.warning("save_rebalance_report_failed portfolio_id=%s error=%s", portfolio_id, exc)

    return result


# ── Rebalance History ─────────────────────────────────────────────────────────

@router.get("/{portfolio_id}/rebalance-history", response_model=dict)
async def rebalance_history(
    portfolio_id: str,
    client_id: str = Query(...),
    limit: int = Query(20, ge=1, le=100),
) -> dict[str, Any]:
    """Return historical rebalance runs for a portfolio from Cosmos."""
    store = get_cosmos_store()
    reports = await store.list_rebalance_reports(client_id, portfolio_id, limit=limit)
    return {"portfolio_id": portfolio_id, "runs": reports}


# ── Portfolio Watch (price-based equity curve) ────────────────────────────────

@router.get("/{portfolio_id}/watch", response_model=dict)
async def portfolio_watch(
    portfolio_id: str,
    client_id: str = Query(...),
) -> dict[str, Any]:
    """
    Return portfolio watch data: positions, last monitor/rebalance results,
    news highlights, and a simulated equity curve since inception.
    The equity curve is LLM-generated from position weights and the current date.
    """
    import asyncio as _asyncio
    from backend.app.agents.backtesting_agent import BacktestingAgent

    store = get_cosmos_store()
    portfolio = await store.get_portfolio(portfolio_id, client_id)
    if not portfolio:
        raise HTTPException(404, "Portfolio not found")

    positions = portfolio.get("positions", [])
    inception_date = portfolio.get("approved_at") or portfolio.get("created_at") or datetime.now(timezone.utc).isoformat()
    investment_amount = float(portfolio.get("investment_amount", 100_000))

    # ── Enrich positions with live prices from yFinance ───────────────────
    positions = await _asyncio.get_running_loop().run_in_executor(
        None, _enrich_positions, positions, inception_date[:10], investment_amount
    )

    # If equity curve not yet computed (or stale), generate it
    existing_curve = portfolio.get("equity_curve")
    curve_age_days = 999
    if existing_curve and portfolio.get("equity_curve_computed_at"):
        from datetime import datetime as _dt
        try:
            computed = _dt.fromisoformat(portfolio["equity_curve_computed_at"].replace("Z", "+00:00"))
            curve_age_days = (datetime.now(timezone.utc) - computed).days
        except Exception:
            pass

    if not existing_curve or curve_age_days >= 1:
        agent = BacktestingAgent()
        loop = _asyncio.get_running_loop()
        try:
            curve_result = await loop.run_in_executor(
                None,
                agent.analyze_backtest_results,
                positions, {}, inception_date[:10], datetime.now(timezone.utc).date().isoformat(),
                float(portfolio.get("investment_amount", 100_000)),
                "SPY",
            )
            portfolio["equity_curve"] = curve_result
            portfolio["equity_curve_computed_at"] = datetime.now(timezone.utc).isoformat()
            await store.save_portfolio(portfolio)
            existing_curve = curve_result
        except Exception as exc:
            logger.warning("watch_curve_failed portfolio_id=%s error=%s", portfolio_id, exc)

    return {
        "portfolio_id": portfolio_id,
        "client_id": client_id,
        "inception_date": inception_date[:10],
        "positions": positions,
        "themes": portfolio.get("themes", []),
        "metrics": portfolio.get("metrics", {}),
        "rationale": portfolio.get("rationale") or portfolio.get("portfolio_rationale", ""),
        "equity_curve": existing_curve or {},
        "last_monitor": portfolio.get("last_monitor_result"),
        "last_rebalance": portfolio.get("last_rebalance_result"),
        "last_monitored_at": portfolio.get("last_monitored"),
        "last_rebalance_at": portfolio.get("last_rebalance_check"),
        "investment_amount": investment_amount,
        "status": portfolio.get("status", ""),
        "mandate": portfolio.get("mandate", "balanced"),
        # Autonomous watch cycle data (populated every 30 min by scheduler)
        "last_watch_snapshot": portfolio.get("last_watch_snapshot"),
        "last_watch_cycle_at": portfolio.get("last_watch_cycle"),
    }


@router.post("/{portfolio_id}/watch-cycle", response_model=dict)
async def run_watch_cycle(
    portfolio_id: str,
    client_id: str = Query(...),
    background_tasks: BackgroundTasks = None,
) -> dict[str, Any]:
    """
    Manually trigger the autonomous 3-agent watch cycle for a portfolio:
    1. NewsAgent     — Bing-grounded news scan for current tickers
    2. MarketRegimeAgent — VIX/ATR/selloff risk classification
    3. RiskAdvisoryAgent — synthesize accumulated intelligence into advisory

    This is the same cycle the background scheduler runs every 30 minutes.
    Returns the new snapshot immediately (runs in-request, not background).
    """
    import asyncio as _asyncio
    from backend.app.orchestration.portfolio_workflow import PortfolioWorkflow

    store = get_cosmos_store()
    portfolio = await store.get_portfolio(portfolio_id, client_id)
    if not portfolio:
        raise HTTPException(404, "Portfolio not found")

    client = await store.get_client(client_id, portfolio.get("advisor_id", ""))
    client_profile: dict[str, Any] = client or {"client_id": client_id}

    wf = PortfolioWorkflow(
        client_id=client_id,
        advisor_id=portfolio.get("advisor_id", ""),
        mandate=portfolio.get("mandate", "balanced"),
        investment_amount=float(portfolio.get("investment_amount", 50_000)),
    )

    snapshot, news_history = await wf.run_watch_cycle(portfolio, client_profile)

    portfolio["last_watch_cycle"] = snapshot["cycle_at"]
    portfolio["last_watch_snapshot"] = snapshot
    portfolio["news_history"] = news_history
    # Keep rolling history of last 20 snapshots for Intel Feed / Market Regime history
    history: list = portfolio.get("watch_snapshots", []) or []
    history.append(snapshot)
    portfolio["watch_snapshots"] = history[-20:]
    await store.save_portfolio(portfolio)

    logger.info("manual_watch_cycle_complete portfolio_id=%s", portfolio_id)
    return snapshot


@router.get("/{portfolio_id}/watch-history", response_model=list)
async def get_watch_history(
    portfolio_id: str,
    client_id: str = Query(...),
) -> list[dict[str, Any]]:
    """Return the rolling history of autonomous watch cycle snapshots (last 20)."""
    store = get_cosmos_store()
    portfolio = await store.get_portfolio(portfolio_id, client_id)
    if not portfolio:
        raise HTTPException(404, "Portfolio not found")
    snapshots = portfolio.get("watch_snapshots", []) or []
    return list(reversed(snapshots))  # most recent first
