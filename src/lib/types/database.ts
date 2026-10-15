export interface StoreSettings {
  id: string;
  store_name: string;
  tagline: string;
  description: string;
  address: string;
  phone: string;
  whatsapp: string;
  operational_hours: string;
  maps_url: string;
  show_stock_to_public: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  product_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  category_id: string;
  category_name?: string;
  name: string;
  price: number;
  stock: number;
  image_url: string | null;
  is_active: boolean;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BrilinkPeriod {
  id: string;
  month: number; // 1 - 12
  year: number;
  status: 'open' | 'closed';
  created_at?: string;
  updated_at?: string;
}

export interface BrilinkDailyTransaction {
  id: string;
  period_id: string;
  transaction_date: string; // YYYY-MM-DD
  transaction_count: number;
  cash_amount: number;
  brimo_balance: number;
  payfazz_balance: number;
  brilian_balance: number;
  customer_funds: number;
  debt_notes: number;
  daily_capital: number;
  daily_income: number; // calculated: (Tunai + BRIMO + Payfazz + Brilian + Utang) - Modal - Uang Nasabah
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BrilinkCapitalEntry {
  id: string;
  entry_date: string; // YYYY-MM-DD
  source: string;
  amount: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Investor {
  id: string;
  name: string;
  investment_amount: number;
  join_date: string; // YYYY-MM-DD
  status: 'active' | 'terminated';
  termination_date?: string | null;
  returned_principal?: number;
  notes?: string;
  // Computed & status display fields
  duration_days?: number;
  is_eligible_full_month?: boolean;
  duration_status_text?: string;
  full_months_count?: number;
  monthly_commission?: number; // 0.5% dari pokok jika genap >= 1 bulan
  total_commission_earned?: number;
  created_at?: string;
  updated_at?: string;
}

export interface InvestmentCommission {
  id: string;
  investor_id: string;
  investor_name?: string;
  period_month: number;
  period_year: number;
  full_month_index: number;
  anniversary_date: string;
  commission_amount: number;
  status: 'earned' | 'paid';
  paid_at?: string | null;
  created_at?: string;
}

export interface MonthlyRecapRow {
  month: number;
  month_name: string;
  year: number;
  capital_entered: number;
  transaction_count: number;
  cash_amount: number;
  brimo_balance: number;
  payfazz_balance: number;
  brilian_balance: number;
  customer_funds: number;
  debt_notes: number;
  daily_capital: number;
  monthly_income: number;
  dividend_commission: number;
  net_income: number; // Pendapatan Transaksi - Komisi Investor
  notes?: string;
}

export interface AnnualReportSummary {
  year: number;
  total_capital_entered: number;
  total_transactions: number;
  total_cash: number;
  total_brimo: number;
  total_payfazz: number;
  total_brilian: number;
  total_customer_funds: number;
  total_debt_notes: number;
  total_daily_capital: number;
  total_annual_income: number;
  total_dividend_commission: number;
  total_net_income: number;
  monthly_rows: MonthlyRecapRow[];
}
