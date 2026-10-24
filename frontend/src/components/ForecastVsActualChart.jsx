import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Brush,
} from 'recharts';
import { Layers, Eye, EyeOff, Maximize2 } from 'lucide-react';

export default function ForecastVsActualChart({ data, loading }) {
  const [showActual, setShowActual] = useState(true);
  const [showForecast, setShowForecast] = useState(true);
  const [showErrorArea, setShowErrorArea] = useState(true);

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 mb-6 h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Loading aligned generation time-series...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 mb-6 h-96 flex items-center justify-center text-slate-400">
        No generation data available for this date window.
      </div>
    );
  }

  // Pre-process chart items to include error for area visualization
  const chartData = data.map((d) => ({
    ...d,
    displayTime: `${d.date.slice(5)} ${d.time}`,
    overforecast: d.error > 0 ? d.error : 0,
    underforecast: d.error < 0 ? Math.abs(d.error) : 0,
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-950/95 border border-slate-700/80 rounded-lg p-3 text-xs shadow-xl backdrop-blur-sm z-50">
          <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1.5 mb-2 flex items-center justify-between gap-4">
            <span>{item.date} {item.time}</span>
            <span className="text-slate-400 font-mono">Period {item.settlementPeriod}</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4 text-emerald-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Actual Generation:
              </span>
              <span className="font-mono font-bold">{item.actual.toLocaleString()} MW</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-sky-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400" /> Day-Ahead Forecast:
              </span>
              <span className="font-mono font-bold">{item.forecast?.toLocaleString() ?? 'N/A'} MW</span>
            </div>
            <div className={`flex items-center justify-between gap-4 pt-1 border-t border-slate-800/80 font-medium ${
              item.error > 0 ? 'text-amber-400' : 'text-cyan-400'
            }`}>
              <span>Error (Forecast - Actual):</span>
              <span className="font-mono font-bold">
                {item.error > 0 ? `+${item.error.toLocaleString()}` : item.error.toLocaleString()} MW
              </span>
            </div>
            {item.publishTime && (
              <div className="text-[10px] text-slate-400 pt-1">
                DA Cutoff Lock: {item.publishTime.slice(0, 16).replace('T', ' ')} UTC
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 shadow-sm">
      {/* Chart Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Actual Wind Generation vs Day-Ahead Forecast</span>
            <span className="text-xs font-normal text-slate-400">
              ({chartData.length} half-hour periods)
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            GB National Wind Power (FUELHH Actuals vs WINDFOR locked at D-1 12:00 Gate Closure)
          </p>
        </div>

        {/* Legend Toggles */}
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={() => setShowActual(!showActual)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md border transition-all ${
              showActual
                ? 'bg-emerald-950/60 border-emerald-600 text-emerald-400'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Actual (MW)</span>
          </button>

          <button
            onClick={() => setShowForecast(!showForecast)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md border transition-all ${
              showForecast
                ? 'bg-sky-950/60 border-sky-600 text-sky-400'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            <span>Day-Ahead Forecast (MW)</span>
          </button>

          <button
            onClick={() => setShowErrorArea(!showErrorArea)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md border transition-all ${
              showErrorArea
                ? 'bg-amber-950/40 border-amber-600/70 text-amber-400'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded bg-amber-500/40" />
            <span>Shortfall Area</span>
          </button>
        </div>
      </div>

      {/* Main Chart */}
      <div className="w-full h-80 sm:h-96">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="overforecastGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
            <XAxis
              dataKey="displayTime"
              stroke="#64748b"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              minTickGap={30}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              unit=" MW"
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Error Area Shading */}
            {showErrorArea && (
              <Area
                type="monotone"
                dataKey="overforecast"
                name="Over-forecast Error"
                stroke="none"
                fill="url(#overforecastGrad)"
              />
            )}

            {/* Actual Wind Generation Line */}
            {showActual && (
              <Line
                type="monotone"
                dataKey="actual"
                name="Actual Wind (MW)"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, fill: '#10b981', stroke: '#fff' }}
              />
            )}

            {/* Day-Ahead Forecast Line */}
            {showForecast && (
              <Line
                type="monotone"
                dataKey="forecast"
                name="Day-Ahead Forecast (MW)"
                stroke="#38bdf8"
                strokeWidth={2}
                strokeDasharray="4 2"
                dot={false}
                activeDot={{ r: 5, fill: '#38bdf8', stroke: '#fff' }}
              />
            )}

            {/* Interactive Brush Navigation */}
            <Brush
              dataKey="displayTime"
              height={26}
              stroke="#475569"
              fill="#1e293b"
              tickFormatter={() => ''}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 px-1">
        <span>💡 Tip: Drag slider handles on the bottom brush to zoom into specific high-wind or low-wind events.</span>
        <span>Green Solid = Actuals &middot; Sky Dashed = Day-Ahead Forecast</span>
      </div>
    </div>
  );
}
