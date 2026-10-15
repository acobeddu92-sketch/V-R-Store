'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  Boxes,
  AlertTriangle,
  TrendingUp,
  Receipt,
  Coins,
  PieChart as PieIcon,
  ArrowRight,
  PlusCircle,
  FileSpreadsheet,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { dataService } from '@/lib/services/dataService';
import { formatRupiah } from '@/lib/utils/currency';
import { MONTH_NAMES_ID } from '@/lib/utils/date';

export default function AdminDashboardPage() {
  const [activeProductsCount, setActiveProductsCount] = useState<number>(0);
  const [categoriesCount, setCategoriesCount] = useState<number>(0);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0);
  const [monthlyTrxCount, setMonthlyTrxCount] = useState<number>(0);
  const [totalCapital, setTotalCapital] = useState<number>(0);
  const [totalDividends, setTotalDividends] = useState<number>(0);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [prods, cats, periods, capitalEntries, investors, annual] = await Promise.all([
          dataService.getProducts(),
          dataService.getCategories(),
          dataService.getBrilinkPeriods(),
          dataService.getCapitalEntries(),
          dataService.getInvestors(),
          dataService.getAnnualReport(currentYear),
        ]);

        // 1. Produk & Kategori
        const activeProds = prods.filter((p) => p.is_active && !p.is_deleted);
        setActiveProductsCount(activeProds.length);
        setCategoriesCount(cats.filter((c) => c.is_active).length);

        // Produk stok rendah (<= 15 unit)
        const lowStock = activeProds.filter((p) => p.stock <= 15).sort((a, b) => a.stock - b.stock);
        setLowStockProducts(lowStock);

        // 2. Transaksi Bulan Ini
        const activePeriod = periods.find((p) => p.year === currentYear && p.month === currentMonth);
        if (activePeriod) {
          const trxs = await dataService.getDailyTransactions(activePeriod.id);
          const incomeSum = trxs.reduce((sum, t) => sum + (Number(t.daily_income) || 0), 0);
          const countSum = trxs.reduce((sum, t) => sum + (Number(t.transaction_count) || 0), 0);
          setMonthlyIncome(incomeSum);
          setMonthlyTrxCount(countSum);
        } else {
          setMonthlyIncome(0);
          setMonthlyTrxCount(0);
        }

        // 3. Modal Masuk Total
        const capSum = capitalEntries.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
        setTotalCapital(capSum);

        // 4. Komisi Investasi Total
        const divSum = investors.reduce((sum, inv) => sum + (Number(inv.total_commission_earned) || 0), 0);
        setTotalDividends(divSum);

        // 5. Data Grafik Pendapatan 12 Bulan
        const formattedChart = annual.monthly_rows.map((row) => ({
          name: row.month_name.slice(0, 3),
          pendapatan: row.monthly_income,
          modal: row.capital_entered,
        }));
        setChartData(formattedChart);
      } catch (err) {
        console.error('Error loading admin dashboard stats', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [currentYear, currentMonth]);

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner Greeting */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-600/40">
            Pusat Kendali Toko
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Ringkasan Usaha V_R Store
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-xl">
            Pantau pergerakan stok barang dagangan, modal masuk, transaksi harian, dan pembukuan komisi investor secara real-time.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/admin/brilink/transaksi"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Input Transaksi Hari Ini</span>
          </Link>
          <Link
            href="/admin/barang"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all"
          >
            <PlusCircle className="w-4 h-4 text-emerald-300" />
            <span>Tambah Produk</span>
          </Link>
        </div>
      </div>

      {/* Grid 7 Indikator Utama */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* 1. Pendapatan BRILink Bulan Ini */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pendapatan BRILink ({MONTH_NAMES_ID[currentMonth - 1]})
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-emerald-700">
              {formatRupiah(monthlyIncome)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Hasil akumulasi harian periode terpilih
            </p>
          </div>
        </div>

        {/* 2. Jumlah Transaksi Bulan Ini */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Transaksi Bulan Ini
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              {monthlyTrxCount} <span className="text-sm font-normal text-slate-500">transaksi</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Volume operasional BRILink
            </p>
          </div>
        </div>

        {/* 3. Total Modal Masuk */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Modal Masuk
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-amber-700">
              {formatRupiah(totalCapital)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Total akumulasi dana modal tercatat
            </p>
          </div>
        </div>

        {/* 4. Total Komisi Investasi */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Komisi Dividen
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <PieIcon className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-purple-700">
              {formatRupiah(totalDividends)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Hak investor (0.5% per bulan penuh)
            </p>
          </div>
        </div>
      </div>

      {/* Grid Sekunder: Statistik Barang & Grafik */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri (2 Kolom): Grafik Pendapatan Bulanan */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Grafik Tren Pendapatan BRILink Tahun {currentYear}
              </h2>
              <p className="text-xs text-slate-500">
                Perbandingan pendapatan transaksi harian setiap bulan (Januari - Desember)
              </p>
            </div>
            <Link
              href="/admin/brilink/tahunan"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>Laporan Lengkap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  tickFormatter={(val) => `Rp${(val / 1000).toLocaleString('id-ID')}k`}
                />
                <Tooltip
                  formatter={(val: any) => [formatRupiah(val), 'Pendapatan']}
                  labelFormatter={(lbl) => `Bulan ${lbl}`}
                />
                <Area
                  type="monotone"
                  dataKey="pendapatan"
                  stroke="#059669"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorIncome)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Kolom Kanan: Peringatan Stok Rendah & Statistik Toko */}
        <div className="space-y-6">
          {/* Card Info Ringkas Barang */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Inventaris Produk Toko</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                  <Package className="w-4 h-4 text-emerald-600" />
                  <span>Produk Aktif</span>
                </div>
                <div className="text-xl font-bold text-slate-900 mt-1">{activeProductsCount}</div>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                  <Boxes className="w-4 h-4 text-emerald-600" />
                  <span>Kategori</span>
                </div>
                <div className="text-xl font-bold text-slate-900 mt-1">{categoriesCount}</div>
              </div>
            </div>
            <Link
              href="/admin/barang"
              className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all"
            >
              <span>Kelola Daftar Barang</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card Peringatan Stok Menipis */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-4 h-4" />
                <h3 className="text-sm font-bold text-slate-900">Peringatan Stok Rendah</h3>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700">
                {lowStockProducts.length} item
              </span>
            </div>

            {lowStockProducts.length > 0 ? (
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {lowStockProducts.slice(0, 5).map((prod) => (
                  <div
                    key={prod.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  >
                    <div className="truncate mr-2">
                      <div className="font-semibold text-slate-800 truncate">{prod.name}</div>
                      <div className="text-[10px] text-slate-400">{prod.category_name}</div>
                    </div>
                    <span
                      className={`font-black px-2 py-0.5 rounded-md shrink-0 ${
                        prod.stock <= 5 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      Sisa {prod.stock}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-3 text-center bg-slate-50 rounded-xl">
                Seluruh stok barang dalam kondisi aman.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
