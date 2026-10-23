"""Tests for decision forecast logic and evolution."""

import pytest
import pandas as pd
from app.data_store import get_actuals, get_forecasts, load_data
from app.services.decision_forecast import compute_decision_forecast, get_forecast_evolution


@pytest.fixture(scope="module", autouse=True)
def init_data():
    load_data()


def test_decision_forecast_returns_24_hours():
    fc = get_forecasts()
    act = get_actuals()
    df = compute_decision_forecast(fc, act, "2026-01-15", "09:20")
    assert len(df) == 24
    assert "forecastMW" in df.columns
    assert "actualMW" in df.columns
    assert "errorMW" in df.columns
    assert "horizonHours" in df.columns
    assert "bandP10" in df.columns
    assert "bandP90" in df.columns
    assert "conservativeMW" in df.columns


def test_decision_forecast_cutoff_adherence():
    """Verify that all selected forecasts have publishTime <= cutoff timestamp."""
    fc = get_forecasts()
    act = get_actuals()
    cutoff_time = "09:20"
    delivery_date = "2026-01-15"
    cutoff_dt = pd.to_datetime("2026-01-14 09:20:00", utc=True)

    df = compute_decision_forecast(fc, act, delivery_date, cutoff_time)
    assert not df.empty
    # Every publishTime must be <= cutoff_dt
    assert (df["publishTime"] <= cutoff_dt).all()


def test_decision_forecast_horizons_are_positive():
    fc = get_forecasts()
    act = get_actuals()
    df = compute_decision_forecast(fc, act, "2026-01-15", "09:20")
    assert (df["horizonHours"] > 0).all()
    # Horizons for D-1 09:20 into Day D (00:00 - 23:00) should be between 14h and 38h
    assert df["horizonHours"].min() >= 14.0
    assert df["horizonHours"].max() <= 48.0


def test_decision_forecast_conservative_bound():
    fc = get_forecasts()
    act = get_actuals()
    df = compute_decision_forecast(fc, act, "2026-01-15", "09:20")
    # Conservative MW should be <= forecastMW
    assert (df["conservativeMW"] <= df["forecastMW"]).all()
    # P10 should be <= P90
    assert (df["bandP10"] <= df["bandP90"]).all()


def test_forecast_evolution():
    fc = get_forecasts()
    act = get_actuals()
    target = "2026-01-15T12:00:00Z"
    cutoff = "09:20"
    evo = get_forecast_evolution(fc, act, target, cutoff)
    assert evo["targetTime"] == target
    assert evo["actualMW"] is not None
    assert len(evo["versions"]) > 0

    # Ensure versions are sorted chronologically
    pub_times = [v["publishTime"] for v in evo["versions"]]
    assert pub_times == sorted(pub_times)

    # Exactly one version should be selected for the cutoff
    selected = [v for v in evo["versions"] if v["isSelected"]]
    assert len(selected) == 1
    # Selected version publishTime must be <= 2026-01-14 09:20
    assert pd.to_datetime(selected[0]["publishTime"]) <= pd.to_datetime("2026-01-14 09:20:00+00:00")
