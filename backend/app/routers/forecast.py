"""Forecast router — decision forecast and evolution endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Query

from ..data_store import get_actuals, get_forecasts
from ..services.decision_forecast import (
    compute_decision_forecast,
    get_forecast_evolution,
)

router = APIRouter(prefix="/api", tags=["forecast"])


@router.get("/decision")
async def decision_forecast(
    date: str = Query("2026-01-15", description="Delivery date (YYYY-MM-DD)"),
    cutoff: str = Query("09:20", description="Decision cutoff time on D-1 (HH:MM)"),
):
    """Get the decision forecast for a delivery day.

    Returns the latest forecast available at the cutoff time for each
    hour of the delivery day, merged with actuals and uncertainty bands.
    """
    fc_df = get_forecasts()
    act_df = get_actuals()

    df = compute_decision_forecast(fc_df, act_df, date, cutoff)
    if df.empty:
        return {"deliveryDate": date, "cutoff": cutoff, "points": [], "summary": None}

    points = []
    for _, row in df.iterrows():
        points.append({
            "startTime": row["startTime"].isoformat(),
            "forecastMW": round(float(row["forecastMW"]), 0),
            "actualMW": round(float(row["actualMW"]), 0) if row["actualMW"] is not None and row["actualMW"] == row["actualMW"] else None,
            "errorMW": round(float(row["errorMW"]), 0) if row["errorMW"] is not None and row["errorMW"] == row["errorMW"] else None,
            "publishTime": row["publishTime"].isoformat(),
            "horizonHours": float(row["horizonHours"]),
            "bandP10": round(float(row["bandP10"]), 0) if row["bandP10"] == row["bandP10"] else None,
            "bandP90": round(float(row["bandP90"]), 0) if row["bandP90"] == row["bandP90"] else None,
            "conservativeMW": round(float(row["conservativeMW"]), 0) if row["conservativeMW"] == row["conservativeMW"] else None,
        })

    forecasts = [p["forecastMW"] for p in points]
    publish_times = df["publishTime"].tolist()

    summary = {
        "peakMW": max(forecasts) if forecasts else 0,
        "troughMW": min(forecasts) if forecasts else 0,
        "meanMW": round(sum(forecasts) / len(forecasts), 0) if forecasts else 0,
        "totalMWh": round(sum(forecasts), 0) if forecasts else 0,
        "avgHorizonHours": round(float(df["horizonHours"].mean()), 1),
        "forecastCount": len(points),
    }

    return {
        "deliveryDate": date,
        "cutoff": cutoff,
        "points": points,
        "summary": summary,
    }


@router.get("/evolution")
async def forecast_evolution(
    target: str = Query("2026-01-15T12:00:00Z", description="Target startTime (ISO)"),
    cutoff: str = Query("09:20", description="Decision cutoff (HH:MM)"),
):
    """Get all forecast versions for a single target time."""
    fc_df = get_forecasts()
    act_df = get_actuals()
    return get_forecast_evolution(fc_df, act_df, target, cutoff)
