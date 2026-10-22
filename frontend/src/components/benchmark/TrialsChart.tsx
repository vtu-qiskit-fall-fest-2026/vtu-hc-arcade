'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { BenchmarkTrial } from '@/types/api';

interface TrialsChartProps {
  trials: BenchmarkTrial[];
  classicalCost?: number;
}

export function TrialsChart({
  trials,
  classicalCost = 8.2444,
}: TrialsChartProps) {
  if (!trials || trials.length === 0) return null;

  const data = trials.map((t) => ({
    seed: `Seed ${t.seed}`,
    cost: t.grid_cost_rupees ? Number(t.grid_cost_rupees.toFixed(2)) : 0,
    status: t.status,
  }));

  return (
    <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-950/60 backdrop-blur-sm space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-zinc-200">
            QAOA Convergence Across Random Seeds
          </h4>
          <p className="text-[11px] text-zinc-400">
            Dotted green line denotes exact classical optimum (₹{classicalCost.toFixed(2)})
          </p>
        </div>
        <span className="text-xs font-medium text-purple-400">
          Statevector Simulation
        </span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 15, right: 15, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="seed" stroke="#71717a" fontSize={11} />
            <YAxis stroke="#71717a" fontSize={11} domain={[0, 18]} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#18181b',
                borderColor: '#3f3f46',
                borderRadius: '0.5rem',
                fontSize: '12px',
              }}
              formatter={(val: any) => [`₹${val}`, 'Grid Cost']}
            />
            <ReferenceLine
              y={classicalCost}
              stroke="#10b981"
              strokeDasharray="4 4"
              strokeWidth={2}
              label={{
                value: `Exact Classical: ₹${classicalCost.toFixed(2)}`,
                position: 'top',
                fill: '#10b981',
                fontSize: 11,
              }}
            />
            <Bar
              dataKey="cost"
              fill="#a855f7"
              radius={[4, 4, 0, 0]}
              name="QAOA Trial Cost (₹)"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
