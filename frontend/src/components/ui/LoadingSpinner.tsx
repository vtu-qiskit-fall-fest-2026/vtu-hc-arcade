'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  label?: string;
  sublabel?: string;
}

export function LoadingSpinner({
  label = 'Optimizing Irrigation Schedule...',
  sublabel = 'Executing classical MILP / quantum QAOA Hamiltonian solver',
}: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing pulsing ring */}
        <div className="absolute w-20 h-20 rounded-full bg-emerald-500/20 animate-ping opacity-40" />
        {/* Inner rotating gradient circle */}
        <div className="w-16 h-16 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 border-r-purple-400 animate-spin flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
        </div>
      </div>
      <h4 className="mt-6 text-base font-semibold text-zinc-100">{label}</h4>
      <p className="mt-1 text-xs text-zinc-400 max-w-sm">{sublabel}</p>
    </div>
  );
}
