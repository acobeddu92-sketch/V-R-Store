import assert from 'node:assert/strict';

/**
 * Test Suite: Akumulasi Komisi Investor s.d. Bulan Berjalan
 * Menguji logika perhitungan matematis dan penanganan tanggal:
 * 1. Investor baru masuk (< 1 bulan) -> Akumulasi Rp 0
 * 2. Investor aktif beberapa bulan -> Akumulasi tepat sesuai jumlah bulan penuh s.d. bulan berjalan
 * 3. Investor belum memenuhi syarat bulan penuh (< 28-30 hari atau sebelum anniversary pertama) -> Rp 0
 * 4. Batas pergantian bulan (sehari sebelum vs tepat pada hari anniversary, termasuk bulan Februari)
 * 5. Bulan berjalan tidak menghitung bulan mendatang dan tidak menggandakan bulan yang sama
 */

// Replikasi algoritma getAnniversaryDate dan generateInvestorCommissions dari kode sumber
function getAnniversaryDate(joinDateStr, monthOffset) {
  let startYear, startMonth, startDay;

  if (typeof joinDateStr === 'string' && joinDateStr.includes('-')) {
    const parts = joinDateStr.split('T')[0].split('-').map(Number);
    startYear = parts[0];
    startMonth = parts[1] - 1;
    startDay = parts[2];
  } else {
    const start = new Date(joinDateStr);
    startYear = start.getFullYear();
    startMonth = start.getMonth();
    startDay = start.getDate();
  }

  let targetYear = startYear;
  let targetMonth = startMonth + monthOffset;

  while (targetMonth >= 12) {
    targetYear += 1;
    targetMonth -= 12;
  }

  const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const actualDay = Math.min(startDay, daysInTargetMonth);

  return new Date(targetYear, targetMonth, actualDay, 0, 0, 0, 0);
}

