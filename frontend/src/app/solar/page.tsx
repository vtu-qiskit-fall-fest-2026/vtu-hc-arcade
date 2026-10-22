'use client';

import React, { useEffect, useState } from 'react';
import {
  Sun,
  Thermometer,
  CloudRain,
  Calendar,
  AlertTriangle,
  MapPin,
  Clock,
  Compass,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { apiService } from '@/services/api';
import { SolarProfileResponse } from '@/types/api';
import { AppHeader } from '@/components/layout/AppHeader';
import { MetricCard } from '@/components/ui/MetricCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function SolarProfilePage() {
  const [data, setData] = useState<SolarProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await apiService.getSolarProfile();
        setData(res);
      } catch (err) {
        console.error('Failed to load solar data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <LoadingSpinner label="Loading NASA POWER Solar Profile..." />;
  }

  const records = data?.records || [];

  const chartData = records.map((r) => ({
    hour: `${r.hour}:00`,
    radiation: Number(r.allsky_sfc_sw_dwn.toFixed(2)),
    pv_kw: Number((2.0 * r.solar_energy_kwh_m2 * 0.8).toFixed(3)),
    temp: r.temperature_c,
    humidity: r.relative_humidity_pct,
    precip: r.precipitation_mm,
  }));

  const maxRadiation = Math.max(...records.map((r) => r.allsky_sfc_sw_dwn), 3.18);
  const maxPv = Math.max(...chartData.map((r) => r.pv_kw), 1.413);

  return (
    <div className="space-y-6">
      <AppHeader
        title="Weather & Solar"
        subtitle="NASA POWER hourly solar radiation, insolation curves, and temperature profiles."
      />

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Date of Observation"
          value="2025-03-15"
          subtext="Local Solar Time (LST)"
          badge="NASA POWER"
          icon={<Calendar className="w-4 h-4 text-[#0E3A27]" />}
          variant="emerald"
        />
        <MetricCard
          title="Peak Solar Radiation"
          value={maxRadiation.toFixed(2)}
          unit="MJ / m²"
          subtext="Recorded at 12:00 LST"
          badge="Solar Noon"
          icon={<Sun className="w-4 h-4 text-amber-500" />}
          variant="amber"
        />
        <MetricCard
          title="Peak Estimated PV"
          value={maxPv.toFixed(2)}
          unit="kW"
          subtext="2.0 kW panel @ 80% factor"
          badge="Max Power"
          icon={<Sun className="w-4 h-4 text-emerald-600" />}
          variant="emerald"
        />
        <MetricCard
          title="Daily Precipitation"
          value="0.0"
          unit="mm"
          subtext="Clear sky day"
          badge="Dry"
          icon={<CloudRain className="w-4 h-4 text-blue-500" />}
          variant="blue"
        />
      </div>

      {/* Main Solar Bell Curve & Electricity Estimate Cards matching Screen 6 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Hourly Solar Bell Curve Area Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-[#E6E4DC] shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F2F0E8]">
            <div>
              <h3 className="text-sm font-bold text-[#111827]">
                Hourly Solar Radiation Curve (24 Hours)
              </h3>
              <p className="text-xs text-[#6B7280]">
                Allsky surface downward irradiance across daylight hours
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-amber-700 font-semibold">
                <span className="w-2.5 h-2.5 rounded bg-amber-500" />
                Radiation (MJ/m²)
              </span>
              <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
                PV Output (kW)
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="solarAmber" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="pvGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EFEA" />
                <XAxis dataKey="hour" stroke="#9CA3AF" fontSize={10} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E5E3DC',
                    borderRadius: '0.75rem',
                    fontSize: '11px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="radiation"
                  name="Solar Radiation (MJ/m²)"
                  stroke="#D97706"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#solarAmber)"
                />
                <Area
                  type="monotone"
                  dataKey="pv_kw"
                  name="PV Power (kW)"
                  stroke="#059669"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#pvGreen)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: Solar-to-Electricity Estimate Box matching Screen 6 */}
        <div className="bg-white p-6 rounded-2xl border border-[#E6E4DC] shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
            Solar-to-Electricity Estimate
          </h4>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#EFECE3]">
              <span className="text-[#6B7280] block text-[11px]">Peak Solar Radiation</span>
              <span className="text-xl font-extrabold text-[#111827]">
                {maxRadiation.toFixed(2)} MJ/m²
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#EFECE3]">
              <span className="text-[#6B7280] block text-[11px]">Hourly Solar Energy</span>
              <span className="text-xl font-extrabold text-[#111827]">
                {(maxRadiation / 3.6).toFixed(3)} kWh/m²
              </span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-emerald-800 block text-[11px] font-semibold">
                Estimated PV Power Output
              </span>
              <span className="text-xl font-extrabold text-emerald-900">
                {maxPv.toFixed(3)} kW
              </span>
            </div>
          </div>

          <p className="text-[11px] text-[#6B7280] leading-relaxed pt-2 border-t border-[#F2F0E8]">
            Formula: <code className="font-mono text-[#0E3A27]">PV_kW = Panel_kW × (MJ/3.6) × 0.80</code>. This is a simplified provisional estimate, not physical panel telemetry.
          </p>
        </div>
      </div>

      {/* Temperature & Precipitation Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-[#E6E4DC] shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
          <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-rose-500" />
            Diurnal Temperature Curve (°C)
          </h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EFEA" />
                <XAxis dataKey="hour" stroke="#9CA3AF" fontSize={10} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} domain={[20, 42]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E5E3DC',
                    borderRadius: '0.75rem',
                    fontSize: '11px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="temp"
                  name="Temperature (°C)"
                  stroke="#E11D48"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#E11D48' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E6E4DC] shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
          <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
            <CloudRain className="w-4 h-4 text-blue-500" />
            Relative Humidity Profile (%)
          </h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EFEA" />
                <XAxis dataKey="hour" stroke="#9CA3AF" fontSize={10} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E5E3DC',
                    borderRadius: '0.75rem',
                    fontSize: '11px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="humidity"
                  name="Relative Humidity (%)"
                  stroke="#0284C7"
                  strokeWidth={2}
                  fill="#BAE6FD"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
