"""
Advisory Intelligence API Router — pre-meeting prep, tax strategies,
relationship intelligence, and open-ended advisor AI chat.
"""
from __future__ import annotations

import logging
from typing import Any, Optional

from fastapi import APIRouter, Query
from pydantic import BaseModel

from backend.app.orchestration.advisory_workflow import AdvisoryWorkflow
from backend.app.persistence.cosmos_store import get_cosmos_store

router = APIRouter()
logger = logging.getLogger(__name__)


class PreMeetingRequest(BaseModel):
    advisor_id: str
    client_profile: dict[str, Any]
    meeting_type: str = "review"


class TaxStrategyRequest(BaseModel):
    advisor_id: str
    client_profile: dict[str, Any]
    tax_year: int = 2025


class AdvisorChatRequest(BaseModel):
    advisor_id: str
    question: str
    client_profile: Optional[dict[str, Any]] = None
    context: str = ""


class RelationshipIdeasRequest(BaseModel):
    advisor_id: str
    client_profile: dict[str, Any]


@router.post("/pre-meeting", response_model=dict)
async def pre_meeting_briefing(request: PreMeetingRequest) -> dict[str, Any]:
    """
    Generate comprehensive pre-meeting briefing:
    market news, tax opportunities, relationship ideas, talking points.
    """
    wf = AdvisoryWorkflow(advisor_id=request.advisor_id)
    return await wf.run_pre_meeting_prep(
        client_profile=request.client_profile,
        meeting_type=request.meeting_type,
    )


@router.post("/tax-strategies", response_model=dict)
async def generate_tax_strategies(request: TaxStrategyRequest) -> dict[str, Any]:
    """Generate personalized tax optimization strategies for a client."""
    wf = AdvisoryWorkflow(advisor_id=request.advisor_id)
    return await wf.generate_tax_strategies(
        client_profile=request.client_profile,
        tax_year=request.tax_year,
    )


@router.post("/chat", response_model=dict)
async def advisor_ai_chat(request: AdvisorChatRequest) -> dict[str, Any]:
    """
    Open-ended advisor AI assistant — ask any wealth management question.
    Optionally provide client context for personalized answers.
    """
    wf = AdvisoryWorkflow(advisor_id=request.advisor_id)
    return await wf.chat_with_advisor_ai(
        question=request.question,
        client_profile=request.client_profile,
        context=request.context,
    )


@router.post("/relationship-ideas", response_model=dict)
async def relationship_ideas(request: RelationshipIdeasRequest) -> dict[str, Any]:
    """
    Generate relationship deepening ideas based on peer advisor best practices.
    """
    from backend.app.agents.advisory_agent import AdvisoryAgent
    import asyncio

    agent = AdvisoryAgent()
    result = await asyncio.get_event_loop().run_in_executor(
        None,
        agent.generate_relationship_ideas,
        request.client_profile,
        None,
    )
    return result


@router.get("/history", response_model=list)
async def advisory_history(
    advisor_id: str = Query(..., description="Advisor's user ID"),
) -> list[dict[str, Any]]:
    """List all advisory sessions for an advisor."""
    store = get_cosmos_store()
    return await store.list_advisory_sessions(advisor_id)
