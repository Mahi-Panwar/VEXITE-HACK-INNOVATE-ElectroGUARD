from backend.app.routers.auth import router as auth_router
from backend.app.routers.analyze import router as analyze_router
from backend.app.routers.reports import router as reports_router
from backend.app.routers.leaderboard import router as leaderboard_router
from backend.app.routers.predict import router as predict_router
from backend.app.routers.health import router as health_router

__all__ = [
    "auth_router",
    "analyze_router",
    "reports_router",
    "leaderboard_router",
    "predict_router",
    "health_router",
]
