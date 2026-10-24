"""
Metrics Engine: Quantitative Forecast Accuracy & Utility Procurement Evaluation
Calculates MAE, RMSE, Bias (ME), WAPE, Diurnal patterns, error distributions,
and provides a Day-Ahead thermal procurement simulator for UK utilities.
"""

import numpy as np
import pandas as pd


def compute_summary_metrics(df: pd.DataFrame) -> dict:
    """Computes headline forecast accuracy metrics for the given aligned dataset."""
    valid_df = df.dropna(subset=["actual", "forecast"]).copy()
    if valid_df.empty:
        return {
            "total_periods": 0,
            "mae_mw": 0.0,
            "rmse_mw": 0.0,
            "bias_mw": 0.0,
            "wape_pct": 0.0,
            "correlation": 0.0,
            "avg_actual_mw": 0.0,
            "avg_forecast_mw": 0.0,
            "max_overforecast_mw": 0.0,
            "max_underforecast_mw": 0.0,
            "total_actual_gwh": 0.0,
            "total_forecast_gwh": 0.0,
            "total_imbalance_gwh": 0.0,
        }

    actual = valid_df["actual"].values
    forecast = valid_df["forecast"].values
    error = forecast - actual
    abs_error = np.abs(error)

    total_actual = actual.sum()
    mae = float(abs_error.mean())
    rmse = float(np.sqrt((error ** 2).mean()))
    bias = float(error.mean())
    wape = float((abs_error.sum() / total_actual * 100)) if total_actual > 0 else 0.0

    # Pearson correlation
    corr = 0.0
    if len(valid_df) > 1 and np.std(actual) > 0 and np.std(forecast) > 0:
        corr = float(np.corrcoef(actual, forecast)[0, 1])

    # Convert MW half-hours to GWh: MW * 0.5 h / 1000 = GWh
    # If resolution was hourly: MW * 1 h / 1000
    is_half_hourly = len(valid_df) > 1000
    mwh_factor = 0.5 if is_half_hourly else 1.0

    total_actual_gwh = float((actual.sum() * mwh_factor) / 1000.0)
    total_forecast_gwh = float((forecast.sum() * mwh_factor) / 1000.0)
    total_imbalance_gwh = total_forecast_gwh - total_actual_gwh

    return {
        "total_periods": int(len(valid_df)),
        "mae_mw": round(mae, 2),
        "rmse_mw": round(rmse, 2),
        "bias_mw": round(bias, 2),
        "wape_pct": round(wape, 2),
        "correlation": round(corr, 3),
        "avg_actual_mw": round(float(actual.mean()), 2),
        "avg_forecast_mw": round(float(forecast.mean()), 2),
        "max_overforecast_mw": round(float(error.max()), 2),
        "max_underforecast_mw": round(float(abs(error.min())), 2),
        "total_actual_gwh": round(total_actual_gwh, 2),
        "total_forecast_gwh": round(total_forecast_gwh, 2),
        "total_imbalance_gwh": round(total_imbalance_gwh, 2),
    }


def compute_daily_breakdown(df: pd.DataFrame) -> list[dict]:
    """Computes daily evaluation metrics across each date in the window."""
    valid_df = df.dropna(subset=["actual", "forecast"]).copy()
    if valid_df.empty:
        return []

    is_half_hourly = len(valid_df) > 1000
    mwh_factor = 0.5 if is_half_hourly else 1.0

    results = []
    for date, group in valid_df.groupby("date"):
        actual = group["actual"].values
        forecast = group["forecast"].values
        error = forecast - actual
        abs_error = np.abs(error)
        sum_act = actual.sum()

        mae = float(abs_error.mean())
        rmse = float(np.sqrt((error ** 2).mean()))
        bias = float(error.mean())
        wape = float((abs_error.sum() / sum_act * 100)) if sum_act > 0 else 0.0

        act_gwh = float((sum_act * mwh_factor) / 1000.0)
        fc_gwh = float((forecast.sum() * mwh_factor) / 1000.0)

        results.append({
            "date": date,
            "periods": int(len(group)),
            "mae_mw": round(mae, 2),
            "rmse_mw": round(rmse, 2),
            "bias_mw": round(bias, 2),
            "wape_pct": round(wape, 2),
            "actual_gwh": round(act_gwh, 2),
            "forecast_gwh": round(fc_gwh, 2),
            "imbalance_gwh": round(fc_gwh - act_gwh, 2),
            "max_overforecast_mw": round(float(error.max()), 2),
            "max_underforecast_mw": round(float(abs(error.min())), 2),
        })

    return sorted(results, key=lambda x: x["date"])


def compute_diurnal_profile(df: pd.DataFrame) -> list[dict]:
    """Computes 24-hour diurnal profile of actuals, forecasts, and bias."""
    valid_df = df.dropna(subset=["actual", "forecast"]).copy()
    if valid_df.empty:
        return []

    valid_df["hour"] = valid_df["time"].apply(lambda t: int(t.split(":")[0]))

    results = []
    for hour, group in valid_df.groupby("hour"):
        actual = group["actual"].values
        forecast = group["forecast"].values
        error = forecast - actual
        abs_error = np.abs(error)
        sum_act = actual.sum()

        results.append({
            "hour": int(hour),
            "hourLabel": f"{hour:02d}:00",
            "avg_actual_mw": round(float(actual.mean()), 2),
            "avg_forecast_mw": round(float(forecast.mean()), 2),
            "bias_mw": round(float(error.mean()), 2),
            "mae_mw": round(float(abs_error.mean()), 2),
            "wape_pct": round(float(abs_error.sum() / sum_act * 100), 2) if sum_act > 0 else 0.0,
        })

    return sorted(results, key=lambda x: x["hour"])


