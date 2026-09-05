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
 "is_real_photo": true,
 "validation_notes": "Genuine photograph of a public utility pole with loose transformer wiring.",
 "fault_category": "Public Utility Grid",
 "identified_equipment": "Distribution Pole & Step-Down Transformer",
 "fault_type": "Sparking Feeder Wire & Insulator Damage",
 "severity": "High",
 "manpower": "3 Linesmen, 1 Safety Supervisor",
 "heavy_equipment": "Insulated Bucket Truck",
 "tools_and_parts": "25kV Surge Arrester, Rubber Shielding, Line Clamp",
 "safety_advisory": "Keep 10 metres back. Do not approach standing water near the base of the pole."
}
Be technical, concise, and safety-first. If the image is not a genuine photo of real electrical equipment, set is_real_photo to false, explain briefly in validation_notes, and still fill the other fields with your best-effort assessment or "N/A"."""

INDOOR_SYSTEM = """You are the indoor triage AI engine for ElectroGuard AI.
You will be shown a photo of a home electrical issue (breaker panel, socket, wiring, appliance).
Respond with STRICT JSON ONLY, no markdown fences, matching exactly this shape:
{
 "is_real_photo": true,
 "validation_notes": "Genuine photo of a wall power socket.",
 "identified_issue": "Tripped MCB Circuit Breaker",
 "risk_level": "Low",
 "reasoning": "No visible smoke, scorching, or melted plastic observed on panel.",
 "diy_steps": ["Locate your main distribution panel", "Identify the tripped breaker switch in OFF position", "Switch it firmly back to the ON position"],
 "emergency_message": ""
}
Use risk_level "Low" only for clearly safe, reversible issues like a tripped breaker or a loose plug. Use "High" for anything involving scorching, burning smell, sparking, exposed live wire, or visible fire risk.
If risk_level is "Low", diy_steps must contain exactly 3 short, safe, actionable steps and emergency_message should be an empty string.
If risk_level is "High", emergency_message must be a firm one-sentence instruction to cut power at the main breaker immediately, and diy_steps can be an empty array."""


def call_gemini(system: str, user_text: str, image_b64: Optional[str] = None,
                 media_type: Optional[str] = None, max_tokens: int = 1500) -> str:
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
            "generationConfig": {
                "maxOutputTokens": max_tokens,
                "responseMimeType": "application/json",
                "temperature": 0.2
            }
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


def clean_json_string(raw: str) -> str:
    """Cleans markdown fences, control characters, and unescaped newlines inside JSON strings."""
    if not raw:
        return ""
    cleaned = raw.strip()
    cleaned = re.sub(r"^```json\s*", "", cleaned, flags=re.I).strip()
    cleaned = re.sub(r"^```\s*", "", cleaned).strip()
    cleaned = re.sub(r"```$", "", cleaned).strip()
    
    first, last = cleaned.find("{"), cleaned.rfind("}")
    if first >= 0 and last > first:
        cleaned = cleaned[first:last + 1]

    # Fix unescaped newlines and tabs inside quoted string literals
    def fix_newlines_in_quotes(match):
        s = match.group(0)
        s = s.replace("\n", "\\n").replace("\r", "\\r").replace("\t", "\\t")
        return s

    cleaned = re.sub(r'"([^"\\]|\\.)*"', fix_newlines_in_quotes, cleaned, flags=re.DOTALL)
    return cleaned


def extract_json(raw: str) -> dict:
    if not raw:
        raise HTTPException(status_code=502, detail="Empty AI response")
    
    cleaned = clean_json_string(raw)

    # First attempt: direct JSON load
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Second attempt: remove invalid trailing commas or control characters
    try:
        sanitized = re.sub(r",\s*([}\]])", r"\1", cleaned)
        return json.loads(sanitized)
    except json.JSONDecodeError:
        pass

    # Third attempt: repair truncated string quotes
    try:
        repaired = cleaned
        if not repaired.endswith("}"):
            if not repaired.endswith('"'):
                repaired += '"'
            repaired += "}"
        return json.loads(repaired)
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=502,
            detail=f"AI returned invalid JSON: {e}. Raw content preview: {raw[:150]}"
        )
