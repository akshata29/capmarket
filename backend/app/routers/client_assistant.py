"""
Client Service Agent API Router — 24/7 team-member agent for clients.

Endpoints:
  POST   /api/assistant/query           Ask a question (client-facing)
  POST   /api/assistant/news            Get portfolio-relevant news
  POST   /api/assistant/document        Request a document
  GET    /api/assistant/history/{cid}   Conversation history
  POST   /api/assistant/performance     Explain performance drivers
"""
from __future__ import annotations

import logging
from typing import Any, Optional

from fastapi import APIRouter, Query
from pydantic import BaseModel

from backend.app.orchestration.client_service_workflow import ClientServiceWorkflow
from backend.app.persistence.cosmos_store import get_cosmos_store

router = APIRouter()
logger = logging.getLogger(__name__)


class ClientQueryRequest(BaseModel):
    client_id: str
    advisor_id: str
    query: str
    client_profile: dict[str, Any]
    portfolio_snapshot: Optional[dict[str, Any]] = None


class NewsRequest(BaseModel):
    client_id: str
    advisor_id: str
    client_profile: dict[str, Any]
    portfolio: dict[str, Any]


class DocumentRequest(BaseModel):
    client_id: str
    advisor_id: str
    client_profile: dict[str, Any]
    document_type: str  # "tax_1099", "statement_q1", "performance_report", etc.
    tax_year: Optional[int] = None


class PerformanceRequest(BaseModel):
    client_id: str
    advisor_id: str
    portfolio: dict[str, Any]
    time_period: str = "month"


@router.post("/query", response_model=dict)
async def client_query(request: ClientQueryRequest) -> dict[str, Any]:
    """
    Handle a client question via the 24/7 team-member agent.
    Returns AI-generated compliant response with escalation detection.
    """
    wf = ClientServiceWorkflow(
        client_id=request.client_id,
        advisor_id=request.advisor_id,
    )
    return await wf.handle_client_query(
        query=request.query,
        client_profile=request.client_profile,
        portfolio_snapshot=request.portfolio_snapshot,
    )


@router.post("/news", response_model=dict)
async def portfolio_news(request: NewsRequest) -> dict[str, Any]:
    """Surface relevant market news for the client's portfolio."""
    wf = ClientServiceWorkflow(
        client_id=request.client_id,
        advisor_id=request.advisor_id,
    )
    return await wf.get_portfolio_news(
        client_profile=request.client_profile,
        portfolio=request.portfolio,
    )


@router.post("/document", response_model=dict)
async def request_document(request: DocumentRequest) -> dict[str, Any]:
    """Client requests a document (tax forms, statements, performance reports)."""
    wf = ClientServiceWorkflow(
        client_id=request.client_id,
        advisor_id=request.advisor_id,
    )
    return await wf.request_document(
        client_profile=request.client_profile,
        document_type=request.document_type,
        tax_year=request.tax_year,
    )


@router.get("/history/{client_id}", response_model=list)
async def conversation_history(
    client_id: str,
    limit: int = Query(default=20, le=100),
) -> list[dict[str, Any]]:
    """Get conversation history for a client."""
    store = get_cosmos_store()
    return await store.get_conversation_history(client_id, limit=limit)


@router.post("/performance", response_model=dict)
async def explain_performance(request: PerformanceRequest) -> dict[str, Any]:
    """Explain portfolio performance drivers in plain language."""
    from backend.app.agents.communication_agent import CommunicationAgent
    import asyncio

    agent = CommunicationAgent()
    result = await asyncio.get_event_loop().run_in_executor(
        None,
        agent.explain_performance_drivers,
        request.portfolio,
        request.time_period,
    )
    return result
