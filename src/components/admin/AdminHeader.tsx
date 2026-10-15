'use client';

import React from 'react';
import { Menu, Bell, Shield, User } from 'lucide-react';

export default function AdminHeader({
  onToggleSidebar,
}: {
  onToggleSidebar: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-sm font-bold text-slate-800">Sistem Manajemen V_R Store</h2>
          <p className="text-[11px] text-slate-500 hidden sm:block">
            Administrasi Toko & Pembukuan Transaksi Keuangan BRILink
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Status Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Sistem Aktif (WITA)</span>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            VR
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-slate-800">Owner V_R Store</div>
            <div className="text-[10px] text-slate-500 flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-600" />
              <span>Akses Administrator</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
