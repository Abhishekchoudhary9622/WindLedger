"""Ingestion script: pull Jan 2026 data from Elexon and write to Parquet.

Usage:
    python -m app.ingestion.ingest            # full Jan 2026
    python -m app.ingestion.ingest --quick     # just 5 days for testing
"""

from __future__ import annotations

import asyncio
import logging
import sys
from datetime import datetime
from pathlib import Path

import pandas as pd

from .elexon_client import fetch_fuelhh, fetch_windfor

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"


def _to_parquet(df: pd.DataFrame, path: Path) -> None:
    """Write a DataFrame to Parquet, creating parent dirs."""
    path.parent.mkdir(parents=True, exist_ok=True)
    df.to_parquet(path, engine="pyarrow", index=False)
    logger.info("Wrote %d rows → %s (%.1f KB)", len(df), path, path.stat().st_size / 1024)


async def ingest(quick: bool = False) -> None:
    """Ingest WINDFOR and FUELHH data for January 2026."""

    # ── Date ranges ─────────────────────────────────────────────────────
    # Forecasts: need D-1 forecasts, so start from ~27 Dec 2025
    # Actuals: 1 Jan – 1 Feb 2026 (settlement dates)
    if quick:
        fc_from = datetime(2026, 1, 12, 0, 0, 0)
        fc_to = datetime(2026, 1, 16, 0, 0, 0)
        act_from = datetime(2026, 1, 13, 0, 0, 0)
        act_to = datetime(2026, 1, 16, 0, 0, 0)
    else:
        fc_from = datetime(2025, 12, 27, 0, 0, 0)
        fc_to = datetime(2026, 2, 1, 0, 0, 0)
        act_from = datetime(2025, 12, 31, 0, 0, 0)
        act_to = datetime(2026, 2, 2, 0, 0, 0)

    # ── Fetch forecasts ─────────────────────────────────────────────────
    logger.info("=== Fetching WINDFOR forecasts ===")
    fc_rows = await fetch_windfor(fc_from, fc_to, chunk_days=2)
    if not fc_rows:
        logger.error("No WINDFOR data received!")
        return

    fc_df = pd.DataFrame(fc_rows)
    fc_df["publishTime"] = pd.to_datetime(fc_df["publishTime"], utc=True)
    fc_df["startTime"] = pd.to_datetime(fc_df["startTime"], utc=True)
    fc_df = fc_df.drop_duplicates(subset=["publishTime", "startTime"])
    fc_df = fc_df.sort_values(["startTime", "publishTime"]).reset_index(drop=True)

    logger.info(
        "Forecasts: %d rows, %d unique publishTimes, startTime range %s → %s",
        len(fc_df),
        fc_df["publishTime"].nunique(),
        fc_df["startTime"].min(),
        fc_df["startTime"].max(),
    )
    _to_parquet(fc_df, DATA_DIR / "forecasts.parquet")

    # ── Fetch actuals ───────────────────────────────────────────────────
    logger.info("=== Fetching FUELHH actuals ===")
    act_rows = await fetch_fuelhh(act_from, act_to, chunk_days=2)
    if not act_rows:
        logger.error("No FUELHH data received!")
        return

    act_df = pd.DataFrame(act_rows)
    act_df["publishTime"] = pd.to_datetime(act_df["publishTime"], utc=True)
    act_df["startTime"] = pd.to_datetime(act_df["startTime"], utc=True)
    act_df = act_df.drop_duplicates(subset=["startTime"])
    act_df = act_df.sort_values("startTime").reset_index(drop=True)

    logger.info(
        "Actuals: %d rows, startTime range %s → %s",
        len(act_df),
        act_df["startTime"].min(),
        act_df["startTime"].max(),
    )
    _to_parquet(act_df, DATA_DIR / "actuals.parquet")

    # ── Data quality report ─────────────────────────────────────────────
    logger.info("=== Data quality ===")
    logger.info("Forecast publish times seen: %s", sorted(fc_df["publishTime"].dt.hour.unique()))
    logger.info("Actuals settlement periods per day (sample):")
    if "settlementDate" in act_df.columns:
        coverage = act_df.groupby("settlementDate").size()
        for date, count in coverage.head(5).items():
            logger.info("  %s: %d/48 periods", date, count)
        incomplete = coverage[coverage < 48]
        if len(incomplete):
            logger.warning("Days with < 48 periods: %s", list(incomplete.index))


def main() -> None:
    quick = "--quick" in sys.argv
    asyncio.run(ingest(quick=quick))


if __name__ == "__main__":
    main()
