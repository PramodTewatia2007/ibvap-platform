# 🚀 Deploying IBVAP on Render

This guide provides complete, step-by-step instructions for deploying the **Intelligent Border Video Analytics Platform (IBVAP)** on [Render](https://render.com/).

---

## 📌 Architecture Overview on Render

The production deployment runs as a **unified multi-stage container** combining:
- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, Lucide icons, and Recharts compiled into static assets.
- **Backend**: Python 3.12, FastAPI, OpenCV, SQLite with WAL mode, and real-time WebSockets.
- **Single Port Simplicity**: FastAPI serves the compiled SPA frontend on `/`, REST API on `/api/v1`, WebSocket telemetry on `/ws/surveillance`, and evidence snapshots on `/evidence`.

### Why Unified Architecture on Render?
| Benefit | Unified Container (Recommended) | Separate Containers |
|---|---|---|
| **Render Free Tier Cost** | **1 Service (Fits 100% in Free Tier)** | Requires 2 separate services (consumes double compute) |
| **CORS Configuration** | **Zero CORS issues** (Same origin) | Requires strict cross-origin header matching |
| **WebSocket Networking** | **Direct wss:// on port 443** | Needs cross-domain TLS proxying |
| **Sleep & Wake Latency** | **Single service spin-up** | Cold starts required on both frontend & backend |

---

## ⚡ Method 1: 1-Click Deployment via Render Blueprint (Recommended)

The repository includes a production-ready Render Blueprint specification ([`render.yaml`](./render.yaml)).

### Step 1: Push Changes to GitHub
Ensure your repository contains the latest code:
```bash
git status
git push origin main
```

### Step 2: Open Render Blueprint Dashboard
1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. In the top navigation bar, click **New +** and select **Blueprint**.
3. Connect your GitHub repository: `PramodTewatia2007/ibvap-platform`.
4. Give your Blueprint instance a name (e.g. `ibvap-blueprint`).
5. Render will detect `render.yaml` and configure the `ibvap-platform` web service.

### Step 3: Apply & Launch
1. Click **Apply**.
2. Render will automatically:
   - Build the React 19 frontend into static assets (`dist`).
   - Package the Python 3.12 backend and OpenCV runtime.
   - Run database migrations and seed default credentials.
   - Allocate SSL and bind to `$PORT`.
3. In ~3 to 4 minutes, your service will transition to **Live**.

---

## 🛠️ Method 2: Manual Web Service Setup (Without Blueprint)

If you prefer to configure the service manually via the Render UI:

1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** > **Web Service**.
2. Select your repository: `PramodTewatia2007/ibvap-platform`.
3. Fill in the service configuration:

| Field | Value |
|---|---|
| **Name** | `ibvap-platform` |
| **Region** | `Oregon (US West)` (or closest to your location) |
| **Branch** | `main` |
| **Runtime** | `Docker` |
| **Dockerfile Path** | `./Dockerfile` |
| **Instance Type** | `Free` |

4. Under **Advanced Settings**, configure:
   - **Health Check Path**: `/api/health`
   - **Auto-Deploy**: `Yes`
   - **Environment Variables**:
     | Variable | Value | Description |
     |---|---|---|
     | `PROJECT_NAME` | `IBVAP — Intelligent Border Video Analytics Platform` | Platform title |
     | `DATABASE_URL` | `sqlite+aiosqlite:///./ibvap.db` | Async database URL |
     | `EVIDENCE_DIR` | `/app/evidence` | Storage for snapshots |
     | `SECRET_KEY` | *(Click "Generate" for 32-byte secure key)* | JWT secret |
     | `PYTHONUNBUFFERED` | `1` | Real-time console logs |
     | `ENABLE_REALTIME_INFERENCE` | `true` | Background video analytics worker |
     | `ENABLE_FACIAL_RECOGNITION` | `false` | Regulatory safeguard setting |

5. Click **Create Web Service**.

---

## 🔍 Verification & Health Checks

Once deployment is complete, verify all operational layers:

### 1. Web Command Interface & Dashboard
- Navigate to: **`https://<your-app-name>.onrender.com`**
- You will see the **Central Border Operations Command (CBOC)** overview with live tactical matrix, detection metrics, and alert queues.

### 2. Interactive Swagger / OpenAPI Documentation
- Navigate to: **`https://<your-app-name>.onrender.com/api/v1/docs`**
- Test REST endpoints including `/api/v1/dashboard/stats`, `/api/v1/cameras`, and `/api/v1/alerts`.

### 3. Service Health Check
- Query: **`https://<your-app-name>.onrender.com/api/health`**
- Expected Response:
  ```json
  {
    "status": "ok",
    "service": "ibvap-platform",
    "platform": "IBVAP — Intelligent Border Video Analytics Platform"
  }
  ```

### 4. Live Telemetry WebSocket
- Endpoint: **`wss://<your-app-name>.onrender.com/ws/surveillance`**
- The frontend automatically establishes a persistent, auto-reconnecting WebSocket connection for real-time video frames and tripwire alerts.

---

## 🔐 Default Operator & Administrator Logins

The application seeds two default accounts on initial startup:

| Account Role | Username | Default Password | Permissions |
|---|---|---|---|
| **Super Administrator** | `admin` | `Admin@12345` | Full system, cameras, zones, and site management |
| **Monitoring Operator** | `operator` | `Operator@123` | Tactical surveillance, triage, and incident escalation |

> [!IMPORTANT]
> Change the default passwords after your first login for production deployments.

---

## 💡 Operational Best Practices on Render Free Tier

1. **Cold Starts**: Render free web services spin down after 15 minutes of inactivity. The first request after sleep may take ~30–45 seconds to wake up.
2. **Persistent Storage (Optional)**: On the free tier, files created in `/app/evidence` and SQLite are stored on the ephemeral container disk. If you require permanent evidence retention across restarts, attach a **Render Persistent Disk** mounted at `/app/evidence` and `/app/ibvap.db`.
3. **Database Upgrade**: For enterprise multi-node deployments, set `DATABASE_URL=postgresql+asyncpg://...` pointing to a managed PostgreSQL database.
