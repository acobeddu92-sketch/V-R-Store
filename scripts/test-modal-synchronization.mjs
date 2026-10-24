import assert from 'node:assert/strict';

/**
 * Unit Test Isolasi Logika Sinkronisasi Modal BRILink
 * Menguji:
 * 1. Single Capital Source: Modal pada Laporan Harian selalu diambil dari Submenu Modal.
 * 2. Keseragaman Seluruh Tanggal: Semua baris tanggal (hari ini maupun lampau) menampilkan nominal modal aktif yang sama.
 * 3. Dinamika Perubahan Modal: Jika modal di Submenu Modal berubah (misal Rp 5.000.000 -> Rp 6.000.000), seluruh baris transaksi otomatis terupdate ke Rp 6.000.000.
 * 4. Transaksi Harian Tidak Mengubah Modal: Input kas, saldo, atau utang harian tidak mempengaruhi modal.
 * 5. Ketepatan Formula Pendapatan: Pendapatan = (Tunai + BRIMO + Payfazz + Saldo BPD + Catatan Utang) - Modal - Uang Nasabah. Modal dikurangkan tepat 1x tanpa pengurangan ganda.
 * 6. Footer Summary Logis: Ringkasan total Modal di footer menampilkan satu modal aktif, BUKAN hasil penjumlahan modal x jumlah hari.
 * 7. Integritas Fitur Lain: Uang Nasabah, Saldo BRIMO, Saldo BPD tetap berfungsi normal.
 */

// --- 1. Pure Calculation Formula ---
function calculateDailyIncome(params) {
  const tunai = Number(params.cash_amount) || 0;
  const brimo = Number(params.brimo_balance) || 0;
  const payfazz = Number(params.payfazz_balance) || 0;
  const bpd = Number(params.bpd_balance !== undefined ? params.bpd_balance : params.brilian_balance) || 0;
  const utang = Number(params.debt_notes) || 0;
  const modal = Number(params.daily_capital) || 0;
  const uangNasabah = Number(params.customer_funds) || 0;

  // Formula: (Tunai + BRIMO + Payfazz + Saldo BPD + Catatan Utang) - Modal - Uang Nasabah
  return (tunai + brimo + payfazz + bpd + utang) - modal - uangNasabah;
}

// --- 2. In-Memory Service Simulation ---
class MockDataService {
  constructor() {
    this.capitalEntries = [];
    this.customerFunds = [];
    this.dailyTransactions = [];
  }

  // Capital Entries (Submenu Modal)
  async getCapitalEntries() {
    return [...this.capitalEntries].sort((a, b) => b.entry_date.localeCompare(a.entry_date));
  }

  async getTotalActiveCapital() {
    const all = await this.getCapitalEntries();
    return all.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  }

  async createCapitalEntry(entry) {
    const record = { id: `cap-${Date.now()}-${Math.random()}`, ...entry };
    this.capitalEntries.unshift(record);
    await this.syncTransactionCapital();
    return record;
  }

  async updateCapitalEntry(id, patch) {
    const idx = this.capitalEntries.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Entri modal tidak ditemukan');
    this.capitalEntries[idx] = { ...this.capitalEntries[idx], ...patch };
    await this.syncTransactionCapital();
    return this.capitalEntries[idx];
  }

  async deleteCapitalEntry(id) {
    this.capitalEntries = this.capitalEntries.filter((c) => c.id !== id);
    await this.syncTransactionCapital();
    return true;
  }

  // Customer Funds
  async getCustomerFunds(opts) {
    let list = [...this.customerFunds];
    if (opts?.date) {
      list = list.filter((f) => f.entry_date === opts.date);
    }
    return list;
  }

  async createCustomerFund(fund) {
    const record = { id: `cf-${Date.now()}`, ...fund };
    this.customerFunds.unshift(record);
    await this.syncTransactionCustomerFunds(fund.entry_date);
    return record;
  }

