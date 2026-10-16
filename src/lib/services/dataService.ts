import { createClient } from '../supabase/client';
import {
  StoreSettings,
  ProductCategory,
  Product,
  BrilinkPeriod,
  BrilinkDailyTransaction,
  BrilinkCapitalEntry,
  CustomerFundEntry,
  Investor,
  MonthlyRecapRow,
  AnnualReportSummary,
} from '../types/database';
import { calculateDailyIncome, generateInvestorCommissions } from '../utils/calculations';
import { MONTH_NAMES_ID } from '../utils/date';

// Seed default categories
export const DEFAULT_CATEGORIES: ProductCategory[] = [
  { id: 'cat-1', name: 'ATK', slug: 'atk', sort_order: 1, is_active: true },
  { id: 'cat-2', name: 'Fotocopy & Print', slug: 'fotocopy-print', sort_order: 2, is_active: true },
  { id: 'cat-3', name: 'Perlengkapan Sekolah', slug: 'perlengkapan-sekolah', sort_order: 3, is_active: true },
  { id: 'cat-4', name: 'Aksesoris HP', slug: 'aksesoris-hp', sort_order: 4, is_active: true },
  { id: 'cat-5', name: 'Aksesoris', slug: 'aksesoris', sort_order: 5, is_active: true },
  { id: 'cat-6', name: 'Parfum', slug: 'parfum', sort_order: 6, is_active: true },
];

// Seed default settings
export const DEFAULT_SETTINGS: StoreSettings = {
  id: 'store-setting-1',
  store_name: 'V_R Store',
  tagline: 'Solusi Lengkap Kebutuhan Harian & Transaksi Digital Anda',
  description: 'Pusat belanja kebutuhan harian, ATK, fotocopy, print kilat, pulsa & token, e-wallet, aksesoris, parfum wangi, serta layanan resmi tarik-setor tunai agen BRILink.',
  address: 'Jl. Poros Utama No. 88, Lingkungan Toko',
  phone: '0812-3456-7890',
  whatsapp: '6281234567890',
  operational_hours: 'Setiap Hari: 07:30 - 22:00 WITA',
  maps_url: 'https://maps.google.com',
  show_stock_to_public: true,
};

// Seed default products
export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    category_id: 'cat-1',
    category_name: 'ATK',
    name: 'Buku Tulis Sidu 38 Lembar (1 Pak / 10 Buku)',
    price: 38000,
    stock: 45,
    image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60',
    is_active: true,
  },
  {
    id: 'prod-2',
    category_id: 'cat-1',
    category_name: 'ATK',
    name: 'Pulpen Gel Standard 0.5 Black Tinta Pekat',
    price: 3500,
    stock: 120,
    image_url: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500&auto=format&fit=crop&q=60',
    is_active: true,
  },
  {
    id: 'prod-3',
    category_id: 'cat-4',
    category_name: 'Aksesoris HP',
    name: 'Kabel Data Fast Charging Type-C to Type-C 65W',
    price: 35000,
    stock: 28,
    image_url: 'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=500&auto=format&fit=crop&q=60',
    is_active: true,
  },
  {
    id: 'prod-4',
    category_id: 'cat-6',
    category_name: 'Parfum',
    name: 'Parfum Roll-on Non Alkohol Aroma Kasturi Putih 6ml',
    price: 25000,
    stock: 35,
    image_url: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=500&auto=format&fit=crop&q=60',
    is_active: true,
  },
  {
    id: 'prod-5',
    category_id: 'cat-3',
    category_name: 'Perlengkapan Sekolah',
    name: 'Kotak Pensil Kanvas Karakter Tahan Air',
    price: 18000,
    stock: 22,
    image_url: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=500&auto=format&fit=crop&q=60',
    is_active: true,
  },
  {
    id: 'prod-6',
    category_id: 'cat-4',
    category_name: 'Aksesoris HP',
    name: 'Headset Stereo Bass 3.5mm Earphone with Mic',
    price: 28000,
    stock: 15,
    image_url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&auto=format&fit=crop&q=60',
    is_active: true,
  },
  {
    id: 'prod-7',
    category_id: 'cat-5',
    category_name: 'Aksesoris',
    name: 'Gantungan Kunci Kulit Sintetis Elegan',
    price: 12000,
    stock: 40,
    image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60',
    is_active: true,
  },
  {
    id: 'prod-8',
    category_id: 'cat-2',
    category_name: 'Fotocopy & Print',
    name: 'Kertas HVS A4 PaperOne 75 GSM (1 Rim)',
    price: 52000,
    stock: 30,
    image_url: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=500&auto=format&fit=crop&q=60',
    is_active: true,
  },
];

// Seed default capital entries
export const DEFAULT_CAPITAL: BrilinkCapitalEntry[] = [
  {
    id: 'cap-1',
    entry_date: '2026-10-01',
    source: 'Kas Induk Pemilik',
    amount: 25000000,
    notes: 'Modal awal operasional kas & saldo e-wallet perbankan Oktober',
  },
  {
    id: 'cap-2',
    entry_date: '2026-10-08',
    source: 'Suntikan Tambahan BRI',
    amount: 15000000,
    notes: 'Penambahan saldo BRIMO menghadapi lonjakan transaksi nasabah',
  },
];

// Seed default periods
export const DEFAULT_PERIODS: BrilinkPeriod[] = [
  { id: 'per-2026-10', month: 10, year: 2026, status: 'open' },
  { id: 'per-2026-09', month: 9, year: 2026, status: 'closed' },
];

