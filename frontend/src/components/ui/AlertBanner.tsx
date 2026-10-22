'use client';

import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface AlertBannerProps {
  type?: 'info' | 'warning' | 'error' | 'success';
  title?: string;
  message: string | React.ReactNode;
  details?: string[];
}

const styles = {
  info: {
    container: 'bg-blue-950/40 border-blue-800/60 text-blue-200',
    icon: <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />,
    title: 'text-blue-300 font-semibold',
  },
  warning: {
    container: 'bg-amber-950/40 border-amber-800/60 text-amber-200',
    icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />,
    title: 'text-amber-300 font-semibold',
  },
  error: {
    container: 'bg-rose-950/40 border-rose-800/60 text-rose-200',
    icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />,
    title: 'text-rose-300 font-semibold',
  },
  success: {
    container: 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200',
    icon: <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />,
    title: 'text-emerald-300 font-semibold',
  },
};

export function AlertBanner({
  type = 'info',
  title,
  message,
  details,
}: AlertBannerProps) {
  const cfg = styles[type];

  return (
    <div className={`p-4 rounded-xl border flex gap-3 text-sm ${cfg.container}`}>
      {cfg.icon}
      <div className="space-y-1 w-full">
        {title && <h5 className={cfg.title}>{title}</h5>}
        <div className="text-xs leading-relaxed opacity-95">{message}</div>
        {details && details.length > 0 && (
          <ul className="mt-2 list-disc list-inside text-xs space-y-0.5 opacity-90">
            {details.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
