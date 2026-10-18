'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  FileSpreadsheet,
  Plus,
  Calendar,
  Download,
  FileText,
  Trash2,
  AlertCircle,
  CheckCircle,
  Calculator,
  Users,
  ArrowUpRight,
  X,
  Save,
  RotateCcw,
  Loader2,
  DollarSign,
  Coins,
  Receipt,
} from 'lucide-react';
import { dataService } from '@/lib/services/dataService';
import { BrilinkPeriod, BrilinkDailyTransaction, CustomerFundEntry, DebtItem } from '@/lib/types/database';
import { formatRupiah } from '@/lib/utils/currency';
import { formatDateID, MONTH_NAMES_ID } from '@/lib/utils/date';
import { calculateDailyIncome, parseDebtNotes, formatDebtNotes } from '@/lib/utils/calculations';
import { exportMonthlyTransactionsToExcel } from '@/lib/utils/exportExcel';
import { exportMonthlyTransactionsToPdf } from '@/lib/utils/exportPdf';

interface DailyTransactionRow extends BrilinkDailyTransaction {
  isNew?: boolean;
  isDirty?: boolean;
}

export default function LaporanTransaksiPage() {
  const [periods, setPeriods] = useState<BrilinkPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [rows, setRows] = useState<DailyTransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal Tambah Periode
  const [periodModalOpen, setPeriodModalOpen] = useState(false);
  const [newPeriodMonth, setNewPeriodMonth] = useState(new Date().getMonth() + 1);
  const [newPeriodYear, setNewPeriodYear] = useState(new Date().getFullYear());
  const [periodError, setPeriodError] = useState('');

  // Notifikasi & Error Alert
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Delete Confirm Modal
  const [deleteConfirm, setDeleteConfirm] = useState<DailyTransactionRow | null>(null);

  // Modal Rincian Uang Nasabah (Read-only view)
  const [customerFundModal, setCustomerFundModal] = useState<{
    open: boolean;
    date: string;
    items: CustomerFundEntry[];
    total: number;
    loading: boolean;
  }>({
    open: false,
    date: '',
    items: [],
    total: 0,
    loading: false,
  });

  // Modal Multi-Item Catatan Utang
  const [debtModal, setDebtModal] = useState<{
    open: boolean;
    rowId: string;
    date: string;
    items: DebtItem[];
    generalNote: string;
  }>({
    open: false,
    rowId: '',
    date: '',
    items: [],
    generalNote: '',
  });

  const notify = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Load Periods
  const loadPeriods = async () => {
    try {
      const p = await dataService.getBrilinkPeriods();
      setPeriods(p);
      if (p.length > 0 && !selectedPeriodId) {
        setSelectedPeriodId(p[0].id);
      }
    } catch (e: any) {
      console.error('Gagal memuat periode:', e);
      setErrorMsg(e.message || 'Gagal memuat periode.');
    }
  };

  // Load Transactions for Selected Period
  const loadTransactions = async (periodId: string) => {
    if (!periodId) return;
    try {
      setLoading(true);
      setErrorMsg('');
      const data = await dataService.getDailyTransactions(periodId);
      setRows(
        data.map((t) => {
          const { items: debtItems, generalNote } = parseDebtNotes(t.notes, Number(t.debt_notes) || 0);
          return {
            ...t,
            notes: generalNote,
            debt_items: debtItems,
            isNew: false,
            isDirty: false,
          };
        })
      );
    } catch (e: any) {
      console.error('Gagal memuat transaksi harian:', e);
      setErrorMsg(e.message || 'Gagal memuat transaksi harian dari database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPeriods();
  }, []);

  useEffect(() => {
    if (selectedPeriodId) {
      loadTransactions(selectedPeriodId);
    }
  }, [selectedPeriodId]);

  // Dirty tracking
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
    return periods.find((p) => p.id === selectedPeriodId);
  }, [periods, selectedPeriodId]);

  // Total Rekapitulasi Bawah Tabel (Dihitung Dinamis dari Baris)
  const summaryTotals = useMemo(() => {
    let totalCount = 0;
    let totalCash = 0;
    let totalBrimo = 0;
    let totalPayfazz = 0;
    let totalBrilian = 0;
    let totalCustomerFunds = 0;
    let totalDebt = 0;
    let totalCapital = 0;
    let totalIncome = 0;

    for (const t of rows) {
      totalCount += Number(t.transaction_count) || 0;
      totalCash += Number(t.cash_amount) || 0;
      totalBrimo += Number(t.brimo_balance) || 0;
      totalPayfazz += Number(t.payfazz_balance) || 0;
      totalBrilian += Number(t.brilian_balance) || 0;
      totalCustomerFunds += Number(t.customer_funds) || 0;
      totalDebt += Number(t.debt_notes) || 0;
      totalCapital += Number(t.daily_capital) || 0;
      totalIncome += Number(t.daily_income) || 0;
    }

    return {
      totalCount,
      totalCash,
      totalBrimo,
      totalPayfazz,
      totalBrilian,
      totalCustomerFunds,
      totalDebt,
      totalCapital,
      totalIncome,
    };
  }, [rows]);

  // Handle Cell Value Change (Excel-Style Inline Editing)
  const handleCellChange = (id: string, field: keyof BrilinkDailyTransaction, value: any) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;

        const updated: DailyTransactionRow = {
          ...r,
          [field]: value,
          isDirty: true,
        };

        // Otomatis hitung ulang Pendapatan Hari Ini secara live
        updated.daily_income = calculateDailyIncome({
          cash_amount: updated.cash_amount,
          brimo_balance: updated.brimo_balance,
          payfazz_balance: updated.payfazz_balance,
          brilian_balance: updated.brilian_balance,
          debt_notes: updated.debt_notes,
          daily_capital: updated.daily_capital,
          customer_funds: updated.customer_funds,
        });

        return updated;
      })
    );
  };

  // Add New Daily Row Directly in Table (Excel-Style)
  const handleAddRow = async () => {
    if (!selectedPeriod) {
      setErrorMsg('Pilih atau buat periode terlebih dahulu.');
      return;
    }

    const y = selectedPeriod.year;
    const m = selectedPeriod.month < 10 ? `0${selectedPeriod.month}` : selectedPeriod.month;
    const todayIso = new Date().toISOString().split('T')[0];
    const defaultDate = todayIso.startsWith(`${y}-${m}`) ? todayIso : `${y}-${m}-01`;

    // Cek agregasi awal Uang Nasabah dan Modal untuk tanggal ini
    let initialFunds = 0;
    let initialCapital = 0;
    try {
      const [allF, allC] = await Promise.all([
        dataService.getCustomerFunds({ date: defaultDate }),
        dataService.getCapitalEntries(),
      ]);
      initialFunds = allF.reduce((s, f) => s + (Number(f.amount) || 0), 0);
      initialCapital = allC.filter((c) => c.entry_date === defaultDate).reduce((s, c) => s + (Number(c.amount) || 0), 0);
    } catch {
      // Abaikan jika offline
    }

    const newRow: DailyTransactionRow = {
      id: `draft_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      period_id: selectedPeriodId,
      transaction_date: defaultDate,
      transaction_count: 0,
      cash_amount: 0,
      brimo_balance: 0,
      payfazz_balance: 0,
      brilian_balance: 0,
      customer_funds: initialFunds,
      debt_notes: 0,
      daily_capital: initialCapital,
      daily_income: calculateDailyIncome({
        cash_amount: 0,
        brimo_balance: 0,
        payfazz_balance: 0,
        brilian_balance: 0,
        debt_notes: 0,
        daily_capital: initialCapital,
        customer_funds: initialFunds,
      }),
      notes: '',
      debt_items: [],
      isNew: true,
      isDirty: true,
    };

    setRows((prev) => [...prev, newRow].sort((a, b) => a.transaction_date.localeCompare(b.transaction_date)));
  };

  // Save All Changes to Supabase
  const handleSaveAll = async () => {
    if (saving || dirtyCount === 0 || !selectedPeriodId) return;

    // Validasi
    for (const r of dirtyRows) {
      if (!r.transaction_date || r.transaction_date.split('-').length < 3) {
        setErrorMsg('Semua baris harus memiliki Tanggal Transaksi yang valid.');
        return;
      }
    }

    setSaving(true);
    setErrorMsg('');

    try {
      let savedCount = 0;
      for (const r of dirtyRows) {
        await dataService.saveDailyTransaction({
          id: r.isNew ? undefined : r.id,
          period_id: selectedPeriodId,
          transaction_date: r.transaction_date,
          transaction_count: Number(r.transaction_count) || 0,
          cash_amount: Number(r.cash_amount) || 0,
          brimo_balance: Number(r.brimo_balance) || 0,
          payfazz_balance: Number(r.payfazz_balance) || 0,
          brilian_balance: Number(r.brilian_balance) || 0,
          customer_funds: Number(r.customer_funds) || 0,
          debt_notes: Number(r.debt_notes) || 0,
          daily_capital: Number(r.daily_capital) || 0,
          notes: r.notes || '',
          debt_items: r.debt_items || [],
        });
        savedCount++;
      }

      notify(`Berhasil menyimpan ${savedCount} data transaksi harian ke Supabase.`);
      await loadTransactions(selectedPeriodId);
    } catch (err: any) {
      console.error('Error saving daily transactions:', err);
      setErrorMsg(err.message || 'Gagal menyimpan transaksi harian ke Supabase.');
    } finally {
      setSaving(false);
    }
  };

  // Discard Changes
  const handleDiscardChanges = async () => {
    if (dirtyCount > 0) {
      const confirmDiscard = window.confirm(
        `Terdapat ${dirtyCount} perubahan belum disimpan. Yakin ingin membatalkan semua perubahan?`
      );
      if (!confirmDiscard) return;
    }
    if (selectedPeriodId) {
      await loadTransactions(selectedPeriodId);
    }
  };

  // Delete Row Handler
  const handleDeleteRow = (row: DailyTransactionRow) => {
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
      await dataService.deleteDailyTransaction(deleteConfirm.id);
      notify(`Transaksi tanggal ${formatDateID(deleteConfirm.transaction_date, false)} berhasil dihapus.`);
      setDeleteConfirm(null);
      await loadTransactions(selectedPeriodId);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menghapus transaksi.');
      setDeleteConfirm(null);
    } finally {
      setSaving(false);
    }
  };

  // Buka Modal Rincian Uang Nasabah
  const handleOpenCustomerFunds = async (date: string) => {
    setCustomerFundModal({
      open: true,
      date,
      items: [],
      total: 0,
      loading: true,
    });

    try {
      const items = await dataService.getCustomerFunds({ date });
      const total = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      setCustomerFundModal({
        open: true,
        date,
        items,
        total,
        loading: false,
      });
    } catch (err) {
      console.error(err);
      setCustomerFundModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // Buka Modal Rincian Multi-Item Catatan Utang
  const handleOpenDebtModal = (row: DailyTransactionRow) => {
    const items = row.debt_items ? [...row.debt_items] : [];
    setDebtModal({
      open: true,
      rowId: row.id,
      date: row.transaction_date,
      items: items.length > 0 ? items : [{ id: `item-${Date.now()}`, name: '', amount: 0 }],
      generalNote: row.notes || '',
    });
  };

  // Simpan Rincian Catatan Utang dari Modal ke Baris
  const handleSaveDebtModal = () => {
    const validItems = debtModal.items.filter((it) => it.name.trim() || it.amount > 0);
    const computedTotal = validItems.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);

    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== debtModal.rowId) return r;

        const updated: DailyTransactionRow = {
          ...r,
          debt_notes: computedTotal,
          debt_items: validItems,
          notes: debtModal.generalNote,
          isDirty: true,
        };

        updated.daily_income = calculateDailyIncome({
          cash_amount: updated.cash_amount,
          brimo_balance: updated.brimo_balance,
          payfazz_balance: updated.payfazz_balance,
          brilian_balance: updated.brilian_balance,
          debt_notes: computedTotal,
          daily_capital: updated.daily_capital,
          customer_funds: updated.customer_funds,
        });

        return updated;
      })
    );

    setDebtModal((prev) => ({ ...prev, open: false }));
  };

  // Buat Periode Baru
  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    setPeriodError('');
    try {
      const exists = periods.find(
        (p) => p.month === newPeriodMonth && p.year === newPeriodYear
      );
      if (exists) {
        setPeriodError(
          `Periode ${MONTH_NAMES_ID[newPeriodMonth - 1]} ${newPeriodYear} sudah terdaftar.`
        );
        return;
      }

      const created = await dataService.createBrilinkPeriod(newPeriodMonth, newPeriodYear);
      notify(`Periode ${MONTH_NAMES_ID[newPeriodMonth - 1]} ${newPeriodYear} berhasil dibuat.`);
      setPeriodModalOpen(false);
      await loadPeriods();
      setSelectedPeriodId(created.id);
    } catch (err: any) {
      setPeriodError(err.message || 'Gagal membuat periode.');
    }
  };

  // Export handlers
  const handleExportExcel = () => {
    if (!selectedPeriod) return;
    exportMonthlyTransactionsToExcel(rows, selectedPeriod.month, selectedPeriod.year, summaryTotals);
  };

  const handleExportPdf = () => {
    if (!selectedPeriod) return;
    exportMonthlyTransactionsToPdf(rows, selectedPeriod.month, selectedPeriod.year, summaryTotals);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-800 bg-blue-50 px-3 py-1 rounded-full w-fit border border-blue-200">
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
            <span>BRILink &bull; Sub-Menu Laporan Transaksi</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">
            Laporan Transaksi Harian & Bulanan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Input langsung di sel tabel seperti Excel. Nilai Uang Nasabah dan Modal diagregasikan otomatis per tanggal, mendukung multi-item Catatan Utang.
          </p>
        </div>

        {/* Buttons */}
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
            onClick={() => setPeriodModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-xs transition-all cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>+ Periode Baru</span>
          </button>

          <button
            onClick={handleAddRow}
            disabled={!selectedPeriodId}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs disabled:opacity-50 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>+ Tambah Baris</span>
          </button>

          <button
            onClick={handleSaveAll}
            disabled={saving || dirtyCount === 0}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black shadow-md transition-all cursor-pointer ${
              dirtyCount > 0
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30'
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
            disabled={rows.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-xs disabled:opacity-50 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Excel</span>
          </button>

          <button
            onClick={handleExportPdf}
            disabled={rows.length === 0}
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
            <span>Terdapat <strong>{dirtyCount}</strong> baris transaksi yang belum disimpan ke database.</span>
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

      {/* Top Banner: Pemilih Periode & Kartu Ringkasan Bulan Ini */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Dropdown Pemilih Periode Bulan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Pilih Bulan / Periode
            </span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="space-y-1">
            <select
              value={selectedPeriodId}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-black text-slate-800 outline-none focus:border-blue-500"
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {MONTH_NAMES_ID[p.month - 1]} {p.year} ({p.status === 'open' ? 'Buka' : 'Tutup'})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400">
              {rows.length} tanggal tercatat pada periode ini.
            </p>
          </div>
        </div>

        {/* Kartu Ringkasan Bulan Ini */}
        <div className="md:col-span-2 bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 rounded-2xl p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-blue-950/70 px-2.5 py-0.5 rounded-md border border-blue-700/50">
              <Calculator className="w-3.5 h-3.5 text-amber-400" />
              <span>Pendapatan Bulan {selectedPeriod ? `${MONTH_NAMES_ID[selectedPeriod.month - 1]} ${selectedPeriod.year}` : '-'}</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {formatRupiah(summaryTotals.totalIncome)}
            </div>
            <p className="text-xs text-blue-200">
              (Total Saldo + Kas + Utang) - Modal Harian - Uang Nasabah
            </p>
          </div>

          <div className="bg-white/10 p-3.5 rounded-xl border border-white/15 text-xs text-blue-100 space-y-1 sm:text-right">
            <div>Total Transaksi: <strong>{summaryTotals.totalCount} kali</strong></div>
            <div>Total Kas Tunai: <strong>{formatRupiah(summaryTotals.totalCash)}</strong></div>
            <div>Total Uang Nasabah (Auto): <strong>{formatRupiah(summaryTotals.totalCustomerFunds)}</strong></div>
          </div>
        </div>
      </div>

      {/* Main Table: Excel-Style Inline Editable Grid */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">Lembar Kerja Transaksi Harian (Excel-Style Grid)</span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">&bull; Nilai sel dapat diedit langsung di dalam baris</span>
          </div>
          <button
            onClick={handleAddRow}
            disabled={!selectedPeriodId}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>+ Tambah Baris Hari</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-2.5 w-10 text-center">No</th>
                <th className="py-3 px-2.5 w-36">Hari / Tanggal</th>
                <th className="py-3 px-2.5 w-24 text-right">Jml Trx</th>
                <th className="py-3 px-2.5 w-36 text-right">Tunai (Rp)</th>
                <th className="py-3 px-2.5 w-36 text-right">Saldo BRIMO (Rp)</th>
                <th className="py-3 px-2.5 w-36 text-right">Saldo Payfazz (Rp)</th>
                <th className="py-3 px-2.5 w-36 text-right">Saldo Brilian (Rp)</th>
                <th className="py-3 px-2.5 w-36 text-right bg-blue-50/50">Uang Nasabah (Rp)</th>
                <th className="py-3 px-2.5 w-36 text-right">Catatan Utang (Rp)</th>
                <th className="py-3 px-2.5 w-36 text-right bg-indigo-50/50">Modal Hari Ini (Rp)</th>
                <th className="py-3 px-2.5 w-40 text-right bg-emerald-50/50 text-emerald-900">Pendapatan (Rp)</th>
                <th className="py-3 px-2.5 min-w-[140px]">Catatan</th>
                <th className="py-3 px-2.5 w-24 text-center">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Memuat transaksi harian...</span>
                  </td>
                </tr>
              ) : rows.length > 0 ? (
                rows.map((t, idx) => {
                  const debtItemCount = t.debt_items?.length || 0;
                  return (
                    <tr
                      key={t.id}
                      className={`transition-colors ${
                        t.isNew
                          ? 'bg-amber-50/40 hover:bg-amber-50/70'
                          : t.isDirty
                          ? 'bg-blue-50/30 hover:bg-blue-50/60'
                          : 'hover:bg-slate-50/60'
                      }`}
                    >
                      {/* No */}
                      <td className="py-2.5 px-2 text-center text-slate-400 font-bold">
                        {idx + 1}
                      </td>

                      {/* Hari / Tanggal */}
                      <td className="py-2 px-2 whitespace-nowrap">
                        {t.isNew ? (
                          <input
                            type="date"
                            value={t.transaction_date}
                            onChange={(e) => handleCellChange(t.id, 'transaction_date', e.target.value)}
                            className="w-full px-2 py-1 rounded border border-slate-200 bg-white text-xs font-semibold"
                          />
                        ) : (
                          <div className="font-bold text-slate-900">
                            {formatDateID(t.transaction_date, true)}
                          </div>
                        )}
                      </td>

                      {/* Jml Trx */}
                      <td className="py-2 px-2 text-right">
                        <input
                          type="number"
                          min="0"
                          value={t.transaction_count}
                          onChange={(e) => handleCellChange(t.id, 'transaction_count', Number(e.target.value) || 0)}
                          className="w-20 px-2 py-1 rounded border border-slate-200 bg-white/90 text-right text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                        />
                      </td>

                      {/* Tunai (Rp) */}
                      <td className="py-2 px-2 text-right">
                        <input
                          type="number"
                          step="1000"
                          value={t.cash_amount}
                          onChange={(e) => handleCellChange(t.id, 'cash_amount', Number(e.target.value) || 0)}
                          className="w-32 px-2 py-1 rounded border border-slate-200 bg-white/90 text-right text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                        />
                      </td>

                      {/* Saldo BRIMO (Rp) */}
                      <td className="py-2 px-2 text-right">
                        <input
                          type="number"
                          step="1000"
                          value={t.brimo_balance}
                          onChange={(e) => handleCellChange(t.id, 'brimo_balance', Number(e.target.value) || 0)}
                          className="w-32 px-2 py-1 rounded border border-slate-200 bg-white/90 text-right text-xs font-bold text-blue-700 outline-none focus:border-blue-500"
                        />
                      </td>

                      {/* Saldo Payfazz (Rp) */}
                      <td className="py-2 px-2 text-right">
                        <input
                          type="number"
                          step="1000"
                          value={t.payfazz_balance}
                          onChange={(e) => handleCellChange(t.id, 'payfazz_balance', Number(e.target.value) || 0)}
                          className="w-32 px-2 py-1 rounded border border-slate-200 bg-white/90 text-right text-xs font-bold text-indigo-700 outline-none focus:border-blue-500"
                        />
                      </td>

                      {/* Saldo Brilian (Rp) */}
                      <td className="py-2 px-2 text-right">
                        <input
                          type="number"
                          step="1000"
                          value={t.brilian_balance}
                          onChange={(e) => handleCellChange(t.id, 'brilian_balance', Number(e.target.value) || 0)}
                          className="w-32 px-2 py-1 rounded border border-slate-200 bg-white/90 text-right text-xs font-bold text-violet-700 outline-none focus:border-blue-500"
                        />
                      </td>

                      {/* Uang Nasabah (Rp) - OTOMATIS DARI SUBMENU UANG NASABAH */}
                      <td className="py-2 px-2 text-right bg-blue-50/30 whitespace-nowrap">
                        <div
                          onClick={() => handleOpenCustomerFunds(t.transaction_date)}
                          className="cursor-pointer group flex items-center justify-end gap-1.5"
                          title="Klik untuk melihat rincian Uang Nasabah"
                        >
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-blue-100 text-blue-700">
                            Auto
                          </span>
                          <span className="font-bold text-rose-700 group-hover:underline">
                            {formatRupiah(t.customer_funds)}
                          </span>
                        </div>
                      </td>

                      {/* Catatan Utang (Rp) - MULTI-ITEM POPUP / INLINE */}
                      <td className="py-2 px-2 text-right whitespace-nowrap">
                        <div
                          onClick={() => handleOpenDebtModal(t)}
                          className="cursor-pointer group flex items-center justify-end gap-1.5"
                          title="Klik untuk mengedit rincian catatan utang"
                        >
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                            {debtItemCount} item
                          </span>
                          <span className="font-bold text-slate-800 group-hover:underline">
                            {formatRupiah(t.debt_notes)}
                          </span>
                        </div>
                      </td>

                      {/* Modal Hari Ini (Rp) - OTOMATIS DARI SUBMENU MODAL */}
                      <td className="py-2 px-2 text-right bg-indigo-50/30 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5" title="Agregasi otomatis dari Submenu Modal">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-indigo-100 text-indigo-700">
                            Auto
                          </span>
                          <span className="font-bold text-indigo-800">
                            {formatRupiah(t.daily_capital)}
                          </span>
                        </div>
                      </td>

                      {/* Pendapatan Hari Ini (Rp) - OTOMATIS LIVE */}
                      <td className="py-2 px-2 text-right bg-emerald-50/30 font-black text-emerald-800 whitespace-nowrap">
                        {formatRupiah(t.daily_income)}
                      </td>

                      {/* Catatan */}
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          placeholder="Catatan..."
                          value={t.notes || ''}
                          onChange={(e) => handleCellChange(t.id, 'notes', e.target.value)}
                          className="w-full px-2 py-1 rounded border border-slate-200 bg-white/90 text-xs text-slate-700 outline-none focus:border-blue-500"
                        />
                      </td>

                      {/* Aksi */}
                      <td className="py-2 px-2 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {t.isNew ? (
                            <span className="px-1 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                              Baru
                            </span>
                          ) : t.isDirty ? (
                            <span className="px-1 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800">
                              Diedit
                            </span>
                          ) : null}

                          <button
                            onClick={() => handleDeleteRow(t)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
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
                  <td colSpan={13} className="py-12 text-center text-slate-400 space-y-2">
                    <p className="font-medium">
                      Belum ada transaksi pada periode ini.
                    </p>
                    <button
                      onClick={handleAddRow}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Tambah Baris Hari Pertama</span>
                    </button>
                  </td>
                </tr>
              )}
            </tbody>

            {/* Bottom Total Row */}
            {rows.length > 0 && (
              <tfoot className="bg-slate-100/95 border-t-2 border-slate-300 font-black text-xs text-slate-900">
                <tr>
                  <td colSpan={2} className="py-3 px-3 text-center uppercase tracking-wider text-slate-600">
                    TOTAL BULAN
                  </td>
                  <td className="py-3 px-2 text-right">{summaryTotals.totalCount}</td>
                  <td className="py-3 px-2 text-right">{formatRupiah(summaryTotals.totalCash)}</td>
                  <td className="py-3 px-2 text-right">{formatRupiah(summaryTotals.totalBrimo)}</td>
                  <td className="py-3 px-2 text-right">{formatRupiah(summaryTotals.totalPayfazz)}</td>
                  <td className="py-3 px-2 text-right">{formatRupiah(summaryTotals.totalBrilian)}</td>
                  <td className="py-3 px-2 text-right bg-blue-50 text-rose-800">{formatRupiah(summaryTotals.totalCustomerFunds)}</td>
                  <td className="py-3 px-2 text-right">{formatRupiah(summaryTotals.totalDebt)}</td>
                  <td className="py-3 px-2 text-right bg-indigo-50 text-indigo-900">{formatRupiah(summaryTotals.totalCapital)}</td>
                  <td className="py-3 px-2 text-right bg-emerald-100 text-emerald-950 font-black text-sm whitespace-nowrap">
                    {formatRupiah(summaryTotals.totalIncome)}
                  </td>
                  <td colSpan={2} className="py-3 px-2 text-slate-500 font-semibold text-[11px]">
                    {rows.length} Hari Transaksi
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ================= MODAL RINCIAN MULTI-ITEM CATATAN UTANG ================= */}
      {debtModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Rincian Multi-Item Catatan Utang</h3>
                  <p className="text-xs text-slate-500">
                    Tanggal: {formatDateID(debtModal.date, true)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDebtModal((prev) => ({ ...prev, open: false }))}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Daftar Peminjam / Item Utang:</span>
                <button
                  type="button"
                  onClick={() =>
                    setDebtModal((prev) => ({
                      ...prev,
                      items: [
                        ...prev.items,
                        { id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, name: '', amount: 0 },
                      ],
                    }))
                  }
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Tambah Item</span>
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 rounded-xl border border-slate-200 p-2 bg-slate-50/50">
                {debtModal.items.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-400 w-5 text-center">{idx + 1}</span>
                    <input
                      type="text"
                      placeholder="Nama peminjam / keperluan..."
                      value={item.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDebtModal((prev) => ({
                          ...prev,
                          items: prev.items.map((it) => (it.id === item.id ? { ...it, name: val } : it)),
                        }));
                      }}
                      className="flex-1 px-2.5 py-1.5 rounded border border-slate-200 text-xs font-semibold outline-none focus:border-blue-500"
                    />
                    <input
                      type="number"
                      step="1000"
                      min="0"
                      placeholder="Nominal"
                      value={item.amount || ''}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setDebtModal((prev) => ({
                          ...prev,
                          items: prev.items.map((it) => (it.id === item.id ? { ...it, amount: val } : it)),
                        }));
                      }}
                      className="w-28 px-2 py-1.5 rounded border border-slate-200 text-xs font-bold text-right outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setDebtModal((prev) => ({
                          ...prev,
                          items: prev.items.filter((it) => it.id !== item.id),
                        }))
                      }
                      className="p-1.5 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Total Catatan Utang */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs font-bold text-amber-900">
                <span>Total Catatan Utang:</span>
                <span className="text-sm font-black text-amber-950">
                  {formatRupiah(debtModal.items.reduce((s, it) => s + (Number(it.amount) || 0), 0))}
                </span>
              </div>

              {/* Catatan Umum */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Catatan Tambahan Hari Ini (Opsional):</label>
                <input
                  type="text"
                  placeholder="Misal: Operasional normal..."
                  value={debtModal.generalNote}
                  onChange={(e) => setDebtModal((prev) => ({ ...prev, generalNote: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDebtModal((prev) => ({ ...prev, open: false }))}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveDebtModal}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Selesai & Perbarui Baris
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL RINCIAN UANG NASABAH (VIEW ONLY) ================= */}
      {customerFundModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Rincian Uang Nasabah</h3>
                  <p className="text-xs text-slate-500">
                    {formatDateID(customerFundModal.date, true)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCustomerFundModal((prev) => ({ ...prev, open: false }))}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {customerFundModal.loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Memuat rincian uang nasabah...</div>
            ) : customerFundModal.items.length > 0 ? (
              <div className="space-y-3">
                <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                  {customerFundModal.items.map((item, idx) => (
                    <div key={item.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                      <div>
                        <div className="font-bold text-slate-900">{idx + 1}. {item.customer_name}</div>
                        {item.notes && <div className="text-[11px] text-slate-500 mt-0.5">{item.notes}</div>}
                      </div>
                      <div className="font-bold text-rose-700 text-right">
                        {formatRupiah(item.amount)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-900">Total Uang Nasabah:</span>
                  <span className="text-sm font-black text-rose-700">
                    {formatRupiah(customerFundModal.total)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center space-y-2">
                <p className="text-xs text-slate-500">
                  Belum ada catatan rincian nasabah untuk tanggal ini pada Submenu Uang Nasabah.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <Link
                href={`/admin/brilink/uang-nasabah?date=${customerFundModal.date}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors"
              >
                <span>Kelola di Submenu Uang Nasabah</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setCustomerFundModal((prev) => ({ ...prev, open: false }))}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL TAMBAH PERIODE ================= */}
      {periodModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Tambah Periode Baru</h3>
              <button
                type="button"
                onClick={() => setPeriodModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {periodError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {periodError}
              </div>
            )}

            <form onSubmit={handleCreatePeriod} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Pilih Bulan *</label>
                <select
                  value={newPeriodMonth}
                  onChange={(e) => setNewPeriodMonth(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none bg-white font-bold"
                >
                  {MONTH_NAMES_ID.map((name, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Tahun *</label>
                <input
                  type="number"
                  min="2020"
                  max="2035"
                  required
                  value={newPeriodYear}
                  onChange={(e) => setNewPeriodYear(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPeriodModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  Buat Periode
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL KONFIRMASI HAPUS ================= */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in text-center">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Konfirmasi Hapus Transaksi</h3>
              <p className="text-xs text-slate-500 mt-1">
                Hapus catatan transaksi harian tanggal &ldquo;<strong>{formatDateID(deleteConfirm.transaction_date, true)}</strong>&rdquo;?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 cursor-pointer"
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
