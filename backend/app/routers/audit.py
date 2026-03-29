"""Audit Trail Router — paginated query of every agent action."""
from __future__ import annotations

import logging
from typing import Any, Optional

from fastapi import APIRouter, Query

from backend.app.persistence.cosmos_store import get_cosmos_store

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/log", response_model=list)
async def audit_log(
    client_id: Optional[str] = Query(default=None),
    session_id: Optional[str] = Query(default=None),
    advisor_id: Optional[str] = Query(default=None),
    event_type: Optional[str] = Query(default=None),
    limit: int = Query(default=50, le=500),
    offset: int = Query(default=0, ge=0),
) -> list[dict[str, Any]]:
    """
    Paginated audit log with optional filters.
    Returns entries sorted by timestamp DESC.

    When filtering by client_id, also pulls in audit entries that were
    logged under linked prospect client_ids (e.g. "prospect-XXXX" before
    a session was promoted to a permanent CRM client record).
    """
    store = get_cosmos_store()
    extra_cids: list[str] = []
    if client_id:
        # Collect all sessions associated with this client (including via linked_client_id)
        # and extract any prospect client_ids from those sessions.
        sessions = await store.list_sessions_for_client(client_id)
        for s in sessions:
            cid = s.get("client_id", "")
            if cid and cid != client_id:
                extra_cids.append(cid)
    return await store.query_audit_log(
        client_id=client_id,
        extra_client_ids=extra_cids or None,
        session_id=session_id,
        advisor_id=advisor_id,
        event_type=event_type,
        limit=limit,
        offset=offset,
    )


@router.get("/session/{session_id}", response_model=list)
async def session_audit(session_id: str) -> list[dict[str, Any]]:
    """Full audit trail for a single meeting session."""
    store = get_cosmos_store()
    return await store.query_audit_log(session_id=session_id, limit=500)


@router.get("/client/{client_id}", response_model=list)
async def client_audit(
    client_id: str,
    limit: int = Query(default=100, le=500),
) -> list[dict[str, Any]]:
    """Full audit trail for a client (all sessions, all agents)."""
    store = get_cosmos_store()
    sessions = await store.list_sessions_for_client(client_id)
    extra_cids = [s.get("client_id", "") for s in sessions if s.get("client_id") != client_id]
    return await store.query_audit_log(client_id=client_id, extra_client_ids=extra_cids or None, limit=limit)


@router.get("/agent/{run_id}", response_model=list)
async def agent_run_audit(run_id: str) -> list[dict[str, Any]]:
    """All audit entries tagged to a specific agent run."""
    store = get_cosmos_store()
    return await store.query_audit_log(
        event_type=None, limit=500
    )
