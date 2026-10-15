'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  PieChart,
  Plus,
  Calendar,
  Download,
  FileText,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  ShieldCheck,
  UserCheck,
  HelpCircle,
} from 'lucide-react';
import { dataService } from '@/lib/services/dataService';
import { Investor } from '@/lib/types/database';
import { formatRupiah } from '@/lib/utils/currency';
import { formatDateID, MONTH_NAMES_ID } from '@/lib/utils/date';
import { generateInvestorCommissions } from '@/lib/utils/calculations';
import { exportInvestorsToExcel } from '@/lib/utils/exportExcel';
import { exportInvestorsToPdf } from '@/lib/utils/exportPdf';

export default function DividenBrilinkPage() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter Periode Bulan & Tahun untuk Melihat Pengakuan Komisi
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());

  // Modal Tambah / Edit Investor
  const [modalOpen, setModalOpen] = useState(false);
  const [editingInvestor, setEditingInvestor] = useState<Investor | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Modal Penghentian / Pengembalian Investasi
  const [terminateModalOpen, setTerminateModalOpen] = useState(false);
  const [terminatingInvestor, setTerminatingInvestor] = useState<Investor | null>(null);
  const [terminationDate, setTerminationDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnedAmount, setReturnedAmount] = useState<number>(0);

  // Success Alert
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await dataService.getInvestors();
      setInvestors(data);
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

  const handleOpenModal = (inv?: Investor) => {
    setFormError('');
    if (inv) {
      setEditingInvestor(inv);
      setName(inv.name);
      setAmount(inv.investment_amount);
      setJoinDate(inv.join_date);
      setNotes(inv.notes || '');
    } else {
      setEditingInvestor(null);
      setName('');
      setAmount(10000000);
      setJoinDate(new Date().toISOString().split('T')[0]);
      setNotes('');
    }
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Nama investor harus diisi.');
      return;
    }
    if (amount <= 0) {
      setFormError('Jumlah pokok investasi harus lebih besar dari Rp 0.');
      return;
    }
    if (!joinDate) {
      setFormError('Tanggal masuk investasi harus diisi.');
      return;
    }

    try {
      if (editingInvestor) {
        await dataService.updateInvestor(editingInvestor.id, {
          name: name.trim(),
          investment_amount: amount,
          join_date: joinDate,
          notes: notes.trim(),
        });
        notify(`Data investor "${name}" berhasil diperbarui.`);
      } else {
        await dataService.createInvestor({
          name: name.trim(),
          investment_amount: amount,
          join_date: joinDate,
          notes: notes.trim(),
          status: 'active',
        });
        notify(`Investor baru "${name}" berhasil didaftarkan.`);
      }

      setModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan data investor.');
    }
  };

  // Penghentian Investasi
  const handleOpenTerminate = (inv: Investor) => {
    setTerminatingInvestor(inv);
    setTerminationDate(new Date().toISOString().split('T')[0]);
    setReturnedAmount(inv.investment_amount);
    setTerminateModalOpen(true);
  };

  const handleConfirmTerminate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminatingInvestor) return;

    try {
      await dataService.terminateInvestor(terminatingInvestor.id, terminationDate, returnedAmount);
      notify(`Investasi "${terminatingInvestor.name}" telah dihentikan/dikembalikan.`);
      setTerminateModalOpen(false);
      setTerminatingInvestor(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghentikan investasi.');
    }
  };

  const activeInvestors = investors.filter((i) => i.status === 'active');
  const totalActivePrincipal = activeInvestors.reduce(
    (sum, i) => sum + (Number(i.investment_amount) || 0),
    0
  );

  const totalAllTimeCommissions = investors.reduce(
    (sum, i) => sum + (Number(i.total_commission_earned) || 0),
    0
  );

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-800 bg-blue-50 px-3 py-1 rounded-full w-fit border border-blue-200">
            <PieChart className="w-3.5 h-3.5 text-blue-600" />
            <span>BRILink &bull; Sub-Menu Dividen (Laporan Investasi)</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">
            Laporan Dividen & Komisi Investor
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Perhitungan bagi hasil investasi dengan ketentuan komisi 0,5% per bulan penuh terhitung dari tanggal masuk.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportInvestorsToExcel(investors)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-xs transition-all"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Ekspor Excel</span>
          </button>
          <button
            onClick={() => exportInvestorsToPdf(investors)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-xs transition-all"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            <span>Ekspor PDF</span>
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Investor</span>
          </button>
        </div>
      </div>

      {/* Ketentuan Aturan Logika Dividen */}
      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-950 text-xs space-y-1.5 leading-relaxed">
        <div className="flex items-center gap-2 font-bold text-blue-900 text-sm">
          <HelpCircle className="w-4 h-4 text-blue-600" />
          <span>Aturan Logika Komisi Investor:</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
          <li>
            <strong>Rumus Dasar:</strong> Komisi per bulan = <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 font-bold text-blue-800">Jumlah Investasi × 0,5% (0.005)</code>.
          </li>
          <li>
            <strong>Syarat Kondisi Bulan Penuh:</strong> Jika durasi investasi <strong>kurang dari 1 bulan (&lt; 30 hari)</strong>, komisi tidak terhitung (<code className="bg-white px-1.5 py-0.5 rounded border border-rose-200 text-rose-700 font-bold">Rp 0</code> / Status: <em>&ldquo;Belum Cukup 1 Bulan&rdquo;</em>).
          </li>
          <li>
            Jika sudah <strong>&ge; 1 bulan</strong>, sistem menampilkan komisi per bulan beserta total akumulasi komisi yang diperoleh.
          </li>
        </ul>
      </div>

      {/* Success Alert */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total Pokok Investasi Aktif
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {formatRupiah(totalActivePrincipal)}
          </div>
          <p className="text-[11px] text-slate-400">
            Dari {activeInvestors.length} investor yang saat ini aktif
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Tarif Komisi Standar
          </span>
          <div className="text-xl sm:text-2xl font-black text-blue-700">
            0,5% <span className="text-xs font-bold text-slate-500">/ bulan penuh</span>
          </div>
          <p className="text-[11px] text-slate-400">Diberikan setelah mencapai jatuh tempo bulanan</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total Seluruh Komisi Tercatat
          </span>
          <div className="text-xl sm:text-2xl font-black text-emerald-700">
            {formatRupiah(totalAllTimeCommissions)}
          </div>
          <p className="text-[11px] text-slate-400">Akumulasi komisi yang telah genap bulan</p>
        </div>
      </div>

      {/* TABEL LAPORAN INVESTASI & DIVIDEN */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Nama Investor</th>
                <th className="py-3 px-4 text-right">Jumlah Investasi (Rp)</th>
                <th className="py-3 px-4">Tanggal Masuk</th>
                <th className="py-3 px-4 text-center">Durasi / Status Bulan</th>
                <th className="py-3 px-4 text-right">Komisi yang Diperoleh / Bulan (Rp)</th>
                <th className="py-3 px-4 text-right">Total Akumulasi Komisi (Rp)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {investors.length > 0 ? (
                investors.map((inv, idx) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div>{inv.name}</div>
                      {inv.notes && <div className="text-[10px] text-slate-400 font-normal">{inv.notes}</div>}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-800">
                      {formatRupiah(inv.investment_amount)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {formatDateID(inv.join_date, false)}
                    </td>
                    {/* Durasi / Status Bulan */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`font-bold px-2.5 py-1 rounded-full text-[11px] inline-block ${
                          inv.is_eligible_full_month
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {inv.duration_status_text || 'Menghitung...'}
                      </span>
                    </td>
                    {/* Komisi yang Diperoleh / Bulan */}
                    <td className="py-3.5 px-4 text-right font-bold">
                      {inv.is_eligible_full_month ? (
                        <span className="text-blue-700 font-black">
                          {formatRupiah(inv.monthly_commission)}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-semibold italic">
                          Rp 0 (Belum Cukup 1 Bulan)
                        </span>
                      )}
                    </td>
                    {/* Total Akumulasi Komisi */}
                    <td className="py-3.5 px-4 text-right font-black text-emerald-700">
                      {formatRupiah(inv.total_commission_earned)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {inv.status === 'active' ? 'Aktif' : 'Selesai'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleOpenModal(inv)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                          title="Edit Investor"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {inv.status === 'active' && (
                          <button
                            onClick={() => handleOpenTerminate(inv)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50"
                            title="Penghentian / Kembalikan Pokok"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Belum ada data investor yang terdaftar.
                  </td>
                </tr>
              )}
            </tbody>
            {investors.length > 0 && (
              <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-xs">
                <tr>
                  <td colSpan={2} className="py-3.5 px-4 uppercase text-slate-700">
                    TOTAL KESELURUHAN:
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-slate-900 text-sm">
                    {formatRupiah(investors.reduce((sum, i) => sum + (Number(i.investment_amount) || 0), 0))}
                  </td>
                  <td colSpan={3}></td>
                  <td className="py-3.5 px-4 text-right font-black text-emerald-800 text-sm">
                    {formatRupiah(totalAllTimeCommissions)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ================= MODAL TAMBAH/EDIT INVESTOR ================= */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                {editingInvestor ? 'Edit Data Investor' : 'Tambah Investor Baru'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Komisi 0,5% dihitung otomatis jika durasi telah genap &ge; 1 bulan.
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
                <label className="font-bold text-slate-700">Nama Investor *</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: H. Sudirman"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Jumlah Investasi (Rp) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500 font-bold"
                />
                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="font-bold text-slate-700">{formatRupiah(amount)}</span>
                  <span className="text-blue-700 font-semibold">
                    Tarif 0.5%: {formatRupiah(amount * 0.005)} / bln
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Tanggal Masuk Investasi *</label>
                <input
                  type="date"
                  required
                  value={joinDate}
                  onChange={(e) => setJoinDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500 font-medium"
                />
                <p className="text-[10px] text-slate-400">
                  Tanggal ini digunakan untuk menghitung apakah durasi sudah genap &ge; 1 bulan.
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Catatan (Opsional)</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan alokasi modal / perjanjian..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                  Simpan Investor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL HENTIKAN INVESTASI ================= */}
      {terminateModalOpen && terminatingInvestor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-base font-black text-slate-900">Penghentian Investasi</h3>
              <p className="text-xs text-slate-500">Investor: {terminatingInvestor.name}</p>
            </div>

            <form onSubmit={handleConfirmTerminate} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Tanggal Penghentian *</label>
                <input
                  type="date"
                  required
                  value={terminationDate}
                  onChange={(e) => setTerminationDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nominal Pokok yang Dikembalikan (Rp) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={returnedAmount}
                  onChange={(e) => setReturnedAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none"
                />
                <div className="text-[10px] text-slate-500">{formatRupiah(returnedAmount)}</div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTerminateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20"
                >
                  Konfirmasi Penghentian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
