'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Users,
  Plus,
  Calendar,
  Search,
  Download,
  FileText,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  X,
  Wallet,
  ArrowRight,
  TrendingDown,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { dataService } from '@/lib/services/dataService';
import { BrilinkPeriod, CustomerFundEntry } from '@/lib/types/database';
import { formatRupiah, parseRupiahInput } from '@/lib/utils/currency';
import { formatDateID, MONTH_NAMES_ID } from '@/lib/utils/date';
import { exportCustomerFundsToExcel } from '@/lib/utils/exportExcel';
import { exportCustomerFundsToPdf } from '@/lib/utils/exportPdf';

function UangNasabahContent() {
  const searchParams = useSearchParams();
  const initialDateParam = searchParams.get('date') || '';

  const [periods, setPeriods] = useState<BrilinkPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [funds, setFunds] = useState<CustomerFundEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedDate, setSelectedDate] = useState<string>(initialDateParam);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDailyBreakdown, setShowDailyBreakdown] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFund, setEditingFund] = useState<CustomerFundEntry | null>(null);

  // Form Fields
  const [formDate, setFormDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [formCustomerName, setFormCustomerName] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formAmountStr, setFormAmountStr] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete Confirm Modal
  const [deleteConfirm, setDeleteConfirm] = useState<CustomerFundEntry | null>(null);

  // Notification
  const [successMsg, setSuccessMsg] = useState('');

  const notify = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Load Periods
  const loadPeriods = async () => {
    try {
      const p = await dataService.getBrilinkPeriods();
      setPeriods(p);
      if (p.length > 0) {
        // If initialDateParam is provided, try to match period
        if (initialDateParam) {
          const [yStr, mStr] = initialDateParam.split('-');
          const matchPeriod = p.find(
            (per) => per.year === parseInt(yStr, 10) && per.month === parseInt(mStr, 10)
          );
          if (matchPeriod) {
            setSelectedPeriodId(matchPeriod.id);
            return;
          }
        }
        setSelectedPeriodId(p[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Load Funds
  const loadFunds = async () => {
    try {
      setLoading(true);
      const data = await dataService.getCustomerFunds();
      setFunds(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPeriods();
    loadFunds();
  }, []);

  const selectedPeriod = useMemo(() => {
    return periods.find((p) => p.id === selectedPeriodId);
  }, [periods, selectedPeriodId]);

  // Filtered funds according to period, selectedDate, and search
  const filteredFunds = useMemo(() => {
    if (!selectedPeriod) return [];
    return funds.filter((f) => {
      const parts = f.entry_date.split('-');
      if (parts.length < 3) return false;
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);

      // Period match
      if (y !== selectedPeriod.year || m !== selectedPeriod.month) {
        return false;
      }

      // Specific Date match
      if (selectedDate && f.entry_date !== selectedDate) {
        return false;
      }

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = f.customer_name.toLowerCase().includes(q);
        const matchNotes = f.notes?.toLowerCase().includes(q) || false;
        if (!matchName && !matchNotes) return false;
      }

      return true;
    });
  }, [funds, selectedPeriod, selectedDate, searchQuery]);

  // All funds in the selected period (regardless of specific date filter)
  const periodAllFunds = useMemo(() => {
    if (!selectedPeriod) return [];
    return funds.filter((f) => {
      const parts = f.entry_date.split('-');
      if (parts.length < 3) return false;
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      return y === selectedPeriod.year && m === selectedPeriod.month;
    });
  }, [funds, selectedPeriod]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const targetDateForToday = selectedDate || todayStr;

    // Total for today / selected date
    const totalDate = periodAllFunds
      .filter((f) => f.entry_date === targetDateForToday)
      .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

    // Total for the whole month
    const totalMonth = periodAllFunds.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

    // Count of recorded customers
    const countRecorded = filteredFunds.length;

    return {
      totalDate,
      totalMonth,
      countRecorded,
      targetDateLabel: selectedDate ? formatDateID(selectedDate, false) : 'Hari Ini (' + formatDateID(todayStr, false) + ')',
    };
  }, [periodAllFunds, filteredFunds, selectedDate]);

  // Daily breakdown (rekapitulasi per tanggal)
  const dailyBreakdown = useMemo(() => {
    const map = new Map<string, { total: number; count: number; date: string }>();
    periodAllFunds.forEach((f) => {
      const existing = map.get(f.entry_date) || { total: 0, count: 0, date: f.entry_date };
      existing.total += Number(f.amount) || 0;
      existing.count += 1;
      map.set(f.entry_date, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [periodAllFunds]);

  // Modal Handlers
  const handleOpenAddModal = () => {
    setEditingFund(null);
    setFormDate(selectedDate || new Date().toISOString().split('T')[0]);
    setFormCustomerName('');
    setFormNotes('');
    setFormAmountStr('');
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (fund: CustomerFundEntry) => {
    setEditingFund(fund);
    setFormDate(fund.entry_date);
    setFormCustomerName(fund.customer_name);
    setFormNotes(fund.notes || '');
    setFormAmountStr(fund.amount.toString());
    setFormError('');
    setModalOpen(true);
  };

  const handleSaveFund = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formDate) {
      setFormError('Tanggal transaksi wajib diisi.');
      return;
    }

    if (!formCustomerName.trim()) {
      setFormError('Nama nasabah wajib diisi.');
      return;
    }

    const numAmount = parseRupiahInput(formAmountStr);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError('Nominal uang nasabah harus lebih dari Rp 0.');
      return;
    }

    try {
      setSaving(true);
      if (editingFund) {
        await dataService.updateCustomerFund(editingFund.id, {
          entry_date: formDate,
          customer_name: formCustomerName.trim(),
          notes: formNotes.trim(),
          amount: numAmount,
        });
        notify(`Data uang nasabah atas nama "${formCustomerName.trim()}" berhasil diperbarui.`);
      } else {
        await dataService.createCustomerFund({
          entry_date: formDate,
          customer_name: formCustomerName.trim(),
          notes: formNotes.trim(),
          amount: numAmount,
        });
        notify(`Uang nasabah Rp ${formatRupiah(numAmount)} atas nama "${formCustomerName.trim()}" berhasil dicatat dan disinkronkan ke Laporan Transaksi.`);
      }

      setModalOpen(false);
      loadFunds();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan data uang nasabah.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFund = async () => {
    if (!deleteConfirm) return;
    try {
      await dataService.deleteCustomerFund(deleteConfirm.id);
      notify(`Catatan uang nasabah "${deleteConfirm.customer_name}" berhasil dihapus.`);
      setDeleteConfirm(null);
      loadFunds();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus catatan uang nasabah.');
      setDeleteConfirm(null);
    }
  };

  // Export handlers
  const handleExportExcel = () => {
    if (!selectedPeriod) return;
    exportCustomerFundsToExcel(filteredFunds, selectedPeriod.month, selectedPeriod.year, selectedDate);
  };

  const handleExportPdf = () => {
    if (!selectedPeriod) return;
    exportCustomerFundsToPdf(filteredFunds, selectedPeriod.month, selectedPeriod.year, selectedDate);
  };

  const totalFilteredNominal = filteredFunds.reduce(
    (sum, f) => sum + (Number(f.amount) || 0),
    0
  );

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header & Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-rose-800 bg-rose-50 px-3 py-1 rounded-full w-fit border border-rose-200">
            <Users className="w-3.5 h-3.5 text-rose-600" />
            <span>BRILink &bull; Sub-Menu Uang Nasabah</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">
            Daftar & Rekapitulasi Uang Nasabah
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Catatan titipan uang nasabah, penarikan tertunda, serta sinkronisasi otomatis ke kolom Uang Nasabah transaksi harian.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExcel}
            disabled={filteredFunds.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-xs disabled:opacity-50 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Ekspor Excel</span>
          </button>

          <button
            onClick={handleExportPdf}
            disabled={filteredFunds.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-xs disabled:opacity-50 transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            <span>Ekspor PDF</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Catat Uang Nasabah</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Hari Ini / Tanggal Terpilih */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {selectedDate ? 'Total Tanggal Terpilih' : 'Total Hari Ini'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-700">
            {formatRupiah(summaryMetrics.totalDate)}
          </div>
          <p className="text-[11px] text-slate-400 truncate">
            {summaryMetrics.targetDateLabel}
          </p>
        </div>

        {/* Card 2: Periode Bulan Ini */}
        <div className="bg-gradient-to-tr from-rose-900 to-rose-950 p-5 rounded-2xl text-white shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-200 uppercase tracking-wider">
              Akumulasi Bulan Ini
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-800/80 text-rose-300 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            {formatRupiah(summaryMetrics.totalMonth)}
          </div>
          <p className="text-[11px] text-rose-300 truncate">
            Periode {selectedPeriod ? `${MONTH_NAMES_ID[selectedPeriod.month - 1]} ${selectedPeriod.year}` : '-'}
          </p>
        </div>

        {/* Card 3: Jumlah Nasabah Tercatat */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Nasabah Tercatat
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-800">
            {summaryMetrics.countRecorded} <span className="text-sm font-semibold text-slate-500">Catatan</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {selectedDate ? 'Pada tanggal terpilih' : 'Sesuai filter pencarian aktif'}
          </p>
        </div>
      </div>

      {/* Filter Bar: Periode, Tanggal Harian, & Pencarian */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center gap-3 justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Pilih Periode Bulan */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Bulan:</span>
            <select
              value={selectedPeriodId}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 outline-none focus:border-rose-500"
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {MONTH_NAMES_ID[p.month - 1]} {p.year}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Tanggal Harian */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Tanggal:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 outline-none focus:border-rose-500"
            />
            {selectedDate && (
              <button
                type="button"
                onClick={() => setSelectedDate('')}
                className="text-xs text-rose-600 hover:text-rose-700 font-bold underline"
              >
                Tampilkan Semua Hari
              </button>
            )}
          </div>
        </div>

        {/* Pencarian Nama Nasabah */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari nama nasabah / keperluan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-rose-500 bg-slate-50/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Section Rekapitulasi Per Tanggal (Collapsible) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowDailyBreakdown(!showDailyBreakdown)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-rose-600" />
            <span className="text-xs font-bold text-slate-900">
              Lihat Rekapitulasi Total Uang Nasabah Per Tanggal ({dailyBreakdown.length} Hari Aktif)
            </span>
          </div>
          {showDailyBreakdown ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showDailyBreakdown && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 animate-in fade-in">
            {dailyBreakdown.length > 0 ? (
              dailyBreakdown.map((d) => (
                <div
                  key={d.date}
                  onClick={() => setSelectedDate(d.date)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedDate === d.date
                      ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-rose-200 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                    <span>{formatDateID(d.date, true)}</span>
                    <span className="text-[10px] text-slate-400">{d.count} Titipan</span>
                  </div>
                  <div className="text-sm font-black text-rose-700 mt-1">
                    {formatRupiah(d.total)}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 col-span-full text-center py-3">
                Belum ada data uang nasabah pada periode ini.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Main Table: Daftar Uang Nasabah */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4 w-44">Hari / Tanggal</th>
                <th className="py-3.5 px-4 w-56">Nama Nasabah</th>
                <th className="py-3.5 px-4">Keterangan / Keperluan</th>
                <th className="py-3.5 px-4 w-44 text-right">Nominal (Rp)</th>
                <th className="py-3.5 px-4 w-28 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Memuat data uang nasabah...</span>
                  </td>
                </tr>
              ) : filteredFunds.length > 0 ? (
                filteredFunds.map((f, idx) => (
                  <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-center text-slate-400 font-semibold">{idx + 1}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 whitespace-nowrap">
                      {formatDateID(f.entry_date, true)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{f.customer_name}</td>
                    <td className="py-3.5 px-4 text-slate-600">{f.notes || '-'}</td>
                    <td className="py-3.5 px-4 text-right font-black text-rose-700 whitespace-nowrap">
                      {formatRupiah(f.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(f)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit Catatan"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(f)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Hapus Catatan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 space-y-2">
                    <p className="font-medium">
                      Tidak ada catatan uang nasabah yang cocok dengan filter.
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenAddModal}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Catat Uang Nasabah Pertama</span>
                    </button>
                  </td>
                </tr>
              )}
            </tbody>

            {/* Bottom Grand Total Row */}
            {filteredFunds.length > 0 && (
              <tfoot className="bg-slate-100/90 border-t-2 border-slate-300 font-bold text-xs text-slate-800">
                <tr>
                  <td colSpan={4} className="py-4 px-4 text-right uppercase tracking-wider text-slate-600">
                    TOTAL UANG NASABAH TERFILTER:
                  </td>
                  <td className="py-4 px-4 text-right font-black text-rose-800 text-sm whitespace-nowrap">
                    {formatRupiah(totalFilteredNominal)}
                  </td>
                  <td className="py-4 px-4 text-center text-[11px] text-slate-500">
                    {filteredFunds.length} Nasabah
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Modal Tambah / Edit Uang Nasabah */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {editingFund ? 'Edit Catatan Uang Nasabah' : 'Catat Uang Nasabah Baru'}
                </h3>
                <p className="text-xs text-slate-500">
                  Data otomatis tersinkron ke kolom Uang Nasabah di Laporan Transaksi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveFund} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Tanggal Titipan / Transaksi *</label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-rose-500 bg-slate-50/50"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nama Nasabah *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bpk. Hendra Wijaya"
                  value={formCustomerName}
                  onChange={(e) => setFormCustomerName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nominal Uang Nasabah (Rp) *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 1.500.000"
                  value={formAmountStr}
                  onChange={(e) => setFormAmountStr(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-black text-rose-700 outline-none focus:border-rose-500"
                />
                <span className="text-[10px] text-slate-400">
                  Terbaca: {formatRupiah(parseRupiahInput(formAmountStr) || 0)}
                </span>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Keterangan / Keperluan (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: Titipan transfer rekening BRI, Tarik tunai belum diambil, dll."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Simpan & Sinkronkan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-start gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Hapus Catatan Uang Nasabah?</h3>
                <p className="text-xs text-slate-500">
                  Data nasabah <strong>{deleteConfirm.customer_name}</strong> sebesar{' '}
                  <strong>{formatRupiah(deleteConfirm.amount)}</strong> pada tanggal{' '}
                  {formatDateID(deleteConfirm.entry_date, false)} akan dihapus.
                </p>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
              ?? Nilai Uang Nasabah pada Laporan Transaksi tanggal {formatDateID(deleteConfirm.entry_date, false)} akan otomatis berkurang dan pendapatan hari ini dihitung ulang.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteFund}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20"
              >
                Ya, Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UangNasabahPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Memuat Uang Nasabah...</div>}>
      <UangNasabahContent />
    </Suspense>
  );
}
