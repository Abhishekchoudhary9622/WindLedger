"""Elexon BMRS API client for WINDFOR and FUELHH datasets.

Fetches data in date chunks with retries.  The Insights API (v1) is
free, no API key needed.  We stream JSON for bandwidth efficiency.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Any

import httpx

logger = logging.getLogger(__name__)

BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1"


async def _fetch_stream(
    client: httpx.AsyncClient,
    dataset: str,
    params: dict[str, Any],
    *,
    retries: int = 3,
) -> list[dict]:
    """Fetch a single chunk from the Elexon stream endpoint."""
    url = f"{BASE_URL}/datasets/{dataset}/stream"
    for attempt in range(1, retries + 1):
        try:
            resp = await client.get(url, params=params, timeout=60)
            resp.raise_for_status()
            return resp.json()
        except (httpx.HTTPStatusError, httpx.ReadTimeout) as exc:
            logger.warning(
                "Attempt %d/%d for %s failed: %s", attempt, retries, url, exc
            )
            if attempt == retries:
                raise
    return []


async def fetch_windfor(
    publish_from: datetime,
    publish_to: datetime,
    *,
    chunk_days: int = 2,
) -> list[dict]:
    """Fetch WINDFOR forecast data in date chunks.

    Parameters
    ----------
    publish_from, publish_to : datetime
        Range of publishTime to query.
    chunk_days : int
        Split the range into chunks of this size to stay within API limits.
    """
    all_rows: list[dict] = []
    async with httpx.AsyncClient() as client:
        cursor = publish_from
        while cursor < publish_to:
            chunk_end = min(cursor + timedelta(days=chunk_days), publish_to)
            params = {
                "publishDateTimeFrom": cursor.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "publishDateTimeTo": chunk_end.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "format": "json",
            }
            logger.info("WINDFOR chunk %s → %s", params["publishDateTimeFrom"], params["publishDateTimeTo"])
            rows = await _fetch_stream(client, "WINDFOR", params)
            all_rows.extend(rows)
            logger.info("  → %d rows", len(rows))
            cursor = chunk_end
    return all_rows


async def fetch_fuelhh(
    publish_from: datetime,
    publish_to: datetime,
    *,
    chunk_days: int = 2,
) -> list[dict]:
    """Fetch FUELHH (actuals) for fuelType=WIND in date chunks.

    Parameters
    ----------
    publish_from, publish_to : datetime
        Range of publishTime to query.
    chunk_days : int
        Split the range into chunks of this size.
    """
    all_rows: list[dict] = []
    async with httpx.AsyncClient() as client:
        cursor = publish_from
        while cursor < publish_to:
            chunk_end = min(cursor + timedelta(days=chunk_days), publish_to)
            params = {
                "publishDateTimeFrom": cursor.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "publishDateTimeTo": chunk_end.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "fuelType": "WIND",
                "format": "json",
            }
            logger.info("FUELHH chunk %s → %s", params["publishDateTimeFrom"], params["publishDateTimeTo"])
            rows = await _fetch_stream(client, "FUELHH", params)
            all_rows.extend(rows)
            logger.info("  → %d rows", len(rows))
            cursor = chunk_end
    return all_rows
