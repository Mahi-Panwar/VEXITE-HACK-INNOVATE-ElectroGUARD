from fastapi import APIRouter
from backend.app.schemas.analysis import AnalyzeRequest
from backend.app.services.gemini_service import (
    call_gemini, extract_json, OUTDOOR_SYSTEM, INDOOR_SYSTEM
)

router = APIRouter(prefix="/api/analyze", tags=["analyze"])

@router.post("/outdoor")
def analyze_outdoor(body: AnalyzeRequest):
    raw = call_gemini(
        system=OUTDOOR_SYSTEM,
        user_text="Analyze this electrical hazard photo and return the JSON described in your instructions.",
        image_b64=body.image_base64,
        media_type=body.media_type,
        max_tokens=700,
    )
    return extract_json(raw)

@router.post("/indoor")
def analyze_indoor(body: AnalyzeRequest):
    raw = call_gemini(
        system=INDOOR_SYSTEM,
        user_text="Triage this indoor electrical photo and return the JSON described in your instructions.",
        image_b64=body.image_base64,
        media_type=body.media_type,
        max_tokens=700,
    )
    return extract_json(raw)
