import { getAnniversaryDate } from './date';
import { Investor, InvestmentCommission, DebtItem } from '../types/database';

/**
 * Formula Pendapatan Harian BRILink (Excel Spreadsheet Style)
 * Murni dihitung otomatis per baris tanggal:
 * Pendapatan Hari Ini = (Tunai + BRIMO + Payfazz + Brilian + Catatan Utang) - Modal Hari Ini - Uang Nasabah
 */
export function calculateDailyIncome(params: {
  cash_amount?: number;
  brimo_balance?: number;
  payfazz_balance?: number;
  brilian_balance?: number;
  debt_notes?: number;
  daily_capital?: number;
  customer_funds?: number;
}): number {
  const tunai = Number(params.cash_amount) || 0;
  const brimo = Number(params.brimo_balance) || 0;
  const payfazz = Number(params.payfazz_balance) || 0;
  const brilian = Number(params.brilian_balance) || 0;
  const utang = Number(params.debt_notes) || 0;
  const modalHariIni = Number(params.daily_capital) || 0;
  const uangNasabah = Number(params.customer_funds) || 0;

  return (tunai + brimo + payfazz + brilian + utang) - modalHariIni - uangNasabah;
}

/**
 * Menghitung status durasi dan komisi dividen untuk investor.
 * Aturan Ketat:
 * - Komisi dasar: Pokok * 0.5% (0.005) per bulan penuh.
 * - Jika durasi < 1 bulan (< 30 hari), komisi = Rp 0, status: "Belum Cukup 1 Bulan".
 * - Jika durasi >= 1 bulan (>= 30 hari), komisi bulanan aktif dan dihitung per bulan penuh.
 */
export function generateInvestorCommissions(
  investor: Investor,
  asOfDate: Date = new Date()
): {
  commissions: InvestmentCommission[];
  durationDays: number;
  isEligible: boolean;
  statusText: string;
  fullMonthsCount: number;
  monthlyCommission: number;
  totalEarned: number;
} {
  const principal = Number(investor.investment_amount) || 0;
  const baseRateCommission = Math.round(principal * 0.005); // 0.5%

  if (!investor.join_date || principal <= 0) {
    return {
      commissions: [],
      durationDays: 0,
      isEligible: false,
      statusText: 'Data Belum Lengkap',
      fullMonthsCount: 0,
      monthlyCommission: 0,
      totalEarned: 0,
    };
  }

  const joinDate = new Date(investor.join_date);
  const effectiveEndDate = investor.status === 'terminated' && investor.termination_date
    ? new Date(investor.termination_date)
    : asOfDate;

  // Hitung selisih hari
  const diffTime = effectiveEndDate.getTime() - joinDate.getTime();
  const durationDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

  // Cek apakah sudah genap 1 bulan penuh (minimal 30 hari atau anniversary pertama)
  const firstAnniversary = getAnniversaryDate(investor.join_date, 1);
  const isEligible = durationDays >= 30 && effectiveEndDate >= firstAnniversary;

  if (!isEligible) {
    return {
      commissions: [],
      durationDays,
      isEligible: false,
      statusText: `Belum Cukup 1 Bulan (${durationDays} Hari)`,
      fullMonthsCount: 0,
      monthlyCommission: 0,
      totalEarned: 0,
    };
  }

  // Hitung bulan penuh
  const commissions: InvestmentCommission[] = [];
  let monthIndex = 1;

  while (true) {
    const anniversary = getAnniversaryDate(investor.join_date, monthIndex);
    if (anniversary > effectiveEndDate) {
      break;
    }

    const periodMonth = anniversary.getMonth() + 1;
    const periodYear = anniversary.getFullYear();

    commissions.push({
      id: `${investor.id}-${periodYear}-${periodMonth}`,
      investor_id: investor.id,
      investor_name: investor.name,
      period_month: periodMonth,
      period_year: periodYear,
      full_month_index: monthIndex,
      anniversary_date: anniversary.toISOString().split('T')[0],
      commission_amount: baseRateCommission,
      status: 'earned',
      created_at: anniversary.toISOString(),
    });

    monthIndex++;
  }

  const fullMonthsCount = commissions.length;
  const totalEarned = fullMonthsCount * baseRateCommission;

  return {
    commissions,
    durationDays,
    isEligible: true,
    statusText: `${fullMonthsCount} Bulan Penuh (${durationDays} Hari)`,
    fullMonthsCount,
    monthlyCommission: baseRateCommission,
    totalEarned,
  };
}

/**
  * Parsing catatan utang dari kolom notes (JSON berstruktur) atau nilai numerik warisan (legacy).
  * Menjaga kompatibilitas 100% dengan data lama di Supabase tanpa perlu mengubah tipe data kolom debt_notes.
  */
export function parseDebtNotes(
  notesStr?: string | null,
  fallbackDebtAmount: number = 0
): { items: DebtItem[]; generalNote: string } {
  if (!notesStr || !notesStr.trim()) {
    if (fallbackDebtAmount > 0) {
      return {
        items: [{ id: 'legacy-1', name: 'Catatan Utang', amount: fallbackDebtAmount }],
        generalNote: '',
      };
    }
    return { items: [], generalNote: '' };
  }

  const trimmed = notesStr.trim();

  // Coba parse format JSON
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object') {
        const rawItems = Array.isArray(parsed.debt_items) ? parsed.debt_items : [];
        const items: DebtItem[] = rawItems.map((item: any, idx: number) => ({
          id: String(item.id || `debt-${idx + 1}`),
          name: String(item.name || `Peminjam ${idx + 1}`),
          amount: Number(item.amount) || 0,
        }));

        const generalNote =
          typeof parsed.note === 'string'
            ? parsed.note
            : typeof parsed.generalNote === 'string'
            ? parsed.generalNote
            : '';

        // Jika items kosong tapi ada fallback utang
        if (items.length === 0 && fallbackDebtAmount > 0) {
          items.push({ id: 'legacy-1', name: 'Catatan Utang', amount: fallbackDebtAmount });
        }

        return { items, generalNote };
      }
    } catch {
      // Jika bukan JSON valid, perlakukan sebagai catatan umum biasa
    }
  }

  // Fallback: format teks biasa lama
  return {
    items: fallbackDebtAmount > 0
      ? [{ id: 'legacy-1', name: 'Catatan Utang', amount: fallbackDebtAmount }]
      : [],
    generalNote: trimmed,
  };
}

/**
 * Memformat daftar item utang dan catatan umum ke dalam string notes untuk disimpan ke Supabase.
 */
export function formatDebtNotes(items: DebtItem[], generalNote: string = ''): string {
  const cleanNote = generalNote.trim();
  const validItems = (items || []).filter((item) => (item.name && item.name.trim()) || item.amount > 0);

  if (validItems.length === 0) {
    return cleanNote;
  }

  return JSON.stringify({
    debt_items: validItems,
    note: cleanNote,
  });
}
