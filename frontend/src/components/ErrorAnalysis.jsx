import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
} from 'recharts';
import { Sun, BarChart3, Calendar, AlertCircle } from 'lucide-react';

export default function ErrorAnalysis({ diurnalData, distributionData, dailyData }) {
  const [activeSubTab, setActiveSubTab] = useState('diurnal');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 shadow-sm">
      {/* Sub-tab Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Forecast Error & Diurnal Volatility Analysis</span>
          </h2>
          <p className="text-xs text-slate-400">
            Evaluating time-of-day bias patterns, error magnitude distributions, and daily variance.
          </p>
        </div>

        <div className="flex space-x-1 bg-slate-800 p-1 rounded-lg border border-slate-700/60 text-xs">
          <button
            onClick={() => setActiveSubTab('diurnal')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              activeSubTab === 'diurnal'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>24-Hour Diurnal Pattern</span>
          </button>

          <button
            onClick={() => setActiveSubTab('distribution')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              activeSubTab === 'distribution'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Error Distribution</span>
          </button>

          <button
            onClick={() => setActiveSubTab('daily')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              activeSubTab === 'daily'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Daily Breakdown</span>
          </button>
        </div>
      </div>

      {/* Sub-Tab 1: Diurnal Profile */}
      {activeSubTab === 'diurnal' && (
        <div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 mb-4 text-xs text-slate-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200">Diurnal Pattern Insight for Traders: </span>
              In January 2026, National Grid wind forecasts show consistent positive bias across all 24 hours. The highest over-forecast errors peak between 14:00 and 19:00 UTC, overlapping directly with the UK evening peak power demand window!
            </div>
          </div>

          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={diurnalData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="hourLabel" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis
                  yAxisId="left"
                  stroke="#64748b"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  unit=" MW"
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#f59e0b"
                  tick={{ fontSize: 11, fill: '#f59e0b' }}
                  tickFormatter={(v) => `${v}`}
                  unit=" MW"
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />

                <Bar
                  yAxisId="right"
                  dataKey="bias_mw"
                  name="Mean Bias Error (MW)"
                  fill="#f59e0b"
                  opacity={0.7}
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="avg_actual_mw"
                  name="Avg Actual Wind (MW)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="avg_forecast_mw"
                  name="Avg DA Forecast (MW)"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  strokeDasharray="4 2"
                  dot={{ r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Error Distribution */}
      {activeSubTab === 'distribution' && (
        <div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 mb-4 text-xs text-slate-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200">Error Frequency Distribution: </span>
              Shows the histogram of forecast errors (MW). The prominent right shift illustrates that over-forecasting occurs significantly more often than under-forecasting in National Grid's Day-Ahead models.
            </div>
          </div>

          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis
                  dataKey="binRange"
                  stroke="#64748b"
                  tick={{ fontSize: 9, fill: '#94a3b8' }}
                  angle={-30}
                  textAnchor="end"
                />
                <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} unit=" periods" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }}
                />
                <Bar dataKey="count" name="Frequency (Settlement Periods)" radius={[4, 4, 0, 0]}>
                  {distributionData?.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.binCenter > 0 ? '#f59e0b' : '#06b6d4'}
                      opacity={0.8}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center text-xs text-slate-400 mt-2">
            Amber Bars: Over-forecast (&gt; 0 MW, Shortage Risk) &middot; Cyan Bars: Under-forecast (&lt; 0 MW, Spill/Surplus)
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Daily Performance */}
      {activeSubTab === 'daily' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Periods</th>
                <th className="py-2.5 px-3 text-right">MAE (MW)</th>
                <th className="py-2.5 px-3 text-right">RMSE (MW)</th>
                <th className="py-2.5 px-3 text-right">Mean Bias (MW)</th>
                <th className="py-2.5 px-3 text-right">WAPE (%)</th>
                <th className="py-2.5 px-3 text-right">Actual (GWh)</th>
                <th className="py-2.5 px-3 text-right">Forecast (GWh)</th>
                <th className="py-2.5 px-3 text-right">Net Gap (GWh)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {dailyData?.map((d) => (
                <tr key={d.date} className="hover:bg-slate-800/50 transition-colors">
                  <td className="py-2 px-3 font-medium text-slate-200">{d.date}</td>
                  <td className="py-2 px-3 text-slate-400">{d.periods}</td>
                  <td className="py-2 px-3 text-right font-mono text-slate-200">{d.mae_mw.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right font-mono text-slate-400">{d.rmse_mw.toLocaleString()}</td>
                  <td className={`py-2 px-3 text-right font-mono font-medium ${
                    d.bias_mw > 0 ? 'text-amber-400' : 'text-cyan-400'
                  }`}>
                    {d.bias_mw > 0 ? `+${d.bias_mw.toLocaleString()}` : d.bias_mw.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-slate-300">{d.wape_pct.toFixed(1)}%</td>
                  <td className="py-2 px-3 text-right font-mono text-emerald-400">{d.actual_gwh.toFixed(1)}</td>
                  <td className="py-2 px-3 text-right font-mono text-sky-400">{d.forecast_gwh.toFixed(1)}</td>
                  <td className={`py-2 px-3 text-right font-mono font-semibold ${
                    d.imbalance_gwh > 0 ? 'text-amber-400' : 'text-cyan-400'
                  }`}>
                    {d.imbalance_gwh > 0 ? `+${d.imbalance_gwh.toFixed(1)}` : d.imbalance_gwh.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
