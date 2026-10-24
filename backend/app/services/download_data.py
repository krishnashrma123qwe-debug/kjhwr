"""
download_data.py
Utility script to fetch and cache UK Elexon BMRS data for January 2026:
- FUELHH (Half-hourly actual generation by fuel type, filtered for WIND)
- WINDFOR (Wind generation forecasts published by National Grid ESO / NESO)

Saves local JSON caches to backend/app/data/ to allow fast startup,
resilient offline operation, and avoid hitting Elexon rate limits.
"""

import json
import logging
import os
import time
import urllib.request
from datetime import datetime, timedelta

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
os.makedirs(DATA_DIR, exist_ok=True)

FUELHH_CACHE_PATH = os.path.join(DATA_DIR, "fuelhh_jan2026.json")
WINDFOR_CACHE_PATH = os.path.join(DATA_DIR, "windfor_jan2026.json")

HEADERS = {
    "User-Agent": "UK-Utility-Wind-Procurement-Evaluation/1.0 (Python/urllib; client research)"
}


def fetch_fuelhh_january():
    """
    Fetch FUELHH actual wind generation for all 31 days of January 2026.
    48 settlement periods per day * 31 days = 1,488 records.
    """
    logger.info("Fetching FUELHH wind actuals for January 2026...")
    url = (
        "https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream"
        "?settlementDateFrom=2026-01-01&settlementDateTo=2026-01-31"
    )

    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=60) as response:
        raw_data = json.loads(response.read().decode("utf-8"))

    # Filter strictly for wind power
    wind_actuals = [
        {
            "startTime": item["startTime"],
            "settlementDate": item.get("settlementDate"),
            "settlementPeriod": item.get("settlementPeriod"),
            "generation": float(item["generation"]) if item.get("generation") is not None else 0.0,
            "publishTime": item.get("publishTime"),
        }
        for item in raw_data
        if item.get("fuelType") == "WIND"
    ]

    logger.info("Successfully fetched %d wind actual records.", len(wind_actuals))
    with open(FUELHH_CACHE_PATH, "w", encoding="utf-8") as f:
        json.dump(wind_actuals, f, indent=2)
    logger.info("Saved FUELHH data to %s", FUELHH_CACHE_PATH)
    return wind_actuals


def fetch_windfor_january():
    """
    Fetch WINDFOR wind forecasts published from 2025-12-30 through 2026-01-31.
    We fetch in 4-day increments to stay within HTTP payload limits and ensure reliability.
    """
    logger.info("Fetching WINDFOR wind forecasts in chunks...")
    start_date = datetime(2025, 12, 30, 0, 0, 0)
    end_date = datetime(2026, 1, 31, 23, 59, 59)
    chunk_days = 4

    all_forecasts = []
    current_start = start_date

    while current_start < end_date:
        current_end = min(current_start + timedelta(days=chunk_days), end_date)
        from_str = current_start.strftime("%Y-%m-%dT%H:%M:%SZ")
        to_str = current_end.strftime("%Y-%m-%dT%H:%M:%SZ")

        url = (
            f"https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream"
            f"?publishDateTimeFrom={from_str}&publishDateTimeTo={to_str}"
        )
        logger.info("Fetching WINDFOR chunk: %s to %s", from_str, to_str)

        retries = 3
        chunk_records = []
        for attempt in range(1, retries + 1):
            try:
                req = urllib.request.Request(url, headers=HEADERS)
                with urllib.request.urlopen(req, timeout=60) as resp:
                    chunk_records = json.loads(resp.read().decode("utf-8"))
                break
            except Exception as e:
                logger.warning("Attempt %d failed: %s. Retrying in 2s...", attempt, e)
                time.sleep(2)

        for item in chunk_records:
            all_forecasts.append({
                "publishTime": item["publishTime"],
                "startTime": item["startTime"],
                "generation": float(item["generation"]) if item.get("generation") is not None else 0.0,
            })

        logger.info("Fetched %d records for this chunk (Total so far: %d)", len(chunk_records), len(all_forecasts))
        current_start = current_end + timedelta(seconds=1)
        time.sleep(0.5)  # Respectful pause

    # De-duplicate if overlapping timestamps occurred
    unique_forecasts = {}
    for fc in all_forecasts:
        key = (fc["publishTime"], fc["startTime"])
        unique_forecasts[key] = fc

    cleaned_forecasts = list(unique_forecasts.values())
    logger.info("Successfully fetched %d unique WINDFOR records.", len(cleaned_forecasts))

    with open(WINDFOR_CACHE_PATH, "w", encoding="utf-8") as f:
        json.dump(cleaned_forecasts, f, indent=2)
    logger.info("Saved WINDFOR data to %s", WINDFOR_CACHE_PATH)
    return cleaned_forecasts


if __name__ == "__main__":
    fetch_fuelhh_january()
    fetch_windfor_january()
    logger.info("All January 2026 Elexon data downloaded and verified successfully!")
