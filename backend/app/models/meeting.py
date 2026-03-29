"""
Pydantic models for meeting intelligence — transcription, sentiment,
recommendations, summaries, and session management.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Optional
from uuid import uuid4

from pydantic import BaseModel, Field


class SpeakerRole(str, Enum):
    ADVISOR = "advisor"
    CLIENT = "client"
    UNKNOWN = "unknown"


class ComplianceFlag(str, Enum):
    NONE = "none"
    WARNING = "warning"
    CRITICAL = "critical"


class TranscriptSegment(BaseModel):
    segment_id: str = Field(default_factory=lambda: str(uuid4()))
    speaker: SpeakerRole = SpeakerRole.UNKNOWN
    speaker_label: str = ""
    text: str
    start_ms: int = 0
    end_ms: int = 0
    confidence: float = 1.0
    redacted_text: Optional[str] = None  # PII-scrubbed version
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class SentimentScore(BaseModel):
    overall: float = Field(ge=-1.0, le=1.0, description="Overall sentiment -1 to 1")
    investment_readiness: float = Field(ge=0.0, le=1.0, description="0-1 readiness score")
    risk_appetite: float = Field(ge=0.0, le=1.0, description="0=conservative, 1=aggressive")
    engagement: float = Field(ge=0.0, le=1.0)
    compliance_flag: ComplianceFlag = ComplianceFlag.NONE
    compliance_notes: list[str] = Field(default_factory=list)
    key_themes: list[str] = Field(default_factory=list)
    computed_at: datetime = Field(default_factory=datetime.utcnow)


class Recommendation(BaseModel):
    rec_id: str = Field(default_factory=lambda: str(uuid4()))
    category: str  # e.g. "portfolio_rebalance", "tax_strategy", "product_suggestion"
    headline: str
    rationale: str
    risk_alignment: str  # "conservative" | "moderate" | "aggressive"
    confidence: float = Field(ge=0.0, le=1.0)
    compliance_cleared: bool = False
    requires_approval: bool = True
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    notes: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)


class MeetingStatus(str, Enum):
    SCHEDULED = "scheduled"
    ACTIVE = "active"
    PROCESSING = "processing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class MeetingType(str, Enum):
    PROSPECTING = "prospecting"
    ANNUAL_REVIEW = "annual_review"
    PORTFOLIO_REVIEW = "portfolio_review"
    REVIEW = "review"
    PLANNING = "planning"
    ONBOARDING = "onboarding"
    REBALANCE = "rebalance"
    TAX = "tax"
    TAX_PLANNING = "tax_planning"
    AD_HOC = "ad_hoc"
    ADHOC = "adhoc"


class MeetingSession(BaseModel):
    session_id: str = Field(default_factory=lambda: str(uuid4()))
    client_id: str
    advisor_id: str
    meeting_type: MeetingType = MeetingType.REVIEW
    status: MeetingStatus = MeetingStatus.SCHEDULED
    title: str = ""
    notes: str = ""
    scheduled_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    transcript: list[TranscriptSegment] = Field(default_factory=list)
    sentiment: Optional[SentimentScore] = None
    recommendations: list[Recommendation] = Field(default_factory=list)
    extracted_entities: dict[str, Any] = Field(default_factory=dict)
    summary: Optional[str] = None
    advisor_summary: Optional[str] = None
    client_summary: Optional[str] = None
    compliance_summary: Optional[str] = None
    next_actions: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # CosmosDB partition key
    @property
    def partition_key(self) -> str:
        return self.client_id


class StartMeetingRequest(BaseModel):
    client_id: Optional[str] = None   # None or empty → prospective client session
    advisor_id: str
    meeting_type: MeetingType = MeetingType.REVIEW
    title: str = ""
    notes: str = ""
    is_prospective: bool = False


class AudioChunkRequest(BaseModel):
    session_id: str
    audio_base64: str  # base64-encoded PCM audio chunk
    speaker_hint: SpeakerRole = SpeakerRole.UNKNOWN


class ApproveRecommendationRequest(BaseModel):
    approved_by: str
    notes: str = ""


class MeetingSummaryRequest(BaseModel):
    session_id: str
    include_pii: bool = False
