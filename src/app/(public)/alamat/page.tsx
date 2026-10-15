'use client';

import React, { useEffect, useState } from 'react';
import { MapPin, Phone, MessageSquare, Clock, Navigation, ExternalLink, ShieldCheck } from 'lucide-react';
import { dataService } from '@/lib/services/dataService';
import { StoreSettings } from '@/lib/types/database';

export default function AlamatTokoPage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await dataService.getStoreSettings();
        setSettings(data);
      } catch (e) {
        console.error('Error loading settings', e);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Lokasi & Kontak
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Alamat Toko & Layanan Pelanggan
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
          Kunjungi toko fisik V_R Store atau hubungi kami langsung untuk layanan cepat, konfirmasi barang, dan transaksi BRILink.
        </p>
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 h-96 animate-pulse" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Card Info Toko */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-5">
              <h2 className="text-2xl font-black text-emerald-800">
                {settings?.store_name || 'V_R Store'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {settings?.tagline || 'Lengkap Kebutuhan Anda, Praktis Pelayanannya!'}
              </p>
            </div>

            <div className="space-y-4">
              {/* Alamat */}
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alamat Lengkap</h4>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5 leading-relaxed">
                    {settings?.address || 'Jl. Poros Utama No. 88, Lingkungan Toko'}
                  </p>
                </div>
              </div>

              {/* Jam Operasional */}
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jam Buka & Operasional</h4>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">
                    {settings?.operational_hours || 'Setiap Hari: 07:30 - 22:00 WITA'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Buka setiap hari termasuk hari libur dan akhir pekan.</p>
                </div>
              </div>

              {/* WhatsApp */}
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0 border border-green-100">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">WhatsApp</h4>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">
                    +{settings?.whatsapp || '6281234567890'}
                  </p>
                </div>
              </div>

              {/* Telepon */}
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Telepon Toko</h4>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">
                    {settings?.phone || '0812-3456-7890'}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <a
                href={`https://wa.me/${settings?.whatsapp || '6281234567890'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Kirim Pesan WhatsApp Langsung</span>
              </a>

              {settings?.maps_url ? (
                <a
                  href={settings.maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm transition-all"
                >
                  <Navigation className="w-4 h-4 text-emerald-600" />
                  <span>Buka di Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
              ) : (
                <div className="text-center text-xs text-slate-400 py-1">
                  *Tautan Google Maps dapat diatur melalui dashboard Pengaturan Toko.
                </div>
              )}
            </div>
          </div>

          {/* Lokasi & Layanan Petunjuk Visual */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-emerald-900 to-teal-900 rounded-3xl p-6 sm:p-8 text-white space-y-5 shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-amber-300">
                <Navigation className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Petunjuk Menuju Lokasi</h3>
              <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
                Toko V_R Store terletak strategis di tepi jalan poros utama, mudah diakses kendaraan roda dua maupun roda empat dengan tempat parkir yang nyaman di depan toko.
              </p>

              <div className="pt-2 border-t border-emerald-700/60 space-y-2 text-xs text-emerald-200">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Melayani setor dan tarik tunai agen resmi BRILink setiap hari</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Layanan fotocopy & cetak print dokumen kilat siap tunggu</span>
                </div>
              </div>
            </div>

            {/* Banner Keamanan & Kenyamanan */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-slate-600 text-xs leading-relaxed space-y-2">
              <span className="font-bold text-slate-900 block">Butuh bantuan mendesak malam hari?</span>
              <p>
                Toko kami buka hingga pukul 22:00 WITA. Jika Anda memerlukan transaksi darurat transfer atau penarikan uang di luar jam toko, Anda dapat menghubungi nomor WhatsApp terlebih dahulu.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
