'use client';

import React, { useEffect, useState } from 'react';
import {
  History,
  FileText,
  Sliders,
  CheckCircle2,
  XCircle,
  Download,
  Settings,
  Save,
} from 'lucide-react';
import { apiService } from '@/services/api';
import { OptimizationRunRecord } from '@/types/api';
import { AppHeader } from '@/components/layout/AppHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export function HistoryReportsPage() {
  const [runs, setRuns] = useState<OptimizationRunRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Settings form state
  const [farmName, setFarmName] = useState('Smart Solar Agri-Farm #1');
  const [coordinates, setCoordinates] = useState('Custom Field Station Coordinates');
  const [defaultTariff, setDefaultTariff] = useState(7.0);
  const [defaultCapacity, setDefaultCapacity] = useState(2.0);

  useEffect(() => {
    async function loadHistory() {
      try {
        setLoading(true);
        const res = await apiService.getHistory();
        setRuns(res.runs || []);
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  if (loading) {
    return <LoadingSpinner label="Loading Execution History..." />;
  }

  return (
    <div className="space-y-6">
      <AppHeader
        title="History, Reports & Settings"
        subtitle="Audit log of mathematical optimization runs and persistent farm configuration."
      />

      {/* History Table Card matching Screen 8 top */}
      <div className="bg-white p-6 rounded-2xl border border-[#E6E4DC] shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#F2F0E8]">
          <div>
            <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-700" />
              Optimization Runs History
            </h3>
            <p className="text-xs text-[#6B7280]">
              Traceable records stored in SQLite database ({runs.length} runs recorded)
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#FAF9F5] border border-[#E6E4DC] text-[#374151]">
            SQLite Traceability
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#E6E4DC]">
          <table className="w-full text-left text-xs text-[#374151]">
            <thead className="bg-[#FAF9F5] text-[11px] uppercase tracking-wider text-[#6B7280] border-b border-[#E6E4DC]">
              <tr>
                <th className="py-3 px-4 font-bold">Run ID</th>
                <th className="py-3 px-4 font-bold">Date & Time</th>
                <th className="py-3 px-4 font-bold">Solver</th>
                <th className="py-3 px-4 font-bold">Scenario Demand</th>
                <th className="py-3 px-4 font-bold text-right">Modeled Cost</th>
                <th className="py-3 px-4 font-bold text-center">Feasibility</th>
                <th className="py-3 px-4 font-bold text-right">Solver Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFECE3]">
              {runs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-[#9CA3AF]">
                    No historical runs logged yet. Execute an optimization from the Planner.
                  </td>
                </tr>
              ) : (
                runs.map((r) => (
                  <tr key={r.id} className="hover:bg-[#FAF9F5] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#111827]">
                      {r.id.slice(0, 8)}
                    </td>
                    <td className="py-3 px-4 text-[#6B7280]">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {r.solver}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-[#374151]">
                      {r.demand_litres} L / zone
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-[#111827]">
                      {r.total_cost_rupees != null
                        ? `₹${r.total_cost_rupees.toFixed(2)}`
                        : '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {r.is_feasible ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Feasible
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded">
                          <XCircle className="w-3.5 h-3.5" /> Infeasible
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[#6B7280]">
                      {r.execution_time_ms != null
                        ? `${r.execution_time_ms.toFixed(0)} ms`
                        : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settings Form matching Screen 8 bottom */}
      <div className="bg-white p-6 rounded-2xl border border-[#E6E4DC] shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#F2F0E8]">
          <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#0E3A27]" />
            Farm Profile & Default Assumptions
          </h3>
          {savedSuccess && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Settings Saved
            </span>
          )}
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-[#4B5563] block mb-1">
                Farm Profile Name
              </label>
              <input
                type="text"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                className="w-full bg-[#FAF9F5] border border-[#E6E4DC] rounded-xl px-3 py-2 text-xs font-bold text-[#111827] focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#4B5563] block mb-1">
                GPS Coordinates
              </label>
              <input
                type="text"
                value={coordinates}
                onChange={(e) => setCoordinates(e.target.value)}
                className="w-full bg-[#FAF9F5] border border-[#E6E4DC] rounded-xl px-3 py-2 text-xs font-bold text-[#111827] focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#4B5563] block mb-1">
                Default Grid Tariff (₹/kWh)
              </label>
              <input
                type="number"
                step="0.5"
                value={defaultTariff}
                onChange={(e) => setDefaultTariff(Number(e.target.value))}
                className="w-full bg-[#FAF9F5] border border-[#E6E4DC] rounded-xl px-3 py-2 text-xs font-bold text-[#111827] focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#4B5563] block mb-1">
                Installed PV Capacity (kW)
              </label>
              <input
                type="number"
                step="0.5"
                value={defaultCapacity}
                onChange={(e) => setDefaultCapacity(Number(e.target.value))}
                className="w-full bg-[#FAF9F5] border border-[#E6E4DC] rounded-xl px-3 py-2 text-xs font-bold text-[#111827] focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#0E3A27] hover:bg-[#072418] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              Save Farm Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default HistoryReportsPage;
