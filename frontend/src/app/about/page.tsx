'use client';

import React from 'react';
import {
  Info,
  Atom,
  Cpu,
  Droplets,
  Scale,
  ShieldCheck,
  Award,
  Layers,
  Database,
  Terminal,
} from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';

export default function AboutPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <AppHeader
        title="About & Mathematical Formulation"
        subtitle="Problem statement, hybrid QUBO architecture, and scientific constraints."
      />

      {/* System Specifications Card */}
      <div className="bg-white p-6 rounded-2xl border border-[#E6E4DC] shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
        <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
          <Award className="w-5 h-5 text-emerald-700" />
          System & Deployment Specifications
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#EFECE3]">
            <span className="text-[#6B7280] block text-[10px] uppercase font-bold">System</span>
            <span className="text-[#111827] font-bold">Q-IRRIGATE Autonomous Scheduler</span>
          </div>
          <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#EFECE3]">
            <span className="text-[#6B7280] block text-[10px] uppercase font-bold">Optimization Core</span>
            <span className="text-[#111827] font-bold">Hybrid QAOA + MILP Branch-and-Cut</span>
          </div>
          <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#EFECE3]">
            <span className="text-[#6B7280] block text-[10px] uppercase font-bold">Weather Ingestion</span>
            <span className="text-[#111827] font-bold">NASA POWER Hourly API</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
            <span className="text-emerald-800 block text-[10px] uppercase font-bold">Sustainability Goal</span>
            <span className="text-emerald-950 font-bold">Zero-Carbon Solar Irrigation</span>
          </div>
        </div>
      </div>

      {/* Problem & Motivation */}
      <div className="bg-white p-6 rounded-2xl border border-[#E6E4DC] shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
        <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
          <Droplets className="w-4 h-4 text-blue-600" />
          Agricultural Problem & Motivation
        </h3>
        <p className="text-xs text-[#4B5563] leading-relaxed">
          Agricultural water pumping is one of the highest consumers of rural electricity in India. Pumping during peak tariff hours or cloud-covered intervals leads to high operating costs and increased grid load. On-site solar photovoltaic (PV) generation offers clean energy, but solar irradiance fluctuates throughout the day.
        </p>
        <p className="text-xs text-[#4B5563] leading-relaxed">
          <strong>Q-IRRIGATE</strong> formulates irrigation planning as a constrained combinatorial optimization problem: deciding exactly which pump operates during which hourly slot to satisfy crop water demands while maximizing solar energy utilization and minimizing grid electricity expenditures.
        </p>
      </div>

      {/* Mathematical & QUBO Formulation */}
      <div className="bg-white p-6 rounded-2xl border border-[#E6E4DC] shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
        <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-700" />
          Mathematical Formulation (MILP & QUBO)
        </h3>

        <div className="space-y-4 text-xs">
          <div>
            <h4 className="font-bold text-[#111827]">1. Decision Variables</h4>
            <p className="text-[#6B7280] mt-1">
              Let <code className="font-mono text-emerald-800 font-bold">x_&#123;z,s&#125; ∈ &#123;0, 1&#125;</code> be binary variables representing whether zone <code className="text-[#111827]">z</code> is irrigated during hour slot <code className="text-[#111827]">s</code>.
            </p>
            <p className="text-[#6B7280] mt-1">
              Let <code className="font-mono text-emerald-800 font-bold">g_s ≥ 0</code> be continuous variables denoting grid electricity imported during slot <code className="text-[#111827]">s</code> (kW).
            </p>
          </div>

          <div>
            <h4 className="font-bold text-[#111827]">2. Objective Function</h4>
            <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#EFECE3] font-mono text-emerald-900 text-center my-1.5 font-bold">
              minimize &nbsp; ∑_s Tariff · g_s
            </div>
            <p className="text-[#6B7280]">
              Where the required grid import covers the power deficit after direct solar self-consumption:
            </p>
            <div className="p-2 rounded-lg bg-[#FAF9F5] font-mono text-[#374151] text-center my-1">
              g_s ≥ ∑_z PumpPower · x_&#123;z,s&#125; - PV_s
            </div>
          </div>

          <div>
            <h4 className="font-bold text-[#111827]">3. Operational Constraints</h4>
            <ul className="list-disc list-inside space-y-1.5 text-[#4B5563] mt-1">
              <li>
                <strong>Crop Water Demand:</strong> &nbsp;
                <code className="text-blue-800 font-mono">∑_s Flow · x_&#123;z,s&#125; ≥ Demand_z</code> for each zone <code className="text-[#111827]">z</code>.
              </li>
              <li>
                <strong>Simultaneous Pump Limits:</strong> &nbsp;
                <code className="text-amber-800 font-mono">∑_z x_&#123;z,s&#125; ≤ MaxPumps</code> (preventing transformer overload / pressure drops).
              </li>
              <li>
                <strong>Grid Import Limit:</strong> &nbsp;
                <code className="text-rose-800 font-mono">0 ≤ g_s ≤ GridLimit</code>.
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-[#111827]">4. Quantum QUBO & QAOA Mapping</h4>
            <p className="text-[#6B7280] mt-1">
              Linear constraints are mapped to penalty terms in an Ising Hamiltonian:
            </p>
            <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 font-mono text-purple-900 text-center my-1.5 font-bold">
              H = H_cost + P · ∑_z (∑_s x_&#123;z,s&#125; - req_z)² + P · ∑_s (collision penalties)
            </div>
            <p className="text-[#6B7280]">
              The ground state is approximated variationally using alternating problem and mixer unitaries <code className="text-purple-800 font-mono">U(C, γ) U(B, β)</code> on Qiskit <code className="text-[#111827]">StatevectorSampler</code> with COBYLA parameter optimization.
            </p>
          </div>
        </div>
      </div>

      {/* Disclaimers */}
      <div className="p-5 rounded-2xl bg-[#FAF9F5] border border-[#E6E4DC] text-xs space-y-2">
        <h4 className="font-bold text-[#111827]">Scientific & Physical Disclaimer</h4>
        <p className="text-[#6B7280] leading-relaxed">
          Q-IRRIGATE is an advanced clean-tech decision support software platform. It explores variational quantum optimization algorithms on realistic mathematical models of rural agricultural grids. It does NOT claim quantum speedup or superiority over classical MILP solvers. Field implementation requires hardware microcontrollers, flow meters, and inverter telemetry.
        </p>
      </div>
    </div>
  );
}
