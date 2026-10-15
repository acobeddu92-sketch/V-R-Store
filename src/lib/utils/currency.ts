/**
 * Utility Formatting Mata Uang Rupiah (IDR) untuk V_R Store
 * Menghasilkan format standar Indonesia: Rp 1.000.000
 */

export function formatRupiah(amount: number | string | null | undefined, withPrefix: boolean = true): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return withPrefix ? 'Rp 0' : '0';
  }

  const num = Math.round(Number(amount));
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const formatted = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(absNum);

  if (withPrefix) {
    return isNegative ? `-Rp ${formatted}` : `Rp ${formatted}`;
  }

  return isNegative ? `-${formatted}` : formatted;
}

export function parseRupiahInput(value: string | number): number {
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  if (!value) return 0;

  // Hapus semua karakter selain angka dan tanda minus
  const cleanStr = value.toString().replace(/[^0-9-]/g, '');
  const parsed = parseInt(cleanStr, 10);
  return isNaN(parsed) ? 0 : parsed;
}
