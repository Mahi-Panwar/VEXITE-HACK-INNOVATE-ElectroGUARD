from pydantic import BaseModel
from typing import Optional

class OTPRequest(BaseModel):
    phone: str

class OTPVerify(BaseModel):
    phone: str
    otp: str
    name: Optional[str] = None
