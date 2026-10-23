"""Tests for statistical metrics calculations."""

import pytest
from app.data_store import get_actuals, get_forecasts, load_data
from app.services.metrics import (
    compute_daily_accuracy,
    compute_error_distribution,
    compute_heatmap,
    compute_horizon_accuracy,
    compute_hourly_accuracy,
    compute_summary,
)


@pytest.fixture(scope="module", autouse=True)
def init_data():
    load_data()


def test_compute_summary():
    fc = get_forecasts()
    act = get_actuals()
    summary = compute_summary(fc, act, "2026-01-01", "2026-01-31", "09:20")

    assert summary["matchedPeriods"] == 744
    assert summary["mae"] > 0
    assert summary["rmse"] >= summary["mae"]
    assert 0 <= summary["nmaePct"] <= 100
    assert summary["p50Error"] <= summary["p90Error"] <= summary["p95Error"]
    assert summary["meanActual"] > 0


def test_compute_horizon_accuracy():
    fc = get_forecasts()
    act = get_actuals()
    buckets = compute_horizon_accuracy(fc, act, "2026-01-01", "2026-01-31", "09:20")

    assert len(buckets) > 0
    for b in buckets:
        assert b["mae"] > 0
        assert b["rmse"] >= b["mae"]
        assert b["count"] > 0


def test_compute_daily_accuracy():
    fc = get_forecasts()
    act = get_actuals()
    daily = compute_daily_accuracy(fc, act, "2026-01-01", "2026-01-31", "09:20")

    assert len(daily) == 31
    for d in daily:
        assert d["count"] == 24
        assert d["mae"] >= 0


def test_compute_hourly_accuracy():
    fc = get_forecasts()
    act = get_actuals()
    hourly = compute_hourly_accuracy(fc, act, "2026-01-01", "2026-01-31", "09:20")

    assert len(hourly) == 24
    hours = [h["hour"] for h in hourly]
    assert hours == list(range(24))


def test_compute_error_distribution():
    fc = get_forecasts()
    act = get_actuals()
    dist = compute_error_distribution(fc, act, "2026-01-01", "2026-01-31", "09:20")

    assert len(dist["bins"]) > 0
    assert len(dist["bins"]) == len(dist["counts"]) + 1
    assert sum(dist["counts"]) == 744
    assert dist["p50"] <= dist["p90"] <= dist["p95"]


def test_compute_heatmap():
    fc = get_forecasts()
    act = get_actuals()
    heatmap = compute_heatmap(fc, act, "2026-01-01", "2026-01-31", "09:20")

    assert len(heatmap) == 31 * 24
    for cell in heatmap:
        assert 0 <= cell["hour"] <= 23
        assert cell["mae"] >= 0
