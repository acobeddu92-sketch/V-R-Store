'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  FileSpreadsheet,
  Plus,
  Calendar,
  Download,
  FileText,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Calculator,
  Info,
  Eye,
  Users,
  ArrowUpRight,
  X,
} from 'lucide-react';
import { dataService } from '@/lib/services/dataService';
import { BrilinkPeriod, BrilinkDailyTransaction, CustomerFundEntry } from '@/lib/types/database';
import { formatRupiah } from '@/lib/utils/currency';
import { formatDateID, getDayNameID, MONTH_NAMES_ID } from '@/lib/utils/date';
import { calculateDailyIncome } from '@/lib/utils/calculations';
import { exportMonthlyTransactionsToExcel } from '@/lib/utils/exportExcel';
import { exportMonthlyTransactionsToPdf } from '@/lib/utils/exportPdf';

export default function LaporanTransaksiPage() {
  const [periods, setPeriods] = useState<BrilinkPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [transactions, setTransactions] = useState<BrilinkDailyTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Tambah Periode
  const [periodModalOpen, setPeriodModalOpen] = useState(false);
  const [newPeriodMonth, setNewPeriodMonth] = useState(new Date().getMonth() + 1);
  const [newPeriodYear, setNewPeriodYear] = useState(new Date().getFullYear());
  const [periodError, setPeriodError] = useState('');

  // Modal Tambah / Edit Transaksi Harian
  const [trxModalOpen, setTrxModalOpen] = useState(false);
  const [editingTrx, setEditingTrx] = useState<BrilinkDailyTransaction | null>(null);

  // Form Fields Transaksi Harian
  const [formDate, setFormDate] = useState('');
  const [formCount, setFormCount] = useState<number>(0);
  const [formCash, setFormCash] = useState<number>(0);
  const [formBrimo, setFormBrimo] = useState<number>(0);
  const [formPayfazz, setFormPayfazz] = useState<number>(0);
  const [formBrilian, setFormBrilian] = useState<number>(0);
  const [formCustomerFunds, setFormCustomerFunds] = useState<number>(0);
  const [formDebt, setFormDebt] = useState<number>(0);
  const [formDailyCapital, setFormDailyCapital] = useState<number>(0);
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Notifikasi
  const [successMsg, setSuccessMsg] = useState('');
  const [savingStatus, setSavingStatus] = useState<string>('');

  // Delete Confirm
  const [deleteConfirm, setDeleteConfirm] = useState<BrilinkDailyTransaction | null>(null);

  // Modal Rincian Uang Nasabah
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

  const loadPeriods = async () => {
    try {
      const p = await dataService.getBrilinkPeriods();
      setPeriods(p);
      if (p.length > 0 && !selectedPeriodId) {
        setSelectedPeriodId(p[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadTransactions = async (periodId: string) => {
    if (!periodId) return;
    try {
      setLoading(true);
      const data = await dataService.getDailyTransactions(periodId);
      setTransactions(data);
    } catch (e) {
      console.error(e);
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

  const notify = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const selectedPeriod = periods.find((p) => p.id === selectedPeriodId);

  // Perhitungan Realtime Pendapatan Hari Ini pada Formulir
  // Rumus: (Tunai + BRIMO + Payfazz + Brilian + Utang) - Modal - Uang Nasabah
  const liveCalculatedDailyIncome = useMemo(() => {
    return calculateDailyIncome({
      cash_amount: formCash,
      brimo_balance: formBrimo,
      payfazz_balance: formPayfazz,
      brilian_balance: formBrilian,
      debt_notes: formDebt,
      daily_capital: formDailyCapital,
      customer_funds: formCustomerFunds,
    });
  }, [formCash, formBrimo, formPayfazz, formBrilian, formDebt, formDailyCapital, formCustomerFunds]);

  // Total Rekapitulasi Bawah Tabel
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

    for (const t of transactions) {
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
  }, [transactions]);

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    setPeriodError('');
    try {
      const created = await dataService.createBrilinkPeriod(Number(newPeriodMonth), Number(newPeriodYear));
      notify(`Periode ${MONTH_NAMES_ID[created.month - 1]} ${created.year} berhasil dibuat.`);
      setPeriodModalOpen(false);
      await loadPeriods();
      setSelectedPeriodId(created.id);
    } catch (err: any) {
      setPeriodError(err.message || 'Gagal membuat periode.');
    }
  };

  const handleOpenCustomerFunds = async (date: string) => {
    setCustomerFundModal({
      open: true,
      date,
      items: [],
      total: 0,
      loading: true,
    });
    try {
      const items = await dataService.getCustomerFundsByDate(date);
      const total = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      setCustomerFundModal({
        open: true,
        date,
        items,
        total,
        loading: false,
      });
    } catch (e) {
      console.error(e);
      setCustomerFundModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleFormDateChange = async (newDate: string) => {
    setFormDate(newDate);
    if (newDate) {
      try {
        const autoCustomerFunds = await dataService.getCustomerFundsTotalByDate(newDate);
        if (autoCustomerFunds > 0 || !editingTrx) {
          setFormCustomerFunds(autoCustomerFunds);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleOpenTrxModal = async (trx?: BrilinkDailyTransaction) => {
    setFormError('');
    if (trx) {
      setEditingTrx(trx);
      setFormDate(trx.transaction_date);
      setFormCount(trx.transaction_count);
      setFormCash(trx.cash_amount);
      setFormBrimo(trx.brimo_balance);
      setFormPayfazz(trx.payfazz_balance);
      setFormBrilian(trx.brilian_balance);

      // Sinkronkan atau ambil total Uang Nasabah terkini pada tanggal transaksi
      try {
        const autoCustomerFunds = await dataService.getCustomerFundsTotalByDate(trx.transaction_date);
        setFormCustomerFunds(autoCustomerFunds > 0 ? autoCustomerFunds : trx.customer_funds);
      } catch (e) {
        setFormCustomerFunds(trx.customer_funds);
      }

      setFormDebt(trx.debt_notes);
      setFormDailyCapital(trx.daily_capital);
      setFormNotes(trx.notes || '');
    } else {
      setEditingTrx(null);
      let initialDate = new Date().toISOString().split('T')[0];
      if (selectedPeriod) {
        const d = new Date();
        const y = selectedPeriod.year;
        const m = selectedPeriod.month < 10 ? `0${selectedPeriod.month}` : selectedPeriod.month;
        initialDate = initialDate.startsWith(`${y}-${m}`) ? initialDate : `${y}-${m}-01`;
      }
      setFormDate(initialDate);
      setFormCount(1);
      setFormCash(0);
      setFormBrimo(0);
      setFormPayfazz(0);
      setFormBrilian(0);

      try {
        const autoCustomerFunds = await dataService.getCustomerFundsTotalByDate(initialDate);
        setFormCustomerFunds(autoCustomerFunds);
      } catch (e) {
        setFormCustomerFunds(0);
      }

      setFormDebt(0);
      setFormDailyCapital(25000000); // Default ke modal operasional aktif
      setFormNotes('');
    }
    setTrxModalOpen(true);
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedPeriodId) {
      setFormError('Harap pilih periode transaksi terlebih dahulu.');
      return;
    }

    if (!formDate) {
      setFormError('Hari / Tanggal transaksi harus diisi.');
      return;
    }

    if (selectedPeriod) {
      const d = new Date(formDate);
      if (d.getFullYear() !== selectedPeriod.year || d.getMonth() + 1 !== selectedPeriod.month) {
        setFormError(
          `Tanggal harus berada dalam bulan ${MONTH_NAMES_ID[selectedPeriod.month - 1]} ${selectedPeriod.year}.`
        );
        return;
      }
    }

    try {
      setSavingStatus('Menyimpan transaksi...');
      await dataService.saveDailyTransaction({
        id: editingTrx?.id,
        period_id: selectedPeriodId,
        transaction_date: formDate,
        transaction_count: formCount,
        cash_amount: formCash,
        brimo_balance: formBrimo,
        payfazz_balance: formPayfazz,
        brilian_balance: formBrilian,
        customer_funds: formCustomerFunds,
        debt_notes: formDebt,
        daily_capital: formDailyCapital,
        notes: formNotes,
      });

      notify(
        editingTrx
          ? `Transaksi tanggal ${formatDateID(formDate, false)} berhasil diperbarui.`
          : `Transaksi tanggal ${formatDateID(formDate, false)} berhasil disimpan.`
      );
      setTrxModalOpen(false);
      loadTransactions(selectedPeriodId);
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan transaksi harian.');
    } finally {
      setSavingStatus('');
    }
  };

  const handleDeleteTransaction = async () => {
    if (!deleteConfirm) return;
    try {
      await dataService.deleteDailyTransaction(deleteConfirm.id);
      notify(`Transaksi tanggal ${formatDateID(deleteConfirm.transaction_date, false)} berhasil dihapus.`);
      setDeleteConfirm(null);
      loadTransactions(selectedPeriodId);
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus transaksi.');
      setDeleteConfirm(null);
    }
  };

  const handleExportExcel = () => {
    if (!selectedPeriod) return;
    exportMonthlyTransactionsToExcel(transactions, selectedPeriod.month, selectedPeriod.year, summaryTotals);
  };

  const handleExportPdf = () => {
    if (!selectedPeriod) return;
    exportMonthlyTransactionsToPdf(transactions, selectedPeriod.month, selectedPeriod.year, summaryTotals);
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
            Lembar kerja mutasi kas, saldo perbankan, dan perhitungan otomatis pendapatan per baris tanggal.
          </p>
        </div>

        {/* Buttons: Tambah Periode, Tambah Transaksi, Ekspor */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setPeriodModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-xs transition-all"
          >
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>+ Tambah Periode</span>
          </button>

          <button
            onClick={handleExportExcel}
            disabled={transactions.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-xs disabled:opacity-50 transition-all"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Ekspor Excel</span>
          </button>

          <button
            onClick={handleExportPdf}
            disabled={transactions.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-xs disabled:opacity-50 transition-all"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            <span>Ekspor PDF</span>
          </button>

          <button
            onClick={() => handleOpenTrxModal()}
            disabled={!selectedPeriodId}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Transaksi Harian</span>
          </button>
        </div>
      </div>

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
              {transactions.length} tanggal tercatat pada periode ini.
            </p>
          </div>
        </div>

        {/* Kartu Ringkasan Bulan Ini: Pendapatan Bulan [Nama Bulan yang Dipilih] */}
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
              Terhitung otomatis dari akumulasi seluruh nilai Pendapatan Hari Ini.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-right sm:border-l sm:border-blue-800 sm:pl-6 text-xs">
            <div>
              <div className="text-blue-300 text-[11px]">Total Transaksi:</div>
              <div className="font-black text-sm">{summaryTotals.totalCount} Trx</div>
            </div>
            <div>
              <div className="text-blue-300 text-[11px]">Total Modal Tercatat:</div>
              <div className="font-black text-sm">{formatRupiah(summaryTotals.totalCapital)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Box Rumus */}
      <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 text-blue-950 text-xs flex items-start gap-2.5 leading-relaxed">
        <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
        <div>
          <span className="font-bold text-blue-950">Rumus Pendapatan Hari Ini (Otomatis):</span>{' '}
          <code className="bg-white px-2 py-0.5 rounded border border-blue-200 font-bold text-blue-800">
            Pendapatan Hari Ini = (Tunai + BRIMO + Payfazz + Brilian + Catatan Utang) - Modal - Uang Nasabah
          </code>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* TABEL LAPORAN TRANSAKSI HARIAN EXCEL-STYLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1250px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3 w-10 text-center">No</th>
                <th className="py-3 px-3 w-36">Hari / Tanggal</th>
                <th className="py-3 px-3 text-center w-24">Jml Transaksi</th>
                <th className="py-3 px-3 text-right">Jumlah Tunai</th>
                <th className="py-3 px-3 text-right">Saldo BRIMO</th>
                <th className="py-3 px-3 text-right">Saldo Payfazz</th>
                <th className="py-3 px-3 text-right">Saldo Brilian</th>
                <th className="py-3 px-3 text-right text-rose-700">Uang Nasabah</th>
                <th className="py-3 px-3 text-right">Catatan Utang</th>
                <th className="py-3 px-3 text-right text-amber-700">Modal Hari Ini</th>
                <th className="py-3 px-3 text-right text-blue-800 bg-blue-50/70 font-black">
                  Pendapatan Hari Ini
                </th>
                <th className="py-3 px-3 w-32">Catatan</th>
                <th className="py-3 px-3 text-center w-20 sticky right-0 bg-slate-50">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-400">
                    Memuat lembar kerja transaksi...
                  </td>
                </tr>
              ) : transactions.length > 0 ? (
                transactions.map((t, idx) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">
                      {formatDateID(t.transaction_date, true)}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800">
                      {t.transaction_count} Trx
                    </td>
                    <td className="py-3 px-3 text-right">{formatRupiah(t.cash_amount)}</td>
                    <td className="py-3 px-3 text-right">{formatRupiah(t.brimo_balance)}</td>
                    <td className="py-3 px-3 text-right">{formatRupiah(t.payfazz_balance)}</td>
                    <td className="py-3 px-3 text-right">{formatRupiah(t.brilian_balance)}</td>
                    <td className="py-3 px-3 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5 w-full">
                        <span className="text-rose-700 font-semibold">{formatRupiah(t.customer_funds)}</span>
                        <button
                          type="button"
                          onClick={() => handleOpenCustomerFunds(t.transaction_date)}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Lihat Rincian Uang Nasabah"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">{formatRupiah(t.debt_notes)}</td>
                    <td className="py-3 px-3 text-right text-amber-700 font-semibold">
                      {formatRupiah(t.daily_capital)}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-blue-800 bg-blue-50/40">
                      {formatRupiah(t.daily_income)}
                    </td>
                    <td className="py-3 px-3 text-slate-500 truncate max-w-xs">{t.notes || '-'}</td>
                    <td className="py-3 px-3 text-center sticky right-0 bg-white">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleOpenTrxModal(t)}
                          className="p-1 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                          title="Edit Baris"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(t)}
                          className="p-1 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                          title="Hapus Baris"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-400 space-y-2">
                    <p className="font-medium">Periode ini belum memiliki catatan transaksi harian.</p>
                    <button
                      onClick={() => handleOpenTrxModal()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Input Transaksi Pertama</span>
                    </button>
                  </td>
                </tr>
              )}
            </tbody>

            {/* BARIS TOTAL / AKUMULASI DI BAGIAN BAWAH TABEL */}
            {transactions.length > 0 && (
              <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-xs text-slate-800">
                <tr>
                  <td colSpan={2} className="py-4 px-3 text-center uppercase tracking-wider text-slate-600">
                    TOTAL PENDAPATAN BULAN {selectedPeriod ? `${MONTH_NAMES_ID[selectedPeriod.month - 1].toUpperCase()}` : ''}:
                  </td>
                  <td className="py-4 px-3 text-center text-slate-900">{summaryTotals.totalCount}</td>
                  <td className="py-4 px-3 text-right">{formatRupiah(summaryTotals.totalCash)}</td>
                  <td className="py-4 px-3 text-right">{formatRupiah(summaryTotals.totalBrimo)}</td>
                  <td className="py-4 px-3 text-right">{formatRupiah(summaryTotals.totalPayfazz)}</td>
                  <td className="py-4 px-3 text-right">{formatRupiah(summaryTotals.totalBrilian)}</td>
                  <td className="py-4 px-3 text-right text-rose-800">{formatRupiah(summaryTotals.totalCustomerFunds)}</td>
                  <td className="py-4 px-3 text-right">{formatRupiah(summaryTotals.totalDebt)}</td>
                  <td className="py-4 px-3 text-right text-amber-800">{formatRupiah(summaryTotals.totalCapital)}</td>
                  <td className="py-4 px-3 text-right font-black text-blue-900 bg-blue-100 text-sm">
                    {formatRupiah(summaryTotals.totalIncome)}
                  </td>
                  <td colSpan={2} className="py-4 px-3 text-slate-500 text-[11px] sticky right-0 bg-slate-100">
                    {transactions.length} Hari Transaksi
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ================= MODAL TAMBAH / EDIT TRANSAKSI ================= */}
      {trxModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {editingTrx ? 'Edit Transaksi Harian' : 'Input Transaksi Harian BRILink'}
                </h3>
                <p className="text-xs text-slate-500">
                  Periode: {selectedPeriod ? `${MONTH_NAMES_ID[selectedPeriod.month - 1]} ${selectedPeriod.year}` : '-'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">
                  Pendapatan Otomatis:
                </span>
                <span className="text-base font-black text-blue-700">
                  {formatRupiah(liveCalculatedDailyIncome)}
                </span>
              </div>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveTransaction} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Hari / Tanggal Transaksi *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => handleFormDateChange(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500 font-medium"
                  />
                  {formDate && (
                    <div className="text-[11px] text-slate-500 font-semibold">
                      {getDayNameID(formDate)}, {formatDateID(formDate, false)}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Jumlah Transaksi (Kuantitas) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formCount}
                    onChange={(e) => setFormCount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500 font-bold"
                  />
                </div>
              </div>

              {/* Kas & BRIMO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Jumlah Tunai (Rp) *</label>
                  <input
                    type="number"
                    min="0"
                    value={formCash}
                    onChange={(e) => setFormCash(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500"
                  />
                  <div className="text-[10px] text-slate-500">{formatRupiah(formCash)}</div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Jumlah Saldo BRIMO (Rp) *</label>
                  <input
                    type="number"
                    min="0"
                    value={formBrimo}
                    onChange={(e) => setFormBrimo(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500"
                  />
                  <div className="text-[10px] text-slate-500">{formatRupiah(formBrimo)}</div>
                </div>
              </div>

              {/* Payfazz & Brilian */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Jumlah Saldo Payfazz (Rp) *</label>
                  <input
                    type="number"
                    min="0"
                    value={formPayfazz}
                    onChange={(e) => setFormPayfazz(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500"
                  />
                  <div className="text-[10px] text-slate-500">{formatRupiah(formPayfazz)}</div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Jumlah Saldo Brilian (Rp) *</label>
                  <input
                    type="number"
                    min="0"
                    value={formBrilian}
                    onChange={(e) => setFormBrilian(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500"
                  />
                  <div className="text-[10px] text-slate-500">{formatRupiah(formBrilian)}</div>
                </div>
              </div>

              {/* Uang Nasabah & Catatan Utang */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-rose-700">Uang Nasabah (Pengurang Rp) *</label>
                    <Link
                      href={formDate ? `/admin/brilink/uang-nasabah?date=${formDate}` : '/admin/brilink/uang-nasabah'}
                      target="_blank"
                      className="text-[10px] text-rose-600 hover:text-rose-800 font-semibold inline-flex items-center gap-0.5"
                    >
                      <span>Kelola Rincian</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={formCustomerFunds}
                    onChange={(e) => setFormCustomerFunds(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-rose-200 text-xs outline-none focus:border-rose-500 bg-rose-50/20"
                  />
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-rose-600 font-semibold">{formatRupiah(formCustomerFunds)}</span>
                    <span className="text-slate-400">Sinkron otomatis dengan Uang Nasabah</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Catatan Utang (Penambah Rp) *</label>
                  <input
                    type="number"
                    min="0"
                    value={formDebt}
                    onChange={(e) => setFormDebt(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500"
                  />
                  <div className="text-[10px] text-slate-500">{formatRupiah(formDebt)}</div>
                </div>
              </div>

              {/* Modal Hari Ini & Catatan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-amber-700">Total Modal / Modal Hari Ini (Pengurang Rp) *</label>
                  <input
                    type="number"
                    min="0"
                    value={formDailyCapital}
                    onChange={(e) => setFormDailyCapital(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-amber-200 text-xs outline-none focus:border-amber-500 bg-amber-50/20"
                  />
                  <div className="text-[10px] text-amber-700 font-semibold">{formatRupiah(formDailyCapital)}</div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Catatan Khusus (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Misal: Penyesuaian transaksi sore..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Preview Pendapatan Otomatis */}
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-blue-900 text-xs">
                    Pendapatan Hari Ini (Terhitung Otomatis):
                  </div>
                  <div className="text-[10px] text-blue-700 font-mono pt-0.5">
                    ({formCash} + {formBrimo} + {formPayfazz} + {formBrilian} + {formDebt}) - {formDailyCapital} - {formCustomerFunds}
                  </div>
                </div>
                <div className="text-xl font-black text-blue-800">
                  {formatRupiah(liveCalculatedDailyIncome)}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTrxModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                >
                  {savingStatus || 'Simpan Transaksi Harian'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL TAMBAH PERIODE ================= */}
      {periodModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-base font-black text-slate-900">Tambah Periode Baru</h3>
              <p className="text-xs text-slate-500">Pilih bulan dan tahun buku pembukuan transaksi.</p>
            </div>

            {periodError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{periodError}</span>
              </div>
            )}

            <form onSubmit={handleCreatePeriod} className="space-y-4 text-xs">
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
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20"
                >
                  Buat Periode
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL RINCIAN UANG NASABAH ================= */}
      {customerFundModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95">
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
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
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
                  Belum ada catatan rincian nasabah untuk tanggal ini.
                </p>
                <p className="text-[11px] text-slate-400">
                  Total nominal dihitung dari input manual atau belum diuraikan di submenu Uang Nasabah.
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
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL KONFIRMASI HAPUS ================= */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95 text-center">
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
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteTransaction}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
