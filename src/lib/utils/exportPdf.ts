import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BrilinkDailyTransaction, MonthlyRecapRow, Investor, BrilinkCapitalEntry, Product, CustomerFundEntry } from '../types/database';
import { formatRupiah } from './currency';
import { MONTH_NAMES_ID, formatDateID } from './date';

/**
 * Ekspor Laporan Transaksi Bulanan ke PDF (A4 Landscape)
 */
export function exportMonthlyTransactionsToPdf(
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
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const monthName = MONTH_NAMES_ID[month - 1];

  // Header V_R Store
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105); // Emerald Green
  doc.text('V_R STORE — SISTEM MANAJEMEN KEUANGAN BRILINK', 14, 15);

  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text(`LAPORAN TRANSAKSI HARIAN: ${monthName.toUpperCase()} ${year}`, 14, 22);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Dicetak pada: ${formatDateID(new Date(), true)}`, 14, 27);

  // Table Body
  const tableData = transactions.map((t, idx) => [
    idx + 1,
    formatDateID(t.transaction_date, true),
    t.transaction_count,
    formatRupiah(t.cash_amount),
    formatRupiah(t.brimo_balance),
    formatRupiah(t.payfazz_balance),
    formatRupiah(t.brilian_balance),
    formatRupiah(t.customer_funds),
    formatRupiah(t.debt_notes),
    formatRupiah(t.daily_capital),
    formatRupiah(t.daily_income),
    t.notes || '-',
  ]);

  // Baris Total
  const totalRow = [
    'TOTAL',
    `${transactions.length} Hari Transaksi`,
    summary.totalCount,
    formatRupiah(summary.totalCash),
    formatRupiah(summary.totalBrimo),
    formatRupiah(summary.totalPayfazz),
    formatRupiah(summary.totalBrilian),
    formatRupiah(summary.totalCustomerFunds),
    formatRupiah(summary.totalDebt),
    formatRupiah(summary.totalCapital),
    formatRupiah(summary.totalIncome),
    '',
  ];

  autoTable(doc, {
    startY: 32,
    head: [[
      'No',
      'Hari/Tanggal',
      'Jml Trx',
      'Tunai',
      'Saldo BRIMO',
      'Saldo Payfazz',
      'Saldo Brilian',
      'Uang Nasabah',
      'Catatan Utang',
      'Modal Hari Ini',
      'Pendapatan',
      'Catatan',
    ]],
    body: [...tableData, totalRow],
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1.5, halign: 'right' },
    headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'left', cellWidth: 32 },
      2: { halign: 'center', cellWidth: 12 },
      11: { halign: 'left', cellWidth: 26 },
    },
    didParseCell: (data) => {
      // Highlight baris total
      if (data.row.index === tableData.length) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [240, 253, 244];
        data.cell.styles.textColor = [5, 150, 105];
      }
    },
  });

  doc.save(`VR_Store_Laporan_${monthName}_${year}.pdf`);
}

/**
 * Ekspor Laporan Tahunan ke PDF (A4 Landscape)
 */
export function exportAnnualReportToPdf(
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
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Header V_R Store
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text('V_R STORE — REKAPITULASI TAHUNAN BRILINK', 14, 15);

  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text(`TAHUN ANGGARAN: ${year}`, 14, 22);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Dicetak pada: ${formatDateID(new Date(), true)}`, 14, 27);

  const tableData = monthlyRows.map((r, idx) => [
    idx + 1,
    r.month_name,
    formatRupiah(r.capital_entered),
    r.transaction_count,
    formatRupiah(r.cash_amount),
    formatRupiah(r.brimo_balance),
    formatRupiah(r.payfazz_balance),
    formatRupiah(r.brilian_balance),
    formatRupiah(r.customer_funds),
    formatRupiah(r.debt_notes),
    formatRupiah(r.daily_capital),
    formatRupiah(r.monthly_income),
    formatRupiah(r.dividend_commission),
  ]);

  const totalRow = [
    'TOTAL',
    `Tahun ${year}`,
    formatRupiah(totals.totalCapital),
    totals.totalTransactions,
    formatRupiah(totals.totalCash),
    formatRupiah(totals.totalBrimo),
    formatRupiah(totals.totalPayfazz),
    formatRupiah(totals.totalBrilian),
    formatRupiah(totals.totalCustomerFunds),
    formatRupiah(totals.totalDebt),
    formatRupiah(totals.totalDailyCapital),
    formatRupiah(totals.totalIncome),
    formatRupiah(totals.totalDividend),
  ];

  autoTable(doc, {
    startY: 32,
    head: [[
      'No',
      'Bulan',
      'Modal Masuk',
      'Jml Trx',
      'Tunai',
      'Saldo BRIMO',
      'Saldo Payfazz',
      'Saldo Brilian',
      'Uang Nasabah',
      'Catatan Utang',
      'Modal Harian',
      'Pendapatan',
      'Komisi Dividen',
    ]],
    body: [...tableData, totalRow],
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1.5, halign: 'right' },
    headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'left', cellWidth: 20 },
      3: { halign: 'center', cellWidth: 12 },
    },
    didParseCell: (data) => {
      if (data.row.index === tableData.length) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [240, 253, 244];
        data.cell.styles.textColor = [5, 150, 105];
      }
    },
  });

  doc.save(`VR_Store_Laporan_Tahunan_${year}.pdf`);
}

