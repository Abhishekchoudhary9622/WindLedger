"""Meta router — metadata about the dataset."""

from __future__ import annotations

import pandas as pd
from fastapi import APIRouter

from ..data_store import get_actuals, get_forecasts

router = APIRouter(prefix="/api", tags=["meta"])


@router.get("/meta")
async def meta():
    """Dataset metadata: available dates, counts, data range."""
    fc = get_forecasts()
    act = get_actuals()

    # Available delivery dates for January 2026 purchase decisions
    if not act.empty:
        act_dates = sorted(act["startTime"].dt.date.unique())
        # Filter specifically to January 2026 (2026-01-01 to 2026-01-31)
        available = [d.isoformat() for d in act_dates if d.year == 2026 and d.month == 1]
    else:
        available = []

    return {
        "availableDates": available,
        "defaultCutoff": "09:20",
        "dataRange": {
            "forecastFrom": fc["publishTime"].min().isoformat() if not fc.empty else None,
            "forecastTo": fc["publishTime"].max().isoformat() if not fc.empty else None,
            "actualFrom": act["startTime"].min().isoformat() if not act.empty else None,
            "actualTo": act["startTime"].max().isoformat() if not act.empty else None,
        },
        "forecastCount": int(len(fc)),
        "actualCount": int(len(act)),
    }
