import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ROOT_DIR = os.path.dirname(BASE_DIR)

DB_PATH = os.environ.get("DB_PATH", os.path.join(ROOT_DIR, "electroguard.db"))
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")

CUSTOM_GEMINI_URL = os.environ.get("GEMINI_URL", "").strip()

if CUSTOM_GEMINI_URL:
    GEMINI_URL = CUSTOM_GEMINI_URL
    if "{GEMINI_API_KEY}" in GEMINI_URL:
        GEMINI_URL = GEMINI_URL.replace("{GEMINI_API_KEY}", GEMINI_API_KEY)
    elif "key=" not in GEMINI_URL and GEMINI_API_KEY:
        sep = "&" if "?" in GEMINI_URL else "?"
        GEMINI_URL = f"{GEMINI_URL}{sep}key={GEMINI_API_KEY}"
else:
    GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"

SECTORS = ["Sector 1", "Sector 2", "Sector 3", "Sector 4", "Sector 5", "Sector 6"]
DEDUP_RADIUS_M = 50
POINTS_PER_REPORT = 100
DEMO_OTP = "123456"
