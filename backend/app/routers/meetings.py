"""
Meeting Intelligence API Router — management of advisor-client meeting sessions.

Endpoints:
  POST   /api/meetings/start            Start a new meeting session
  POST   /api/meetings/{id}/transcript  Add transcript chunk (text)
  POST   /api/meetings/{id}/audio       Add audio chunk (base64)
  GET    /api/meetings/{id}/status      Get real-time meeting status
  POST   /api/meetings/{id}/recommend   Trigger recommendation generation
  POST   /api/meetings/{id}/approve     Approve recommendations (GATE-1)
  POST   /api/meetings/{id}/finalize    End meeting and generate summary (GATE-2)
  POST   /api/meetings/{id}/complete    Approve summary and persist
  GET    /api/meetings/{id}             Get full meeting session
  GET    /api/meetings/client/{cid}     List meetings for a client
  WS     /api/meetings/{id}/ws          Live WebSocket stream for real-time updates
"""
from __future__ import annotations

import asyncio
import base64
import json
import logging
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from uuid import uuid4

from backend.app.models.client import (
    ClientProfile,
    ClientStatus,
    EmploymentStatus,
    GoalType,
    LifeStage,
    MaritalStatus,
    RiskProfile,
    RiskTolerance,
    TaxProfile,
    EstatePlanningProfile,
    InsuranceCoverage,
)
from backend.app.models.meeting import (
    AudioChunkRequest,
    MeetingSession,
    MeetingStatus,
    MeetingType,
    StartMeetingRequest,
)
from backend.app.models.audit import AuditEntry, AuditEventType
from backend.app.orchestration.meeting_workflow import (
    MeetingWorkflow,
    MeetingWorkflowStatus,
    get_workflow,
    get_or_recover_workflow,
)
from backend.app.persistence.cosmos_store import get_cosmos_store
from backend.app.persistence.search_store import get_search_store

router = APIRouter()
logger = logging.getLogger(__name__)

# WebSocket connection registry (session_id → list of connections)
_ws_connections: dict[str, list[WebSocket]] = {}

# Persistent Azure Speech SDK recognizer state per session.
# Keyed by session_id; created on first audio POST, lives until session ends.
_recognizer_state: dict[str, dict[str, Any]] = {}


def _resolve_speaker_id(speaker_map: dict[str, str], sdk_id: str) -> str:
    """
    Map SDK diarization IDs ("Guest-1", "Guest-2") to meeting roles.
    First speaker heard → "advisor" (advisor opens the meeting),
    second → "client". Unknown/empty → "client".
    """
    if not sdk_id or sdk_id.lower() == "unknown":
        return "client"
    if sdk_id not in speaker_map:
        speaker_map[sdk_id] = "advisor" if not speaker_map else "client"
    return speaker_map[sdk_id]


async def _prewarm_recognizer(session_id: str) -> None:
    """Pre-warm the Azure Speech recognizer immediately after meeting start.

    Calling start_transcribing_async() opens a WebSocket to Azure Speech Service.
    Doing this eagerly means the connection is ready before the first audio chunk
    arrives, eliminating the multi-second delay + flakiness on first transcription.
    """
    try:
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(
            None, _get_or_create_recognizer, session_id, "advisor", loop
        )
        logger.info("recognizer_prewarmed session=%s", session_id)
    except Exception as exc:
        logger.warning("recognizer_prewarm_failed session=%s error=%s", session_id, exc)


def _get_or_create_recognizer(
    session_id: str, speaker: str, loop: asyncio.AbstractEventLoop
) -> dict[str, Any] | None:
    """Return existing recognizer state or create a new one for this session."""
    if session_id in _recognizer_state:
        return _recognizer_state[session_id]

    try:
        import azure.cognitiveservices.speech as speechsdk
        from backend.config import get_settings
        settings = get_settings()
        if not settings.azure_speech_key:
            return None

        speech_config = speechsdk.SpeechConfig(
            subscription=settings.azure_speech_key,
            region=settings.azure_speech_region,
        )
        speech_config.speech_recognition_language = "en-US"

        fmt = speechsdk.audio.AudioStreamFormat(
            samples_per_second=16000, bits_per_sample=16, channels=1
        )
        push_stream = speechsdk.audio.PushAudioInputStream(stream_format=fmt)
        audio_config = speechsdk.audio.AudioConfig(stream=push_stream)

        # ConversationTranscriber provides per-utterance speaker_id diarization.
        transcriber = speechsdk.transcription.ConversationTranscriber(
            speech_config=speech_config, audio_config=audio_config
        )

        speaker_map: dict[str, str] = {}  # sdk_id → "advisor" | "client"
        state = {
            "push_stream": push_stream,
            "recognizer": transcriber,
            "speaker_map": speaker_map,
        }
        _recognizer_state[session_id] = state

        # `loop` is passed in from the async caller so it's always the running loop

        def on_transcribed(evt: Any) -> None:
            if evt.result.reason != speechsdk.ResultReason.RecognizedSpeech:
                return
            text = evt.result.text.strip()
            if not text:
                return
            role = _resolve_speaker_id(speaker_map, getattr(evt.result, "speaker_id", ""))
            logger.info("speech_recognized session=%s speaker=%s text=%s", session_id, role, text[:80])

            async def _process() -> None:
                try:
                    wf = get_workflow(session_id)
                    if not wf:
                        logger.warning("on_recognized_no_workflow session=%s", session_id)
                        return
                    # Broadcast immediately — don't block on enrichment
                    await _broadcast(session_id, {"type": "transcript_segment", "data": {
                        "text": text,
                        "clean_text": text,
                        "speaker_hint": role,
                    }})
                    try:
                        proc = await wf.process_transcript_chunk(raw_text=text, speaker_hint=role)
                        if proc.get("sentiment"):
                            await _broadcast(session_id, {"type": "sentiment_update", "data": proc["sentiment"]})
                        if proc.get("profile_updates"):
                            await _broadcast(session_id, {"type": "profile_update", "data": wf.state.profile_extractions})
                    except Exception as enrich_exc:
                        logger.warning("enrichment_failed session=%s error=%s", session_id, str(enrich_exc))
                except Exception as exc:
                    logger.error("on_recognized_process_failed session=%s error=%s", session_id, str(exc))

            asyncio.run_coroutine_threadsafe(_process(), loop)

        transcriber.transcribed.connect(on_transcribed)
        transcriber.start_transcribing_async()
        logger.info("conversation_transcriber_started session=%s", session_id)
        return state

    except Exception as exc:
        logger.error("recognizer_create_failed error=%s", str(exc))
        return None


