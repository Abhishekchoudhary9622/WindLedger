"""Trading and financial imbalance risk modeling services.

Simulates balancing settlement penalties, cashout exposure, and optimal
day-ahead bidding strategies per GB BSC market rules.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from typing import Any

from .decision_forecast import _build_joined, compute_decision_forecast

_trading_cache: dict[str, dict[str, Any]] = {}


def compute_imbalance_risk(
    fc_df: pd.DataFrame,
    act_df: pd.DataFrame,
    date_from: str = "2026-01-01",
    date_to: str = "2026-01-31",
    cutoff: str = "09:20",
    day_ahead_price: float = 75.0,
    short_penalty_spread: float = 35.0,
    long_discount_spread: float = 20.0,
) -> dict[str, Any]:
    """Calculate financial imbalance exposure and cashout penalties.
    
    Under GB BSC rules:
    - Over-forecast (Short): Wind farm generated less than nominated. Must buy shortfall
      from Elexon at System Buy Price (SBP = DA + short_penalty_spread).
    - Under-forecast (Long): Wind farm generated surplus. Sold back to grid at
      System Sell Price (SSP = DA - long_discount_spread).
    """
    cache_key = f"{date_from}_{date_to}_{cutoff}_{day_ahead_price}_{short_penalty_spread}_{long_discount_spread}"
    if cache_key in _trading_cache:
        return _trading_cache[cache_key]

    joined = _build_joined(fc_df, act_df, date_from, date_to, cutoff)
    if joined.empty:
        return {
            "period": f"{date_from} to {date_to}",
            "cutoff": cutoff,
            "totalGenerationMWh": 0.0,
            "totalForecastMWh": 0.0,
            "totalShortMWh": 0.0,
            "totalLongMWh": 0.0,
            "totalPenaltyCostGbp": 0.0,
            "avgPenaltyPerMWh": 0.0,
            "shortCostGbp": 0.0,
            "longCostGbp": 0.0,
            "asymmetryRatio": 1.0,
            "dailyBreakdown": [],
            "topRiskDays": [],
        }

    err = joined["forecastMW"] - joined["actualMW"]
    is_short = err > 0
    is_long = err < 0

    short_mwh = np.where(is_short, err, 0.0)
    long_mwh = np.where(is_long, -err, 0.0)

    short_cost = short_mwh * short_penalty_spread
    long_cost = long_mwh * long_discount_spread
    total_penalty = short_cost + long_cost

    joined = joined.copy()
    joined["abs_error"] = np.abs(err)
    joined["short_mwh"] = short_mwh
    joined["long_mwh"] = long_mwh
    joined["short_cost"] = short_cost
    joined["long_cost"] = long_cost
    joined["penalty_cost"] = total_penalty

    tot_gen = float(joined["actualMW"].sum())
    tot_fc = float(joined["forecastMW"].sum())
    tot_short = float(short_mwh.sum())
    tot_long = float(long_mwh.sum())
    tot_penalty = float(total_penalty.sum())
    tot_short_cost = float(short_cost.sum())
    tot_long_cost = float(long_cost.sum())

    asymmetry = round(tot_short_cost / tot_long_cost, 2) if tot_long_cost > 0 else 1.0
    avg_penalty = round(tot_penalty / tot_gen, 2) if tot_gen > 0 else 0.0

    # Daily aggregation
    daily_grp = joined.groupby("date").agg(
        gen_mwh=("actualMW", "sum"),
        fc_mwh=("forecastMW", "sum"),
        short_mwh=("short_mwh", "sum"),
        long_mwh=("long_mwh", "sum"),
        penalty_gbp=("penalty_cost", "sum"),
        mae=("abs_error", "mean"),
    ).reset_index()

    daily_list = []
    for _, row in daily_grp.iterrows():
        daily_list.append({
            "date": str(row["date"]),
            "generationMWh": round(float(row["gen_mwh"]), 0),
            "forecastMWh": round(float(row["fc_mwh"]), 0),
            "shortMWh": round(float(row["short_mwh"]), 0),
            "longMWh": round(float(row["long_mwh"]), 0),
            "penaltyGbp": round(float(row["penalty_gbp"]), 0),
            "maeMW": round(float(row["mae"]), 1),
        })

    # Sort to find top risk days
    top_risk = sorted(daily_list, key=lambda x: x["penaltyGbp"], reverse=True)[:5]

    res = {
        "period": f"{date_from} to {date_to}",
        "cutoff": cutoff,
        "pricingParameters": {
            "dayAheadPriceGbp": day_ahead_price,
            "shortPenaltySpreadGbp": short_penalty_spread,
            "longDiscountSpreadGbp": long_discount_spread,
            "systemBuyPriceGbp": day_ahead_price + short_penalty_spread,
            "systemSellPriceGbp": day_ahead_price - long_discount_spread,
        },
        "totalGenerationMWh": round(tot_gen, 0),
        "totalForecastMWh": round(tot_fc, 0),
        "totalShortMWh": round(tot_short, 0),
        "totalLongMWh": round(tot_long, 0),
        "totalPenaltyCostGbp": round(tot_penalty, 0),
        "avgPenaltyPerMWh": avg_penalty,
        "shortCostGbp": round(tot_short_cost, 0),
        "longCostGbp": round(tot_long_cost, 0),
        "asymmetryRatio": asymmetry,
        "dailyBreakdown": daily_list,
        "topRiskDays": top_risk,
    }

    _trading_cache[cache_key] = res
    return res


def compute_bid_recommendation(
    fc_df: pd.DataFrame,
    act_df: pd.DataFrame,
    delivery_date: str = "2026-01-15",
    cutoff: str = "09:20",
    day_ahead_price: float = 75.0,
    short_penalty_spread: float = 35.0,
    long_discount_spread: float = 20.0,
) -> dict[str, Any]:
    """Generate 24-hour optimal day-ahead bidding schedule under 3 risk postures."""
    df = compute_decision_forecast(fc_df, act_df, delivery_date, cutoff)
    if df.empty:
        return {
            "deliveryDate": delivery_date,
            "cutoff": cutoff,
            "hourlySchedule": [],
            "strategySummary": {},
        }

    hourly_schedule = []
    tot_conservative = 0.0
    tot_neutral = 0.0
    tot_aggressive = 0.0

    for _, row in df.iterrows():
        fc = float(row["forecastMW"])
        p10 = float(row["bandP10"]) if row["bandP10"] == row["bandP10"] else fc * 0.82
        p90 = float(row["bandP90"]) if row["bandP90"] == row["bandP90"] else fc * 1.18
        cons = float(row["conservativeMW"]) if row["conservativeMW"] == row["conservativeMW"] else max(0.0, fc - 0.5 * (fc - p10))

        neutral_bid = max(0.0, round(fc, 0))
        cons_bid = min(neutral_bid, max(0.0, round(cons, 0)))
        upside = max(0.0, p90 - fc) if p90 > fc else max(100.0, fc * 0.05)
        agg_bid = max(neutral_bid, round(fc + 0.4 * upside, 0))

        tot_conservative += cons_bid
        tot_neutral += neutral_bid
        tot_aggressive += agg_bid

        spread = round(p90 - p10, 0)
        risk_level = "High" if spread > 1200 else ("Medium" if spread > 600 else "Low")
        
        rationale = (
            f"{risk_level} uncertainty (+/- {int(spread/2)} MW). Bid conservative to protect against "
            f"£{short_penalty_spread:.0f}/MWh SBP cashout spike."
            if risk_level in ["High", "Medium"]
            else "Tight forecast confidence; standard neutral nomination recommended."
        )

        hourly_schedule.append({
            "targetTime": row["startTime"].isoformat(),
            "targetHour": row["startTime"].hour,
            "forecastMW": neutral_bid,
            "actualMW": round(float(row["actualMW"]), 0) if row["actualMW"] is not None and row["actualMW"] == row["actualMW"] else None,
            "conservativeBidMW": cons_bid,
            "neutralBidMW": neutral_bid,
            "aggressiveBidMW": agg_bid,
            "uncertaintySpreadMW": spread,
            "riskLevel": risk_level,
            "recommendationRationale": rationale,
        })

    return {
        "deliveryDate": delivery_date,
        "cutoff": cutoff,
        "pricingParameters": {
            "dayAheadPriceGbp": day_ahead_price,
            "shortPenaltySpreadGbp": short_penalty_spread,
            "longDiscountSpreadGbp": long_discount_spread,
        },
        "strategySummary": {
            "conservativeTotalMWh": round(tot_conservative, 0),
            "neutralTotalMWh": round(tot_neutral, 0),
            "aggressiveTotalMWh": round(tot_aggressive, 0),
            "conservativeHedgingBufferMWh": round(tot_neutral - tot_conservative, 0),
            "conservativeHedgingBufferPct": round((tot_neutral - tot_conservative) / tot_neutral * 100, 1) if tot_neutral > 0 else 0.0,
            "recommendedStrategy": "Conservative" if short_penalty_spread > long_discount_spread else "Neutral",
            "executiveGuidance": (
                f"Asymmetric cashout penalty: System Buy Price spread (+£{short_penalty_spread:.0f}/MWh) exceeds "
                f"Sell Price discount (-£{long_discount_spread:.0f}/MWh). Bidding the conservative schedule "
                f"hedges {round(tot_neutral - tot_conservative, 0):,.0f} MWh of potential shortfall risk."
            ),
        },
        "hourlySchedule": hourly_schedule,
    }


def simulate_scenario(
    fc_df: pd.DataFrame,
    act_df: pd.DataFrame,
    date_from: str = "2026-01-01",
    date_to: str = "2026-01-31",
    cutoff: str = "09:20",
    forecast_shift_pct: float = 0.0,
    forecast_bias_mw: float = 0.0,
    day_ahead_price: float = 75.0,
    short_penalty_spread: float = 35.0,
    long_discount_spread: float = 20.0,
) -> dict[str, Any]:
    """Stress-test forecast shifts and price fluctuations on trading P&L."""
    baseline = compute_imbalance_risk(
        fc_df, act_df, date_from, date_to, cutoff,
        day_ahead_price, short_penalty_spread, long_discount_spread
    )

    joined = _build_joined(fc_df, act_df, date_from, date_to, cutoff)
    if joined.empty:
        return {"baseline": baseline, "simulated": baseline, "delta": {}}

    # Apply scenario perturbation
    sim_fc = np.maximum(0.0, joined["forecastMW"] * (1.0 + forecast_shift_pct / 100.0) + forecast_bias_mw)
    sim_err = sim_fc - joined["actualMW"]

    sim_short_mwh = np.where(sim_err > 0, sim_err, 0.0)
    sim_long_mwh = np.where(sim_err < 0, -sim_err, 0.0)

    sim_short_cost = sim_short_mwh * short_penalty_spread
    sim_long_cost = sim_long_mwh * long_discount_spread
    sim_total_penalty = sim_short_cost + sim_long_cost

    tot_sim_penalty = float(sim_total_penalty.sum())
    tot_sim_short = float(sim_short_mwh.sum())
    tot_sim_long = float(sim_long_mwh.sum())
    sim_mae = float(np.abs(sim_err).mean())

    cost_delta = tot_sim_penalty - baseline["totalPenaltyCostGbp"]
    cost_delta_pct = (cost_delta / baseline["totalPenaltyCostGbp"] * 100.0) if baseline["totalPenaltyCostGbp"] > 0 else 0.0

    return {
        "scenario": {
            "forecastShiftPct": forecast_shift_pct,
            "forecastBiasMW": forecast_bias_mw,
            "dayAheadPriceGbp": day_ahead_price,
            "shortPenaltySpreadGbp": short_penalty_spread,
            "longDiscountSpreadGbp": long_discount_spread,
        },
        "baselinePenaltyGbp": baseline["totalPenaltyCostGbp"],
        "simulatedPenaltyGbp": round(tot_sim_penalty, 0),
        "costDeltaGbp": round(cost_delta, 0),
        "costDeltaPct": round(cost_delta_pct, 2),
        "simulatedShortMWh": round(tot_sim_short, 0),
        "simulatedLongMWh": round(tot_sim_long, 0),
        "simulatedMaeMW": round(sim_mae, 1),
        "impactSummary": (
            f"Scenario results in a {cost_delta_pct:+.1f}% change in balancing cashout penalties "
            f"({cost_delta:+,.0f} GBP) across January 2026."
        ),
    }
