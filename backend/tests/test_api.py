import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app, seed_initial_data
from app.core.database import engine, Base

async def init_test_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await seed_initial_data()

@pytest.mark.asyncio
async def test_root_health_checks():
    await init_test_db()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Check /api/health
        res1 = await client.get("/api/health")
        assert res1.status_code == 200
        assert res1.json()["status"] == "ok"
        
        # Check /health
        res2 = await client.get("/health")
        assert res2.status_code == 200
        assert res2.json()["status"] == "ok"

@pytest.mark.asyncio
async def test_system_status_and_c2():
    await init_test_db()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/system/status")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "HEALTHY"
        assert "IBVAP" in data["platform"]
        
        # C2 telemetry
        c2_res = await client.get("/api/v1/system/c2/telemetry")
        assert c2_res.status_code == 200
        assert "bop_node_id" in c2_res.json()

@pytest.mark.asyncio
async def test_login_flow():
    await init_test_db()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Invalid login
        res_fail = await client.post("/api/v1/auth/login", json={"username": "baduser", "password": "wrongpassword"})
        assert res_fail.status_code == 401
        
        # Valid admin login
        res_ok = await client.post("/api/v1/auth/login", json={"username": "admin", "password": "Admin@12345"})
        assert res_ok.status_code == 200
        token_data = res_ok.json()
        assert "access_token" in token_data
        assert token_data["user"]["role"] == "SUPER_ADMIN"

@pytest.mark.asyncio
async def test_dashboard_stats():
    await init_test_db()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/dashboard/stats")
        assert res.status_code == 200
        stats = res.json()
        assert stats["total_cameras"] >= 3
        assert stats["ai_engine_status"] != ""

@pytest.mark.asyncio
async def test_cameras_and_sites():
    await init_test_db()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Sites
        sites_res = await client.get("/api/v1/sites/")
        assert sites_res.status_code == 200
        sites = sites_res.json()
        assert len(sites) >= 2
        
        # Cameras
        cams_res = await client.get("/api/v1/cameras/")
        assert cams_res.status_code == 200
        cams = cams_res.json()
        assert len(cams) >= 3
        
        # Camera connection test
        cam_id = cams[0]["id"]
        test_res = await client.post(f"/api/v1/cameras/{cam_id}/test-connection")
        assert test_res.status_code == 200
        assert test_res.json()["status"] == "SUCCESS"

@pytest.mark.asyncio
async def test_virtual_zones():
    await init_test_db()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        zones_res = await client.get("/api/v1/zones/")
        assert zones_res.status_code == 200
        zones = zones_res.json()
        assert len(zones) >= 1

@pytest.mark.asyncio
async def test_alerts_workflow():
    await init_test_db()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # List alerts
        alerts_res = await client.get("/api/v1/alerts/")
        assert alerts_res.status_code == 200
        alerts = alerts_res.json()
        
        if len(alerts) > 0:
            alert_id = alerts[0]["id"]
            # Add note
            note_res = await client.post(f"/api/v1/alerts/{alert_id}/notes", json={"note": "Test observation"})
            assert note_res.status_code == 200
            assert note_res.json()["note"] == "Test observation"
            
            # Update status
            status_res = await client.patch(f"/api/v1/alerts/{alert_id}/status", json={"status": "UNDER_REVIEW"})
            assert status_res.status_code == 200
            assert status_res.json()["status"] == "UNDER_REVIEW"

@pytest.mark.asyncio
async def test_analytics_and_audit():
    await init_test_db()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Events
        ev_res = await client.get("/api/v1/analytics/events")
        assert ev_res.status_code == 200
        
        # ANPR
        anpr_res = await client.get("/api/v1/analytics/anpr")
        assert anpr_res.status_code == 200
        
        # Faces
        faces_res = await client.get("/api/v1/analytics/faces")
        assert faces_res.status_code == 200
        
        # Audit
        audit_res = await client.get("/api/v1/audit/")
        assert audit_res.status_code == 200

@pytest.mark.asyncio
async def test_spa_serving():
    await init_test_db()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/")
        # Should return 200 if frontend dist exists
        if res.status_code == 200:
            assert "<!doctype html>" in res.text.lower()
            assert "ibvap" in res.text.lower()
