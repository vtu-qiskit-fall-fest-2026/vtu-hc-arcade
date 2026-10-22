'use client';

import React, { useState, useEffect } from 'react';
import {
  Radio,
  Thermometer,
  Droplets,
  Activity,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Wifi,
  ShieldCheck,
  Clock,
  Download,
  Terminal,
  Wrench,
  MapPin,
  Search,
  Cpu,
  Sparkles,
  AlertOctagon,
  HelpCircle,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  CheckSquare,
  Square,
  RotateCcw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { AppHeader } from '@/components/layout/AppHeader';
import { MetricCard } from '@/components/ui/MetricCard';
import { apiService } from '@/services/api';

const mockTelemetryData = [
  { time: '06:00', moisture: 74, temp: 24, flow: 0 },
  { time: '07:00', moisture: 73, temp: 26, flow: 0 },
  { time: '08:00', moisture: 71, temp: 29, flow: 0 },
  { time: '09:00', moisture: 69, temp: 33, flow: 500 },
  { time: '10:00', moisture: 76, temp: 37, flow: 500 },
  { time: '11:00', moisture: 75, temp: 39, flow: 500 },
  { time: '12:00', moisture: 78, temp: 40, flow: 500 },
  { time: '13:00', moisture: 76, temp: 40, flow: 0 },
  { time: '14:00', moisture: 74, temp: 39, flow: 0 },
  { time: '15:00', moisture: 72, temp: 38, flow: 0 },
  { time: '16:00', moisture: 70, temp: 36, flow: 0 },
  { time: '17:00', moisture: 68, temp: 34, flow: 0 },
  { time: '18:00', moisture: 68, temp: 32, flow: 0 },
];

export function LiveMonitoringPage() {
  const [telemetry, setTelemetry] = useState({
    soil_moisture: 68.0,
    temperature: 37.0,
    pump_status: 'Running',
    water_flow: 500.0,
    energy_meter: 1.5,
    device_health: 99.8,
    solar_power: 1.41,
    gateway_id: 'GW-AGRI-01',
    zone_active: 'Zone A',
    is_live_stream: false,
    last_updated: '',
  });
  const [isSimulatingLive, setIsSimulatingLive] = useState(false);

  // Anomaly & SHAP XAI State
  const [anomalyData, setAnomalyData] = useState<any>(null);
  const [anomalyLoading, setAnomalyLoading] = useState(false);
  const [activeScenario, setActiveScenario] = useState<string>('nominal');
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  const loadAnomalyDiagnostics = async (scenarioKey?: string) => {
    try {
      setAnomalyLoading(true);
      const res = await apiService.getAnomalyDiagnostics(scenarioKey);
      setAnomalyData(res);
      if (res?.current_telemetry) {
        setTelemetry(res.current_telemetry);
      }
      if (scenarioKey) {
        setActiveScenario(scenarioKey);
      }
      setCompletedSteps({});
    } catch (err) {
      console.error('Failed to load anomaly diagnostics:', err);
    } finally {
      setAnomalyLoading(false);
    }
  };

  const toggleChecklistStep = (index: number) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  useEffect(() => {
    loadAnomalyDiagnostics();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchTelemetry = async () => {
      try {
        const res = await apiService.getTelemetry();
        if (isMounted && res?.telemetry) {
          setTelemetry(res.telemetry);
        }
      } catch (err) {
        // keep current telemetry state if offline
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 2500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleStartLiveSimulation = async () => {
    setIsSimulatingLive(true);
    try {
      await apiService.postTelemetry({
        soil_moisture: Number((68.2 + (Math.random() * 2 - 1)).toFixed(1)),
        temperature: Number((36.9 + (Math.random() * 1.5 - 0.75)).toFixed(1)),
        pump_status: 'Running',
        water_flow: 500.0,
        energy_meter: 1.52,
        device_health: 99.8,
        solar_power: 1.45,
        gateway_id: 'GW-AGRI-01',
        zone_active: 'Zone A',
        is_live_stream: true,
      });
      const res = await apiService.getTelemetry();
      if (res?.telemetry) setTelemetry(res.telemetry);
    } catch (e) {
      console.error('Failed to start live simulation:', e);
    }
  };

  const handleStopLiveSimulation = async () => {
    setIsSimulatingLive(false);
    try {
      await apiService.postTelemetry({
        is_live_stream: false,
      });
      const res = await apiService.getTelemetry();
      if (res?.telemetry) setTelemetry(res.telemetry);
    } catch (e) {
      console.error('Failed to stop live simulation:', e);
    }
  };

  // While simulating live, send continuous fluctuating sensor updates
  useEffect(() => {
    if (!isSimulatingLive) return;
    const simInterval = setInterval(async () => {
      try {
        await apiService.postTelemetry({
          soil_moisture: Number((67.6 + Math.random() * 2.0).toFixed(1)),
          temperature: Number((36.5 + Math.random() * 1.6).toFixed(1)),
          pump_status: 'Running',
          water_flow: Number((492 + Math.random() * 16).toFixed(0)),
          energy_meter: Number((1.48 + Math.random() * 0.08).toFixed(2)),
          device_health: 99.8,
          solar_power: Number((1.41 + Math.random() * 0.10).toFixed(2)),
          gateway_id: 'GW-AGRI-01',
          zone_active: 'Zone A',
          is_live_stream: true,
        });
      } catch {}
    }, 2800);

    return () => clearInterval(simInterval);
  }, [isSimulatingLive]);

  return (
    <div className="space-y-6">
      <AppHeader
        title="Live Monitoring"
        subtitle="Real-time farm telemetry and LoRaWAN environmental sensor streaming dashboard."
      />

      {/* Live Stream / Standby Status Banner */}
      {telemetry.is_live_stream ? (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5 font-bold text-emerald-800">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <span>LIVE EDGE GATEWAY STREAMING ACTIVE</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] text-emerald-700 font-medium">
              Receiving live sensor packets from Gateway {telemetry.gateway_id} • Updated {telemetry.last_updated ? new Date(telemetry.last_updated).toLocaleTimeString() : 'Just now'}
            </span>
            <button
              type="button"
              onClick={handleStopLiveSimulation}
              className="px-2.5 py-1 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-[11px] transition-colors cursor-pointer shadow-xs"
            >
              Pause Stream
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#E6E4DC] text-[#4B5563] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <div>
              <span className="font-bold text-[#111827] mr-2">Sensor Standby Mode</span>
              <span className="text-[11px] text-[#6B7280]">
                Listening for Desktop IoT Gateway (.exe / python) on <code className="font-mono bg-[#EFECE3] px-1 py-0.5 rounded text-[#111827]">/api/telemetry/</code>
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleStartLiveSimulation}
            className="px-3.5 py-1.5 rounded-xl bg-[#0E3A27] hover:bg-[#072418] text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>Simulate Live Gateway Stream</span>
          </button>
        </div>
      )}

      {/* 6 Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard
          title="Soil Moisture"
          value={`${telemetry.soil_moisture.toFixed(1)}%`}
          subtext="Optimal range (40-80%)"
          badge={telemetry.soil_moisture >= 40 && telemetry.soil_moisture <= 80 ? 'Optimal' : 'Caution'}
          icon={<Droplets className="w-4 h-4 text-blue-600" />}
          variant="blue"
        />
        <MetricCard
          title="Temperature"
          value={`${telemetry.temperature.toFixed(1)}°C`}
          subtext="Field temperature"
          badge={telemetry.temperature > 35 ? 'Warm' : 'Normal'}
          icon={<Thermometer className="w-4 h-4 text-amber-600" />}
          variant="amber"
        />
        <MetricCard
          title="Pump Status"
          value={telemetry.pump_status}
          subtext={`${telemetry.zone_active} active`}
          badge={telemetry.pump_status === 'Running' ? 'Active' : 'Idle'}
          icon={<Activity className="w-4 h-4 text-emerald-600" />}
          variant="emerald"
        />
        <MetricCard
          title="Water Flow"
          value={`${Math.round(telemetry.water_flow)}`}
          unit="L/h"
          subtext="Discharge rate"
          badge="Normal"
          icon={<Droplets className="w-4 h-4 text-blue-600" />}
          variant="blue"
        />
        <MetricCard
          title="Energy Meter"
          value={`${telemetry.energy_meter.toFixed(2)}`}
          unit="kW"
          subtext="Solar pump draw"
          badge="Clean"
          icon={<Zap className="w-4 h-4 text-amber-500" />}
          variant="amber"
        />
        <MetricCard
          title="Device Health"
          value={`${telemetry.device_health.toFixed(1)}%`}
          subtext="All nodes online"
          badge="Healthy"
          icon={<ShieldCheck className="w-4 h-4 text-emerald-600" />}
          variant="emerald"
        />
      </div>

      {/* Historical Moisture & Temperature Chart */}
      <div className="bg-white p-6 rounded-2xl border border-[#E6E4DC] shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#F2F0E8]">
          <div>
            <h3 className="text-sm font-bold text-[#111827]">
              Historical Soil Moisture & Temperature (24h)
            </h3>
            <p className="text-xs text-[#6B7280]">
              Continuous capacitive probe readings from Zone A and Zone B sensors
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#FAF9F5] border border-[#E6E4DC] text-[#4B5563]">
            Update interval: 10s
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockTelemetryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EFEA" />
              <XAxis dataKey="time" stroke="#9CA3AF" fontSize={11} tickLine={false} />
              <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E5E3DC',
                  borderRadius: '0.75rem',
                  fontSize: '11px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Line
                type="monotone"
                dataKey="moisture"
                name="Soil Moisture (%)"
                stroke="#0284C7"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#0284C7' }}
              />
              <Line
                type="monotone"
                dataKey="temp"
                name="Air Temperature (°C)"
                stroke="#F59E0B"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#F59E0B' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Explainable AI (XAI) Anomaly Detection & Remediation Engine (SHAP) */}
      <div className="bg-white rounded-2xl border border-[#E6E4DC] shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#F2F0E8] bg-gradient-to-r from-[#FAF9F5] via-white to-[#F7F6F0]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-md bg-[#0E3A27] text-white text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-emerald-400" />
                  XAI Engine
                </span>
                <span className="text-[11px] font-mono font-medium text-[#6B7280]">
                  SHAP (TreeExplainer) + IsolationForest
                </span>
              </div>
              <h3 className="text-base font-bold text-[#111827] flex items-center gap-2">
                Explainable Anomaly Detection & Physical Root-Cause Fix
              </h3>
              <p className="text-xs text-[#6B7280]">
                Calculates mathematical Shapley values for each telemetry dimension to explain <strong className="text-[#111827]">where the cause is</strong> and prescribe <strong className="text-[#111827]">where to do the fix</strong>.
              </p>
            </div>

            {/* Live Trigger & Refresh Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => loadAnomalyDiagnostics()}
                disabled={anomalyLoading}
                className="px-3 py-1.5 rounded-xl border border-[#E6E4DC] bg-white hover:bg-[#FAF9F5] text-[#111827] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 text-[#6B7280] ${anomalyLoading ? 'animate-spin' : ''}`} />
                <span>Evaluate Live Telemetry</span>
              </button>
            </div>
          </div>

          {/* Fault Injection / Simulation Selector */}
          <div className="mt-4 pt-3 border-t border-[#EFECE3] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Simulate Field Scenarios:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { key: 'pipe_burst', label: '💥 Pipe Burst', color: 'hover:border-red-400' },
                { key: 'pump_cavitation', label: '⚠️ Pump Cavitation', color: 'hover:border-amber-400' },
                { key: 'pv_soiling', label: '☀️ PV Soiling', color: 'hover:border-amber-500' },
                { key: 'sensor_drift', label: '🔌 Sensor Drift', color: 'hover:border-purple-400' },
                { key: 'nominal', label: '✅ Nominal Equilibrium', color: 'hover:border-emerald-500' },
              ].map((sc) => (
                <button
                  key={sc.key}
                  type="button"
                  onClick={() => loadAnomalyDiagnostics(sc.key)}
                  disabled={anomalyLoading}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                    activeScenario === sc.key
                      ? 'bg-[#0E3A27] text-white border-[#0E3A27] shadow-xs'
                      : 'bg-white text-[#4B5563] border-[#E6E4DC] hover:bg-[#FAF9F5]'
                  } ${sc.color}`}
                >
                  {sc.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Anomaly Detection Status Banner */}
        {anomalyData && (
          <div
            className={`px-5 py-3.5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
              anomalyData.is_anomaly
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-950'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-950'
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-3 h-3 rounded-full shrink-0 ${
                  anomalyData.is_anomaly ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'
                }`}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm tracking-tight">
                    {anomalyData.is_anomaly
                      ? `ANOMALY DETECTED — ${anomalyData.severity || 'CRITICAL'}`
                      : 'SYSTEM NOMINAL — NO ANOMALY DETECTED'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      anomalyData.is_anomaly
                        ? 'bg-rose-600 text-white'
                        : 'bg-emerald-700 text-white'
                    }`}
                  >
                    {anomalyData.anomaly_probability}% Anomaly Probability
                  </span>
                </div>
                <p className="text-[11px] opacity-80 mt-0.5">
                  {anomalyData.is_anomaly
                    ? `Primary Driver: ${anomalyData.primary_driver} • Deviation score: ${anomalyData.decision_score}`
                    : 'All telemetry metrics reside within 95% Gaussian nominal operational boundaries.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className="text-[11px] font-mono px-2 py-1 rounded bg-white/70 border border-black/5 font-semibold text-[#111827]">
                Model Confidence: {anomalyData.diagnostics?.confidence_score ?? 98.0}%
              </span>
            </div>
          </div>
        )}

        {/* Content Body: 2 Columns */}
        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: SHAP Feature Attributions (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#111827] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-700" />
                  SHAP Feature Attribution (XAI)
                </h4>
                <p className="text-[11px] text-[#6B7280]">
                  Direction and magnitude of feature contribution to anomaly
                </p>
              </div>
              <span className="text-[10px] font-mono bg-[#FAF9F5] border border-[#E6E4DC] px-1.5 py-0.5 rounded text-[#4B5563]">
                Exact Shapley
              </span>
            </div>

            {/* Feature Bars List */}
            <div className="space-y-3">
              {anomalyData?.top_attributions?.map((attr: any, idx: number) => {
                const isDriving = attr.is_anomalous_driver || attr.shap_value > 0.05;
                const isElevated = attr.direction === 'elevated';
                const isDepressed = attr.direction === 'depressed';
                const barWidth = Math.min(100, Math.max(12, attr.relative_importance_pct));

                return (
                  <div
                    key={attr.feature || idx}
                    className="p-3 rounded-xl bg-[#FAF9F5] border border-[#EFECE3] hover:border-[#D8D5CC] transition-all"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#111827]">{attr.label}</span>
                        {isElevated && (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 flex items-center">
                            <ArrowUpRight className="w-3 h-3" /> High
                          </span>
                        )}
                        {isDepressed && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 flex items-center">
                            <ArrowDownRight className="w-3 h-3" /> Low
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-[#111827]">
                          {attr.current_value} {attr.unit}
                        </span>
                        <span className="text-[10px] text-[#6B7280] block">
                          Baseline: ~{attr.baseline_value} {attr.unit}
                        </span>
                      </div>
                    </div>

                    {/* SHAP Visual Bar */}
                    <div className="space-y-1">
                      <div className="w-full bg-[#E6E4DC] h-2 rounded-full overflow-hidden flex">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            isDriving
                              ? 'bg-rose-500'
                              : 'bg-emerald-600'
                          }`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[#6B7280]">
                        <span className="font-mono">
                          SHAP: {attr.shap_value > 0 ? `+${attr.shap_value}` : attr.shap_value}
                        </span>
                        <span className="font-semibold text-[#111827]">
                          {attr.relative_importance_pct}% influence
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 rounded-xl bg-[#F4F8F5] border border-[#D5E6DC] text-[11px] text-[#0E3A27] flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <strong>How to read SHAP values:</strong> Red bars indicate features actively pushing the model into an anomalous alert state. Green bars reflect metrics stabilizing the system within safe parameters.
              </div>
            </div>
          </div>

          {/* Right Column: Physical Diagnostics & Root Cause Fix (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* WHERE IS THE CAUSE */}
            <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/30 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                      Physical Failure Origin
                    </span>
                    <h4 className="text-sm font-extrabold text-[#111827]">
                      WHERE IS THE CAUSE?
                    </h4>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-white border border-amber-300 text-amber-900 shadow-2xs">
                  {anomalyData?.diagnostics?.fault_category || 'Evaluating...'}
                </span>
              </div>

              {/* Subsystem & Location Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white border border-[#E6E4DC]">
                  <span className="text-[10px] text-[#6B7280] font-bold uppercase block">
                    Affected Subsystem
                  </span>
                  <span className="font-bold text-[#111827] mt-0.5 block">
                    {anomalyData?.diagnostics?.subsystem_affected || 'N/A'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-amber-200">
                  <span className="text-[10px] text-amber-800 font-bold uppercase block flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-600" />
                    Exact Field Location
                  </span>
                  <span className="font-extrabold text-amber-950 mt-0.5 block">
                    {anomalyData?.diagnostics?.where_is_the_cause || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Detailed Physical Explanation */}
              <div className="p-3 rounded-xl bg-white border border-[#E6E4DC] text-xs leading-relaxed text-[#374151]">
                <strong className="text-[#111827] block mb-1">Root-Cause Engineering Diagnostic:</strong>
                {anomalyData?.diagnostics?.root_cause_explanation ||
                  'Continuous telemetry surveillance has identified no anomalous divergence. Operating within expected tolerances.'}
              </div>
            </div>

            {/* WHERE TO DO THE FIX */}
            <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/30 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-800 flex items-center justify-center shrink-0">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                      Remediation & Action Plan
                    </span>
                    <h4 className="text-sm font-extrabold text-[#111827]">
                      WHERE TO DO THE FIX?
                    </h4>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-800 bg-white border border-emerald-300 px-2 py-0.5 rounded shadow-2xs">
                  {Object.values(completedSteps).filter(Boolean).length} /{' '}
                  {anomalyData?.diagnostics?.prescriptive_action_plan?.length || 0} Done
                </span>
              </div>

              {/* Exact Fix Target Box */}
              <div className="p-3 rounded-xl bg-white border border-emerald-300 text-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                    Maintenance Target Location
                  </span>
                  <span className="font-extrabold text-emerald-950 text-xs sm:text-sm mt-0.5 block">
                    📍 {anomalyData?.diagnostics?.where_to_do_the_fix || 'Central Control Room'}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-bold text-[11px] shrink-0">
                  Ready for Dispatch
                </span>
              </div>

              {/* Prescriptive Step Checklist */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] block">
                  Field Technician Action Checklist:
                </span>
                {anomalyData?.diagnostics?.prescriptive_action_plan?.map((step: string, idx: number) => {
                  const isChecked = !!completedSteps[idx];
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleChecklistStep(idx)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 text-xs ${
                        isChecked
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900 opacity-80'
                          : 'bg-white border-[#E6E4DC] hover:border-emerald-400 text-[#111827]'
                      }`}
                    >
                      <button
                        type="button"
                        className="mt-0.5 shrink-0 text-emerald-700"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-700" />
                        ) : (
                          <Square className="w-4 h-4 text-[#9CA3AF]" />
                        )}
                      </button>
                      <div className="space-y-0.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#FAF9F5] border border-[#E6E4DC] text-[#4B5563]">
                            STEP {idx + 1}
                          </span>
                        </div>
                        <p className={`text-xs leading-snug ${isChecked ? 'line-through text-emerald-800' : 'text-[#374151]'}`}>
                          {step}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sensor Status Table */}
      <div className="bg-white p-5 rounded-2xl border border-[#E6E4DC] shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
          Field Hardware & Node Status
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#EFECE3] flex items-center justify-between">
            <div>
              <span className="font-bold text-[#111827] block">Zone A Soil Sensor</span>
              <span className="text-[10px] text-[#6B7280]">Capacitive Probe #1</span>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Online
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#EFECE3] flex items-center justify-between">
            <div>
              <span className="font-bold text-[#111827] block">Zone B Soil Sensor</span>
              <span className="text-[10px] text-[#6B7280]">Capacitive Probe #2</span>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Online
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#EFECE3] flex items-center justify-between">
            <div>
              <span className="font-bold text-[#111827] block">Solar Inverter Gateway</span>
              <span className="text-[10px] text-[#6B7280]">2.0 kW Hybrid Unit</span>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Online
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#EFECE3] flex items-center justify-between">
            <div>
              <span className="font-bold text-[#111827] block">Water Pump Relay</span>
              <span className="text-[10px] text-[#6B7280]">1.5 kW Submersible</span>
            </div>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Engaged
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LiveMonitoringPage;
