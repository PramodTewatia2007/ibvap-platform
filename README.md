# IBVAP — Intelligent Border Video Analytics Platform

[![CI](https://github.com/PramodTewatia2007/ibvap-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/PramodTewatia2007/ibvap-platform/actions/workflows/ci.yml)

A software-defined intelligent surveillance platform designed to transform existing IP-based CCTV infrastructure into an AI-enabled monitoring system for Border Outposts (BOPs), checkpoints, border roads, and strategic installations.

---

## Key Features & Capabilities

- **Multi-Camera Tactical Matrix**: Real-time multi-grid CCTV surveillance viewing with low-latency synthetic and RTSP streaming.
- **Intelligent Object Tracking**: Person and vehicle bounding boxes with temporary centroid identifiers.
- **Automatic Number Plate Recognition (ANPR)**: Automatic vehicle classification, license plate OCR, and jurisdictional parsing.
- **Virtual Restricted Zone Breaches**: Polygonal fence definition with ray-casting point-in-polygon intrusion alerts.
- **Night-Time Movement Detection**: Automated schedules for unauthorized human perimeter crossings.
- **Incident Investigation & Triage**: Complete workflow (New -> Acknowledged -> Under Review -> Escalated -> Resolved / False Positive) with operator investigation notes and tamper-resistant evidence snapshots.
- **Biometric Safeguards**: Face detection logging with facial recognition disabled by default according to regulatory frameworks.
- **Command & Control (C2) Gateway**: Open REST & WebSocket telemetry interfaces for C2 integration.
- **Audit Logging**: Full audit trail recording all administrative actions.

---

## Architecture Overview

1. **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide icons, Recharts, and WebSockets.
2. **Backend**: Python 3.12, FastAPI, SQLAlchemy 2.0 (async), Pydantic v2, and OpenCV.
3. **AI Video Engine**: OpenCV video ingestion, object tracking, ray-casting polygon math, and background stream workers.
4. **Storage & Evidence**: SQLite with async `aiosqlite` (or PostgreSQL) and local/S3-compatible evidence vault.

---

## Local Development & Setup

### Prerequisites
- Python 3.12+ (or `uv`)
- Node.js 20+ and npm

### 1. Backend Setup
```bash
cd backend
# Create virtual environment
uv venv --python 3.12
# Activate virtual environment
# Windows: .venv\Scripts\activate
# Linux/macOS: source .venv/bin/activate
uv pip install -r requirements.txt

# Run automated tests
pytest -v

# Start FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
# The application will be accessible at http://localhost:5173
```

---

## Production Deployment via Docker Compose

```bash
docker-compose up --build -d
```
Access the web command interface at `http://localhost`.

---

## Cloud Deployment on Render

Deploy IBVAP directly to [Render](https://render.com/) with 1-click using the included **Render Blueprint (`render.yaml`)** or unified **`Dockerfile`**:

1. Fork or push this repository to GitHub (`PramodTewatia2007/ibvap-platform`).
2. Log into the **[Render Dashboard](https://dashboard.render.com/)**.
3. Click **New +** > **Blueprint**.
4. Select your repository `PramodTewatia2007/ibvap-platform` and click **Apply**.
5. Render will build the unified multi-stage container and deploy the app with automatic SSL and zero CORS issues on the Free Tier.

For detailed configurations, manual setup, and environment variables, see **[RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)**.

---

## Default User Accounts (Pre-Seeded)

- **Super Administrator**: `admin` / `Admin@12345` (Full platform configuration)
- **Monitoring Operator**: `operator` / `Operator@123` (Surveillance monitoring & incident triage)

---

## License & Compliance
Designed in compliance with standard border security operational protocols and data privacy safeguards.
