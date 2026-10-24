import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, Zap, DollarSign, ArrowRight, CheckCircle, Calculator, Sliders } from 'lucide-react';
import { api } from '../services/api';

export default function ProcurementSimulator({ startDate, endDate, cutoffHour }) {
  const [demandMw, setDemandMw] = useState(25000);
  const [confidence, setConfidence] = useState(90);
  const [cashoutSpread, setCashoutSpread] = useState(65);
  const [simResult, setSimResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runSimulation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.simulateProcurement({
        baseline_demand_mw: Number(demandMw),
        confidence_level: Number(confidence),
        cashout_spread_gbp: Number(cashoutSpread),
        start_date: startDate,
        end_date: endDate,
        cutoff_hour: cutoffHour,
      });
      setSimResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [startDate, endDate, cutoffHour]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-5">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-white">UK Utility Day-Ahead Procurement Simulator</h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
              Decision Support
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Simulates wholesale thermal power purchase requirements and calculates optimal spinning reserve buffers.
          </p>
        </div>

        <button
          onClick={runSimulation}
          disabled={loading}
          className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm shadow-emerald-950/40"
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>{loading ? 'Simulating...' : 'Run Simulation'}</span>
        </button>
      </div>

      {/* Simulator Inputs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
        {/* Input 1: Baseline Demand */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
            <span>Utility Consumer Demand:</span>
            <span className="font-mono text-emerald-400">{demandMw.toLocaleString()} MW</span>
          </label>
          <input
            type="range"
            min="10000"
            max="40000"
            step="1000"
            value={demandMw}
            onChange={(e) => setDemandMw(Number(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>10k MW (Small Utility)</span>
            <span>25k MW (Mid-Cap)</span>
            <span>40k MW (Big 6)</span>
          </div>
        </div>

        {/* Input 2: Confidence Level */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
            <span>Reserve Safety Confidence:</span>
            <span className="font-mono text-cyan-400">{confidence}%</span>
          </label>
          <div className="flex gap-2">
            {[85, 90, 95, 99].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setConfidence(lvl)}
                className={`flex-1 py-1 text-xs rounded font-medium border transition-all ${
                  confidence === lvl
                    ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {lvl}%
              </button>
            ))}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Empirical percentile protecting against tail forecast errors
          </div>
        </div>

        {/* Input 3: Cashout Imbalance Spread */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
            <span>Elexon Imbalance Spread Penalty:</span>
            <span className="font-mono text-amber-400">£{cashoutSpread}/MWh</span>
          </label>
          <input
            type="number"
            min="20"
            max="250"
            value={cashoutSpread}
            onChange={(e) => setCashoutSpread(Number(e.target.value))}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          />
          <div className="text-[10px] text-slate-400 mt-1">
            Differential between Day-Ahead purchase price & System Buy Price (SBP)
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-950/60 border border-rose-800 text-rose-300 p-3 rounded-lg text-xs mb-4">
          Simulation error: {error}
        </div>
      )}

      {/* Comparison Output */}
      {simResult && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Strategy 1: Naive Day-Ahead Strategy */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-slate-200">Strategy A: Naive DA Procurement</h3>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-800">
                    High Risk
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Buys exactly <span className="font-mono text-slate-300">Demand - Raw Wind Forecast</span> without error adjustments.
                </p>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
                    <span className="text-slate-400">Avg Thermal Power Procured:</span>
                    <span className="font-mono font-semibold text-slate-200">
                      {simResult.naive_strategy.avg_thermal_procured_mw.toLocaleString()} MW
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
                    <span className="text-slate-400">Periods with Shortfall:</span>
                    <span className="font-mono font-semibold text-rose-400">
                      {simResult.naive_strategy.shortfall_periods_count} periods
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
                    <span className="text-slate-400">Total Energy Shortfall:</span>
                    <span className="font-mono font-semibold text-rose-400">
                      {simResult.naive_strategy.total_shortfall_mwh.toLocaleString()} MWh
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-slate-400">Estimated Imbalance Cashout Cost:</span>
                    <span className="font-mono font-bold text-rose-400 text-sm">
                      £{simResult.naive_strategy.estimated_penalty_gbp.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-amber-300/80">
                ⚠️ Blindly trusting the forecast exposes the utility to continuous physical deficit whenever wind under-performs.
              </div>
            </div>

            {/* Strategy 2: GridBricks Optimized Strategy */}
            <div className="bg-slate-950/80 border border-emerald-800/80 rounded-xl p-4 flex flex-col justify-between shadow-lg shadow-emerald-950/20">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-emerald-300">Strategy B: GridBricks Optimized</h3>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Adjusts for <span className="text-emerald-400 font-mono">+{simResult.mean_bias_mw} MW Mean Bias</span> and adds an empirical <span className="text-cyan-400 font-mono">+{simResult.recommended_buffer_mw} MW Reserve Buffer</span>.
                </p>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
                    <span className="text-slate-400">Thermal Procurement + Buffer:</span>
                    <span className="font-mono font-semibold text-emerald-300">
                      {simResult.optimized_strategy.avg_thermal_procured_mw.toLocaleString()} MW
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
                    <span className="text-slate-400">Recommended Reserve Buffer:</span>
                    <span className="font-mono font-semibold text-cyan-400">
                      +{simResult.recommended_buffer_mw.toLocaleString()} MW ({confidence}% safe)
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
                    <span className="text-slate-400">Unhedged Shortfall:</span>
                    <span className="font-mono font-semibold text-slate-300">
                      {simResult.optimized_strategy.total_shortfall_mwh.toLocaleString()} MWh
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-slate-400">Imbalance Penalty Exposure:</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      £{simResult.optimized_strategy.estimated_penalty_gbp.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-emerald-400">
                ✅ Automatically hedges {simResult.financial_impact.shortfall_reduction_pct}% of physical shortfall risk using empirical historical error percentiles.
              </div>
            </div>
          </div>

          {/* Value Created Banner */}
          <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-600/50 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  Quantified Financial Value for Utility
                </h4>
                <div className="text-xl font-bold text-white flex items-center gap-2">
                  <span>£{simResult.financial_impact.risk_cost_reduction_gbp.toLocaleString()}</span>
                  <span className="text-xs font-normal text-emerald-400">
                    Cashout Penalty Avoided in January 2026
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-6 text-xs text-slate-300">
              <div>
                <span className="text-slate-400 block">Shortfall Avoided:</span>
                <span className="font-mono font-bold text-white">
                  {simResult.financial_impact.mwh_shortfall_avoided.toLocaleString()} MWh
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Risk Reduction:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {simResult.financial_impact.shortfall_reduction_pct}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
