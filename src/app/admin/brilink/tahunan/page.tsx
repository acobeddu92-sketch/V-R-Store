'use client';

import React, { useState, useEffect } from 'react';
import {
  CalendarCheck2,
  Download,
  FileText,
  TrendingUp,
  Coins,
  PieChart as PieIcon,
  Receipt,
  BarChart3,
  Scale,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { dataService } from '@/lib/services/dataService';
import { AnnualReportSummary } from '@/lib/types/database';
import { formatRupiah } from '@/lib/utils/currency';
import { exportAnnualReportToExcel } from '@/lib/utils/exportExcel';
import { exportAnnualReportToPdf } from '@/lib/utils/exportPdf';

export default function LaporanTahunanPage() {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [report, setReport] = useState<AnnualReportSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      try {
        setLoading(true);
        const data = await dataService.getAnnualReport(selectedYear);
        setReport(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [selectedYear]);

  const handleExportExcel = () => {
    if (!report) return;
    exportAnnualReportToExcel(report.monthly_rows, selectedYear, {
      totalCapital: report.total_capital_entered,
      totalTransactions: report.total_transactions,
      totalCash: report.total_cash,
      totalBrimo: report.total_brimo,
      totalPayfazz: report.total_payfazz,
      totalBrilian: report.total_brilian,
      totalCustomerFunds: report.total_customer_funds,
      totalDebt: report.total_debt_notes,
      totalDailyCapital: report.total_daily_capital,
      totalIncome: report.total_annual_income,
      totalDividend: report.total_dividend_commission,
    });
  };

  const handleExportPdf = () => {
    if (!report) return;
    exportAnnualReportToPdf(report.monthly_rows, selectedYear, {
      totalCapital: report.total_capital_entered,
      totalTransactions: report.total_transactions,
      totalCash: report.total_cash,
      totalBrimo: report.total_brimo,
      totalPayfazz: report.total_payfazz,
      totalBrilian: report.total_brilian,
      totalCustomerFunds: report.total_customer_funds,
      totalDebt: report.total_debt_notes,
      totalDailyCapital: report.total_daily_capital,
      totalIncome: report.total_annual_income,
      totalDividend: report.total_dividend_commission,
    });
  };

  // Data format grafik komparasi
  const chartData = report
    ? report.monthly_rows.map((row) => ({
        bulan: row.month_name.slice(0, 3),
        'Pendapatan Transaksi': row.monthly_income,
        'Komisi Dividen': row.dividend_commission,
        'Pendapatan Bersih': row.net_income,
      }))
    : [];

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-800 bg-blue-50 px-3 py-1 rounded-full w-fit border border-blue-200">
            <CalendarCheck2 className="w-3.5 h-3.5 text-blue-600" />
            <span>BRILink &bull; Sub-Menu Laporan Tahunan</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">
            Laporan Rekapitulasi Tahunan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Tabel rekapitulasi menyeluruh setiap bulan dalam 1 tahun dengan perhitungan pendapatan bersih.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Selector Tahun */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-500 pl-2">Tahun:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="py-1.5 px-3 rounded-lg text-xs font-black text-slate-800 bg-slate-50 border-0 outline-none"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
              <option value={2027}>2027</option>
            </select>
          </div>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-xs transition-all"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Ekspor Excel</span>
          </button>

          <button
            onClick={handleExportPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-xs transition-all"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            <span>Ekspor PDF</span>
          </button>
        </div>
      </div>

      {/* METRIC CARD: PENDAPATAN BERSIH & RINGKASAN */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Pendapatan Bersih */}
        <div className="bg-gradient-to-tr from-blue-900 via-indigo-900 to-blue-950 rounded-3xl p-6 text-white shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
              Total Pendapatan Bersih {selectedYear}
            </span>
            <Scale className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {formatRupiah(report?.total_net_income || 0)}
          </div>
          <p className="text-[11px] text-blue-200">
            Pendapatan Transaksi dikurangi Komisi Investor
          </p>
        </div>

        {/* Total Pendapatan Transaksi */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Pendapatan Transaksi
            </span>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-700">
            {formatRupiah(report?.total_annual_income || 0)}
          </div>
          <p className="text-[11px] text-slate-400">
            Dari {report?.total_transactions || 0} volume transaksi harian
          </p>
        </div>

        {/* Total Komisi Dividen */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Komisi / Dividen Investor
            </span>
            <PieIcon className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-700">
            {formatRupiah(report?.total_dividend_commission || 0)}
          </div>
          <p className="text-[11px] text-slate-400">
            Hak bagi hasil investor (0,5% bulan penuh)
          </p>
        </div>
      </div>

      {/* GRAFIK KOMPARASI TAHUNAN */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Grafik Keuangan Bulanan Tahun {selectedYear}
            </h2>
            <p className="text-xs text-slate-500">
              Perbandingan Pendapatan Transaksi, Komisi Dividen, dan Pendapatan Bersih
            </p>
          </div>
          <BarChart3 className="w-5 h-5 text-blue-600" />
        </div>

        <div className="h-80 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="bulan" stroke="#94a3b8" fontSize={11} />
              <YAxis
                stroke="#94a3b8"
                fontSize={10}
                tickFormatter={(val) => `Rp${(val / 1000).toLocaleString('id-ID')}k`}
              />
              <Tooltip
                formatter={(val: any, name: any) => [formatRupiah(val), name]}
                labelFormatter={(lbl) => `Bulan ${lbl}`}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="Pendapatan Transaksi" fill="#2563eb" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Komisi Dividen" fill="#9333ea" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Pendapatan Bersih" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TABEL LAPORAN TAHUNAN SESUAI SPESIFIKASI */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Tabel Rekapitulasi Pembukuan Tahunan (Tahun {selectedYear})
          </h3>
          <span className="text-[11px] text-slate-400">Format Rupiah Indonesia (Rp)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Bulan / Periode</th>
                <th className="py-3 px-4 text-right text-amber-700">Total Modal (Rp)</th>
                <th className="py-3 px-4 text-center">Total Jumlah Transaksi</th>
                <th className="py-3 px-4 text-right">Total Pendapatan Transaksi (Rp)</th>
                <th className="py-3 px-4 text-right text-purple-700">Total Komisi / Dividen Investor (Rp)</th>
                <th className="py-3 px-4 text-right font-black text-emerald-800 bg-emerald-50/60">
                  Pendapatan Bersih (Rp)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {report?.monthly_rows.map((row, idx) => (
                <tr key={row.month} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{row.month_name}</td>
                  <td className="py-3.5 px-4 text-right font-semibold text-amber-700">
                    {formatRupiah(row.capital_entered)}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                    {row.transaction_count} Trx
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-blue-700">
                    {formatRupiah(row.monthly_income)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-purple-700">
                    {formatRupiah(row.dividend_commission)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-emerald-700 bg-emerald-50/40">
                    {formatRupiah(row.net_income)}
                  </td>
                </tr>
              ))}
            </tbody>

            {/* BARIS GRAND TOTAL TAHUNAN DI BAGIAN PALING BAWAH */}
            {report && (
              <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-xs text-slate-900">
                <tr>
                  <td colSpan={2} className="py-4 px-4 text-center uppercase tracking-wider text-slate-700 font-black">
                    GRAND TOTAL TAHUNAN ({selectedYear}):
                  </td>
                  <td className="py-4 px-4 text-right font-black text-amber-800">
                    {formatRupiah(report.total_capital_entered)}
                  </td>
                  <td className="py-4 px-4 text-center font-black">
                    {report.total_transactions} Trx
                  </td>
                  <td className="py-4 px-4 text-right font-black text-blue-900">
                    {formatRupiah(report.total_annual_income)}
                  </td>
                  <td className="py-4 px-4 text-right font-black text-purple-900">
                    {formatRupiah(report.total_dividend_commission)}
                  </td>
                  <td className="py-4 px-4 text-right font-black text-emerald-900 bg-emerald-100 text-sm">
                    {formatRupiah(report.total_net_income)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
