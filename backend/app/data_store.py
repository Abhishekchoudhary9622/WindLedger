"""WindLens data store — loads Parquet files once at startup."""

from __future__ import annotations

import logging
from pathlib import Path

import pandas as pd

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

_forecasts: pd.DataFrame | None = None
_actuals: pd.DataFrame | None = None


def load_data() -> None:
    """Load Parquet data into memory. Called at app startup."""
    global _forecasts, _actuals

    fc_path = DATA_DIR / "forecasts.parquet"
    act_path = DATA_DIR / "actuals.parquet"

    if fc_path.exists():
        _forecasts = pd.read_parquet(fc_path)
        _forecasts["publishTime"] = pd.to_datetime(_forecasts["publishTime"], utc=True)
        _forecasts["startTime"] = pd.to_datetime(_forecasts["startTime"], utc=True)
        logger.info("Loaded %d forecast rows", len(_forecasts))
    else:
        logger.warning("No forecasts.parquet found at %s", fc_path)
        _forecasts = pd.DataFrame(columns=["dataset", "publishTime", "startTime", "generation"])

    if act_path.exists():
        _actuals = pd.read_parquet(act_path)
        _actuals["publishTime"] = pd.to_datetime(_actuals["publishTime"], utc=True)
        _actuals["startTime"] = pd.to_datetime(_actuals["startTime"], utc=True)
        logger.info("Loaded %d actual rows", len(_actuals))
    else:
        logger.warning("No actuals.parquet found at %s", act_path)
        _actuals = pd.DataFrame(columns=["dataset", "publishTime", "startTime", "generation"])


def get_forecasts() -> pd.DataFrame:
    if _forecasts is None:
        load_data()
    return _forecasts


def get_actuals() -> pd.DataFrame:
    if _actuals is None:
        load_data()
    return _actuals
