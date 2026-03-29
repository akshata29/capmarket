"""
Pydantic models for audit trail, compliance, and agent observability.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Optional
from uuid import uuid4

from pydantic import BaseModel, Field


class AuditEventType(str, Enum):
    # Meeting Intelligence
    MEETING_STARTED = "meeting_started"
    TRANSCRIPT_SEGMENT = "transcript_segment"
    SENTIMENT_COMPUTED = "sentiment_computed"
    RECOMMENDATION_GENERATED = "recommendation_generated"
    RECOMMENDATION_APPROVED = "recommendation_approved"
    RECOMMENDATION_REJECTED = "recommendation_rejected"
    RECORDING_STOPPED = "recording_stopped"
    MEETING_SUMMARIZED = "meeting_summarized"
    PII_REDACTED = "pii_redacted"
    MEETING_ENDED = "meeting_ended"

    # Client Intelligence
    CLIENT_CREATED = "client_created"
    CLIENT_UPDATED = "client_updated"
    RISK_PROFILE_UPDATED = "risk_profile_updated"
    PROFILE_EXTRACTED = "profile_extracted"

    # Portfolio Intelligence
    PORTFOLIO_RUN_STARTED = "portfolio_run_started"
    PORTFOLIO_GATE_REACHED = "portfolio_gate_reached"
    PORTFOLIO_GATE_APPROVED = "portfolio_gate_approved"
    PORTFOLIO_GATE_REJECTED = "portfolio_gate_rejected"
    PORTFOLIO_PROPOSAL_CREATED = "portfolio_proposal_created"
    PORTFOLIO_APPROVED = "portfolio_approved"
    BACKTEST_COMPLETED = "backtest_completed"
    REBALANCE_TRIGGERED = "rebalance_triggered"
    REBALANCE_APPROVED = "rebalance_approved"
    TRADES_EXECUTED = "trades_executed"

    # Advisory Intelligence
    ADVISORY_REQUEST = "advisory_request"
    TAX_STRATEGY_GENERATED = "tax_strategy_generated"
    RELATIONSHIP_INSIGHT_GENERATED = "relationship_insight_generated"

    # Client Service Agent
    CLIENT_QUERY = "client_query"
    CLIENT_RESPONSE_SENT = "client_response_sent"
    DOCUMENT_SHARED = "document_shared"

    # Agent Operations
    AGENT_INVOKED = "agent_invoked"
    AGENT_COMPLETED = "agent_completed"
    AGENT_FAILED = "agent_failed"
    WORKFLOW_CHECKPOINT = "workflow_checkpoint"


class AuditEntry(BaseModel):
    entry_id: str = Field(default_factory=lambda: str(uuid4()))
    event_type: AuditEventType
    session_id: str = ""
    client_id: str = ""
    advisor_id: str = ""
    agent_id: Optional[str] = None
    workflow_id: Optional[str] = None
    user_id: Optional[str] = None
    description: str = ""
    payload: dict[str, Any] = Field(default_factory=dict)
    duration_ms: int = 0
    success: bool = True
    error: Optional[str] = None
    ip_address: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    def model_dump(self, **kwargs) -> dict[str, Any]:
        """Exclude None/empty optional fields so Cosmos docs stay clean."""
        d = super().model_dump(**kwargs)
        return {k: v for k, v in d.items() if v is not None}

    @property
    def partition_key(self) -> str:
        return self.client_id or self.session_id or "system"


class AgentAuditEntry(BaseModel):
    """Detailed per-agent execution record for observability."""
    audit_id: str = Field(default_factory=lambda: str(uuid4()))
    run_id: str
    agent_id: str
    agent_name: str
    model: str = ""
    prompt_preview: str = ""
    response_preview: str = ""
    duration_ms: int = 0
    tokens_prompt: int = 0
    tokens_completion: int = 0
    success: bool = True
    error: str = ""
    metadata: dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
