'use client';

import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Cpu, Sparkles } from 'lucide-react';

interface StatusBadgeProps {
  status: 'feasible' | 'infeasible' | 'optimal' | 'qaoa' | 'classical' | 'warning' | string;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const norm = status.toLowerCase();

  if (norm.includes('feasible') || norm === 'pass' || norm === 'valid') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
        <CheckCircle2 className="w-3.5 h-3.5" />
        {label || 'Constraints Passed'}
      </span>
    );
  }

  if (norm.includes('infeasible') || norm === 'fail' || norm === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30">
        <XCircle className="w-3.5 h-3.5" />
        {label || 'Infeasible'}
      </span>
    );
  }

  if (norm.includes('qaoa') || norm.includes('quantum')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/15 text-purple-300 border border-purple-500/30">
        <Sparkles className="w-3.5 h-3.5" />
        {label || 'QAOA Variational'}
      </span>
    );
  }

  if (norm.includes('classical')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/15 text-blue-300 border border-blue-500/30">
        <Cpu className="w-3.5 h-3.5" />
        {label || 'Classical MILP'}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
      <AlertTriangle className="w-3.5 h-3.5" />
      {label || status}
    </span>
  );
}
