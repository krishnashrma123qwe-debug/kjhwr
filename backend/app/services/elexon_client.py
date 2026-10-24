"""
Elexon BMRS Client & Data Manager
Loads and manages January 2026 actuals (FUELHH) and forecasts (WINDFOR).
"""

import json
import logging
import os
import urllib.request
import pandas as pd
from app.core.config import settings

logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": "UK-Utility-Wind-Procurement-Evaluation/1.0 (Python/urllib; client research)"
}


class ElexonDataManager:
    def __init__(self):
        self._fuelhh_df: pd.DataFrame | None = None
        self._windfor_df: pd.DataFrame | None = None

    def get_actuals_df(self) -> pd.DataFrame:
        """Return cached FUELHH wind actuals DataFrame with standardized UTC timestamps."""
        if self._fuelhh_df is not None:
            return self._fuelhh_df

        if not os.path.exists(settings.FUELHH_PATH):
            logger.warning("FUELHH cache file missing at %s, fetching from Elexon...", settings.FUELHH_PATH)
            self._fetch_and_cache_fuelhh()

        with open(settings.FUELHH_PATH, "r", encoding="utf-8") as f:
            raw_data = json.load(f)

        df = pd.DataFrame(raw_data)
        df["startTime"] = pd.to_datetime(df["startTime"], utc=True)
        df["hour_startTime"] = df["startTime"].dt.floor("h")
        df["generation"] = pd.to_numeric(df["generation"], errors="coerce").fillna(0.0)
        
        self._fuelhh_df = df
        logger.info("Loaded %d FUELHH actual wind records.", len(df))
        return self._fuelhh_df

    def get_forecasts_df(self) -> pd.DataFrame:
        """Return cached WINDFOR wind forecasts DataFrame with standardized UTC timestamps."""
        if self._windfor_df is not None:
            return self._windfor_df

        if not os.path.exists(settings.WINDFOR_PATH):
            logger.warning("WINDFOR cache file missing at %s, fetching from Elexon...", settings.WINDFOR_PATH)
            self._fetch_and_cache_windfor()

        with open(settings.WINDFOR_PATH, "r", encoding="utf-8") as f:
            raw_data = json.load(f)

        df = pd.DataFrame(raw_data)
        df["startTime"] = pd.to_datetime(df["startTime"], utc=True)
        df["publishTime"] = pd.to_datetime(df["publishTime"], utc=True)
        df["generation"] = pd.to_numeric(df["generation"], errors="coerce").fillna(0.0)
        
        # Sort by startTime ascending, publishTime descending for fast lookup
        df = df.sort_values(["startTime", "publishTime"], ascending=[True, False]).reset_index(drop=True)
        
        self._windfor_df = df
        logger.info("Loaded %d WINDFOR forecast records.", len(df))
        return self._windfor_df

    def _fetch_and_cache_fuelhh(self):
        url = (
            "https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream"
            "?settlementDateFrom=2026-01-01&settlementDateTo=2026-01-31"
        )
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        wind = [
            {
                "startTime": item["startTime"],
                "settlementDate": item.get("settlementDate"),
                "settlementPeriod": item.get("settlementPeriod"),
                "generation": float(item["generation"]) if item.get("generation") is not None else 0.0,
                "publishTime": item.get("publishTime"),
            }
            for item in data
            if item.get("fuelType") == "WIND"
        ]
        os.makedirs(settings.DATA_DIR, exist_ok=True)
        with open(settings.FUELHH_PATH, "w", encoding="utf-8") as f:
            json.dump(wind, f)


# Global singleton manager
data_manager = ElexonDataManager()
