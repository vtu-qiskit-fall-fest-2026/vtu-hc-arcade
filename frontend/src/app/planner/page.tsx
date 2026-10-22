'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Cpu,
  Sparkles,
  Scale,
  Play,
  RotateCcw,
  Droplets,
  Sun,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Settings2,
} from 'lucide-react';
import { apiService } from '@/services/api';
import { OptimizationRequest, OptimizationResponse } from '@/types/api';
import { AppHeader } from '@/components/layout/AppHeader';
import { ScheduleTable } from '@/components/schedule/ScheduleTable';
import { ScheduleTimeline } from '@/components/schedule/ScheduleTimeline';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const AVAILABLE_HOURS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

export default function PlannerPage() {
  const [zones, setZones] = useState<string[]>(['Zone_A', 'Zone_B']);
  const [newZoneName, setNewZoneName] = useState('');
  const [selectedHours, setSelectedHours] = useState<number[]>([7, 8, 9, 10, 11, 12]);
  const [demandLitres, setDemandLitres] = useState<number>(1000);
  const [flowRate, setFlowRate] = useState<number>(500);
  const [pumpPower, setPumpPower] = useState<number>(1.5);
  const [panelCapacity, setPanelCapacity] = useState<number>(2.0);
  const [perfFactor, setPerfFactor] = useState<number>(0.80);
  const [tariff, setTariff] = useState<number>(7.0);
  const [gridLimit, setGridLimit] = useState<number>(1.5);
  const [maxPumps, setMaxPumps] = useState<number>(1);
  const [solver, setSolver] = useState<'classical' | 'qaoa' | 'compare'>('classical');

  // QAOA settings
  const [qaoaSeed, setQaoaSeed] = useState<number>(7);
  const [qaoaReps, setQaoaReps] = useState<number>(2);
  const [qaoaMaxiter, setQaoaMaxiter] = useState<number>(150);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleHour = (hour: number) => {
    if (selectedHours.includes(hour)) {
      if (selectedHours.length <= 1) return;
      setSelectedHours(selectedHours.filter((h) => h !== hour));
    } else {
      setSelectedHours([...selectedHours, hour].sort((a, b) => a - b));
    }
  };

  const addZone = () => {
    const trimmed = newZoneName.trim();
    if (trimmed && !zones.includes(trimmed) && zones.length < 5) {
      setZones([...zones, trimmed]);
      setNewZoneName('');
    }
  };

  const removeZone = (zone: string) => {
    if (zones.length <= 1) return;
    setZones(zones.filter((z) => z !== zone));
  };

  const handleReset = () => {
    setZones(['Zone_A', 'Zone_B']);
    setSelectedHours([7, 8, 9, 10, 11, 12]);
    setDemandLitres(1000);
    setFlowRate(500);
    setPumpPower(1.5);
    setPanelCapacity(2.0);
    setPerfFactor(0.80);
    setTariff(7.0);
    setGridLimit(1.5);
    setMaxPumps(1);
    setSolver('classical');
    setQaoaSeed(7);
    setQaoaReps(2);
    setQaoaMaxiter(150);
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload: OptimizationRequest = {
      zones,
      planning_hours: selectedHours,
      demand_litres: Number(demandLitres),
      flow_litres_per_hour: Number(flowRate),
      pump_power_kw: Number(pumpPower),
      panel_capacity_kw: Number(panelCapacity),
      solar_performance_factor: Number(perfFactor),
      grid_tariff_rupees_per_kwh: Number(tariff),
      grid_limit_kw: Number(gridLimit),
      max_pumps_running: Number(maxPumps),
      solver,
      qaoa_seed: Number(qaoaSeed),
      qaoa_reps: Number(qaoaReps),
      qaoa_maxiter: Number(qaoaMaxiter),
    };

    try {
      const res = await apiService.optimizeSchedule(payload);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Optimization request failed.');
    } finally {
      setLoading(false);
    }
  };

  const summary = result?.summary;

  return (
    <div className="space-y-6">
      <AppHeader
        title="Irrigation Planner"
        subtitle="Mathematical modeling and schedule generation for precision crop irrigation."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Configuration Card matching Screen 3 */}
        <div className="bg-white p-6 rounded-2xl border border-[#E6E4DC] shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-6">
          {/* Zone Configuration Selector Pills */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                Zone Configuration
              </label>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-[#6B7280] hover:text-[#111827] flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset Defaults
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {zones.map((z, idx) => (
                <div
                  key={z}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#E8F5E9] text-[#1B5E20] border border-[#A5D6A7]"
                >
                  <span>{z}</span>
                  {zones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeZone(z)}
                      className="text-emerald-700 hover:text-rose-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
              {zones.length < 5 && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newZoneName}
                    onChange={(e) => setNewZoneName(e.target.value)}
                    placeholder="Zone Name"
                    className="w-24 px-2.5 py-1 text-xs bg-[#FAF9F5] border border-[#D5D3CA] rounded-lg text-[#111827] focus:outline-none focus:border-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={addZone}
                    className="px-2.5 py-1 rounded-lg bg-[#FAF9F5] border border-[#D5D3CA] text-xs font-bold text-[#374151] hover:bg-[#EFECE3]"
                  >
                    + Add
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Form Inputs Grid matching Screen 3 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-[#4B5563] block mb-1">
                Water Demand
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="100"
                  max="10000"
                  step="100"
                  value={demandLitres}
                  onChange={(e) => setDemandLitres(Number(e.target.value))}
                  className="w-full bg-[#FAF9F5] border border-[#E6E4DC] rounded-xl px-3 py-2 text-xs font-bold text-[#111827] focus:border-emerald-600 focus:outline-none"
                />
                <span className="absolute right-3 top-2 text-[11px] font-semibold text-[#9CA3AF]">
                  Litres
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#4B5563] block mb-1">
                Pump Flow Rate
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="100"
                  max="5000"
                  step="50"
                  value={flowRate}
                  onChange={(e) => setFlowRate(Number(e.target.value))}
                  className="w-full bg-[#FAF9F5] border border-[#E6E4DC] rounded-xl px-3 py-2 text-xs font-bold text-[#111827] focus:border-emerald-600 focus:outline-none"
                />
                <span className="absolute right-3 top-2 text-[11px] font-semibold text-[#9CA3AF]">
                  L / hour
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#4B5563] block mb-1">
                Pump Power
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0.5"
                  max="20"
                  step="0.1"
                  value={pumpPower}
                  onChange={(e) => setPumpPower(Number(e.target.value))}
                  className="w-full bg-[#FAF9F5] border border-[#E6E4DC] rounded-xl px-3 py-2 text-xs font-bold text-[#111827] focus:border-emerald-600 focus:outline-none"
                />
                <span className="absolute right-3 top-2 text-[11px] font-semibold text-[#9CA3AF]">
                  kW
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#4B5563] block mb-1">
                Electricity Tariff
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="50"
                  step="0.5"
                  value={tariff}
                  onChange={(e) => setTariff(Number(e.target.value))}
                  className="w-full bg-[#FAF9F5] border border-[#E6E4DC] rounded-xl px-3 py-2 text-xs font-bold text-[#111827] focus:border-emerald-600 focus:outline-none"
                />
                <span className="absolute right-3 top-2 text-[11px] font-semibold text-[#9CA3AF]">
                  ₹ / kWh
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#4B5563] block mb-1">
                Solar Panel Capacity
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="25"
                  step="0.5"
                  value={panelCapacity}
                  onChange={(e) => setPanelCapacity(Number(e.target.value))}
                  className="w-full bg-[#FAF9F5] border border-[#E6E4DC] rounded-xl px-3 py-2 text-xs font-bold text-[#111827] focus:border-emerald-600 focus:outline-none"
                />
                <span className="absolute right-3 top-2 text-[11px] font-semibold text-[#9CA3AF]">
                  kW peak
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#4B5563] block mb-1">
                Max Concurrent Pumps
              </label>
              <input
                type="number"
                min="1"
                max="4"
                value={maxPumps}
                onChange={(e) => setMaxPumps(Number(e.target.value))}
                className="w-full bg-[#FAF9F5] border border-[#E6E4DC] rounded-xl px-3 py-2 text-xs font-bold text-[#111827] focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Planning Window Selection */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#6B7280] block mb-2">
              Available Planning Slots (Local Solar Time)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_HOURS.map((h) => {
                const isSel = selectedHours.includes(h);
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => toggleHour(h)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                      isSel
                        ? 'bg-[#0E3A27] text-white shadow-xs'
                        : 'bg-[#FAF9F5] text-[#6B7280] border border-[#E6E4DC] hover:text-[#111827]'
                    }`}
                  >
                    {h}:00
                  </button>
                );
              })}
            </div>
          </div>

          {/* Solver Choice matching Screen 3 */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#6B7280] block mb-2">
              Solver Choice
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setSolver('classical')}
                className={`py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  solver === 'classical'
                    ? 'bg-[#0E3A27] text-white border-[#0E3A27] shadow-sm'
                    : 'bg-[#FAF9F5] text-[#4B5563] border-[#E6E4DC] hover:bg-[#F3F1E9]'
                }`}
              >
                <Cpu className="w-4 h-4" />
                Classical (SciPy MILP)
              </button>

              <button
                type="button"
                onClick={() => setSolver('qaoa')}
                className={`py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  solver === 'qaoa'
                    ? 'bg-[#0E3A27] text-white border-[#0E3A27] shadow-sm'
                    : 'bg-[#FAF9F5] text-[#4B5563] border-[#E6E4DC] hover:bg-[#F3F1E9]'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                QAOA (Qiskit Statevector)
              </button>

              <button
                type="button"
                onClick={() => setSolver('compare')}
                className={`py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  solver === 'compare'
                    ? 'bg-[#0E3A27] text-white border-[#0E3A27] shadow-sm'
                    : 'bg-[#FAF9F5] text-[#4B5563] border-[#E6E4DC] hover:bg-[#F3F1E9]'
                }`}
              >
                <Scale className="w-4 h-4" />
                Compare (MILP vs QAOA)
              </button>
            </div>
          </div>

          {/* Advanced Settings Accordion */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-bold text-[#0E3A27] hover:underline flex items-center gap-1.5"
            >
              <Settings2 className="w-3.5 h-3.5" />
              {showAdvanced ? 'Hide Advanced QAOA Hyperparameters' : 'Show Advanced QAOA Hyperparameters'}
            </button>

            {showAdvanced && (
              <div className="mt-3 p-4 rounded-xl bg-[#FAF9F5] border border-[#E6E4DC] grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-[#6B7280] block mb-1">
                    Random Seed
                  </label>
                  <input
                    type="number"
                    value={qaoaSeed}
                    onChange={(e) => setQaoaSeed(Number(e.target.value))}
                    className="w-full bg-white border border-[#E6E4DC] rounded-lg px-2.5 py-1 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[#6B7280] block mb-1">
                    QAOA Layers (p)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="3"
                    value={qaoaReps}
                    onChange={(e) => setQaoaReps(Number(e.target.value))}
                    className="w-full bg-white border border-[#E6E4DC] rounded-lg px-2.5 py-1 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[#6B7280] block mb-1">
                    Max Iterations
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="300"
                    value={qaoaMaxiter}
                    onChange={(e) => setQaoaMaxiter(Number(e.target.value))}
                    className="w-full bg-white border border-[#E6E4DC] rounded-lg px-2.5 py-1 text-xs font-mono font-bold"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Big Green Primary Button matching Screen 3 */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl text-sm font-bold text-white bg-[#0E3A27] hover:bg-[#082618] shadow-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              {loading ? 'Optimizing Schedule...' : 'Generate Optimal Schedule'}
            </button>
          </div>
        </div>
      </form>

      {/* Loading state */}
      {loading && (
        <LoadingSpinner
          label="Running Mathematical Optimization..."
          sublabel="Evaluating power balance against NASA POWER solar data"
        />
      )}

      {/* Error / Infeasible Notice */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {result && !result.is_feasible && !loading && (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
          <h4 className="text-sm font-bold flex items-center gap-2 text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-700" />
            Schedule Infeasible Under Current Constraints
          </h4>
          <p className="text-xs leading-relaxed">{result.status_message}</p>
        </div>
      )}

      {/* Results Section matching Screen 3 bottom */}
      {result && result.is_feasible && !loading && (
        <div className="space-y-6 pt-2">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left 2 Cols: Schedule Table */}
            <div className="lg:col-span-2 space-y-3">
              <h3 className="text-sm font-bold text-[#111827]">
                Optimized Slot Schedule
              </h3>
              <ScheduleTable schedule={result.schedule} />
            </div>

            {/* Right 1 Col: Estimated Cost Summary Card matching Screen 3 */}
            <div className="bg-white p-6 rounded-2xl border border-[#E6E4DC] shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
              <div>
                <span className="text-[11px] uppercase font-bold tracking-wider text-[#6B7280]">
                  Estimated Cost
                </span>
                <div className="text-3xl font-extrabold text-[#111827] mt-1">
                  ₹{summary?.total_cost_rupees?.toFixed(4) ?? '8.2444'}
                </div>
                <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 block">
                  Optimized for NASA POWER 2025-03-15
                </span>
              </div>

              <div className="space-y-2.5 pt-3 border-t border-[#F2F0E8] text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Water Delivery Summary:</span>
                  <span className="font-bold text-[#111827]">
                    {summary?.total_water_delivered_litres.toLocaleString()} Litres
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Grid Energy Estimate:</span>
                  <span className="font-bold text-[#111827]">
                    {summary?.total_grid_energy_kwh?.toFixed(2)} kWh
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Solar Energy Generated:</span>
                  <span className="font-bold text-[#111827]">
                    {summary?.total_pv_generated_kwh?.toFixed(2)} kWh
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Feasibility:</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Guaranteed
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Solver Time:</span>
                  <span className="font-mono text-[#111827]">
                    {result.execution_time_ms} ms
                  </span>
                </div>
              </div>
            </div>
          </div>

          <ScheduleTimeline schedule={result.schedule} zones={zones} />
        </div>
      )}
    </div>
  );
}
