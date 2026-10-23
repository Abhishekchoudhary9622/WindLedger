"""WindLedger FastAPI Application — Enterprise UK Wind Power Trading & Accuracy Portal."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .data_store import load_data, get_actuals, get_forecasts
from .routers import (
    accuracy_router,
    data_router,
    docs_router,
    forecast_router,
    meta_router,
    ramps_router,
    system_router,
    trading_router,
)
from .services.decision_forecast import compute_decision_forecast, _build_joined
from .services.metrics import (
    compute_summary,
    compute_daily_accuracy,
    compute_hourly_accuracy,
    compute_error_distribution,
    compute_heatmap,
    compute_horizon_accuracy,
)
from .services.ramps import detect_ramp_events
from .services.trading import compute_bid_recommendation, compute_imbalance_risk

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("windledger")

TAGS_METADATA = [
    {
        "name": "forecast",
        "description": (
            "**Day-Ahead Decision & Evolution Engine** — Retrieve point forecasts, "
            "P10/P90 empirical uncertainty bands, conservative bidding baselines, "
            "and multi-vintage trajectory evolution across publication intervals."
        ),
    },
    {
        "name": "accuracy",
        "description": (
            "**Statistical Accuracy & Benchmarking** — Comprehensive MAE, RMSE, bias, "
            "horizon decay curves (14h to 38h lead time), diurnal hourly profiles, "
            "and 31×24 delivery matrix heatmaps."
        ),
    },
    {
        "name": "trading",
        "description": (
            "**Financial Imbalance & Trading Desk Tools** — Calculate physical short/long exposure (MWh), "
            "simulate System Buy Price (SBP) / System Sell Price (SSP) balancing penalties (£), "
            "generate optimal 24h bidding schedules across 3 risk postures, and run what-if stress tests."
        ),
    },
    {
        "name": "ramps",
        "description": (
            "**Wind Ramp & Volatility Analytics** — Detect steep wind generation ramp events "
            "(>800 MW changes over 1-3h), calculate ramp rates (MW/hr), and evaluate forecast tracking accuracy."
        ),
    },
    {
        "name": "data",
        "description": (
            "**Data Store & Export Transparency** — In-depth Parquet dataset metadata, "
            "record counts, memory usage, and streaming CSV export for offline quant analysis."
        ),
    },
    {
        "name": "system",
        "description": (
            "**Operations & Observability** — Process health status, uptime, memory RSS footprint, "
            "active cache entries, and dynamic sub-5ms compute latency benchmarks."
        ),
    },
    {
        "name": "meta",
        "description": (
            "**Application Metadata** — Available delivery dates in January 2026, default trading cutoffs, "
            "and timestamp ranges."
        ),
    },
]

DESCRIPTION = """
### WindLedger Enterprise API — UK Wind Power Decision & Accuracy Portal

Designed for **power trading desks, risk managers, and energy portfolio analysts** evaluating 
National Grid ESO / Elexon wind generation forecasts for day-ahead wholesale electricity procurement.

---

#### 🌟 Core Capabilities
* **Auction Gate Closures:** Precise cutoff simulation for **EPEX SPOT (09:20 UTC)** and **Nord Pool (10:00 UTC)**.
* **Official Elexon BMRS Datasets:** Ingests live streams from [FUELHH](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream) (Actuals) and [WINDFOR](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream) (Forecasts).
* **Financial Imbalance Modeling:** Quantifies balancing cashout exposure under BSC settlement rules.
* **Wind Ramp Event Tracking:** Automated detection of volatile grid ramp events (>800 MW/hr).
* **Sub-Millisecond Engine:** Vectorized Pandas compute kernel backed by intelligent multi-tier caching.

---
*For support or institutional integrations, consult the endpoints below or visit the frontend portal at http://localhost:5173.*
"""


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load data and pre-warm in-memory caches at startup for instant sub-5ms responses."""
    logger.info("Initializing WindLedger data engine...")
    load_data()
    fc = get_forecasts()
    act = get_actuals()

    if not fc.empty and not act.empty:
        logger.info("Pre-warming analytical and trading caches for standard gate closures...")
        for cutoff in ["09:20", "10:00"]:
            _build_joined(fc, act, "2026-01-01", "2026-01-31", cutoff)
            compute_summary(fc, act, "2026-01-01", "2026-01-31", cutoff)
            compute_daily_accuracy(fc, act, "2026-01-01", "2026-01-31", cutoff)
            compute_hourly_accuracy(fc, act, "2026-01-01", "2026-01-31", cutoff)
            compute_error_distribution(fc, act, "2026-01-01", "2026-01-31", cutoff)
            compute_heatmap(fc, act, "2026-01-01", "2026-01-31", cutoff)
            compute_horizon_accuracy(fc, act, "2026-01-01", "2026-01-31", cutoff)
            compute_decision_forecast(fc, act, "2026-01-14", cutoff)
            compute_decision_forecast(fc, act, "2026-01-15", cutoff)
            compute_imbalance_risk(fc, act, "2026-01-01", "2026-01-31", cutoff)
            detect_ramp_events(fc, act, "2026-01-01", "2026-01-31", cutoff)
            compute_bid_recommendation(fc, act, "2026-01-15", cutoff)
        logger.info("WindLedger cache pre-warming completed successfully.")
    yield


app = FastAPI(
    title="WindLedger Enterprise API",
    description=DESCRIPTION,
    version="2.0.0",
    docs_url="/swagger",
    redoc_url="/redoc",
    openapi_tags=TAGS_METADATA,
    lifespan=lifespan,
    contact={
        "name": "WindLedger Quantitative Trading & Analytics Desk",
        "url": "http://localhost:5173",
    },
    license_info={
        "name": "Proprietary Commercial / Trading License",
    },
)

# CORS — allow Vite dev server and production Vercel origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(docs_router)
app.include_router(forecast_router)
app.include_router(accuracy_router)
app.include_router(trading_router)
app.include_router(ramps_router)
app.include_router(data_router)
app.include_router(system_router)
app.include_router(meta_router)


@app.get("/", tags=["system"], summary="Root Health & Identity")
async def root():
    return {
        "app": "WindLens",
        "product": "WindLedger Enterprise",
        "version": "2.0.0",
        "tagline": "Know the wind. Know the error. Trade with institutional confidence.",
        "docs": "/docs",
        "status": "operational",
    }
