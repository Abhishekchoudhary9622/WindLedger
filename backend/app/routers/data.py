"""Data router — dataset summaries, record exploration, and direct CSV export."""

from __future__ import annotations

import io
from pathlib import Path
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
import pandas as pd

from ..data_store import get_actuals, get_forecasts, DATA_DIR
from ..schemas import DatasetSummaryResponse
from ..services.decision_forecast import _build_joined

router = APIRouter(prefix="/api/data", tags=["data"])


@router.get(
    "/summary",
    response_model=DatasetSummaryResponse,
    summary="Parquet Datasets Summary & Health",
    description=(
        "Returns comprehensive metadata for both underlying Elexon BMRS datasets "
        "(actuals and forecasts): record counts, memory footprint, disk size, and value ranges."
    ),
)
async def data_summary():
    fc = get_forecasts()
    act = get_actuals()

    act_path = DATA_DIR / "actuals.parquet"
    fc_path = DATA_DIR / "forecasts.parquet"

    act_size_kb = round(act_path.stat().st_size / 1024, 1) if act_path.exists() else 0.0
    fc_size_kb = round(fc_path.stat().st_size / 1024, 1) if fc_path.exists() else 0.0

    act_mem_mb = round(float(act.memory_usage(deep=True).sum()) / (1024 * 1024), 2) if not act.empty else 0.0
    fc_mem_mb = round(float(fc.memory_usage(deep=True).sum()) / (1024 * 1024), 2) if not fc.empty else 0.0

    act_meta = {
        "datasetName": "Elexon BMRS FUELHH (Wind Outturn Actuals)",
        "sourceUrl": "https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream",
        "recordCount": len(act),
        "parquetSizeKb": act_size_kb,
        "memoryFootprintMb": act_mem_mb,
        "earliestRecord": act["startTime"].min().isoformat() if not act.empty else None,
        "latestRecord": act["startTime"].max().isoformat() if not act.empty else None,
        "minGenerationMW": round(float(act["generation"].min()), 1) if not act.empty else None,
        "maxGenerationMW": round(float(act["generation"].max()), 1) if not act.empty else None,
        "meanGenerationMW": round(float(act["generation"].mean()), 1) if not act.empty else None,
    }

    fc_meta = {
        "datasetName": "Elexon BMRS WINDFOR (Multi-Vintage Wind Generation Forecasts)",
        "sourceUrl": "https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream",
        "recordCount": len(fc),
        "parquetSizeKb": fc_size_kb,
        "memoryFootprintMb": fc_mem_mb,
        "earliestRecord": fc["publishTime"].min().isoformat() if not fc.empty else None,
        "latestRecord": fc["publishTime"].max().isoformat() if not fc.empty else None,
        "minGenerationMW": round(float(fc["generation"].min()), 1) if not fc.empty else None,
        "maxGenerationMW": round(float(fc["generation"].max()), 1) if not fc.empty else None,
        "meanGenerationMW": round(float(fc["generation"].mean()), 1) if not fc.empty else None,
    }

    return {
        "status": "ready",
        "storageEngine": "Apache Parquet (Snappy Compressed)",
        "actuals": act_meta,
        "forecasts": fc_meta,
    }


@router.get(
    "/export/csv",
    summary="Export Joined Decision & Actual Dataset as CSV",
    description=(
        "Streams a clean CSV file containing hourly decision forecasts, outturn actuals, "
        "errors, and horizon metadata for January 2026."
    ),
)
async def export_csv(
    cutoff: str = Query("09:20", description="Decision cutoff on D-1 ('09:20' EPEX SPOT auction gate closure, '09:50' Nord Pool N2EX order book gate closure, or '10:00' Nord Pool results benchmark)"),
    date_from: str = Query("2026-01-01", description="Start date (YYYY-MM-DD)"),
    date_to: str = Query("2026-01-31", description="End date (YYYY-MM-DD)"),
):
    fc = get_forecasts()
    act = get_actuals()
    joined = _build_joined(fc, act, date_from, date_to, cutoff)
    if joined.empty:
        raise HTTPException(status_code=404, detail="No data available for export")

    export_df = pd.DataFrame()
    export_df["deliveryDate"] = joined["date"]
    export_df["deliveryHour"] = joined["startTime"].dt.hour
    export_df["startTimeUtc"] = joined["startTime"].dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    export_df["forecastMW"] = joined["forecastMW"].round(1)
    export_df["actualMW"] = joined["actualMW"].round(1)
    export_df["errorMW"] = (joined["forecastMW"] - joined["actualMW"]).round(1)
    export_df["absoluteErrorMW"] = (joined["forecastMW"] - joined["actualMW"]).abs().round(1)
    export_df["horizonHours"] = joined["horizonHours"]
    export_df["publishTimeUtc"] = joined["publishTime"].dt.strftime("%Y-%m-%dT%H:%M:%SZ")

    stream = io.StringIO()
    export_df.to_csv(stream, index=False)
    stream.seek(0)

    filename = f"windledger_joined_{cutoff.replace(':', '')}_{date_from}_{date_to}.csv"
    return StreamingResponse(
        iter([stream.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
