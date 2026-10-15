'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Lock, User, Eye, EyeOff, AlertCircle, ArrowRight, ShieldCheck, Key } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setErrorMessage('Harap masukkan Username/Email dan Password.');
      return;
    }

    setLoading(true);

    try {
      // 1. Cek kredensial demo / lokal yang diminta secara instan
      if (
        (cleanUser === 'owner' && cleanPass === '12345') ||
        (cleanUser === 'admin' && cleanPass === '12345') ||
        (cleanUser === 'owner@vrstore.com' && (cleanPass === '12345' || cleanPass === 'vrstore123'))
      ) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('vr_store_auth', JSON.stringify({ user: cleanUser, role: 'owner' }));
        }
        router.push('/admin');
        return;
      }

      // 2. Cek apakah ada koneksi Supabase Auth aktif
      const supabase = createClient();
      if (supabase && cleanUser.includes('@')) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanUser,
          password: cleanPass,
        });

        if (error) {
          setErrorMessage('Email atau password tidak sesuai.');
          setLoading(false);
          return;
        }

        if (data.session) {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('vr_store_auth', JSON.stringify({ email: data.session.user.email, role: 'owner' }));
          }
          router.push('/admin');
          return;
        }
      }

      setErrorMessage('Kredensial salah. Gunakan Username: owner dan Password: 12345 untuk demo.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-600/20">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Portal Masuk Owner
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Sistem Manajemen Inventaris Toko & Pembukuan BRILink
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="flex items-center gap-2 text-xs text-blue-900 bg-blue-50 border border-blue-200 p-3 rounded-xl font-medium">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Halaman ini khusus untuk Pengelola / Owner V_R Store.</span>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="flex items-start gap-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 p-3.5 rounded-xl animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
            <span className="leading-relaxed font-semibold">{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Username / Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Username atau Email Owner
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Masukkan username atau email..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm outline-none transition-all placeholder:text-slate-400 font-medium"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan kata sandi..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm outline-none transition-all placeholder:text-slate-400 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Memverifikasi...</span>
              </div>
            ) : (
              <>
                <span>Masuk ke Dashboard Owner</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Kotak Informasi Kredensial Demo yang Disediakan */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <Key className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Kredensial Akses Uji Coba (Demo):</span>
          </div>
          <div className="pl-6 space-y-0.5 font-mono text-[11px] text-amber-900">
            <div>Username: <strong className="text-slate-900 bg-white px-1.5 py-0.5 rounded border border-amber-300">owner</strong></div>
            <div>Password: <strong className="text-slate-900 bg-white px-1.5 py-0.5 rounded border border-amber-300">12345</strong></div>
          </div>
          <p className="text-[10px] text-amber-700 pt-1">
            *Dapat langsung digunakan untuk menguji seluruh fitur manajemen toko.
          </p>
        </div>
      </div>
    </div>
  );
}
