'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Copy,
  Printer,
  CreditCard,
  Smartphone,
  Wallet,
  Gamepad2,
  Headphones,
  Backpack,
  Sparkles,
  Droplets,
  ArrowRight,
  MapPin,
  MessageCircle,
  CheckCircle2,
  ShoppingBag,
} from 'lucide-react';
import { dataService } from '@/lib/services/dataService';
import { Product, StoreSettings } from '@/lib/types/database';
import { formatRupiah } from '@/lib/utils/currency';

export default function CustomerDashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [loadedSettings, loadedProducts] = await Promise.all([
          dataService.getStoreSettings(),
          dataService.getProducts({ onlyActive: true }),
        ]);
        setSettings(loadedSettings);
        setProducts(loadedProducts.slice(0, 6));
      } catch (err) {
        console.error('Failed to load home data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // 11 Layanan Utama Toko V_R Store
  const services = [
    {
      id: 'atk',
      name: 'ATK (Alat Tulis Kantor)',
      desc: 'Buku, pulpen, map, kertas HVS, spidol, dan perlengkapan administrasi kantor.',
      icon: FileText,
      color: 'from-blue-600 to-indigo-700',
    },
    {
      id: 'fotocopy',
      name: 'Fotocopy',
      desc: 'Fotocopy tajam, bersih, cepat, ukuran A4 & F4 hitam-putih dan bolak-balik.',
      icon: Copy,
      color: 'from-sky-500 to-blue-600',
    },
    {
      id: 'print',
      name: 'Print Dokumen & Foto',
      desc: 'Cetak dokumen tugas, skripsi, sertifikat warna atau hitam-putih kualitas tinggi.',
      icon: Printer,
      color: 'from-indigo-600 to-violet-700',
    },
    {
      id: 'brilink',
      name: 'BRILink (Layanan Perbankan)',
      desc: 'Tarik tunai semua bank, setor tunai BRI, transfer, bayar tagihan listrik & BPJS.',
      icon: CreditCard,
      color: 'from-blue-700 to-blue-900',
    },
    {
      id: 'pulsa',
      name: 'Pulsa & Paket Data',
      desc: 'Isi ulang pulsa semua operator, paket data kuota hemat, dan token listrik PLN.',
      icon: Smartphone,
      color: 'from-amber-500 to-orange-600',
    },
    {
      id: 'topup-ewallet',
      name: 'Top Up E-Wallet',
      desc: 'Pengisian saldo Dana, OVO, GoPay, ShopeePay, LinkAja cepat tanpa ribet.',
      icon: Wallet,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      id: 'topup-game',
      name: 'Top Up Game',
      desc: 'Voucher diamond Mobile Legends, Free Fire, PUBG Mobile, Roblox, dan Steam.',
      icon: Gamepad2,
      color: 'from-purple-600 to-indigo-700',
    },
    {
      id: 'aksesoris-hp',
      name: 'Aksesoris HP',
      desc: 'Kabel data fast charge 65W, charger original, headset, tempered glass & pelindung.',
      icon: Headphones,
      color: 'from-cyan-600 to-blue-700',
    },
    {
      id: 'perlengkapan-sekolah',
      name: 'Perlengkapan Sekolah',
      desc: 'Buku gambar, pensil warna, penggaris, kotak pensil, lem kertas, dan gunting.',
      icon: Backpack,
      color: 'from-rose-500 to-pink-600',
    },
    {
      id: 'aksesoris',
      name: 'Aksesoris & Pernik',
      desc: 'Gantungan kunci unik, kuncir rambut, dompet koin, dan pernak-pernik kekinian.',
      icon: Sparkles,
      color: 'from-amber-400 to-orange-500',
    },
    {
      id: 'parfum',
      name: 'Parfum',
      desc: 'Parfum roll-on & spray non alkohol aneka varian aroma segar, wangi dan tahan lama.',
      icon: Droplets,
      color: 'from-fuchsia-600 to-rose-600',
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* HERO SECTION: Biru Modern / Indigo + Aksen Amber */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 text-white pt-16 pb-24 sm:py-24">
        {/* Pattern Background */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-blue-800/60 border border-blue-400/30 text-blue-200 text-xs sm:text-sm font-bold px-4 py-1.5 rounded-full shadow-inner animate-pulse">
            <CreditCard className="w-4 h-4 text-amber-400" />
            <span>Agen Resmi BRILink & Toko Ritel Terlengkap</span>
          </div>

          <div className="space-y-4 max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              Selamat Datang di <span className="text-blue-300 underline decoration-amber-400 decoration-wavy decoration-2">V_R Store</span>
            </h1>
            <p className="text-lg sm:text-2xl font-medium text-blue-100 max-w-3xl mx-auto leading-relaxed">
              &ldquo;Solusi Lengkap Kebutuhan Harian & Transaksi Digital Anda&rdquo;
            </p>
            <p className="text-sm sm:text-base text-blue-200/80 max-w-2xl mx-auto">
              {settings?.description ||
                'Pusat belanja kebutuhan harian, ATK, fotocopy, print kilat, pulsa & token, e-wallet, aksesoris, parfum wangi, serta layanan resmi tarik-setor tunai agen BRILink.'}
            </p>
          </div>

          {/* Action CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/barang"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-base shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all transform hover:-translate-y-0.5"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Lihat Semua Barang</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/alamat"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-blue-800/80 hover:bg-blue-700/90 text-white font-bold text-base border border-blue-400/40 shadow-sm transition-all"
            >
              <MapPin className="w-5 h-5 text-amber-300" />
              <span>Alamat & Kontak Toko</span>
            </Link>
          </div>

          {/* Keunggulan Toko Mini Badge */}
          <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-blue-100 bg-blue-950/60 p-3 rounded-xl border border-blue-800/50">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Harga Ramah & Pasti Pas</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-blue-100 bg-blue-950/60 p-3 rounded-xl border border-blue-800/50">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Pelayanan Cepat & Sigap</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-blue-100 bg-blue-950/60 p-3 rounded-xl border border-blue-800/50">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Mitra BRILink Terpercaya</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-blue-100 bg-blue-950/60 p-3 rounded-xl border border-blue-800/50">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Buka Sampai Malam (22:00)</span>
            </div>
          </div>
        </div>
      </section>

      {/* 11 LAYANAN & USAHA TOKO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-3">
          <div className="inline-block text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Layanan Terpadu
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            11 Layanan & Produk Siap Melayani Anda
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
            Semua kebutuhan harian, tugas sekolah, keperluan kantor, hingga transaksi keuangan digital tersedia lengkap di satu tempat.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {services.map((service, idx) => {
            const Icon = service.icon;
            return (
              <div
                key={service.id}
                className="group relative bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${service.color} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 mb-1">Layanan #{idx + 1}</div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                      {service.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                      {service.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700">
                  <span>Tersedia di Toko</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* PRODUK PILIHAN / UNGGULAN DARI DATABASE */}
      <section className="bg-slate-100/70 py-16 border-y border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                Katalog Produk
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                Preview Produk Unggulan
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Koleksi produk berkualitas yang siap dibeli langsung di etalase V_R Store.
              </p>
            </div>
            <Link
              href="/barang"
              className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-800 bg-white px-5 py-2.5 rounded-xl border border-slate-200 shadow-xs hover:shadow transition-all"
            >
              <span>Lihat Semua Barang</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 h-64 animate-pulse space-y-3">
                  <div className="w-full h-32 bg-slate-200 rounded-xl" />
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-lg hover:border-blue-400 transition-all flex flex-col justify-between group"
                >
                  <div className="relative aspect-square w-full bg-slate-100 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={prod.image_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60'}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/95 text-blue-900 backdrop-blur-sm shadow-xs">
                        {prod.category_name}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 space-y-2">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-blue-700">
                      {prod.name}
                    </h3>
                    <div className="text-blue-700 font-black text-sm sm:text-base">
                      {formatRupiah(prod.price)}
                    </div>
                    {settings?.show_stock_to_public && (
                      <div className="text-[11px] text-slate-500">
                        Stok: <span className="font-bold text-slate-700">{prod.stock} unit</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-500">
              <ShoppingBag className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p className="font-medium text-sm">Belum ada produk aktif yang ditampilkan.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA HUBUNGI KAMI & LOKASI */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl font-black">
              Ada Pertanyaan atau Butuh Transaksi Cepat?
            </h2>
            <p className="text-sm sm:text-base text-blue-100">
              Hubungi layanan toko kami via WhatsApp untuk konfirmasi stok, tanya tarif fotocopy/print, atau layanan transfer BRILink.
            </p>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs sm:text-sm text-blue-200">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>{settings?.address || 'Jl. Poros Utama No. 88'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>{settings?.whatsapp || '6281234567890'}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <a
              href={`https://wa.me/${settings?.whatsapp || '6281234567890'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-md transition-all"
            >
              <MessageCircle className="w-5 h-5 text-slate-950" />
              <span>Hubungi via WhatsApp</span>
            </a>
            <Link
              href="/alamat"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-800/80 hover:bg-blue-700 text-white font-bold border border-blue-400/40 transition-all text-sm"
            >
              <MapPin className="w-4 h-4 text-blue-200" />
              <span>Petunjuk Arah Maps</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
