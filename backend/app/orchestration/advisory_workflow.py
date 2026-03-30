"""
Advisory Intelligence Workflow — coordinates pre-meeting preparation,
tax strategy generation, and relationship deepening intelligence.

Runs autonomously on a schedule (nightly) and on-demand (before meetings).
Results stored in Cosmos DB for advisor retrieval.
"""
from __future__ import annotations

import asyncio
import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from backend.app.agents import AdvisoryAgent, TaxAgent
from backend.app.models.audit import AuditEntry, AuditEventType
from backend.app.persistence.cosmos_store import get_cosmos_store

logger = logging.getLogger(__name__)


class AdvisoryWorkflow:
    """
    On-demand advisory intelligence workflow.
    Aggregates market news, tax analysis, and relationship ideas
    into a comprehensive advisor briefing.
    """

    def __init__(self, advisor_id: str) -> None:
        self.advisor_id = advisor_id
        self.advisory_id = str(uuid.uuid4())
        self.advisory = AdvisoryAgent()
        self.news = None  # kept for pre-meeting path; populated lazily
        self.tax = TaxAgent()

    async def run_pre_meeting_prep(
        self,
        client_profile: dict[str, Any],
        meeting_type: str = "review",
    ) -> dict[str, Any]:
        """
        Full pre-meeting preparation workflow.
        Runs: News scan, Tax analysis, Relationship ideas — in parallel.
        """
        logger.info("advisory_prep_start advisor=%s advisory_id=%s", self.advisor_id, self.advisory_id)

        async def run_news():
            from backend.app.agents import NewsAgent
            news_agent = NewsAgent()
            tickers = [h.get("symbol", "") for h in client_profile.get("holdings", [])]
            themes = client_profile.get("tags", [])
            return await asyncio.get_event_loop().run_in_executor(
                None, news_agent.run_daily_scan, tickers, themes, client_profile
            )

        async def run_tax():
            return await asyncio.get_event_loop().run_in_executor(
                None,
                self.tax.analyze_tax_situation,
                client_profile,
                None,
            )

        async def run_advisory():
            return await asyncio.get_event_loop().run_in_executor(
                None,
                self.advisory.prepare_briefing,
                client_profile,
                f"Meeting type: {meeting_type}",
                meeting_type,
            )

        async def run_relationship():
            return await asyncio.get_event_loop().run_in_executor(
                None,
                self.advisory.generate_relationship_ideas,
                client_profile,
                None,
            )

        news, tax_analysis, briefing, relationship = await asyncio.gather(
            run_news(),
            run_tax(),
            run_advisory(),
            run_relationship(),
            return_exceptions=True,
        )

        result = {
            "advisory_id": self.advisory_id,
            "advisor_id": self.advisor_id,
            "client_id": client_profile.get("client_id", ""),
            "type": "pre_meeting",
            "meeting_type": meeting_type,
            "news_briefing": news if not isinstance(news, Exception) else {"error": str(news)},
            "tax_analysis": tax_analysis if not isinstance(tax_analysis, Exception) else {},
            "advisory_briefing": briefing if not isinstance(briefing, Exception) else {},
            "relationship_ideas": relationship if not isinstance(relationship, Exception) else {},
            "prepared_at": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        # Persist to Cosmos
        store = get_cosmos_store()
        await store.save_advisory_session(result)

        # Log audit
        entry = AuditEntry(
            event_type=AuditEventType.ADVISORY_REQUEST,
            advisor_id=self.advisor_id,
            client_id=client_profile.get("client_id", ""),
            description="Pre-meeting advisory briefing generated",
            payload={"meeting_type": meeting_type, "advisory_id": self.advisory_id},
        )
        await store.log_audit(entry.model_dump())

        return result

    async def run_position_briefing(
        self,
        client_profile: dict[str, Any],
        timeframe_days: int = 7,
    ) -> dict[str, Any]:
        """
        Weekly Position Briefing: reads accumulated watch-cycle snapshots
        (news + market regime) already stored in Cosmos by the 30-min scheduler,
        then synthesizes them into a position-level brief and professional client email.
        No live agent calls are made for data collection — we use what we already have.
        """
        logger.info("position_briefing_start advisor=%s advisory_id=%s days=%d", self.advisor_id, self.advisory_id, timeframe_days)

        client_id = client_profile.get("client_id", "")
        client_name = f"{client_profile.get('first_name', '')} {client_profile.get('last_name', '')}".strip() or "Client"
        holdings = client_profile.get("holdings", [])

        # ── Pull accumulated watch snapshots from Cosmos ──────────────────────
        store = get_cosmos_store()
        portfolios = await store.list_portfolios_for_client(client_id)

        # Collect all watch snapshots across portfolios within the timeframe window
        cutoff = datetime.now(timezone.utc).timestamp() - (timeframe_days * 86400)
        accumulated_snapshots: list[dict[str, Any]] = []
        latest_regime: dict[str, Any] = {}
        for portfolio in portfolios:
            snaps: list[dict[str, Any]] = portfolio.get("watch_snapshots", []) or []
            for snap in snaps:
                try:
                    snap_ts = datetime.fromisoformat(snap["cycle_at"]).timestamp()
                    if snap_ts >= cutoff:
                        accumulated_snapshots.append(snap)
                        # Track the most recent regime across all snapshots
                        if not latest_regime or snap_ts > datetime.fromisoformat(
                            accumulated_snapshots[0]["cycle_at"]
                        ).timestamp():
                            if snap.get("regime"):
                                latest_regime = snap["regime"]
                except (KeyError, ValueError):
                    continue
            # Also grab the very latest snapshot even if snapshots array is sparse
            last = portfolio.get("last_watch_snapshot")
            if last and last not in accumulated_snapshots:
                accumulated_snapshots.append(last)
                if last.get("regime"):
                    latest_regime = last["regime"]

        # Sort chronologically
        accumulated_snapshots.sort(key=lambda s: s.get("cycle_at", ""))

        snapshot_count = len(accumulated_snapshots)
        logger.info("position_briefing_snapshots advisor=%s snapshots=%d days=%d",
                    self.advisor_id, snapshot_count, timeframe_days)

        # Condense news items from all snapshots to avoid an oversized prompt
        news_summary: list[dict[str, Any]] = []
        for snap in accumulated_snapshots:
            news = snap.get("news", {})
            if not isinstance(news, dict):
                continue
            cycle_at = snap.get("cycle_at", "")
            for alert in news.get("critical_alerts", []):
                news_summary.append({"level": "critical", "item": alert, "at": cycle_at})
            for item in news.get("high_priority", []):
                news_summary.append({"level": "high", "item": item, "at": cycle_at})
            for impact in news.get("portfolio_impacts", []):
                news_summary.append({"level": "portfolio", "item": impact, "at": cycle_at})

        regime_snapshots = [
            {"regime": s.get("regime", {}), "at": s.get("cycle_at", "")}
            for s in accumulated_snapshots
            if s.get("regime")
        ]

        briefing_prompt = f"""You are a senior portfolio strategist. Analyze the following accumulated data
captured by automated scanners over the past {timeframe_days} day(s) and produce a WEEKLY POSITION BRIEFING.

CLIENT: {client_name} | Risk: {client_profile.get('risk_tolerance', 'moderate')}
HOLDINGS: {holdings}
Data window: {timeframe_days} day(s) | Scan snapshots analyzed: {snapshot_count}

ACCUMULATED INTEL ({snapshot_count} scan cycles):
{news_summary}

MARKET REGIME HISTORY ({len(regime_snapshots)} readings):
{regime_snapshots}

CURRENT REGIME (most recent):
{latest_regime}

Generate a weekly position briefing covering:
1. Which holdings are exposed to the news/regime developments captured this week
2. Any risks or opportunities that emerged across the week's scans
3. Suggested advisor talk tracks for each at-risk position
4. Overall portfolio stance recommendation given the week's regime arc
5. Priority action items for the advisor

Respond ONLY with valid JSON:
{{
  "regime_summary": "one-line current regime overview",
  "week_narrative": "2-3 sentence summary of the week's market story arc",
  "portfolio_stance": "DEFENSIVE | NEUTRAL | OPPORTUNISTIC",
  "at_risk_positions": [
    {{"ticker": "", "risk": "", "talk_track": "", "urgency": "immediate|today|this_week"}}
  ],
  "opportunity_positions": [
    {{"ticker": "", "opportunity": "", "rationale": ""}}
  ],
  "key_themes": [],
  "priority_actions": [],
  "overall_narrative": "",
  "scan_cycles_used": {snapshot_count}
}}"""

        briefing = await asyncio.get_event_loop().run_in_executor(
            None, self.advisory.run, briefing_prompt
        )
        briefing_data = briefing if not isinstance(briefing, Exception) else {}

        # ── Fallback: if no snapshots exist yet, surface a clear message ─────
        if snapshot_count == 0:
            briefing_data = {
                "regime_summary": "No watch cycle data available yet",
                "week_narrative": f"No scheduled scan data found for this client's portfolios in the past {timeframe_days} days. The 30-minute watch scheduler needs at least one approved portfolio to accumulate snapshots.",
                "portfolio_stance": "NEUTRAL",
                "at_risk_positions": [],
                "opportunity_positions": [],
                "key_themes": [],
                "priority_actions": ["Ensure the client has an approved portfolio so the watch scheduler can start accumulating snapshots."],
                "overall_narrative": "Insufficient data — check portfolio approval status.",
                "scan_cycles_used": 0,
            }

        # ── Generate professional client email ──────────────────────────────
        email_prompt = f"""You are a senior wealth advisor drafting a professional weekly portfolio update email to a client.

ADVISOR CONTEXT:
- Client: {client_name}
- Risk profile: {client_profile.get('risk_tolerance', 'moderate')}
- Holdings: {[h.get('symbol', '') for h in holdings]}

POSITION BRIEFING SUMMARY (from {snapshot_count} automated scan cycles over {timeframe_days} days):
{briefing_data}

CURRENT MARKET REGIME:
{latest_regime}

WRITE a professional, warm, client-facing email that:
1. Opens with a friendly but professional salutation
2. Provides a plain-English summary of this week's market environment (no jargon)
3. Explains how it relates to the client's specific portfolio — mention tickers by name where relevant
4. Highlights any action items or decisions needed from the client (if any)
5. Closes with an offer to discuss and a professional sign-off

Tone: Confident, warm, clear. No speculation. No specific buy/sell recommendations. Reassuring where appropriate.
Length: 250-400 words.

Return ONLY valid JSON — do NOT wrap in markdown code blocks:
{{
  "subject": "Your Weekly Portfolio Update — [date]",
  "body": "Full email body with \\n for line breaks",
  "key_points": ["bullet point summaries for advisor quick-review"]
}}"""

        email_result = await asyncio.get_event_loop().run_in_executor(
            None, self.advisory.run, email_prompt
        )
        email_data = email_result if not isinstance(email_result, Exception) else {}

        result = {
            "advisory_id": self.advisory_id,
            "advisor_id": self.advisor_id,
            "client_id": client_id,
            "type": "position_briefing",
            "timeframe_days": timeframe_days,
            "scan_cycles_used": snapshot_count,
            "intel_feed": news_summary,
            "market_regime": latest_regime,
            "regime_history": regime_snapshots,
            "position_briefing": briefing_data,
            "client_email": email_data,
            "prepared_at": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        await store.save_advisory_session(result)

        entry = AuditEntry(
            event_type=AuditEventType.ADVISORY_REQUEST,
            advisor_id=self.advisor_id,
            client_id=client_id,
            description=f"Position briefing generated from {snapshot_count} Cosmos snapshots ({timeframe_days}-day window)",
            payload={"advisory_id": self.advisory_id, "timeframe_days": timeframe_days, "scan_cycles_used": snapshot_count},
        )
        await store.log_audit(entry.model_dump())

        return result

    async def generate_relationship_ideas(
        self,
        client_profile: dict[str, Any],
    ) -> dict[str, Any]:
        """Generate relationship deepening ideas and persist to Cosmos."""
        from backend.app.agents.advisory_agent import AdvisoryAgent
        agent = AdvisoryAgent()
        result = await asyncio.get_event_loop().run_in_executor(
            None,
            agent.generate_relationship_ideas,
            client_profile,
            None,
        )

        client_id = client_profile.get("client_id", client_profile.get("id", ""))
        doc = {
            "advisory_id": self.advisory_id,
            "advisor_id": self.advisor_id,
            "client_id": client_id,
            "type": "relationship_ideas",
            "result": result,
            "prepared_at": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        # merge top-level ideas into doc for easy history rendering
        if isinstance(result, dict):
            doc["ideas"] = result.get("ideas", [])
            doc["priority_sequence"] = result.get("priority_sequence", [])

        store = get_cosmos_store()
        await store.save_advisory_session(doc)

        entry = AuditEntry(
            event_type=AuditEventType.ADVISORY_REQUEST,
            advisor_id=self.advisor_id,
            client_id=str(client_id),
            description="Relationship deepening ideas generated",
        )
        await store.log_audit(entry.model_dump())
        return doc

    async def generate_tax_strategies(
        self,
        client_profile: dict[str, Any],
        tax_year: int = 2025,
    ) -> dict[str, Any]:
        """Generate focused tax strategy report for the client."""
        result = await asyncio.get_event_loop().run_in_executor(
            None,
            self.advisory.generate_tax_strategies,
            client_profile,
            tax_year,
        )

        advisory_doc = {
            "advisory_id": str(uuid.uuid4()),
            "advisor_id": self.advisor_id,
            "client_id": client_profile.get("client_id", ""),
            "type": "tax_strategies",
            "tax_year": tax_year,
            "result": result,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        store = get_cosmos_store()
        await store.save_advisory_session(advisory_doc)

        entry = AuditEntry(
            event_type=AuditEventType.TAX_STRATEGY_GENERATED,
            advisor_id=self.advisor_id,
            client_id=client_profile.get("client_id", ""),
            description=f"Tax strategies generated for {tax_year}",
        )
        await store.log_audit(entry.model_dump())
        return result

    async def chat_with_advisor_ai(
        self,
        question: str,
        client_profile: dict[str, Any] | None = None,
        context: str = "",
    ) -> dict[str, Any]:
        """
        Free-form advisor question answering — the 'advisor team member' capability.
        Ask anything: market conditions, strategy ideas, client-specific questions.
        """
        prompt_context = ""
        if client_profile:
            prompt_context = f"Client context: {client_profile}\n"
        if context:
            prompt_context += f"Additional context: {context}\n"

        full_prompt = f"""{prompt_context}
Advisor Question: {question}

Provide a comprehensive, actionable answer for the advisor.
Include market data where relevant. Return JSON:
{{
  "answer": "...",
  "supporting_evidence": [],
  "action_items": [],
  "caveats": [],
  "sources": []
}}"""
        result = await asyncio.get_event_loop().run_in_executor(
            None, self.advisory.run, full_prompt
        )

        # Log the advisor query
        entry = AuditEntry(
            event_type=AuditEventType.ADVISORY_REQUEST,
            advisor_id=self.advisor_id,
            client_id=client_profile.get("client_id", "") if client_profile else "",
            description=f"Advisor AI query: {question[:100]}",
            payload={"question": question},
        )
        store = get_cosmos_store()
        await store.log_audit(entry.model_dump())
        return result
