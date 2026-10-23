"""Wind power ramp event detection and volatility evaluation service.

Detects large-scale wind generation ramp events (>800 MW swings) and evaluates
how well the day-ahead decision forecast captured the ramp timing and magnitude.
"""

from __future__ import annotations

import pandas as pd
from typing import Any

from .decision_forecast import _build_joined

_ramps_cache: dict[str, dict[str, Any]] = {}


def detect_ramp_events(
    fc_df: pd.DataFrame,
    act_df: pd.DataFrame,
    date_from: str = "2026-01-01",
    date_to: str = "2026-01-31",
    cutoff: str = "09:20",
    ramp_threshold_mw: float = 800.0,
    window_hours: int = 2,
) -> dict[str, Any]:
    """Identify steep wind ramp events and evaluate forecast ramp tracking accuracy."""
    cache_key = f"{date_from}_{date_to}_{cutoff}_{ramp_threshold_mw}_{window_hours}"
    if cache_key in _ramps_cache:
        return _ramps_cache[cache_key]

    joined = _build_joined(fc_df, act_df, date_from, date_to, cutoff)
    if joined.empty or len(joined) < window_hours + 1:
        return {
            "period": f"{date_from} to {date_to}",
            "cutoff": cutoff,
            "thresholdMW": ramp_threshold_mw,
            "windowHours": window_hours,
            "totalRampsDetected": 0,
            "upRampsCount": 0,
            "downRampsCount": 0,
            "rampCaptureRatePct": 0.0,
            "meanRampRateMWPerHr": 0.0,
            "events": [],
            "largestRamp": None,
        }

    # Sort chronologically by startTime
    df = joined.sort_values("startTime").reset_index(drop=True)

    actual_arr = df["actualMW"].to_numpy()
    fc_arr = df["forecastMW"].to_numpy()
    times = df["startTime"].tolist()

    events = []
    i = window_hours
    while i < len(df):
        act_delta = float(actual_arr[i] - actual_arr[i - window_hours])
        abs_delta = abs(act_delta)

        if abs_delta >= ramp_threshold_mw:
            fc_delta = float(fc_arr[i] - fc_arr[i - window_hours])
            direction = "UP" if act_delta > 0 else "DOWN"
            
            # Forecast capture: predicted a ramp in same direction >= 50% of threshold
            fc_captured = (act_delta > 0 and fc_delta >= (ramp_threshold_mw * 0.5)) or (
                act_delta < 0 and fc_delta <= -(ramp_threshold_mw * 0.5)
            )

            severity = (
                "Extreme" if abs_delta >= 2500
                else ("Severe" if abs_delta >= 1500 else "Moderate")
            )

            events.append({
                "eventId": f"RAMP-{len(events) + 1:03d}",
                "startTime": times[i - window_hours].isoformat(),
                "endTime": times[i].isoformat(),
                "direction": direction,
                "durationHours": window_hours,
                "actualDeltaMW": round(act_delta, 0),
                "forecastDeltaMW": round(fc_delta, 0),
                "actualRampRateMWPerHr": round(abs_delta / window_hours, 0),
                "forecastRampRateMWPerHr": round(abs(fc_delta) / window_hours, 0),
                "amplitudeErrorMW": round(fc_delta - act_delta, 0),
                "detectedByForecast": bool(fc_captured),
                "severity": severity,
            })
            # Skip forward to avoid overlapping duplicate window detections
            i += window_hours
        else:
            i += 1

    up_count = sum(1 for e in events if e["direction"] == "UP")
    down_count = sum(1 for e in events if e["direction"] == "DOWN")
    captured_count = sum(1 for e in events if e["detectedByForecast"])
    capture_rate = round((captured_count / len(events) * 100.0), 1) if events else 100.0

    mean_ramp_rate = (
        round(sum(e["actualRampRateMWPerHr"] for e in events) / len(events), 0)
        if events else 0.0
    )

    largest_event = max(events, key=lambda x: abs(x["actualDeltaMW"])) if events else None

    res = {
        "period": f"{date_from} to {date_to}",
        "cutoff": cutoff,
        "thresholdMW": ramp_threshold_mw,
        "windowHours": window_hours,
        "totalRampsDetected": len(events),
        "upRampsCount": up_count,
        "downRampsCount": down_count,
        "rampCaptureRatePct": capture_rate,
        "meanRampRateMWPerHr": mean_ramp_rate,
        "events": events,
        "largestRamp": largest_event,
    }

    _ramps_cache[cache_key] = res
    return res
