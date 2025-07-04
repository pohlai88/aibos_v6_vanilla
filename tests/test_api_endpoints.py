# Example API Test (pytest)
# Place in /tests/test_api_endpoints.py
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_root():
    resp = client.get("/")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"

def test_compliance_advisory():
    resp = client.get("/compliance/advisory")
    assert resp.status_code == 200

def test_automation_variance_analysis():
    data = {"actuals": {"revenue": 1000}, "budget": {"revenue": 900}}
    resp = client.post("/automation/variance_analysis", json=data)
    assert resp.status_code == 200
    assert resp.json()["status"] == "success"
