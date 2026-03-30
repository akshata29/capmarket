"""
Meeting Intelligence Orchestration Workflow — Microsoft Agent Framework (MAF)

Coordinates the full pipeline for an advisor-client meeting:

  Pre-Meeting:  [News] → [Advisory Briefing]
  During:       [Transcription] → [PII] → [Sentiment] → [Profile Update]
                                       ↘ [Recommendation] (real-time)
  Post-Meeting: [Summary] → GATE: Advisor Review → Persist

Human-in-the-loop gates:
  GATE-1: Advisor approves/amends recommendations before presenting to client
  GATE-2: Advisor reviews and approves the meeting summary

All state persisted to Cosmos DB for compliance and replay.
"""
from __future__ import annotations

import asyncio
import logging
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional

from backend.app.agents import (
    AdvisoryAgent,
    NewsAgent,
    PIIAgent,
    ProfileAgent,
    RecommendationAgent,
    SentimentAgent,
    SummaryAgent,
    TranscriptionAgent,
)
from backend.app.models.audit import AuditEntry, AuditEventType
from backend.app.models.meeting import (
    MeetingSession,
    MeetingStatus,
    Recommendation,
    SentimentScore,
    SpeakerRole,
    TranscriptSegment,
)
from backend.app.persistence.cosmos_store import get_cosmos_store

logger = logging.getLogger(__name__)


class MeetingGate(str, Enum):
    RECOMMENDATION_REVIEW = "recommendation_review"
    SUMMARY_REVIEW = "summary_review"


class MeetingWorkflowStatus(str, Enum):
    ACTIVE = "active"
    AWAITING_APPROVAL = "awaiting_approval"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class MeetingWorkflowState:
    session_id: str
    client_id: str
    advisor_id: str
    status: MeetingWorkflowStatus = MeetingWorkflowStatus.ACTIVE
    transcript_buffer: list[str] = field(default_factory=list)
    full_transcript: str = ""
    piied_transcript: str = ""
    sentiment: dict[str, Any] = field(default_factory=dict)
    profile_extractions: dict[str, Any] = field(default_factory=dict)
    recommendations: list[dict[str, Any]] = field(default_factory=list)
    approved_recommendations: list[dict[str, Any]] = field(default_factory=list)
    summary: dict[str, Any] = field(default_factory=dict)
    pre_meeting_briefing: dict[str, Any] = field(default_factory=dict)
    gate: Optional[MeetingGate] = None
    started_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None


# In-memory workflow state registry (Cosmos DB is source of truth)
_active_workflows: dict[str, MeetingWorkflowState] = {}


async def _log_event(
    event_type: AuditEventType,
    session_id: str,
    client_id: str,
    advisor_id: str,
    description: str,
    payload: dict[str, Any] | None = None,
) -> None:
    entry = AuditEntry(
        event_type=event_type,
        session_id=session_id,
        client_id=client_id,
        advisor_id=advisor_id,
        description=description,
        payload=payload or {},
    )
    try:
        store = get_cosmos_store()
        await store.log_audit(entry.model_dump())
    except Exception as exc:
        logger.warning("audit_log_failed error=%s", exc)


