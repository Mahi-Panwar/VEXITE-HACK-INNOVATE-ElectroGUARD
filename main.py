"""
ElectroGuard AI — Root Application Entry Point
Report Any Fault. Dispatch Instantly. Predict Outages. Zero Delay.
Delegates application setup to backend.app.main:app
"""

from backend.app.main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
