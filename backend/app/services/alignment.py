"""
Alignment Engine: Match Actuals with Day-Ahead Forecasts
Implements the UK Day-Ahead wholesale market timeline:
Orders are submitted on Day D-1 prior to gate closure (default 12:00 UTC).
Matches half-hourly or hourly delivery periods with the latest available forecast published on or before the cutoff.
"""

import logging
from datetime import datetime, timezone
import numpy as np
import pandas as pd
from app.services.elexon_client import data_manager

logger = logging.getLogger(__name__)


def get_aligned_data(
    start_date: str = "2026-01-01",
    end_date: str = "2026-01-31",
    cutoff_hour: int = 12,
    resolution: str = "half-hour"
) -> pd.DataFrame:
    """
    Returns an aligned DataFrame of actual generation vs Day-Ahead forecast.
    
    Parameters:
    - start_date: 'YYYY-MM-DD' delivery start date (inclusive)
    - end_date: 'YYYY-MM-DD' delivery end date (inclusive)
    - cutoff_hour: Day-Ahead gate closure hour on Day D-1 (0 to 23, default 12 UTC)
    - resolution: 'half-hour' (48 periods/day) or 'hour' (24 periods/day)
    """
    df_act = data_manager.get_actuals_df().copy()
    df_fc = data_manager.get_forecasts_df().copy()

    # Parse bounds in UTC
    start_dt = pd.to_datetime(start_date, utc=True).floor("D")
    end_dt = pd.to_datetime(end_date, utc=True).ceil("D")

    # Filter actuals to delivery date window
    df_act = df_act[(df_act["startTime"] >= start_dt) & (df_act["startTime"] < end_dt)].copy()

    if df_act.empty:
        logger.warning("No actuals found in window %s to %s", start_date, end_date)
        return pd.DataFrame()

    if resolution == "hour":
        # Group actuals into 1-hour intervals (average of two half-hour settlement periods)
        df_eval = (
            df_act.groupby("hour_startTime", as_index=False)
            .agg({
                "generation": "mean",
                "settlementDate": "first"
            })
            .rename(columns={"hour_startTime": "startTime", "generation": "actual"})
        )
        df_eval["hour_target"] = df_eval["startTime"]
        df_eval["settlementPeriod"] = ((df_eval["startTime"].dt.hour * 2) + 1).astype(int)
    else:
        df_eval = df_act.rename(columns={"generation": "actual"}).copy()
        df_eval["hour_target"] = df_eval["hour_startTime"]

    # Pre-filter forecasts within delivery window bounds (+- 2 days buffer)
    buffer_start = start_dt - pd.Timedelta(days=3)
    buffer_end = end_dt + pd.Timedelta(days=1)
    df_fc_filtered = df_fc[(df_fc["startTime"] >= buffer_start) & (df_fc["startTime"] <= buffer_end)].copy()

    # Build lookup map: (hour_target, cutoff_time) -> latest forecast
    # We can group forecasts by startTime and sort by publishTime
    fc_by_target = {}
    for target_time, group in df_fc_filtered.groupby("startTime"):
        # group is already sorted by publishTime descending
        fc_by_target[target_time] = group[["publishTime", "generation"]].to_records(index=False)

    aligned_records = []
    for _, row in df_eval.iterrows():
        target_time = row["startTime"]
        hour_target = row["hour_target"]
        target_date = target_time.floor("D")
        
        # Day D-1 cutoff time at cutoff_hour:00:00 UTC
        cutoff_time = target_date - pd.Timedelta(days=1) + pd.Timedelta(hours=cutoff_hour)
        
        fc_val = np.nan
        pub_time = None
        
        records = fc_by_target.get(hour_target)
        if records is not None and len(records) > 0:
            # records is sorted by publishTime descending
            # Find the first one with publishTime <= cutoff_time
            matched = False
            for r in records:
                if r["publishTime"] <= cutoff_time:
                    fc_val = float(r["generation"])
                    pub_time = r["publishTime"].isoformat()
                    matched = True
                    break
            
            # Fallback if no forecast was published before D-1 cutoff
            if not matched:
                # Use earliest forecast before target_time
                for r in reversed(records):
                    if r["publishTime"] < target_time:
                        fc_val = float(r["generation"])
                        pub_time = r["publishTime"].isoformat()
                        break

        actual_val = float(row["actual"])
        error = fc_val - actual_val if not np.isnan(fc_val) else np.nan
        abs_error = abs(error) if not np.isnan(error) else np.nan

        aligned_records.append({
            "startTime": target_time.isoformat(),
            "date": target_time.strftime("%Y-%m-%d"),
            "time": target_time.strftime("%H:%M"),
            "settlementPeriod": int(row.get("settlementPeriod", 1)),
            "actual": round(actual_val, 2),
            "forecast": round(fc_val, 2) if not np.isnan(fc_val) else None,
            "error": round(error, 2) if not np.isnan(error) else None,
            "abs_error": round(abs_error, 2) if not np.isnan(abs_error) else None,
            "publishTime": pub_time,
            "cutoffTime": cutoff_time.isoformat()
        })

    return pd.DataFrame(aligned_records)
