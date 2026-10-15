-- ==============================================================================
-- DATABASE SCHEMA V_R STORE
-- Sistem Manajemen Toko & Keuangan BRILink
-- ==============================================================================

-- 1. Tabel Pengaturan Toko
CREATE TABLE IF NOT EXISTS public.store_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_name TEXT NOT NULL DEFAULT 'V_R Store',
    tagline TEXT NOT NULL DEFAULT 'Lengkap Kebutuhan Anda, Praktis Pelayanannya!',
    description TEXT NOT NULL DEFAULT 'Pusat belanja kebutuhan harian, ATK, fotocopy, print, serta layanan transaksi perbankan BRILink dan pulsa terlengkap.',
    address TEXT NOT NULL DEFAULT 'Jl. Poros Utama No. 88, Lingkungan Toko',
    phone TEXT NOT NULL DEFAULT '081234567890',
    whatsapp TEXT NOT NULL DEFAULT '6281234567890',
    operational_hours TEXT NOT NULL DEFAULT 'Setiap Hari: 07:30 - 22:00 WITA',
    maps_url TEXT DEFAULT '',
    show_stock_to_public BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert row default jika belum ada
INSERT INTO public.store_settings (id, store_name)
SELECT gen_random_uuid(), 'V_R Store'
WHERE NOT EXISTS (SELECT 1 FROM public.store_settings);

-- 2. Tabel Kelompok / Kategori Barang
CREATE TABLE IF NOT EXISTS public.product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabel Produk
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES public.product_categories(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    price NUMERIC(15, 2) NOT NULL CHECK (price >= 0),
    stock INT NOT NULL CHECK (stock >= 0) DEFAULT 0,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active, is_deleted);

-- 4. Tabel Periode Laporan Transaksi BRILink
CREATE TABLE IF NOT EXISTS public.brilink_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INT NOT NULL CHECK (year >= 2000),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_month_year UNIQUE (month, year)
);

-- 5. Tabel Transaksi Harian BRILink (Mandiri per baris, Excel-style)
CREATE TABLE IF NOT EXISTS public.brilink_daily_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id UUID NOT NULL REFERENCES public.brilink_periods(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL,
    transaction_count INT NOT NULL CHECK (transaction_count >= 0) DEFAULT 0,
    cash_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    brimo_balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
    payfazz_balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
    brilian_balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
    customer_funds NUMERIC(15, 2) NOT NULL DEFAULT 0,
    debt_notes NUMERIC(15, 2) NOT NULL DEFAULT 0,
    daily_capital NUMERIC(15, 2) NOT NULL DEFAULT 0,
    daily_income NUMERIC(15, 2) NOT NULL DEFAULT 0, -- Dihitung: Tunai + BRIMO + Payfazz + Brilian + Utang - Modal Hari Ini - Uang Nasabah
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_period_date UNIQUE (period_id, transaction_date)
);

CREATE INDEX IF NOT EXISTS idx_trans_period ON public.brilink_daily_transactions(period_id);
CREATE INDEX IF NOT EXISTS idx_trans_date ON public.brilink_daily_transactions(transaction_date);

-- 6. Tabel Entri Modal BRILink
CREATE TABLE IF NOT EXISTS public.brilink_capital_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_date DATE NOT NULL,
    source TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_capital_date ON public.brilink_capital_entries(entry_date);

-- 6b. Tabel Uang Nasabah (Titipan / Kas Titipan Nasabah Harian)
CREATE TABLE IF NOT EXISTS public.brilink_customer_funds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_date DATE NOT NULL,
    customer_name TEXT NOT NULL,
    notes TEXT,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_funds_date ON public.brilink_customer_funds(entry_date);

-- 7. Tabel Investor (Dividen)
CREATE TABLE IF NOT EXISTS public.investors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    investment_amount NUMERIC(15, 2) NOT NULL CHECK (investment_amount > 0),
    join_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'terminated')),
    termination_date DATE,
    returned_principal NUMERIC(15, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Tabel Pencatatan Komisi Dividen Per Periode Bulan Penuh
CREATE TABLE IF NOT EXISTS public.investment_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investor_id UUID NOT NULL REFERENCES public.investors(id) ON DELETE CASCADE,
    period_month INT NOT NULL CHECK (period_month BETWEEN 1 AND 12),
    period_year INT NOT NULL CHECK (period_year >= 2000),
    full_month_index INT NOT NULL,
    anniversary_date DATE NOT NULL,
    commission_amount NUMERIC(15, 2) NOT NULL DEFAULT 0, -- 0.5% dari pokok
    status TEXT NOT NULL DEFAULT 'earned' CHECK (status IN ('earned', 'paid')),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_investor_period UNIQUE (investor_id, period_month, period_year)
);

-- 9. Tabel Audit Log
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brilink_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brilink_daily_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brilink_capital_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brilink_customer_funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy Publik (Read-Only untuk halaman pelanggan)
CREATE POLICY "Public Read Store Settings" ON public.store_settings
    FOR SELECT USING (true);

CREATE POLICY "Public Read Active Categories" ON public.product_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public Read Active Products" ON public.products
    FOR SELECT USING (is_active = true AND is_deleted = false);

-- Policy Owner Terautentikasi (CRUD Penuh)
CREATE POLICY "Owner All Store Settings" ON public.store_settings
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Owner All Categories" ON public.product_categories
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Owner All Products" ON public.products
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Owner All BRILink Periods" ON public.brilink_periods
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Owner All Daily Transactions" ON public.brilink_daily_transactions
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Owner All Capital Entries" ON public.brilink_capital_entries
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Owner All Customer Funds" ON public.brilink_customer_funds
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Owner All Investors" ON public.investors
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Owner All Commissions" ON public.investment_commissions
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Owner All Audit Logs" ON public.audit_logs
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- DATA AWAL KATEGORI (DEFAULT SEED)
-- ==============================================================================
INSERT INTO public.product_categories (name, slug, sort_order) VALUES
('ATK', 'atk', 1),
('Fotocopy & Print', 'fotocopy-print', 2),
('Perlengkapan Sekolah', 'perlengkapan-sekolah', 3),
('Aksesoris HP', 'aksesoris-hp', 4),
('Aksesoris', 'aksesoris', 5),
('Parfum', 'parfum', 6)
ON CONFLICT (slug) DO NOTHING;
