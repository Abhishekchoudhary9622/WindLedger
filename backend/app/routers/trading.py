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
    summary="Financial Imbalance & Cashout Penalty Risk",
    description=(
        "Simulates financial balancing penalties across January 2026 under GB BSC settlement rules. "
        "Calculates physical short vs long exposure (MWh), System Buy Price (SBP) penalties, "
        "System Sell Price (SSP) discounts, and identifies the highest financial risk days."
    ),
)
async def imbalance_risk(
    date_from: str = Query("2026-01-01", description="Start delivery date (YYYY-MM-DD)"),
    date_to: str = Query("2026-01-31", description="End delivery date (YYYY-MM-DD)"),
    cutoff: str = Query("09:20", description="Trading gate closure cutoff (09:20 or 10:00)"),
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
    summary="Optimal Day-Ahead Bidding Schedule",
    description=(
        "Generates an optimal 24-hour procurement and auction bidding schedule for Day D. "
        "Compares Conservative (P25 quantile to mitigate £35/MWh cashout spikes), "
        "Risk-Neutral (point forecast), and Aggressive (P75) bidding profiles."
    ),
)
async def bid_recommendation(
    delivery_date: str = Query("2026-01-15", description="Target delivery date (YYYY-MM-DD)"),
    cutoff: str = Query("09:20", description="Decision cutoff time on D-1 (HH:MM)"),
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
