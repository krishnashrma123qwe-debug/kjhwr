"""
API Endpoints: Wind Forecast Evaluation & Procurement Simulator
"""

import logging
from typing import Optional
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel, Field

from app.core.config import settings
from app.services.elexon_client import data_manager
from app.services.alignment import get_aligned_data
from app.services.metrics import (
    compute_summary_metrics,
    compute_daily_breakdown,
    compute_diurnal_profile,
    compute_error_distribution,
    simulate_procurement,
)

logger = logging.getLogger(__name__)
router = APIRouter()


class ProcurementSimRequest(BaseModel):
    baseline_demand_mw: float = Field(default=25000.0, description="Average utility consumer demand in MW")
    confidence_level: float = Field(default=90.0, ge=50.0, le=99.9, description="Reserve margin confidence level (%)")
    cashout_spread_gbp: float = Field(default=65.0, description="Expected spread penalty per MWh (£/MWh)")
    start_date: str = Field(default=settings.DEFAULT_START_DATE)
    end_date: str = Field(default=settings.DEFAULT_END_DATE)
    cutoff_hour: int = Field(default=settings.DEFAULT_CUTOFF_HOUR, ge=0, le=23)


@router.get("/health")
def get_health():
    """Health check endpoint and dataset status."""
    try:
        act_df = data_manager.get_actuals_df()
        fc_df = data_manager.get_forecasts_df()
        return {
            "status": "healthy",
            "service": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "fuelhh_actuals_count": len(act_df),
            "windfor_forecasts_count": len(fc_df),
            "dates_available": {
                "start": "2026-01-01",
                "end": "2026-01-31"
            }
        }
    except Exception as e:
        logger.error("Health check failure: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary")
def get_summary(
    start_date: str = Query(default=settings.DEFAULT_START_DATE),
    end_date: str = Query(default=settings.DEFAULT_END_DATE),
    cutoff_hour: int = Query(default=settings.DEFAULT_CUTOFF_HOUR, ge=0, le=23),
    resolution: str = Query(default="half-hour", pattern="^(half-hour|hour)$")
):
    """Headline quantitative evaluation metrics (MAE, RMSE, Bias, WAPE, Correlation)."""
    df = get_aligned_data(start_date=start_date, end_date=end_date, cutoff_hour=cutoff_hour, resolution=resolution)
    if df.empty:
        raise HTTPException(status_code=404, detail="No data available for the specified range")
    
    summary = compute_summary_metrics(df)
    summary["parameters"] = {
        "start_date": start_date,
        "end_date": end_date,
        "cutoff_hour": cutoff_hour,
        "resolution": resolution
    }
    return summary


@router.get("/timeseries")
def get_timeseries(
    start_date: str = Query(default=settings.DEFAULT_START_DATE),
    end_date: str = Query(default=settings.DEFAULT_END_DATE),
    cutoff_hour: int = Query(default=settings.DEFAULT_CUTOFF_HOUR, ge=0, le=23),
    resolution: str = Query(default="half-hour", pattern="^(half-hour|hour)$")
):
    """Aligned time-series comparing actual vs Day-Ahead forecast."""
    df = get_aligned_data(start_date=start_date, end_date=end_date, cutoff_hour=cutoff_hour, resolution=resolution)
    if df.empty:
        raise HTTPException(status_code=404, detail="No data available for the specified range")
    
    return {
        "count": len(df),
        "data": df.to_dict(orient="records")
    }


@router.get("/daily")
def get_daily_metrics(
    start_date: str = Query(default=settings.DEFAULT_START_DATE),
    end_date: str = Query(default=settings.DEFAULT_END_DATE),
    cutoff_hour: int = Query(default=settings.DEFAULT_CUTOFF_HOUR, ge=0, le=23),
    resolution: str = Query(default="half-hour", pattern="^(half-hour|hour)$")
):
    """Daily breakdown of forecast error metrics."""
    df = get_aligned_data(start_date=start_date, end_date=end_date, cutoff_hour=cutoff_hour, resolution=resolution)
    if df.empty:
        raise HTTPException(status_code=404, detail="No data available for the specified range")
    
    daily = compute_daily_breakdown(df)
    return {
        "count": len(daily),
        "data": daily
    }


@router.get("/diurnal")
def get_diurnal_profile(
    start_date: str = Query(default=settings.DEFAULT_START_DATE),
    end_date: str = Query(default=settings.DEFAULT_END_DATE),
    cutoff_hour: int = Query(default=settings.DEFAULT_CUTOFF_HOUR, ge=0, le=23),
    resolution: str = Query(default="half-hour", pattern="^(half-hour|hour)$")
):
    """Diurnal 24-hour error and generation profile."""
    df = get_aligned_data(start_date=start_date, end_date=end_date, cutoff_hour=cutoff_hour, resolution=resolution)
    if df.empty:
        raise HTTPException(status_code=404, detail="No data available for the specified range")
    
    return {
        "data": compute_diurnal_profile(df)
    }


@router.get("/error-distribution")
def get_error_distribution(
    start_date: str = Query(default=settings.DEFAULT_START_DATE),
    end_date: str = Query(default=settings.DEFAULT_END_DATE),
    cutoff_hour: int = Query(default=settings.DEFAULT_CUTOFF_HOUR, ge=0, le=23),
    resolution: str = Query(default="half-hour", pattern="^(half-hour|hour)$"),
    bins: int = Query(default=16, ge=5, le=50)
):
    """Histogram distribution of forecast error."""
    df = get_aligned_data(start_date=start_date, end_date=end_date, cutoff_hour=cutoff_hour, resolution=resolution)
    if df.empty:
        raise HTTPException(status_code=404, detail="No data available for the specified range")
    
    return {
        "bins": compute_error_distribution(df, num_bins=bins)
    }


@router.post("/simulate-procurement")
def post_simulate_procurement(req: ProcurementSimRequest):
    """Simulates Day-Ahead procurement and spinning reserve optimization."""
    df = get_aligned_data(
        start_date=req.start_date,
        end_date=req.end_date,
        cutoff_hour=req.cutoff_hour,
        resolution="half-hour"
    )
    if df.empty:
        raise HTTPException(status_code=404, detail="No data available for the specified range")

    result = simulate_procurement(
        df=df,
        baseline_demand_mw=req.baseline_demand_mw,
        confidence_level=req.confidence_level,
        cashout_spread_gbp=req.cashout_spread_gbp
    )
    return result
