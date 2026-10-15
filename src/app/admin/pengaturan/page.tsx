'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  Store,
  MapPin,
  Phone,
  MessageSquare,
  Clock,
  Navigation,
  Eye,
  CheckCircle,
  AlertCircle,
  Save,
  Globe,
  Download,
  Upload,
  Database,
  Trash2,
  AlertTriangle,
  FileJson,
  X,
  RefreshCw,
} from 'lucide-react';
import { dataService } from '@/lib/services/dataService';
import { StoreSettings } from '@/lib/types/database';

export default function PengaturanTokoPage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [storeName, setStoreName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [operationalHours, setOperationalHours] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');
  const [showStock, setShowStock] = useState(false);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Backup, Restore & Reset State
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [dataActionMsg, setDataActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const restoreFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const data = await dataService.getStoreSettings();
        setSettings(data);
        setStoreName(data.store_name);
        setTagline(data.tagline);
        setDescription(data.description);
        setAddress(data.address);
        setPhone(data.phone);
        setWhatsapp(data.whatsapp);
        setOperationalHours(data.operational_hours);
        setMapsUrl(data.maps_url || '');
        setShowStock(data.show_stock_to_public);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSaving(true);

    try {
      await dataService.updateStoreSettings({
        store_name: storeName.trim(),
        tagline: tagline.trim(),
        description: description.trim(),
        address: address.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim(),
        operational_hours: operationalHours.trim(),
        maps_url: mapsUrl.trim(),
        show_stock_to_public: showStock,
      });

      setSuccessMsg('Pengaturan profil toko berhasil diperbarui.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan pengaturan toko.');
    } finally {
      setSaving(false);
    }
  };

  // Unduh Backup Data (.json)
  const handleDownloadBackup = async () => {
    try {
      setBackupLoading(true);
      setDataActionMsg(null);
      const jsonStr = await dataService.exportBackup();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      const filename = `backup_vr_store_${dateStr}_${timeStr}.json`;

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDataActionMsg({
        type: 'success',
        text: `File cadangan berhasil diunduh: ${filename}`,
      });
    } catch (err: any) {
      setDataActionMsg({
        type: 'error',
        text: err.message || 'Gagal mengekspor file cadangan.',
      });
    } finally {
      setBackupLoading(false);
    }
  };

  // Unggah & Pulihkan Data (.json)
  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setDataActionMsg({
        type: 'error',
        text: 'Format file tidak didukung. Harap pilih file cadangan dengan ekstensi .json.',
      });
      return;
    }

    const confirmRestore = window.confirm(
      `Peringatan Pemulihan Data:\n\nApakah Anda yakin ingin memulihkan data dari file "${file.name}"?\nData yang ada saat ini di browser akan digantikan dengan isi file cadangan tersebut.`
    );

    if (!confirmRestore) {
      if (restoreFileRef.current) restoreFileRef.current.value = '';
      return;
    }

    try {
      setRestoreLoading(true);
      setDataActionMsg(null);
      const text = await file.text();
      const result = await dataService.importBackup(text);

      if (result.success) {
        setDataActionMsg({
          type: 'success',
          text: `${result.message} Memperbarui data dan memuat ulang halaman...`,
        });
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setDataActionMsg({
          type: 'error',
          text: result.message,
        });
      }
    } catch (err: any) {
      setDataActionMsg({
        type: 'error',
        text: err.message || 'Gagal membaca file cadangan.',
      });
    } finally {
      setRestoreLoading(false);
      if (restoreFileRef.current) restoreFileRef.current.value = '';
    }
  };

  // Kosongkan Data Contoh (Reset ke Awal)
  const handleResetData = async () => {
    if (confirmInput.trim().toUpperCase() !== 'KOSONGKAN') {
      return;
    }

    try {
      setResetLoading(true);
      const result = await dataService.resetToEmpty();
      if (result.success) {
        setShowResetModal(false);
        setConfirmInput('');
        setDataActionMsg({
          type: 'success',
          text: `${result.message} Memuat ulang tampilan sistem...`,
        });
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setDataActionMsg({
          type: 'error',
          text: result.message,
        });
      }
    } catch (err: any) {
      setDataActionMsg({
        type: 'error',
        text: err.message || 'Gagal mengosongkan data.',
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6 pb-16">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full w-fit border border-slate-200">
          <Settings className="w-3.5 h-3.5 text-slate-500" />
          <span>Konfigurasi Toko</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">
          Pengaturan Toko & Informasi Publik
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Kelola identitas, alamat, kontak WhatsApp, jam operasional, dan visibilitas stok yang ditampilkan kepada pelanggan.
        </p>
      </div>

      {/* Success Alert */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Data Action Alert (Backup/Restore/Reset) */}
      {dataActionMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
            dataActionMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-700'
          }`}
        >
          {dataActionMsg.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{dataActionMsg.text}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 h-96 animate-pulse" />
      ) : (
        <>
          <form onSubmit={handleSave} className="space-y-6">
          {/* Card 1: Identitas Toko */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <Store className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">Identitas Brand Toko</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nama Toko *</label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-emerald-500 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Slogan / Tagline *</label>
                <input
                  type="text"
                  required
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="font-bold text-slate-700">Deskripsi Singkat Toko *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Alamat & Kontak */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <MapPin className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">Alamat & Nomor Kontak</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2 space-y-1">
                <label className="font-bold text-slate-700">Alamat Lengkap Toko *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nomor WhatsApp Pelanggan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 6281234567890"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-400">Gunakan format angka dengan awalan 62</span>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nomor Telepon Toko *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 081234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Jam Operasional *</label>
                <input
                  type="text"
                  required
                  placeholder="Setiap Hari: 07:30 - 22:00 WITA"
                  value={operationalHours}
                  onChange={(e) => setOperationalHours(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Tautan Google Maps</label>
                <input
                  type="url"
                  placeholder="https://maps.google.com/..."
                  value={mapsUrl}
                  onChange={(e) => setMapsUrl(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Visibilitas Stok Produk */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <Eye className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">Visibilitas Katalog Publik</h2>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <input
                type="checkbox"
                id="showStockCheckbox"
                checked={showStock}
                onChange={(e) => setShowStock(e.target.checked)}
                className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 mt-0.5 cursor-pointer"
              />
              <label htmlFor="showStockCheckbox" className="text-xs text-slate-700 cursor-pointer space-y-0.5">
                <span className="font-bold block text-slate-900">
                  Tampilkan Jumlah Sisa Stok Barang kepada Pelanggan
                </span>
                <span className="text-slate-500 block leading-relaxed">
                  Jika opsi ini dicentang, angka stok barang akan tampil di kartu katalog publik. Jika tidak dicentang, pelanggan hanya melihat status barang tersedia tanpa mengetahui jumlah stok riil.
                </span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 disabled:opacity-50 transition-all cursor-pointer"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan Pengaturan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan Pengaturan</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Card 4: Backup & Restore Data */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-200/80 shadow-xs space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Cadangan & Pemulihan Data (Backup & Restore)
              </h2>
              <p className="text-xs text-slate-500">
                Amankan seluruh basis data (katalog produk, transaksi BRILink, modal, dividen, dan pengaturan) dalam file JSON terstruktur.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Backup Card */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-blue-700 font-bold text-xs">
                  <Download className="w-4 h-4" />
                  <span>Backup Data Toko (.json)</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Unduh seluruh data produk, kategori, modal, transaksi harian BRILink, dan investor saat ini menjadi file cadangan .json ke perangkat Anda.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadBackup}
                disabled={backupLoading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {backupLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Mempersiapkan File...</span>
                  </>
                ) : (
                  <>
                    <FileJson className="w-4 h-4" />
                    <span>Unduh File Cadangan (.json)</span>
                  </>
                )}
              </button>
            </div>

            {/* Restore Card */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
                  <Upload className="w-4 h-4" />
                  <span>Restore Data Toko (.json)</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Pulihkan seluruh data toko dari file cadangan .json yang pernah diunduh sebelumnya. Data saat ini di browser akan digantikan dengan isi file backup.
                </p>
              </div>

              <div>
                <input
                  ref={restoreFileRef}
                  type="file"
                  accept=".json"
                  onChange={handleRestoreFile}
                  className="hidden"
                  id="restoreFileInput"
                />
                <label
                  htmlFor="restoreFileInput"
                  className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer ${
                    restoreLoading ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  {restoreLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Memproses Pemulihan...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Pilih File Backup untuk Dipulihkan</span>
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Card 5: Zona Keamanan Data (Reset Dummy) */}
        <div className="bg-rose-50/60 rounded-3xl p-6 sm:p-8 border border-rose-200 shadow-xs space-y-4">
          <div className="flex items-start gap-3 border-b border-rose-200/80 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-rose-900">
                Zona Pengosongan Data Contoh (Reset ke Awal)
              </h2>
              <p className="text-xs text-rose-700 leading-relaxed">
                Gunakan fitur ini ketika Anda sudah siap menginput data riil toko V_R Store dan ingin menghapus seluruh data contoh (dummy data) bawaan sistem.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-rose-800">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>Menghapus seluruh barang & stok dummy (0 barang)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>Mengosongkan riwayat kas & transaksi harian BRILink</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>Mengosongkan daftar investor & modal contoh</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-800 font-semibold">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Kategori standar & pengaturan toko tetap tersimpan</span>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setConfirmInput('');
                setShowResetModal(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Kosongkan Data Contoh (Reset ke Awal)</span>
            </button>
          </div>
        </div>
      </>
      )}

      {/* Safety Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    Konfirmasi Pengosongan Data
                  </h3>
                  <p className="text-[11px] text-slate-500">Tindakan ini memerlukan verifikasi keamanan</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1">
                <p className="font-bold">Perhatian Penting:</p>
                <p className="text-[11px] leading-relaxed">
                  Tindakan ini akan <strong>MENGHAPUS SEMUA DATA DUMMY</strong> (produk, stok, modal, transaksi BRILink, dan investor). Data yang telah dihapus tidak dapat dikembalikan kecuali Anda sudah mengunduh file cadangan (.json).
                </p>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="font-bold text-slate-700 block">
                  Ketik kata <span className="text-rose-600 font-mono">KOSONGKAN</span> untuk melanjutkan:
                </label>
                <input
                  type="text"
                  placeholder="KOSONGKAN"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold tracking-wider outline-none focus:border-rose-500 uppercase text-center"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={confirmInput.trim().toUpperCase() !== 'KOSONGKAN' || resetLoading}
                onClick={handleResetData}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {resetLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Mengosongkan...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Kosongkan Data Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
