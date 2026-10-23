"""API integration tests for enterprise routers (trading, ramps, data, system)."""

import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_trading_imbalance_risk_endpoint(client):
    r = client.get("/api/trading/imbalance-risk?cutoff=09:20")
    assert r.status_code == 200
    data = r.json()
    assert data["totalPenaltyCostGbp"] > 0
    assert len(data["dailyBreakdown"]) == 31
    assert len(data["topRiskDays"]) == 5


def test_trading_bid_recommendation_endpoint(client):
    r = client.get("/api/trading/bid-recommendation?delivery_date=2026-01-15&cutoff=09:20")
    assert r.status_code == 200
    data = r.json()
    assert len(data["hourlySchedule"]) == 24
    assert "strategySummary" in data


def test_trading_simulate_endpoint(client):
    payload = {
        "forecast_shift_pct": 5.0,
        "forecast_bias_mw": 100.0,
        "day_ahead_price": 75.0,
        "short_penalty_spread": 35.0,
        "long_discount_spread": 20.0,
    }
    r = client.post("/api/trading/simulate", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert "simulatedPenaltyGbp" in data


def test_ramps_events_endpoint(client):
    r = client.get("/api/ramps/events?threshold_mw=800&window_hours=2")
    assert r.status_code == 200
    data = r.json()
    assert data["totalRampsDetected"] > 0
    assert len(data["events"]) > 0


def test_data_summary_endpoint(client):
    r = client.get("/api/data/summary")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ready"
    assert data["actuals"]["recordCount"] == 1585
    assert data["forecasts"]["recordCount"] == 21024


def test_data_export_csv_endpoint(client):
    r = client.get("/api/data/export/csv?cutoff=09:20")
    assert r.status_code == 200
    assert "text/csv" in r.headers["content-type"]
    assert "deliveryDate,deliveryHour" in r.text


def test_system_health_endpoint(client):
    r = client.get("/api/system/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "healthy"
    assert data["dataStoreReady"] is True
    assert data["memoryRssMb"] > 0


def test_system_benchmarks_endpoint(client):
    r = client.get("/api/system/benchmarks")
    assert r.status_code == 200
    data = r.json()
    assert data["benchmarkStatus"] == "optimal"
    assert data["totalBenchmarkTimeMs"] < 100.0
