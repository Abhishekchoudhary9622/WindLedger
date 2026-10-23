"""API endpoint integration tests."""

import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_root_endpoint(client):
    r = client.get("/")
    assert r.status_code == 200
    data = r.json()
    assert data["app"] == "WindLens"
    assert "tagline" in data


def test_docs_endpoint(client):
    r = client.get("/docs")
    assert r.status_code == 200
    assert "API Reference" in r.text
    assert "text/html" in r.headers["content-type"]



def test_meta_endpoint(client):
    r = client.get("/api/meta")
    assert r.status_code == 200
    data = r.json()
    assert "availableDates" in data
    assert "2026-01-15" in data["availableDates"]
    assert data["forecastCount"] > 0
    assert data["actualCount"] > 0


def test_decision_endpoint(client):
    r = client.get("/api/decision?date=2026-01-15&cutoff=09:20")
    assert r.status_code == 200
    data = r.json()
    assert data["deliveryDate"] == "2026-01-15"
    assert data["cutoff"] == "09:20"
    assert len(data["points"]) == 24
    assert data["summary"] is not None
    assert data["summary"]["peakMW"] > 0
    assert data["summary"]["meanMW"] > 0


def test_evolution_endpoint(client):
    r = client.get("/api/evolution?target=2026-01-15T12:00:00Z&cutoff=09:20")
    assert r.status_code == 200
    data = r.json()
    assert data["targetTime"] == "2026-01-15T12:00:00Z"
    assert len(data["versions"]) > 0


def test_accuracy_summary_endpoint(client):
    r = client.get("/api/accuracy/summary?from=2026-01-01&to=2026-01-31&cutoff=09:20")
    assert r.status_code == 200
    data = r.json()
    assert data["matchedPeriods"] == 744
    assert data["mae"] > 0
    assert data["nmaePct"] > 0


def test_accuracy_horizon_endpoint(client):
    r = client.get("/api/accuracy/horizon?from=2026-01-01&to=2026-01-31&cutoff=09:20")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) > 0


def test_accuracy_timeseries_endpoint(client):
    r = client.get("/api/accuracy/timeseries?from=2026-01-01&to=2026-01-31&cutoff=09:20")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 31


def test_accuracy_hourly_endpoint(client):
    r = client.get("/api/accuracy/hourly?from=2026-01-01&to=2026-01-31&cutoff=09:20")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 24


def test_accuracy_distribution_endpoint(client):
    r = client.get("/api/accuracy/distribution?from=2026-01-01&to=2026-01-31&cutoff=09:20")
    assert r.status_code == 200
    data = r.json()
    assert "bins" in data
    assert "counts" in data


def test_accuracy_heatmap_endpoint(client):
    r = client.get("/api/accuracy/heatmap?from=2026-01-01&to=2026-01-31&cutoff=09:20")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 31 * 24
