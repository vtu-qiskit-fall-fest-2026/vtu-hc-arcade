'use client';

import React from 'react';
import { ScheduleSlot } from '@/types/api';
import { CheckCircle2, Clock } from 'lucide-react';

interface ScheduleTableProps {
  schedule: ScheduleSlot[];
  emptyMessage?: string;
}

export function ScheduleTable({
  schedule,
  emptyMessage = 'No schedule available yet. Run optimization to generate a schedule.',
}: ScheduleTableProps) {
  if (!schedule || schedule.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed border-[#DCDAD0] rounded-2xl bg-white">
        <Clock className="w-8 h-8 mx-auto text-[#9CA3AF] mb-2" />
        <p className="text-sm text-[#6B7280]">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#E6E4DC] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <table className="w-full text-left text-xs text-[#374151]">
        <thead className="bg-[#FAF9F5] text-[11px] uppercase tracking-wider text-[#6B7280] border-b border-[#E6E4DC]">
          <tr>
            <th className="px-4 py-3.5 font-bold">Time Slot (LST)</th>
            <th className="px-4 py-3.5 font-bold">Active Pump Zone</th>
            <th className="px-4 py-3.5 font-bold text-right">Solar PV (kW)</th>
            <th className="px-4 py-3.5 font-bold text-right">Pump Load (kW)</th>
            <th className="px-4 py-3.5 font-bold text-right">Grid Deficit (kW)</th>
            <th className="px-4 py-3.5 font-bold text-right">Grid Cost (₹)</th>
            <th className="px-4 py-3.5 font-bold text-right">Water Delivered</th>
            <th className="px-4 py-3.5 font-bold text-center">Feasibility</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EFECE3]">
          {schedule.map((slot) => {
            const hasPump = slot.running_zones && slot.running_zones !== 'None';
            return (
              <tr
                key={slot.hour_local_solar_time}
                className={`transition-colors hover:bg-[#FAF9F5] ${
                  hasPump ? 'bg-emerald-50/40' : ''
                }`}
              >
                <td className="px-4 py-3 font-semibold text-[#111827]">
                  {slot.hour_local_solar_time}:00 – {slot.hour_local_solar_time + 1}:00
                </td>
                <td className="px-4 py-3">
                  {hasPump ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100/80 text-emerald-900 border border-emerald-300">
                      {slot.running_zones}
                    </span>
                  ) : (
                    <span className="text-[#9CA3AF] italic">Idle</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-mono text-amber-700 font-semibold">
                  {slot.estimated_pv_kw.toFixed(3)} kW
                </td>
                <td className="px-4 py-3 text-right font-mono text-[#374151]">
                  {slot.pump_load_kw.toFixed(3)} kW
                </td>
                <td className="px-4 py-3 text-right font-mono text-rose-700 font-semibold">
                  {slot.grid_import_kw.toFixed(3)} kW
                </td>
                <td className="px-4 py-3 text-right font-bold text-[#111827]">
                  ₹{slot.grid_cost_rupees.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-blue-700">
                  {slot.water_delivered_litres.toLocaleString()} L
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-4 h-4 mx-auto" />
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