/**
 * Ekspor Data Dividen Investor ke PDF
 */
export function exportInvestorsToPdf(investors: Investor[]) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text('V_R STORE — DAFTAR INVESTOR & KOMISI DIVIDEN', 14, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Ketentuan: Komisi bulanan 0,5% per bulan penuh. Dicetak: ${formatDateID(new Date(), true)}`, 14, 22);

  const tableData = investors.map((inv, idx) => [
    idx + 1,
    inv.name,
    formatRupiah(inv.investment_amount),
    formatDateID(inv.join_date, false),
    `${inv.full_months_count || 0} Bln`,
    formatRupiah(inv.monthly_commission),
    formatRupiah(inv.total_commission_earned),
    inv.status === 'active' ? 'Aktif' : 'Selesai',
  ]);

  const totalPrincipal = investors.reduce((sum, i) => sum + (Number(i.investment_amount) || 0), 0);
  const totalEarned = investors.reduce((sum, i) => sum + (Number(i.total_commission_earned) || 0), 0);

  const totalRow = [
    'TOTAL',
    `${investors.length} Investor`,
    formatRupiah(totalPrincipal),
    '',
    '',
    '',
    formatRupiah(totalEarned),
    '',
  ];

  autoTable(doc, {
    startY: 28,
    head: [[
      'No',
      'Nama Investor',
      'Pokok Investasi',
      'Tgl Masuk',
      'Lama',
      'Komisi/Bulan',
      'Total Komisi',
      'Status',
    ]],
    body: [...tableData, totalRow],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, halign: 'right' },
    headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'left', cellWidth: 40 },
      3: { halign: 'center' },
      4: { halign: 'center' },
      7: { halign: 'center' },
    },
    didParseCell: (data) => {
      if (data.row.index === tableData.length) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [240, 253, 244];
        data.cell.styles.textColor = [5, 150, 105];
      }
    },
  });

  doc.save(`VR_Store_Dividen_${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Ekspor Data Uang Nasabah ke PDF (A4 Portrait)
 */
export function exportCustomerFundsToPdf(
  funds: CustomerFundEntry[],
  month: number,
  year: number,
  filterDate?: string
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const monthName = MONTH_NAMES_ID[month - 1];
  const dateLabel = filterDate ? `Tanggal: ${formatDateID(filterDate, false)}` : `Periode: ${monthName.toUpperCase()} ${year}`;

  // Header V_R Store
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(225, 29, 72); // Rose
  doc.text('V_R STORE — SISTEM BRILINK', 14, 15);

  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(`REKAPITULASI DAFTAR UANG NASABAH (${dateLabel})`, 14, 22);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Dicetak pada: ${formatDateID(new Date(), true)}`, 14, 27);

  // Table Body
  const tableData = funds.map((f, idx) => [
    idx + 1,
    formatDateID(f.entry_date, true),
    f.customer_name,
    f.notes || '-',
    formatRupiah(f.amount),
  ]);

  const totalAmount = funds.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

  const totalRow = [
    'TOTAL',
    `${funds.length} Catatan`,
    dateLabel,
    'Total Uang Nasabah',
    formatRupiah(totalAmount),
  ];

  autoTable(doc, {
    startY: 31,
    head: [[
      'No',
      'Hari / Tanggal',
      'Nama Nasabah',
      'Keterangan / Keperluan',
      'Nominal (Rp)',
    ]],
    body: [...tableData, totalRow],
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2.5, halign: 'left' },
    headStyles: { fillColor: [225, 29, 72], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { halign: 'center', cellWidth: 35 },
      2: { halign: 'left', cellWidth: 45 },
      3: { halign: 'left' },
      4: { halign: 'right', cellWidth: 38 },
    },
    didParseCell: (data) => {
      if (data.row.index === tableData.length) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [255, 241, 242]; // Rose-50
        data.cell.styles.textColor = [190, 18, 60]; // Rose-700
      }
    },
  });

  doc.save(`VR_Store_Uang_Nasabah_${filterDate || `${year}_${month}`}.pdf`);
}