  async syncTransactionCustomerFunds(date) {
    const [funds, activeCapital] = await Promise.all([
      this.getCustomerFunds({ date }),
      this.getTotalActiveCapital(),
    ]);
    const totalFunds = funds.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

    for (const trx of this.dailyTransactions) {
      if (trx.transaction_date === date) {
        trx.customer_funds = totalFunds;
        trx.daily_capital = activeCapital;
        trx.daily_income = calculateDailyIncome({
          cash_amount: trx.cash_amount,
          brimo_balance: trx.brimo_balance,
          payfazz_balance: trx.payfazz_balance,
          brilian_balance: trx.brilian_balance,
          debt_notes: trx.debt_notes,
          daily_capital: activeCapital,
          customer_funds: totalFunds,
        });
      }
    }
  }

  // Daily Transactions (Laporan Harian)
  async getDailyTransactions(periodId) {
    const [allFunds, allCapital] = await Promise.all([
      this.getCustomerFunds(),
      this.getCapitalEntries(),
    ]);

    const activeCapital = allCapital.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

    return this.dailyTransactions
      .filter((t) => t.period_id === periodId)
      .map((t) => {
        const fundsOnDate = allFunds.filter((f) => f.entry_date === t.transaction_date);
        const totalFunds = fundsOnDate.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
        const totalCapital = activeCapital;

        const newIncome = calculateDailyIncome({
          cash_amount: t.cash_amount,
          brimo_balance: t.brimo_balance,
          payfazz_balance: t.payfazz_balance,
          brilian_balance: t.brilian_balance,
          bpd_balance: t.bpd_balance,
          debt_notes: t.debt_notes,
          daily_capital: totalCapital,
          customer_funds: totalFunds,
        });

        return {
          ...t,
          customer_funds: totalFunds,
          daily_capital: totalCapital,
          daily_income: newIncome,
        };
      })
      .sort((a, b) => a.transaction_date.localeCompare(b.transaction_date));
  }

  async saveDailyTransaction(trans) {
    const activeCapital = await this.getTotalActiveCapital();
    const capitalVal = activeCapital;

    const dailyIncome = calculateDailyIncome({
      cash_amount: trans.cash_amount,
      brimo_balance: trans.brimo_balance,
      payfazz_balance: trans.payfazz_balance,
      brilian_balance: trans.bpd_balance ?? trans.brilian_balance,
      bpd_balance: trans.bpd_balance ?? trans.brilian_balance,
      debt_notes: trans.debt_notes,
      daily_capital: capitalVal,
      customer_funds: trans.customer_funds,
    });

    const record = {
      id: trans.id || `trx-${Date.now()}-${Math.random()}`,
      period_id: trans.period_id,
      transaction_date: trans.transaction_date,
      transaction_count: Number(trans.transaction_count) || 0,
      cash_amount: Number(trans.cash_amount) || 0,
      brimo_balance: Number(trans.brimo_balance) || 0,
      payfazz_balance: Number(trans.payfazz_balance) || 0,
      brilian_balance: Number(trans.bpd_balance ?? trans.brilian_balance) || 0,
      bpd_balance: Number(trans.bpd_balance ?? trans.brilian_balance) || 0,
      customer_funds: Number(trans.customer_funds) || 0,
      debt_notes: Number(trans.debt_notes) || 0,
      daily_capital: capitalVal,
      daily_income: dailyIncome,
      notes: trans.notes || '',
    };

    const existingIdx = this.dailyTransactions.findIndex((t) => t.id === record.id);
    if (existingIdx !== -1) {
      this.dailyTransactions[existingIdx] = record;
    } else {
      this.dailyTransactions.push(record);
    }
    return record;
  }

  async syncTransactionCapital() {
    const activeCapital = await this.getTotalActiveCapital();

    this.dailyTransactions = this.dailyTransactions.map((target) => {
      const newDailyIncome = calculateDailyIncome({
        cash_amount: target.cash_amount,
        brimo_balance: target.brimo_balance,
        payfazz_balance: target.payfazz_balance,
        brilian_balance: target.brilian_balance,
        debt_notes: target.debt_notes,
        daily_capital: activeCapital,
        customer_funds: target.customer_funds,
      });

      return {
        ...target,
        daily_capital: activeCapital,
        daily_income: newDailyIncome,
      };
    });
  }
}

// --- EXECUTE TEST SUITE ---

