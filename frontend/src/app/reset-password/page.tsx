'use client';

import React, { useState, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Lock,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Zap,
  KeyRound,
} from 'lucide-react';
import { apiService } from '@/services/api';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Missing reset token. Please request a new password reset link.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify both fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiService.resetPassword(token, newPassword);
      setSuccess(res.message || 'Password updated successfully!');
      setTimeout(() => {
        router.push('/login');
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Link may be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 w-screen h-screen bg-[#FAF9F5] overflow-hidden flex flex-col lg:flex-row">
      {/* Left Agrivoltaics Banner */}
      <div className="relative hidden lg:flex lg:w-[46%] xl:w-[44%] shrink-0 flex-col justify-between p-7 xl:p-9 text-white bg-zinc-950 overflow-hidden h-full select-none">
        <div
          className="absolute inset-0 bg-cover bg-center brightness-[0.62] saturate-[1.1] scale-105 transform"
          style={{ backgroundImage: "url('/agrivoltaics_farm.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05170F] via-[#092619]/70 to-black/45" />

        {/* Brand */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg border border-emerald-400/40 shrink-0 bg-[#0E3523] flex items-center justify-center">
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
            <span className="text-lg font-bold tracking-tight text-white block leading-tight">
              Q-IRRIGATE
            </span>
            <span className="text-[11px] text-emerald-300 font-medium tracking-wide block">
              Autonomous Solar Agri-Tech Platform
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-md space-y-3.5 my-auto py-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-semibold backdrop-blur-sm">
            <Zap className="w-3.5 h-3.5" />
            <span>Security & Access Authorization</span>
          </div>

          <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight">
            Reset Station <br />
            <span className="text-emerald-400">Credentials</span>
          </h1>

          <p className="text-xs text-zinc-300/90 leading-relaxed">
            Establish a secure station password to restore access to Q-IRRIGATE field telemetry and precision scheduling controls.
          </p>
        </div>

        <div className="relative z-10 pt-3 flex items-center justify-between text-[11px] text-zinc-300/80 border-t border-white/10">
          <span>Universal Solar-Powered Agri-Tech Platform</span>
          <span className="text-emerald-400/90 font-medium">Qiskit Fall Fest 2026</span>
        </div>
      </div>

      {/* Right Reset Form */}
      <div className="w-full lg:w-[54%] xl:w-[56%] h-full flex items-center justify-center p-4 sm:p-6 bg-[#F7F6F0] overflow-hidden">
        <div className="w-full max-w-[420px] bg-white p-6 sm:p-7 rounded-2xl sm:rounded-3xl border border-[#E6E4DC] shadow-[0_4px_24px_rgba(0,0,0,0.06)] space-y-4 my-auto">
          {/* Header */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-[#092619] text-emerald-400 mb-1 shadow-sm">
              <KeyRound className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-[#111827] tracking-tight">
              Create New Password
            </h2>
            <p className="text-xs text-[#6B7280]">
              Enter and confirm your new station credentials below.
            </p>
          </div>

          {/* Token Missing Warning */}
          {!token && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-snug">
              No reset token detected in the URL. Please ensure you clicked the full link sent to your registered email.
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-800 animate-in fade-in">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
              <span className="leading-tight text-[11px]">{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-900 font-medium animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">{success}</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">Redirecting to sign-in screen...</p>
              </div>
            </div>
          )}

          {/* Reset Form */}
          {!success && (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[#374151] block mb-1">
                  New Station Password (min. 6 characters)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setError(null);
                    }}
                    className="w-full bg-[#FAF9F5] border border-[#E6E4DC] rounded-xl px-3 py-2 text-xs text-[#111827] focus:outline-none focus:border-emerald-600 pl-9"
                    placeholder="Enter new password"
                    required
                  />
                  <Lock className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#374151] block mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError(null);
                    }}
                    className="w-full bg-[#FAF9F5] border border-[#E6E4DC] rounded-xl px-3 py-2 text-xs text-[#111827] focus:outline-none focus:border-emerald-600 pl-9"
                    placeholder="Re-enter new password"
                    required
                  />
                  <Lock className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-2.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !token}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#0E3A27] hover:bg-[#072418] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? 'Updating Credentials...' : 'Save New Password & Sign In'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          <div className="pt-2 text-center border-t border-[#EFECE3]">
            <Link
              href="/login"
              className="text-xs font-semibold text-emerald-800 hover:underline"
            >
              Return to Station Sign-In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 flex items-center justify-center bg-[#FAF9F5]">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
