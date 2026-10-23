"""Decision forecast service — the heart of WindLens.

Implements the "latest forecast available at decision time" rule:
for each target half-hour on delivery day D, select the forecast with
max publishTime ≤ cutoff T.  No look-ahead leakage.
"""

from __future__ import annotations

from typing import Optional
import numpy as np
import pandas as pd

_joined_cache: dict[tuple[str, str, str, int, int], pd.DataFrame] = {}
_decision_cache: dict[tuple[str, str, int, int], pd.DataFrame] = {}
_evolution_cache: dict[tuple[str, str, int, int], dict] = {}


def clear_decision_caches() -> None:
    """Clear in-memory calculation caches."""
    _joined_cache.clear()
    _decision_cache.clear()
    _evolution_cache.clear()


def _horizon_bucket(h: float) -> str:
    if h <= 6:
        return "0-6h"
    if h <= 12:
        return "6-12h"
    if h <= 24:
        return "12-24h"
    if h <= 36:
        return "24-36h"
    return "36-48h"


def _build_joined(
    forecasts_df: pd.DataFrame,
    actuals_df: pd.DataFrame,
    date_from: str,
    date_to: str,
    cutoff: str = "09:20",
) -> pd.DataFrame:
    """Build the joined forecast–actual frame for a date range with vectorization & caching."""
    if forecasts_df.empty or actuals_df.empty:
        return pd.DataFrame()

    cache_key = (date_from, date_to, cutoff, len(forecasts_df), len(actuals_df))
    if cache_key in _joined_cache:
        return _joined_cache[cache_key]

    hh, mm = map(int, cutoff.split(":"))

    start_ts = pd.Timestamp(date_from, tz="UTC").floor("D")
    end_ts = pd.Timestamp(date_to, tz="UTC").floor("D") + pd.Timedelta(hours=24)

    fc_range = forecasts_df[
        (forecasts_df["startTime"] >= start_ts) & (forecasts_df["startTime"] < end_ts)
    ].copy()

    if fc_range.empty:
        return pd.DataFrame()

    fc_range["cutoff_ts"] = (
        fc_range["startTime"].dt.floor("D") - pd.Timedelta(days=1) + pd.Timedelta(hours=hh, minutes=mm)
    )

    eligible = fc_range[fc_range["publishTime"] <= fc_range["cutoff_ts"]]
    if eligible.empty:
        return pd.DataFrame()

    idx = eligible.groupby("startTime")["publishTime"].idxmax()
    dec = eligible.loc[idx].copy()
    dec["forecastMW"] = dec["generation"]
    dec["horizonHours"] = (
        (dec["startTime"] - dec["publishTime"]).dt.total_seconds() / 3600
    ).round(1)

    act_range = actuals_df[
        (actuals_df["startTime"] >= start_ts) & (actuals_df["startTime"] < end_ts)
    ].copy()

    if not act_range.empty:
        act_range["hour"] = act_range["startTime"].dt.floor("h")
        hourly_act = (
            act_range.groupby("hour")["generation"]
            .mean()
            .reset_index()
            .rename(columns={"hour": "startTime", "generation": "actualMW"})
        )
        merged = dec.merge(hourly_act, on="startTime", how="left")
        merged["errorMW"] = merged["forecastMW"] - merged["actualMW"]
    else:
        merged = dec.copy()
        merged["actualMW"] = np.nan
        merged["errorMW"] = np.nan

    merged["date"] = merged["startTime"].dt.strftime("%Y-%m-%d")
    merged = merged.sort_values("startTime").reset_index(drop=True)

    _joined_cache[cache_key] = merged
    return merged


def compute_decision_forecast(
    forecasts_df: pd.DataFrame,
    actuals_df: pd.DataFrame,
    delivery_date: str,
    cutoff_time: str = "09:20",
) -> pd.DataFrame:
    """Build the decision forecast for a delivery day.

    Returns DataFrame with columns:
        startTime, forecastMW, actualMW, errorMW,
        publishTime, horizonHours,
        bandP10, bandP90, conservativeMW
    """
    if forecasts_df.empty or actuals_df.empty:
        return pd.DataFrame()

    cache_key = (delivery_date, cutoff_time, len(forecasts_df), len(actuals_df))
    if cache_key in _decision_cache:
        return _decision_cache[cache_key].copy()

    # Get the day's joined points
    day_df = _build_joined(forecasts_df, actuals_df, delivery_date, delivery_date, cutoff_time)
    if day_df.empty:
        return pd.DataFrame()

    decision = day_df.copy()

    # ── Uncertainty bands (from historical errors strictly before delivery day, no look-ahead) ──
    decision = _add_uncertainty_bands(
        decision, forecasts_df, actuals_df, delivery_date, cutoff_time
    )

    decision = decision.sort_values("startTime").reset_index(drop=True)
    res = decision[
        [
            "startTime", "forecastMW", "actualMW", "errorMW",
            "publishTime", "horizonHours",
            "bandP10", "bandP90", "conservativeMW",
        ]
    ]
    _decision_cache[cache_key] = res
    return res.copy()


