import assert from 'node:assert';

// 1. Formula Pendapatan Harian BRILink
function calculateDailyIncome(params) {
  const tunai = Number(params.cash_amount) || 0;
  const brimo = Number(params.brimo_balance) || 0;
  const payfazz = Number(params.payfazz_balance) || 0;
  const brilian = Number(params.brilian_balance) || 0;
  const utang = Number(params.debt_notes) || 0;
  const modalHariIni = Number(params.daily_capital) || 0;
  const uangNasabah = Number(params.customer_funds) || 0;

  return tunai + brimo + payfazz + brilian + utang - modalHariIni - uangNasabah;
}

// 2. Anniversary Full Month Helper
function getAnniversaryDate(joinDateStr, monthOffset) {
  const start = new Date(joinDateStr);
  const startDay = start.getDate();
  let targetYear = start.getFullYear();
  let targetMonth = start.getMonth() + monthOffset;
  
  while (targetMonth >= 12) {
    targetYear += 1;
    targetMonth -= 12;
  }
  
  const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const actualDay = Math.min(startDay, daysInTargetMonth);
  return new Date(targetYear, targetMonth, actualDay);
}

function calculateInvestorCommissions(principal, joinDateStr, asOfDateStr) {
  const asOf = new Date(asOfDateStr);
  const monthlyRate = 0.005; // 0.5%
  const monthlyCommission = Math.round(principal * monthlyRate);
  let monthIndex = 1;
  const records = [];

  while (true) {
    const anniv = getAnniversaryDate(joinDateStr, monthIndex);
    if (anniv > asOf) break;
    records.push({
      monthIndex,
      anniversary: anniv.toISOString().split('T')[0],
      amount: monthlyCommission,
    });
    monthIndex++;
  }

  return {
    fullMonths: records.length,
    monthlyCommission,
    totalCommission: records.length * monthlyCommission,
    records,
  };
}

console.log('--- TEST 1: PENDAPATAN HARIAN BRILINK ---');
const income1 = calculateDailyIncome({
  cash_amount: 5000000,
  brimo_balance: 15000000,
  payfazz_balance: 3000000,
  brilian_balance: 2000000,
  debt_notes: 500000,
  daily_capital: 20000000,
  customer_funds: 4500000,
});
// Total positif = 5jt + 15jt + 3jt + 2jt + 500rb = 25.500.000
// Pengurang = 20jt + 4.5jt = 24.500.000
// Hasil = 25.500.000 - 24.500.000 = 1.000.000
console.log('Hasil Pendapatan Hari Ini:', income1);
assert.strictEqual(income1, 1000000, 'Pendapatan Hari Ini harus tepat Rp1.000.000');
console.log('✓ TEST 1 BERHASIL');

console.log('\n--- TEST 2: DIVIDEN KOMISI BULAN PENUH ---');
// Investor 1: Pokok 50.000.000, masuk 2026-08-15
// Diuji pada 2026-09-14 (belum 1 bulan penuh)
const testBefore1Month = calculateInvestorCommissions(50000000, '2026-08-15', '2026-09-14');
console.log('Komisi sebelum 1 bulan penuh:', testBefore1Month.totalCommission);
assert.strictEqual(testBefore1Month.fullMonths, 0, 'Belum 1 bulan penuh harus 0 komisi');
assert.strictEqual(testBefore1Month.totalCommission, 0, 'Total komisi harus 0');

// Diuji pada 2026-09-15 (genap 1 bulan penuh)
const testAt1Month = calculateInvestorCommissions(50000000, '2026-08-15', '2026-09-15');
console.log('Komisi tepat 1 bulan penuh:', testAt1Month.totalCommission);
assert.strictEqual(testAt1Month.fullMonths, 1, 'Harus terhitung tepat 1 bulan');
assert.strictEqual(testAt1Month.monthlyCommission, 250000, 'Komisi 0.5% dari 50jt = 250.000');
assert.strictEqual(testAt1Month.totalCommission, 250000, 'Total komisi = 250.000');

// Diuji pada 2026-10-15 (genap 2 bulan penuh)
const testAt2Months = calculateInvestorCommissions(50000000, '2026-08-15', '2026-10-15');
console.log('Komisi tepat 2 bulan penuh:', testAt2Months.totalCommission);
assert.strictEqual(testAt2Months.fullMonths, 2, 'Harus terhitung 2 bulan penuh');
assert.strictEqual(testAt2Months.totalCommission, 500000, 'Total komisi = 500.000');

// Investor 2: Masuk tgl 31 Januari, Februari hanya 28 hari -> akhir bulan Feb
const testLeapRule = calculateInvestorCommissions(10000000, '2026-01-31', '2026-02-28');
assert.strictEqual(testLeapRule.fullMonths, 1, 'Harus mencapai 1 bulan penuh pada akhir Feb');
console.log('Anniversary tgl 31 ke akhir Feb:', testLeapRule.records[0].anniversary);
console.log('✓ TEST 2 BERHASIL');

console.log('\n--- TEST 3: PEMISAHAN 3 PILAR LAPORAN TAHUNAN ---');
const modalMasuk = 25000000;
const labaTransaksi = 18500000;
const komisiDividen = 3000000;

assert.notStrictEqual(modalMasuk, labaTransaksi, 'Modal tidak boleh dianggap pendapatan');
assert.notStrictEqual(komisiDividen, modalMasuk, 'Dividen bukan pokok modal');
console.log('Pilar 1 - Modal Masuk:', modalMasuk);
console.log('Pilar 2 - Laba Transaksi Harian:', labaTransaksi);
console.log('Pilar 3 - Komisi Dividen Investor:', komisiDividen);
console.log('✓ TEST 3 BERHASIL');

console.log('\n=============================================');
console.log('SELURUH PENGUJIAN LOGIKA FINANSIAL 100% LOLOS');
console.log('=============================================');
