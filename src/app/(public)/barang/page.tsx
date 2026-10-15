'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, SlidersHorizontal, PackageOpen, ArrowUpDown } from 'lucide-react';
import { dataService } from '@/lib/services/dataService';
import { Product, ProductCategory, StoreSettings } from '@/lib/types/database';
import { formatRupiah } from '@/lib/utils/currency';

export default function DaftarBarangPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter & Search States
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name-asc' | 'price-asc' | 'price-desc'>('name-asc');

  useEffect(() => {
    async function fetchData() {
      try {
        const [loadedCats, loadedProds, loadedSettings] = await Promise.all([
          dataService.getCategories(),
          dataService.getProducts({ onlyActive: true }),
          dataService.getStoreSettings(),
        ]);
        setCategories(loadedCats.filter((c) => c.is_active));
        setProducts(loadedProds);
        setSettings(loadedSettings);
      } catch (err) {
        console.error('Error loading catalog data', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Filter & Pengurutan Dinamis
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filter Kategori (ALL menampilkan semua)
    if (selectedCategory !== 'ALL') {
      result = result.filter((p) => p.category_id === selectedCategory);
    }

    // Filter Pencarian Nama Realtime
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }

    // Pengurutan Data
    if (sortBy === 'name-asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [products, selectedCategory, searchQuery, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl p-6 sm:p-10 text-white shadow-lg space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-200 bg-blue-800/60 px-3 py-1 rounded-full border border-blue-600/40">
          Katalog Resmi V_R Store
        </span>
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
          Daftar Barang & Produk
        </h1>
        <p className="text-sm sm:text-base text-blue-100 max-w-2xl">
          Jelajahi aneka kebutuhan ATK, perlengkapan sekolah, cetak tugas, aksesoris gawai, dan parfum pilihan dengan harga pasti pas.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        {/* Row 1: Search Input & Sort Selector */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Bar Realtime */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama barang secara realtime..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm outline-none transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                title="Hapus kata kunci"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" /> Urutkan:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-bold text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
            >
              <option value="name-asc">Nama Barang (A - Z)</option>
              <option value="price-asc">Harga Terendah</option>
              <option value="price-desc">Harga Tertinggi</option>
            </select>
          </div>
        </div>

        {/* Row 2: Dynamic Category Tabs (Sinkron dengan Kategori Owner) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1 shrink-0 mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Kategori:
          </span>
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              selectedCategory === 'ALL'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
            }`}
          >
            ALL (Semua Barang)
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Indikator Hasil Pencarian */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div>
            Menampilkan <span className="font-bold text-blue-700">{filteredProducts.length}</span> barang
            {selectedCategory !== 'ALL' && (
              <span> dalam kategori <strong>{categories.find((c) => c.id === selectedCategory)?.name}</strong></span>
            )}
            {searchQuery && (
              <span> untuk kata kunci &ldquo;<strong>{searchQuery}</strong>&rdquo;</span>
            )}
          </div>
          {(searchQuery || selectedCategory !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
              }}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Grid Product Cards */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 h-72 animate-pulse space-y-3 border border-slate-200">
              <div className="w-full h-40 bg-slate-200 rounded-xl" />
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-4 bg-slate-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {filteredProducts.map((prod) => (
            <div
              key={prod.id}
              className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-lg hover:border-blue-400 transition-all duration-300 flex flex-col justify-between group"
            >
              <div className="relative aspect-square w-full bg-slate-100 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    prod.image_url ||
                    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60'
                  }
                  alt={prod.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2.5 left-2.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/95 text-blue-900 shadow-xs backdrop-blur-sm">
                    {prod.category_name}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-blue-700 transition-colors">
                    {prod.name}
                  </h3>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <div className="text-blue-700 font-black text-base sm:text-lg">
                    {formatRupiah(prod.price)}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    Stok:{' '}
                    <span className={`font-bold ${prod.stock > 0 ? 'text-slate-700' : 'text-rose-500'}`}>
                      {prod.stock > 0 ? `${prod.stock} unit` : 'Habis'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-400 mx-auto flex items-center justify-center">
            <PackageOpen className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-base font-bold text-slate-800">Barang Tidak Ditemukan</h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Tidak ada produk yang cocok dengan kata kunci &ldquo;{searchQuery}&rdquo; pada filter kategori saat ini.
            </p>
          </div>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('ALL');
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-all"
          >
            Tampilkan Semua Barang (ALL)
          </button>
        </div>
      )}
    </div>
  );
}
