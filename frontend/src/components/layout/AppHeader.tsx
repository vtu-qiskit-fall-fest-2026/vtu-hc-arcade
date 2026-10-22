'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, MapPin, Menu, User } from 'lucide-react';
import { apiService } from '@/services/api';
import { useSidebar } from '@/context/SidebarContext';
import { useProfile } from '@/context/ProfileContext';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
}

export function AppHeader({ title, subtitle }: AppHeaderProps) {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const { toggle } = useSidebar();
  const { profile, openProfileModal } = useProfile();

  useEffect(() => {
    let mounted = true;
    apiService
      .getHealth()
      .then(() => {
        if (mounted) setIsOnline(true);
      })
      .catch(() => {
        if (mounted) setIsOnline(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6 border-b border-[#E6E4DC]">
      <div className="flex items-center gap-3">
        {/* Mobile 3-Horizontal Lines Hamburger Menu Button */}
        <button
          type="button"
          onClick={toggle}
          className="md:hidden p-2.5 rounded-xl bg-white border border-[#E6E4DC] text-[#0E3A27] hover:bg-[#F7F6F0] shadow-xs shrink-0 cursor-pointer transition-colors"
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#171A18]">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-[#6B7280] mt-0.5 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Farm Region (Clickable to open Profile & Settings) */}
        <button
          type="button"
          onClick={openProfileModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#F7F6F0] border border-[#E6E4DC] text-xs font-medium text-[#4B5563] shadow-xs cursor-pointer transition-colors"
          title="Edit Farm Location & Settings"
        >
          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">{profile.location}</span>
        </button>

        {/* Date Selector */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E6E4DC] text-xs font-medium text-[#4B5563] shadow-xs">
          <Calendar className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
          <span>15 March 2025</span>
        </div>

        {/* Backend Status Pill */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-xs ${
            isOnline
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
            }`}
          />
          <span>{isOnline ? 'Active' : 'Offline'}</span>
        </div>

        {/* Operable Operator Profile Avatar Button */}
        <button
          type="button"
          onClick={openProfileModal}
          title="Open Operator Profile & Account"
          className="w-8 h-8 rounded-full bg-[#0E3A27] text-emerald-300 hover:text-white hover:ring-emerald-500 hover:scale-105 flex items-center justify-center text-xs font-bold ring-2 ring-emerald-600/30 shrink-0 cursor-pointer transition-all shadow-xs"
          aria-label="Open operator profile"
        >
          OP
        </button>
      </div>
    </header>
  );
}
