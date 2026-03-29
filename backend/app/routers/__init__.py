from backend.app.routers.meetings import router as meetings_router
from backend.app.routers.clients import router as clients_router
from backend.app.routers.portfolio import router as portfolio_router
from backend.app.routers.advisory import router as advisory_router
from backend.app.routers.client_assistant import router as client_assistant_router
from backend.app.routers.audit import router as audit_router
from backend.app.routers.health import router as health_router

__all__ = [
    "meetings_router",
    "clients_router",
    "portfolio_router",
    "advisory_router",
    "client_assistant_router",
    "audit_router",
    "health_router",
]