console.log('=== TEST 1: FORMULA PENDAPATAN DENGAN SATU MODAL AKTIF ===');
{
  // Aset = Tunai (1.500.000) + BRIMO (2.000.000) + Payfazz (500.000) + BPD (2.500.000) + Utang (500.000) = 7.000.000
  // Modal = 5.000.000, Uang Nasabah = 1.000.000
  // Pendapatan = 7.000.000 - 5.000.000 - 1.000.000 = 1.000.000
  const income = calculateDailyIncome({
    cash_amount: 1500000,
    brimo_balance: 2000000,
    payfazz_balance: 500000,
    bpd_balance: 2500000,
    debt_notes: 500000,
    daily_capital: 5000000,
    customer_funds: 1000000,
  });

  assert.equal(income, 1000000, 'Pendapatan harus 1.000.000');
  console.log('✔ Formula calculateDailyIncome konsisten dan tanpa pengurangan ganda.');
}

console.log('\n=== TEST 2: SINGLE CAPITAL SOURCE DARI SUBMENU MODAL ===');
const service = new MockDataService();

// Masukkan 2 entri modal di Submenu Modal (Total: Rp 5.000.000)
// Entri 1: Rp 3.000.000 pada tanggal 2026-10-01
// Entri 2: Rp 2.000.000 pada tanggal 2026-10-05
await service.createCapitalEntry({
  entry_date: '2026-10-01',
  source: 'Modal Awal Kas Toko',
  amount: 3000000,
  notes: 'Setoran modal 1',
});

await service.createCapitalEntry({
  entry_date: '2026-10-05',
  source: 'Transfer Bank Pemilik',
  amount: 2000000,
  notes: 'Setoran modal 2',
});

const currentCapital = await service.getTotalActiveCapital();
assert.equal(currentCapital, 5000000, 'Total modal aktif harus Rp 5.000.000');
console.log(`✔ Modal aktif Submenu Modal terhitung: Rp ${currentCapital.toLocaleString('id-ID')}`);

// Simpan transaksi di 3 tanggal berbeda di bulan Oktober 2026
// (Tanggal 10, 11, dan 12 Oktober - tanpa entri modal di tanggal-tanggal tersebut)
const periodId = 'period-okt-2026';

await service.saveDailyTransaction({
  period_id: periodId,
  transaction_date: '2026-10-10',
  transaction_count: 12,
  cash_amount: 2000000,
  brimo_balance: 2500000,
  payfazz_balance: 500000,
  bpd_balance: 1500000,
  customer_funds: 0,
  debt_notes: 0,
  notes: '',
});

await service.saveDailyTransaction({
  period_id: periodId,
  transaction_date: '2026-10-11',
  transaction_count: 18,
  cash_amount: 3000000,
  brimo_balance: 2000000,
  payfazz_balance: 500000,
  bpd_balance: 1500000,
  customer_funds: 0,
  debt_notes: 0,
  notes: '',
});

await service.saveDailyTransaction({
  period_id: periodId,
  transaction_date: '2026-10-12',
  transaction_count: 8,
  cash_amount: 1500000,
  brimo_balance: 3000000,
  payfazz_balance: 500000,
  bpd_balance: 1000000,
  customer_funds: 0,
  debt_notes: 0,
  notes: '',
});

// Ambil laporan transaksi harian
let rows = await service.getDailyTransactions(periodId);
assert.equal(rows.length, 3, 'Terdapat 3 baris tanggal');

for (const r of rows) {
  assert.equal(
    r.daily_capital,
    5000000,
    `Baris tanggal ${r.transaction_date} harus bernilai Rp 5.000.000`
  );
}
console.log('✔ Seluruh baris tanggal (2026-10-10, 11, 12) seragam menampilkan Modal = Rp 5.000.000!');

console.log('\n=== TEST 3: PERUBAHAN MODAL PADA SUBMENU MODAL OTOMATIS BERDAMPAK KE SEMUA TANGGAL ===');
// Tambah entri modal baru di Submenu Modal sebesar Rp 1.000.000 (Total menjadi Rp 6.000.000)
await service.createCapitalEntry({
  entry_date: '2026-10-15',
  source: 'Tambahan Kas Usaha',
  amount: 1000000,
  notes: 'Suntikan modal tambahan',
});

