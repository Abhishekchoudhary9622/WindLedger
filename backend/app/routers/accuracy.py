"""Accuracy router — metrics and error analysis endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Query

from ..data_store import get_actuals, get_forecasts
from ..services.metrics import (
    compute_daily_accuracy,
    compute_error_distribution,
    compute_heatmap,
    compute_horizon_accuracy,
    compute_hourly_accuracy,
    compute_summary,
)

router = APIRouter(prefix="/api/accuracy", tags=["accuracy"])


@router.get("/summary")
async def accuracy_summary(
    date_from: str = Query("2026-01-01", alias="from", description="Start date"),
    date_to: str = Query("2026-01-31", alias="to", description="End date"),
    cutoff: str = Query("09:20", description="Decision cutoff (HH:MM)"),
):
    """Overall accuracy KPIs: MAE, RMSE, Bias, nMAE, percentiles."""
    return compute_summary(get_forecasts(), get_actuals(), date_from, date_to, cutoff)


@router.get("/horizon")
async def accuracy_by_horizon(
    date_from: str = Query("2026-01-01", alias="from"),
    date_to: str = Query("2026-01-31", alias="to"),
    cutoff: str = Query("09:20"),
):
    """Error metrics by forecast horizon bucket."""
    return compute_horizon_accuracy(get_forecasts(), get_actuals(), date_from, date_to, cutoff)


@router.get("/timeseries")
async def accuracy_timeseries(
    date_from: str = Query("2026-01-01", alias="from"),
    date_to: str = Query("2026-01-31", alias="to"),
    cutoff: str = Query("09:20"),
):
    """Daily error metrics time series."""
    return compute_daily_accuracy(get_forecasts(), get_actuals(), date_from, date_to, cutoff)


@router.get("/hourly")
async def accuracy_hourly(
    date_from: str = Query("2026-01-01", alias="from"),
    date_to: str = Query("2026-01-31", alias="to"),
    cutoff: str = Query("09:20"),
):
    """Error metrics by hour of day."""
    return compute_hourly_accuracy(get_forecasts(), get_actuals(), date_from, date_to, cutoff)


@router.get("/distribution")
async def accuracy_distribution(
    date_from: str = Query("2026-01-01", alias="from"),
    date_to: str = Query("2026-01-31", alias="to"),
    cutoff: str = Query("09:20"),
):
    """Error histogram and percentiles."""
    return compute_error_distribution(get_forecasts(), get_actuals(), date_from, date_to, cutoff)


@router.get("/heatmap")
async def accuracy_heatmap(
    date_from: str = Query("2026-01-01", alias="from"),
    date_to: str = Query("2026-01-31", alias="to"),
    cutoff: str = Query("09:20"),
):
    """Day × hour-of-day error heatmap."""
    return compute_heatmap(get_forecasts(), get_actuals(), date_from, date_to, cutoff)