def compute_error_distribution(df: pd.DataFrame, num_bins: int = 16) -> list[dict]:
    """Computes histogram bins of forecast errors (Forecast - Actual) in MW."""
    valid_df = df.dropna(subset=["error"]).copy()
    if valid_df.empty:
        return []

    errors = valid_df["error"].values
    counts, bin_edges = np.histogram(errors, bins=num_bins)

    bins = []
    for i in range(len(counts)):
        bin_start = int(round(bin_edges[i]))
        bin_end = int(round(bin_edges[i + 1]))
        bins.append({
            "binRange": f"{bin_start} to {bin_end} MW",
            "binStart": bin_start,
            "binEnd": bin_end,
            "binCenter": int(round((bin_start + bin_end) / 2)),
            "count": int(counts[i]),
            "percentage": round(float(counts[i] / len(errors) * 100), 2),
        })

    return bins


def simulate_procurement(
    df: pd.DataFrame,
    baseline_demand_mw: float = 25000.0,
    confidence_level: float = 90.0,
    cashout_spread_gbp: float = 65.0
) -> dict:
    """
    Simulates Day-Ahead power procurement for a UK utility to serve customer demand.
    
    Parameters:
    - baseline_demand_mw: Average UK consumer demand served (e.g. 25,000 MW)
    - confidence_level: 90% or 95% reserve safety confidence
    - cashout_spread_gbp: Expected spread penalty per MWh between Day-Ahead and Cashout (SBP/SSP)
    
    Returns procurement strategy comparison:
    1. Naive Strategy: Buys (Demand - Raw Wind Forecast)
    2. De-biased & Risk-Buffered Strategy: Buys (Demand - Adjusted Wind + Reserve Buffer)
    """
    valid_df = df.dropna(subset=["actual", "forecast"]).copy()
    if valid_df.empty:
        return {}

    actual = valid_df["actual"].values
    forecast = valid_df["forecast"].values
    error = forecast - actual  # positive = over-forecast (shortage)
    abs_error = np.abs(error)
    mean_bias = float(error.mean())

    # Reserve buffer derived from empirical upper percentile of over-forecasts
    overforecast_errors = error[error > 0]
    buffer_mw = float(np.percentile(overforecast_errors, confidence_level)) if len(overforecast_errors) > 0 else float(np.percentile(abs_error, confidence_level))

    # Time series simulation
    is_half_hourly = len(valid_df) > 1000
    mwh_factor = 0.5 if is_half_hourly else 1.0

    # Naive procurement: thermal_needed = max(0, demand - forecast)
    naive_thermal = np.maximum(0.0, baseline_demand_mw - forecast)
    actual_net_demand = np.maximum(0.0, baseline_demand_mw - actual)
    
    # In naive procurement, physical shortfall occurs when Actual Wind < Forecast Wind
    # shortfall = actual_net_demand - naive_thermal = forecast - actual (when > 0)
    shortfall_mw = np.maximum(0.0, actual_net_demand - naive_thermal)
    total_shortfall_mwh = float(shortfall_mw.sum() * mwh_factor)

    # Smart procurement: adjust forecast by mean bias, add spinning reserve buffer
    smart_wind_est = np.maximum(0.0, forecast - mean_bias)
    smart_thermal = np.maximum(0.0, baseline_demand_mw - smart_wind_est + buffer_mw)
    smart_shortfall_mw = np.maximum(0.0, actual_net_demand - smart_thermal)
    smart_shortfall_mwh = float(smart_shortfall_mw.sum() * mwh_factor)

    # Financial exposure calculation
    naive_penalty_cost = total_shortfall_mwh * cashout_spread_gbp
    smart_penalty_cost = smart_shortfall_mwh * cashout_spread_gbp
    estimated_savings_gbp = naive_penalty_cost - smart_penalty_cost

    return {
        "baseline_demand_mw": baseline_demand_mw,
        "confidence_level_pct": confidence_level,
        "mean_bias_mw": round(mean_bias, 2),
        "recommended_buffer_mw": round(buffer_mw, 2),
        "total_eval_periods": len(valid_df),
        "naive_strategy": {
            "avg_thermal_procured_mw": round(float(naive_thermal.mean()), 2),
            "total_shortfall_mwh": round(total_shortfall_mwh, 2),
            "shortfall_periods_count": int((shortfall_mw > 0).sum()),
            "estimated_penalty_gbp": round(naive_penalty_cost, 2),
        },
        "optimized_strategy": {
            "avg_thermal_procured_mw": round(float(smart_thermal.mean()), 2),
            "total_shortfall_mwh": round(smart_shortfall_mwh, 2),
            "shortfall_periods_count": int((smart_shortfall_mw > 0).sum()),
            "estimated_penalty_gbp": round(smart_penalty_cost, 2),
        },
        "financial_impact": {
            "mwh_shortfall_avoided": round(total_shortfall_mwh - smart_shortfall_mwh, 2),
            "risk_cost_reduction_gbp": round(estimated_savings_gbp, 2),
            "shortfall_reduction_pct": round(float((total_shortfall_mwh - smart_shortfall_mwh) / total_shortfall_mwh * 100), 2) if total_shortfall_mwh > 0 else 0.0
        }
    }
