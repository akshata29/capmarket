"""Health-check router."""
from __future__ import annotations

import time
from typing import Any

from fastapi import APIRouter

from backend.app.persistence.cosmos_store import get_cosmos_store
from backend.config import get_settings

router = APIRouter()
_START = time.time()


@router.get("", response_model=dict)
async def health() -> dict[str, Any]:
    settings = get_settings()
    cosmos_ok = False
    try:
        store = get_cosmos_store()
        cosmos_ok = store.client is not None
    except Exception:
        pass

    return {
        "status": "ok",
        "uptime_seconds": round(time.time() - _START, 1),
        "cosmos": "connected" if cosmos_ok else "unavailable",
        "foundry_project": settings.foundry_project_endpoint,
        "environment": settings.environment,
    }
