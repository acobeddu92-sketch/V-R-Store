import * as XLSX from 'xlsx';
import { BrilinkDailyTransaction, MonthlyRecapRow, Investor, BrilinkCapitalEntry, Product, CustomerFundEntry } from '../types/database';
import { formatRupiah } from './currency';
import { MONTH_NAMES_ID, formatDateID } from './date';

/**
 * Ekspor Laporan Transaksi Bulanan ke Excel
 */
export function exportMonthlyTransactionsToExcel(
  transactions: BrilinkDailyTransaction[],
  month: number,
  year: number,
  summary: {
    totalCount: number;
    totalCash: number;
    totalBrimo: number;
    totalPayfazz: number;
    totalBrilian: number;
    totalCustomerFunds: number;
    totalDebt: number;
    totalCapital: number;
    totalIncome: number;
  }
) {
  const monthName = MONTH_NAMES_ID[month - 1];
  const title = `Laporan Transaksi BRILink - ${monthName} ${year}`;

  const rows = transactions.map((t, idx) => ({
    'No': idx + 1,
    'Hari / Tanggal': formatDateID(t.transaction_date, true),
    'Jumlah Transaksi': t.transaction_count,
    'Jumlah Tunai (Rp)': t.cash_amount,
    'Saldo BRIMO (Rp)': t.brimo_balance,
    'Saldo Payfazz (Rp)': t.payfazz_balance,
    'Saldo Brilian (Rp)': t.brilian_balance,
    'Uang Nasabah (Rp)': t.customer_funds,
    'Catatan Utang (Rp)': t.debt_notes,
    'Modal Hari Ini (Rp)': t.daily_capital,
    'Pendapatan Hari Ini (Rp)': t.daily_income,
    'Catatan': t.notes || '',
  }));

  // Baris Total
  rows.push({
    'No': 'TOTAL' as any,
    'Hari / Tanggal': `${transactions.length} Hari Transaksi`,
    'Jumlah Transaksi': summary.totalCount,
    'Jumlah Tunai (Rp)': summary.totalCash,
    'Saldo BRIMO (Rp)': summary.totalBrimo,
    'Saldo Payfazz (Rp)': summary.totalPayfazz,
    'Saldo Brilian (Rp)': summary.totalBrilian,
    'Uang Nasabah (Rp)': summary.totalCustomerFunds,
    'Catatan Utang (Rp)': summary.totalDebt,
    'Modal Hari Ini (Rp)': summary.totalCapital,
    'Pendapatan Hari Ini (Rp)': summary.totalIncome,
    'Catatan': `Total Pendapatan Bulan: ${formatRupiah(summary.totalIncome)}`,
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `${monthName} ${year}`);

  XLSX.writeFile(workbook, `VR_Store_Transaksi_${monthName}_${year}.xlsx`);
}

/**
 * Ekspor Laporan Tahunan ke Excel
 */
export function exportAnnualReportToExcel(
  monthlyRows: MonthlyRecapRow[],
  year: number,
  totals: {
    totalCapital: number;
    totalTransactions: number;
    totalCash: number;
    totalBrimo: number;
    totalPayfazz: number;
    totalBrilian: number;
    totalCustomerFunds: number;
    totalDebt: number;
    totalDailyCapital: number;
    totalIncome: number;
    totalDividend: number;
  }
) {
  const rows = monthlyRows.map((r, idx) => ({
    'No': idx + 1,
    'Bulan': r.month_name,
    'Modal Masuk (Rp)': r.capital_entered,
    'Jml Transaksi': r.transaction_count,
    'Tunai (Rp)': r.cash_amount,
    'Saldo BRIMO (Rp)': r.brimo_balance,
    'Saldo Payfazz (Rp)': r.payfazz_balance,
    'Saldo Brilian (Rp)': r.brilian_balance,
    'Uang Nasabah (Rp)': r.customer_funds,
    'Catatan Utang (Rp)': r.debt_notes,
    'Modal Harian (Rp)': r.daily_capital,
    'Pendapatan Transaksi (Rp)': r.monthly_income,
    'Komisi Dividen (Rp)': r.dividend_commission,
  }));

  // Baris Total Tahunan
  rows.push({
    'No': 'TOTAL' as any,
    'Bulan': `Tahun ${year}`,
    'Modal Masuk (Rp)': totals.totalCapital,
    'Jml Transaksi': totals.totalTransactions,
    'Tunai (Rp)': totals.totalCash,
    'Saldo BRIMO (Rp)': totals.totalBrimo,
    'Saldo Payfazz (Rp)': totals.totalPayfazz,
    'Saldo Brilian (Rp)': totals.totalBrilian,
    'Uang Nasabah (Rp)': totals.totalCustomerFunds,
    'Catatan Utang (Rp)': totals.totalDebt,
    'Modal Harian (Rp)': totals.totalDailyCapital,
    'Pendapatan Transaksi (Rp)': totals.totalIncome,
    'Komisi Dividen (Rp)': totals.totalDividend,
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Rekap ${year}`);

  XLSX.writeFile(workbook, `VR_Store_Laporan_Tahunan_${year}.xlsx`);
}

/**
 * Ekspor Data Modal ke Excel
 */
export function exportCapitalToExcel(entries: BrilinkCapitalEntry[]) {
  const rows = entries.map((e, idx) => ({
    'No': idx + 1,
    'Tanggal Masuk': formatDateID(e.entry_date, false),
    'Sumber Modal': e.source,
    'Nominal Modal (Rp)': e.amount,
    'Catatan': e.notes || '',
  }));

  const total = entries.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  rows.push({
    'No': 'TOTAL' as any,
    'Tanggal Masuk': `${entries.length} Entri`,
    'Sumber Modal': 'Total Modal Masuk',
    'Nominal Modal (Rp)': total,
    'Catatan': '',
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Modal Masuk');
  XLSX.writeFile(workbook, `VR_Store_Modal_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Ekspor Data Dividen Investor ke Excel
 */
export function exportInvestorsToExcel(investors: Investor[]) {
  const rows = investors.map((inv, idx) => ({
    'No': idx + 1,
    'Nama Investor': inv.name,
    'Pokok Investasi (Rp)': inv.investment_amount,
    'Tanggal Masuk': formatDateID(inv.join_date, false),
    'Lama (Bulan Penuh)': inv.full_months_count || 0,
    'Komisi Bulanan 0.5% (Rp)': inv.monthly_commission || 0,
    'Total Komisi Diperoleh (Rp)': inv.total_commission_earned || 0,
    'Status': inv.status === 'active' ? 'Aktif' : 'Selesai/Berhenti',
    'Catatan': inv.notes || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Dividen Investor');
  XLSX.writeFile(workbook, `VR_Store_Dividen_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Ekspor Daftar Barang ke Excel
 */
export function exportProductsToExcel(products: Product[]) {
  const rows = products.map((p, idx) => ({
    'No': idx + 1,
    'Nama Barang': p.name,
    'Kategori': p.category_name || '-',
    'Harga Jual (Rp)': p.price,
    'Stok': p.stock,
    'Status': p.is_active ? 'Aktif' : 'Nonaktif',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Daftar Produk');
  XLSX.writeFile(workbook, `VR_Store_Produk_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Ekspor Data Uang Nasabah ke Excel
 */
export function exportCustomerFundsToExcel(
  funds: CustomerFundEntry[],
  month: number,
  year: number,
  filterDate?: string
) {
  const monthName = MONTH_NAMES_ID[month - 1];
  const dateLabel = filterDate ? `Tanggal ${formatDateID(filterDate, false)}` : `Bulan ${monthName} ${year}`;
  const totalNominal = funds.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

  const rows = funds.map((f, idx) => ({
    'No': idx + 1,
    'Hari / Tanggal': formatDateID(f.entry_date, true),
    'Nama Nasabah': f.customer_name,
    'Keterangan / Keperluan': f.notes || '-',
    'Nominal Uang Nasabah (Rp)': f.amount,
  }));

  // Baris Total
  rows.push({
    'No': 'TOTAL' as any,
    'Hari / Tanggal': `${funds.length} Catatan Nasabah`,
    'Nama Nasabah': dateLabel,
    'Keterangan / Keperluan': 'Total Akumulasi Uang Nasabah',
    'Nominal Uang Nasabah (Rp)': totalNominal,
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Uang Nasabah');
  XLSX.writeFile(workbook, `VR_Store_Uang_Nasabah_${filterDate || `${year}_${month}`}.xlsx`);
}

