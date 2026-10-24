import React from 'react';
import { Calendar, Clock, Sliders, RefreshCw, Info } from 'lucide-react';

export default function FilterControls({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  cutoffHour,
  setCutoffHour,
  resolution,
  setResolution,
  onRefresh,
  loading,
}) {
  const presets = [
    { label: 'Full Month (Jan 1-31)', start: '2026-01-01', end: '2026-01-31' },
    { label: 'Week 1', start: '2026-01-01', end: '2026-01-07' },
    { label: 'Week 2', start: '2026-01-08', end: '2026-01-14' },
    { label: 'Week 3', start: '2026-01-15', end: '2026-01-21' },
    { label: 'Week 4', start: '2026-01-22', end: '2026-01-31' },
    { label: 'High Wind Storm', start: '2026-01-08', end: '2026-01-11' },
    { label: 'Low Wind Lull', start: '2026-01-18', end: '2026-01-21' },
  ];

  return (
    <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4 shadow-sm mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Date Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Delivery Window:</span>
            <input
              type="date"
              min="2026-01-01"
              max="2026-01-31"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
            <span className="text-slate-500 text-xs">to</span>
            <input
              type="date"
              min="2026-01-01"
              max="2026-01-31"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Quick Presets Dropdown */}
          <div className="relative">
            <select
              onChange={(e) => {
                const found = presets.find((p) => p.label === e.target.value);
                if (found) {
                  setStartDate(found.start);
                  setEndDate(found.end);
                }
              }}
              defaultValue="Full Month (Jan 1-31)"
              className="bg-slate-800 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option disabled>Select Preset Window</option>
              {presets.map((p) => (
                <option key={p.label} value={p.label}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Gate Closure Cutoff & Resolution */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Cutoff Hour */}
          <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-slate-400 font-medium">D-1 Gate Closure:</span>
            <select
              value={cutoffHour}
              onChange={(e) => setCutoffHour(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value={9}>09:00 UTC (Early DA)</option>
              <option value={11}>11:00 UTC (EPEX SPOT GB)</option>
              <option value={12}>12:00 UTC (Standard D-1 Cutoff)</option>
              <option value={17}>17:00 UTC (Late Schedule)</option>
            </select>
          </div>

          {/* Resolution Toggle */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700/60">
            <button
              type="button"
              onClick={() => setResolution('half-hour')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                resolution === 'half-hour'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Half-hourly resolution (48 settlement periods / day)"
            >
              30m (HH)
            </button>
            <button
              type="button"
              onClick={() => setResolution('hour')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                resolution === 'hour'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Hourly aggregated resolution (24 periods / day)"
            >
              Hourly
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm shadow-emerald-950/40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Evaluating...' : 'Recalculate'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
