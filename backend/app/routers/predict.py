from fastapi import APIRouter, HTTPException
from backend.app.schemas.predict import PredictRequest
from backend.app.core.config import SECTORS
from backend.app.core.database import db
from backend.app.services.gemini_service import call_gemini

router = APIRouter(prefix="/api/predict", tags=["predict"])

@router.post("")
@router.post("/")
def predict(body: PredictRequest):
    if body.sector not in SECTORS:
        raise HTTPException(status_code=400, detail=f"sector must be one of {SECTORS}")
    with db() as conn:
        fault_count = conn.execute(
            "SELECT COUNT(*) c FROM reports WHERE sector=? AND merged_into IS NULL", (body.sector,)
        ).fetchone()["c"]
    wind_score = min(body.wind / 90, 1) * 40
    rain_score = min(body.rain / 40, 1) * 30
    fault_score = min(fault_count / 6, 1) * 30
    total = min(round(wind_score + rain_score + fault_score), 99)
    level = "Emergency" if total >= 70 else "High" if total >= 45 else "Moderate" if total >= 22 else "Low"
    return {"sector": body.sector, "risk": total, "level": level, "faultCount": fault_count}


@router.post("/briefing")
def predict_briefing(body: PredictRequest):
    pred = predict(body)
    raw = call_gemini(
        system=(
            "You are a grid operations analyst for ElectroGuard AI. Given weather and fault data "
            "for one sector, write a single short paragraph (max 60 words) recommending a "
            "preventive action. Be direct and operational, no markdown, no JSON, plain text only."
        ),
        user_text=(
            f"Sector: {body.sector}. Wind: {body.wind} km/h. Rainfall: {body.rain} mm/hr. "
            f"Micro-fault reports on file: {pred['faultCount']}. Computed outage risk: {pred['risk']}%. "
            "Write the briefing."
        ),
        max_tokens=200,
    )
    return {**pred, "briefing": raw.strip()}
