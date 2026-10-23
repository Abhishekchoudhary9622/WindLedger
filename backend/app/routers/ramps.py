"""Ramps router — wind generation ramp event detection and volatility evaluation."""

from __future__ import annotations

from fastapi import APIRouter, Query

from ..data_store import get_actuals, get_forecasts
from ..schemas import RampSummaryResponse
from ..services.ramps import detect_ramp_events

router = APIRouter(prefix="/api/ramps", tags=["ramps"])


@router.get(
    "/events",
    response_model=RampSummaryResponse,
    summary="Wind Ramp Event Detection & Forecast Tracking",
    description=(
        "Detects severe wind power ramp events (>800 MW swings over 1 to 3 hours) in January 2026. "
        "Evaluates whether the day-ahead decision forecast captured the ramp timing, rate (MW/hr), "
        "and amplitude, or if a severe ramp miss occurred."
    ),
)
async def get_ramps(
    date_from: str = Query("2026-01-01", description="Start date (YYYY-MM-DD)"),
    date_to: str = Query("2026-01-31", description="End date (YYYY-MM-DD)"),
    cutoff: str = Query("09:20", description="Decision cutoff time on D-1 (09:20 or 10:00)"),
    threshold_mw: float = Query(800.0, description="Minimum MW generation change to qualify as a ramp event"),
    window_hours: int = Query(2, description="Ramp observation window in hours (1 to 3)"),
):
    fc = get_forecasts()
    act = get_actuals()
    return detect_ramp_events(
        fc, act,
        date_from=date_from,
        date_to=date_to,
        cutoff=cutoff,
        ramp_threshold_mw=threshold_mw,
        window_hours=window_hours,
    )
