'use client';

import React from 'react';
import { ScheduleSlot } from '@/types/api';
import { Droplet } from 'lucide-react';

interface ScheduleTimelineProps {
  schedule: ScheduleSlot[];
  zones?: string[];
}

export function ScheduleTimeline({
  schedule,
  zones = ['Zone_A', 'Zone_B'],
}: ScheduleTimelineProps) {
  if (!schedule || schedule.length === 0) return null;

  return (
    <div className="bg-white p-5 rounded-2xl border border-[#E6E4DC] shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-[#F2F0E8]">
        <h4 className="text-sm font-bold text-[#111827] flex items-center gap-2">
          <Droplet className="w-4 h-4 text-emerald-600" />
          Irrigation Timeline
        </h4>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-emerald-800 font-medium">
            <span className="w-2.5 h-2.5 rounded bg-emerald-600" />
            Active Irrigating
          </span>
          <span className="flex items-center gap-1.5 text-zinc-400 font-medium">
            <span className="w-2.5 h-2.5 rounded bg-[#F0EFEA] border border-[#E0DED5]" />
            Idle Slot
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {zones.map((zone) => (
          <div key={zone} className="flex items-center gap-3">
            <span className="w-20 text-xs font-bold text-[#374151] truncate">
              {zone}
            </span>
            <div className="grid grid-cols-6 gap-2 flex-1">
              {schedule.map((slot) => {
                const isActive = slot.running_zones.includes(zone);
                return (
                  <div
                    key={slot.hour_local_solar_time}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      isActive
                        ? 'bg-emerald-600 border-emerald-700 text-white shadow-xs font-bold'
                        : 'bg-[#F9F8F4] border-[#E8E6DE] text-[#9CA3AF]'
                    }`}
                  >
                    <div className="text-[10px] font-mono opacity-80">
                      {slot.hour_local_solar_time}:00
                    </div>
                    <div className="text-[11px] mt-0.5">
                      {isActive ? 'PUMP ON' : 'OFF'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
