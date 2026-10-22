'use client';

import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  badge?: string;
  icon?: React.ReactNode;
  variant?: 'emerald' | 'blue' | 'amber' | 'neutral';
}

const badgeStyles = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  neutral: 'bg-zinc-100 text-zinc-700 border-zinc-200',
};

export function MetricCard({
  title,
  value,
  unit,
  subtext,
  badge,
  icon,
  variant = 'emerald',
}: MetricCardProps) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-[#E6E4DC] shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
          {title}
        </span>
        {icon && (
          <div className="w-8 h-8 rounded-xl bg-[#F7F6F0] border border-[#E6E4DC] flex items-center justify-center text-[#0E3A27]">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1.5 my-1">
        <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-semibold text-[#6B7280]">{unit}</span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-[#F2F0E8]">
        {subtext && (
          <span className="text-xs text-[#6B7280] truncate">{subtext}</span>
        )}
        {badge && (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${badgeStyles[variant]}`}
          >
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
