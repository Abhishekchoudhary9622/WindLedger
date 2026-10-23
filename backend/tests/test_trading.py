"""Tests for trading, financial imbalance, and bidding recommendation engine."""

import pytest
from app.data_store import get_actuals, get_forecasts
from app.services.trading import (
    compute_imbalance_risk,
    compute_bid_recommendation,
    simulate_scenario,
)


def test_compute_imbalance_risk():
    fc = get_forecasts()
    act = get_actuals()
    res = compute_imbalance_risk(fc, act, "2026-01-01", "2026-01-31", "09:20")

    assert "totalPenaltyCostGbp" in res
    assert res["totalPenaltyCostGbp"] > 0
    assert res["totalGenerationMWh"] > 0
    assert res["totalShortMWh"] >= 0
    assert res["totalLongMWh"] >= 0
    assert len(res["dailyBreakdown"]) == 31
    assert len(res["topRiskDays"]) == 5
    # SBP short penalty cost should be positive
    assert res["shortCostGbp"] > 0


def test_compute_bid_recommendation():
    fc = get_forecasts()
    act = get_actuals()
    rec = compute_bid_recommendation(fc, act, "2026-01-15", "09:20")

    assert rec["deliveryDate"] == "2026-01-15"
    assert len(rec["hourlySchedule"]) == 24
    for h in rec["hourlySchedule"]:
        assert h["conservativeBidMW"] <= h["neutralBidMW"]
        assert h["neutralBidMW"] <= h["aggressiveBidMW"] + 1  # allowing rounding
        assert h["riskLevel"] in ["Low", "Medium", "High"]

    summary = rec["strategySummary"]
    assert summary["conservativeTotalMWh"] <= summary["neutralTotalMWh"]
    assert summary["conservativeHedgingBufferMWh"] >= 0


def test_simulate_scenario():
    fc = get_forecasts()
    act = get_actuals()
    sim = simulate_scenario(
        fc, act,
        date_from="2026-01-01",
        date_to="2026-01-31",
        cutoff="09:20",
        forecast_shift_pct=10.0,
    )

    assert "simulatedPenaltyGbp" in sim
    assert "costDeltaGbp" in sim
    assert sim["simulatedPenaltyGbp"] > 0