// Seed default transactions for October 2026
export const DEFAULT_TRANSACTIONS: BrilinkDailyTransaction[] = [
  {
    id: 'trx-1001',
    period_id: 'per-2026-10',
    transaction_date: '2026-10-01',
    transaction_count: 24,
    cash_amount: 8500000,
    brimo_balance: 14000000,
    payfazz_balance: 4500000,
    brilian_balance: 3000000,
    customer_funds: 5000000,
    debt_notes: 450000,
    daily_capital: 25000000,
    // (8.5m + 14m + 4.5m + 3m + 450k = 30.45m) - 25m - 5m = 450.000
    daily_income: 450000,
    notes: 'Awal bulan ramai tarik tunai gaji & transfer',
  },
  {
    id: 'trx-1002',
    period_id: 'per-2026-10',
    transaction_date: '2026-10-02',
    transaction_count: 29,
    cash_amount: 9200000,
    brimo_balance: 13500000,
    payfazz_balance: 5100000,
    brilian_balance: 3400000,
    customer_funds: 4800000,
    debt_notes: 300000,
    daily_capital: 25000000,
    // (9.2m + 13.5m + 5.1m + 3.4m + 300k = 31.5m) - 25m - 4.8m = 1.700.000
    daily_income: 1700000,
    notes: 'Banyak transaksi top up ShopeePay & Dana',
  },
  {
    id: 'trx-1003',
    period_id: 'per-2026-10',
    transaction_date: '2026-10-03',
    transaction_count: 35,
    cash_amount: 11000000,
    brimo_balance: 12800000,
    payfazz_balance: 6200000,
    brilian_balance: 4100000,
    customer_funds: 6500000,
    debt_notes: 550000,
    daily_capital: 25000000,
    // (11m + 12.8m + 6.2m + 4.1m + 550k = 34.65m) - 25m - 6.5m = 3.150.000
    daily_income: 3150000,
    notes: 'Sabtu ramai transfer antar bank',
  },
];

// Seed default investors
export const DEFAULT_INVESTORS: Investor[] = [
  {
    id: 'inv-1',
    name: 'H. Sudirman',
    investment_amount: 50000000,
    join_date: '2026-06-01',
    status: 'active',
    notes: 'Penyertaan modal tahap 1 (Komisi aktif)',
  },
  {
    id: 'inv-2',
    name: 'Ibu Hj. Maryam',
    investment_amount: 20000000,
    join_date: '2026-08-15',
    status: 'active',
    notes: 'Modal likuiditas e-wallet (Komisi aktif)',
  },
  {
    id: 'inv-3',
    name: 'Bpk. Rahmat Santoso',
    investment_amount: 30000000,
    join_date: '2026-10-05', // Baru bergabung beberapa hari lalu (< 30 hari)
    status: 'active',
    notes: 'Investor baru bergabung bulan Oktober (Belum cukup 1 bulan)',
  },
];

// Seed default customer funds
export const DEFAULT_CUSTOMER_FUNDS: CustomerFundEntry[] = [
  {
    id: 'cf-1001-1',
    entry_date: '2026-10-01',
    customer_name: 'Bpk. Hendra Wijaya',
    notes: 'Titipan transfer antar bank BRI',
    amount: 3000000,
    created_at: '2026-10-01T08:30:00Z',
  },
  {
    id: 'cf-1001-2',
    entry_date: '2026-10-01',
    customer_name: 'Ibu Hj. Siti Aminah',
    notes: 'Tarik tunai pensiun belum diambil',
    amount: 2000000,
    created_at: '2026-10-01T10:15:00Z',
  },
  {
    id: 'cf-1002-1',
    entry_date: '2026-10-02',
    customer_name: 'Pak Joko Susilo',
    notes: 'Titipan pembayaran belanja online / e-commerce',
    amount: 4800000,
    created_at: '2026-10-02T09:00:00Z',
  },
  {
    id: 'cf-1003-1',
    entry_date: '2026-10-03',
    customer_name: 'Toko Berkah Mandiri',
    notes: 'Titipan setor tunai kas mingguan',
    amount: 6500000,
    created_at: '2026-10-03T11:45:00Z',
  },
];

// Helper local storage persist
function getLocalItem<T>(key: string, defaultVal: T): T {
  if (typeof window === 'undefined') return defaultVal;
  try {
    const item = localStorage.getItem(`vr_store_${key}`);
    return item !== null ? JSON.parse(item) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setLocalItem<T>(key: string, val: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`vr_store_${key}`, JSON.stringify(val));
  } catch (e) {
    console.error('Failed to set localStorage', e);
  }
}

class DataService {
  private isSupabaseConfigured(): boolean {
    return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }

  // ==========================================
  // PENGATURAN TOKO
  // ==========================================
  async getStoreSettings(): Promise<StoreSettings> {
    if (this.isSupabaseConfigured()) {
      const supabase = createClient();
      if (supabase) {
        const { data, error } = await supabase.from('store_settings').select('*').limit(1).single();
        if (!error && data) return data as StoreSettings;
      }
    }
    return getLocalItem<StoreSettings>('settings', DEFAULT_SETTINGS);
  }

  async updateStoreSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
    if (this.isSupabaseConfigured()) {
      const supabase = createClient();
      if (supabase) {
        const current = await this.getStoreSettings();
        const updated = { ...current, ...settings, updated_at: new Date().toISOString() };
        const { data, error } = await supabase
          .from('store_settings')
          .update(updated)
          .eq('id', current.id)
          .select()
          .single();
        if (!error && data) return data as StoreSettings;
      }
    }

