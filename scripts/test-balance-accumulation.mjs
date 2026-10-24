import assert from 'node:assert';

/**
 * Unit Test In-Memory Logika Akumulasi Saldo BRILink & Isolasi Tanggal
 * Menguji:
 * 1. Akumulasi Saldo BRIMO (Rp 100.000 + Rp 50.000 = Rp 150.000)
 * 2. Akumulasi Uang Nasabah (Rp 200.000 + Rp 75.000 = Rp 275.000)
 * 3. Akumulasi Saldo BPD (Rp 300.000 + Rp 25.000 = Rp 325.000)
 * 4. Isolasi Antar Tanggal (Tidak ada kebocoran antar tanggal A dan B)
 * 5. Validasi Input (0, kosong, negatif, non-numerik)
 * 6. Serialisasi / Deserialisasi JSON notes (Kompatibilitas data warisan)
 * 7. Perhitungan Pendapatan Harian Akurat
 */

// --- 1. Pure Calculation Functions & Parsers ---
function calculateDailyIncome(params) {
  const tunai = Number(params.cash_amount) || 0;
  const brimo = Number(params.brimo_balance) || 0;
  const payfazz = Number(params.payfazz_balance) || 0;
  const bpd = Number(params.bpd_balance !== undefined ? params.bpd_balance : params.brilian_balance) || 0;
  const utang = Number(params.debt_notes) || 0;
  const modalHariIni = Number(params.daily_capital) || 0;
  const uangNasabah = Number(params.customer_funds) || 0;

  return (tunai + brimo + payfazz + bpd + utang) - modalHariIni - uangNasabah;
}

