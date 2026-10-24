import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import FilterControls from './components/FilterControls';
import MetricCards from './components/MetricCards';
import ForecastVsActualChart from './components/ForecastVsActualChart';
import ErrorAnalysis from './components/ErrorAnalysis';
import ProcurementSimulator from './components/ProcurementSimulator';
import DataTable from './components/DataTable';
import { api } from './services/api';
import { AlertCircle, RefreshCw, ExternalLink, ShieldCheck, Zap } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-01-31');
  const [cutoffHour, setCutoffHour] = useState(12);
  const [resolution, setResolution] = useState('half-hour');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [summary, setSummary] = useState(null);
  const [timeseries, setTimeseries] = useState([]);
  const [daily, setDaily] = useState([]);
  const [diurnal, setDiurnal] = useState([]);
  const [distribution, setDistribution] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        start_date: startDate,
        end_date: endDate,
        cutoff_hour: cutoffHour,
        resolution: resolution,
      };

      const [sumRes, tsRes, dailyRes, diurnalRes, distRes] = await Promise.all([
        api.getSummary(params),
        api.getTimeseries(params),
        api.getDaily(params),
        api.getDiurnal(params),
        api.getErrorDistribution(params),
      ]);

      setSummary(sumRes);
      setTimeseries(tsRes.data || []);
      setDaily(dailyRes.data || []);
      setDiurnal(diurnalRes.data || []);
      setDistribution(distRes.bins || []);
    } catch (err) {
      console.error('Failed to load portal data:', err);
      setError(err.message || 'Failed to communicate with wind forecast API service.');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, cutoffHour, resolution]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Navigation */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Global Filter Bar */}
        <FilterControls
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          cutoffHour={cutoffHour}
          setCutoffHour={setCutoffHour}
          resolution={resolution}
          setResolution={setResolution}
          onRefresh={loadData}
          loading={loading}
        />

        {/* Global Error Banner */}
        {error && (
          <div className="bg-rose-950/80 border border-rose-800 text-rose-200 p-4 rounded-xl mb-6 flex items-start justify-between gap-3 shadow-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Connection Warning</h4>
                <p className="text-xs text-rose-300 mt-0.5">{error}</p>
                <p className="text-[11px] text-rose-400 mt-1">
                  Ensure the Python FastAPI backend is running on port 8000.
                </p>
              </div>
            </div>
            <button
              onClick={loadData}
              className="bg-rose-900 hover:bg-rose-800 text-xs text-white px-3 py-1.5 rounded-lg transition-colors shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Headline Metric Cards always visible for rapid situational awareness */}
        <MetricCards summary={summary} />

        {/* View Switching */}
        {activeTab === 'overview' && (
          <div>
            {/* Primary Visual: Timeseries Chart */}
            <ForecastVsActualChart data={timeseries} loading={loading} />

            {/* Quick Procurement Insight Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Commercial Risk Identified
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    National Grid ESO wind forecasts in January 2026 exhibit an average over-forecast bias of{' '}
                    <span className="font-bold text-amber-400 font-mono">
                      +{summary?.bias_mw?.toLocaleString() ?? '1,791'} MW
                    </span>
                    . Utility traders relying on raw forecasts face severe cashout imbalance penalties during peak hours.
                  </p>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Gate Closure Timing Impact
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Aligning forecasts at{' '}
                    <span className="font-semibold text-cyan-400">D-1 {cutoffHour}:00 UTC</span> gate closure
                    accurately reflects the exact information set available before the EPEX SPOT GB Day-Ahead order book locks.
                  </p>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Recommended Procurement Action
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    De-bias wholesale bids and maintain a spinning reserve buffer. Test thermal purchasing in the{' '}
                    <button
                      onClick={() => setActiveTab('procurement')}
                      className="text-emerald-400 underline font-medium hover:text-emerald-300"
                    >
                      Procurement Simulator
                    </button>
                    .
                  </p>
                </div>
              </div>
            </div>

            {/* Procurement Simulator Preview */}
            <ProcurementSimulator
              startDate={startDate}
              endDate={endDate}
              cutoffHour={cutoffHour}
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <ErrorAnalysis
            diurnalData={diurnal}
            distributionData={distribution}
            dailyData={daily}
          />
        )}

        {activeTab === 'procurement' && (
          <ProcurementSimulator
            startDate={startDate}
            endDate={endDate}
            cutoffHour={cutoffHour}
          />
        )}

        {activeTab === 'data' && <DataTable data={timeseries} />}
      </main>

      {/* Professional Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 text-xs text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="font-semibold text-slate-200">
              GridBricks Day-Ahead Renewable Procurement & Forecast Evaluation Portal
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Built for UK Energy Utilities &middot; Data source: Elexon BMRS (FUELHH Actuals & WINDFOR Forecasts)
            </div>
          </div>

          <div className="flex items-center space-x-6 text-[11px]">
            <span>Delivery: January 2026</span>
            <span>Stack: React + Tailwind + FastAPI + Docker</span>
            <a
              href="https://data.elexon.co.uk/bmrs/api-documentation"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>Elexon API Docs</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
