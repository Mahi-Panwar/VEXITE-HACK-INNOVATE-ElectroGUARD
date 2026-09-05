from fastapi import APIRouter
from backend.app.core.database import db

router = APIRouter(prefix="/api", tags=["leaderboard"])

@router.get("/leaderboard")
def leaderboard(limit: int = 10):
    with db() as conn:
        rows = conn.execute(
            "SELECT id, name, points FROM users ORDER BY points DESC LIMIT ?", (limit,)
        ).fetchall()
        return [dict(r) for r in rows]
