# Logika Transaksi Pendanaan & Investasi

## 🎯 Tujuan
Membangun sistem tracking yang lebih komprehensif untuk transaksi pendanaan (financing) dan investasi (investing), bukan hanya mencatat penerimaan uang, tapi juga mencatat **kewajiban** dan **aset** yang terkait.

---

## 📊 Analisis Masalah Saat Ini

### ❌ **Masalah:**
Saat ini sistem hanya mencatat **uang masuk** tanpa tracking kewajiban/aset:

1. **Pinjaman Diterima** → Hanya catat uang masuk, tidak catat jadwal cicilan
2. **Dana Investor** → Tidak catat persentase bagi hasil dan jadwal pembayaran
3. **Return Investasi** → Hanya catat return/bunga, tidak catat setoran awal

### ✅ **Yang Dibutuhkan:**
Sistem yang komprehensif dengan **double-entry logic**:

- Terima pinjaman → Auto-create reminder cicilan + link ke pengeluaran
- Terima dana investor → Catat % bagi hasil + jadwal pembayaran
- Investasi deposito → Catat setoran awal sebagai aset

---

## 🏗️ Solusi Arsitektur

### 1. **Pinjaman (Loan Tracking)**

#### A. Input Form Enhancement
**Form Pinjaman:**
```tsx
// Saat user pilih kategori "Pinjaman Diterima"
{
  loan_amount: 50000000,           // Jumlah pinjaman
  interest_rate: 12,                // Bunga per tahun (%)
  loan_term_months: 12,             // Tenor (bulan)
  installment_frequency: 'monthly', // Cicilan: monthly, quarterly
  first_payment_date: '2025-01-23', // Tanggal cicilan pertama
  lender_name: 'Bank BCA',          // Pemberi pinjaman
  lender_contact: '08123456789',    // Kontak
  purpose: 'Modal kerja',           // Tujuan pinjaman
}
```

#### B. Auto-Calculate Installment
**Rumus Anuitas:**
```javascript
const monthlyRate = interest_rate / 100 / 12
const installment = loan_amount * 
  (monthlyRate * Math.pow(1 + monthlyRate, loan_term_months)) / 
  (Math.pow(1 + monthlyRate, loan_term_months) - 1)

// Contoh: Pinjaman Rp 50jt, bunga 12%, 12 bulan
// Cicilan per bulan: Rp 4.440.383
```

#### C. Database Schema
**Table: `loans`**
```sql
CREATE TABLE loans (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  income_transaction_id UUID REFERENCES income(id), -- Link ke transaksi terima pinjaman
  loan_amount DECIMAL(15,2),
  interest_rate DECIMAL(5,2),
  loan_term_months INTEGER,
  installment_amount DECIMAL(15,2),
  installment_frequency TEXT, -- monthly, quarterly
  first_payment_date DATE,
  lender_name TEXT,
  lender_contact TEXT,
  purpose TEXT,
  status TEXT, -- active, paid_off, defaulted
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jadwal cicilan
CREATE TABLE loan_installments (
  id UUID PRIMARY KEY,
  loan_id UUID REFERENCES loans(id),
  installment_number INTEGER,
  due_date DATE,
  principal_amount DECIMAL(15,2),
  interest_amount DECIMAL(15,2),
  total_amount DECIMAL(15,2),
  status TEXT, -- pending, paid, overdue
  expense_transaction_id UUID REFERENCES expenses(id), -- Link ke pengeluaran saat bayar
  paid_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### D. Auto-Create Reminder & Sync
**Logic Flow:**
```javascript
// 1. User input pinjaman diterima
const createLoanIncome = async (loanData) => {
  // Insert income transaction
  const income = await supabase.from('income').insert({
    category: 'loan_received',
    amount: loanData.loan_amount,
    // ... other fields
  })
  
  // Insert loan record
  const loan = await supabase.from('loans').insert({
    income_transaction_id: income.id,
    ...loanData
  })
  
  // Auto-generate installment schedule
  const installments = generateInstallmentSchedule(loanData)
  await supabase.from('loan_installments').insert(installments)
  
  // Create reminder notifications (30 days before due)
  await createPaymentReminders(loan.id, installments)
}

