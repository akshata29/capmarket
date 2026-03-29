"""
Client Service Workflow — orchestrates the 24/7 team-member agent
that interacts with clients around the clock.

Capabilities:
- Answer portfolio and performance questions
- Surface relevant market news
- Coordinate document requests
- Schedule advisor callbacks
- Escalate to advisor when needed

All interactions logged for full audit trail.
"""
from __future__ import annotations

import asyncio
import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from backend.app.agents import CommunicationAgent, NewsAgent
from backend.app.models.audit import AuditEntry, AuditEventType
from backend.app.persistence.cosmos_store import get_cosmos_store

logger = logging.getLogger(__name__)


class ClientServiceWorkflow:
    """24/7 client service orchestration."""

    def __init__(self, client_id: str, advisor_id: str) -> None:
        self.client_id = client_id
        self.advisor_id = advisor_id
        self.comm_agent = CommunicationAgent()
        self.news_agent = NewsAgent()

    async def handle_client_query(
        self,
        query: str,
        client_profile: dict[str, Any],
        portfolio_snapshot: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """
        Main entry point for client queries.
        Steps: Retrieve history → Classify → Respond → Log → Persist
        """
        turn_id = str(uuid.uuid4())
        store = get_cosmos_store()

        # 1. Load conversation history for context
        history = await store.get_conversation_history(self.client_id, limit=10)

        # 2. Generate response via communication agent
        response = await asyncio.get_event_loop().run_in_executor(
            None,
            self.comm_agent.respond_to_query,
            query,
            client_profile,
            portfolio_snapshot,
            history,
        )

        # 3. If escalation needed, alert advisor
        escalation_data = {}
        if response.get("escalate_to_advisor"):
            escalation_data = await self._create_advisor_alert(
                query=query,
                reason=response.get("escalation_reason", "Client escalation requested"),
                client_profile=client_profile,
            )

        # 4. Persist conversation turn
        turn_doc = {
            "turn_id": turn_id,
            "client_id": self.client_id,
            "advisor_id": self.advisor_id,
            "query": query,
            "response": response.get("response", ""),
            "response_type": response.get("response_type", "information"),
            "escalated": response.get("escalate_to_advisor", False),
            "escalation_reason": response.get("escalation_reason", ""),
            "sentiment": response.get("sentiment", "neutral"),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "metadata": escalation_data,
        }
        await store.save_conversation_turn(turn_doc)

        # 5. Audit log
        event_type = AuditEventType.CLIENT_QUERY
        entry = AuditEntry(
            event_type=event_type,
            client_id=self.client_id,
            advisor_id=self.advisor_id,
            description=f"Client query handled: {query[:80]}",
            payload={"turn_id": turn_id, "response_type": response.get("response_type")},
        )
        await store.log_audit(entry.model_dump())

        return {
            "turn_id": turn_id,
            "response": response.get("response", ""),
            "response_type": response.get("response_type", "information"),
            "action_items": response.get("action_items", []),
            "escalated": response.get("escalate_to_advisor", False),
            "follow_up_needed": response.get("follow_up_needed", False),
        }

    async def get_portfolio_news(
        self,
        client_profile: dict[str, Any],
        portfolio: dict[str, Any],
    ) -> dict[str, Any]:
        """Surface relevant market news for the client's portfolio."""
        tickers = [p.get("symbol", "") for p in portfolio.get("positions", [])]
        themes = [t.get("name", "") for t in portfolio.get("themes", [])]

        result = await asyncio.get_event_loop().run_in_executor(
            None, self.news_agent.run_daily_scan, tickers, themes, client_profile
        )
        news = result if isinstance(result, dict) else {}

        # Explain news in client-friendly language
        if news.get("portfolio_impacts"):
            explanation = await asyncio.get_event_loop().run_in_executor(
                None,
                self.comm_agent.explain_performance_drivers,
                {**portfolio, "recent_news": news.get("portfolio_impacts", [])},
                "week",
            )
            news["client_explanation"] = explanation
        return news

    async def request_document(
        self,
        client_profile: dict[str, Any],
        document_type: str,
        tax_year: int | None = None,
    ) -> dict[str, Any]:
        """Handle document request — coordinate delivery."""
        doc_request = {
            "request_id": str(uuid.uuid4()),
            "client_id": self.client_id,
            "document_type": document_type,
            "tax_year": tax_year,
            "status": "pending",
            "requested_at": datetime.now(timezone.utc).isoformat(),
        }

        # In production: trigger document generation / retrieval workflow
        # For now: create a task for the advisor team
        response_text = (
            f"Your request for {document_type}"
            + (f" ({tax_year})" if tax_year else "")
            + " has been received. Your advisor team will send it to you within 1 business day."
        )

        # Log the request
        store = get_cosmos_store()
        turn_doc = {
            "turn_id": doc_request["request_id"],
            "client_id": self.client_id,
            "advisor_id": self.advisor_id,
            "query": f"Document request: {document_type}",
            "response": response_text,
            "response_type": "action_required",
            "escalated": True,  # Always escalate document requests to advisor
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "metadata": doc_request,
        }
        await store.save_conversation_turn(turn_doc)

        entry = AuditEntry(
            event_type=AuditEventType.DOCUMENT_SHARED,
            client_id=self.client_id,
            advisor_id=self.advisor_id,
            description=f"Document requested: {document_type}",
            payload=doc_request,
        )
        await store.log_audit(entry.model_dump())

        return {"status": "submitted", "request_id": doc_request["request_id"], "message": response_text}

    async def _create_advisor_alert(
        self,
        query: str,
        reason: str,
        client_profile: dict[str, Any],
    ) -> dict[str, Any]:
        """Notify advisor that client escalation is needed."""
        alert = {
            "alert_id": str(uuid.uuid4()),
            "type": "client_escalation",
            "client_id": self.client_id,
            "client_name": f"{client_profile.get('first_name', '')} {client_profile.get('last_name', '')}",
            "reason": reason,
            "query": query,
            "urgency": "normal",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        logger.info("advisor_escalation_created", **alert)
        return alert
