'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { Sun, Zap } from 'lucide-react';

interface SolarBellChartProps {
  data: Array<{
    hour: string;
    radiation: number;
    pv_kw: number;
  }>;
  peakPvKw?: number;
  totalPvKwh?: number;
}

export function SolarBellChart({
  data,
  peakPvKw = 1.413,
  totalPvKwh = 4.99,
}: SolarBellChartProps) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-[#E6E4DC] shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-[#F2F0E8]">
        <div>
          <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-500" />
            Hourly Solar Availability
          </h3>
          <p className="text-[11px] text-[#6B7280]">
            NASA POWER insolation curve (Field Solar Insolation Data)
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-amber-700 font-semibold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Measured Insolation
          </span>
          <span className="flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Estimated PV Power
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center my-3">
        <div className="lg:col-span-3 h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="solarAmberGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="pvGreenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="hour" stroke="#9CA3AF" fontSize={10} tickLine={false} />
              <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E5E3DC',
                  borderRadius: '0.75rem',
                  fontSize: '11px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                }}
              />
              <Area
                type="monotone"
                dataKey="radiation"
                name="Solar Radiation (MJ/m²)"
                stroke="#D97706"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#solarAmberGrad)"
              />
              <Area
                type="monotone"
                dataKey="pv_kw"
                name="PV Power (kW)"
                stroke="#059669"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#pvGreenGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Stats Column */}
        <div className="space-y-3 bg-[#FBFBF9] p-3.5 rounded-xl border border-[#EBE9E1]">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#6B7280]">
              Peak Solar Power
            </span>
            <p className="text-lg font-extrabold text-[#111827]">
              {peakPvKw.toFixed(2)} kW
            </p>
            <span className="text-[10px] text-emerald-600 font-semibold">
              @ 12:00 Solar Noon
            </span>
          </div>
          <div className="pt-2 border-t border-[#E5E3DC]">
            <span className="text-[10px] uppercase font-bold text-[#6B7280]">
              Daily Solar Energy
            </span>
            <p className="text-lg font-extrabold text-[#111827]">
              {totalPvKwh.toFixed(2)} kWh
            </p>
            <span className="text-[10px] text-[#6B7280]">
              Over planning window
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
