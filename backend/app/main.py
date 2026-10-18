import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from app.core.config import settings
from app.core.database import engine, Base, AsyncSessionLocal
from app.core.security import get_password_hash
from app.core.ws_manager import ws_manager
from app.models.models import User, UserRole, Site, Camera, VirtualZone, CameraStatus, AlertSeverity
from app.services.stream_worker import stream_worker

from app.api.v1.endpoints import auth, dashboard, cameras, sites, zones, alerts, analytics, audit, system

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await seed_initial_data()
    worker_task = asyncio.create_task(stream_worker.run())
    yield
    worker_task.cancel()
    try:
        await worker_task
    except asyncio.CancelledError:
        pass

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    lifespan=lifespan
)


# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoints for cloud load balancers and Render
@app.get("/health")
@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "service": "ibvap-platform",
        "platform": settings.PROJECT_NAME
    }

# Mount evidence folder
os.makedirs(settings.SNAPSHOT_DIR, exist_ok=True)
os.makedirs(settings.RECORDINGS_DIR, exist_ok=True)
app.mount("/evidence", StaticFiles(directory=settings.EVIDENCE_DIR), name="evidence")

# Include Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(dashboard.router, prefix=f"{settings.API_V1_STR}/dashboard", tags=["Dashboard"])
app.include_router(cameras.router, prefix=f"{settings.API_V1_STR}/cameras", tags=["Cameras"])
app.include_router(sites.router, prefix=f"{settings.API_V1_STR}/sites", tags=["Sites"])
app.include_router(zones.router, prefix=f"{settings.API_V1_STR}/zones", tags=["Virtual Zones"])
app.include_router(alerts.router, prefix=f"{settings.API_V1_STR}/alerts", tags=["Alerts & Incidents"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["Analytics & ANPR"])
app.include_router(audit.router, prefix=f"{settings.API_V1_STR}/audit", tags=["Audit Logs"])
app.include_router(system.router, prefix=f"{settings.API_V1_STR}/system", tags=["System & C2"])

@app.websocket("/ws/surveillance")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep-alive receive
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)

# Frontend SPA Static Assets & Route Serving
frontend_dist = settings.FRONTEND_DIST
if not os.path.exists(frontend_dist):
    for p in [
        os.path.join(os.getcwd(), "frontend", "dist"),
        os.path.join(os.getcwd(), "dist"),
        "/app/frontend/dist",
        "/app/dist"
    ]:
        if os.path.exists(p):
            frontend_dist = p
            break

if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="frontend-assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if (
            full_path.startswith("api") or
            full_path.startswith("ws") or
            full_path.startswith("evidence") or
            full_path.startswith("docs") or
            full_path.startswith("openapi.json")
        ):
            raise HTTPException(status_code=404, detail="Not Found")
            
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
            
        index_html = os.path.join(frontend_dist, "index.html")
        if os.path.isfile(index_html):
            return FileResponse(index_html)
            
        raise HTTPException(status_code=404, detail="Frontend build index.html not found")

async def seed_initial_data():
    async with AsyncSessionLocal() as session:
        # Check if users already seeded
        from sqlalchemy import select
        res = await session.execute(select(User))
        if res.scalars().first():
            return
            
        print("[Bootstrap] Seeding initial operational data for IBVAP...")
        # 1. Super Admin
        admin = User(
            username="admin",
            email="admin@ibvap.mil",
            hashed_password=get_password_hash("Admin@12345"),
            full_name="Cmdr. Rajesh Sharma",
            badge_number="BSF-HQ-8821",
            role=UserRole.SUPER_ADMIN
        )
        # 2. Operator
        operator = User(
            username="operator",
            email="operator@ibvap.mil",
            hashed_password=get_password_hash("Operator@123"),
            full_name="Sub-Inspector Ankit Verma",
            badge_number="BOP-AT-441",
            role=UserRole.MONITORING_OPERATOR
        )
        session.add_all([admin, operator])
        await session.flush()
        
        # 3. Border Outpost Sites
        site1 = Site(
            name="BOP Attari Border Outpost",
            code="BOP-ATTARI-01",
            region="Punjab Western Frontier",
            sector="Sector 4 (International Border)",
            latitude=31.6048,
            longitude=74.5762,
            description="Main international border outpost and transit corridor."
        )
        site2 = Site(
            name="Forward Post Ditch-Cum-Bandh (DCB)",
            code="FP-DCB-09",
            region="Rajasthan Desert Sector",
            sector="Sector 2 (Perimeter Defense)",
            latitude=27.0238,
            longitude=71.2014,
            description="Fortified perimeter zone with night thermal surveillance."
        )
        session.add_all([site1, site2])
        await session.flush()
        
        # 4. Cameras
        cam1 = Camera(
            site_id=site1.id,
            name="Zero Line Perimeter North",
            identifier="CAM-ATTARI-001",
            location_description="Tower 3 North Perimeter Fence",
            stream_url="rtsp://10.12.0.101:554/live/ch0",
            status=CameraStatus.STREAMING,
            fps_limit=15,
            resolution="1920x1080",
            is_synthetic=True
        )
        cam2 = Camera(
            site_id=site1.id,
            name="Checkpoint Alpha Vehicle Portal",
            identifier="CAM-ATTARI-002",
            location_description="Entry Gate Inspection Bay",
            stream_url="rtsp://10.12.0.102:554/live/ch0",
            status=CameraStatus.STREAMING,
            fps_limit=15,
            resolution="1920x1080",
            is_synthetic=True
        )
        cam3 = Camera(
            site_id=site2.id,
            name="DCB Sand Dune Perimeter South",
            identifier="CAM-DCB-003",
            location_description="Observation Post Alpha 2",
            stream_url="rtsp://10.12.0.103:554/live/ch0",
            status=CameraStatus.STREAMING,
            fps_limit=15,
            resolution="1920x1080",
            is_synthetic=True
        )
        session.add_all([cam1, cam2, cam3])
        await session.flush()
        
        # 5. Virtual Restricted Zone on Camera 1
        zone1 = VirtualZone(
            camera_id=cam1.id,
            name="Zero-Line Buffer Strip (100m)",
            description="Strictly no unauthorized movement permitted.",
            zone_type="RESTRICTED_POLYGON",
            coordinates=[[0.05, 0.40], [0.95, 0.40], [0.95, 0.70], [0.05, 0.70]],
            severity=AlertSeverity.CRITICAL,
            dwell_time_seconds=2,
            cooldown_seconds=30
        )
        session.add(zone1)
        await session.commit()
        print("[Bootstrap] Initial data successfully seeded.")

