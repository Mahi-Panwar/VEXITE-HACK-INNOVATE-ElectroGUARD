import re
import json
import requests
from typing import Optional
from fastapi import HTTPException
from backend.app.core.config import GEMINI_API_KEY, GEMINI_URL

OUTDOOR_SYSTEM = """You are the diagnostic AI engine for ElectroGuard AI, a civic electrical-hazard reporting platform.
You will be shown a citizen-submitted photo of a possible electrical/grid fault (poles, transformers, wires, meters, panels).
Respond with STRICT JSON ONLY, no markdown fences, no prose outside the JSON, matching exactly this shape:
{
 "is_real_photo": boolean,
 "validation_notes": string,
 "fault_category": "Public Utility Grid" | "Indoor/Residential" | "Not Electrical",
 "identified_equipment": string,
 "fault_type": string,
 "severity": "Low" | "Moderate" | "High" | "Emergency",
 "manpower": string,
 "heavy_equipment": string,
 "tools_and_parts": string,
 "safety_advisory": string
}
Be technical, concise, and safety-first. If the image is not a genuine photo of real electrical equipment, set is_real_photo to false, explain briefly in validation_notes, and still fill the other fields with your best-effort assessment or "N/A"."""

INDOOR_SYSTEM = """You are the indoor triage AI engine for ElectroGuard AI.
You will be shown a photo of a home electrical issue (breaker panel, socket, wiring, appliance).
Respond with STRICT JSON ONLY, no markdown fences, matching exactly this shape:
{
 "is_real_photo": boolean,
 "validation_notes": string,
 "identified_issue": string,
 "risk_level": "Low" | "High",
 "reasoning": string,
 "diy_steps": [string, string, string],
 "emergency_message": string
}
Use risk_level "Low" only for clearly safe, reversible issues like a tripped breaker or a loose plug. Use "High" for anything involving scorching, burning smell, sparking, exposed live wire, or visible fire risk.
If risk_level is "Low", diy_steps must contain exactly 3 short, safe, actionable steps and emergency_message should be an empty string.
If risk_level is "High", emergency_message must be a firm one-sentence instruction to cut power at the main breaker immediately, and diy_steps can be an empty array."""


def call_gemini(system: str, user_text: str, image_b64: Optional[str] = None,
                 media_type: Optional[str] = None, max_tokens: int = 700) -> str:
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="GEMINI_API_KEY is not configured on the server. "
                   "Set it as an environment variable and restart the API.",
        )
    parts = []
    if image_b64:
        parts.append({
            "inline_data": {
                "mime_type": media_type or "image/jpeg",
                "data": image_b64
            }
        })
    parts.append({"text": user_text})

    resp = requests.post(
        GEMINI_URL,
        headers={"Content-Type": "application/json"},
        json={
            "contents": [{"parts": parts}],
            "systemInstruction": {"parts": [{"text": system}]},
            "generationConfig": {"maxOutputTokens": max_tokens}
        },
        timeout=60,
    )
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Gemini API error: {resp.status_code} {resp.text[:300]}")
    data = resp.json()
    try:
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Unexpected Gemini response structure: {str(e)}")


def extract_json(raw: str) -> dict:
    if not raw:
        raise HTTPException(status_code=502, detail="Empty AI response")
    cleaned = raw.strip()
    cleaned = re.sub(r"^```json", "", cleaned, flags=re.I).strip()
    cleaned = re.sub(r"^```", "", cleaned).strip()
    cleaned = re.sub(r"```$", "", cleaned).strip()
    first, last = cleaned.find("{"), cleaned.rfind("}")
    if first >= 0 and last > first:
        cleaned = cleaned[first:last + 1]
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=502, detail=f"AI returned invalid JSON: {e}")