async def _apply_extractions_to_client(
    store: Any,
    client_id: str,
    advisor_id: str,
    extractions: dict[str, Any],
    session_id: str,
) -> None:
    """
    Merge profile_extractions from a completed meeting into the stored client record.

    Called automatically by complete_meeting() so that:
    - Prospects promoted mid-meeting (linked_client_id) get their name/financials
      updated with the richer post-meeting full extraction.
    - Real (non-prospect) clients have their CRM data enriched after each meeting.

    All updates are additive/upsert — existing non-zero values are never overwritten
    unless the client is still named "Unknown Prospect" (a sentinel indicating the
    record was created before the extraction had run).
    """
    client = await store.get_client(client_id, advisor_id)
    if not client:
        logger.warning(
            "apply_extractions_no_client client=%s session=%s", client_id, session_id
        )
        return

    personal  = extractions.get("extracted_personal",  {}) or {}
    financial = extractions.get("extracted_financial", {}) or {}
    risk_data = extractions.get("extracted_risk",      {}) or {}

    def _f(d: dict, *keys: str) -> float:
        """
        Extract a float from a dict by trying multiple key names.
        Handles nested dicts (takes the 'total' or first numeric child),
        string values with $/, separators, and numeric values directly.
        """
        def _coerce(v: Any) -> float:
            if isinstance(v, (int, float)):
                return float(v)
            if isinstance(v, dict):
                # e.g. {"total": 608000, "breakdown": {...}}
                for sub_k in ("total", "value", "amount", "balance"):
                    sv = v.get(sub_k)
                    if sv is not None:
                        try:
                            return float(str(sv).replace(",", "").replace("$", "").strip())
                        except (ValueError, TypeError):
                            pass
                # fallback: first numeric value in the dict
                for sv in v.values():
                    if isinstance(sv, (int, float)):
                        return float(sv)
            if isinstance(v, str):
                cleaned = v.replace(",", "").replace("$", "").replace("K", "000").strip()
                # strip trailing unit labels like "M" → multiply by 1M
                if cleaned.endswith("M"):
                    try:
                        return float(cleaned[:-1]) * 1_000_000
                    except ValueError:
                        pass
                try:
                    return float(cleaned)
                except ValueError:
                    pass
            return 0.0

        for k in keys:
            v = d.get(k)
            if v is not None:
                result = _coerce(v)
                if result:
                    return result
        return 0.0

    changed = False

    # ── Name: repair "Unknown Prospect" sentinel from failed/empty extraction ──
    is_unknown = (
        client.get("first_name", "").lower() in ("", "unknown")
        and client.get("last_name", "").lower() in ("", "prospect")
    )
    if is_unknown:
        full_name = (
            personal.get("name") or personal.get("full_name") or
            personal.get("client_name") or personal.get("display_name") or ""
        )
        name_parts = full_name.split() if isinstance(full_name, str) and full_name else []
        ai_first = personal.get("first_name") or (name_parts[0] if name_parts else "")
        ai_last  = personal.get("last_name") or (" ".join(name_parts[1:]) if len(name_parts) > 1 else "")
        if ai_first:
            client["first_name"] = ai_first
            changed = True
        if ai_last:
            client["last_name"] = ai_last
            changed = True

    # ── Contact (only fill-in blanks) ────────────────────────────────────────
    if not client.get("email"):
        v = personal.get("email") or personal.get("email_address", "")
        if v:
            client["email"] = v
            changed = True
    if not client.get("phone"):
        v = personal.get("phone") or personal.get("phone_number", "")
        if v:
            client["phone"] = v
            changed = True

    # ── Demographics ──────────────────────────────────────────────────────────
    if not client.get("age"):
        v = personal.get("age")
        if v:
            try:
                client["age"] = int(str(v))
                changed = True
            except (ValueError, TypeError):
                pass
    if not client.get("spouse_name") and personal.get("spouse_name"):
        client["spouse_name"] = personal["spouse_name"]
        changed = True
    if not client.get("spouse_age") and personal.get("spouse_age"):
        try:
            client["spouse_age"] = int(str(personal["spouse_age"]))
            changed = True
        except (ValueError, TypeError):
            pass

    # ── Financial figures (zero = missing; update from extraction) ────────────
    fin_fields = [
        ("annual_income",     ("annual_income", "income", "salary", "annual_salary",
                               "gross_income", "employment_income", "combined_income",
                               "total_income", "household_income", "joint_income")),
        ("net_worth",         ("net_worth", "total_net_worth", "estimated_net_worth",
                               "total_wealth", "total_assets_minus_liabilities")),
        ("investable_assets", ("investable_assets", "aum", "liquid_assets",
                               "retirement_assets", "investment_assets", "total_investments",
                               "total_retirement", "retirement_accounts", "retirement_savings",
                               "total_401k", "total_403b", "403b_total", "401k_total",
                               "total_savings", "total_portfolio")),
        ("monthly_expenses",  ("monthly_expenses", "expenses", "monthly_spending",
                               "living_expenses", "total_monthly_expenses",
                               "monthly_living_expenses", "combined_monthly_expenses")),
        ("household_income",  ("household_income", "total_income", "joint_income",
                               "combined_income", "combined_salary")),
    ]
    for field, keys in fin_fields:
        if not client.get(field):
            v = _f(financial, *keys)
            if v:
                client[field] = v
                changed = True
    # Keep aum alias in sync
    if not client.get("aum") and client.get("investable_assets"):
        client["aum"] = client["investable_assets"]
        changed = True

    # ── Risk tolerance (only if not yet set) ──────────────────────────────────
    if risk_data.get("tolerance"):
        rp = client.setdefault("risk_profile", {})
        if not rp.get("tolerance") or rp.get("tolerance") == "moderate":
            rp["tolerance"] = risk_data["tolerance"]
            changed = True

    # ── Goals, concerns, life-events, action items (additive merge) ───────────
    if extractions.get("extracted_concerns"):
        existing = set(client.get("extracted_concerns", []))
        before = len(existing)
        existing.update(str(c) for c in extractions["extracted_concerns"])
        if len(existing) != before:
            client["extracted_concerns"] = list(existing)
            changed = True

    if extractions.get("extracted_life_events"):
        # Preserve dicts (rich objects); convert only plain non-dict items to str
        # so the frontend can render them as structured cards, not raw repr strings.
        existing_events: list = client.get("extracted_life_events") or []
        existing_keys = {
            (e.get("event", "") if isinstance(e, dict) else str(e))
            for e in existing_events
        }
        for e in extractions["extracted_life_events"]:
            key = e.get("event", "") if isinstance(e, dict) else str(e)
            if key not in existing_keys:
                existing_events.append(e)
                existing_keys.add(key)
                changed = True
        if changed:
            client["extracted_life_events"] = existing_events

    if extractions.get("key_action_items"):
        existing = set(client.get("next_actions", []))
        before = len(existing)
        existing.update(
            a if isinstance(a, str) else str(a.get("action", a))
            for a in extractions["key_action_items"]
        )
        if len(existing) != before:
            client["next_actions"] = list(existing)
            changed = True

    if extractions.get("extracted_goals"):
        existing_goals: list[dict] = client.get("goals") or []
        existing_names = {g.get("name", "") for g in existing_goals}
        for raw in extractions["extracted_goals"]:
            name = raw.get("name", str(raw)) if isinstance(raw, dict) else str(raw)
            if name not in existing_names:
                existing_goals.append(raw if isinstance(raw, dict) else {"name": name[:120], "goal_type": "custom", "priority": 1})
                existing_names.add(name)
                changed = True
        if changed:
            client["goals"] = existing_goals

    # Store the raw financial extraction in metadata for display-time back-fill
    meta = client.setdefault("metadata", {})
    if financial and not meta.get("extracted_financial"):
        meta["extracted_financial"] = financial
        changed = True

    if changed:
        client["last_meeting_at"] = datetime.now(timezone.utc).isoformat()
        client["updated_at"] = datetime.now(timezone.utc).isoformat()
        await store.save_client(client)
        logger.info(
            "client_profile_updated_from_meeting client=%s session=%s",
            client_id, session_id,
        )


