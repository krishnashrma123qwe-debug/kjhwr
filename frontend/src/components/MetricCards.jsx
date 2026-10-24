import React from 'react';
import { TrendingUp, AlertTriangle, ShieldAlert, CheckCircle2, Zap, BarChart2 } from 'lucide-react';

export default function MetricCards({ summary }) {
  if (!summary) return null;

  const {
    mae_mw = 0,
    rmse_mw = 0,
    bias_mw = 0,
    wape_pct = 0,
    correlation = 0,
    avg_actual_mw = 0,
    avg_forecast_mw = 0,
    max_overforecast_mw = 0,
    max_underforecast_mw = 0,
    total_actual_gwh = 0,
    total_forecast_gwh = 0,
    total_imbalance_gwh = 0,
  } = summary;

  const isOverforecast = bias_mw > 0;
  const accuracyScore = Math.max(0, 100 - wape_pct).toFixed(1);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      {/* 1. MAE */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">MAE (Mean Error)</span>
          <TrendingUp className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="text-2xl font-bold text-white tracking-tight">
          {mae_mw.toLocaleString()} <span className="text-xs font-normal text-slate-400">MW</span>
        </div>
        <div className="mt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
          <span>Avg Actual:</span>
          <span className="font-mono text-slate-200">{avg_actual_mw.toLocaleString()} MW</span>
        </div>
      </div>

      {/* 2. WAPE & Accuracy */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">WAPE / Accuracy</span>
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
        </div>
        <div className="text-2xl font-bold text-white tracking-tight">
          {wape_pct.toFixed(1)}% <span className="text-xs font-normal text-slate-400">WAPE</span>
        </div>
        <div className="mt-2 text-xs text-teal-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
          <span>Accuracy Score:</span>
          <span className="font-semibold font-mono">{accuracyScore}%</span>
        </div>
      </div>

      {/* 3. Mean Bias Error (ME) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">Mean Bias (ME)</span>
          <ShieldAlert className={`w-4 h-4 ${isOverforecast ? 'text-amber-400' : 'text-blue-400'}`} />
        </div>
        <div className={`text-2xl font-bold tracking-tight ${isOverforecast ? 'text-amber-400' : 'text-blue-400'}`}>
          {bias_mw > 0 ? `+${bias_mw.toLocaleString()}` : bias_mw.toLocaleString()}{' '}
          <span className="text-xs font-normal text-slate-400">MW</span>
        </div>
        <div className="mt-2 text-xs flex items-center justify-between border-t border-slate-800/80 pt-2">
          <span className="text-slate-400">Risk Profile:</span>
          <span className={`font-medium ${isOverforecast ? 'text-amber-300' : 'text-blue-300'}`}>
            {isOverforecast ? 'Shortfall Risk' : 'Surplus Risk'}
          </span>
        </div>
      </div>

      {/* 4. RMSE */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">RMSE (Volatility)</span>
          <BarChart2 className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="text-2xl font-bold text-white tracking-tight">
          {rmse_mw.toLocaleString()} <span className="text-xs font-normal text-slate-400">MW</span>
        </div>
        <div className="mt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
          <span>Correlation (R):</span>
          <span className="font-mono text-slate-200">{correlation.toFixed(2)}</span>
        </div>
      </div>

      {/* 5. Peak Errors */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">Peak Over/Under</span>
          <AlertTriangle className="w-4 h-4 text-rose-400" />
        </div>
        <div className="text-lg font-bold text-rose-400 tracking-tight">
          +{max_overforecast_mw.toLocaleString()}{' '}
          <span className="text-xs font-normal text-slate-400">MW</span>
        </div>
        <div className="mt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
          <span>Max Under:</span>
          <span className="font-mono text-cyan-400">-{max_underforecast_mw.toLocaleString()} MW</span>
        </div>
      </div>

      {/* 6. Total Net Energy Imbalance */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider">Net Energy Gap</span>
          <Zap className="w-4 h-4 text-yellow-400" />
        </div>
        <div className="text-2xl font-bold text-yellow-400 tracking-tight">
          {total_imbalance_gwh > 0 ? `+${total_imbalance_gwh.toLocaleString()}` : total_imbalance_gwh.toLocaleString()}{' '}
          <span className="text-xs font-normal text-slate-400">GWh</span>
        </div>
        <div className="mt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
          <span>Act / Fcst:</span>
          <span className="font-mono text-slate-300">
            {total_actual_gwh.toFixed(0)} / {total_forecast_gwh.toFixed(0)} GWh
          </span>
        </div>
      </div>
    </div>
  );
}
