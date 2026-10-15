import React from 'react';
import Link from 'next/link';
import { ShoppingBag, MapPin, Phone, MessageSquare, Clock, ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-14 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Kolom 1: Profil Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="text-2xl font-black text-white tracking-tight">
                V_R<span className="text-emerald-400">.</span>STORE
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Lengkap Kebutuhan Anda, Praktis Pelayanannya! Toko penyedia ATK, percetakan, pulsa, aksesoris, parfum, serta layanan perbankan resmi BRILink.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-lg w-fit">
              <ShieldCheck className="w-4 h-4" />
              <span>Mitra Resmi BRILink Terpercaya</span>
            </div>
          </div>

          {/* Kolom 2: Layanan Kami */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wide uppercase mb-4">Layanan Toko</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>• Alat Tulis Kantor (ATK) & Fotocopy</li>
              <li>• Cetak Dokumen / Print Warna & Hitam-Putih</li>
              <li>• Transaksi Tunai & Transfer BRILink</li>
              <li>• Pulsa, Paket Data, & Token Listrik PLN</li>
              <li>• Top Up E-Wallet (Dana, OVO, ShopeePay, Gopay)</li>
              <li>• Top Up Voucher Game & Aksesoris HP</li>
            </ul>
          </div>

          {/* Kolom 3: Kontak & Jam Operasional */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wide uppercase mb-4">Jam & Kontak</h4>
            <div className="space-y-3 text-sm text-slate-400">
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <span>Buka Setiap Hari: 07:30 - 22:00 WITA</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <span>0812-3456-7890</span>
              </div>
              <div className="flex items-start gap-2.5">
                <MessageSquare className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <span>WhatsApp: +62 812-3456-7890</span>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <span>Pusat Toko V_R Store, Sulawesi</span>
              </div>
            </div>
          </div>

          {/* Kolom 4: Navigasi Cepat */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wide uppercase mb-4">Menu Pintas</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link href="/" className="hover:text-emerald-400 transition-colors">
                  Dashboard Pelanggan
                </Link>
              </li>
              <li>
                <Link href="/barang" className="hover:text-emerald-400 transition-colors">
                  Katalog Semua Barang
                </Link>
              </li>
              <li>
                <Link href="/alamat" className="hover:text-emerald-400 transition-colors">
                  Alamat & Google Maps
                </Link>
              </li>
              <li className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  Portal Manajemen Owner
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Hak Cipta */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} V_R Store. Seluruh hak cipta dilindungi undang-undang.</p>
          <p className="text-slate-400">Sistem Katalog Modern & Manajemen Keuangan BRILink</p>
        </div>
      </div>
    </footer>
  );
}
