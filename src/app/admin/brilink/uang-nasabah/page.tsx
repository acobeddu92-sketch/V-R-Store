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
  Trash2,
  CheckCircle,
  AlertCircle,
  X,
  Wallet,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Save,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { dataService } from '@/lib/services/dataService';
import { BrilinkPeriod, CustomerFundEntry } from '@/lib/types/database';
import { formatRupiah } from '@/lib/utils/currency';
import { formatDateID, MONTH_NAMES_ID } from '@/lib/utils/date';
import { exportCustomerFundsToExcel } from '@/lib/utils/exportExcel';
import { exportCustomerFundsToPdf } from '@/lib/utils/exportPdf';

interface CustomerFundRow extends CustomerFundEntry {
  isNew?: boolean;
  isDirty?: boolean;
}

function UangNasabahContent() {
  const searchParams = useSearchParams();
  const initialDateParam = searchParams.get('date') || '';

  const [periods, setPeriods] = useState<BrilinkPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('ALL');
  const [rows, setRows] = useState<CustomerFundRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filters
  const [selectedDate, setSelectedDate] = useState<string>(initialDateParam);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDailyBreakdown, setShowDailyBreakdown] = useState(false);

  // Notifications & Alerts
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Delete Confirm Modal
  const [deleteConfirm, setDeleteConfirm] = useState<CustomerFundRow | null>(null);

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
        // Default to ALL agar semua data tetap dapat dilihat meskipun periode spesifik belum dibuat
        setSelectedPeriodId('ALL');
      } else {
        setSelectedPeriodId('ALL');
      }
    } catch (e: any) {
      console.error('Gagal memuat periode:', e);
    }
  };

  // Load Funds from Supabase
  const loadFunds = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const data = await dataService.getCustomerFunds();
      setRows(
        data.map((item) => ({
          ...item,
          isNew: false,
          isDirty: false,
        }))
      );
    } catch (e: any) {
      console.error('Gagal memuat uang nasabah:', e);
      setErrorMsg(e.message || 'Gagal memuat data uang nasabah dari database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPeriods();
    loadFunds();
  }, []);

  // Dirty count
  const dirtyRows = useMemo(() => {
    return rows.filter((r) => r.isNew || r.isDirty);
  }, [rows]);
  const dirtyCount = dirtyRows.length;

  // Warning when leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirtyCount > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [dirtyCount]);

  const selectedPeriod = useMemo(() => {
    if (selectedPeriodId === 'ALL') return null;
    return periods.find((p) => p.id === selectedPeriodId) || null;
  }, [periods, selectedPeriodId]);

  // Filtered rows for display and Excel-like editing
  const filteredRows = useMemo(() => {
    return rows.filter((f) => {
      // Baris baru yang sedang dikerjakan selalu tampil
      if (f.isNew) return true;

      // Filter periode
      if (selectedPeriodId && selectedPeriodId !== 'ALL' && selectedPeriod) {
        const parts = f.entry_date.split('-');
        if (parts.length >= 2) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10);
          if (y !== selectedPeriod.year || m !== selectedPeriod.month) {
            return false;
          }
        }
      }

      // Filter tanggal spesifik
      if (selectedDate && f.entry_date !== selectedDate) {
        return false;
      }

      // Filter teks pencarian
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = f.customer_name.toLowerCase().includes(q);
        const matchNotes = f.notes?.toLowerCase().includes(q) || false;
        if (!matchName && !matchNotes) return false;
      }

      return true;
    });
  }, [rows, selectedPeriodId, selectedPeriod, selectedDate, searchQuery]);

  // All funds in the selected period (for summary cards)
  const periodAllFunds = useMemo(() => {
    return rows.filter((f) => {
      if (selectedPeriodId === 'ALL' || !selectedPeriod) return true;
      const parts = f.entry_date.split('-');
      if (parts.length >= 2) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        return y === selectedPeriod.year && m === selectedPeriod.month;
      }
      return false;
    });
  }, [rows, selectedPeriodId, selectedPeriod]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const targetDateForToday = selectedDate || todayStr;

    const totalDate = periodAllFunds
      .filter((f) => f.entry_date === targetDateForToday)
      .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

    const totalPeriod = periodAllFunds.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
    const countRecorded = filteredRows.length;

    return {
      totalDate,
      totalPeriod,
      countRecorded,
      targetDateLabel: selectedDate ? formatDateID(selectedDate, false) : 'Hari Ini (' + formatDateID(todayStr, false) + ')',
    };
  }, [periodAllFunds, filteredRows, selectedDate]);

  // Daily breakdown
  const dailyBreakdown = useMemo(() => {
    const map = new Map<string, { total: number; count: number; date: string }>();
    periodAllFunds.forEach((f) => {
      if (!f.entry_date) return;
      const existing = map.get(f.entry_date) || { total: 0, count: 0, date: f.entry_date };
      existing.total += Number(f.amount) || 0;
      existing.count += 1;
      map.set(f.entry_date, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [periodAllFunds]);

  // Cell Change Handler
  const handleCellChange = (id: string, field: keyof CustomerFundEntry, value: any) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        return {
          ...r,
          [field]: value,
          isDirty: true,
        };
      })
    );
  };

  // Add Row Directly in Table (Excel-Style)
  const handleAddRow = () => {
    let defaultDate = selectedDate;
    if (!defaultDate) {
      if (selectedPeriod) {
        const y = selectedPeriod.year;
        const m = selectedPeriod.month < 10 ? `0${selectedPeriod.month}` : selectedPeriod.month;
        const todayIso = new Date().toISOString().split('T')[0];
        defaultDate = todayIso.startsWith(`${y}-${m}`) ? todayIso : `${y}-${m}-01`;
      } else {
        defaultDate = new Date().toISOString().split('T')[0];
      }
    }

    const newRow: CustomerFundRow = {
      id: `draft_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      customer_name: '',
      entry_date: defaultDate,
      amount: 0,
      notes: '',
      isNew: true,
      isDirty: true,
    };

    setRows((prev) => [newRow, ...prev]);
  };

  // Save All Changes to Supabase
  const handleSaveAll = async () => {
    if (saving || dirtyCount === 0) return;

    // Validasi semua baris yang diedit / baru
    for (const r of dirtyRows) {
      if (!r.customer_name || !r.customer_name.trim()) {
        setErrorMsg('Semua baris harus memiliki Nama Nasabah yang jelas.');
        return;
      }
      if (!r.entry_date || r.entry_date.split('-').length < 3) {
        setErrorMsg(`Format tanggal untuk nasabah "${r.customer_name}" tidak valid.`);
        return;
      }
      const numAmount = Number(r.amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        setErrorMsg(`Nominal untuk nasabah "${r.customer_name}" harus lebih besar dari Rp 0.`);
        return;
      }
    }

    setSaving(true);
    setErrorMsg('');

    try {
      let savedCount = 0;
      for (const r of dirtyRows) {
        if (r.isNew) {
          await dataService.createCustomerFund({
            customer_name: r.customer_name.trim(),
            entry_date: r.entry_date,
            amount: Number(r.amount),
            notes: (r.notes || '').trim(),
          });
          savedCount++;
        } else if (r.isDirty) {
          await dataService.updateCustomerFund(r.id, {
            customer_name: r.customer_name.trim(),
            entry_date: r.entry_date,
            amount: Number(r.amount),
            notes: (r.notes || '').trim(),
          });
          savedCount++;
        }
      }

      notify(`Berhasil menyimpan ${savedCount} catatan uang nasabah.`);
      await loadFunds();
    } catch (err: any) {
      console.error('Error saving customer funds:', err);
      setErrorMsg(err.message || 'Gagal menyimpan perubahan ke Supabase.');
    } finally {
      setSaving(false);
    }
  };

  // Discard / Reset Unsaved Changes
  const handleDiscardChanges = async () => {
    if (dirtyCount > 0) {
      const confirmDiscard = window.confirm(
        `Terdapat ${dirtyCount} perubahan belum disimpan. Yakin ingin membatalkan semua perubahan?`
      );
      if (!confirmDiscard) return;
    }
    await loadFunds();
  };

  // Delete Row Handler
  const handleDeleteRow = (row: CustomerFundRow) => {
    if (row.isNew) {
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      return;
    }
    setDeleteConfirm(row);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      setSaving(true);
      setErrorMsg('');
      await dataService.deleteCustomerFund(deleteConfirm.id);
      notify(`Catatan uang nasabah "${deleteConfirm.customer_name}" berhasil dihapus.`);
      setDeleteConfirm(null);
      await loadFunds();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menghapus catatan uang nasabah.');
      setDeleteConfirm(null);
    } finally {
      setSaving(false);
    }
  };

  // Export handlers
  const handleExportExcel = () => {
    const month = selectedPeriod ? selectedPeriod.month : new Date().getMonth() + 1;
    const year = selectedPeriod ? selectedPeriod.year : new Date().getFullYear();
    exportCustomerFundsToExcel(filteredRows, month, year, selectedDate);
  };

  const handleExportPdf = () => {
    const month = selectedPeriod ? selectedPeriod.month : new Date().getMonth() + 1;
    const year = selectedPeriod ? selectedPeriod.year : new Date().getFullYear();
    exportCustomerFundsToPdf(filteredRows, month, year, selectedDate);
  };

  const totalFilteredNominal = filteredRows.reduce(
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
            Input langsung di sel tabel seperti Excel, sinkronisasi otomatis ke Laporan Transaksi Harian, dan tersimpan persisten ke Supabase.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {dirtyCount > 0 && (
            <button
              onClick={handleDiscardChanges}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Batal</span>
            </button>
          )}

          <button
            onClick={handleAddRow}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>+ Tambah Baris</span>
          </button>

          <button
            onClick={handleSaveAll}
            disabled={saving || dirtyCount === 0}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black shadow-md transition-all cursor-pointer ${
              dirtyCount > 0
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30'
                : 'bg-slate-100 text-slate-400 border border-slate-200 shadow-none cursor-not-allowed'
            }`}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>
                  {dirtyCount > 0 ? `Simpan Perubahan (${dirtyCount})` : 'Semua Tersimpan'}
                </span>
              </>
            )}
          </button>

          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

          <button
            onClick={handleExportExcel}
            disabled={filteredRows.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-xs disabled:opacity-50 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Excel</span>
          </button>

          <button
            onClick={handleExportPdf}
            disabled={filteredRows.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-xs disabled:opacity-50 transition-all cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {dirtyCount > 0 && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <span>Terdapat <strong>{dirtyCount}</strong> baris catatan yang belum disimpan ke database.</span>
          </div>
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
          >
            {saving ? 'Menyimpan...' : 'Klik untuk Simpan'}
          </button>
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
              {selectedPeriod ? 'Akumulasi Bulan Ini' : 'Akumulasi Semua Data'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-800/80 text-rose-300 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            {formatRupiah(summaryMetrics.totalPeriod)}
          </div>
          <p className="text-[11px] text-rose-300 truncate">
            {selectedPeriod ? `Periode ${MONTH_NAMES_ID[selectedPeriod.month - 1]} ${selectedPeriod.year}` : 'Semua Periode / Bulan'}
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

      {/* Filter Bar */}
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
              <option value="ALL">Semua Periode / Bulan</option>
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
                className="text-xs text-rose-600 hover:text-rose-700 font-bold underline cursor-pointer"
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

      {/* Main Table: Excel-Style Inline Editable Grid */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Tabel Uang Nasabah (Input Langsung Excel)</span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">&bull; Klik sel untuk mengetik langsung nilai baris</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddRow}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-rose-600" />
              <span>+ Tambah Baris</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-3 w-12 text-center">No</th>
                <th className="py-3.5 px-3 w-40">Tanggal</th>
                <th className="py-3.5 px-3 w-56">Nama Nasabah</th>
                <th className="py-3.5 px-3 w-48 text-right">Nominal (Rp)</th>
                <th className="py-3.5 px-3">Catatan / Keterangan</th>
                <th className="py-3.5 px-3 w-28 text-center">Status / Aksi</th>
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
              ) : filteredRows.length > 0 ? (
                filteredRows.map((r, idx) => {
                  const isDirtyRow = r.isDirty || r.isNew;
                  return (
                    <tr
                      key={r.id}
                      className={`transition-colors ${
                        r.isNew
                          ? 'bg-amber-50/40 hover:bg-amber-50/70'
                          : r.isDirty
                          ? 'bg-blue-50/30 hover:bg-blue-50/60'
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      {/* No */}
                      <td className="py-2.5 px-3 text-center text-slate-400 font-bold">
                        {idx + 1}
                      </td>

                      {/* Tanggal */}
                      <td className="py-2 px-3">
                        <input
                          type="date"
                          value={r.entry_date}
                          onChange={(e) => handleCellChange(r.id, 'entry_date', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white/90 text-xs font-semibold text-slate-800 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                        />
                      </td>

                      {/* Nama Nasabah */}
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          placeholder="Nama nasabah..."
                          value={r.customer_name}
                          onChange={(e) => handleCellChange(r.id, 'customer_name', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white/90 text-xs font-bold text-slate-900 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                        />
                      </td>

                      {/* Nominal (Rp) */}
                      <td className="py-2 px-3 text-right">
                        <div>
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            placeholder="0"
                            value={r.amount || ''}
                            onChange={(e) => handleCellChange(r.id, 'amount', Number(e.target.value) || 0)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white/90 text-xs font-black text-rose-700 text-right outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                          />
                          <div className="text-[10px] text-slate-400 text-right pr-1 pt-0.5">
                            {formatRupiah(r.amount || 0)}
                          </div>
                        </div>
                      </td>

                      {/* Catatan / Keterangan */}
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          placeholder="Catatan keperluan (opsional)..."
                          value={r.notes || ''}
                          onChange={(e) => handleCellChange(r.id, 'notes', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white/90 text-xs text-slate-700 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                        />
                      </td>

                      {/* Status / Aksi */}
                      <td className="py-2 px-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          {r.isNew ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              Baru
                            </span>
                          ) : r.isDirty ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                              Diedit
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-400">
                              Tersimpan
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteRow(r)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus baris"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 space-y-2">
                    <p className="font-medium">
                      Tidak ada catatan uang nasabah yang cocok dengan filter aktif.
                    </p>
                    <button
                      type="button"
                      onClick={handleAddRow}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Tambah Baris Baru</span>
                    </button>
                  </td>
                </tr>
              )}
            </tbody>

            {/* Bottom Total Row */}
            {filteredRows.length > 0 && (
              <tfoot className="bg-slate-100/90 border-t-2 border-slate-300 font-bold text-xs text-slate-800">
                <tr>
                  <td colSpan={3} className="py-4 px-4 text-right uppercase tracking-wider text-slate-600">
                    TOTAL UANG NASABAH TERFILTER:
                  </td>
                  <td className="py-4 px-4 text-right font-black text-rose-800 text-sm whitespace-nowrap">
                    {formatRupiah(totalFilteredNominal)}
                  </td>
                  <td colSpan={2} className="py-4 px-4 text-left text-[11px] text-slate-500">
                    {filteredRows.length} Nasabah Tercatat
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">Hapus Catatan Uang Nasabah?</h3>
              <p className="text-xs text-slate-500">
                Catatan atas nama <strong>{deleteConfirm.customer_name}</strong> tanggal {formatDateID(deleteConfirm.entry_date, true)} senilai{' '}
                <strong>{formatRupiah(deleteConfirm.amount)}</strong> akan dihapus permanen dari Supabase.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-colors cursor-pointer"
              >
                {saving ? 'Menghapus...' : 'Ya, Hapus'}
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
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500 text-xs">
          Memuat halaman uang nasabah...
        </div>
      }
    >
      <UangNasabahContent />
    </Suspense>
  );
}
