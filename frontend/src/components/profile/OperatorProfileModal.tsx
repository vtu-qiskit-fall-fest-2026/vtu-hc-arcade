'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  User,
  ShieldCheck,
  MapPin,
  Mail,
  Phone,
  Radio,
  Cpu,
  LogOut,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { useProfile } from '@/context/ProfileContext';

export function OperatorProfileModal() {
  const router = useRouter();
  const { profile, updateProfile, isProfileModalOpen, closeProfileModal } = useProfile();

  const [formData, setFormData] = useState(profile);
  const [isSaved, setIsSaved] = useState(false);

  // Sync state when modal opens
  React.useEffect(() => {
    if (isProfileModalOpen) {
      setFormData(profile);
      setIsSaved(false);
    }
  }, [isProfileModalOpen, profile]);

  if (!isProfileModalOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(formData);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 2500);
  };

  const handleLogout = () => {
    closeProfileModal();
    try {
      localStorage.removeItem('q_irrigate_auth');
      sessionStorage.clear();
    } catch {}
    router.push('/login');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-lg bg-[#F7F6F0] rounded-3xl border border-[#E6E4DC] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Banner */}
        <div className="bg-[#092619] p-6 text-white relative border-b border-[#143D2A]">
          <button
            type="button"
            onClick={closeProfileModal}
            className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-[#0E3523] transition-colors cursor-pointer"
            aria-label="Close profile modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white text-2xl font-black shadow-lg border-2 border-emerald-400/50 shrink-0">
              OP
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-white truncate">
                  {profile.name}
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Online
                </span>
              </div>
              <p className="text-xs text-emerald-300/90 font-medium truncate mt-0.5">
                {profile.role}
              </p>
              <p className="text-[11px] text-zinc-400 flex items-center gap-1 mt-1 truncate">
                <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                {profile.location}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Section: Operational Identity */}
          <div className="bg-white p-5 rounded-2xl border border-[#E6E4DC] shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900/80 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-600" />
              Operator Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-[11px] font-semibold text-zinc-600 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#FAF9F5] border border-[#E6E4DC] rounded-xl px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-600 block mb-1">
                  Designation / Role
                </label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-[#FAF9F5] border border-[#E6E4DC] rounded-xl px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-600 block mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#FAF9F5] border border-[#E6E4DC] rounded-xl pl-8 pr-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-emerald-600"
                  />
                  <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-600 block mb-1">
                  Contact Phone
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#FAF9F5] border border-[#E6E4DC] rounded-xl pl-8 pr-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-emerald-600"
                  />
                  <Phone className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-600 block mb-1">
                Farm Site Location
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full bg-[#FAF9F5] border border-[#E6E4DC] rounded-xl pl-8 pr-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-emerald-600"
                />
                <MapPin className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          {/* Section: Connected Infrastructure */}
          <div className="bg-white p-5 rounded-2xl border border-[#E6E4DC] shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900/80 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Connected Telemetry & Engine
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E6E4DC] flex items-center gap-2.5">
                <Radio className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-zinc-500 font-semibold uppercase">LoRaWAN Gateway</p>
                  <p className="text-xs font-bold text-zinc-800 truncate">{formData.gatewayId}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E6E4DC] flex items-center gap-2.5">
                <Cpu className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-zinc-500 font-semibold uppercase">Optimization Engine</p>
                  <p className="text-xs font-bold text-zinc-800 truncate">Qiskit QAOA (Ising/QUBO)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between gap-3 pt-2">
            {/* Primary Logout Button (Single, Official) */}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-600" />
              <span>Sign Out</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={closeProfileModal}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-[#EBE8DD] transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0E3A27] hover:bg-[#072418] shadow-sm transition-all cursor-pointer"
              >
                {isSaved ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