def _add_uncertainty_bands(
    decision: pd.DataFrame,
    all_forecasts: pd.DataFrame,
    all_actuals: pd.DataFrame,
    delivery_date: str,
    cutoff_time: str,
) -> pd.DataFrame:
    """Add empirical P10–P90 uncertainty bands and conservative hedging line.

    Methodology & Causal Integrity:
    - Derivation: Historical forecast errors (error = forecast - actual) strictly prior
      to the decision cutoff timestamp (D-1 at cutoff_time UTC) are partitioned into
      forecast horizon buckets (12-18h, 18-24h, 24-30h, 30-36h, >36h).
    - Zero Lookahead: Only actuals whose delivery hour finished before the decision cutoff
      (startTime < cutoff_ts) are included in the historical error distribution. No afternoon
      or evening outturns from D-1 are leaked into the historical distribution.
    - Physical Bounds: Generation cannot be negative, so P10 and conservativeMW are clamped
      to >= 0 MW, with P10 <= P90 and conservativeMW <= forecastMW.
    """
    d = pd.Timestamp(delivery_date, tz="UTC")
    hh, mm = map(int, cutoff_time.split(":"))
    # Point-in-time cutoff on D-1
    cutoff_ts = d - pd.Timedelta(days=1) + pd.Timedelta(hours=hh, minutes=mm)

    # Vectorized pull of all history prior to delivery_date
    full_history = _build_joined(all_forecasts, all_actuals, "2025-12-27", delivery_date, cutoff_time)
    if full_history.empty:
        decision["bandP10"] = np.nan
        decision["bandP90"] = np.nan
        decision["conservativeMW"] = np.nan
        return decision

    # Strict point-in-time filter: delivery hour must have concluded before the decision cutoff
    hist = full_history[(full_history["startTime"] < cutoff_ts) & full_history["errorMW"].notna()].copy()

    if hist.empty or len(hist) < 3:
        decision["bandP10"] = np.nan
        decision["bandP90"] = np.nan
        decision["conservativeMW"] = np.nan
        return decision

    global_p10 = float(np.percentile(hist["errorMW"], 10))
    global_p90 = float(np.percentile(hist["errorMW"], 90))
    global_p90_abs = float(np.percentile(np.abs(hist["errorMW"]), 90))

    hist["bucket"] = hist["horizonHours"].apply(_horizon_bucket)

    band_stats = hist.groupby("bucket")["errorMW"].agg(
        p10=lambda x: np.percentile(x, 10),
        p90=lambda x: np.percentile(x, 90),
        p90_abs=lambda x: np.percentile(np.abs(x), 90),
    ).reset_index()

    decision["bucket"] = decision["horizonHours"].apply(_horizon_bucket)
    decision = decision.merge(band_stats, on="bucket", how="left")

    decision["p10"] = decision["p10"].fillna(global_p10)
    decision["p90"] = decision["p90"].fillna(global_p90)
    decision["p90_abs"] = decision["p90_abs"].fillna(global_p90_abs)

    # Band: forecast - error percentiles (error = forecast - actual => actual = forecast - error)
    # Higher error percentile means higher overforecast, so forecast - p90 is the conservative lower bound (P10 of actuals)
    # Lower error percentile means underforecast, so forecast - p10 is the optimistic upper bound (P90 of actuals)
    p10_series = (decision["forecastMW"] - decision["p90"]).round(0)
    p90_series = (decision["forecastMW"] - decision["p10"]).round(0)
    cons_series = (decision["forecastMW"] - decision["p90_abs"]).round(0)

    # Physical clamping: generation cannot be negative
    decision["bandP10"] = np.maximum(0, p10_series)
    decision["bandP90"] = np.maximum(0, p90_series)
    decision["conservativeMW"] = np.maximum(0, cons_series)

    # Invariants: bandP10 <= bandP90 and conservativeMW <= forecastMW
    decision["bandP10"] = np.minimum(decision["bandP10"], decision["bandP90"])
    decision["conservativeMW"] = np.minimum(decision["conservativeMW"], decision["forecastMW"])

    decision = decision.drop(columns=["bucket", "p10", "p90", "p90_abs"], errors="ignore")
    return decision


def get_forecast_evolution(
    forecasts_df: pd.DataFrame,
    actuals_df: pd.DataFrame,
    target_time: str,
    cutoff_time: Optional[str] = "09:20",
) -> dict:
    """Get all forecast versions for a single target startTime."""
    if forecasts_df.empty:
        return {"targetTime": target_time, "actualMW": None, "versions": []}

    cache_key = (target_time, cutoff_time or "09:20", len(forecasts_df), len(actuals_df))
    if cache_key in _evolution_cache:
        return _evolution_cache[cache_key]

    target = pd.Timestamp(target_time, tz="UTC")
    delivery_date = target.normalize()

    fc = forecasts_df[forecasts_df["startTime"] == target].copy()
    fc = fc.sort_values("publishTime")

    # Determine which version would be selected at cutoff
    hh, mm = map(int, (cutoff_time or "09:20").split(":"))
    cutoff = delivery_date - pd.Timedelta(days=1) + pd.Timedelta(hours=hh, minutes=mm)
    eligible = fc[fc["publishTime"] <= cutoff]
    selected_publish = eligible["publishTime"].max() if not eligible.empty else None

    # Get actual
    act = actuals_df.copy()
    hour_start = target
    hour_end = target + pd.Timedelta(hours=1)
    act_match = act[(act["startTime"] >= hour_start) & (act["startTime"] < hour_end)]
    actual_mw = act_match["generation"].mean() if not act_match.empty else None

    versions = []
    for _, row in fc.iterrows():
        horizon = (target - row["publishTime"]).total_seconds() / 3600
        is_post = bool(row["publishTime"] > cutoff)
        versions.append({
            "publishTime": row["publishTime"].isoformat().replace("+00:00", "Z"),
            "forecastMW": row["generation"],
            "horizonHours": round(horizon, 1),
            "isSelected": (
                row["publishTime"] == selected_publish
                if selected_publish is not None
                else False
            ),
            "isPostCutoff": is_post,
        })

    result = {
        "targetTime": target.isoformat().replace("+00:00", "Z"),
        "actualMW": round(actual_mw, 0) if actual_mw is not None else None,
        "decisionCutoff": cutoff.isoformat().replace("+00:00", "Z"),
        "versions": versions,
    }
    _evolution_cache[cache_key] = result
    return result

