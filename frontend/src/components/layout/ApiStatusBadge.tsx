'use client';

import React, { useEffect, useState } from 'react';
import { apiService } from '@/services/api';
import { HealthStatus } from '@/types/api';

export function ApiStatusBadge() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    const check = async () => {
      try {
        const res = await apiService.getHealth();
        if (isMounted) {
          setHealth(res);
          setIsOnline(true);
        }
      } catch {
        if (isMounted) {
          setIsOnline(false);
        }
      }
    };

    check();
    const interval = setInterval(check, 20000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (isOnline === null) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800/60 border border-zinc-700 text-xs text-zinc-400">
        <span className="w-2 h-2 rounded-full bg-zinc-500 animate-pulse" />
        Checking API...
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300"
        title="Django backend is not running at http://127.0.0.1:8000"
      >
        <span className="w-2 h-2 rounded-full bg-rose-500" />
        Backend Offline
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300"
      title={`Django API Online | Qiskit ${health?.environment.qiskit_version}`}
    >
      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      <span>Django + Qiskit {health?.environment.qiskit_version}</span>
    </div>
  );
}
