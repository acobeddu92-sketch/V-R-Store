import { getAnniversaryDate } from './date';
import { Investor, InvestmentCommission, DebtItem, BalanceEntryItem } from '../types/database';

/**
 * Formula Pendapatan Harian BRILink (Excel Spreadsheet Style)
 * Murni dihitung otomatis per baris tanggal:
 * Pendapatan Hari Ini = (Tunai + BRIMO + Payfazz + Saldo BPD/Brilian + Catatan Utang) - Modal - Uang Nasabah
 */
export function calculateDailyIncome(params: {
  cash_amount?: number;
  brimo_balance?: number;
  payfazz_balance?: number;
  brilian_balance?: number;
  bpd_balance?: number;
  debt_notes?: number;
  daily_capital?: number;
  customer_funds?: number;
}): number {
  const tunai = Number(params.cash_amount) || 0;
  const brimo = Number(params.brimo_balance) || 0;
  const payfazz = Number(params.payfazz_balance) || 0;
  const bpd = Number(params.bpd_balance !== undefined ? params.bpd_balance : params.brilian_balance) || 0;
  const utang = Number(params.debt_notes) || 0;
  const modalHariIni = Number(params.daily_capital) || 0;
  const uangNasabah = Number(params.customer_funds) || 0;

  return (tunai + brimo + payfazz + bpd + utang) - modalHariIni - uangNasabah;
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

  // Parse tanggal masuk (join_date) secara aman di timezone lokal
  let joinDate: Date;
  if (typeof investor.join_date === 'string' && investor.join_date.includes('-')) {
    const parts = investor.join_date.split('T')[0].split('-').map(Number);
    joinDate = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
  } else {
    joinDate = new Date(investor.join_date);
  }

  // Batas akhir periode efektif (bulan berjalan atau tanggal terminasi)
  let effectiveEndDate: Date;
  if (investor.status === 'terminated' && investor.termination_date) {
    if (typeof investor.termination_date === 'string' && investor.termination_date.includes('-')) {
      const parts = investor.termination_date.split('T')[0].split('-').map(Number);
      effectiveEndDate = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999);
    } else {
      effectiveEndDate = new Date(investor.termination_date);
    }
  } else {
    // Akhir hari lokal pada asOfDate (bulan kalender berjalan saat ini)
    effectiveEndDate = new Date(
      asOfDate.getFullYear(),
      asOfDate.getMonth(),
      asOfDate.getDate(),
      23,
      59,
      59,
      999
    );
  }

  // Hitung selisih hari
  const diffTime = effectiveEndDate.getTime() - joinDate.getTime();
  const durationDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

  // Cek apakah sudah genap 1 bulan penuh (anniversary pertama sudah tercapai dalam rentang durasi)
  const firstAnniversary = getAnniversaryDate(investor.join_date, 1);
  const isEligible = effectiveEndDate >= firstAnniversary && durationDays >= 28;

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
    const anniversaryStr = `${periodYear}-${String(periodMonth).padStart(2, '0')}-${String(anniversary.getDate()).padStart(2, '0')}`;

    commissions.push({
      id: `${investor.id}-${periodYear}-${periodMonth}`,
      investor_id: investor.id,
      investor_name: investor.name,
      period_month: periodMonth,
      period_year: periodYear,
      full_month_index: monthIndex,
      anniversary_date: anniversaryStr,
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

export interface ParsedTransactionNotes {
  debt_items: DebtItem[];
  brimo_items: BalanceEntryItem[];
  bpd_items: BalanceEntryItem[];
  generalNote: string;
}

/**
 * Parsing terpadu untuk catatan utang, rincian akumulasi Saldo BRIMO, dan Saldo BPD dari kolom notes (JSON).
 * Menjaga kompatibilitas 100% dengan data warisan (legacy) numerik maupun teks biasa.
 */
export function parseTransactionNotes(
  notesStr?: string | null,
  fallbacks?: {
    debtAmount?: number;
    brimoAmount?: number;
    bpdAmount?: number;
    createdAt?: string;
  }
): ParsedTransactionNotes {
  const fallbackDebt = fallbacks?.debtAmount || 0;
  const fallbackBrimo = fallbacks?.brimoAmount || 0;
  const fallbackBpd = fallbacks?.bpdAmount || 0;
  const fallbackTime = fallbacks?.createdAt || '';

  if (!notesStr || !notesStr.trim()) {
    return {
      debt_items: fallbackDebt > 0 ? [{ id: 'legacy-debt', name: 'Catatan Utang', amount: fallbackDebt }] : [],
      brimo_items: fallbackBrimo > 0 ? [{ id: 'legacy-brimo', amount: fallbackBrimo, notes: 'Saldo Awal BRIMO', timestamp: fallbackTime }] : [],
      bpd_items: fallbackBpd > 0 ? [{ id: 'legacy-bpd', amount: fallbackBpd, notes: 'Saldo Awal BPD', timestamp: fallbackTime }] : [],
      generalNote: '',
    };
  }

  const trimmed = notesStr.trim();

  // Coba parse format JSON
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object') {
        const rawDebt = Array.isArray(parsed.debt_items) ? parsed.debt_items : [];
        const debt_items: DebtItem[] = rawDebt.map((item: any, idx: number) => ({
          id: String(item.id || `debt-${idx + 1}`),
          name: String(item.name || `Peminjam ${idx + 1}`),
          amount: Number(item.amount) || 0,
        }));

        const rawBrimo = Array.isArray(parsed.brimo_items) ? parsed.brimo_items : [];
        const brimo_items: BalanceEntryItem[] = rawBrimo.map((item: any, idx: number) => ({
          id: String(item.id || `brimo-${idx + 1}`),
          amount: Number(item.amount) || 0,
          notes: item.notes ? String(item.notes) : undefined,
          timestamp: item.timestamp ? String(item.timestamp) : undefined,
        }));

        const rawBpd = Array.isArray(parsed.bpd_items) ? parsed.bpd_items : [];
        const bpd_items: BalanceEntryItem[] = rawBpd.map((item: any, idx: number) => ({
          id: String(item.id || `bpd-${idx + 1}`),
          amount: Number(item.amount) || 0,
          notes: item.notes ? String(item.notes) : undefined,
          timestamp: item.timestamp ? String(item.timestamp) : undefined,
        }));

        const generalNote =
          typeof parsed.note === 'string'
            ? parsed.note
            : typeof parsed.generalNote === 'string'
            ? parsed.generalNote
            : '';

        // Jika items kosong tapi ada fallback saldo/utang warisan
        if (debt_items.length === 0 && fallbackDebt > 0) {
          debt_items.push({ id: 'legacy-debt', name: 'Catatan Utang', amount: fallbackDebt });
        }
        if (brimo_items.length === 0 && fallbackBrimo > 0) {
          brimo_items.push({ id: 'legacy-brimo', amount: fallbackBrimo, notes: 'Saldo Awal BRIMO', timestamp: fallbackTime });
        }
        if (bpd_items.length === 0 && fallbackBpd > 0) {
          bpd_items.push({ id: 'legacy-bpd', amount: fallbackBpd, notes: 'Saldo Awal BPD', timestamp: fallbackTime });
        }

        return { debt_items, brimo_items, bpd_items, generalNote };
      }
    } catch {
      // Jika bukan JSON valid, perlakukan sebagai catatan umum teks biasa
    }
  }

  // Fallback: format teks biasa lama
  return {
    debt_items: fallbackDebt > 0 ? [{ id: 'legacy-debt', name: 'Catatan Utang', amount: fallbackDebt }] : [],
    brimo_items: fallbackBrimo > 0 ? [{ id: 'legacy-brimo', amount: fallbackBrimo, notes: 'Saldo Awal BRIMO', timestamp: fallbackTime }] : [],
    bpd_items: fallbackBpd > 0 ? [{ id: 'legacy-bpd', amount: fallbackBpd, notes: 'Saldo Awal BPD', timestamp: fallbackTime }] : [],
    generalNote: trimmed,
  };
}

