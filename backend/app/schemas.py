"""Pydantic schemas for WindLens API responses."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# ── Shared ──────────────────────────────────────────────────────────────
class TimeSeriesPoint(BaseModel):
    """Single half-hourly data point."""
    start_time: datetime = Field(..., alias="startTime")
    generation: float
    model_config = {"populate_by_name": True}


class ForecastPoint(TimeSeriesPoint):
    """Forecast point including publish metadata."""
    publish_time: datetime = Field(..., alias="publishTime")
    horizon_hours: float = Field(..., alias="horizonHours")


class DecisionForecastPoint(BaseModel):
    """A single point in the decision forecast view."""
    start_time: datetime = Field(..., alias="startTime")
    forecast_mw: float = Field(..., alias="forecastMW")
    actual_mw: Optional[float] = Field(None, alias="actualMW")
    error_mw: Optional[float] = Field(None, alias="errorMW")
    publish_time: datetime = Field(..., alias="publishTime")
    horizon_hours: float = Field(..., alias="horizonHours")
    band_p10: Optional[float] = Field(None, alias="bandP10")
    band_p90: Optional[float] = Field(None, alias="bandP90")
    conservative_mw: Optional[float] = Field(None, alias="conservativeMW")
    model_config = {"populate_by_name": True}


# ── Decision endpoint ──────────────────────────────────────────────────
class DecisionForecastResponse(BaseModel):
    delivery_date: str = Field(..., alias="deliveryDate")
    cutoff: str
    points: list[DecisionForecastPoint]
    summary: DecisionSummary
    model_config = {"populate_by_name": True}


class DecisionSummary(BaseModel):
    peak_mw: float = Field(..., alias="peakMW")
    trough_mw: float = Field(..., alias="troughMW")
    mean_mw: float = Field(..., alias="meanMW")
    total_mwh: float = Field(..., alias="totalMWh")
    avg_horizon_hours: float = Field(..., alias="avgHorizonHours")
    forecast_count: int = Field(..., alias="forecastCount")
    model_config = {"populate_by_name": True}


# ── Accuracy endpoints ─────────────────────────────────────────────────
class AccuracySummary(BaseModel):
    mae: float
    rmse: float
    bias: float
    nmae_pct: float = Field(..., alias="nmaePct")
    p50_error: float = Field(..., alias="p50Error")
    p90_error: float = Field(..., alias="p90Error")
    p95_error: float = Field(..., alias="p95Error")
    matched_periods: int = Field(..., alias="matchedPeriods")
    total_periods: int = Field(..., alias="totalPeriods")
    mean_actual: float = Field(..., alias="meanActual")
    model_config = {"populate_by_name": True}


class HorizonBucket(BaseModel):
    bucket: str
    mae: float
    rmse: float
    bias: float
    count: int


class DailyAccuracy(BaseModel):
    date: str
    mae: float
    rmse: float
    bias: float
    count: int


class HourlyAccuracy(BaseModel):
    hour: int
    mae: float
    rmse: float
    bias: float
    count: int


class ErrorDistribution(BaseModel):
    bins: list[float]
    counts: list[int]
    p50: float
    p90: float
    p95: float
    largest_under: float = Field(..., alias="largestUnder")
    largest_over: float = Field(..., alias="largestOver")
    pct_above_1gw: float = Field(..., alias="pctAbove1GW")
    model_config = {"populate_by_name": True}


class HeatmapCell(BaseModel):
    date: str
    hour: int
    mae: float


# ── Forecast evolution ──────────────────────────────────────────────────
class EvolutionVersion(BaseModel):
    publish_time: datetime = Field(..., alias="publishTime")
    forecast_mw: float = Field(..., alias="forecastMW")
    horizon_hours: float = Field(..., alias="horizonHours")
    is_selected: bool = Field(False, alias="isSelected")
    model_config = {"populate_by_name": True}


class EvolutionResponse(BaseModel):
    target_time: datetime = Field(..., alias="targetTime")
    actual_mw: Optional[float] = Field(None, alias="actualMW")
    versions: list[EvolutionVersion]
    model_config = {"populate_by_name": True}


# ── Meta ────────────────────────────────────────────────────────────────
class MetaResponse(BaseModel):
    available_dates: list[str] = Field(..., alias="availableDates")
    default_cutoff: str = Field(..., alias="defaultCutoff")
    data_range: dict = Field(..., alias="dataRange")
    forecast_count: int = Field(..., alias="forecastCount")
    actual_count: int = Field(..., alias="actualCount")
    model_config = {"populate_by_name": True}


# ── Trading & Imbalance Analytics ───────────────────────────────────────
class PricingParameters(BaseModel):
    day_ahead_price_gbp: float = Field(..., alias="dayAheadPriceGbp")
    short_penalty_spread_gbp: float = Field(..., alias="shortPenaltySpreadGbp")
    long_discount_spread_gbp: float = Field(..., alias="longDiscountSpreadGbp")
    system_buy_price_gbp: float = Field(..., alias="systemBuyPriceGbp")
    system_sell_price_gbp: float = Field(..., alias="systemSellPriceGbp")
    model_config = {"populate_by_name": True}


class DailyImbalance(BaseModel):
    date: str
    generation_mwh: float = Field(..., alias="generationMWh")
    forecast_mwh: float = Field(..., alias="forecastMWh")
    short_mwh: float = Field(..., alias="shortMWh")
    long_mwh: float = Field(..., alias="longMWh")
    penalty_gbp: float = Field(..., alias="penaltyGbp")
    mae_mw: float = Field(..., alias="maeMW")
    model_config = {"populate_by_name": True}


class ImbalanceRiskResponse(BaseModel):
    period: str
    cutoff: str
    pricing_parameters: PricingParameters = Field(..., alias="pricingParameters")
    total_generation_mwh: float = Field(..., alias="totalGenerationMWh")
    total_forecast_mwh: float = Field(..., alias="totalForecastMWh")
    total_short_mwh: float = Field(..., alias="totalShortMWh")
    total_long_mwh: float = Field(..., alias="totalLongMWh")
    total_penalty_cost_gbp: float = Field(..., alias="totalPenaltyCostGbp")
    avg_penalty_per_mwh: float = Field(..., alias="avgPenaltyPerMWh")
    short_cost_gbp: float = Field(..., alias="shortCostGbp")
    long_cost_gbp: float = Field(..., alias="longCostGbp")
    asymmetry_ratio: float = Field(..., alias="asymmetryRatio")
    daily_breakdown: list[DailyImbalance] = Field(..., alias="dailyBreakdown")
    top_risk_days: list[DailyImbalance] = Field(..., alias="topRiskDays")
    model_config = {"populate_by_name": True}


class HourlyBid(BaseModel):
    target_time: str = Field(..., alias="targetTime")
    target_hour: int = Field(..., alias="targetHour")
    forecast_mw: float = Field(..., alias="forecastMW")
    actual_mw: Optional[float] = Field(None, alias="actualMW")
    conservative_bid_mw: float = Field(..., alias="conservativeBidMW")
    neutral_bid_mw: float = Field(..., alias="neutralBidMW")
    aggressive_bid_mw: float = Field(..., alias="aggressiveBidMW")
    uncertainty_spread_mw: float = Field(..., alias="uncertaintySpreadMW")
    risk_level: str = Field(..., alias="riskLevel")
    recommendation_rationale: str = Field(..., alias="recommendationRationale")
    model_config = {"populate_by_name": True}


class StrategySummary(BaseModel):
    conservative_total_mwh: float = Field(..., alias="conservativeTotalMWh")
    neutral_total_mwh: float = Field(..., alias="neutralTotalMWh")
    aggressive_total_mwh: float = Field(..., alias="aggressiveTotalMWh")
    conservative_hedging_buffer_mwh: float = Field(..., alias="conservativeHedgingBufferMWh")
    conservative_hedging_buffer_pct: float = Field(..., alias="conservativeHedgingBufferPct")
    recommended_strategy: str = Field(..., alias="recommendedStrategy")
    executive_guidance: str = Field(..., alias="executiveGuidance")
    model_config = {"populate_by_name": True}


class BidRecommendationResponse(BaseModel):
    delivery_date: str = Field(..., alias="deliveryDate")
    cutoff: str
    pricing_parameters: dict = Field(..., alias="pricingParameters")
    strategy_summary: StrategySummary = Field(..., alias="strategySummary")
    hourly_schedule: list[HourlyBid] = Field(..., alias="hourlySchedule")
    model_config = {"populate_by_name": True}


class ScenarioSimulationRequest(BaseModel):
    forecast_shift_pct: float = Field(0.0, description="Percentage shift to apply to forecast (+/- %)")
    forecast_bias_mw: float = Field(0.0, description="Flat MW bias to apply (+/- MW)")
    day_ahead_price: float = Field(75.0, description="Day-Ahead base wholesale price in GBP/MWh")
    short_penalty_spread: float = Field(35.0, description="System Buy Price spread above Day-Ahead")
    long_discount_spread: float = Field(20.0, description="System Sell Price discount below Day-Ahead")


class ScenarioSimulationResponse(BaseModel):
    scenario: dict
    baseline_penalty_gbp: float = Field(..., alias="baselinePenaltyGbp")
    simulated_penalty_gbp: float = Field(..., alias="simulatedPenaltyGbp")
    cost_delta_gbp: float = Field(..., alias="costDeltaGbp")
    cost_delta_pct: float = Field(..., alias="costDeltaPct")
    simulated_short_mwh: float = Field(..., alias="simulatedShortMWh")
    simulated_long_mwh: float = Field(..., alias="simulatedLongMWh")
    simulated_mae_mw: float = Field(..., alias="simulatedMaeMW")
    impact_summary: str = Field(..., alias="impactSummary")
    model_config = {"populate_by_name": True}


# ── Ramp Event Schemas ──────────────────────────────────────────────────
class RampEvent(BaseModel):
    event_id: str = Field(..., alias="eventId")
    start_time: str = Field(..., alias="startTime")
    end_time: str = Field(..., alias="endTime")
    direction: str
    duration_hours: int = Field(..., alias="durationHours")
    actual_delta_mw: float = Field(..., alias="actualDeltaMW")
    forecast_delta_mw: float = Field(..., alias="forecastDeltaMW")
    actual_ramp_rate_mw_per_hr: float = Field(..., alias="actualRampRateMWPerHr")
    forecast_ramp_rate_mw_per_hr: float = Field(..., alias="forecastRampRateMWPerHr")
    amplitude_error_mw: float = Field(..., alias="amplitudeErrorMW")
    detected_by_forecast: bool = Field(..., alias="detectedByForecast")
    severity: str
    model_config = {"populate_by_name": True}


class RampSummaryResponse(BaseModel):
    period: str
    cutoff: str
    threshold_mw: float = Field(..., alias="thresholdMW")
    window_hours: int = Field(..., alias="windowHours")
    total_ramps_detected: int = Field(..., alias="totalRampsDetected")
    up_ramps_count: int = Field(..., alias="upRampsCount")
    down_ramps_count: int = Field(..., alias="downRampsCount")
    ramp_capture_rate_pct: float = Field(..., alias="rampCaptureRatePct")
    mean_ramp_rate_mw_per_hr: float = Field(..., alias="meanRampRateMWPerHr")
    events: list[RampEvent]
    largest_ramp: Optional[RampEvent] = Field(None, alias="largestRamp")
    model_config = {"populate_by_name": True}


# ── Data Management Schemas ─────────────────────────────────────────────
class DatasetMetadata(BaseModel):
    dataset_name: str = Field(..., alias="datasetName")
    source_url: str = Field(..., alias="sourceUrl")
    record_count: int = Field(..., alias="recordCount")
    parquet_size_kb: float = Field(..., alias="parquetSizeKb")
    memory_footprint_mb: float = Field(..., alias="memoryFootprintMb")
    earliest_record: Optional[str] = Field(None, alias="earliestRecord")
    latest_record: Optional[str] = Field(None, alias="latestRecord")
    min_generation_mw: Optional[float] = Field(None, alias="minGenerationMW")
    max_generation_mw: Optional[float] = Field(None, alias="maxGenerationMW")
    mean_generation_mw: Optional[float] = Field(None, alias="meanGenerationMW")
    model_config = {"populate_by_name": True}


class DatasetSummaryResponse(BaseModel):
    status: str
    storage_engine: str = Field(..., alias="storageEngine")
    actuals: DatasetMetadata
    forecasts: DatasetMetadata
    model_config = {"populate_by_name": True}


# ── System Health & Benchmark Schemas ───────────────────────────────────
class SystemHealthResponse(BaseModel):
    status: str
    uptime_seconds: float = Field(..., alias="uptimeSeconds")
    python_version: str = Field(..., alias="pythonVersion")
    platform: str
    memory_rss_mb: float = Field(..., alias="memoryRssMb")
    data_store_ready: bool = Field(..., alias="dataStoreReady")
    cache_entries_count: int = Field(..., alias="cacheEntriesCount")
    timestamp_utc: str = Field(..., alias="timestampUtc")
    model_config = {"populate_by_name": True}


class BenchmarkResponse(BaseModel):
    benchmark_status: str = Field(..., alias="benchmarkStatus")
    decision_query_ms: float = Field(..., alias="decisionQueryMs")
    metrics_summary_ms: float = Field(..., alias="metricsSummaryMs")
    heatmap_matrix_ms: float = Field(..., alias="heatmapMatrixMs")
    trading_risk_ms: float = Field(..., alias="tradingRiskMs")
    ramps_detection_ms: float = Field(..., alias="rampsDetectionMs")
    total_benchmark_time_ms: float = Field(..., alias="totalBenchmarkTimeMs")
    performance_tier: str = Field(..., alias="performanceTier")
    model_config = {"populate_by_name": True}

