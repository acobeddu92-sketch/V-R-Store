'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  CreditCard,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  ShoppingBag,
  ExternalLink,
  Coins,
  FileSpreadsheet,
  PieChart,
  CalendarCheck2,
  X,
  Store,
  Users,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function AdminSidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [brilinkOpen, setBrilinkOpen] = useState(true);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('vr_store_auth');
      }
      router.push('/login');
    } catch (e) {
      console.error('Logout error', e);
      router.push('/login');
    }
  };

  const isBrilinkActive = pathname.startsWith('/admin/brilink');

  return (
    <>
      {/* Backdrop Mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header Brand */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-black text-white tracking-tight">
                V_R<span className="text-amber-400">.</span>STORE
              </div>
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">
                Dashboard Owner
              </p>
            </div>
          </Link>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menus Sesuai Spesifikasi */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
          {/* Dashboard Overview */}
          <Link
            href="/admin"
            onClick={onClose}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              pathname === '/admin'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>

          {/* 1. Atur Barang */}
          <Link
            href="/admin/barang"
            onClick={onClose}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              pathname.startsWith('/admin/barang')
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Atur Barang</span>
          </Link>

          {/* 2. BRILink (Dropdown Menu) */}
          <div className="space-y-1 pt-1">
            <button
              onClick={() => setBrilinkOpen(!brilinkOpen)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                isBrilinkActive ? 'text-blue-400 bg-slate-800 font-bold' : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-amber-400" />
                <span>BRILink</span>
              </div>
              {brilinkOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {/* 4 Sub-Menu BRILink */}
            {brilinkOpen && (
              <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-blue-800/60 ml-4 animate-in slide-in-from-top-2">
                <Link
                  href="/admin/brilink/modal"
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    pathname === '/admin/brilink/modal'
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-600/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span>Modal</span>
                </Link>

                <Link
                  href="/admin/brilink/uang-nasabah"
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    pathname === '/admin/brilink/uang-nasabah'
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-600/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-rose-400" />
                  <span>Uang Nasabah</span>
                </Link>

                <Link
                  href="/admin/brilink/transaksi"
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    pathname === '/admin/brilink/transaksi'
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-600/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
                  <span>Laporan Transaksi</span>
                </Link>

                <Link
                  href="/admin/brilink/dividen"
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    pathname === '/admin/brilink/dividen'
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-600/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <PieChart className="w-3.5 h-3.5 text-purple-400" />
                  <span>Dividen</span>
                </Link>

                <Link
                  href="/admin/brilink/tahunan"
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    pathname === '/admin/brilink/tahunan'
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-600/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <CalendarCheck2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Laporan Tahunan</span>
                </Link>
              </div>
            )}
          </div>

          {/* Pengaturan Toko */}
          <Link
            href="/admin/pengaturan"
            onClick={onClose}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              pathname === '/admin/pengaturan'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Pengaturan Toko</span>
          </Link>
        </div>

        {/* 3. Footer: Lihat Toko & Logout */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-all"
          >
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4" />
              <span>Lihat Toko Publik</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout (Keluar)</span>
          </button>
        </div>
      </aside>
    </>
  );
}
