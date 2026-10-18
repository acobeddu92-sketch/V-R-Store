'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Coins,
  Plus,
  Search,
  Trash2,
  Download,
  CheckCircle,
  AlertCircle,
  Wallet,
  Save,
  RotateCcw,
  Loader2,
  X,
} from 'lucide-react';
import { dataService } from '@/lib/services/dataService';
import { BrilinkCapitalEntry } from '@/lib/types/database';
import { formatRupiah } from '@/lib/utils/currency';
import { formatDateID, MONTH_NAMES_ID } from '@/lib/utils/date';
import { exportCapitalToExcel } from '@/lib/utils/exportExcel';

interface CapitalRow extends BrilinkCapitalEntry {
  isNew?: boolean;
  isDirty?: boolean;
}

export default function ModalBrilinkPage() {
  const [rows, setRows] = useState<CapitalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filter & Search
  const [searchSource, setSearchSource] = useState('');
  const [filterYear, setFilterYear] = useState<string>('ALL');
  const [filterMonth, setFilterMonth] = useState<string>('ALL');

  // Notifications & Alerts
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Delete Confirm Modal
  const [deleteConfirm, setDeleteConfirm] = useState<CapitalRow | null>(null);

  const notify = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const data = await dataService.getCapitalEntries();
      setRows(
        data.map((item) => ({
          ...item,
          isNew: false,
          isDirty: false,
        }))
      );
    } catch (e: any) {
      console.error('Gagal memuat data modal:', e);
      setErrorMsg(e.message || 'Gagal memuat data modal dari database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Dirty rows tracking
  const dirtyRows = useMemo(() => {
    return rows.filter((r) => r.isNew || r.isDirty);
  }, [rows]);
  const dirtyCount = dirtyRows.length;

  // Warning when leaving with unsaved edits
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

  // Filtered rows for display
  const filteredRows = useMemo(() => {
    return rows.filter((e) => {
      if (e.isNew) return true;

      if (searchSource.trim() && !e.source.toLowerCase().includes(searchSource.toLowerCase().trim())) {
        return false;
      }
      const parts = e.entry_date.split('-');
      if (parts.length >= 2) {
        const y = parts[0];
        const m = parseInt(parts[1], 10).toString();

        if (filterYear !== 'ALL' && y !== filterYear) {
          return false;
        }
        if (filterMonth !== 'ALL' && m !== filterMonth) {
          return false;
        }
      }
      return true;
    });
  }, [rows, searchSource, filterYear, filterMonth]);

  // Grand totals
  const totalGrandCapital = rows.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalFilteredCapital = filteredRows.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const availableYears = Array.from(
    new Set(
      rows
        .map((e) => e.entry_date.split('-')[0])
        .filter((y) => y && y.length === 4)
    )
  ).sort((a, b) => b.localeCompare(a));
  if (availableYears.length === 0) availableYears.push(new Date().getFullYear().toString());

  // Handle Cell Change
  const handleCellChange = (id: string, field: keyof BrilinkCapitalEntry, value: any) => {
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
    const todayIso = new Date().toISOString().split('T')[0];
    const newRow: CapitalRow = {
      id: `draft_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      entry_date: todayIso,
      source: '',
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

    for (const r of dirtyRows) {
      if (!r.source || !r.source.trim()) {
        setErrorMsg('Semua baris harus memiliki Sumber Modal.');
        return;
      }
      if (!r.entry_date || r.entry_date.split('-').length < 3) {
        setErrorMsg(`Format tanggal untuk modal "${r.source}" tidak valid.`);
        return;
      }
      const numAmount = Number(r.amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        setErrorMsg(`Nominal modal "${r.source}" harus lebih besar dari Rp 0.`);
        return;
      }
    }

    setSaving(true);
    setErrorMsg('');

    try {
      let savedCount = 0;
      for (const r of dirtyRows) {
        if (r.isNew) {
          await dataService.createCapitalEntry({
            entry_date: r.entry_date,
            source: r.source.trim(),
            amount: Number(r.amount),
            notes: (r.notes || '').trim(),
          });
          savedCount++;
        } else if (r.isDirty) {
          await dataService.updateCapitalEntry(r.id, {
            entry_date: r.entry_date,
            source: r.source.trim(),
            amount: Number(r.amount),
            notes: (r.notes || '').trim(),
          });
          savedCount++;
        }
      }

      notify(`Berhasil menyimpan ${savedCount} entri modal ke Supabase.`);
      await loadData();
    } catch (err: any) {
      console.error('Error saving capital entries:', err);
      setErrorMsg(err.message || 'Gagal menyimpan perubahan modal ke Supabase.');
    } finally {
      setSaving(false);
    }
  };

  // Discard Unsaved Changes
  const handleDiscardChanges = async () => {
    if (dirtyCount > 0) {
      const confirmDiscard = window.confirm(
        `Terdapat ${dirtyCount} perubahan belum disimpan. Yakin ingin membatalkan semua perubahan?`
      );
      if (!confirmDiscard) return;
    }
    await loadData();
  };

  // Delete Row Handler
  const handleDeleteRow = (row: CapitalRow) => {
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
      await dataService.deleteCapitalEntry(deleteConfirm.id);
      notify(`Entri modal "${deleteConfirm.source}" berhasil dihapus.`);
      setDeleteConfirm(null);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menghapus entri modal.');
      setDeleteConfirm(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-800 bg-blue-50 px-3 py-1 rounded-full w-fit border border-blue-200">
            <Coins className="w-3.5 h-3.5 text-blue-600" />
            <span>BRILink &bull; Sub-Menu Modal</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">
            Pencatatan & Pemantauan Modal BRILink
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Input langsung di sel tabel seperti Excel, tersimpan persisten ke Supabase, dan diagregasi otomatis ke Laporan Transaksi Harian.
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
            onClick={() => exportCapitalToExcel(filteredRows)}
            disabled={filteredRows.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-xs disabled:opacity-50 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* KARTU UTAMA: TOTAL AKUMULASI MODAL AKTIF */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
              Total Akumulasi Modal Aktif
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-white">
            {formatRupiah(totalGrandCapital)}
          </div>
          <p className="text-xs text-blue-200 max-w-xl leading-relaxed">
            Akumulasi modal operasional BRILink. Nilai modal pada setiap tanggal otomatis ditarik dan diagregasikan ke kolom Modal Hari Ini pada Laporan Transaksi Harian.
          </p>
        </div>

        <div className="bg-white/10 p-4 rounded-2xl border border-white/15 text-xs text-blue-100 space-y-1 sm:text-right">
          <span className="text-amber-300 font-bold block">Status Kas Operasional:</span>
          <span>{rows.length} suntikan modal tercatat</span>
          <div className="text-[11px] text-blue-200 pt-1">
            Filter Terpilih: <strong>{formatRupiah(totalFilteredCapital)}</strong>
          </div>
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
            <span>Terdapat <strong>{dirtyCount}</strong> baris modal yang belum disimpan ke database.</span>
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

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari sumber modal (misal: Kas Induk, BRI)..."
            value={searchSource}
            onChange={(e) => setSearchSource(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500 bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 outline-none"
          >
            <option value="ALL">Semua Bulan</option>
            {MONTH_NAMES_ID.map((name, idx) => (
              <option key={idx + 1} value={(idx + 1).toString()}>
                {name}
              </option>
            ))}
          </select>

          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 outline-none"
          >
            <option value="ALL">Semua Tahun</option>
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                Tahun {yr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table: Excel-Style Inline Editable Grid */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Tabel Modal BRILink (Input Langsung Excel)</span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">&bull; Klik sel untuk mengetik langsung nilai baris</span>
          </div>
          <button
            onClick={handleAddRow}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>+ Tambah Baris</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-3 w-12 text-center">No</th>
                <th className="py-3.5 px-3 w-40">Tanggal Masuk</th>
                <th className="py-3.5 px-3 w-56">Sumber Modal</th>
                <th className="py-3.5 px-3 w-48 text-right">Nominal Modal (Rp)</th>
                <th className="py-3.5 px-3">Catatan</th>
                <th className="py-3.5 px-3 w-28 text-center">Status / Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Memuat data modal...</span>
                  </td>
                </tr>
              ) : filteredRows.length > 0 ? (
                filteredRows.map((r, idx) => (
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

                    {/* Tanggal Masuk */}
                    <td className="py-2 px-3">
                      <input
                        type="date"
                        value={r.entry_date}
                        onChange={(e) => handleCellChange(r.id, 'entry_date', e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white/90 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </td>

                    {/* Sumber Modal */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        placeholder="Misal: Kas Induk, BRI..."
                        value={r.source}
                        onChange={(e) => handleCellChange(r.id, 'source', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white/90 text-xs font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </td>

                    {/* Nominal Modal (Rp) */}
                    <td className="py-2 px-3 text-right">
                      <div>
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          placeholder="0"
                          value={r.amount || ''}
                          onChange={(e) => handleCellChange(r.id, 'amount', Number(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white/90 text-xs font-black text-blue-700 text-right outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                        <div className="text-[10px] text-slate-400 text-right pr-1 pt-0.5">
                          {formatRupiah(r.amount || 0)}
                        </div>
                      </div>
                    </td>

                    {/* Catatan */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        placeholder="Catatan / keterangan..."
                        value={r.notes || ''}
                        onChange={(e) => handleCellChange(r.id, 'notes', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white/90 text-xs text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                          title="Hapus modal"
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
                      Belum ada data modal yang cocok dengan filter aktif.
                    </p>
                    <button
                      type="button"
                      onClick={handleAddRow}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Tambah Baris Modal Pertama</span>
                    </button>
                  </td>
                </tr>
              )}
            </tbody>

            {/* Bottom Grand Total Row */}
            {filteredRows.length > 0 && (
              <tfoot className="bg-slate-100/90 border-t-2 border-slate-300 font-bold text-xs text-slate-800">
                <tr>
                  <td colSpan={3} className="py-4 px-4 text-right uppercase tracking-wider text-slate-600">
                    TOTAL MODAL TERFILTER:
                  </td>
                  <td className="py-4 px-4 text-right font-black text-blue-800 text-sm whitespace-nowrap">
                    {formatRupiah(totalFilteredCapital)}
                  </td>
                  <td colSpan={2} className="py-4 px-4 text-left text-[11px] text-slate-500">
                    {filteredRows.length} Suntikan Modal
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
              <h3 className="text-base font-black text-slate-900">Hapus Entri Modal?</h3>
              <p className="text-xs text-slate-500">
                Modal dari <strong>{deleteConfirm.source}</strong> tanggal {formatDateID(deleteConfirm.entry_date, true)} senilai{' '}
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
