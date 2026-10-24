'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
  FolderPlus,
  Download,
  Boxes,
  SlidersHorizontal,
  Camera,
  CameraOff,
  RefreshCw,
  Check,
  Image as ImageIcon,
  SwitchCamera,
  X,
} from 'lucide-react';
import { dataService } from '@/lib/services/dataService';
import { Product, ProductCategory } from '@/lib/types/database';
import { formatRupiah } from '@/lib/utils/currency';
import { exportProductsToExcel } from '@/lib/utils/exportExcel';
import {
  compressImageSource,
  captureVideoFrame,
  validateImageFile,
} from '@/lib/utils/image';

export default function AturBarangPage() {
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState('ALL');

  // Modal State Produk
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodCatId, setProdCatId] = useState('');
  const [prodPrice, setProdPrice] = useState<number>(0);
  const [prodStock, setProdStock] = useState<number>(0);
  const [prodImageUrl, setProdImageUrl] = useState('');
  const [prodActive, setProdActive] = useState(true);
  const [prodError, setProdError] = useState('');

  // Camera & Image Upload States
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [isCompressingImage, setIsCompressingImage] = useState(false);

  // Refs untuk Media Stream dan File Input
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

  // Modal State Kategori
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catError, setCatError] = useState('');

  // Delete Confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'product' | 'category';
    id: string;
    name: string;
  } | null>(null);

  // Success Notification
  const [successMessage, setSuccessMessage] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [cats, prods] = await Promise.all([
        dataService.getCategories(),
        dataService.getProducts(),
      ]);
      setCategories(cats);
      setProducts(prods);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // ================= CAMERA & IMAGE HANDLERS =================
  const stopCameraStream = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      cameraStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    setCameraError('');
    setCameraLoading(true);
    setCapturedPhoto(null);
    stopCameraStream();

    if (typeof window === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        'Kamera browser tidak didukung atau memerlukan koneksi aman (HTTPS). Silakan gunakan opsi unggah file atau Kamera HP bawaan.'
      );
      setCameraLoading(false);
      setIsCameraActive(true);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      cameraStreamRef.current = stream;
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoDevices.length > 1);
      } catch {
        setHasMultipleCameras(false);
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setIsCameraActive(true);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError(
          'Izin akses kamera ditolak. Berikan izin kamera pada ikon gembok browser atau gunakan opsi "Pilih Galeri / Kamera HP".'
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('Kamera tidak terdeteksi pada perangkat Anda. Silakan pilih gambar dari galeri perangkat.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError('Kamera sedang digunakan oleh aplikasi lain. Tutup aplikasi tersebut dan coba lagi.');
      } else {
        setCameraError(`Gagal mengakses kamera: ${err.message || 'Terjadi gangguan sistem'}`);
      }
    } finally {
      setCameraLoading(false);
    }
  };

  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    try {
      const snapshot = captureVideoFrame(videoRef.current, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.8,
      });
      setCapturedPhoto(snapshot);
    } catch (err: any) {
      setCameraError(`Gagal mengambil foto: ${err.message}`);
    }
  };

  const handleRetakePhoto = () => {
    setCapturedPhoto(null);
    if (videoRef.current && cameraStreamRef.current) {
      videoRef.current.play().catch(() => {});
    } else {
      startCamera(facingMode);
    }
  };

  const handleApplyCapturedPhoto = () => {
    if (capturedPhoto) {
      setProdImageUrl(capturedPhoto);
      setProdError('');
    }
    stopCameraStream();
    setIsCameraActive(false);
    setCapturedPhoto(null);
  };

  const handleCloseCamera = () => {
    stopCameraStream();
    setIsCameraActive(false);
    setCapturedPhoto(null);
    setCameraError('');
  };

  // Pastikan stream terhubung saat elemen video kamera selesai render
  useEffect(() => {
    if (isCameraActive && videoRef.current && cameraStreamRef.current && !capturedPhoto) {
      videoRef.current.srcObject = cameraStreamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [isCameraActive, capturedPhoto]);

  // Hentikan media stream saat unmount atau berpindah halaman
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // ================= PRODUK HANDLERS =================
  const handleOpenProductModal = (prod?: Product) => {
    stopCameraStream();
    setIsCameraActive(false);
    setCapturedPhoto(null);
    setCameraError('');
    setProdError('');
    if (prod) {
      setEditingProduct(prod);
      setProdName(prod.name);
      setProdCatId(prod.category_id);
      setProdPrice(prod.price);
      setProdStock(prod.stock);
      setProdImageUrl(prod.image_url || '');
      setProdActive(prod.is_active);
    } else {
      setEditingProduct(null);
      setProdName('');
      setProdCatId(categories[0]?.id || '');
      setProdPrice(10000);
      setProdStock(10);
      setProdImageUrl('');
      setProdActive(true);
    }
    setProductModalOpen(true);
  };

  const handleCloseProductModal = () => {
    stopCameraStream();
    setIsCameraActive(false);
    setCapturedPhoto(null);
    setCameraError('');
    setProductModalOpen(false);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setProdError('');

    if (!prodName.trim()) {
      setProdError('Nama barang harus diisi.');
      return;
    }
    if (!prodCatId) {
      setProdError('Harap pilih kategori barang.');
      return;
    }
    if (prodPrice < 0) {
      setProdError('Harga tidak boleh bernilai negatif.');
      return;
    }
    if (prodStock < 0) {
      setProdError('Jumlah stok tidak boleh bernilai negatif.');
      return;
    }

    try {
      const selectedCategory = categories.find((c) => c.id === prodCatId);

      if (editingProduct) {
        await dataService.updateProduct(editingProduct.id, {
          name: prodName.trim(),
          category_id: prodCatId,
          category_name: selectedCategory?.name,
          price: prodPrice,
          stock: prodStock,
          image_url: prodImageUrl.trim() || null,
          is_active: prodActive,
        });
        showNotification(`Barang "${prodName}" berhasil diperbarui.`);
      } else {
        await dataService.createProduct({
          name: prodName.trim(),
          category_id: prodCatId,
          category_name: selectedCategory?.name,
          price: prodPrice,
          stock: prodStock,
          image_url: prodImageUrl.trim() || null,
          is_active: prodActive,
        });
        showNotification(`Barang baru "${prodName}" berhasil ditambahkan.`);
      }

      handleCloseProductModal();
      loadData();
    } catch (err: any) {
      setProdError(err.message || 'Gagal menyimpan barang.');
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file, 10 * 1024 * 1024);
    if (!validation.valid) {
      setProdError(validation.error || 'File tidak valid.');
      return;
    }

    try {
      setIsCompressingImage(true);
      setProdError('');
      const compressed = await compressImageSource(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.8,
      });
      setProdImageUrl(compressed);
    } catch (err: any) {
      console.error('Failed to compress image:', err);
      setProdError('Gagal memproses gambar. Silakan coba file lain.');
    } finally {
      setIsCompressingImage(false);
      e.target.value = '';
    }
  };

  // ================= KATEGORI HANDLERS =================
  const handleOpenCatModal = (cat?: ProductCategory) => {
    setCatError('');
    if (cat) {
      setEditingCategory(cat);
      setCatName(cat.name);
    } else {
      setEditingCategory(null);
      setCatName('');
    }
    setCatModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatError('');

    if (!catName.trim()) {
      setCatError('Nama kelompok kategori harus diisi.');
      return;
    }

    const slug = catName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

    try {
      if (editingCategory) {
        await dataService.updateCategory(editingCategory.id, {
          name: catName.trim(),
          slug,
        });
        showNotification(`Kategori "${catName}" berhasil diperbarui.`);
      } else {
        await dataService.createCategory({
          name: catName.trim(),
          slug,
          sort_order: categories.length + 1,
          is_active: true,
        });
        showNotification(`Kategori baru "${catName}" berhasil dibuat dan otomatis terhubung ke katalog.`);
      }

      setCatModalOpen(false);
      loadData();
    } catch (err: any) {
      setCatError(err.message || 'Gagal menyimpan kategori.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      if (deleteConfirm.type === 'product') {
        await dataService.deleteProduct(deleteConfirm.id);
        showNotification(`Barang "${deleteConfirm.name}" berhasil dihapus.`);
      } else {
        await dataService.deleteCategory(deleteConfirm.id);
        showNotification(`Kategori "${deleteConfirm.name}" berhasil dihapus.`);
      }
      setDeleteConfirm(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus data.');
      setDeleteConfirm(null);
    }
  };

  const displayedProducts = products.filter((p) => {
    if (p.is_deleted) return false;
    if (selectedCatFilter !== 'ALL' && p.category_id !== selectedCatFilter) return false;
    if (searchQuery.trim() && !p.name.toLowerCase().includes(searchQuery.toLowerCase().trim())) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Atur Barang & Kelompok Kategori
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Kelola inventaris barang toko dan kelompok kategori yang otomatis tersinkronisasi ke katalog publik.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'products' ? (
            <>
              <button
                onClick={() => exportProductsToExcel(displayedProducts)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-xs transition-all"
              >
                <Download className="w-4 h-4 text-blue-600" />
                <span>Ekspor Excel</span>
              </button>
              <button
                onClick={() => handleOpenProductModal()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Barang</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => handleOpenCatModal()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" />
              <span>+ Tambah Kelompok Barang</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Tabs Navigasi */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'products'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Manajemen Data Barang ({products.filter((p) => !p.is_deleted).length})</span>
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'categories'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Kelompok Barang / Kategori ({categories.length})</span>
        </button>
      </div>

      {/* TAB 1: DAFTAR BARANG */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Filter & Pencarian */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama barang..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedCatFilter}
                onChange={(e) => setSelectedCatFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 outline-none"
              >
                <option value="ALL">Semua Kelompok</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabel Produk */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4 w-16 text-center">Foto</th>
                    <th className="py-3 px-4">Nama Barang</th>
                    <th className="py-3 px-4">Kelompok / Kategori</th>
                    <th className="py-3 px-4 text-right">Harga (Rp)</th>
                    <th className="py-3 px-4 text-center">Jumlah / Stok</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {displayedProducts.length > 0 ? (
                    displayedProducts.map((p, idx) => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden mx-auto border border-slate-200">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={p.image_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100'}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">{p.name}</td>
                        <td className="py-3 px-4 text-slate-600 font-semibold">{p.category_name}</td>
                        <td className="py-3 px-4 text-right font-black text-blue-700">
                          {formatRupiah(p.price)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`font-bold px-2 py-0.5 rounded-full ${
                              p.stock <= 5
                                ? 'bg-rose-100 text-rose-700'
                                : p.stock <= 15
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {p.stock} unit
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              p.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {p.is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleOpenProductModal(p)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                              title="Edit Barang"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                setDeleteConfirm({
                                  type: 'product',
                                  id: p.id,
                                  name: p.name,
                                })
                              }
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                              title="Hapus Barang"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                        Tidak ada barang yang sesuai.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KELOMPOK BARANG / KATEGORI */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Nama Kelompok Kategori</th>
                  <th className="py-3 px-4">Slug URL Filter</th>
                  <th className="py-3 px-4 text-center">Jumlah Barang Terkait</th>
                  <th className="py-3 px-4 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {categories.map((c, idx) => {
                  const prodCount = products.filter((p) => p.category_id === c.id && !p.is_deleted).length;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{c.name}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{c.slug}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                          {prodCount} barang
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleOpenCatModal(c)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                            title="Edit Kategori"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteConfirm({
                                type: 'category',
                                id: c.id,
                                name: c.name,
                              })
                            }
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                            title="Hapus Kategori"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODAL TAMBAH/EDIT PRODUK ================= */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {editingProduct ? 'Edit Data Barang' : 'Tambah Barang Baru'}
                </h3>
                <p className="text-xs text-slate-500">
                  Isi form lengkap data barang untuk ditampilkan di katalog toko.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseProductModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                title="Tutup Form"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {prodError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{prodError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nama Barang *</label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="Misal: Buku Tulis Sidu 38 Lembar"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Kelompok / Kategori *</label>
                <select
                  required
                  value={prodCatId}
                  onChange={(e) => setProdCatId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500 bg-white font-semibold"
                >
                  <option value="">Pilih Kelompok Barang...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Harga (Rp) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500 font-bold"
                  />
                  <div className="text-[10px] text-blue-700 font-bold">
                    {formatRupiah(prodPrice)}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Jumlah / Stok *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={prodStock}
                    onChange={(e) => setProdStock(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500 font-bold"
                  />
                </div>
              </div>

              {/* Gambar Barang (Kamera Langsung, Galeri, atau URL) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">Foto / Gambar Barang</label>
                  {prodImageUrl && !isCameraActive && (
                    <button
                      type="button"
                      onClick={() => setProdImageUrl('')}
                      className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
                    >
                      Hapus Foto
                    </button>
                  )}
                </div>

                {/* TAMPILAN KAMERA AKTIF */}
                {isCameraActive ? (
                  <div className="rounded-2xl border-2 border-blue-500 bg-slate-950 p-3 text-white space-y-3 animate-in fade-in zoom-in-95">
                    {/* Viewport Kamera Video / Captured Snapshot */}
                    <div className="relative aspect-video sm:aspect-4/3 w-full rounded-xl overflow-hidden bg-black flex items-center justify-center border border-slate-800">
                      {cameraLoading && (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 gap-2">
                          <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
                          <span className="text-xs font-semibold text-slate-200">Menghubungkan ke kamera...</span>
                        </div>
                      )}

                      {cameraError ? (
                        <div className="p-4 text-center space-y-3 z-10 max-w-xs">
                          <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
                            <CameraOff className="w-5 h-5" />
                          </div>
                          <p className="text-xs text-rose-300 font-medium leading-relaxed">{cameraError}</p>
                          <div className="flex flex-col gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => nativeCameraInputRef.current?.click()}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition-colors cursor-pointer"
                            >
                              Buka Kamera Bawaan HP
                            </button>
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors cursor-pointer"
                            >
                              Pilih dari Galeri / File
                            </button>
                          </div>
                        </div>
                      ) : capturedPhoto ? (
                        // Pratinjau Foto Jepretan
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={capturedPhoto} alt="Hasil Foto" className="w-full h-full object-contain" />
                      ) : (
                        // Live Stream Video
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                      )}

                      {/* Overlay Badges */}
                      {!cameraError && (
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-white border border-white/10">
                          {capturedPhoto ? (
                            <>
                              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                              <span>Foto Siap Dipakai</span>
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                              <span>Live Kamera ({facingMode === 'environment' ? 'Belakang' : 'Depan'})</span>
                            </>
                          )}
                        </div>
                      )}

                      {/* Tombol Balik Kamera (Depan / Belakang) */}
                      {!cameraError && !capturedPhoto && (
                        <button
                          type="button"
                          onClick={toggleFacingMode}
                          title="Balik Kamera (Depan / Belakang)"
                          className="absolute top-2.5 right-2.5 p-2 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md text-white border border-white/20 transition-all cursor-pointer"
                        >
                          <SwitchCamera className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Tombol Kontrol Kamera */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      {capturedPhoto ? (
                        <>
                          <button
                            type="button"
                            onClick={handleRetakePhoto}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Ulangi Foto</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleApplyCapturedPhoto}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-md shadow-emerald-600/30 transition-colors cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            <span>Gunakan Foto</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={handleCloseCamera}
                            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
                          >
                            Tutup Kamera
                          </button>
                          {!cameraError && (
                            <button
                              type="button"
                              onClick={handleCapturePhoto}
                              disabled={cameraLoading}
                              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-black text-white shadow-lg shadow-blue-600/40 transition-all cursor-pointer active:scale-95"
                            >
                              <Camera className="w-4 h-4" />
                              <span>Ambil Foto</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  /* TAMPILAN NORMAL: PRATINJAU FOTO & PILIHAN SUMBER */
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      {/* Box Pratinjau Foto */}
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-200 overflow-hidden shrink-0 flex items-center justify-center group">
                        {isCompressingImage ? (
                          <div className="flex flex-col items-center justify-center gap-1 text-blue-600 p-1 text-center">
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            <span className="text-[9px] font-bold">Mengompres...</span>
                          </div>
                        ) : prodImageUrl ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={prodImageUrl} alt="Preview Produk" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setProdImageUrl('')}
                              className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity text-[10px] font-bold cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 text-rose-300" />
                              <span>Hapus</span>
                            </button>
                          </>
                        ) : (
                          <div className="text-center p-2 text-slate-400">
                            <Package className="w-7 h-7 mx-auto mb-0.5 opacity-50" />
                            <span className="text-[9px] font-semibold leading-tight block">Tanpa Foto</span>
                          </div>
                        )}
                      </div>

                      {/* Tombol-tombol Sumber Foto */}
                      <div className="flex-1 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          {/* Tombol Buka Kamera */}
                          <button
                            type="button"
                            onClick={() => startCamera('environment')}
                            className="inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs shadow-blue-600/20 transition-all cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Buka Kamera</span>
                          </button>

                          {/* Tombol Pilih File Galeri */}
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                          >
                            <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                            <span>Pilih Galeri</span>
                          </button>
                        </div>

                        {/* Opsi Kamera HP Native */}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                          <button
                            type="button"
                            onClick={() => nativeCameraInputRef.current?.click()}
                            className="font-semibold text-blue-700 hover:text-blue-900 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>Atau Kamera HP Bawaan</span>
                          </button>
                          {prodImageUrl && (
                            <span className="text-[10px] font-semibold text-emerald-600">
                              ✓ Foto Tersedia
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Hidden file inputs */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                    <input
                      ref={nativeCameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />

                    {/* Input URL Gambar Langsung */}
                    <div className="pt-1">
                      <input
                        type="url"
                        placeholder="Atau tempel URL gambar web langsung (https://...)"
                        value={prodImageUrl}
                        onChange={(e) => setProdImageUrl(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-[11px] outline-none focus:border-blue-500 font-medium"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="prodActive"
                  checked={prodActive}
                  onChange={(e) => setProdActive(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="prodActive" className="text-xs text-slate-700 cursor-pointer font-medium">
                  Barang aktif dan tampil di katalog publik
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseProductModal}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCompressingImage || isCameraActive}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                >
                  Simpan Barang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL TAMBAH/EDIT KATEGORI ================= */}
      {catModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-base font-black text-slate-900">
                {editingCategory ? 'Edit Kelompok Barang' : 'Tambah Kelompok Baru'}
              </h3>
            </div>

            {catError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{catError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nama Kelompok / Kategori *</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Aksesoris HP, Parfum"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCatModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                >
                  Simpan Kelompok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= KONFIRMASI HAPUS ================= */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Konfirmasi Hapus {deleteConfirm.type === 'product' ? 'Barang' : 'Kelompok'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Apakah Anda yakin ingin menghapus &ldquo;<strong>{deleteConfirm.name}</strong>&rdquo;?
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
                onClick={handleConfirmDelete}
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
