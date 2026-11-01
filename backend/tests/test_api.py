import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "Trackr API"
        assert "version" in data

@pytest.mark.asyncio
async def test_auth_validation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Invalid email or empty password should return 422
        response = await client.post("/api/v1/auth/login", json={"email": "invalid-email", "password": "123"})
        assert response.status_code == 422
