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


class PositionBriefingRequest(BaseModel):
    advisor_id: str
    client_profile: dict[str, Any]
    timeframe_days: int = 7


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


@router.post("/position-briefing", response_model=dict)
async def position_briefing(request: PositionBriefingRequest) -> dict[str, Any]:
    """
    Generate a Position Briefing: synthesizes Intel Feed, Market Regime,
    and current portfolio standings into an advisor-ready position brief.
    """
    wf = AdvisoryWorkflow(advisor_id=request.advisor_id)
    return await wf.run_position_briefing(
        client_profile=request.client_profile,
        timeframe_days=request.timeframe_days,
    )


@router.post("/relationship-ideas", response_model=dict)
async def relationship_ideas(request: RelationshipIdeasRequest) -> dict[str, Any]:
    """
    Generate relationship deepening ideas based on peer advisor best practices.
    Persists to Cosmos for historical retrieval.
    """
    wf = AdvisoryWorkflow(advisor_id=request.advisor_id)
    return await wf.generate_relationship_ideas(
        client_profile=request.client_profile,
    )


@router.get("/history", response_model=list)
async def advisory_history(
    advisor_id: str = Query(..., description="Advisor's user ID"),
    client_id: Optional[str] = Query(None, description="Filter by client ID"),
    briefing_type: Optional[str] = Query(None, description="Filter by type: pre_meeting, position_briefing, tax_strategies"),
) -> list[dict[str, Any]]:
    """List advisory briefing history for an advisor, optionally filtered by client and type."""
    store = get_cosmos_store()
    return await store.list_briefings(advisor_id=advisor_id, client_id=client_id, briefing_type=briefing_type)
