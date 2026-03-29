"""
Capmarket Wealth Advisor Platform — FastAPI backend entry point.

Architecture
────────────
This service powers the full advisor-to-client lifecycle:
  • Meeting Intelligence  — live transcription, sentiment, profile extraction,
                            recommendations, summaries, PII redaction
  • Client Intelligence   — CRM profiles, risk profiling, goals, documents
  • Portfolio Intelligence — theme discovery, universe mapping, construction,
                            backtesting, rebalancing, human-in-the-loop gates
  • Advisory Intelligence — pre-meeting prep, tax strategies, relationship ideas
  • Client Service Agent  — 24/7 team-member agent for clients (portfolio, news,
                            documents, performance attribution)
  • Audit & Compliance    — full conversation + agent audit trail

Every module is an Azure AI Foundry Agent v2 (Responses API) orchestrated by
Microsoft Agent Framework (MAF) with human-in-the-loop checkpoints persisted
to Azure Cosmos DB.
"""
from __future__ import annotations

import asyncio
import logging
import warnings

warnings.filterwarnings("ignore", category=FutureWarning)

from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.routers import (
    audit_router,
    meetings_router,
    clients_router,
    portfolio_router,
    advisory_router,
    client_assistant_router,
    health_router,
)
from backend.app.infra.settings import get_settings
from backend.app.persistence.cosmos_store import get_cosmos_store

# basicConfig is a no-op when uvicorn has already set up root logger handlers.
# Explicitly set INFO on our own namespace so background task logs are visible.
logging.getLogger("backend").setLevel(logging.INFO)

# Suppress chatty Azure/HTTP SDK loggers — only show warnings+
for _noisy in (
    "azure.core.pipeline.policies.http_logging_policy",
    "azure.core.pipeline.policies.retry",
    "azure.identity",
    "azure.identity._internal",
    "azure.cosmos",
    "azure.ai.projects",
    "urllib3",
    "httpcore",
    "httpx",
):
    logging.getLogger(_noisy).setLevel(logging.WARNING)

structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="ISO"),
        structlog.dev.ConsoleRenderer(),
    ]
)
logger = structlog.get_logger(__name__)

_WATCH_CYCLE_INTERVAL_SECONDS = 30 * 60  # 30 minutes


async def _portfolio_watch_scheduler() -> None:
    """Background task: run the 3-agent watch cycle for all active portfolios.

    Runs every 30 minutes. Scans Cosmos for all portfolios with status='approved',
    then for each portfolio runs: NewsAgent + MarketRegimeAgent (parallel) →
    RiskAdvisoryAgent. Results are persisted back to the portfolio document so
    the next call to /watch returns fresh autonomous intelligence.
    """
    from backend.app.orchestration.portfolio_workflow import PortfolioWorkflow

    logger.info("watch_scheduler_started", interval_min=_WATCH_CYCLE_INTERVAL_SECONDS // 60)

    # Initial delay — let the app finish startup before the first heavy run
    await asyncio.sleep(60)

    while True:
        try:
            store = get_cosmos_store()
            portfolios: list[Any] = await store.query(
                "portfolios",
                "SELECT * FROM c WHERE c.status = 'approved'",
                [],
            )
            logger.info("watch_scheduler_tick", portfolios=len(portfolios))

            for portfolio in portfolios:
                pid = portfolio.get("proposal_id") or portfolio.get("id") or ""
                cid = portfolio.get("client_id") or ""
                aid = portfolio.get("advisor_id") or "system"
                if not pid or not cid:
                    continue
                try:
                    client = await store.get_client(cid, aid)
                    client_profile: dict[str, Any] = client or {"client_id": cid}

                    wf = PortfolioWorkflow(
                        client_id=cid,
                        advisor_id=aid,
                        mandate=portfolio.get("mandate", "balanced"),
                        investment_amount=float(portfolio.get("investment_amount", 50_000)),
                    )
                    snapshot, news_history = await wf.run_watch_cycle(portfolio, client_profile)

                    portfolio["last_watch_cycle"] = snapshot["cycle_at"]
                    portfolio["last_watch_snapshot"] = snapshot
                    portfolio["news_history"] = news_history
                    existing_snaps: list[Any] = portfolio.get("watch_snapshots", []) or []
                    existing_snaps.append(snapshot)
                    portfolio["watch_snapshots"] = existing_snaps[-20:]
                    await store.save_portfolio(portfolio)

                    logger.info("watch_cycle_persisted", portfolio_id=pid,
                                regime=snapshot.get("regime", {}).get("regime", "?"))
                except Exception as exc:
                    logger.warning("watch_cycle_portfolio_error",
                                   portfolio_id=pid, error=str(exc))

        except asyncio.CancelledError:
            logger.info("watch_scheduler_cancelled")
            raise
        except Exception as exc:
            logger.warning("watch_scheduler_tick_error", error=str(exc))

        await asyncio.sleep(_WATCH_CYCLE_INTERVAL_SECONDS)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logger.info("startup", app="capmarket-advisor", env=settings.cosmos_db_database)
    # Warm up Cosmos DB connection
    try:
        store = get_cosmos_store()
        await store.ensure_containers()
        logger.info("cosmos_ready")
    except Exception as exc:
        logger.warning("cosmos_init_failed", error=str(exc))

    # Start autonomous portfolio watch cycle (every 30 minutes)
    scheduler_task = asyncio.create_task(_portfolio_watch_scheduler())

    yield

    scheduler_task.cancel()
    try:
        await scheduler_task
    except asyncio.CancelledError:
        pass
    logger.info("shutdown")


app = FastAPI(
    title="Capmarket Wealth Advisor Platform",
    description=(
        "End-to-end AI-augmented wealth advisory platform. "
        "Meeting intelligence, client profiling, portfolio construction, "
        "advisory intelligence, and 24/7 client service — all powered by "
        "Azure AI Foundry Agents v2 orchestrated via Microsoft Agent Framework."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(health_router, prefix="/api/health", tags=["Health"])
app.include_router(meetings_router, prefix="/api/meetings", tags=["Meeting Intelligence"])
app.include_router(clients_router, prefix="/api/clients", tags=["Client Intelligence"])
app.include_router(portfolio_router, prefix="/api/portfolio", tags=["Portfolio Intelligence"])
app.include_router(advisory_router, prefix="/api/advisory", tags=["Advisory Intelligence"])
app.include_router(client_assistant_router, prefix="/api/assistant", tags=["Client Service Agent"])
app.include_router(audit_router, prefix="/api/audit", tags=["Audit & Compliance"])


@app.get("/")
async def root():
    return {
        "service": "Capmarket Wealth Advisor Platform",
        "version": "1.0.0",
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "modules": [
            "meeting-intelligence",
            "client-intelligence",
            "portfolio-intelligence",
            "advisory-intelligence",
            "client-service-agent",
            "audit-compliance",
        ],
    }
