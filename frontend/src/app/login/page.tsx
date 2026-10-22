'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Droplets,
  Sun,
  User,
  MapPin,
  Phone,
  UserPlus,
  LogIn,
  KeyRound,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiService } from '@/services/api';

export default function LoginPage() {
  const router = useRouter();
  const { login, register } = useAuth();

  const [mode, setMode] = useState<'signin' | 'register' | 'forgot'>('signin');

  // Sign In State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);

  // Register State
  const [fullName, setFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [location, setLocation] = useState('Primary Farm Station');
  const [phone, setPhone] = useState('');

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    const cleanIdentifier = identifier.trim();
    const cleanPassword = password.trim();

    if (!cleanIdentifier || !cleanPassword) {
      setError('Please enter your operator email/username and password.');
      return;
    }

    setLoading(true);
    try {
      const user = await login(cleanIdentifier, cleanPassword);
      if (user.role === 'SUPERADMIN' || user.is_superuser) {
        router.push('/users');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(
        err.message || 'Invalid credentials. Access restricted to authorized database users.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    const cleanEmail = regEmail.trim().toLowerCase();
    const cleanPassword = regPassword.trim();
    const cleanName = fullName.trim();

    if (!cleanEmail || !cleanPassword) {
      setError('Please provide email and password for registration.');
      return;
    }

    if (cleanPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await register({
        email: cleanEmail,
        password: cleanPassword,
        full_name: cleanName,
        location: location.trim(),
        phone: phone.trim(),
      });
      setNotice(
        'Account registered successfully! An email alert has been sent to the Superadmin to assign your role.'
      );
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    const cleanEmail = forgotEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your operator email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiService.forgotPassword(cleanEmail);
      setForgotSuccess(res.message || `Password reset link dispatched to ${cleanEmail}.`);
    } catch (err: any) {
      setError(err.message || 'Could not send reset link. Verify email address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 w-screen h-screen bg-[#FAF9F5] overflow-hidden flex flex-col lg:flex-row">
      {/* Left Side: Agrivoltaics Image + Value Proposition */}
      <div className="relative hidden lg:flex lg:w-[46%] xl:w-[44%] shrink-0 flex-col justify-between p-7 xl:p-9 text-white bg-zinc-950 overflow-hidden h-full select-none">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center brightness-[0.62] saturate-[1.1] scale-105 transform"
          style={{ backgroundImage: "url('/agrivoltaics_farm.jpg')" }}
        />
        {/* Dark Emerald Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#05170F] via-[#092619]/70 to-black/45" />

        {/* Top Brand Logo */}
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

        {/* Headline & Highlights */}
        <div className="relative z-10 max-w-md space-y-3.5 my-auto py-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-semibold backdrop-blur-sm">
            <Zap className="w-3.5 h-3.5" />
            <span>Track 6: Climate & Sustainability</span>
          </div>

          <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight">
            Smarter Irrigation. <br />
            <span className="text-emerald-400">Sustainable Future.</span>
          </h1>

          <p className="text-xs text-zinc-300/90 leading-relaxed">
            Synchronizing crop water requirements with hourly NASA POWER solar forecasts and local tariffs to minimize costly grid electricity import.
          </p>

          <div className="space-y-2 text-xs text-zinc-200/90 pt-1">
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Sun className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span>NASA POWER solar optimization & grid electricity cost reduction</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Droplets className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span>Zero-water-deficit guarantee with strict physical pump limits</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span>Automated email dispatches for access requests & password resets</span>
            </div>
          </div>
        </div>

        {/* Bottom Location & Hackathon Tag */}
        <div className="relative z-10 pt-3 flex flex-wrap items-center justify-between text-[11px] text-zinc-300/80 gap-2 border-t border-white/10">
          <span>Universal Solar-Powered Agri-Tech Platform</span>
          <span className="text-emerald-400/90 font-medium">Qiskit Fall Fest 2026</span>
        </div>
      </div>

      {/* Right Side: Clean Centered Login & Registration Card (Fits 100% inside viewport) */}
      <div className="w-full lg:w-[54%] xl:w-[56%] h-full flex items-center justify-center p-4 sm:p-6 bg-[#F7F6F0] overflow-hidden">
        <div className="w-full max-w-[420px] bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#E6E4DC] shadow-[0_4px_24px_rgba(0,0,0,0.06)] space-y-4 my-auto">
          {/* Header */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-[#092619] text-emerald-400 mb-0.5 shadow-sm">
              {mode === 'forgot' ? (
                <KeyRound className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#111827] tracking-tight">
              {mode === 'signin'
                ? 'Field Station Sign-In'
                : mode === 'register'
                ? 'Request Station Access'
                : 'Reset Station Password'}
            </h2>
            <p className="text-[11px] sm:text-xs text-[#6B7280]">
              {mode === 'signin'
                ? 'Sign in with your database credentials to access the control room.'
                : mode === 'register'
                ? 'Register your operator profile. The Superadmin will receive an email alert.'
                : 'Enter your email. A secure reset link will be sent to your inbox.'}
            </p>
          </div>

          {/* Mode Switch Tabs (Hidden when in Forgot mode) */}
          {mode !== 'forgot' && (
            <div className="flex bg-[#FAF9F5] p-1 rounded-xl border border-[#E6E4DC]">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                  setNotice(null);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-white text-[#111827] shadow-xs border border-[#E6E4DC]'
                    : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                  setNotice(null);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'register'
                    ? 'bg-white text-[#111827] shadow-xs border border-[#E6E4DC]'
                    : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Request Access
              </button>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-800 animate-in fade-in">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
              <span className="leading-tight text-[11px]">{error}</span>
            </div>
          )}

          {/* Notice Banner */}
          {notice && !error && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="text-[11px] leading-tight">{notice}</span>
            </div>
          )}

          {/* 1. Sign In Form */}
          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#374151] block mb-1">
                  Operator Email or Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      setError(null);
                    }}
                    className="w-full bg-[#FAF9F5] border border-[#E6E4DC] rounded-xl px-3 py-2 text-xs text-[#111827] focus:outline-none focus:border-emerald-600 pl-9 transition-colors"
                    placeholder="admin@qirrigate.farm or superadmin"
                    required
                  />
                  <Mail className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#374151] block mb-1">
                  Station Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    className="w-full bg-[#FAF9F5] border border-[#E6E4DC] rounded-xl px-3 py-2 text-xs text-[#111827] focus:outline-none focus:border-emerald-600 pl-9 transition-colors"
                    placeholder="Enter account password"
                    required
                  />
                  <Lock className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-2.5" />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-1.5 text-[#4B5563] cursor-pointer select-none text-[11px]">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 border-[#D5D3CA] w-3.5 h-3.5"
                  />
                  <span>Remember terminal</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setForgotEmail(identifier.includes('@') ? identifier : '');
                    setError(null);
                    setNotice(null);
                    setForgotSuccess(null);
                  }}
                  className="font-semibold text-emerald-800 hover:underline cursor-pointer text-[11px]"
                >
                  Forgot password?
                </button>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#0E3A27] hover:bg-[#072418] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? 'Authenticating...' : 'Sign In to Station Control Room'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* 2. Register Form */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-[#374151] block mb-0.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-[#FAF9F5] border border-[#E6E4DC] rounded-xl px-2.5 py-1.5 text-xs text-[#111827] focus:outline-none focus:border-emerald-600 pl-8"
                      placeholder="e.g. Ramesh Patel"
                      required
                    />
                    <User className="w-3 h-3 text-[#9CA3AF] absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#374151] block mb-0.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full bg-[#FAF9F5] border border-[#E6E4DC] rounded-xl px-2.5 py-1.5 text-xs text-[#111827] focus:outline-none focus:border-emerald-600 pl-8"
                      placeholder="ramesh@qirrigate.farm"
                      required
                    />
                    <Mail className="w-3 h-3 text-[#9CA3AF] absolute left-2.5 top-2.5" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-[#374151] block mb-0.5">
                    Password (min. 6)
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full bg-[#FAF9F5] border border-[#E6E4DC] rounded-xl px-2.5 py-1.5 text-xs text-[#111827] focus:outline-none focus:border-emerald-600 pl-8"
                      placeholder="Create password"
                      required
                    />
                    <Lock className="w-3 h-3 text-[#9CA3AF] absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#374151] block mb-0.5">
                    Field Location
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-[#FAF9F5] border border-[#E6E4DC] rounded-xl px-2.5 py-1.5 text-xs text-[#111827] focus:outline-none focus:border-emerald-600 pl-8"
                      placeholder="e.g. Field Station / Farm Location"
                    />
                    <MapPin className="w-3 h-3 text-[#9CA3AF] absolute left-2.5 top-2.5" />
                  </div>
                </div>
              </div>

              <div className="p-2 bg-amber-50 rounded-xl border border-amber-200 text-[10px] text-amber-900 leading-tight">
                Account is created with <strong>Pending</strong> status. An automated email is dispatched to the Superadmin to assign your role.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#0E3A27] hover:bg-[#072418] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? 'Submitting Request...' : 'Submit Station Access Request'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* 3. Forgot Password Form */}
          {mode === 'forgot' && (
            <div className="space-y-3">
              {forgotSuccess ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Reset Link Dispatched!</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 leading-relaxed">
                    A secure password reset link has been sent to <strong>{forgotEmail}</strong>. Please check your inbox and click the link to change your password.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setForgotSuccess(null);
                    }}
                    className="w-full mt-2 py-2 px-3 rounded-lg bg-[#0E3A27] text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-[#374151] block mb-1">
                      Registered Operator Email
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => {
                          setForgotEmail(e.target.value);
                          setError(null);
                        }}
                        className="w-full bg-[#FAF9F5] border border-[#E6E4DC] rounded-xl px-3 py-2 text-xs text-[#111827] focus:outline-none focus:border-emerald-600 pl-9 transition-colors"
                        placeholder="e.g. operator@qirrigate.farm"
                        required
                      />
                      <Mail className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-2.5" />
                    </div>
                  </div>

                  <p className="text-[10px] text-[#6B7280]">
                    We will send a single-use authorization link to reset your credentials. The link expires in 2 hours.
                  </p>

                  <div className="space-y-2 pt-1">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#0E3A27] hover:bg-[#072418] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {loading ? 'Sending Reset Link...' : 'Send Password Reset Link'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMode('signin');
                        setError(null);
                      }}
                      className="w-full py-2 px-3 rounded-xl text-xs font-medium text-[#4B5563] bg-[#FAF9F5] border border-[#E6E4DC] hover:bg-[#F0EFEA] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back to Sign In
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          <div className="pt-2 border-t border-[#EFECE3] text-center">
            <p className="text-[10px] text-[#9CA3AF] flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-emerald-700" />
              <span>Protected by PostgreSQL database & Google SMTP service</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
