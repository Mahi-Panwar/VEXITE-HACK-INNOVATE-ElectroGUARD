import math
import time
import random

OTP_STORE = {}  # In-memory phone -> otp mapping for demo

def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates geodesic distance in meters between two lat/lng pairs."""
    R = 6371000
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def gen_id(prefix: str = "id") -> str:
    """Generates a unique timestamped ID string."""
    return f"{prefix}_{int(time.time()*1000):x}_{random.randint(100,999)}"
