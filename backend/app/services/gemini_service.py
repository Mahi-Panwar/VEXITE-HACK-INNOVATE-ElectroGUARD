import re
import json
import requests
from typing import Optional
from fastapi import HTTPException
from backend.app.core.config import GEMINI_API_KEY, GEMINI_URL

OUTDOOR_SYSTEM = """You are the diagnostic AI engine for ElectroGuard AI, a civic electrical-hazard reporting platform.
You will be shown a citizen-submitted photo of a possible electrical/grid fault (poles, transformers, wires, meters, panels).

STRICT AUTHENTICITY EVALUATION RULES:
1. Carefully inspect the photo to verify if it is a genuine, live, real-world photograph of actual electrical infrastructure equipment (utility poles, transformers, power lines, meters, panels, circuit breakers, sub-station hardware).
2. If the image is a photo of a computer/mobile screen, a digital drawing/sketch, an AI-generated image, meme, text, or does NOT contain real electrical grid equipment (e.g. pets, people, furniture, landscapes, cars), YOU MUST SET "is_real_photo": false.
3. If "is_real_photo" is false:
   - Set "validation_notes" to a direct explanation (e.g., "Photo is a screen capture of a computer monitor", "No electrical grid equipment detected in image", "Image is a non-electrical object/drawing").
   - Set "fault_category" to "Not Electrical".
   - Set "severity" to "Low".
   - Set "safety_advisory" to "No electrical hazard detected. Submission failed authenticity check."

Respond with STRICT JSON ONLY, matching exactly this shape:
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
}"""

INDOOR_SYSTEM = """You are the indoor triage AI engine for ElectroGuard AI.
You will be shown a photo of a home electrical issue (breaker panel, socket, wiring, appliance).

STRICT AUTHENTICITY RULES:
1. Verify if the photo is a real home electrical issue. If it's a photo of a screen, drawing, non-electrical item, or meme, set "is_real_photo": false and explain in validation_notes.

Respond with STRICT JSON ONLY, matching exactly this shape:
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
                "temperature": 0.1
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
    if not raw:
        return ""
    cleaned = raw.strip()
    cleaned = re.sub(r"^```json\s*", "", cleaned, flags=re.I).strip()
    cleaned = re.sub(r"^```\s*", "", cleaned).strip()
    cleaned = re.sub(r"```$", "", cleaned).strip()
    
    first, last = cleaned.find("{"), cleaned.rfind("}")
    if first >= 0 and last > first:
        cleaned = cleaned[first:last + 1]

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

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    try:
        sanitized = re.sub(r",\s*([}\]])", r"\1", cleaned)
        return json.loads(sanitized)
    except json.JSONDecodeError:
        pass

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
