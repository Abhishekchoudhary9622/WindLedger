"""Tests for wind generation ramp event detection and forecast tracking."""

import pytest
from app.data_store import get_actuals, get_forecasts
from app.services.ramps import detect_ramp_events


def test_detect_ramp_events():
    fc = get_forecasts()
    act = get_actuals()
    res = detect_ramp_events(fc, act, "2026-01-01", "2026-01-31", "09:20", ramp_threshold_mw=800.0)

    assert res["totalRampsDetected"] > 0
    assert res["upRampsCount"] + res["downRampsCount"] == res["totalRampsDetected"]
    assert res["rampCaptureRatePct"] >= 0.0
    assert len(res["events"]) == res["totalRampsDetected"]
    assert res["largestRamp"] is not None

    for ev in res["events"]:
        assert ev["direction"] in ["UP", "DOWN"]
        assert ev["severity"] in ["Moderate", "Severe", "Extreme"]
        assert abs(ev["actualDeltaMW"]) >= 800.0
