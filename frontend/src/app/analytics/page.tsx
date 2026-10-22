'use client';

import React from 'react';
import {
  Droplets,
  Zap,
  BarChart3,
  PieChart,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { AppHeader } from '@/components/layout/AppHeader';
import { MetricCard } from '@/components/ui/MetricCard';

const waterScheduledData = [
  { day: 'Mon', demanded: 2000, delivered: 2000 },
  { day: 'Tue', demanded: 2000, delivered: 2000 },
  { day: 'Wed', demanded: 2000, delivered: 2000 },
  { day: 'Thu', demanded: 2500, delivered: 2500 },
  { day: 'Fri', demanded: 2000, delivered: 2000 },
  { day: 'Sat', demanded: 2000, delivered: 2000 },
  { day: 'Sun', demanded: 2000, delivered: 2000 },
];

const energyGridData = [
  { slot: '07:00', solar: 0.18, grid: 1.32 },
  { slot: '08:00', solar: 0.50, grid: 1.00 },
  { slot: '09:00', solar: 0.87, grid: 0.63 },
  { slot: '10:00', solar: 1.17, grid: 0.33 },
  { slot: '11:00', solar: 1.37, grid: 0.13 },
  { slot: '12:00', solar: 1.41, grid: 0.09 },
];

const zoneBreakdown = [
  { zone: 'Zone A (Pulses)', water: 1000, cost: 4.12, solar_pct: '94%' },
  { zone: 'Zone B (Cereals)', water: 1000, cost: 4.12, solar_pct: '91%' },
];

export function WaterEnergyAnalyticsPage() {
  return (
    <div className="space-y-6">
      <AppHeader
        title="Water & Energy Analytics"
        subtitle="Aggregated sustainability metrics, grid electricity displacement, and irrigation volume tracking."
      />

      {/* 4 Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Water Scheduled"
          value="14,500"
          unit="Litres"
          subtext="7-day delivery cumulative"
          badge="100% Demand Met"
          icon={<Droplets className="w-4 h-4 text-blue-600" />}
          variant="blue"
        />
        <MetricCard
          title="Solar Energy Displaced"
          value="34.9"
          unit="kWh"
          subtext="Replaced thermal grid draw"
          badge="Clean Power"
          icon={<Zap className="w-4 h-4 text-emerald-600" />}
          variant="emerald"
        />
        <MetricCard
          title="Modeled Cost Savings"
          value="₹244.30"
          unit="INR"
          subtext="Compared to flat grid tariff"
          badge="73% Reduction"
          icon={<TrendingUp className="w-4 h-4 text-amber-600" />}
          variant="amber"
        />
        <MetricCard
          title="Pumping Efficiency"
          value="333.3"
          unit="L / kWh"
          subtext="Normalized water yield"
          badge="High Efficiency"
          icon={<BarChart3 className="w-4 h-4 text-[#0E3A27]" />}
          variant="emerald"
        />
      </div>

      {/* Row 1 Charts matching Screen 7 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Water Demand vs Scheduled Delivery */}
        <div className="bg-white p-6 rounded-2xl border border-[#E6E4DC] shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F2F0E8]">
            <div>
              <h3 className="text-sm font-bold text-[#111827]">
                Water Demand vs Scheduled Delivery (Litres)
              </h3>
              <p className="text-xs text-[#6B7280]">
                Comparing crop moisture needs against solver-allocated pump runtimes
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
              100% Satisfied
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waterScheduledData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EFEA" />
                <XAxis dataKey="day" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} domain={[0, 3000]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E5E3DC',
                    borderRadius: '0.75rem',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="demanded" name="Demanded Water (L)" fill="#93C5FD" radius={[4, 4, 0, 0]} />
                <Bar dataKey="delivered" name="Delivered Water (L)" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Estimated Grid vs Solar Consumption */}
        <div className="bg-white p-6 rounded-2xl border border-[#E6E4DC] shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F2F0E8]">
            <div>
              <h3 className="text-sm font-bold text-[#111827]">
                Hourly Solar vs Grid Power Allocation (kW)
              </h3>
              <p className="text-xs text-[#6B7280]">
                Demonstrating solar absorption and grid import minimization
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
              Solar Priority
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={energyGridData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EFEA" />
                <XAxis dataKey="slot" stroke="#9CA3AF" fontSize={11} tickLine={false} />
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
                <Bar dataKey="solar" name="Solar Power Absorbed (kW)" fill="#F59E0B" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="grid" name="Grid Deficit Imported (kW)" fill="#EF4444" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Zone-Wise Breakdown Table matching Screen 7 */}
      <div className="bg-white p-6 rounded-2xl border border-[#E6E4DC] shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
        <h3 className="text-sm font-bold text-[#111827]">
          Zone-Wise Energy & Irrigation Distribution
        </h3>

        <div className="overflow-x-auto rounded-xl border border-[#E6E4DC]">
          <table className="w-full text-left text-xs text-[#374151]">
            <thead className="bg-[#FAF9F5] text-[11px] uppercase tracking-wider text-[#6B7280] border-b border-[#E6E4DC]">
              <tr>
                <th className="py-3 px-4 font-bold">Zone Name</th>
                <th className="py-3 px-4 font-bold text-right">Water Delivered</th>
                <th className="py-3 px-4 font-bold text-right">Allocated Grid Cost</th>
                <th className="py-3 px-4 font-bold text-right">Solar Energy Share</th>
                <th className="py-3 px-4 font-bold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFECE3]">
              {zoneBreakdown.map((z) => (
                <tr key={z.zone} className="hover:bg-[#FAF9F5]">
                  <td className="py-3 px-4 font-bold text-[#111827]">{z.zone}</td>
                  <td className="py-3 px-4 text-right font-semibold text-blue-700">
                    {z.water.toLocaleString()} L
                  </td>
                  <td className="py-3 px-4 text-right font-extrabold text-[#111827]">
                    ₹{z.cost.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-700">
                    {z.solar_pct}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                      OPTIMIZED
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default WaterEnergyAnalyticsPage;
