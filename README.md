<<<<<<< HEAD
# VEXITE-HACK-INNOVATE-ElectroGUARD
=======
# ElectroGuard AI ⚡

**Report Any Fault. Dispatch Instantly. Predict Outages. Zero Delay.**

ElectroGuard AI is an intelligent civic and utility electrical fault management platform powered by Google Gemini API's multimodal vision and predictive capabilities. It empowers citizens and utility operators to detect hazards, verify report authenticity, size repair crew manifests, enforce AR camera danger boundaries, predict weather-driven power outages, and triage home electrical safety issues.

---

## 🌟 Key Features

1. **Multimodal Vision Scanner & AR Safety Bubble**:
   - Analyzes photos to reject fake/screen-captured images while calculating exact repair crew size, heavy machinery, tools, and replacement parts.
   - Overlays a live pulsing AR danger boundary ("KEEP 10M BACK") on the camera view to protect citizens.

2. **Smart Predictive Outage Engine**:
   - Correlates weather inputs (wind speed, rainfall intensity) with sector fault density to forecast grid outage risks before failures happen.
   - Generates automated operational briefings for pre-dispatching emergency line crews.

3. **Indoor Assistant (DIY Fix vs. Electrician Match)**:
   - Low-Risk (Tripped Breakers): Interactive step-by-step guidance for safe fixes.
   - High-Risk (Scorched Sockets/Sparking): Immediate "Kill Main Switch" emergency alert and dispatch matching with certified local electricians.

4. **Geospatial Geo-Deduplication & Civic Rewards**:
   - Checks GPS coordinates using Haversine distance formula (50m radius) to prevent duplicate reports.
   - Awards 100 Civic Points to the first verified reporter to climb the community leaderboard.

5. **Utility Operations Dashboard**:
   - Administrative console displaying live sector risk metrics, verified hazard queues, severity filters, and crew/tool dispatch manifests.

---

## 🏗️ Clean Project Architecture

```
ElectroGuide/
├── backend/                  # FastAPI Backend Architecture
│   ├── app/
│   │   ├── core/            # Config, SQLite DB connections, Haversine helpers
│   │   ├── routers/         # API Endpoint Routers (auth, analyze, reports, predict, leaderboard, health)
│   │   ├── schemas/         # Data validation models (Pydantic)
│   │   ├── services/        # Gemini AI vision & prediction service
│   │   └── main.py          # FastAPI application instantiation & static mounting
│   └── __init__.py
├── frontend/                 # Modular Web Application
│   ├── css/
│   │   ├── base.css         # Typography, reset, buttons, badges
│   │   ├── components.css   # Cards, topbar, tabs, AR overlay, risk meter, tables
│   │   └── variables.css    # Color palette & design tokens
│   ├── js/
│   │   ├── api.js           # API client service layer
│   │   ├── app.js           # Main application coordinator
│   │   ├── config.js        # Constants & system prompts
│   │   ├── icons.js         # SVG icon registry
│   │   ├── state.js         # Reactive global state store
│   │   ├── utils.js         # Toast notifications, Haversine, image compression
│   │   └── views/           # UI Tab Modules
│   │       ├── home.js      # Hero & feature showcase
│   │       ├── indoor.js    # Indoor triage & electrician matching
│   │       ├── ops.js       # Utility ops dashboard & severity filter
│   │       ├── predict.js   # Outage predictor & risk meter
│   │       ├── report.js    # AR hazard reporter & camera overlay
│   │       └── rewards.js   # Civic points & leaderboard
│   └── index.html           # HTML5 Frame
├── main.py                   # Root entry point delegating to backend.app.main:app
├── requirements.txt          # Python dependencies
└── Dockerfile                # Docker container deployment setup
```

---

## 🚀 Quick Start & Installation

### 1. Local Python Setup
```bash
# Clone the repository and navigate to project directory
cd ElectroGuide

# Install dependencies
pip install -r requirements.txt

# Set Gemini API Key (optional for AI vision features)
export GEMINI_API_KEY=your_gemini_api_key_here  # On Linux/macOS
set GEMINI_API_KEY=your_gemini_api_key_here     # On Windows CMD
$env:GEMINI_API_KEY="your_gemini_api_key_here"  # On Windows PowerShell

# Launch server
python -m uvicorn main:app --reload --port 8000
```
Open your browser at `http://127.0.0.1:8000` to launch ElectroGuard AI.

### 2. Docker Deployment
```bash
docker build -t electroguard-ai .
docker run -p 8000:8000 -e GEMINI_API_KEY=your_api_key electroguard-ai
```

---

## 📡 API Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status & Gemini configuration |
| `POST` | `/api/auth/request-otp` | Request phone OTP code |
| `POST` | `/api/auth/verify-otp` | Verify OTP code & authenticate user |
| `POST` | `/api/analyze/outdoor` | AI vision diagnostic for outdoor electrical hazards |
| `POST` | `/api/analyze/indoor` | AI triage for indoor home electrical issues |
| `POST` | `/api/reports` | Submit report with 50m spatial deduplication check |
| `GET` | `/api/reports` | List all verified reports with optional severity/sector filters |
| `GET` | `/api/sectors/summary` | Summary of report counts and worst severity per sector |
| `GET` | `/api/leaderboard` | Top citizens ranked by Civic Points |
| `POST` | `/api/predict` | Calculate sector outage risk percentage based on weather + fault density |
| `POST` | `/api/predict/briefing` | Generate AI grid operations briefing recommendation |

---

## 🛠️ Tech Stack

- **Backend**: Python 3.11, FastAPI, Pydantic v2, SQLite3, Uvicorn
- **Frontend**: Modular ES6 JavaScript, HTML5, CSS3 Custom Properties
- **AI Engine**: Google Gemini API (`gemini-2.5-flash`)
- **Containerization**: Docker
>>>>>>> 6dffcda (Add ElectroGuard AI frontend and backend codebase)
