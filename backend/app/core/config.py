import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ROOT_DIR = os.path.dirname(BASE_DIR)

DB_PATH = os.environ.get("DB_PATH", os.path.join(ROOT_DIR, "electroguard.db"))
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"

SECTORS = ["Sector 1", "Sector 2", "Sector 3", "Sector 4", "Sector 5", "Sector 6"]
DEDUP_RADIUS_M = 50
POINTS_PER_REPORT = 100
DEMO_OTP = "123456"