/**
 * Memformat rincian item utang, rincian akumulasi saldo, dan catatan umum ke dalam string notes untuk disimpan ke Supabase.
 */
export function formatTransactionNotes(params: {
  debt_items?: DebtItem[];
  brimo_items?: BalanceEntryItem[];
  bpd_items?: BalanceEntryItem[];
  generalNote?: string;
}): string {
  const cleanNote = (params.generalNote || '').trim();
  const validDebt = (params.debt_items || []).filter((item) => (item.name && item.name.trim()) || item.amount > 0);
  const validBrimo = (params.brimo_items || []).filter((item) => item.amount > 0 || (item.notes && item.notes.trim()));
  const validBpd = (params.bpd_items || []).filter((item) => item.amount > 0 || (item.notes && item.notes.trim()));

  if (validDebt.length === 0 && validBrimo.length === 0 && validBpd.length === 0) {
    return cleanNote;
  }

  const payload: any = {};
  if (validDebt.length > 0) payload.debt_items = validDebt;
  if (validBrimo.length > 0) payload.brimo_items = validBrimo;
  if (validBpd.length > 0) payload.bpd_items = validBpd;
  if (cleanNote) payload.note = cleanNote;

  return JSON.stringify(payload);
}

/**
 * Parsing catatan utang dari kolom notes (wrapper kompatibel dengan kode sebelumnya).
 */
export function parseDebtNotes(
  notesStr?: string | null,
  fallbackDebtAmount: number = 0
): { items: DebtItem[]; generalNote: string } {
  const parsed = parseTransactionNotes(notesStr, { debtAmount: fallbackDebtAmount });
  return { items: parsed.debt_items, generalNote: parsed.generalNote };
}

/**
 * Memformat daftar item utang dan catatan umum (wrapper kompatibel dengan kode sebelumnya).
 */
export function formatDebtNotes(items: DebtItem[], generalNote: string = ''): string {
  return formatTransactionNotes({ debt_items: items, generalNote });
}
