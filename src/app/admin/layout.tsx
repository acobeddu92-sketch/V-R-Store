'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/Sidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { createClient } from '@/lib/supabase/client';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createClient();
        if (supabase) {
          const { data } = await supabase.auth.getSession();
          if (!data.session) {
            // Cek fallback session storage jika local test
            const localAuth = typeof window !== 'undefined' ? sessionStorage.getItem('vr_store_auth') : null;
            if (!localAuth) {
              router.push('/login');
              return;
            }
          }
        } else {
          // Fallback lokal: cek apakah user sudah login melalui portal login
          const localAuth = typeof window !== 'undefined' ? sessionStorage.getItem('vr_store_auth') : null;
          if (!localAuth) {
            router.push('/login');
            return;
          }
        }
      } catch (e) {
        console.error('Auth verification error', e);
      } finally {
        setAuthChecked(true);
      }
    }

    checkAuth();
  }, [router]);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-emerald-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold tracking-wider text-slate-300">
            Memeriksa Hak Akses Owner...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Sidebar Navigasi */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        <AdminHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
