'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { dataService } from '@/lib/services/dataService';
import { Product, ProductCategory } from '@/lib/types/database';
import { formatRupiah } from '@/lib/utils/currency';
import { exportProductsToExcel } from '@/lib/utils/exportExcel';

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

  // ================= PRODUK HANDLERS =================
  const handleOpenProductModal = (prod?: Product) => {
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

      setProductModalOpen(false);
      loadData();
    } catch (err: any) {
      setProdError(err.message || 'Gagal menyimpan barang.');
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProdError('File harus berupa gambar (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setProdError('Ukuran gambar maksimal adalah 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setProdImageUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
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
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900">
                {editingProduct ? 'Edit Data Barang' : 'Tambah Barang Baru'}
              </h3>
              <p className="text-xs text-slate-500">
                Isi form lengkap data barang untuk ditampilkan di katalog toko.
              </p>
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

              {/* Gambar Barang (Upload lokal atau URL) */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Gambar Barang (File Lokal atau URL)</label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {prodImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={prodImageUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                    <input
                      type="url"
                      placeholder="Atau input URL gambar langsung..."
                      value={prodImageUrl}
                      onChange={(e) => setProdImageUrl(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 text-[11px] outline-none"
                    />
                  </div>
                </div>
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
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
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