def _cleanup_recognizer(session_id: str) -> None:
    state = _recognizer_state.pop(session_id, None)
    if state:
        try:
            state["push_stream"].close()
        except Exception:
            pass
        try:
            state["recognizer"].stop_transcribing_async()
        except Exception:
            pass


class AddTranscriptRequest(BaseModel):
    text: str
    speaker_hint: str = "unknown"
    client_profile: Optional[dict[str, Any]] = None


class ApproveRecsRequest(BaseModel):
    approved_indices: list[int]
    approved_by: str
    notes: str = ""


class CompleteRequest(BaseModel):
    approved_by: str


class FinalizeRequest(BaseModel):
    client_profile: Optional[dict[str, Any]] = None


class InjectTranscriptRequest(BaseModel):
    """TEST USE: inject pre-written segments directly, bypassing audio."""
    segments: list[dict[str, str]]   # [{speaker: "advisor"|"client", text: "..."}]
    delay_ms: int = 0                # optional pacing between segments


class PromoteToClientRequest(BaseModel):
    """Promote an extracted prospect profile to a permanent CRM client record."""
    advisor_id: str
    # Advisor form overrides — take precedence over AI extraction when non-empty
    first_name:           str = ""
    last_name:            str = ""
    email:                str = ""
    phone:                str = ""
    age:                  Optional[int]   = None
    marital_status:       str = "single"
    number_of_dependents: int = 0
    employment_status:    str = "employed"
    life_stage:           str = "accumulation"
    annual_income:        float = 0.0
    investable_assets:    float = 0.0
    monthly_expenses:     float = 0.0
    years_to_retirement:  Optional[int] = None
    risk_tolerance:       str = "moderate"
    primary_goal_type:    str = "retirement"
    has_life_insurance:   bool = False
    has_will:             bool = False
    has_trust:            bool = False
    notes:                str = ""


async def _broadcast(session_id: str, message: dict[str, Any]) -> None:
    """Broadcast update to all WebSocket connections for a session."""
    connections = _ws_connections.get(session_id, [])
    dead = []
    for ws in connections:
        try:
            await ws.send_json(message)
        except Exception:
            dead.append(ws)
    for ws in dead:
        connections.remove(ws)


@router.post("/start", response_model=dict)
async def start_meeting(request: StartMeetingRequest, background_tasks: BackgroundTasks) -> dict[str, Any]:
    """Start a new meeting session and initialize the MAF workflow."""
    # Support prospective (no existing client) sessions
    is_prospective = request.is_prospective or not request.client_id
    client_id = request.client_id or f"prospect-{str(uuid4())[:8]}"

    session = MeetingSession(
        client_id=client_id,
        advisor_id=request.advisor_id,
        meeting_type=request.meeting_type,
        title=request.title or f"{request.meeting_type.value.replace('_', ' ').title()} — {datetime.now(timezone.utc).strftime('%b %d, %Y')}",
        notes=request.notes,
        status=MeetingStatus.ACTIVE,
        started_at=datetime.now(timezone.utc),
        metadata={"is_prospective": is_prospective},
    )

    workflow = MeetingWorkflow(
        session_id=session.session_id,
        client_id=client_id,
        advisor_id=request.advisor_id,
    )

    store = get_cosmos_store()
    await store.save_session(session.model_dump())

    # Pre-warm the Azure Speech SDK connection in the background so it's ready
    # before the first audio chunk arrives (eliminates first-transcription delay).
    background_tasks.add_task(_prewarm_recognizer, session.session_id)

    # Log meeting_started to audit trail
    audit_entry = AuditEntry(
        event_type=AuditEventType.MEETING_STARTED,
        session_id=session.session_id,
        client_id=client_id,
        advisor_id=request.advisor_id,
        description=f"Meeting started — {'prospect' if is_prospective else 'client'} session",
        payload={
            "meeting_type": request.meeting_type if isinstance(request.meeting_type, str) else request.meeting_type.value,
            "title": session.title,
            "is_prospective": is_prospective,
        },
    )
    store2 = get_cosmos_store()
    background_tasks.add_task(store2.log_audit, audit_entry.model_dump())

    logger.info("meeting_started session=%s client=%s prospective=%s", session.session_id, client_id, is_prospective)
    return {
        "id": session.session_id,
        "session_id": session.session_id,
        "client_id": client_id,
        "is_prospective": is_prospective,
        "status": "active",
        "title": session.title,
        "started_at": session.started_at.isoformat(),
    }