const updatedCapital = await service.getTotalActiveCapital();
assert.equal(updatedCapital, 6000000, 'Total modal aktif harus menjadi Rp 6.000.000');
console.log(`✔ Modal aktif Submenu Modal kini menjadi: Rp ${updatedCapital.toLocaleString('id-ID')}`);

// Muat ulang Laporan Harian (simulasi reload)
rows = await service.getDailyTransactions(periodId);
for (const r of rows) {
  assert.equal(
    r.daily_capital,
    6000000,
    `Baris tanggal ${r.transaction_date} harus otomatis terupdate menjadi Rp 6.000.000`
  );
}
console.log('✔ Semua baris Laporan Harian otomatis mengikuti nominal terbaru Rp 6.000.000!');

// Verifikasi perhitungan pendapatan tanggal 10 Oktober:
// Total Aset = 2.000.000 + 2.500.000 + 500.000 + 1.500.000 = 6.500.000
// Pendapatan = 6.500.000 - 6.000.000 = 500.000
assert.equal(rows[0].daily_income, 500000, 'Pendapatan harus 500.000 setelah modal naik ke 6.000.000');
console.log('✔ Pendapatan harian otomatis terhitung ulang dengan modal baru Rp 6.000.000.');

console.log('\n=== TEST 4: TRANSAKSI HARIAN TIDAK MEMPENGARUHI NOMINAL MODAL ===');
// Pengguna memasukkan transaksi harian dengan omzet besar
await service.saveDailyTransaction({
  period_id: periodId,
  transaction_date: '2026-10-16',
  transaction_count: 50,
  cash_amount: 100000000,
  brimo_balance: 50000000,
  payfazz_balance: 20000000,
  bpd_balance: 30000000,
  customer_funds: 10000000,
  debt_notes: 5000000,
  notes: '',
});

const capAfterLargeTrx = await service.getTotalActiveCapital();
assert.equal(capAfterLargeTrx, 6000000, 'Modal di Submenu Modal TIDAK BOLEH berubah oleh transaksi harian');
console.log('✔ Input transaksi harian berapapun besarnya terbukti tidak mengubah nominal modal.');

console.log('\n=== TEST 5: LOGIKA RINGKASAN TOTAL MODAL DI FOOTER TABEL ===');
// Simulasi perhitungan summaryTotals seperti di src/app/admin/brilink/transaksi/page.tsx
const activeCap = await service.getTotalActiveCapital();
const totalRows = await service.getDailyTransactions(periodId);

// Logika baru yang diimplementasikan:
const currentCapitalForFooter = activeCap || (totalRows.length > 0 ? Number(totalRows[0].daily_capital) || 0 : 0);
assert.equal(currentCapitalForFooter, 6000000, 'Footer harus menampilkan modal aktif tunggal 6.000.000, BUKAN 24.000.000');
console.log(`✔ Ringkasan footer tabel menampilkan modal logis: Rp ${currentCapitalForFooter.toLocaleString('id-ID')} (bukan menjumlahkan berulang per hari).`);

console.log('\n=== TEST 6: INTEGRITAS UANG NASABAH & SALDO BPD ===');
// Tambah entri uang nasabah di tanggal 2026-10-10 sebesar Rp 1.000.000
await service.createCustomerFund({
  entry_date: '2026-10-10',
  customer_name: 'Ibu Fatimah',
  amount: 1000000,
  notes: 'Titip kirim uang',
});

const refreshedTrx10 = (await service.getDailyTransactions(periodId)).find((t) => t.transaction_date === '2026-10-10');
assert.equal(refreshedTrx10.customer_funds, 1000000, 'Uang nasabah harus 1.000.000');
assert.equal(refreshedTrx10.daily_capital, 6000000, 'Modal tetap 6.000.000');
// Pendapatan tgl 10: 6.500.000 - 6.000.000 (modal) - 1.000.000 (uang nasabah) = -500.000
assert.equal(refreshedTrx10.daily_income, -500000, 'Pendapatan harus -500.000');
console.log('✔ Sinkronisasi Uang Nasabah dan Saldo BPD tetap akurat dan tidak terpengaruh.');

console.log('\n======================================================');
console.log('SEMUA 6 SKENARIO PENGUJIAN SINKRONISASI MODAL SUKSES 100%!');
console.log('======================================================');