function generateInvestorCommissions(investor, asOfDate = new Date()) {
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

  let joinDate;
  if (typeof investor.join_date === 'string' && investor.join_date.includes('-')) {
    const parts = investor.join_date.split('T')[0].split('-').map(Number);
    joinDate = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
  } else {
    joinDate = new Date(investor.join_date);
  }

  let effectiveEndDate;
  if (investor.status === 'terminated' && investor.termination_date) {
    if (typeof investor.termination_date === 'string' && investor.termination_date.includes('-')) {
      const parts = investor.termination_date.split('T')[0].split('-').map(Number);
      effectiveEndDate = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999);
    } else {
      effectiveEndDate = new Date(investor.termination_date);
    }
  } else {
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

  const diffTime = effectiveEndDate.getTime() - joinDate.getTime();
  const durationDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

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

  const commissions = [];
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

console.log('=== TEST 1: INVESTOR YANG BARU MASUK (< 1 BULAN) ===');
{
  const investorBaru = {
    id: 'inv-baru',
    name: 'Bpk. Hendra Wijaya',
    investment_amount: 30000000,
    join_date: '2026-10-15',
    status: 'active',
  };
  const asOfDate = new Date(2026, 9, 25); // 25 Oktober 2026

  const result = generateInvestorCommissions(investorBaru, asOfDate);
  assert.equal(result.isEligible, false, 'Investor baru harus belum memenuhi syarat bulan penuh');
  assert.equal(result.fullMonthsCount, 0, 'Jumlah bulan penuh harus 0');
  assert.equal(result.totalEarned, 0, 'Total komisi harus Rp 0');
  assert.equal(result.commissions.length, 0);
  console.log(`✔ Investor baru masuk (10 hari): Komisi = Rp ${result.totalEarned.toLocaleString('id-ID')} (Sesuai)`);
}

console.log('\n=== TEST 2: INVESTOR YANG TELAH AKTIF BEBERAPA BULAN ===');
{
  const investorAktif = {
    id: 'inv-1',
    name: 'H. Sudirman',
    investment_amount: 50000000, // 50 juta
    join_date: '2026-06-01',
    status: 'active',
  };
  const asOfDate = new Date(2026, 9, 25); // 25 Oktober 2026

  const result = generateInvestorCommissions(investorAktif, asOfDate);
  assert.equal(result.isEligible, true);
  assert.equal(result.monthlyCommission, 250000, 'Komisi bulanan 0.5% dari 50jt = 250.000');
  assert.equal(result.fullMonthsCount, 4, 'Harus terhitung 4 bulan penuh (Juli, Ags, Sep, Okt)');
  assert.equal(result.totalEarned, 1000000, 'Total akumulasi komisi harus 4 * 250.000 = 1.000.000');
  console.log(`✔ Investor aktif 4 bulan: Bulanan = Rp ${result.monthlyCommission.toLocaleString('id-ID')}, Akumulasi = Rp ${result.totalEarned.toLocaleString('id-ID')} (Sesuai)`);
}

console.log('\n=== TEST 3: INVESTOR BELUM MEMENUHI SYARAT BULAN PENUH (27 HARI) ===');
{
  const investorHampirSatuBulan = {
    id: 'inv-hampir',
    name: 'Ibu Ratna',
    investment_amount: 20000000,
    join_date: '2026-09-28',
    status: 'active',
  };
  const asOfDate = new Date(2026, 9, 25); // 25 Oktober 2026 (baru 27 hari, anniversary tgl 28)

  const result = generateInvestorCommissions(investorHampirSatuBulan, asOfDate);
  assert.equal(result.isEligible, false);
  assert.equal(result.totalEarned, 0, 'Total komisi belum mencapai anniversary tgl 28 harus 0');
  console.log(`✔ Investor belum genap anniversary (27 hari): Akumulasi = Rp ${result.totalEarned} (Sesuai)`);
}

console.log('\n=== TEST 4: BATAS PERGANTIAN BULAN (SEHARI SEBELUM VS HARI JATUH TEMPO) ===');
{
  const investorBatas = {
    id: 'inv-batas',
    name: 'Pak Doni',
    investment_amount: 10000000, // 10 juta -> 50.000 / bulan
    join_date: '2026-09-01',
    status: 'active',
  };

  // Sehari sebelum anniversary ke-1 (30 September 2026)
  const sebelum = generateInvestorCommissions(investorBatas, new Date(2026, 8, 30));
  assert.equal(sebelum.isEligible, false, '30 September belum genap 1 Oktober');
  assert.equal(sebelum.totalEarned, 0);

  // Tepat pada hari anniversary ke-1 (1 Oktober 2026)
  const tepat = generateInvestorCommissions(investorBatas, new Date(2026, 9, 1));
  assert.equal(tepat.isEligible, true, '1 Oktober genap 1 bulan');
  assert.equal(tepat.fullMonthsCount, 1);
  assert.equal(tepat.totalEarned, 50000);

  // Kasus Akhir Bulan Februari (31 Januari -> 28 Februari)
  const investorFeb = {
    id: 'inv-feb',
    name: 'Ibu Siska',
    investment_amount: 20000000, // 20 juta -> 100.000 / bulan
    join_date: '2026-01-31',
    status: 'active',
  };
  const sebelumFeb = generateInvestorCommissions(investorFeb, new Date(2026, 1, 27)); // 27 Feb 2026
  assert.equal(sebelumFeb.isEligible, false);
  assert.equal(sebelumFeb.totalEarned, 0);

  const tepatFeb = generateInvestorCommissions(investorFeb, new Date(2026, 1, 28)); // 28 Feb 2026
  assert.equal(tepatFeb.isEligible, true);
  assert.equal(tepatFeb.fullMonthsCount, 1);
  assert.equal(tepatFeb.totalEarned, 100000);

  console.log('✔ Batas pergantian bulan & akhir Februari dievaluasi secara presisi.');
}

console.log('\n=== TEST 5: BULAN BERJALAN TANPA MENGHITUNG BULAN MENDATANG ===');
{
  const investorSudirman = {
    id: 'inv-1',
    name: 'H. Sudirman',
    investment_amount: 50000000,
    join_date: '2026-06-01',
    status: 'active',
  };

  // As of 25 Oktober 2026 (bulan berjalan adalah Oktober 2026)
  const resOkt = generateInvestorCommissions(investorSudirman, new Date(2026, 9, 25));
  assert.equal(resOkt.fullMonthsCount, 4);

  // Verifikasi anniversary dates di array commissions
  const periods = resOkt.commissions.map(c => `${c.period_year}-${c.period_month}`);
  assert.deepEqual(periods, ['2026-7', '2026-8', '2026-9', '2026-10']);
  
  // Pastikan tidak ada bulan 11 (November) atau bulan masa depan
  assert.ok(!periods.includes('2026-11'), 'November tidak boleh terhitung sebelum 1 November');
  assert.ok(!periods.includes('2026-12'), 'Desember tidak boleh terhitung');

  // Pastikan tidak ada duplikasi bulan yang sama
  const uniquePeriods = new Set(periods);
  assert.equal(uniquePeriods.size, periods.length, 'Tidak boleh ada duplikasi periode komisi');

  console.log('✔ Hanya mencakup s.d. bulan berjalan tanpa ada bulan mendatang atau duplikasi.');
}

console.log('\n================================================================');
console.log('SEMUA 5 PENGUJIAN AKUMULASI KOMISI INVESTOR BERHASIL 100%!');
console.log('================================================================');
