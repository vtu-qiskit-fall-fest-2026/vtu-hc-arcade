'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Droplets,
  Calendar,
  BarChart3,
  Sun,
  Info,
  Menu,
  X,
  Atom,
} from 'lucide-react';
import { ApiStatusBadge } from './ApiStatusBadge';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Droplets },
  { href: '/planner', label: 'Irrigation Planner', icon: Calendar },
  { href: '/benchmark', label: 'Quantum Benchmark', icon: BarChart3 },
  { href: '/solar', label: 'Solar Profile', icon: Sun },
  { href: '/about', label: 'About & Math', icon: Info },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Hackathon Badge */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-900/30 group-hover:scale-105 transition-transform">
                <Atom className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                  Q-IRRIGATE
                </span>
                <p className="text-[10px] text-emerald-400/90 font-medium">
                  Autonomous Solar Agri-Tech
                </p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Status Badge & Mobile Hamburger */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <ApiStatusBadge />
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950 px-4 pt-3 pb-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
          <div className="pt-2">
            <ApiStatusBadge />
          </div>
        </div>
      )}
    </header>
  );
}
