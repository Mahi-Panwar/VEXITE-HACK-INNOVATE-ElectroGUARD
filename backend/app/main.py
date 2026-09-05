import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.app.core.database import init_db
from backend.app.core.config import ROOT_DIR
from backend.app.routers import (
    auth_router,
    analyze_router,
    reports_router,
    leaderboard_router,
    predict_router,
    health_router,
)

# Initialize database on startup
init_db()

app = FastAPI(title="ElectroGuard AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(analyze_router)
app.include_router(reports_router)
app.include_router(leaderboard_router)
app.include_router(predict_router)
app.include_router(health_router)

# Mount static frontend directory and asset shortcuts
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")
if os.path.exists(FRONTEND_DIR):
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")
    css_dir = os.path.join(FRONTEND_DIR, "css")
    js_dir = os.path.join(FRONTEND_DIR, "js")
    if os.path.exists(css_dir):
        app.mount("/css", StaticFiles(directory=css_dir), name="css")
    if os.path.exists(js_dir):
        app.mount("/js", StaticFiles(directory=js_dir), name="js")

@app.get("/")
def serve_index():
    index_file = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    fallback = os.path.join(ROOT_DIR, "index.html")
    return FileResponse(fallback)
