import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app, seed_initial_data
from app.core.database import engine, Base

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()

async def init_test_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await seed_initial_data()

@pytest.mark.asyncio
async def test_health_check():
    await init_test_db()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/system/status")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "HEALTHY"
        assert "IBVAP" in data["platform"]

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
async def test_camera_connection_test():
    await init_test_db()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post("/api/v1/cameras/1/test-connection")
        assert res.status_code == 200
        assert res.json()["status"] == "SUCCESS"