function parseTransactionNotes(notesStr, fallbacks) {
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

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object') {
        const rawDebt = Array.isArray(parsed.debt_items) ? parsed.debt_items : [];
        const debt_items = rawDebt.map((item, idx) => ({
          id: String(item.id || `debt-${idx + 1}`),
          name: String(item.name || `Peminjam ${idx + 1}`),
          amount: Number(item.amount) || 0,
        }));

        const rawBrimo = Array.isArray(parsed.brimo_items) ? parsed.brimo_items : [];
        const brimo_items = rawBrimo.map((item, idx) => ({
          id: String(item.id || `brimo-${idx + 1}`),
          amount: Number(item.amount) || 0,
          notes: item.notes ? String(item.notes) : undefined,
          timestamp: item.timestamp ? String(item.timestamp) : undefined,
        }));

        const rawBpd = Array.isArray(parsed.bpd_items) ? parsed.bpd_items : [];
        const bpd_items = rawBpd.map((item, idx) => ({
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
      // ignore
    }
  }

  return {
    debt_items: fallbackDebt > 0 ? [{ id: 'legacy-debt', name: 'Catatan Utang', amount: fallbackDebt }] : [],
    brimo_items: fallbackBrimo > 0 ? [{ id: 'legacy-brimo', amount: fallbackBrimo, notes: 'Saldo Awal BRIMO', timestamp: fallbackTime }] : [],
    bpd_items: fallbackBpd > 0 ? [{ id: 'legacy-bpd', amount: fallbackBpd, notes: 'Saldo Awal BPD', timestamp: fallbackTime }] : [],
    generalNote: trimmed,
  };
}

function formatTransactionNotes(params) {
  const cleanNote = (params.generalNote || '').trim();
  const validDebt = (params.debt_items || []).filter((item) => (item.name && item.name.trim()) || item.amount > 0);
  const validBrimo = (params.brimo_items || []).filter((item) => item.amount > 0 || (item.notes && item.notes.trim()));
  const validBpd = (params.bpd_items || []).filter((item) => item.amount > 0 || (item.notes && item.notes.trim()));

  if (validDebt.length === 0 && validBrimo.length === 0 && validBpd.length === 0) {
    return cleanNote;
  }

  const payload = {};
  if (validDebt.length > 0) payload.debt_items = validDebt;
  if (validBrimo.length > 0) payload.brimo_items = validBrimo;
  if (validBpd.length > 0) payload.bpd_items = validBpd;
  if (cleanNote) payload.note = cleanNote;

  return JSON.stringify(payload);
}

// In-Memory Accumulator Class
class InMemoryAccumulator {
  constructor() {
    this.items = [];
  }

  add(amount, notes = '', timestamp = '10:00 WIB') {
    const num = Number(amount);
    if (isNaN(num) || num <= 0) {
      throw new Error('Nominal harus lebih besar dari Rp 0');
    }
    this.items.push({
      id: `item-${Date.now()}-${Math.random()}`,
      amount: num,
      notes,
      timestamp,
    });
    return this.total;
  }

  remove(id) {
    this.items = this.items.filter((it) => it.id !== id);
    return this.total;
  }

  get total() {
    return this.items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
  }

  get count() {
    return this.items.length;
  }
}

console.log('=== RUNNING TESTS: AKUMULASI SALDO & UANG NASABAH ===');

// --- TEST 1: AKUMULASI SALDO BRIMO ---
console.log('\n[TEST 1] Akumulasi Saldo BRIMO');
const brimoAcc = new InMemoryAccumulator();
assert.strictEqual(brimoAcc.total, 0, 'Saldo awal harus 0');

// Input pertama: Rp 100.000
brimoAcc.add(100000, 'Setor pagi', '08:30 WIB');
assert.strictEqual(brimoAcc.total, 100000, 'Saldo setelah input 1 harus 100.000');
assert.strictEqual(brimoAcc.count, 1, 'Jumlah item harus 1');

// Input kedua: Rp 50.000
brimoAcc.add(50000, 'Setor siang', '13:00 WIB');
assert.strictEqual(brimoAcc.total, 150000, 'Saldo setelah input 2 harus Rp 150.000 (100k + 50k)');
assert.strictEqual(brimoAcc.count, 2, 'Jumlah item harus 2');
console.log('✔ Akumulasi BRIMO Berhasil: Rp 100.000 + Rp 50.000 = Rp 150.000 (2 entri)');

// --- TEST 2: AKUMULASI UANG NASABAH ---
console.log('\n[TEST 2] Akumulasi Uang Nasabah');
const customerFundsAcc = new InMemoryAccumulator();
customerFundsAcc.add(200000, 'Ibu Ani - Titipan tarik tunai', '09:15 WIB');
assert.strictEqual(customerFundsAcc.total, 200000);

customerFundsAcc.add(75000, 'Pak Budi - Sisa transfer', '11:45 WIB');
assert.strictEqual(customerFundsAcc.total, 275000, 'Total Uang Nasabah harus Rp 275.000 (200k + 75k)');
assert.strictEqual(customerFundsAcc.count, 2);
console.log('✔ Akumulasi Uang Nasabah Berhasil: Rp 200.000 + Rp 75.000 = Rp 275.000');

// --- TEST 3: AKUMULASI SALDO BPD ---
console.log('\n[TEST 3] Akumulasi Saldo BPD');
const bpdAcc = new InMemoryAccumulator();
bpdAcc.add(300000, 'Setoran BPD kliring pagi', '09:00 WIB');
assert.strictEqual(bpdAcc.total, 300000);

bpdAcc.add(25000, 'Bunga/Fee BPD', '16:00 WIB');
assert.strictEqual(bpdAcc.total, 325000, 'Total Saldo BPD harus Rp 325.000 (300k + 25k)');
assert.strictEqual(bpdAcc.count, 2);
console.log('✔ Akumulasi Saldo BPD Berhasil: Rp 300.000 + Rp 25.000 = Rp 325.000');

// --- TEST 4: ISOLASI ANTAR TANGGAL (NO LEAKAGE) ---
console.log('\n[TEST 4] Isolasi Data Antar Tanggal');
const storeState = {
  '2026-10-18': {
    brimo: new InMemoryAccumulator(),
    customerFunds: new InMemoryAccumulator(),
    bpd: new InMemoryAccumulator(),
  },
  '2026-10-19': {
    brimo: new InMemoryAccumulator(),
    customerFunds: new InMemoryAccumulator(),
    bpd: new InMemoryAccumulator(),
  },
};

// Input pada tanggal 18 Oktober
storeState['2026-10-18'].brimo.add(150000, 'Input tgl 18');
storeState['2026-10-18'].customerFunds.add(275000, 'Uang Nasabah tgl 18');
storeState['2026-10-18'].bpd.add(325000, 'BPD tgl 18');

// Input pada tanggal 19 Oktober
storeState['2026-10-19'].brimo.add(80000, 'Input tgl 19');
storeState['2026-10-19'].customerFunds.add(50000, 'Uang Nasabah tgl 19');
storeState['2026-10-19'].bpd.add(100000, 'BPD tgl 19');

// Verifikasi isolasi tanggal 18
assert.strictEqual(storeState['2026-10-18'].brimo.total, 150000, 'Brimo tgl 18 tidak boleh bocor');
assert.strictEqual(storeState['2026-10-18'].customerFunds.total, 275000, 'Uang Nasabah tgl 18 tidak boleh bocor');
assert.strictEqual(storeState['2026-10-18'].bpd.total, 325000, 'BPD tgl 18 tidak boleh bocor');

// Verifikasi isolasi tanggal 19
assert.strictEqual(storeState['2026-10-19'].brimo.total, 80000, 'Brimo tgl 19 tidak boleh bocor');
assert.strictEqual(storeState['2026-10-19'].customerFunds.total, 50000, 'Uang Nasabah tgl 19 tidak boleh bocor');
assert.strictEqual(storeState['2026-10-19'].bpd.total, 100000, 'BPD tgl 19 tidak boleh bocor');

// Tambah nominal lagi pada tanggal 18 dan pastikan tanggal 19 sama sekali tidak berubah
storeState['2026-10-18'].brimo.add(50000, 'Tambahan tgl 18');
assert.strictEqual(storeState['2026-10-18'].brimo.total, 200000, 'Brimo tgl 18 bertambah');
assert.strictEqual(storeState['2026-10-19'].brimo.total, 80000, 'Brimo tgl 19 harus tetap 80.000!');
console.log('✔ Tidak ada kebocoran saldo antar tanggal (Isolasi 100% Terverifikasi)');

// --- TEST 5: VALIDASI INPUT (0, KOSONG, NEGATIF) ---
console.log('\n[TEST 5] Validasi Input');
const validatorAcc = new InMemoryAccumulator();
assert.throws(() => validatorAcc.add(0), /Nominal harus lebih besar dari Rp 0/, 'Input 0 harus ditolak');
assert.throws(() => validatorAcc.add(-50000), /Nominal harus lebih besar dari Rp 0/, 'Input negatif harus ditolak');
assert.throws(() => validatorAcc.add(''), /Nominal harus lebih besar dari Rp 0/, 'Input string kosong harus ditolak');
assert.throws(() => validatorAcc.add('abc'), /Nominal harus lebih besar dari Rp 0/, 'Input non-angka harus ditolak');
console.log('✔ Validasi input (0, kosong, negatif, non-numerik) berfungsi dengan aman');

// --- TEST 6: SERIALISASI & DATA WARISAN (LEGACY) ---
console.log('\n[TEST 6] Serialisasi JSON notes & Kompatibilitas Data Warisan');
// Format data baru berstruktur
const jsonNotes = formatTransactionNotes({
  debt_items: [{ id: 'd-1', name: 'Pak Rudi', amount: 50000 }],
  brimo_items: brimoAcc.items,
  bpd_items: bpdAcc.items,
  generalNote: 'Operasional lancar',
});

const parsed = parseTransactionNotes(jsonNotes, {});
assert.strictEqual(parsed.brimo_items.length, 2, 'Harus ter-parse 2 entri BRIMO');
assert.strictEqual(parsed.bpd_items.length, 2, 'Harus ter-parse 2 entri BPD');
assert.strictEqual(parsed.debt_items.length, 1, 'Harus ter-parse 1 utang');
assert.strictEqual(parsed.generalNote, 'Operasional lancar', 'Catatan umum harus cocok');

// Uji baris warisan lama (teks biasa + nilai numerik di kolom brimo/bpd)
const legacyNotes = 'Catatan lama teks biasa';
const parsedLegacy = parseTransactionNotes(legacyNotes, {
  debtAmount: 25000,
  brimoAmount: 14000000,
  bpdAmount: 3000000,
  createdAt: '2026-10-01T08:00:00Z',
});
assert.strictEqual(parsedLegacy.generalNote, 'Catatan lama teks biasa', 'Catatan lama tidak boleh rusak');
assert.strictEqual(parsedLegacy.brimo_items.length, 1, 'Saldo lama BRIMO harus jadi entri awal');
assert.strictEqual(parsedLegacy.brimo_items[0].amount, 14000000);
assert.strictEqual(parsedLegacy.bpd_items.length, 1, 'Saldo lama BPD harus jadi entri awal');
assert.strictEqual(parsedLegacy.bpd_items[0].amount, 3000000);
console.log('✔ Kompatibilitas data warisan (legacy) dan serialisasi JSON notes 100% utuh');

// --- TEST 7: PERHITUNGAN PENDAPATAN HARIAN ---
console.log('\n[TEST 7] Perhitungan Pendapatan Harian');
// Formula: (Tunai + BRIMO + Payfazz + Saldo BPD + Catatan Utang) - Modal Hari Ini - Uang Nasabah
const income = calculateDailyIncome({
  cash_amount: 5000000,
  brimo_balance: 150000,      // akumulasi brimo
  payfazz_balance: 200000,
  bpd_balance: 325000,         // akumulasi bpd
  debt_notes: 50000,
  daily_capital: 3000000,
  customer_funds: 275000,     // akumulasi uang nasabah
});
// (5.000.000 + 150.000 + 200.000 + 325.000 + 50.000 = 5.725.000) - 3.000.000 - 275.000 = 2.450.000
assert.strictEqual(income, 2450000, 'Pendapatan harian harus tepat Rp 2.450.000');
console.log(`✔ Formula Pendapatan Harian Tepat: Rp 5.725.000 - Rp 3.000.000 - Rp 275.000 = Rp ${income.toLocaleString('id-ID')}`);

console.log('\n=============================================');
console.log('SEMUA 7 PENGUJIAN IN-MEMORY BERHASIL 100%!');
console.log('=============================================');
