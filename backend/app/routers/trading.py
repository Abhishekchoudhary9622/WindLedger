"""Trading router — financial risk, imbalance cashout, and optimal bid hedging."""

from __future__ import annotations

from fastapi import APIRouter, Query

from ..data_store import get_actuals, get_forecasts
from ..schemas import (
    BidRecommendationResponse,
    ImbalanceRiskResponse,
    ScenarioSimulationRequest,
    ScenarioSimulationResponse,
)
from ..services.trading import (
    compute_bid_recommendation,
    compute_imbalance_risk,
    simulate_scenario,
)

router = APIRouter(prefix="/api/trading", tags=["trading"])


@router.get(
    "/imbalance-risk",
    response_model=ImbalanceRiskResponse,
    summary="Financial Imbalance & Cashout Penalty Risk (Optional Simulation)",
    description=(
        "⚠️ OPTIONAL ILLUSTRATIVE SIMULATION: Models hypothetical balancing penalties across January 2026 "
        "under GB BSC settlement rules using user-assumed power prices. Calculates physical short vs long "
        "exposure (MWh), System Buy Price (SBP) penalties, and System Sell Price (SSP) discounts. "
        "Not verified commercial procurement advice."
    ),
)
async def imbalance_risk(
    date_from: str = Query("2026-01-01", description="Start delivery date (YYYY-MM-DD)"),
    date_to: str = Query("2026-01-31", description="End delivery date (YYYY-MM-DD)"),
    cutoff: str = Query("09:20", description="Decision cutoff on D-1 ('09:20' EPEX SPOT auction gate closure, '09:50' Nord Pool N2EX order book gate closure, or '10:00' Nord Pool results benchmark)"),
    day_ahead_price: float = Query(75.0, description="Base Day-Ahead wholesale power price in GBP/MWh"),
    short_penalty_spread: float = Query(35.0, description="SBP cashout surcharge above Day-Ahead in GBP/MWh"),
    long_discount_spread: float = Query(20.0, description="SSP discount below Day-Ahead in GBP/MWh"),
):
    fc = get_forecasts()
    act = get_actuals()
    return compute_imbalance_risk(
        fc, act, date_from, date_to, cutoff,
        day_ahead_price, short_penalty_spread, long_discount_spread
    )


@router.get(
    "/bid-recommendation",
    response_model=BidRecommendationResponse,
    summary="Optimal Day-Ahead Bidding Schedule (Optional Simulation)",
    description=(
        "⚠️ OPTIONAL ILLUSTRATIVE SIMULATION: Generates a 24-hour procurement and auction bidding schedule "
        "for Day D using assumed pricing spreads. Compares Conservative (P25 quantile), Risk-Neutral (point forecast), "
        "and Aggressive (P75) profiles. Not verified commercial procurement advice."
    ),
)
async def bid_recommendation(
    delivery_date: str = Query("2026-01-15", description="Target delivery date (YYYY-MM-DD)"),
    cutoff: str = Query("09:20", description="Decision cutoff on D-1 ('09:20' EPEX SPOT auction gate closure, '09:50' Nord Pool N2EX order book gate closure, or '10:00' Nord Pool results benchmark)"),
    day_ahead_price: float = Query(75.0, description="Base Day-Ahead wholesale power price in GBP/MWh"),
    short_penalty_spread: float = Query(35.0, description="SBP cashout surcharge above Day-Ahead in GBP/MWh"),
    long_discount_spread: float = Query(20.0, description="SSP discount below Day-Ahead in GBP/MWh"),
):
    fc = get_forecasts()
    act = get_actuals()
    return compute_bid_recommendation(
        fc, act, delivery_date, cutoff,
        day_ahead_price, short_penalty_spread, long_discount_spread
    )


@router.post(
    "/simulate",
    response_model=ScenarioSimulationResponse,
    summary="Stress-Test Scenario Simulation",
    description=(
        "Simulates the financial and statistical impact of forecast degradation, bias shifts, "
        "or volatile imbalance spreads on utility balancing penalties."
    ),
)
async def simulate(request: ScenarioSimulationRequest):
    fc = get_forecasts()
    act = get_actuals()
    return simulate_scenario(
        fc, act,
        date_from="2026-01-01",
        date_to="2026-01-31",
        cutoff="09:20",
        forecast_shift_pct=request.forecast_shift_pct,
        forecast_bias_mw=request.forecast_bias_mw,
        day_ahead_price=request.day_ahead_price,
        short_penalty_spread=request.short_penalty_spread,
        long_discount_spread=request.long_discount_spread,
    )
