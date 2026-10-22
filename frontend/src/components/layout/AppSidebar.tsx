'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Radio,
  Sun,
  BarChart3,
  Droplets,
  History,
  Users,
  X,
  LogOut,
  Shield,
} from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';
import { useProfile } from '@/context/ProfileContext';
import { useAuth } from '@/context/AuthContext';
import { apiService } from '@/services/api';

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen, close } = useSidebar();
  const { openProfileModal } = useProfile();
  const { user, isSuperadmin, logout } = useAuth();
  const [isTelemetryLive, setIsTelemetryLive] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    const checkTelemetry = async () => {
      try {
        const res = await apiService.getTelemetry();
        if (mounted && res?.telemetry) {
          setIsTelemetryLive(Boolean(res.telemetry.is_live_stream));
        }
      } catch {
        // ignore
      }
    };
    checkTelemetry();
    const interval = setInterval(checkTelemetry, 3500);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    close();
    logout();
    router.push('/login');
  };

  // If on login page, don't show the dashboard sidebar
  if (pathname === '/login') {
    return null;
  }

  // Include dynamic Live/Standby badge and Superadmin links
  const navigationItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/planner', label: 'Irrigation Planner', icon: Calendar },
    {
      href: '/monitoring',
      label: 'Live Monitoring',
      icon: Radio,
      badge: isTelemetryLive ? 'Live' : 'Standby',
    },
    { href: '/solar', label: 'Weather & Solar', icon: Sun },
    { href: '/benchmark', label: 'Quantum vs Classical', icon: BarChart3 },
    { href: '/analytics', label: 'Water & Energy', icon: Droplets },
    { href: '/history', label: 'History & Reports', icon: History },
    ...(isSuperadmin
      ? [
          {
            href: '/users',
            label: 'User & Roles',
            icon: Users,
            badge: 'Superadmin',
          },
        ]
      : []),
  ];

  const displayName = user?.full_name || user?.username || 'Field Operator';
  const displayLocation = user?.location || 'Primary Farm Station';
  const initials = displayName.substring(0, 2).toUpperCase();

  const renderNavContent = (isMobileDrawer = false) => (
    <div className="flex flex-col w-full h-full bg-[#092619] text-zinc-300 select-none">
      {/* Brand Header */}
      <div className="p-5 flex items-center justify-between border-b border-[#143D2A]/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg border border-emerald-400/30 shrink-0 bg-[#0E3523] flex items-center justify-center">
            <Image
              src="/logo_icon.png"
              alt="Q-IRRIGATE Logo"
              width={40}
              height={40}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              Q-IRRIGATE
            </span>
            <p className="text-[10px] text-emerald-300 font-medium tracking-wide">
              Smart Solar Agri-Tech
            </p>
          </div>
        </div>

        {/* Mobile Close Button */}
        {isMobileDrawer && (
          <button
            type="button"
            onClick={close}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#0E3523] md:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-emerald-500/70">
          Navigation
        </div>
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (isMobileDrawer) close();
              }}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#14432C] text-[#A7F3D0] border border-[#236343] font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-[#0E3523]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-[#34D399]' : 'text-zinc-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                    item.badge === 'Superadmin'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      : item.badge === 'Live'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                      : 'bg-zinc-700/50 text-zinc-300 border-zinc-600/40'
                  }`}
                >
                  {item.badge === 'Live' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                  )}
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile Pill & Logout at Bottom */}
      <div className="p-3 border-t border-[#143D2A]/80 bg-[#061D13] shrink-0 space-y-2">
        <button
          type="button"
          onClick={() => {
            if (isMobileDrawer) close();
            openProfileModal();
          }}
          className="w-full flex items-center gap-3 p-2 rounded-xl bg-[#0B2C1D] hover:bg-[#113B28] border border-[#164931] hover:border-emerald-500/40 transition-all text-left cursor-pointer group shadow-sm"
          title="Open Operator Profile & Settings"
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 shadow shrink-0 group-hover:scale-105 transition-transform ${
              isSuperadmin
                ? 'bg-purple-600 border-purple-400/60'
                : 'bg-emerald-600 border-emerald-400/60'
            }`}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate group-hover:text-emerald-300 transition-colors">
              {displayName}
            </p>
            <p className="text-[10px] text-emerald-400 truncate">
              {user?.role === 'SUPERADMIN' ? 'Superadmin' : displayLocation}
            </p>
          </div>
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isSuperadmin
                ? 'bg-purple-400 ring-4 ring-purple-400/20'
                : 'bg-emerald-400 ring-4 ring-emerald-400/20'
            }`}
          />
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-[11px] font-medium text-zinc-400 hover:text-red-400 hover:bg-[#0A2619] transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out Station</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Persistent Sidebar */}
      <aside className="hidden md:flex md:w-60 md:h-screen md:sticky md:top-0 bg-[#092619] shrink-0 z-30">
        {renderNavContent(false)}
      </aside>

      {/* 2. Mobile Responsive Drawer & Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-xs md:hidden animate-fade-in"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 h-full shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {renderNavContent(true)}
      </div>
    </>
  );
}