// 2. User bayar cicilan
const payInstallment = async (installmentId) => {
  const installment = await supabase
    .from('loan_installments')
    .select('*')
    .eq('id', installmentId)
    .single()
  
  // Auto-create expense transaction
  const expense = await supabase.from('expenses').insert({
    category: 'loan_payment',
    amount: installment.total_amount,
    description: `Cicilan ke-${installment.installment_number}`,
    expense_date: new Date(),
    // Link back to loan
    loan_id: installment.loan_id
  })
  
  // Update installment status
  await supabase
    .from('loan_installments')
    .update({
      status: 'paid',
      expense_transaction_id: expense.id,
      paid_date: new Date()
    })
    .eq('id', installmentId)
}
```

---

### 2. **Dana Investor (Investor Funding)**

#### A. Input Form Enhancement
**Form Dana Investor:**
```tsx
{
  investment_amount: 100000000,         // Jumlah investasi
  profit_share_percentage: 20,          // Bagi hasil (%)
  payment_frequency: 'monthly',         // Bulanan/triwulan
  start_date: '2025-01-01',            // Mulai perhitungan
  duration_months: 12,                  // Durasi kerjasama (bulan)
  investor_name: 'PT Maju Jaya',       // Nama investor
  investor_contact: '08123456789',      // Kontak
  notes: 'Bagi hasil dari laba bersih', // Catatan
}
```

#### B. Database Schema
**Table: `investor_funding`**
```sql
CREATE TABLE investor_funding (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  income_transaction_id UUID REFERENCES income(id),
  investment_amount DECIMAL(15,2),
  profit_share_percentage DECIMAL(5,2),
  payment_frequency TEXT, -- monthly, quarterly, annually
  start_date DATE,
  end_date DATE,
  investor_name TEXT,
  investor_contact TEXT,
  notes TEXT,
  status TEXT, -- active, completed, terminated
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Riwayat pembayaran bagi hasil
CREATE TABLE profit_sharing_payments (
  id UUID PRIMARY KEY,
  funding_id UUID REFERENCES investor_funding(id),
  period_start DATE,
  period_end DATE,
  business_revenue DECIMAL(15,2),      -- Pendapatan periode
  business_expenses DECIMAL(15,2),     -- Pengeluaran periode
  net_profit DECIMAL(15,2),            -- Laba bersih
  share_amount DECIMAL(15,2),          -- Jumlah bagi hasil
  due_date DATE,
  status TEXT, -- pending, paid, overdue
  expense_transaction_id UUID REFERENCES expenses(id),
  paid_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### C. Auto-Calculate Profit Sharing
**Logic Flow:**
```javascript
// Calculate monthly profit sharing
const calculateProfitShare = async (fundingId, periodStart, periodEnd) => {
  // Get funding details
  const funding = await supabase
    .from('investor_funding')
    .select('*')
    .eq('id', fundingId)
    .single()
  
  // Calculate net profit for period
  const { data: revenue } = await supabase
    .from('income')
    .select('amount')
    .gte('income_date', periodStart)
    .lte('income_date', periodEnd)
  
  const { data: expenses } = await supabase
    .from('expenses')
    .select('grand_total')
    .gte('expense_date', periodStart)
    .lte('expense_date', periodEnd)
  
  const totalRevenue = revenue.reduce((sum, r) => sum + r.amount, 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + e.grand_total, 0)
  const netProfit = totalRevenue - totalExpenses
  
  // Calculate investor share
  const shareAmount = netProfit * (funding.profit_share_percentage / 100)
  
  // Create profit sharing record
  await supabase.from('profit_sharing_payments').insert({
    funding_id: fundingId,
    period_start: periodStart,
    period_end: periodEnd,
    business_revenue: totalRevenue,
    business_expenses: totalExpenses,
    net_profit: netProfit,
    share_amount: shareAmount,
    due_date: addMonths(periodEnd, 1), // Bayar bulan depan
    status: 'pending'
  })
}
```

---

### 3. **Investasi (Investment Tracking)**

#### A. Input Form Enhancement
**Form Investasi Deposito:**
```tsx
{
  investment_type: 'deposit',          // deposit, stocks, bonds
  principal_amount: 50000000,          // Setoran awal
  interest_rate: 6,                    // Bunga per tahun (%)
  investment_term_months: 12,          // Tenor (bulan)
  maturity_date: '2026-01-23',        // Tanggal jatuh tempo
  bank_name: 'Bank BCA',              // Nama lembaga
  account_number: '1234567890',        // Nomor rekening
  auto_rollover: true,                 // Auto perpanjang?
}
```

#### B. Database Schema
**Table: `investments`**
```sql
CREATE TABLE investments (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  investment_type TEXT, -- deposit, stocks, bonds, mutual_funds
  principal_amount DECIMAL(15,2),
  current_value DECIMAL(15,2),
  interest_rate DECIMAL(5,2),
  investment_term_months INTEGER,
  start_date DATE,
  maturity_date DATE,
  bank_name TEXT,
  account_number TEXT,
  auto_rollover BOOLEAN,
  status TEXT, -- active, matured, liquidated
  expense_transaction_id UUID REFERENCES expenses(id), -- Link ke setoran awal
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Riwayat return/bunga
CREATE TABLE investment_returns (
  id UUID PRIMARY KEY,
  investment_id UUID REFERENCES investments(id),
  return_date DATE,
  return_amount DECIMAL(15,2),
  return_type TEXT, -- interest, dividend, capital_gain
  income_transaction_id UUID REFERENCES income(id), -- Link ke penerimaan bunga
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### C. Auto-Link Deposit & Return
**Logic Flow:**
```javascript
// 1. Catat setoran deposito (expense)
const createDepositInvestment = async (investmentData) => {
  // Create expense for deposit
  const expense = await supabase.from('expenses').insert({
    category: 'investment_deposit',
    grand_total: investmentData.principal_amount,
    description: `Deposito ${investmentData.bank_name}`,
    expense_date: new Date()
  })
  
  // Create investment record
  const investment = await supabase.from('investments').insert({
    expense_transaction_id: expense.id,
    ...investmentData,
    current_value: investmentData.principal_amount
  })
  
  // Schedule maturity notification
  await createMaturityReminder(investment.id, investmentData.maturity_date)
}

// 2. Terima bunga deposito (income)
const recordDepositInterest = async (investmentId, interestAmount) => {
  // Create income transaction
  const income = await supabase.from('income').insert({
    category: 'interest_income',
    amount: interestAmount,
    description: `Bunga deposito`,
    income_date: new Date()
  })
  
  // Record return
  await supabase.from('investment_returns').insert({
    investment_id: investmentId,
    return_amount: interestAmount,
    return_type: 'interest',
    income_transaction_id: income.id,
    return_date: new Date()
  })
  
  // Update current value
  await supabase
    .from('investments')
    .update({
      current_value: sql`current_value + ${interestAmount}`
    })
    .eq('id', investmentId)
}
```

---

## 🎨 UI/UX Implementation

### A. Enhanced Input Form

**Conditional Fields Based on Category:**
```tsx
// Input Pendapatan Page
{category === 'loan_received' && (
  <>
    <h3>Detail Pinjaman</h3>
    <input name="loan_amount" placeholder="Jumlah Pinjaman" />
    <input name="interest_rate" placeholder="Bunga (% per tahun)" />
    <input name="loan_term_months" placeholder="Tenor (bulan)" />
    <select name="installment_frequency">
      <option value="monthly">Cicilan Bulanan</option>
      <option value="quarterly">Cicilan Triwulan</option>
    </select>
    <input name="first_payment_date" type="date" />
    <input name="lender_name" placeholder="Nama Pemberi Pinjaman" />
    
    {/* Preview Cicilan */}
    <div className="bg-blue-50 p-4 rounded-lg">
      <p className="font-bold">Cicilan per bulan: Rp {installmentAmount}</p>
      <p className="text-sm">Total bunga: Rp {totalInterest}</p>
    </div>
  </>
)}

{category === 'investor_funding' && (
  <>
    <h3>Detail Dana Investor</h3>
    <input name="investment_amount" placeholder="Jumlah Investasi" />
    <input name="profit_share_percentage" placeholder="Bagi Hasil (%)" />
    <select name="payment_frequency">
      <option value="monthly">Bulanan</option>
      <option value="quarterly">Triwulan</option>
      <option value="annually">Tahunan</option>
    </select>
    <input name="investor_name" placeholder="Nama Investor" />
  </>
)}

{category === 'interest_income' && (
  <>
    {/* Link to existing investment */}
    <select name="investment_id">
      <option value="">Pilih Investasi...</option>
      {investments.map(inv => (
        <option value={inv.id}>{inv.bank_name} - {inv.account_number}</option>
      ))}
    </select>
    <button onClick={() => setShowNewInvestmentModal(true)}>
      + Buat Investasi Baru
    </button>
  </>
)}
```

### B. Dashboard Widgets

**Loan Repayment Reminder:**
```tsx
<div className="bg-orange-50 border-l-4 border-orange-500 p-4">
  <h4>🔔 Cicilan Jatuh Tempo</h4>
  <ul>
    <li>Bank BCA: Rp 4.440.383 - Jatuh tempo 30 Jan 2025</li>
    <li>Modal Usaha: Rp 2.500.000 - Jatuh tempo 5 Feb 2025</li>
  </ul>
  <button>Bayar Sekarang</button>
</div>
```

**Profit Sharing Reminder:**
```tsx
<div className="bg-blue-50 border-l-4 border-blue-500 p-4">
  <h4>💼 Bagi Hasil Investor</h4>
  <p>Periode: Desember 2024</p>
  <p>Laba Bersih: Rp 15.000.000</p>
  <p>Bagi Hasil (20%): Rp 3.000.000</p>
  <p>Jatuh tempo: 31 Jan 2025</p>
  <button>Bayar Bagi Hasil</button>
</div>
```

**Investment Portfolio:**
```tsx
<div className="grid grid-cols-3 gap-4">
  <div className="bg-white p-4 rounded-lg shadow">
    <h4>Total Investasi</h4>
    <p className="text-2xl font-bold">Rp 150.000.000</p>
  </div>
  <div className="bg-white p-4 rounded-lg shadow">
    <h4>Current Value</h4>
    <p className="text-2xl font-bold">Rp 157.500.000</p>
  </div>
  <div className="bg-white p-4 rounded-lg shadow">
    <h4>Return YTD</h4>
    <p className="text-2xl font-bold text-green-600">+5%</p>
  </div>
</div>
```

---

## 📝 Implementation Checklist

### Phase 1: Database Schema
- [ ] Create `loans` table
- [ ] Create `loan_installments` table
- [ ] Create `investor_funding` table
- [ ] Create `profit_sharing_payments` table
- [ ] Create `investments` table
- [ ] Create `investment_returns` table

### Phase 2: API Routes
- [ ] `/api/loans` - CRUD loan records
- [ ] `/api/loans/installments` - Generate & manage installments
- [ ] `/api/investors` - CRUD investor funding
- [ ] `/api/investors/profit-share` - Calculate profit sharing
- [ ] `/api/investments` - CRUD investments
- [ ] `/api/investments/returns` - Record returns

### Phase 3: UI Components
- [ ] Loan input form with auto-calculate
- [ ] Investor funding form
- [ ] Investment deposit form
- [ ] Loan installment payment modal
- [ ] Profit sharing payment modal
- [ ] Investment dashboard widget

### Phase 4: Integration
- [ ] Link loan installments → expense transactions
- [ ] Link profit sharing → expense transactions
- [ ] Link investment deposits → expense transactions
- [ ] Link investment returns → income transactions
- [ ] Auto-sync reminder notifications

### Phase 5: Reporting
- [ ] Loan repayment schedule report
- [ ] Investor profit sharing report
- [ ] Investment portfolio performance
- [ ] Cash flow impact analysis

---

## 🚀 Benefits

1. **Complete Tracking**: Tidak hanya catat uang masuk, tapi juga kewajiban dan aset
2. **Auto Reminders**: Sistem otomatis ingatkan jadwal pembayaran
3. **Cash Flow Accurate**: Proyeksi cash flow lebih akurat karena tahu kapan harus bayar
4. **Better Planning**: Bisa planning ahead dengan data lengkap
5. **Investor Relations**: Transparansi bagi hasil otomatis, investor lebih percaya
6. **Investment ROI**: Track performance investasi dengan jelas

---

## ⚠️ Notes

- Implementasi ini **complex** dan butuh waktu signifikan
- Prioritaskan fitur sesuai kebutuhan bisnis (pinjaman dulu, baru investor)
- Test thoroughly sebelum production (especially calculations)
- Consider edge cases: early payment, default, rollover, etc.

---

**Status: 📋 Documentation Only - Ready for Implementation**
