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

from backend.app.agents import AdvisoryAgent, NewsAgent, TaxAgent
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
        self.news = NewsAgent()
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
        logger.info("advisory_prep_start", advisor=self.advisor_id, advisory_id=self.advisory_id)

        async def run_news():
            tickers = [h.get("symbol", "") for h in client_profile.get("holdings", [])]
            themes = client_profile.get("tags", [])
            return await asyncio.get_event_loop().run_in_executor(
                None, self.news.run_daily_scan, tickers, themes, client_profile
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
            "meeting_type": meeting_type,
            "news_briefing": news if not isinstance(news, Exception) else {"error": str(news)},
            "tax_analysis": tax_analysis if not isinstance(tax_analysis, Exception) else {},
            "advisory_briefing": briefing if not isinstance(briefing, Exception) else {},
            "relationship_ideas": relationship if not isinstance(relationship, Exception) else {},
            "prepared_at": datetime.now(timezone.utc).isoformat(),
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
