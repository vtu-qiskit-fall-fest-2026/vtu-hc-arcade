'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { OperatorProfileModal } from '@/components/profile/OperatorProfileModal';
import { Clock, ShieldAlert, RefreshCw, LogOut, UserCheck } from 'lucide-react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, isSuperadmin, isPending, logout, refreshUser } = useAuth();

  const isPublicRoute = pathname === '/login' || pathname === '/reset-password';

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated && !isPublicRoute) {
      router.replace('/login');
    } else if (isAuthenticated && pathname === '/login') {
      router.replace('/');
    } else if (isAuthenticated && pathname === '/users' && !isSuperadmin) {
      // Non-superadmins cannot view user management
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, pathname, router, isSuperadmin, isPending, isPublicRoute]);

  // If on a public route (login / reset-password)
  if (isPublicRoute) {
    if (isAuthenticated && pathname === '/login') {
      return (
        <>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FAF9F5]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-[#4B5563] font-semibold">
                Redirecting to station control room...
              </p>
            </div>
          </div>
          <div className="hidden" aria-hidden="true">
            {children}
          </div>
        </>
      );
    }
    return <>{children}</>;
  }

  // Loading state while checking authentication session
  if (isLoading || !isAuthenticated) {
    return (
      <>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FAF9F5]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-[#4B5563] font-semibold">
              Verifying operator credentials...
            </p>
          </div>
        </div>
        <div className="hidden" aria-hidden="true">
          {children}
        </div>
      </>
    );
  }

  // Authenticated, but role has not been assigned by Superadmin yet
  if (isPending) {
    return (
      <>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F7F6F0] p-4">
          <div className="w-full max-w-md bg-white rounded-3xl border border-[#E6E4DC] p-6 sm:p-8 shadow-xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                <ShieldAlert className="w-3.5 h-3.5" />
                Role Assignment Pending
              </span>
              <h2 className="text-xl font-bold text-[#111827]">
                Welcome, {user?.full_name || user?.username}!
              </h2>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Your account has been registered in the database, but a <strong>Superadmin</strong> must assign your operational role (Field Engineer, Agronomist, or Farmer) before full station access is unlocked.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#EFECE3] text-left text-xs space-y-2">
              <div className="flex justify-between text-[#4B5563]">
                <span className="text-[#6B7280]">Account Email:</span>
                <span className="font-semibold text-[#111827] font-mono">{user?.email}</span>
              </div>
              <div className="flex justify-between text-[#4B5563]">
                <span className="text-[#6B7280]">Location:</span>
                <span className="font-semibold text-[#111827]">{user?.location || 'Primary Farm Station'}</span>
              </div>
              <div className="flex justify-between text-[#4B5563]">
                <span className="text-[#6B7280]">Status:</span>
                <span className="font-bold text-amber-700">Awaiting Superadmin Review</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => refreshUser()}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white bg-[#0E3A27] hover:bg-[#072418] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Check Status
              </button>
              <button
                type="button"
                onClick={logout}
                className="w-full sm:w-auto py-3 px-4 rounded-xl text-xs font-semibold text-[#4B5563] bg-[#FAF9F5] border border-[#E6E4DC] hover:bg-[#F0EFEA] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
        <div className="hidden" aria-hidden="true">
          {children}
        </div>
      </>
    );
  }

  // Fully authenticated and role assigned: render sidebar and dashboard layout
  return (
    <>
      <AppSidebar />
      <div className="flex-1 h-screen overflow-y-auto flex flex-col min-w-0">
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto">
          {children}
        </main>
      </div>
      <OperatorProfileModal />
    </>
  );
}

