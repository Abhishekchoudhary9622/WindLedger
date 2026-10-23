"""Accuracy metrics service for WindLens.

All metrics computed from the decision-forecast errors:
  error = forecast − actual  (positive = over-forecast)

Metrics:
  MAE   = mean(|error|)
  RMSE  = sqrt(mean(error²))
  Bias  = mean(error)
  nMAE  = MAE / mean(actual) × 100  (normalised, avoids MAPE blow-up)
"""

from __future__ import annotations

from typing import Optional
import numpy as np
import pandas as pd

from .decision_forecast import _build_joined, _horizon_bucket

_summary_cache: dict[tuple[str, str, str, int, int], dict] = {}
_horizon_cache: dict[tuple[str, str, str, int, int], list[dict]] = {}
_daily_cache: dict[tuple[str, str, str, int, int], list[dict]] = {}
_hourly_cache: dict[tuple[str, str, str, int, int], list[dict]] = {}
_dist_cache: dict[tuple[str, str, str, int, int], dict] = {}
_heatmap_cache: dict[tuple[str, str, str, int, int], list[dict]] = {}


def clear_metrics_caches() -> None:
    """Clear all accuracy metric caches."""
    _summary_cache.clear()
    _horizon_cache.clear()
    _daily_cache.clear()
    _hourly_cache.clear()
    _dist_cache.clear()
    _heatmap_cache.clear()


def compute_summary(
    forecasts_df: pd.DataFrame,
    actuals_df: pd.DataFrame,
    date_from: str = "2026-01-01",
    date_to: str = "2026-01-31",
    cutoff: str = "09:20",
) -> dict:
    """Compute aggregate accuracy KPIs."""
    cache_key = (date_from, date_to, cutoff, len(forecasts_df), len(actuals_df))
    if cache_key in _summary_cache:
        return _summary_cache[cache_key]

    joined = _build_joined(forecasts_df, actuals_df, date_from, date_to, cutoff)
    if joined.empty:
        return {}

    valid = joined.dropna(subset=["errorMW"])
    errors = valid["errorMW"].values
    abs_errors = np.abs(errors)
    actuals = valid["actualMW"].values
    forecasts = valid["forecastMW"].values
    mean_actual = actuals.mean() if len(actuals) > 0 else 1.0
    corr = float(np.corrcoef(forecasts, actuals)[0, 1]) if len(forecasts) > 1 else 0.0
    total_gwh = round(float(actuals.sum() / 1000.0), 1)
    mape = round(float((abs_errors / np.maximum(actuals, 1.0)).mean() * 100), 1)

    result = {
        "mae": round(float(abs_errors.mean()), 1),
        "rmse": round(float(np.sqrt((errors ** 2).mean())), 1),
        "bias": round(float(errors.mean()), 1),
        "nmaePct": round(float(abs_errors.mean() / mean_actual * 100), 1) if mean_actual else 0,
        "mapePct": mape,
        "correlation": round(corr, 2),
        "totalActualGWh": total_gwh,
        "completenessPct": round(float(len(valid) / max(len(joined), 1) * 100), 1),
        "p50Error": round(float(np.percentile(abs_errors, 50)), 1),
        "p90Error": round(float(np.percentile(abs_errors, 90)), 1),
        "p95Error": round(float(np.percentile(abs_errors, 95)), 1),
        "matchedPeriods": int(len(valid)),
        "totalPeriods": int(len(joined)),
        "meanActual": round(float(mean_actual), 1),
    }
    _summary_cache[cache_key] = result
    return result


def compute_horizon_accuracy(
    forecasts_df: pd.DataFrame,
    actuals_df: pd.DataFrame,
    date_from: str = "2026-01-01",
    date_to: str = "2026-01-31",
    cutoff: str = "09:20",
) -> list[dict]:
    """Error metrics broken down by forecast horizon bucket."""
    cache_key = (date_from, date_to, cutoff, len(forecasts_df), len(actuals_df))
    if cache_key in _horizon_cache:
        return _horizon_cache[cache_key]

    joined = _build_joined(forecasts_df, actuals_df, date_from, date_to, cutoff)
    if joined.empty:
        return []

    valid = joined.dropna(subset=["errorMW"]).copy()
    valid["bucket"] = valid["horizonHours"].apply(_horizon_bucket)

    results = []
    for bucket in ["0-6h", "6-12h", "12-24h", "24-36h", "36-48h"]:
        group = valid[valid["bucket"] == bucket]
        if group.empty:
            continue
        errors = group["errorMW"].values
        results.append({
            "bucket": bucket,
            "mae": round(float(np.abs(errors).mean()), 1),
            "rmse": round(float(np.sqrt((errors ** 2).mean())), 1),
            "bias": round(float(errors.mean()), 1),
            "count": int(len(group)),
        })
    _horizon_cache[cache_key] = results
    return results


