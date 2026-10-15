'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Menu, X, Store, Package, MapPin, LogIn, Clock } from 'lucide-react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { name: 'Dashboard', href: '/', icon: Store },
    { name: 'Daftar Barang', href: '/barang', icon: Package },
    { name: 'Alamat Toko', href: '/alamat', icon: MapPin },
    { name: 'Login', href: '/login', icon: LogIn },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo Brand: Modern Blue & Amber */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-blue-900">
                  V_R<span className="text-amber-500">.</span>STORE
                </span>
                <span className="hidden sm:inline-block text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  Agen BRILink
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Toko Serba Ada & Layanan Transaksi Keuangan
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    active
                      ? 'bg-blue-50 text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Action: Jam Buka & Mobile Button */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100/90 px-3.5 py-1.5 rounded-full border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>07:30 - 22:00 WITA</span>
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:text-blue-700 hover:bg-slate-100 transition-colors"
              aria-label="Buka Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2 animate-in slide-in-from-top-3">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold transition-colors ${
                  active
                    ? 'bg-blue-50 text-blue-700 font-black'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                {link.name}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between px-2">
            <span>Jam Operasional Toko:</span>
            <span className="font-bold text-blue-700">07:30 - 22:00 WITA</span>
          </div>
        </div>
      )}
    </header>
  );
}
