import time
import hashlib
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.app.schemas.auth import OTPRequest, OTPVerify
from backend.app.core.helpers import OTP_STORE
from backend.app.core.config import DEMO_OTP
from backend.app.core.database import db

router = APIRouter(prefix="/api/auth", tags=["auth"])

class DirectLoginRequest(BaseModel):
    phone: str
    name: Optional[str] = None

@router.post("/login")
def direct_login(body: DirectLoginRequest):
    if not body.phone or not body.phone.strip():
        raise HTTPException(status_code=400, detail="Phone number is required.")
    user_id = "u_" + hashlib.sha256(body.phone.strip().encode()).hexdigest()[:10]
    with db() as conn:
        row = conn.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
        if row is None:
            name = body.name.strip() if (body.name and body.name.strip()) else f"Citizen {user_id[-4:].upper()}"
            conn.execute(
                "INSERT INTO users (id, phone, name, points, created_at) VALUES (?,?,?,0,?)",
                (user_id, body.phone.strip(), name, int(time.time())),
            )
            points = 0
            name_out = name
        else:
            if body.name and body.name.strip():
                conn.execute("UPDATE users SET name=? WHERE id=?", (body.name.strip(), user_id))
                name_out = body.name.strip()
            else:
                name_out = row["name"]
            points = row["points"]
    return {"userId": user_id, "name": name_out, "points": points}


@router.post("/request-otp")
def request_otp(body: OTPRequest):
    OTP_STORE[body.phone] = DEMO_OTP
    return {"sent": True, "message": "Instant login ready."}


@router.post("/verify-otp")
def verify_otp(body: OTPVerify):
    # Direct login fallback so OTP verification is not required
    return direct_login(DirectLoginRequest(phone=body.phone, name=body.name))