@router.post("/{session_id}/pre-briefing", response_model=dict)
async def run_pre_briefing(
    session_id: str,
    background_tasks: BackgroundTasks,
) -> dict[str, Any]:
    """Run pre-meeting advisory briefing (news + market context + preparation tips)."""
    wf = await get_or_recover_workflow(session_id)
    if not wf:
        raise HTTPException(404, "Meeting session not found or expired")

    async def run():
        store = get_cosmos_store()
        client_profile = await store.get_client(wf.client_id, wf.advisor_id) or {}
        briefing = await wf.run_pre_meeting_briefing(client_profile)
        await _broadcast(session_id, {"type": "pre_briefing", "data": briefing})

    background_tasks.add_task(run)
    return {"status": "running", "message": "Pre-meeting briefing started"}


@router.post("/{session_id}/transcript", response_model=dict)
async def add_transcript_chunk(
    session_id: str,
    request: AddTranscriptRequest,
) -> dict[str, Any]:
    """Add a transcript chunk for real-time processing."""
    wf = get_workflow(session_id)
    if not wf:
        raise HTTPException(404, "Meeting session not found")

    result = await wf.process_transcript_chunk(
        raw_text=request.text,
        speaker_hint=request.speaker_hint,
        client_profile=request.client_profile,
    )

    # Broadcast sentiment updates via WebSocket
    if result.get("sentiment"):
        await _broadcast(session_id, {"type": "sentiment_update", "data": result["sentiment"]})

    # Broadcast incremental profile extraction for prospect meetings
    if result.get("profile_updates"):
        await _broadcast(session_id, {"type": "profile_update", "data": wf.state.profile_extractions})

    return result


@router.post("/{session_id}/audio/stream", response_model=dict)
async def stream_audio_chunk(session_id: str, request: AudioChunkRequest) -> dict[str, Any]:
    """
    Receive a raw PCM audio chunk (base64-encoded, 16 kHz / 16-bit / mono)
    and feed it directly into the session's PushAudioInputStream.

    The continuous recognizer fires on_recognized() when it detects a sentence
    boundary, which broadcasts a transcript_segment event via WebSocket.
    """
    wf = get_workflow(session_id)
    if not wf:
        raise HTTPException(404, "Meeting session not found")

    try:
        pcm_bytes = base64.b64decode(request.audio_base64)
    except Exception:
        raise HTTPException(400, "Invalid base64 audio data")

    speaker = request.speaker_hint or "client"

    loop = asyncio.get_running_loop()
    state = await loop.run_in_executor(
        None, _get_or_create_recognizer, session_id, speaker, loop
    )
    if state is None:
        raise HTTPException(503, "Speech recognizer unavailable — check AZURE_SPEECH_KEY")

    # Write PCM bytes into the stream (non-blocking; SDK reads asynchronously)
    await asyncio.get_event_loop().run_in_executor(
        None, state["push_stream"].write, pcm_bytes
    )
    return {"status": "ok", "bytes": len(pcm_bytes)}


@router.delete("/{session_id}/audio/stream", response_model=dict)
async def close_audio_stream(session_id: str) -> dict[str, Any]:
    """Signal end-of-audio for the session (flushes remaining speech)."""
    _cleanup_recognizer(session_id)
    return {"status": "closed"}


@router.post("/{session_id}/audio", response_model=dict)
async def add_audio_chunk(session_id: str, request: AudioChunkRequest) -> dict[str, Any]:
    """Add a base64-encoded audio chunk for transcription + processing."""
    wf = get_workflow(session_id)
    if not wf:
        raise HTTPException(404, "Meeting session not found")

    # Transcribe via Azure Speech SDK
    transcription_result = await asyncio.get_event_loop().run_in_executor(
        None,
        wf.transcription.transcribe_audio_segment,
        request.audio_base64,
        request.speaker_hint,
    )

    raw_text = " ".join(
        seg.get("text", "") for seg in transcription_result.get("segments", [])
    )
    if raw_text.strip():
        result = await wf.process_transcript_chunk(
            raw_text=raw_text,
            speaker_hint=request.speaker_hint,
        )
        # Add text alias so the frontend transcript_segment handler can display it
        broadcast_data = {**result, "text": result.get("clean_text", "")}
        await _broadcast(session_id, {"type": "transcript_segment", "data": broadcast_data})
        if result.get("profile_updates"):
            await _broadcast(session_id, {"type": "profile_update", "data": wf.state.profile_extractions})
        return result

    return {"status": "empty_segment"}


@router.get("/{session_id}/status", response_model=dict)
async def get_meeting_status(session_id: str) -> dict[str, Any]:
    """Get real-time meeting status including workflow state and sentiment."""
    wf = get_workflow(session_id)
    if not wf:
        # Try loading from Cosmos (completed session)
        store = get_cosmos_store()
        session = await store.get_session(session_id, "")
        if session:
            return {"session_id": session_id, "status": session.get("status"), "completed": True}
        raise HTTPException(404, "Meeting session not found")

    return {
        "session_id": session_id,
        "status": wf.state.status.value,
        "gate": wf.state.gate.value if wf.state.gate else None,
        "transcript_length": len(wf.state.full_transcript),
        "sentiment": wf.state.sentiment,
        "recommendations_pending": len(wf.state.recommendations),
        "recommendations_approved": len(wf.state.approved_recommendations),
    }


