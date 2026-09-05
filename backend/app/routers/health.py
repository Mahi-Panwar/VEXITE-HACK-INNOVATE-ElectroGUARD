from fastapi import APIRouter
from backend.app.core.config import GEMINI_API_KEY, SECTORS

router = APIRouter(prefix="/api", tags=["health"])

@router.get("/health")
def health():
    return {
        "status": "ok",
        "gemini_configured": bool(GEMINI_API_KEY),
        "sectors": SECTORS
    }
