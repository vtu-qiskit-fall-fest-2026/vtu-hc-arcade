'use client';

import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { ScheduleSlot } from '@/types/api';

interface EnergyBalanceChartProps {
  schedule: ScheduleSlot[];
}

export function EnergyBalanceChart({ schedule }: EnergyBalanceChartProps) {
  if (!schedule || schedule.length === 0) return null;

  const data = schedule.map((s) => ({
    hour: `${s.hour_local_solar_time}:00`,
    pv_kw: s.estimated_pv_kw,
    pump_load_kw: s.pump_load_kw,
    grid_import_kw: s.grid_import_kw,
    cost_rupees: s.grid_cost_rupees,
  }));

  return (
    <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-950/60 backdrop-blur-sm space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-zinc-200">
          Hourly Energy Balance & Grid Deficit
        </h4>
        <span className="text-[11px] text-zinc-400">Values in Kilowatts (kW)</span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="hour" stroke="#71717a" fontSize={11} />
            <YAxis stroke="#71717a" fontSize={11} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#18181b',
                borderColor: '#3f3f46',
                borderRadius: '0.5rem',
                fontSize: '12px',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
            <Bar dataKey="pv_kw" name="Estimated PV Output (kW)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="pump_load_kw" name="Pump Electrical Load (kW)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Line
              type="monotone"
              dataKey="grid_import_kw"
              name="Grid Import Deficit (kW)"
              stroke="#f43f5e"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#f43f5e' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