@router.post("/{session_id}/recommend", response_model=dict)
async def generate_recommendations(
    session_id: str,
    client_profile: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    """Trigger AI recommendation generation. Enters GATE-1 (advisor approval required)."""
    wf = await get_or_recover_workflow(session_id)
    if not wf:
        raise HTTPException(404, "Meeting session not found")

    # For prospect meetings the frontend sends no body; fall back to accumulated extractions
    effective_profile = client_profile or wf.state.profile_extractions or {}
    recommendations = await wf.generate_recommendations(effective_profile)
    await _broadcast(
        session_id,
        {"type": "recommendations_ready", "data": {"count": len(recommendations)}},
    )
    return {
        "status": "awaiting_approval",
        "recommendations": recommendations,
        "gate": "recommendation_review",
    }


@router.post("/{session_id}/approve-recommendations", response_model=dict)
async def approve_recommendations(
    session_id: str,
    request: ApproveRecsRequest,
) -> dict[str, Any]:
    """Advisor approves recommendations — resolves GATE-1."""
    wf = await get_or_recover_workflow(session_id)
    if not wf:
        raise HTTPException(404, "Meeting session not found")

    await wf.approve_recommendations(
        approved_indices=request.approved_indices,
        approved_by=request.approved_by,
        notes=request.notes,
    )
    await _broadcast(session_id, {"type": "recommendations_approved"})
    return {"status": "approved", "approved_count": len(request.approved_indices)}


class StopAndCompleteRequest(BaseModel):
    client_profile: Optional[dict[str, Any]] = None
    approved_by: str = ""


@router.post("/{session_id}/stop", response_model=dict)
async def stop_and_complete(
    session_id: str,
    request: StopAndCompleteRequest,
) -> dict[str, Any]:
    """
    Stop recording and automatically run the full post-meeting pipeline:
    recommendations → auto-approve → summarize + action items → persist.
    All steps are logged to Cosmos with session_id correlation.
    """
    wf = await get_or_recover_workflow(session_id)
    if not wf:
        raise HTTPException(404, "Meeting session not found")

    effective_profile = request.client_profile or wf.state.profile_extractions or {}
    approved_by = request.approved_by or wf.advisor_id

    session_doc = await wf.stop_and_complete(
        client_profile=effective_profile,
        approved_by=approved_by,
    )

    summary = session_doc.get("summary") or {} if isinstance(session_doc, dict) else {}
    recommendations = session_doc.get("recommendations") or [] if isinstance(session_doc, dict) else []
    profile_extractions = session_doc.get("profile_extractions") or {} if isinstance(session_doc, dict) else {}

    await _broadcast(session_id, {"type": "meeting_completed", "data": {
        "action_items": summary.get("action_items", []),
        "key_decisions": summary.get("key_decisions", []),
        "recommendations_count": len(recommendations),
    }})

    return {
        "status": "completed",
        "session_id": session_id,
        "client_id": wf.client_id,
        "is_prospective": wf.client_id.startswith("prospect-"),
        "profile_extractions": profile_extractions,
        "recommendations": recommendations,
        "summary": summary,
        "action_items": summary.get("action_items", []),
        "key_decisions": summary.get("key_decisions", []),
        "next_steps": summary.get("next_steps", []),
        "sentiment": session_doc.get("sentiment") if isinstance(session_doc, dict) else {},
    }


@router.post("/{session_id}/finalize", response_model=dict)
async def finalize_meeting(
    session_id: str,
    request: FinalizeRequest,
) -> dict[str, Any]:
    """End the meeting and generate summaries. Enters GATE-2."""
    wf = await get_or_recover_workflow(session_id)
    if not wf:
        raise HTTPException(404, "Meeting session not found")

    summary = await wf.finalize_meeting(request.client_profile or {})
    await _broadcast(session_id, {"type": "summary_ready", "data": summary})
    return {"status": "summary_review", "message": "Meeting finalized — awaiting advisor review"}


@router.post("/{session_id}/complete", response_model=dict)
async def complete_meeting(session_id: str, request: CompleteRequest) -> dict[str, Any]:
    """Advisor approves the summary and persists the session — resolves GATE-2."""
    wf = await get_or_recover_workflow(session_id)
    if not wf:
        raise HTTPException(404, "Meeting session not found")

    session_doc = await wf.complete_meeting(approved_by=request.approved_by)
    await _broadcast(session_id, {"type": "meeting_completed"})
    return {
        "status": "completed",
        "session_id": session_id,
        "client_id": wf.client_id,
        "is_prospective": wf.client_id.startswith("prospect-"),
        "profile_extractions": session_doc.get("profile_extractions") if isinstance(session_doc, dict) else {},
        "extracted_entities": session_doc.get("extracted_entities") if isinstance(session_doc, dict) else {},
    }


def _map_extraction_to_client(
    profile_extractions: dict[str, Any],
    req: PromoteToClientRequest,
) -> dict[str, Any]:
    """
    Map the nested profile-agent extraction dict to flat ClientProfile fields.
    Form overrides (req) always win over AI-extracted values.
    """
    personal  = profile_extractions.get("extracted_personal",  {}) or {}
    financial = profile_extractions.get("extracted_financial", {}) or {}
    risk_data = profile_extractions.get("extracted_risk",      {}) or {}
    tax_data  = profile_extractions.get("extracted_tax",       {}) or {}
    insurance = profile_extractions.get("extracted_insurance", {}) or {}
    estate    = profile_extractions.get("extracted_estate",    {}) or {}
    behavioral= profile_extractions.get("extracted_behavioral",{}) or {}
    goals_raw = profile_extractions.get("extracted_goals",     []) or []
    concerns  = profile_extractions.get("extracted_concerns",  []) or []
    life_evts = profile_extractions.get("extracted_life_events",[]) or []
    action_items = profile_extractions.get("key_action_items", []) or []

    # ── Name ──────────────────────────────────────────────────────────────────
    full_name  = personal.get("name", "")
    name_parts = full_name.split() if isinstance(full_name, str) and full_name else []
    ai_first = personal.get("first_name") or (name_parts[0] if name_parts else "")
    ai_last  = personal.get("last_name")  or (" ".join(name_parts[1:]) if len(name_parts) > 1 else "")

    first_name = req.first_name or ai_first or "Unknown"
    last_name  = req.last_name  or ai_last  or "Prospect"

    # ── Contact ───────────────────────────────────────────────────────────────
    email = req.email or personal.get("email", "") or personal.get("email_address", "") or ""
    phone = req.phone or personal.get("phone", "") or personal.get("phone_number", "") or ""

    # ── Age / DOB ─────────────────────────────────────────────────────────────
    age = req.age or personal.get("age") or None
    if isinstance(age, str):
        try:
            age = int(age)
        except ValueError:
            age = None

    # ── Financial ─────────────────────────────────────────────────────────────
    def _float(d: dict, *keys: str) -> float:
        for k in keys:
            v = d.get(k)
            if v is not None:
                try:
                    return float(str(v).replace(",", "").replace("$", ""))
                except (ValueError, TypeError):
                    pass
        return 0.0

    investable_assets = req.investable_assets or _float(financial, "investable_assets", "aum", "liquid_assets")
    annual_income     = req.annual_income     or _float(financial, "annual_income", "income", "salary")
    monthly_expenses  = req.monthly_expenses  or _float(financial, "monthly_expenses", "expenses")
    net_worth         = _float(financial, "net_worth", "total_net_worth")
    has_401k          = bool(tax_data.get("has_401k") or financial.get("has_401k"))
    ira_balance       = _float(tax_data, "ira_balance") or _float(financial, "ira_balance")
    roth_balance      = _float(tax_data, "roth_ira_balance") or _float(financial, "roth_ira_balance")

    # ── Risk ──────────────────────────────────────────────────────────────────
    _risk_map = {
        "very conservative": "very_conservative", "conservative": "conservative",
        "moderate": "moderate", "moderately aggressive": "moderately_aggressive",
        "aggressive": "aggressive", "very aggressive": "aggressive",
    }
    ai_risk = str(risk_data.get("tolerance", "") or risk_data.get("risk_tolerance", "") or "").lower()
    for phrase, val in _risk_map.items():
        if phrase in ai_risk:
            ai_risk = val
            break
    risk_tolerance = req.risk_tolerance if req.risk_tolerance != "moderate" else (ai_risk or "moderate")

    horizon = req.years_to_retirement or risk_data.get("investment_horizon_years") or risk_data.get("time_horizon_years") or 10

    # ── Life stage ────────────────────────────────────────────────────────────
    life_stage = req.life_stage
    if age:
        if age < 35:   life_stage = "early_career"
        elif age < 50: life_stage = "accumulation"
        elif age < 65: life_stage = "pre_retirement"
        else:          life_stage = "retirement"

    # ── Goals ─────────────────────────────────────────────────────────────────
    primary_goal = req.primary_goal_type
    if isinstance(goals_raw, list) and goals_raw:
        g_str = str(goals_raw[0]).lower()
        if "retire"     in g_str: primary_goal = "retirement"
        elif "educati"  in g_str: primary_goal = "education"
        elif "home"     in g_str: primary_goal = "home_purchase"
        elif "business" in g_str: primary_goal = "business_investment"
        elif "income"   in g_str: primary_goal = "income_generation"
        elif "estate"   in g_str: primary_goal = "estate_transfer"
        elif "charit"   in g_str: primary_goal = "charitable"

    # ── Insurance / estate ────────────────────────────────────────────────────
    has_life_insurance = req.has_life_insurance or bool(insurance.get("has_life_insurance") or insurance.get("life_insurance"))
    has_will  = req.has_will  or bool(estate.get("has_will", False))
    has_trust = req.has_trust or bool(estate.get("has_trust") or estate.get("has_revocable_trust"))

    # ── Notes: combine AI concerns + action items ─────────────────────────────
    note_parts = []
    if concerns:
        note_parts.append("Concerns: " + "; ".join(str(c) for c in concerns[:5]))
    if action_items:
        note_parts.append("Action items: " + "; ".join(str(a) for a in action_items[:5]))
    if life_evts:
        note_parts.append("Life events: " + "; ".join(str(e) for e in life_evts[:3]))
    if behavioral:
        note_parts.append(f"Behavioral: {behavioral}")
    notes = req.notes or "\n".join(note_parts)

    return {
        "first_name": first_name,
        "last_name":  last_name,
        "email":   email,
        "phone":   phone,
        "age":     age,
        "marital_status":       req.marital_status,
        "number_of_dependents": req.number_of_dependents,
        "employment_status":    req.employment_status,
        "life_stage":           life_stage,
        "annual_income":        annual_income,
        "investable_assets":    investable_assets,
        "net_worth":            net_worth,
        "monthly_expenses":     monthly_expenses,
        "years_to_retirement":  horizon,
        "risk_tolerance":       risk_tolerance,
        "primary_goal_type":    primary_goal,
        "has_401k":             has_401k,
        "ira_balance":          ira_balance,
        "roth_ira_balance":     roth_balance,
        "has_life_insurance":   has_life_insurance,
        "has_will":             has_will,
        "has_trust":            has_trust,
        "advisor_id":           req.advisor_id,
        "status":               "prospect",
        "notes":                notes,
    }


@router.post("/{session_id}/inject-transcript", response_model=dict)
async def inject_transcript(
    session_id: str,
    request: InjectTranscriptRequest,
) -> dict[str, Any]:
    """
    TEST/DEMO ENDPOINT — inject pre-written transcript segments directly into
    the meeting workflow, bypassing microphone and Azure Speech Services.

    Useful for:
    - Integration / load tests (see tests/run_scenario.py)
    - Demo walkthroughs without a microphone
    - Generating WAV audio files via generate_audio.py
    """
    wf = await get_or_recover_workflow(session_id)
    if not wf:
        raise HTTPException(404, "Meeting session not found")

    results = []
    for seg in request.segments:
        text    = (seg.get("text")    or "").strip()
        speaker = (seg.get("speaker") or "client").strip()
        if not text:
            continue

        # Broadcast raw text immediately so UI transcript panel updates live
        await _broadcast(session_id, {
            "type": "transcript_segment",
            "data": {"text": text, "clean_text": text, "speaker_hint": speaker},
        })

        try:
            proc = await wf.process_transcript_chunk(raw_text=text, speaker_hint=speaker)
            if proc.get("sentiment"):
                await _broadcast(session_id, {"type": "sentiment_update",  "data": proc["sentiment"]})
            if proc.get("profile_updates"):
                await _broadcast(session_id, {"type": "profile_update", "data": wf.state.profile_extractions})
            results.append({"speaker": speaker, "preview": text[:60], "status": "ok"})
        except Exception as exc:
            logger.warning("inject_segment_failed session=%s error=%s", session_id, str(exc))
            results.append({"speaker": speaker, "preview": text[:60], "status": "error", "error": str(exc)})

        if request.delay_ms > 0:
            await asyncio.sleep(request.delay_ms / 1000.0)

    completeness = wf.state.profile_extractions.get("profile_completeness", 0)
    logger.info("inject_transcript_done session=%s segments=%d completeness=%.2f",
                session_id, len(results), completeness)
    return {
        "status": "ok",
        "segments_processed": len(results),
        "profile_completeness": completeness,
        "results": results,
    }


@router.post("/{session_id}/promote-to-client", response_model=dict)
async def promote_to_client(
    session_id: str,
    request: PromoteToClientRequest,
) -> dict[str, Any]:
    """
    Convert an AI-extracted prospect profile into a permanent CRM client record.

    Can be called:
    - Mid-meeting (recording stopped early) — uses whatever has been extracted so far
    - After complete_meeting — uses the full finalized extraction
    - With advisor form overrides that take precedence over AI extraction

    Returns the new client_id so the meeting session can be linked.
    """
    # Try active workflow first, then fall back to Cosmos for completed sessions
    wf = get_workflow(session_id)
    prospect_client_id: str = ""
    existing_linked_client_id: str | None = None
    if wf:
        extractions = wf.state.profile_extractions or {}
        prospect_client_id = wf.client_id
    else:
        store = get_cosmos_store()
        # Query by session_id across partitions (prospect partition key unknown)
        sessions = await store.query(
            "sessions",
            "SELECT * FROM c WHERE c.session_id = @sid",
            [{"name": "@sid", "value": session_id}],
            max_items=1,
        )
        if not sessions:
            raise HTTPException(404, "Meeting session not found")
        session_doc = sessions[0]
        extractions = session_doc.get("profile_extractions", {}) or {}
        prospect_client_id = session_doc.get("client_id", "")
        # If this session was already promoted to a real client, reuse that id
        # so repeated calls (e.g. mid-meeting partial save + post-complete auto-save)
        # update the same record rather than creating duplicates.
        existing_linked_client_id = session_doc.get("linked_client_id") or None

    # Map nested AI extractions + advisor overrides → flat client fields
    fields = _map_extraction_to_client(extractions, request)

    # Build full ClientProfile model
    from backend.app.models.client import (
        InvestmentGoal,
        GoalType,
        ClientProfile as _CP,
    )

    # Map extracted_goals (strings or dicts) → InvestmentGoal objects
    goals: list[InvestmentGoal] = []
    for raw in (extractions.get("extracted_goals") or []):
        if isinstance(raw, dict):
            try:
                goals.append(InvestmentGoal(**raw))
                continue
            except Exception:
                pass
        text = str(raw).lower()
        gtype = GoalType.RETIREMENT
        if any(w in text for w in ("education", "college", "school", "529")):
            gtype = GoalType.EDUCATION
        elif any(w in text for w in ("home", "house", "real estate")):
            gtype = GoalType.HOME_PURCHASE
        elif any(w in text for w in ("business", "startup", "invest")):
            gtype = GoalType.BUSINESS
        elif any(w in text for w in ("estate", "legacy", "inheritance", "trust")):
            gtype = GoalType.ESTATE_TRANSFER
        elif any(w in text for w in ("charity", "charitable", "donate", "daf")):
            gtype = GoalType.CHARITABLE
        elif any(w in text for w in ("income", "dividend", "cash flow")):
            gtype = GoalType.INCOME_GENERATION
        goals.append(InvestmentGoal(goal_type=gtype, name=str(raw)[:120]))
    profile = _CP(
        # Reuse an existing client_id when this session was already promoted
        # (mid-meeting partial save). This ensures the upsert updates the same
        # Cosmos doc with the full post-meeting financial data.
        **(({"client_id": existing_linked_client_id}) if existing_linked_client_id else {}),
        advisor_id            = fields["advisor_id"],
        status                = ClientStatus.PROSPECT,
        first_name            = fields["first_name"],
        last_name             = fields["last_name"],
        email                 = fields["email"],
        phone                 = fields["phone"],
        age                   = fields.get("age"),
        marital_status        = fields["marital_status"],
        number_of_dependents  = fields["number_of_dependents"],
        employment_status     = fields["employment_status"],
        life_stage            = fields["life_stage"],
        annual_income         = fields["annual_income"],
        investable_assets     = fields["investable_assets"],
        net_worth             = fields["net_worth"],
        monthly_expenses      = fields["monthly_expenses"],
        years_to_retirement   = fields.get("years_to_retirement"),
        risk_profile          = RiskProfile(
            tolerance                = fields["risk_tolerance"],
            risk_capacity            = fields["risk_tolerance"],
            investment_horizon_years = int(fields.get("years_to_retirement") or 10),
        ),
        tax_profile  = TaxProfile(
            has_401k      = fields["has_401k"],
            ira_balance   = fields["ira_balance"],
            roth_ira_balance = fields["roth_ira_balance"],
        ),
        insurance    = InsuranceCoverage(
            life_insurance_type = "term" if fields["has_life_insurance"] else "",
        ),
        estate_planning = EstatePlanningProfile(
            has_will             = fields["has_will"],
            has_revocable_trust  = fields["has_trust"],
        ),
        extracted_concerns    = [
            c if isinstance(c, str) else str(c.get("description", c.get("event_type", str(c))))
            for c in (extractions.get("extracted_concerns") or [])
        ],
        extracted_life_events = [
            e if isinstance(e, str) else str(e.get("description", e.get("event_type", str(e))))
            for e in (extractions.get("extracted_life_events") or [])
        ],
        next_actions          = [
            a if isinstance(a, str) else str(a.get("description", a.get("action", str(a))))
            for a in (extractions.get("key_action_items") or [])
        ],
        goals                 = goals,
        relationship_notes    = fields.get("notes", ""),
        metadata = {
            "source_session_id": session_id,
            "profile_completeness": extractions.get("profile_completeness", 0),
            "extraction_notes": extractions.get("extraction_notes", ""),
            # Store the raw financial extraction so _normalize_client can back-fill
            # if the client was partially saved before full data was captured.
            "extracted_financial": extractions.get("extracted_financial") or {},
        },
    )

    store = get_cosmos_store()
    await store.save_client(profile.model_dump())

    # Link the original prospect session to the new real client_id so meeting
    # history queries by real client_id will find it.
    if prospect_client_id and prospect_client_id != profile.client_id:
        try:
            sessions = await store.query(
                "sessions",
                "SELECT * FROM c WHERE c.session_id = @sid",
                [{"name": "@sid", "value": session_id}],
                max_items=1,
            )
            if sessions:
                sessions[0]["linked_client_id"] = profile.client_id
                await store.save_session(sessions[0])
        except Exception as link_exc:
            logger.warning("session_link_failed session=%s error=%s", session_id, link_exc)

        # Re-key audit entries: prospect audit docs are partitioned under prospect_client_id
        # and cannot be moved by upsert (partition key is immutable).  Copy them under
        # the real client_id then delete the originals.
        try:
            prospect_audit_entries = await store.query(
                "audit_log",
                "SELECT * FROM c WHERE c.client_id = @cid AND c.session_id = @sid",
                [{"name": "@cid", "value": prospect_client_id},
                 {"name": "@sid", "value": session_id}],
                max_items=500,
            )
            for entry in prospect_audit_entries:
                new_entry = {**entry, "client_id": profile.client_id}
                await store.log_audit(new_entry)
                try:
                    await store.delete("audit_log", entry["id"], prospect_client_id)
                except Exception:
                    pass  # old entry removal is best-effort
            if prospect_audit_entries:
                logger.info("audit_rekey prospect=%s real=%s count=%d",
                            prospect_client_id, profile.client_id, len(prospect_audit_entries))
        except Exception as rekey_exc:
            logger.warning("audit_rekey_failed session=%s error=%s", session_id, rekey_exc)

    # Index for semantic search — non-critical, ignore if index doesn't exist
    try:
        search = get_search_store()
        await search.upload_document("clients", {
            "id":            profile.client_id,
            "advisor_id":    profile.advisor_id,
            "full_name":     profile.full_name,
            "email":         profile.email,
            "net_worth":     profile.net_worth,
            "risk_tolerance": profile.risk_profile.tolerance,
            "content": f"{profile.full_name} {profile.email} {fields.get('notes', '')}",
        })
    except Exception as search_exc:
        logger.warning("search_index_upload_skipped client=%s error=%s", profile.client_id, search_exc)

    logger.info("promote_to_client client_id=%s session=%s completeness=%.2f",
                profile.client_id, session_id,
                extractions.get("profile_completeness", 0))

    return {
        "client_id":           profile.client_id,
        "name":                profile.full_name,
        "status":              "created",
        "profile_completeness": extractions.get("profile_completeness", 0),
        "missing_fields": [
            f for f, v in {
                "email": profile.email, "phone": profile.phone,
                "age": profile.age, "annual_income": profile.annual_income,
                "investable_assets": profile.investable_assets,
            }.items() if not v
        ],
    }


@router.get("/{session_id}", response_model=dict)
async def get_meeting(session_id: str, client_id: str = Query(default="")) -> dict[str, Any]:
    """Retrieve a meeting session by ID."""
    # Check active workflow first
    wf = get_workflow(session_id)
    if wf:
        return {
            "session_id": session_id,
            "client_id": wf.client_id,
            "advisor_id": wf.advisor_id,
            "status": wf.state.status.value,
            "transcript": wf.state.full_transcript,
            "sentiment": wf.state.sentiment,
            "recommendations": wf.state.approved_recommendations,
            "summary": wf.state.summary,
            "active": True,
        }

    # Load from Cosmos
    if not client_id:
        raise HTTPException(400, "client_id required for completed sessions")
    store = get_cosmos_store()
    session = await store.get_session(session_id, client_id)
    if not session:
        raise HTTPException(404, "Meeting session not found")
    return session


@router.get("/client/{client_id}", response_model=list)
async def list_client_meetings(client_id: str) -> list[dict[str, Any]]:
    """List all meeting sessions for a client."""
    store = get_cosmos_store()
    return await store.list_sessions_for_client(client_id)


@router.websocket("/{session_id}/ws")
async def meeting_websocket(websocket: WebSocket, session_id: str) -> None:
    """WebSocket endpoint for real-time meeting updates and audio streaming."""
    await websocket.accept()
    if session_id not in _ws_connections:
        _ws_connections[session_id] = []
    _ws_connections[session_id].append(websocket)

    # Per-connection Azure Speech SDK continuous recognizer.
    # Created lazily on first PCM audio_chunk; lives for the duration of the WS connection.
    push_stream: Any = None
    recognizer: Any = None
    loop = asyncio.get_running_loop()

    def _start_recognizer(first_speaker: str) -> tuple[Any, Any]:
        """Initialise Azure ConversationTranscriber for this WS session."""
        try:
            import azure.cognitiveservices.speech as speechsdk
            from backend.config import get_settings
            settings = get_settings()
            if not settings.azure_speech_key:
                return None, None
            speech_config = speechsdk.SpeechConfig(
                subscription=settings.azure_speech_key,
                region=settings.azure_speech_region,
            )
            speech_config.speech_recognition_language = "en-US"
            fmt = speechsdk.audio.AudioStreamFormat(
                samples_per_second=16000, bits_per_sample=16, channels=1
            )
            ps = speechsdk.audio.PushAudioInputStream(stream_format=fmt)
            ac = speechsdk.audio.AudioConfig(stream=ps)
            rec = speechsdk.transcription.ConversationTranscriber(
                speech_config=speech_config, audio_config=ac
            )
            ws_speaker_map: dict[str, str] = {}

            def on_transcribed(evt: Any) -> None:
                if evt.result.reason != speechsdk.ResultReason.RecognizedSpeech:
                    return
                text = evt.result.text.strip()
                if not text:
                    return
                role = _resolve_speaker_id(ws_speaker_map, getattr(evt.result, "speaker_id", ""))
                logger.info("speech_recognized session=%s speaker=%s text=%s", session_id, role, text[:80])

                async def _process() -> None:
                    try:
                        wf = get_workflow(session_id)
                        if not wf:
                            return
                        await _broadcast(session_id, {"type": "transcript_segment", "data": {
                            "text": text, "clean_text": text, "speaker_hint": role,
                        }})
                        try:
                            proc = await wf.process_transcript_chunk(raw_text=text, speaker_hint=role)
                            if proc.get("sentiment"):
                                await _broadcast(session_id, {"type": "sentiment_update", "data": proc["sentiment"]})
                            if proc.get("profile_updates"):
                                await _broadcast(session_id, {"type": "profile_update", "data": wf.state.profile_extractions})
                        except Exception as enrich_exc:
                            logger.warning("enrichment_failed session=%s error=%s", session_id, str(enrich_exc))
                    except Exception as exc:
                        logger.error("on_recognized_process_failed session=%s error=%s", session_id, str(exc))

                asyncio.run_coroutine_threadsafe(_process(), loop)

            rec.transcribed.connect(on_transcribed)
            rec.start_transcribing_async()
            logger.info("conversation_transcriber_started session=%s", session_id)
            return ps, rec
        except Exception as exc:
            logger.error("recognizer_start_failed error=%s", str(exc))
            return None, None

    try:
        await websocket.send_json({"type": "connected", "session_id": session_id})

        # Validate session exists — recover from Cosmos if backend hot-reloaded
        if await get_or_recover_workflow(session_id) is None:
            await websocket.send_json({"type": "session_expired", "session_id": session_id})
            return

        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)

            if msg.get("type") == "ping":
                await websocket.send_json({"type": "pong"})

            elif msg.get("type") == "audio_chunk":
                audio_b64 = msg.get("audio_base64", "")
                speaker   = msg.get("speaker_hint", "client")
                if not audio_b64:
                    continue

                audio_bytes = base64.b64decode(audio_b64)

                # Lazily create the continuous recognizer on the first PCM chunk
                if push_stream is None:
                    push_stream, recognizer = await asyncio.get_event_loop().run_in_executor(
                        None, _start_recognizer, speaker
                    )

                # Feed raw PCM into the stream; recognizer fires callbacks asynchronously
                if push_stream is not None:
                    await asyncio.get_event_loop().run_in_executor(
                        None, push_stream.write, audio_bytes
                    )

            elif msg.get("type") == "transcript_text":
                text    = msg.get("text", "").strip()
                speaker = msg.get("speaker_hint", "client")
                if text:
                    wf = get_workflow(session_id)
                    if wf:
                        proc = await wf.process_transcript_chunk(raw_text=text, speaker_hint=speaker)
                        seg_data = {**proc, "text": proc.get("clean_text", text)}
                        await _broadcast(session_id, {"type": "transcript_segment", "data": seg_data})
                        if proc.get("sentiment"):
                            await _broadcast(session_id, {"type": "sentiment_update", "data": proc["sentiment"]})
                        if proc.get("profile_updates"):
                            await _broadcast(session_id, {"type": "profile_update", "data": wf.state.profile_extractions})

    except WebSocketDisconnect:
        pass
    finally:
        # Close the push stream so the recognizer can flush remaining audio
        if push_stream is not None:
            try:
                push_stream.close()
            except Exception:
                pass
        if recognizer is not None:
            try:
                recognizer.stop_transcribing_async()
            except Exception:
                pass
        connections = _ws_connections.get(session_id, [])
        if websocket in connections:
            connections.remove(websocket)
