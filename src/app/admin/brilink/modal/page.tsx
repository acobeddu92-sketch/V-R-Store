'use client';

import React, { useState, useEffect } from 'react';
import {
  Coins,
  Plus,
  Search,
  Edit,
  Trash2,
  Download,
  AlertCircle,
  CheckCircle,
  Wallet,
  TrendingUp,
} from 'lucide-react';
import { dataService } from '@/lib/services/dataService';
import { BrilinkCapitalEntry } from '@/lib/types/database';
import { formatRupiah } from '@/lib/utils/currency';
import { formatDateID, MONTH_NAMES_ID } from '@/lib/utils/date';
import { exportCapitalToExcel } from '@/lib/utils/exportExcel';

export default function ModalBrilinkPage() {
  const [entries, setEntries] = useState<BrilinkCapitalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search
  const [searchSource, setSearchSource] = useState('');
  const [filterYear, setFilterYear] = useState<string>('ALL');
  const [filterMonth, setFilterMonth] = useState<string>('ALL');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<BrilinkCapitalEntry | null>(null);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [entrySource, setEntrySource] = useState('');
  const [entryAmount, setEntryAmount] = useState<number>(0);
  const [entryNotes, setEntryNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Delete Confirm
  const [deleteConfirm, setDeleteConfirm] = useState<BrilinkCapitalEntry | null>(null);

  // Alert
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await dataService.getCapitalEntries();
      setEntries(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const notify = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleOpenModal = (entry?: BrilinkCapitalEntry) => {
    setFormError('');
    if (entry) {
      setEditingEntry(entry);
      setEntryDate(entry.entry_date);
      setEntrySource(entry.source);
      setEntryAmount(entry.amount);
      setEntryNotes(entry.notes || '');
    } else {
      setEditingEntry(null);
      setEntryDate(new Date().toISOString().split('T')[0]);
      setEntrySource('');
      setEntryAmount(0);
      setEntryNotes('');
    }
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!entryDate) {
      setFormError('Tanggal masuk modal harus diisi.');
      return;
    }
    if (!entrySource.trim()) {
      setFormError('Sumber modal harus diisi.');
      return;
    }
    if (entryAmount <= 0) {
      setFormError('Nominal modal harus lebih besar dari Rp 0.');
      return;
    }

    try {
      if (editingEntry) {
        await dataService.updateCapitalEntry(editingEntry.id, {
          entry_date: entryDate,
          source: entrySource.trim(),
          amount: entryAmount,
          notes: entryNotes.trim(),
        });
        notify('Data modal berhasil diperbarui.');
      } else {
        await dataService.createCapitalEntry({
          entry_date: entryDate,
          source: entrySource.trim(),
          amount: entryAmount,
          notes: entryNotes.trim(),
        });
        notify('Suntikan modal baru berhasil ditambahkan.');
      }

      setModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan entri modal.');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await dataService.deleteCapitalEntry(deleteConfirm.id);
      notify('Entri modal berhasil dihapus.');
      setDeleteConfirm(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus modal.');
      setDeleteConfirm(null);
    }
  };

  // Filtered Entries
  const filteredEntries = entries.filter((e) => {
    if (searchSource.trim() && !e.source.toLowerCase().includes(searchSource.toLowerCase().trim())) {
      return false;
    }
    const d = new Date(e.entry_date);
    if (filterYear !== 'ALL' && d.getFullYear().toString() !== filterYear) {
      return false;
    }
    if (filterMonth !== 'ALL' && (d.getMonth() + 1).toString() !== filterMonth) {
      return false;
    }
    return true;
  });

  // Total Akumulasi Modal Aktif
  const totalGrandCapital = entries.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalFilteredCapital = filteredEntries.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const availableYears = Array.from(new Set(entries.map((e) => new Date(e.entry_date).getFullYear()))).sort(
    (a, b) => b - a
  );
  if (availableYears.length === 0) availableYears.push(new Date().getFullYear());

  return (
    <div className="space-y-6 pb-12">
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
            Catat dan pantau setiap suntikan modal masuk operasional kas tunai dan saldo perbankan BRILink.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCapitalToExcel(filteredEntries)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-xs transition-all"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Ekspor Excel</span>
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Modal Baru</span>
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
            Akumulasi seluruh modal operasional yang aktif. Nilai modal ini dijadikan rujukan dan pengurang pada perhitungan harian pembukuan transaksi BRILink.
          </p>
        </div>

        <div className="bg-white/10 p-4 rounded-2xl border border-white/15 text-xs text-blue-100 space-y-1 sm:text-right">
          <span className="text-amber-300 font-bold block">Status Kas Operasional:</span>
          <span>{entries.length} suntikan modal tercatat</span>
          <div className="text-[11px] text-blue-200 pt-1">
            Filter Terpilih: <strong>{formatRupiah(totalFilteredCapital)}</strong>
          </div>
        </div>
      </div>

      {/* Success Alert */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
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
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500"
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
              <option key={yr} value={yr.toString()}>
                Tahun {yr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TABEL MODAL: No, Tanggal Masuk, Sumber Modal, Nominal Modal (Rp), Aksi */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-14 text-center">No</th>
                <th className="py-3 px-4">Tanggal Masuk Modal</th>
                <th className="py-3 px-4">Sumber Modal</th>
                <th className="py-3 px-4 text-right">Nominal Modal (Rp)</th>
                <th className="py-3 px-4">Catatan</th>
                <th className="py-3 px-4 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredEntries.length > 0 ? (
                filteredEntries.map((e, idx) => (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {formatDateID(e.entry_date, true)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{e.source}</td>
                    <td className="py-3.5 px-4 text-right font-black text-blue-700">
                      {formatRupiah(e.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{e.notes || '-'}</td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleOpenModal(e)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                          title="Edit Modal"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(e)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                          title="Hapus Modal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    Belum ada data modal yang tercatat.
                  </td>
                </tr>
              )}
            </tbody>
            {filteredEntries.length > 0 && (
              <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-xs text-slate-800">
                <tr>
                  <td colSpan={3} className="py-4 px-4 text-slate-700 uppercase tracking-wider">
                    Total Modal Aktif Sesuai Filter:
                  </td>
                  <td className="py-4 px-4 text-right font-black text-blue-900 text-sm">
                    {formatRupiah(totalFilteredCapital)}
                  </td>
                  <td colSpan={2} className="py-4 px-4 text-slate-500 text-[11px]">
                    {filteredEntries.length} Entri Modal
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ================= MODAL FORM TAMBAH/EDIT MODAL ================= */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                {editingEntry ? 'Edit Data Modal' : 'Tambah Modal Baru BRILink'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Masukkan detail tanggal masuk, sumber suntikan dana, dan nominal.
              </p>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Tanggal Masuk Modal *</label>
                <input
                  type="date"
                  required
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Sumber Modal *</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Kas Induk Pemilik, Rekening BRI, Tambahan Saldo"
                  value={entrySource}
                  onChange={(e) => setEntrySource(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nominal Modal (Rp) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={entryAmount}
                  onChange={(e) => setEntryAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500 font-bold"
                />
                <div className="text-[11px] text-blue-700 font-bold">
                  {formatRupiah(entryAmount)}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Catatan Operasional (Opsional)</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan alokasi modal..."
                  value={entryNotes}
                  onChange={(e) => setEntryNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20"
                >
                  Simpan Modal
                </button>
              </div>
            </form>
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
              <h3 className="text-base font-bold text-slate-900">Konfirmasi Hapus Modal</h3>
              <p className="text-xs text-slate-500 mt-1">
                Hapus entri modal &ldquo;<strong>{deleteConfirm.source}</strong>&rdquo; sebesar {formatRupiah(deleteConfirm.amount)}?
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
                onClick={handleDelete}
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