    const current = getLocalItem<StoreSettings>('settings', DEFAULT_SETTINGS);
    const updated = { ...current, ...settings, updated_at: new Date().toISOString() };
    setLocalItem('settings', updated);
    return updated;
  }

  // ==========================================
  // KATEGORI PRODUK
  // ==========================================
  async getCategories(): Promise<ProductCategory[]> {
    if (this.isSupabaseConfigured()) {
      const supabase = createClient();
      if (supabase) {
        const { data, error } = await supabase
          .from('product_categories')
          .select('*')
          .order('sort_order', { ascending: true });
        if (error) {
          console.error('Supabase getCategories error:', error.message);
          throw new Error(`Gagal memuat kategori: ${error.message}`);
        }
        if (data) return data as ProductCategory[];
      }
    }
    return getLocalItem<ProductCategory[]>('categories', DEFAULT_CATEGORIES);
  }

  async createCategory(cat: Omit<ProductCategory, 'id'>): Promise<ProductCategory> {
    const newCategory: ProductCategory = {
      ...cat,
      id: `cat-${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    if (this.isSupabaseConfigured()) {
      const supabase = createClient();
      if (supabase) {
        const { data, error } = await supabase
          .from('product_categories')
          .insert([cat])
          .select()
          .single();
        if (error) {
          console.error('Supabase createCategory error:', error);
          throw new Error(`Gagal menyimpan kategori ke database: ${error.message}`);
        }
        if (data) return data as ProductCategory;
      }
    }

    const current = await this.getCategories();
    const updated = [...current, newCategory];
    setLocalItem('categories', updated);
    return newCategory;
  }

  async updateCategory(id: string, cat: Partial<ProductCategory>): Promise<ProductCategory> {
    if (this.isSupabaseConfigured()) {
      const supabase = createClient();
      if (supabase) {
        const { data, error } = await supabase
          .from('product_categories')
          .update({ ...cat, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
        if (error) {
          console.error('Supabase updateCategory error:', error);
          throw new Error(`Gagal memperbarui kategori di database: ${error.message}`);
        }
        if (data) return data as ProductCategory;
      }
    }

    const current = await this.getCategories();
    const updated = current.map((c) => (c.id === id ? { ...c, ...cat, updated_at: new Date().toISOString() } : c));
    setLocalItem('categories', updated);
    const item = updated.find((c) => c.id === id);
    if (!item) throw new Error('Kategori tidak ditemukan');
    return item;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const products = await this.getProducts();
    const hasProducts = products.some((p) => p.category_id === id && !p.is_deleted);
    if (hasProducts) {
      throw new Error('Kategori tidak dapat dihapus karena masih memiliki produk. Pindahkan produk terlebih dahulu.');
    }

    if (this.isSupabaseConfigured()) {
      const supabase = createClient();
      if (supabase) {
        const { error } = await supabase.from('product_categories').delete().eq('id', id);
        if (error) {
          console.error('Supabase deleteCategory error:', error);
          throw new Error(`Gagal menghapus kategori di database: ${error.message}`);
        }
        return true;
      }
    }

    const current = await this.getCategories();
    const updated = current.filter((c) => c.id !== id);
    setLocalItem('categories', updated);
    return true;
  }

  // ==========================================
  // PRODUK
  // ==========================================
  async getProducts(options?: { onlyActive?: boolean; categoryId?: string; search?: string }): Promise<Product[]> {
    let list: Product[] = [];

    if (this.isSupabaseConfigured()) {
      const supabase = createClient();
      if (supabase) {
        let query = supabase.from('products').select('*');
        if (options?.onlyActive) query = query.eq('is_active', true).eq('is_deleted', false);
        if (options?.categoryId && options.categoryId !== 'ALL') query = query.eq('category_id', options.categoryId);
        const { data, error } = await query;
        if (error) {
          console.error('Supabase getProducts error:', error.message, error);
          throw new Error(`Gagal memuat produk dari database: ${error.message}`);
        }
        if (data) {
          list = data as Product[];
        }
      }
    } else {
      list = getLocalItem<Product[]>('products', DEFAULT_PRODUCTS);
    }

    const categories = await this.getCategories();
    const catMap = new Map(categories.map((c) => [c.id, c.name]));

    let filtered = list.map((p) => ({
      ...p,
      category_name: p.category_name || catMap.get(p.category_id) || 'Umum',
    }));

    if (options?.onlyActive) {
      filtered = filtered.filter((p) => p.is_active && !p.is_deleted);
    }

    if (options?.categoryId && options.categoryId !== 'ALL') {
      filtered = filtered.filter((p) => p.category_id === options.categoryId);
    }

    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(q));
    }

    return filtered;
  }

  async createProduct(prod: Omit<Product, 'id'>): Promise<Product> {
    const newProduct: Product = {
      ...prod,
      id: `prod-${Date.now()}`,
      created_at: new Date().toISOString(),
      is_deleted: false,
    };

    if (this.isSupabaseConfigured()) {
      const supabase = createClient();
      if (supabase) {
        const { data, error } = await supabase
          .from('products')
          .insert([prod])
          .select()
          .single();
        if (error) {
          console.error('Supabase createProduct error:', error);
          throw new Error(`Gagal menyimpan produk ke database: ${error.message}`);
        }
        if (data) return data as Product;
      }
    }

    const current = getLocalItem<Product[]>('products', DEFAULT_PRODUCTS);
    const updated = [newProduct, ...current];
    setLocalItem('products', updated);
    return newProduct;
  }

  async updateProduct(id: string, prod: Partial<Product>): Promise<Product> {
    if (this.isSupabaseConfigured()) {
      const supabase = createClient();
      if (supabase) {
        const { data, error } = await supabase
          .from('products')
          .update({ ...prod, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
        if (error) {
          console.error('Supabase updateProduct error:', error);
          throw new Error(`Gagal memperbarui produk di database: ${error.message}`);
        }
        if (data) return data as Product;
      }
    }

    const current = getLocalItem<Product[]>('products', DEFAULT_PRODUCTS);
    const updated = current.map((p) => (p.id === id ? { ...p, ...prod, updated_at: new Date().toISOString() } : p));
    setLocalItem('products', updated);
    const item = updated.find((p) => p.id === id);
    if (!item) throw new Error('Produk tidak ditemukan');
    return item;
  }

  async deleteProduct(id: string): Promise<boolean> {
    if (this.isSupabaseConfigured()) {
      const supabase = createClient();
      if (supabase) {
        const { error } = await supabase
          .from('products')
          .update({ is_deleted: true, is_active: false, updated_at: new Date().toISOString() })
          .eq('id', id);
        if (error) {
          console.error('Supabase deleteProduct error:', error);
          throw new Error(`Gagal menghapus produk di database: ${error.message}`);
        }
        return true;
      }
    }
    return (await this.updateProduct(id, { is_deleted: true, is_active: false })).is_deleted || false;
  }

  // ==========================================
  // BRILINK: PERIODE & TRANSAKSI HARIAN
  // ==========================================
  async getBrilinkPeriods(): Promise<BrilinkPeriod[]> {
    if (this.isSupabaseConfigured()) {
      const supabase = createClient();
      if (supabase) {
        const { data, error } = await supabase
          .from('brilink_periods')
          .select('*')
          .order('year', { ascending: false })
          .order('month', { ascending: false });
        if (!error && data) return data as BrilinkPeriod[];
      }
    }
    return getLocalItem<BrilinkPeriod[]>('brilink_periods', DEFAULT_PERIODS);
  }

  async createBrilinkPeriod(month: number, year: number): Promise<BrilinkPeriod> {
    const periods = await this.getBrilinkPeriods();
    const existing = periods.find((p) => p.month === month && p.year === year);
    if (existing) {
      throw new Error(`Periode ${MONTH_NAMES_ID[month - 1]} ${year} sudah dibuat.`);
    }

    const newPeriod: BrilinkPeriod = {
      id: `per-${year}-${month < 10 ? '0' + month : month}`,
      month,
      year,
      status: 'open',
      created_at: new Date().toISOString(),
    };

    if (this.isSupabaseConfigured()) {
      const supabase = createClient();
      if (supabase) {
        const { data, error } = await supabase
          .from('brilink_periods')
          .insert([{ month, year, status: 'open' }])
          .select()
          .single();
        if (!error && data) return data as BrilinkPeriod;
      }
    }

    const updated = [newPeriod, ...periods];
    setLocalItem('brilink_periods', updated);
    return newPeriod;
  }

  async getDailyTransactions(periodId: string): Promise<BrilinkDailyTransaction[]> {
    let list: BrilinkDailyTransaction[] = [];
    if (this.isSupabaseConfigured()) {
      const supabase = createClient();
      if (supabase) {
        const { data, error } = await supabase
          .from('brilink_daily_transactions')
          .select('*')
          .eq('period_id', periodId)
          .order('transaction_date', { ascending: true });
        if (!error && data) list = data as BrilinkDailyTransaction[];
      }
    } else {
      list = getLocalItem<BrilinkDailyTransaction[]>('brilink_transactions', DEFAULT_TRANSACTIONS);
    }

    const allFunds = await this.getCustomerFunds();
    const synced = list.map((t) => {
      const fundsOnDate = allFunds.filter((f) => f.entry_date === t.transaction_date);
      if (fundsOnDate.length > 0) {
        const totalFunds = fundsOnDate.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
        if (totalFunds !== t.customer_funds) {
          const newIncome = calculateDailyIncome({
            cash_amount: t.cash_amount,
            brimo_balance: t.brimo_balance,
            payfazz_balance: t.payfazz_balance,
            brilian_balance: t.brilian_balance,
            debt_notes: t.debt_notes,
            daily_capital: t.daily_capital,
            customer_funds: totalFunds,
          });
          return { ...t, customer_funds: totalFunds, daily_income: newIncome };
        }
      }
      return t;
    });

    return synced
      .filter((t) => t.period_id === periodId)
      .sort((a, b) => a.transaction_date.localeCompare(b.transaction_date));
  }

  async saveDailyTransaction(trans: Omit<BrilinkDailyTransaction, 'id' | 'daily_income'> & { id?: string }): Promise<BrilinkDailyTransaction> {
    const dailyIncome = calculateDailyIncome({
      cash_amount: trans.cash_amount,
      brimo_balance: trans.brimo_balance,
      payfazz_balance: trans.payfazz_balance,
      brilian_balance: trans.brilian_balance,
      debt_notes: trans.debt_notes,
      daily_capital: trans.daily_capital,
      customer_funds: trans.customer_funds,
    });

    const fullRecord: BrilinkDailyTransaction = {
      id: trans.id || `trx-${Date.now()}`,
      period_id: trans.period_id,
      transaction_date: trans.transaction_date,
      transaction_count: Number(trans.transaction_count) || 0,
      cash_amount: Number(trans.cash_amount) || 0,
      brimo_balance: Number(trans.brimo_balance) || 0,
      payfazz_balance: Number(trans.payfazz_balance) || 0,
      brilian_balance: Number(trans.brilian_balance) || 0,
      customer_funds: Number(trans.customer_funds) || 0,
      debt_notes: Number(trans.debt_notes) || 0,
      daily_capital: Number(trans.daily_capital) || 0,
      daily_income: dailyIncome,
      notes: trans.notes || '',
      updated_at: new Date().toISOString(),
    };

    if (this.isSupabaseConfigured()) {
      const supabase = createClient();
      if (supabase) {
        if (trans.id) {
          const { data, error } = await supabase
            .from('brilink_daily_transactions')
            .update(fullRecord)
            .eq('id', trans.id)
            .select()
            .single();
          if (!error && data) return data as BrilinkDailyTransaction;
        } else {
          const { data, error } = await supabase
            .from('brilink_daily_transactions')
            .insert([fullRecord])
            .select()
            .single();
          if (!error && data) return data as BrilinkDailyTransaction;
        }
      }
    }

    const all = getLocalItem<BrilinkDailyTransaction[]>('brilink_transactions', DEFAULT_TRANSACTIONS);
    let updated: BrilinkDailyTransaction[];
    if (trans.id) {
      updated = all.map((t) => (t.id === trans.id ? fullRecord : t));
    } else {
      const exists = all.find((t) => t.period_id === trans.period_id && t.transaction_date === trans.transaction_date);
      if (exists) {
        throw new Error(`Transaksi untuk tanggal ${trans.transaction_date} sudah ada dalam periode ini.`);
      }
      updated = [...all, fullRecord];
    }
    setLocalItem('brilink_transactions', updated);
    return fullRecord;
  }

  async deleteDailyTransaction(id: string): Promise<boolean> {
    if (this.isSupabaseConfigured()) {
      const supabase = createClient();
      if (supabase) {
        const { error } = await supabase.from('brilink_daily_transactions').delete().eq('id', id);
        if (!error) return true;
      }
    }

    const all = getLocalItem<BrilinkDailyTransaction[]>('brilink_transactions', DEFAULT_TRANSACTIONS);
    const updated = all.filter((t) => t.id !== id);
    setLocalItem('brilink_transactions', updated);
    return true;
  }

  // ==========================================
  // BRILINK: MODAL MASUK
  // ==========================================
  async getCapitalEntries(): Promise<BrilinkCapitalEntry[]> {
    if (this.isSupabaseConfigured()) {
      const supabase = createClient();
      if (supabase) {
        const { data, error } = await supabase
          .from('brilink_capital_entries')
          .select('*')
          .order('entry_date', { ascending: false });
        if (!error && data) return data as BrilinkCapitalEntry[];
      }
    }
    return getLocalItem<BrilinkCapitalEntry[]>('brilink_capital', DEFAULT_CAPITAL);
  }

  async createCapitalEntry(entry: Omit<BrilinkCapitalEntry, 'id'>): Promise<BrilinkCapitalEntry> {
    if (entry.amount <= 0) {
      throw new Error('Nominal modal harus lebih besar dari 0.');
    }

    const newRecord: BrilinkCapitalEntry = {
      ...entry,
      id: `cap-${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    if (this.isSupabaseConfigured()) {
      const supabase = createClient();
      if (supabase) {
        const { data, error } = await supabase
          .from('brilink_capital_entries')
          .insert([entry])
          .select()
          .single();
        if (!error && data) return data as BrilinkCapitalEntry;
      }
    }

    const current = await this.getCapitalEntries();
    const updated = [newRecord, ...current];
    setLocalItem('brilink_capital', updated);
    return newRecord;
  }

  async updateCapitalEntry(id: string, entry: Partial<BrilinkCapitalEntry>): Promise<BrilinkCapitalEntry> {
    if (entry.amount !== undefined && entry.amount <= 0) {
      throw new Error('Nominal modal harus lebih besar dari 0.');
    }

    if (this.isSupabaseConfigured()) {
      const supabase = createClient();
      if (supabase) {
        const { data, error } = await supabase
          .from('brilink_capital_entries')
          .update(entry)
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return data as BrilinkCapitalEntry;
      }
    }

    const current = await this.getCapitalEntries();
    const updated = current.map((c) => (c.id === id ? { ...c, ...entry } : c));
    setLocalItem('brilink_capital', updated);
    const item = updated.find((c) => c.id === id);
    if (!item) throw new Error('Entri modal tidak ditemukan');
    return item;
  }

  async deleteCapitalEntry(id: string): Promise<boolean> {
    if (this.isSupabaseConfigured()) {
      const supabase = createClient();
      if (supabase) {
        const { error } = await supabase.from('brilink_capital_entries').delete().eq('id', id);
        if (!error) return true;
      }
    }

    const current = await this.getCapitalEntries();
    const updated = current.filter((c) => c.id !== id);
    setLocalItem('brilink_capital', updated);
    return true;
  }

  // ==========================================
  // BRILINK: UANG NASABAH (TITIPAN / TARIK BELUM DIAMBIL)
  // ==========================================
  async getCustomerFunds(options?: { date?: string; month?: number; year?: number; search?: string }): Promise<CustomerFundEntry[]> {
    let list: CustomerFundEntry[] = [];

    if (this.isSupabaseConfigured()) {
      const supabase = createClient();
      if (supabase) {
        let query = supabase.from('brilink_customer_funds').select('*').order('entry_date', { ascending: false });
        if (options?.date) query = query.eq('entry_date', options.date);
        const { data, error } = await query;
        if (!error && data) list = data as CustomerFundEntry[];
      }
    } else {
      list = getLocalItem<CustomerFundEntry[]>('customer_funds', DEFAULT_CUSTOMER_FUNDS);
    }

    if (options?.date) {
      list = list.filter((f) => f.entry_date === options.date);
    }

    if (options?.month && options?.year) {
      list = list.filter((f) => {
        const parts = f.entry_date.split('-');
        if (parts.length === 3) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10);
          return y === options.year && m === options.month;
        }
        return false;
      });
    }

    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      list = list.filter((f) =>
        f.customer_name.toLowerCase().includes(q) || (f.notes && f.notes.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => b.entry_date.localeCompare(a.entry_date));
  }

  async getCustomerFundsByDate(date: string): Promise<CustomerFundEntry[]> {
    return this.getCustomerFunds({ date });
  }

  async getCustomerFundsTotalByDate(date: string): Promise<number> {
    const list = await this.getCustomerFunds({ date });
    return list.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  }

  // Sinkronisasi otomatis ke baris transaksi harian berdasarkan tanggal
  async syncTransactionCustomerFunds(date: string): Promise<void> {
    try {
      const totalCustomerFunds = await this.getCustomerFundsTotalByDate(date);
      const allTrx = getLocalItem<BrilinkDailyTransaction[]>('brilink_transactions', DEFAULT_TRANSACTIONS);
      const targetIndex = allTrx.findIndex((t) => t.transaction_date === date);

      if (targetIndex !== -1) {
        const target = allTrx[targetIndex];
        const newDailyIncome = calculateDailyIncome({
          cash_amount: target.cash_amount,
          brimo_balance: target.brimo_balance,
          payfazz_balance: target.payfazz_balance,
          brilian_balance: target.brilian_balance,
          debt_notes: target.debt_notes,
          daily_capital: target.daily_capital,
          customer_funds: totalCustomerFunds,
        });

        const updatedTarget: BrilinkDailyTransaction = {
          ...target,
          customer_funds: totalCustomerFunds,
          daily_income: newDailyIncome,
          updated_at: new Date().toISOString(),
        };

        allTrx[targetIndex] = updatedTarget;
        setLocalItem('brilink_transactions', allTrx);

        if (this.isSupabaseConfigured()) {
          const supabase = createClient();
          if (supabase) {
            await supabase
              .from('brilink_daily_transactions')
              .update({
                customer_funds: totalCustomerFunds,
                daily_income: newDailyIncome,
                updated_at: new Date().toISOString(),
              })
              .eq('id', target.id);
          }
        }
      }
    } catch (e) {
      console.error('Failed to sync transaction customer funds', e);
    }
  }

  async createCustomerFund(fund: Omit<CustomerFundEntry, 'id'>): Promise<CustomerFundEntry> {
    const newFund: CustomerFundEntry = {
      ...fund,
      id: `cf-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (this.isSupabaseConfigured()) {
      const supabase = createClient();
      if (supabase) {
        const { data, error } = await supabase
          .from('brilink_customer_funds')
          .insert([fund])
          .select()
          .single();
        if (!error && data) {
          await this.syncTransactionCustomerFunds(fund.entry_date);
          return data as CustomerFundEntry;
        }
      }
    }

    const current = getLocalItem<CustomerFundEntry[]>('customer_funds', DEFAULT_CUSTOMER_FUNDS);
    const updated = [newFund, ...current];
    setLocalItem('customer_funds', updated);
    await this.syncTransactionCustomerFunds(fund.entry_date);
    return newFund;
  }

  async updateCustomerFund(id: string, fund: Partial<CustomerFundEntry>): Promise<CustomerFundEntry> {
    let targetDate = fund.entry_date;

    if (this.isSupabaseConfigured()) {
      const supabase = createClient();
      if (supabase) {
        const { data, error } = await supabase
          .from('brilink_customer_funds')
          .update({ ...fund, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
        if (!error && data) {
          await this.syncTransactionCustomerFunds(data.entry_date);
          return data as CustomerFundEntry;
        }
      }
    }

    const current = getLocalItem<CustomerFundEntry[]>('customer_funds', DEFAULT_CUSTOMER_FUNDS);
    const prevItem = current.find((c) => c.id === id);
    if (!targetDate && prevItem) {
      targetDate = prevItem.entry_date;
    }

    const updated = current.map((c) => (c.id === id ? { ...c, ...fund, updated_at: new Date().toISOString() } : c));
    setLocalItem('customer_funds', updated);

    const item = updated.find((c) => c.id === id);
    if (!item) throw new Error('Data uang nasabah tidak ditemukan');

    if (targetDate) {
      await this.syncTransactionCustomerFunds(targetDate);
    }
    if (prevItem && prevItem.entry_date !== targetDate) {
      await this.syncTransactionCustomerFunds(prevItem.entry_date);
    }

    return item;
  }

  async deleteCustomerFund(id: string): Promise<boolean> {
    const current = getLocalItem<CustomerFundEntry[]>('customer_funds', DEFAULT_CUSTOMER_FUNDS);
    const item = current.find((c) => c.id === id);
    const targetDate = item?.entry_date;

    if (this.isSupabaseConfigured()) {
      const supabase = createClient();
      if (supabase) {
        const { error } = await supabase.from('brilink_customer_funds').delete().eq('id', id);
        if (!error && targetDate) {
          await this.syncTransactionCustomerFunds(targetDate);
          return true;
        }
      }
    }

    const updated = current.filter((c) => c.id !== id);
    setLocalItem('customer_funds', updated);
    if (targetDate) {
      await this.syncTransactionCustomerFunds(targetDate);
    }
    return true;
  }

  // ==========================================
  // BRILINK: DIVIDEN & INVESTOR
  // ==========================================
  async getInvestors(): Promise<Investor[]> {
    let list: Investor[] = [];

    if (this.isSupabaseConfigured()) {
      const supabase = createClient();
      if (supabase) {
        const { data, error } = await supabase
          .from('investors')
          .select('*')
          .order('join_date', { ascending: true });
        if (!error && data) list = data as Investor[];
      }
    }

    if (list.length === 0) {
      list = getLocalItem<Investor[]>('investors', DEFAULT_INVESTORS);
    }

    // Hitung status durasi dan komisi per investor
    return list.map((inv) => {
      const {
        durationDays,
        isEligible,
        statusText,
        fullMonthsCount,
        monthlyCommission,
        totalEarned,
      } = generateInvestorCommissions(inv, new Date());

      return {
        ...inv,
        duration_days: durationDays,
        is_eligible_full_month: isEligible,
        duration_status_text: statusText,
        full_months_count: fullMonthsCount,
        monthly_commission: monthlyCommission,
        total_commission_earned: totalEarned,
      };
    });
  }

  async createInvestor(inv: Omit<Investor, 'id'>): Promise<Investor> {
    if (inv.investment_amount <= 0) {
      throw new Error('Jumlah pokok investasi harus lebih besar dari 0.');
    }

    const newRecord: Investor = {
      ...inv,
      id: `inv-${Date.now()}`,
      status: 'active',
      created_at: new Date().toISOString(),
    };

    if (this.isSupabaseConfigured()) {
      const supabase = createClient();
      if (supabase) {
        const { data, error } = await supabase
          .from('investors')
          .insert([inv])
          .select()
          .single();
        if (!error && data) return data as Investor;
      }
    }

    const current = getLocalItem<Investor[]>('investors', DEFAULT_INVESTORS);
    const updated = [...current, newRecord];
    setLocalItem('investors', updated);
    return newRecord;
  }

  async updateInvestor(id: string, inv: Partial<Investor>): Promise<Investor> {
    if (this.isSupabaseConfigured()) {
      const supabase = createClient();
      if (supabase) {
        const { data, error } = await supabase
          .from('investors')
          .update(inv)
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return data as Investor;
      }
    }

    const current = getLocalItem<Investor[]>('investors', DEFAULT_INVESTORS);
    const updated = current.map((i) => (i.id === id ? { ...i, ...inv } : i));
    setLocalItem('investors', updated);
    const item = updated.find((i) => i.id === id);
    if (!item) throw new Error('Data investor tidak ditemukan');
    return item;
  }

  async terminateInvestor(id: string, terminationDate: string, returnedPrincipal: number): Promise<Investor> {
    return this.updateInvestor(id, {
      status: 'terminated',
      termination_date: terminationDate,
      returned_principal: returnedPrincipal,
    });
  }

  // ==========================================
  // LAPORAN TAHUNAN (12 BULAN AGREGASI)
  // ==========================================
  async getAnnualReport(year: number): Promise<AnnualReportSummary> {
    const periods = await this.getBrilinkPeriods();
    const yearPeriods = periods.filter((p) => p.year === year);
    const capitalEntries = await this.getCapitalEntries();
    const investors = await this.getInvestors();

    const monthlyRows: MonthlyRecapRow[] = [];

    let totalCapital = 0;
    let totalTransactions = 0;
    let totalCash = 0;
    let totalBrimo = 0;
    let totalPayfazz = 0;
    let totalBrilian = 0;
    let totalCustomerFunds = 0;
    let totalDebt = 0;
    let totalDailyCapital = 0;
    let totalIncome = 0;
    let totalDividend = 0;
    let totalNetIncome = 0;

    for (let m = 1; m <= 12; m++) {
      const monthName = MONTH_NAMES_ID[m - 1];
      const period = yearPeriods.find((p) => p.month === m);

      // Modal masuk di bulan ini
      const monthCapital = capitalEntries
        .filter((c) => {
          const d = new Date(c.entry_date);
          return d.getFullYear() === year && d.getMonth() + 1 === m;
        })
        .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

      let trxCount = 0;
      let cash = 0;
      let brimo = 0;
      let payfazz = 0;
      let brilian = 0;
      let customerFunds = 0;
      let debt = 0;
      let dailyCap = 0;
      let monthIncome = 0;

      if (period) {
        const trxs = await this.getDailyTransactions(period.id);
        for (const t of trxs) {
          trxCount += Number(t.transaction_count) || 0;
          cash += Number(t.cash_amount) || 0;
          brimo += Number(t.brimo_balance) || 0;
          payfazz += Number(t.payfazz_balance) || 0;
          brilian += Number(t.brilian_balance) || 0;
          customerFunds += Number(t.customer_funds) || 0;
          debt += Number(t.debt_notes) || 0;
          dailyCap += Number(t.daily_capital) || 0;
          monthIncome += Number(t.daily_income) || 0;
        }
      }

      // Komisi dividen investor bulan penuh di bulan ini
      let monthDividend = 0;
      for (const inv of investors) {
        const { commissions } = generateInvestorCommissions(inv, new Date(year, m, 0));
        const comm = commissions.find((c) => c.period_month === m && c.period_year === year);
        if (comm) {
          monthDividend += comm.commission_amount;
        }
      }

      // Pendapatan Bersih (Pendapatan Transaksi - Komisi Investor)
      const netIncome = monthIncome - monthDividend;

      monthlyRows.push({
        month: m,
        month_name: monthName,
        year,
        capital_entered: monthCapital,
        transaction_count: trxCount,
        cash_amount: cash,
        brimo_balance: brimo,
        payfazz_balance: payfazz,
        brilian_balance: brilian,
        customer_funds: customerFunds,
        debt_notes: debt,
        daily_capital: dailyCap,
        monthly_income: monthIncome,
        dividend_commission: monthDividend,
        net_income: netIncome,
      });

      totalCapital += monthCapital;
      totalTransactions += trxCount;
      totalCash += cash;
      totalBrimo += brimo;
      totalPayfazz += payfazz;
      totalBrilian += brilian;
      totalCustomerFunds += customerFunds;
      totalDebt += debt;
      totalDailyCapital += dailyCap;
      totalIncome += monthIncome;
      totalDividend += monthDividend;
      totalNetIncome += netIncome;
    }

    return {
      year,
      total_capital_entered: totalCapital,
      total_transactions: totalTransactions,
      total_cash: totalCash,
      total_brimo: totalBrimo,
      total_payfazz: totalPayfazz,
      total_brilian: totalBrilian,
      total_customer_funds: totalCustomerFunds,
      total_debt_notes: totalDebt,
      total_daily_capital: totalDailyCapital,
      total_annual_income: totalIncome,
      total_dividend_commission: totalDividend,
      total_net_income: totalNetIncome,
      monthly_rows: monthlyRows,
    };
  }

  // ==========================================
  // BACKUP, RESTORE & DATA RESET
  // ==========================================
  async exportBackup(): Promise<string> {
    const backupData = {
      app: 'V_R Store',
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      data: {
        settings: await this.getStoreSettings(),
        categories: await this.getCategories(),
        products: await this.getProducts(),
        brilink_periods: getLocalItem<BrilinkPeriod[]>('brilink_periods', DEFAULT_PERIODS),
        brilink_transactions: getLocalItem<BrilinkDailyTransaction[]>('brilink_transactions', DEFAULT_TRANSACTIONS),
        brilink_capital: getLocalItem<BrilinkCapitalEntry[]>('brilink_capital', DEFAULT_CAPITAL),
        customer_funds: await this.getCustomerFunds(),
        investors: await this.getInvestors(),
      },
    };
    return JSON.stringify(backupData, null, 2);
  }

  async importBackup(jsonString: string): Promise<{ success: boolean; message: string }> {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('File JSON tidak valid.');
      }

      const payload = parsed.data || parsed;
      if (!payload.settings && !payload.products && !payload.categories) {
        throw new Error('Format file backup tidak sesuai (struktur data V_R Store tidak ditemukan).');
      }

      if (payload.settings) {
        setLocalItem('settings', payload.settings);
      }
      if (Array.isArray(payload.categories)) {
        setLocalItem('categories', payload.categories);
      }
      if (Array.isArray(payload.products)) {
        setLocalItem('products', payload.products);
      }
      if (Array.isArray(payload.brilink_periods)) {
        setLocalItem('brilink_periods', payload.brilink_periods);
      }
      if (Array.isArray(payload.brilink_transactions)) {
        setLocalItem('brilink_transactions', payload.brilink_transactions);
      }
      if (Array.isArray(payload.brilink_capital)) {
        setLocalItem('brilink_capital', payload.brilink_capital);
      }
      if (Array.isArray(payload.customer_funds)) {
        setLocalItem('customer_funds', payload.customer_funds);
      }
      if (Array.isArray(payload.investors)) {
        setLocalItem('investors', payload.investors);
      }

      return {
        success: true,
        message: 'Data berhasil dipulihkan dari file backup.',
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Gagal memulihkan file backup.',
      };
    }
  }

  async resetToEmpty(): Promise<{ success: boolean; message: string }> {
    try {
      // Kosongkan seluruh data dummy produk, transaksi, modal, uang nasabah, dan investor
      setLocalItem('products', []);
      setLocalItem('brilink_transactions', []);
      setLocalItem('brilink_capital', []);
      setLocalItem('customer_funds', []);
      setLocalItem('investors', []);
      // Reset kategori ke kategori bawaan standar
      setLocalItem('categories', DEFAULT_CATEGORIES);
      // Inisialisasi periode berjalan (bulan saat ini)
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const currentPeriodId = `per-${currentYear}-${String(currentMonth).padStart(2, '0')}`;
      setLocalItem('brilink_periods', [
        { id: currentPeriodId, month: currentMonth, year: currentYear, status: 'open' },
      ]);

      return {
        success: true,
        message: 'Semua data contoh berhasil dikosongkan! Anda sekarang dapat mulai memasukkan data riil toko.',
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Gagal mengosongkan data.',
      };
    }
  }
}

export const dataService = new DataService();

