/**
 * Utility Tanggal dan Waktu Bahasa Indonesia (WITA / Asia/Makassar)
 */

export const MONTH_NAMES_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const DAY_NAMES_ID = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

/**
 * Format string tanggal YYYY-MM-DD menjadi format teks Indonesia
 * Contoh: 2026-10-14 -> "Rabu, 14 Oktober 2026"
 */
export function formatDateID(
  dateStr: string | Date | null | undefined,
  includeDay: boolean = true
): string {
  if (!dateStr) return '-';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(d.getTime())) return '-';

  const dayName = DAY_NAMES_ID[d.getDay()];
  const dateNum = d.getDate();
  const monthName = MONTH_NAMES_ID[d.getMonth()];
  const year = d.getFullYear();

  if (includeDay) {
    return `${dayName}, ${dateNum} ${monthName} ${year}`;
  }
  return `${dateNum} ${monthName} ${year}`;
}

/**
 * Mengambil nama hari dari format YYYY-MM-DD
 */
export function getDayNameID(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return DAY_NAMES_ID[d.getDay()];
}

/**
 * Mengembalikan jumlah hari dalam bulan dan tahun tertentu
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Menghitung tanggal jatuh tempo ke-N dari tanggal mulai (join_date),
 * dengan menangani aturan akhir bulan (misal tgl 31 ke akhir Feb)
 * dan parsing tanggal lokal yang kebal terhadap pergeseran UTC.
 */
export function getAnniversaryDate(joinDateStr: string, monthOffset: number): Date {
  let startYear: number;
  let startMonth: number;
  let startDay: number;

  if (typeof joinDateStr === 'string' && joinDateStr.includes('-')) {
    const parts = joinDateStr.split('T')[0].split('-').map(Number);
    startYear = parts[0];
    startMonth = parts[1] - 1; // 0-indexed (Jan = 0)
    startDay = parts[2];
  } else {
    const start = new Date(joinDateStr);
    startYear = start.getFullYear();
    startMonth = start.getMonth();
    startDay = start.getDate();
  }
  
  // Target tahun dan bulan
  let targetYear = startYear;
  let targetMonth = startMonth + monthOffset;
  
  // Normalisasi jika targetMonth >= 12
  while (targetMonth >= 12) {
    targetYear += 1;
    targetMonth -= 12;
  }
  
  // Cek batas maksimum hari pada bulan target (misal Feb: 28/29, April: 30)
  const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const actualDay = Math.min(startDay, daysInTargetMonth);
  
  return new Date(targetYear, targetMonth, actualDay, 0, 0, 0, 0);
}