def compute_daily_accuracy(
    forecasts_df: pd.DataFrame,
    actuals_df: pd.DataFrame,
    date_from: str = "2026-01-01",
    date_to: str = "2026-01-31",
    cutoff: str = "09:20",
) -> list[dict]:
    """Daily MAE, RMSE, Bias time series."""
    cache_key = (date_from, date_to, cutoff, len(forecasts_df), len(actuals_df))
    if cache_key in _daily_cache:
        return _daily_cache[cache_key]

    joined = _build_joined(forecasts_df, actuals_df, date_from, date_to, cutoff)
    if joined.empty:
        return []

    valid = joined.dropna(subset=["errorMW"]).copy()
    valid["abs_error"] = valid["errorMW"].abs()
    valid["sq_error"] = valid["errorMW"] ** 2

    agg = valid.groupby("date").agg(
        mae=("abs_error", "mean"),
        rmse=("sq_error", lambda x: float(np.sqrt(x.mean()))),
        bias=("errorMW", "mean"),
        count=("errorMW", "count"),
    ).reset_index()

    results = []
    for _, row in agg.iterrows():
        results.append({
            "date": str(row["date"]),
            "mae": round(float(row["mae"]), 1),
            "rmse": round(float(row["rmse"]), 1),
            "bias": round(float(row["bias"]), 1),
            "count": int(row["count"]),
        })
    results = sorted(results, key=lambda r: r["date"])
    _daily_cache[cache_key] = results
    return results


def compute_hourly_accuracy(
    forecasts_df: pd.DataFrame,
    actuals_df: pd.DataFrame,
    date_from: str = "2026-01-01",
    date_to: str = "2026-01-31",
    cutoff: str = "09:20",
) -> list[dict]:
    """Error metrics by hour of day."""
    cache_key = (date_from, date_to, cutoff, len(forecasts_df), len(actuals_df))
    if cache_key in _hourly_cache:
        return _hourly_cache[cache_key]

    joined = _build_joined(forecasts_df, actuals_df, date_from, date_to, cutoff)
    if joined.empty:
        return []

    valid = joined.dropna(subset=["errorMW"]).copy()
    valid["hour"] = valid["startTime"].dt.hour
    valid["abs_error"] = valid["errorMW"].abs()
    valid["sq_error"] = valid["errorMW"] ** 2

    agg = valid.groupby("hour").agg(
        mae=("abs_error", "mean"),
        rmse=("sq_error", lambda x: float(np.sqrt(x.mean()))),
        bias=("errorMW", "mean"),
        count=("errorMW", "count"),
    ).reset_index()

    results = []
    for _, row in agg.iterrows():
        results.append({
            "hour": int(row["hour"]),
            "mae": round(float(row["mae"]), 1),
            "rmse": round(float(row["rmse"]), 1),
            "bias": round(float(row["bias"]), 1),
            "count": int(row["count"]),
        })
    results = sorted(results, key=lambda r: r["hour"])
    _hourly_cache[cache_key] = results
    return results


def compute_error_distribution(
    forecasts_df: pd.DataFrame,
    actuals_df: pd.DataFrame,
    date_from: str = "2026-01-01",
    date_to: str = "2026-01-31",
    cutoff: str = "09:20",
    n_bins: int = 40,
) -> dict:
    """Histogram and percentiles of forecast errors."""
    cache_key = (date_from, date_to, cutoff, len(forecasts_df), len(actuals_df))
    if cache_key in _dist_cache:
        return _dist_cache[cache_key]

    joined = _build_joined(forecasts_df, actuals_df, date_from, date_to, cutoff)
    if joined.empty:
        return {}

    valid = joined.dropna(subset=["errorMW"])
    errors = valid["errorMW"].values

    counts, bin_edges = np.histogram(errors, bins=n_bins)
    abs_errors = np.abs(errors)

    result = {
        "bins": [round(float(b), 1) for b in bin_edges],
        "counts": [int(c) for c in counts],
        "p50": round(float(np.percentile(abs_errors, 50)), 1),
        "p90": round(float(np.percentile(abs_errors, 90)), 1),
        "p95": round(float(np.percentile(abs_errors, 95)), 1),
        "largestUnder": round(float(errors.min()), 1),
        "largestOver": round(float(errors.max()), 1),
        "pctAbove1GW": round(float((abs_errors > 1000).mean() * 100), 1),
    }
    _dist_cache[cache_key] = result
    return result


def compute_heatmap(
    forecasts_df: pd.DataFrame,
    actuals_df: pd.DataFrame,
    date_from: str = "2026-01-01",
    date_to: str = "2026-01-31",
    cutoff: str = "09:20",
) -> list[dict]:
    """Day × hour-of-day error heatmap."""
    cache_key = (date_from, date_to, cutoff, len(forecasts_df), len(actuals_df))
    if cache_key in _heatmap_cache:
        return _heatmap_cache[cache_key]

    joined = _build_joined(forecasts_df, actuals_df, date_from, date_to, cutoff)
    if joined.empty:
        return []

    valid = joined.dropna(subset=["errorMW"]).copy()
    valid["hour"] = valid["startTime"].dt.hour
    valid["abs_error"] = valid["errorMW"].abs()

    agg = valid.groupby(["date", "hour"], as_index=False)["abs_error"].mean()
    agg["mae"] = agg["abs_error"].round(1)

    results = [
        {"date": str(r["date"]), "hour": int(r["hour"]), "mae": float(r["mae"])}
        for r in agg[["date", "hour", "mae"]].to_dict(orient="records")
    ]
    _heatmap_cache[cache_key] = results
    return results