class MeetingWorkflow:
    """
    Orchestrates all agents for the meeting intelligence lifecycle.
    Create one instance per meeting session.
    """

    def __init__(self, session_id: str, client_id: str, advisor_id: str) -> None:
        self.session_id = session_id
        self.client_id = client_id
        self.advisor_id = advisor_id
        self.state = MeetingWorkflowState(
            session_id=session_id,
            client_id=client_id,
            advisor_id=advisor_id,
        )
        _active_workflows[session_id] = self.state

        # Initialize agents
        self.transcription = TranscriptionAgent()
        self.pii = PIIAgent()
        self.sentiment = SentimentAgent()
        self.profile = ProfileAgent()
        self.recommendation = RecommendationAgent()
        self.summary = SummaryAgent()
        self.advisory = AdvisoryAgent()
        self.news = NewsAgent()

    async def run_pre_meeting_briefing(
        self, client_profile: dict[str, Any]
    ) -> dict[str, Any]:
        """
        Step A: Gather market intelligence and advisory prep before the meeting.
        Runs concurrently: News scan + Advisory briefing
        """
        logger.info("pre_meeting_briefing_start session=%s", self.session_id)

        async def run_news():
            tickers = [
                h.get("symbol", "") for h in client_profile.get("holdings", [])
            ]
            themes = client_profile.get("tags", [])
            return await asyncio.get_event_loop().run_in_executor(
                None, self.news.run_daily_scan, tickers, themes, client_profile
            )

        async def run_advisory():
            return await asyncio.get_event_loop().run_in_executor(
                None,
                self.advisory.prepare_briefing,
                client_profile,
                "",
                "review",
            )

        news_result, advisory_result = await asyncio.gather(
            run_news(), run_advisory(), return_exceptions=True
        )

        briefing = {
            "news": news_result if not isinstance(news_result, Exception) else {},
            "advisory": advisory_result if not isinstance(advisory_result, Exception) else {},
            "prepared_at": datetime.now(timezone.utc).isoformat(),
        }
        self.state.pre_meeting_briefing = briefing

        await _log_event(
            AuditEventType.ADVISORY_REQUEST,
            self.session_id,
            self.client_id,
            self.advisor_id,
            "Pre-meeting briefing generated",
            {"topics": list(briefing.keys())},
        )
        return briefing

    async def process_transcript_chunk(
        self,
        raw_text: str,
        speaker_hint: str = "unknown",
        client_profile: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """
        Real-time processing pipeline for each transcript chunk:
        Text → PII Redaction → Sentiment Update → Profile Extraction
        """
        # 1. PII Redaction (always first)
        pii_result = await asyncio.get_running_loop().run_in_executor(
            None, self.pii.redact, raw_text
        )
        clean_text = pii_result.get("redacted_text", raw_text)

        # 2. Append to buffers.
        #    full_transcript = RAW — used everywhere (profile, recommendations, summary, storage)
        #    piied_transcript = REDACTED — kept as an optional showcase/display feature for the UI
        self.state.transcript_buffer.append(clean_text)
        self.state.full_transcript  += f"\n{speaker_hint}: {raw_text}"
        self.state.piied_transcript += f"\n{speaker_hint}: {clean_text}"

        # 3. Run sentiment + profile extraction concurrently every N chunks
        chunk_count = len(self.state.transcript_buffer)
        sentiment_update = {}
        profile_update = {}

        if chunk_count % 3 == 0:  # Update every 3 chunks for performance
            loop = asyncio.get_running_loop()

            async def update_sentiment():
                return await loop.run_in_executor(
                    None,
                    self.sentiment.analyze_incremental,
                    clean_text,
                    self.state.sentiment,
                )

            async def update_profile():
                # Profile extraction runs on RAW transcript so names, emails, phone
                # numbers etc. are present — not redacted placeholders.
                seed = client_profile or (self.state.profile_extractions if self.state.profile_extractions else None)
                return await loop.run_in_executor(
                    None,
                    self.profile.extract_from_transcript,
                    self.state.full_transcript,  # raw, unredacted accumulator
                    seed,
                )

            sentiment_update, profile_update = await asyncio.gather(
                update_sentiment(), update_profile(), return_exceptions=True
            )
            if not isinstance(sentiment_update, Exception):
                self.state.sentiment = sentiment_update
            if not isinstance(profile_update, Exception):
                self.state.profile_extractions.update(profile_update)

        return {
            "clean_text": clean_text,
            "pii_detected": pii_result.get("pii_count", 0),
            "sentiment": self.state.sentiment,
            "profile_updates": profile_update,
        }

    async def generate_recommendations(
        self, client_profile: dict[str, Any]
    ) -> list[dict[str, Any]]:
        """
        GATE-1 prep: Generate recommendations from current meeting context.
        Results held in state pending advisor approval.
        """
        result = await asyncio.get_event_loop().run_in_executor(
            None,
            self.recommendation.generate,
            client_profile,
            self.state.full_transcript,
            self.state.sentiment,
        )
        recommendations = result.get("recommendations", [])
        self.state.recommendations = recommendations
        self.state.gate = MeetingGate.RECOMMENDATION_REVIEW
        self.state.status = MeetingWorkflowStatus.AWAITING_APPROVAL

        await _log_event(
            AuditEventType.RECOMMENDATION_GENERATED,
            self.session_id,
            self.client_id,
            self.advisor_id,
            f"Generated {len(recommendations)} recommendations",
            {
                "count": len(recommendations),
                "recommendations": [
                    {
                        "category": r.get("category", ""),
                        "headline": r.get("headline", r.get("title", "")),
                        "action":   r.get("action", ""),
                        "ticker":   r.get("ticker", ""),
                        "rationale": (r.get("rationale") or "")[:200],
                    }
                    for r in recommendations
                ],
            },
        )

        # Persist checkpoint
        store = get_cosmos_store()
        checkpoint = {
            "checkpoint_id": str(uuid.uuid4()),
            "workflow_id": self.session_id,
            "gate": MeetingGate.RECOMMENDATION_REVIEW.value,
            "status": "awaiting_approval",
            "payload": {"recommendations": recommendations},
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await store.save_checkpoint(checkpoint)
        return recommendations

    async def approve_recommendations(
        self,
        approved_indices: list[int],
        approved_by: str,
        notes: str = "",
    ) -> None:
        """Advisor approves a subset of recommendations — GATE-1 resolved."""
        approved = [
            r for i, r in enumerate(self.state.recommendations)
            if i in approved_indices
        ]
        for r in approved:
            r["approved_by"] = approved_by
            r["approved_at"] = datetime.now(timezone.utc).isoformat()
            r["approval_notes"] = notes

        self.state.approved_recommendations = approved
        self.state.gate = None
        self.state.status = MeetingWorkflowStatus.ACTIVE

        # Mark the pending checkpoint as resolved so it doesn't appear in portfolio page
        try:
            store = get_cosmos_store()
            pending = await store.query(
                "checkpoints",
                "SELECT * FROM c WHERE c.workflow_id = @wid AND c.status = 'awaiting_approval'",
                [{"name": "@wid", "value": self.session_id}],
            )
            for cp in pending:
                cp["status"] = "resolved"
                cp["resolved_at"] = datetime.now(timezone.utc).isoformat()
                await store.save_checkpoint(cp)
        except Exception:
            pass

        await _log_event(
            AuditEventType.RECOMMENDATION_APPROVED,
            self.session_id,
            self.client_id,
            self.advisor_id,
            f"Advisor approved {len(approved)} recommendations",
            {"approved_by": approved_by, "count": len(approved)},
        )

    async def finalize_meeting(
        self,
        client_profile: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Post-meeting pipeline: Full sentiment + profile extraction + summary.
        Enters GATE-2 for advisor summary review.
        """
        logger.info("meeting_finalize_start session=%s", self.session_id)

        async def compute_final_sentiment():
            return await asyncio.get_event_loop().run_in_executor(
                None,
                self.sentiment.analyze,
                self.state.piied_transcript,  # redacted for LLM safety
                "Full meeting",
            )

        async def extract_full_profile():
            return await asyncio.get_event_loop().run_in_executor(
                None,
                self.profile.extract_from_transcript,
                self.state.full_transcript,   # raw — so profile data is intact
                client_profile,
            )

        async def generate_summary():  # noqa: E306
            return await asyncio.get_event_loop().run_in_executor(
                None,
                self.summary.summarize,
                self.state.full_transcript,
                client_profile,
                self.state.approved_recommendations,
                self.state.sentiment,
            )

        final_sentiment, profile_extraction, summary = await asyncio.gather(
            compute_final_sentiment(),
            extract_full_profile(),
            generate_summary(),
            return_exceptions=True,
        )

        if not isinstance(final_sentiment, Exception):
            self.state.sentiment = final_sentiment
        if not isinstance(profile_extraction, Exception):
            self.state.profile_extractions = profile_extraction
        if not isinstance(summary, Exception):
            self.state.summary = summary

        self.state.gate = MeetingGate.SUMMARY_REVIEW
        self.state.status = MeetingWorkflowStatus.AWAITING_APPROVAL

        _summary = self.state.summary or {}
        _next_actions = _summary.get("next_actions") or []
        await _log_event(
            AuditEventType.MEETING_SUMMARIZED,
            self.session_id,
            self.client_id,
            self.advisor_id,
            "Meeting finalized — awaiting advisor summary review",
            {
                "executive_summary": _summary.get("executive_summary", ""),
                "advisor_summary": (_summary.get("advisor_summary") or "")[:400],
                "action_items": [
                    (a.get("action", str(a)) if isinstance(a, dict) else str(a))
                    for a in _next_actions
                ],
                "key_decisions": _summary.get("key_decisions") or [],
                "topics_discussed": _summary.get("topics_discussed") or [],
                "concerns_raised": _summary.get("concerns_raised") or [],
                "meeting_effectiveness_score": _summary.get("meeting_effectiveness_score"),
            },
        )
        return self.state.summary

    async def complete_meeting(self, approved_by: str) -> dict[str, Any]:
        """GATE-2 resolved: Advisor approves meeting summary. Persist to Cosmos."""
        self.state.status = MeetingWorkflowStatus.COMPLETED
        self.state.completed_at = datetime.now(timezone.utc)
        self.state.gate = None

        store = get_cosmos_store()

        # Load the original session doc so we preserve fields set at start_meeting
        # (title, meeting_type, started_at, metadata, is_prospective, etc.) that
        # are not held in MeetingWorkflowState.
        existing = await store.get_session(self.session_id, self.client_id) or {}

        session_doc = {
            **existing,  # preserve title, meeting_type, started_at, metadata …
            "session_id": self.session_id,
            "client_id": self.client_id,
            "advisor_id": self.advisor_id,
            "status": "completed",
            "full_transcript": self.state.full_transcript,
            "redacted_transcript": self.state.piied_transcript,
            "sentiment": self.state.sentiment,
            "recommendations": self.state.approved_recommendations,
            "profile_extractions": self.state.profile_extractions,
            "summary": self.state.summary,
            "pre_meeting_briefing": self.state.pre_meeting_briefing,
            "completed_at": self.state.completed_at.isoformat(),
            "approved_by": approved_by,
        }

        await store.save_session(session_doc)

        # ── Auto-update the client CRM record with the freshly extracted data ──
        # Two cases:
        #  (a) Prospect meeting that was already promoted mid-meeting: the session
        #      has a linked_client_id; update that record with full post-meeting data.
        #  (b) Real (non-prospect) client meeting: update the client directly.
        # We do this here because complete_meeting() is the single finalisation
        # point that always runs with the richest available profile_extractions,
        # regardless of whether the caller is stop_and_complete() or the manual
        # finalize→complete flow.
        linked_client_id = existing.get("linked_client_id")
        update_client_id = linked_client_id or (
            self.client_id if not self.client_id.startswith("prospect-") else None
        )
        if update_client_id and self.state.profile_extractions:
            try:
                await _apply_extractions_to_client(
                    store,
                    client_id=update_client_id,
                    advisor_id=self.advisor_id,
                    extractions=self.state.profile_extractions,
                    session_id=self.session_id,
                )
            except Exception as upd_exc:
                logger.warning(
                    "client_profile_update_from_meeting_failed client=%s session=%s error=%s",
                    update_client_id, self.session_id, upd_exc,
                )

        # Build rich audit metadata — summarise transcript + sentiment without bloating the log
        sentiment = self.state.sentiment or {}
        transcript_preview = (self.state.full_transcript or "")[:500]
        profile_extractions = self.state.profile_extractions or {}
        summary = self.state.summary or {}

        await _log_event(
            AuditEventType.MEETING_ENDED,
            self.session_id,
            self.client_id,
            self.advisor_id,
            "Meeting completed and persisted",
            {
                "approved_by": approved_by,
                # Sentiment snapshot
                "sentiment_overall": sentiment.get("overall"),
                "sentiment_compliance_flag": sentiment.get("compliance_flag"),
                "key_themes": sentiment.get("key_themes", []),
                "investment_concerns": sentiment.get("investment_concerns", []),
                # Transcript stats
                "transcript_length_chars": len(self.state.full_transcript or ""),
                "transcript_preview": transcript_preview,
                # Profile extraction summary
                "profile_completeness": profile_extractions.get("profile_completeness"),
                "extracted_goals_count": len(profile_extractions.get("extracted_goals") or []),
                "extracted_concerns_count": len(profile_extractions.get("extracted_concerns") or []),
                # Meeting outcome
                "action_items": summary.get("action_items", []),
                "key_decisions": summary.get("key_decisions", []),
                "recommendations_approved": len(self.state.approved_recommendations),
            },
        )

        _active_workflows.pop(self.session_id, None)
        return session_doc

    async def stop_and_complete(
        self,
        client_profile: dict[str, Any],
        approved_by: str,
    ) -> dict[str, Any]:
        """
        Automated post-recording pipeline triggered when the advisor stops recording.

        Execution order — each step is independently logged to Cosmos with session_id
        correlation so the full trace is reconstructable from the audit trail:

          1. RECORDING_STOPPED   — recording ended, pipeline starting
          2. RECOMMENDATION_GENERATED — AI generates recommendations from transcript
          3. RECOMMENDATION_APPROVED  — system auto-approves all (no human gate)
          4. MEETING_SUMMARIZED       — summary + action items + key decisions generated
          5. MEETING_ENDED            — full session doc persisted to Cosmos
        """
        logger.info(
            "stop_and_complete_start session=%s client=%s transcript_chars=%d",
            self.session_id, self.client_id, len(self.state.full_transcript),
        )

        # ── Step 1: Log recording stopped ────────────────────────────────────
        await _log_event(
            AuditEventType.RECORDING_STOPPED,
            self.session_id,
            self.client_id,
            self.advisor_id,
            "Recording stopped — automated post-meeting pipeline starting",
            {
                "transcript_chars": len(self.state.full_transcript),
                "transcript_chunks": len(self.state.transcript_buffer),
                "triggered_by": approved_by,
            },
        )

        # ── Step 2: Generate recommendations ────────────────────────────────
        effective_profile = client_profile or self.state.profile_extractions or {}
        try:
            await self.generate_recommendations(effective_profile)
        except Exception as rec_exc:
            logger.warning(
                "stop_and_complete_recs_failed session=%s error=%s",
                self.session_id, rec_exc,
            )

        # ── Step 3: Auto-approve all recommendations ─────────────────────────
        all_indices = list(range(len(self.state.recommendations)))
        await self.approve_recommendations(
            approved_indices=all_indices,
            approved_by=approved_by,
            notes="Auto-approved via stop-recording pipeline",
        )

        # Override the audit log description so it's clear this was automatic
        await _log_event(
            AuditEventType.RECOMMENDATION_APPROVED,
            self.session_id,
            self.client_id,
            self.advisor_id,
            f"Auto-approved {len(self.state.approved_recommendations)} recommendations on recording stop",
            {
                "auto_approved": True,
                "count": len(self.state.approved_recommendations),
                "approved_by": approved_by,
            },
        )

        # ── Step 4: Finalize — generate summary + action items ───────────────
        try:
            await self.finalize_meeting(effective_profile)
        except Exception as fin_exc:
            logger.warning(
                "stop_and_complete_finalize_failed session=%s error=%s",
                self.session_id, fin_exc,
            )

        # ── Step 5: Complete — persist everything to Cosmos ──────────────────
        try:
            session_doc = await self.complete_meeting(approved_by=approved_by)
        except Exception as cmp_exc:
            logger.warning(
                "stop_and_complete_persist_failed session=%s error=%s",
                self.session_id, cmp_exc,
            )
            # Return in-memory state so the frontend still gets usable data
            session_doc = {
                "session_id": self.session_id,
                "client_id": self.client_id,
                "status": "completed",
                "profile_extractions": self.state.profile_extractions,
                "recommendations": self.state.approved_recommendations,
                "summary": self.state.summary or {},
            }

        logger.info(
            "stop_and_complete_done session=%s recommendations=%d action_items=%d",
            self.session_id,
            len(self.state.approved_recommendations),
            len((self.state.summary or {}).get("action_items", [])),
        )
        return session_doc


def get_workflow(session_id: str) -> Optional[MeetingWorkflow]:
    """Retrieve active workflow state for a session."""
    state = _active_workflows.get(session_id)
    if state is None:
        return None
    wf = MeetingWorkflow.__new__(MeetingWorkflow)
    wf.session_id = state.session_id
    wf.client_id = state.client_id
    wf.advisor_id = state.advisor_id
    wf.state = state
    wf.transcription = TranscriptionAgent()
    wf.pii = PIIAgent()
    wf.sentiment = SentimentAgent()
    wf.profile = ProfileAgent()
    wf.recommendation = RecommendationAgent()
    wf.summary = SummaryAgent()
    wf.advisory = AdvisoryAgent()
    wf.news = NewsAgent()
    return wf


async def get_or_recover_workflow(session_id: str) -> Optional[MeetingWorkflow]:
    """
    Get an active workflow, recovering from Cosmos if not in memory.

    After a server reload (uvicorn --reload fires on code changes) the
    in-memory _active_workflows dict is empty.  This function re-hydrates
    the workflow state from the Cosmos session document so that subsequent
    calls (inject-transcript, recommend, finalize, complete) still work.
    """
    wf = get_workflow(session_id)
    if wf:
        return wf

    store = get_cosmos_store()
    sessions = await store.query(
        "sessions",
        "SELECT * FROM c WHERE c.session_id = @sid",
        [{"name": "@sid", "value": session_id}],
        max_items=1,
    )
    if not sessions:
        return None

    doc = sessions[0]
    state = MeetingWorkflowState(
        session_id=session_id,
        client_id=doc.get("client_id", ""),
        advisor_id=doc.get("advisor_id", ""),
    )
    # Restore as much prior state as possible so pipeline steps have context
    state.full_transcript     = doc.get("full_transcript", "") or ""
    state.piied_transcript    = doc.get("redacted_transcript", "") or ""
    state.sentiment           = doc.get("sentiment") or {}
    state.profile_extractions = doc.get("profile_extractions") or {}
    state.recommendations     = doc.get("recommendations") or []
    state.approved_recommendations = doc.get("recommendations") or []
    state.summary             = doc.get("summary") or {}

    _active_workflows[session_id] = state
    logger.info("workflow_recovered_from_cosmos session=%s client=%s", session_id, state.client_id)

    recovered = MeetingWorkflow.__new__(MeetingWorkflow)
    recovered.session_id    = session_id
    recovered.client_id     = state.client_id
    recovered.advisor_id    = state.advisor_id
    recovered.state         = state
    recovered.transcription = TranscriptionAgent()
    recovered.pii           = PIIAgent()
    recovered.sentiment     = SentimentAgent()
    recovered.profile       = ProfileAgent()
    recovered.recommendation = RecommendationAgent()
    recovered.summary       = SummaryAgent()
    recovered.advisory      = AdvisoryAgent()
    recovered.news          = NewsAgent()
    return recovered
