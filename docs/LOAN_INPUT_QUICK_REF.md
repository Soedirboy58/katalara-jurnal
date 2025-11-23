# 🚀 Quick Access - Fitur Pinjaman Input Pendapatan

## 📍 Akses Cepat
**URL Langsung**: `/dashboard/input-income`

### Langkah Singkat - Pinjaman:
1. Dashboard → **Input Pendapatan**
2. Jenis: **Pendanaan**
3. Kategori: **🏦 Pinjaman Diterima**

### Langkah Singkat - Dana Investor:
1. Dashboard → **Input Pendapatan**
2. Jenis: **Pendanaan**
3. Kategori: **🤝 Dana Investor**

---

## 📝 Field yang Wajib Diisi

### 🏦 Pinjaman Diterima

| Field | Contoh | Keterangan |
|-------|--------|------------|
| **Jumlah Pinjaman** | 50.000.000 | Tanpa titik, auto-format |
| **Pemberi Pinjaman** | Bank BCA | Nama bank/lembaga/orang |
| **Bunga (% /tahun)** | 12 | Dalam persen, contoh: 12 untuk 12% |
| **Jangka Waktu** | 12 | Dalam bulan |
| **Tgl Bayar Pertama** | 2025-02-01 | Tanggal cicilan pertama |

### 🤝 Dana Investor

| Field | Contoh | Keterangan |
|-------|--------|------------|
| **Jumlah Dana** | 100.000.000 | Tanpa titik, auto-format |
| **Nama Investor** | PT. Venture | Nama investor/perusahaan |
| **Kontak** | 0812xxx | WhatsApp/Email |
| **Profit Share %** | 20 | Persentase bagi hasil (1-100%) |
| **Frekuensi** | Monthly | Bulanan/Quarterly/Tahunan |
| **Tgl Mulai** | 2025-01-01 | Tanggal mulai agreement |

---

## 🧮 Auto-Calculate

Klik tombol **"🧮 Hitung Preview Cicilan"** untuk melihat:

### Summary Cards:
- **Total Pinjaman**: Amount yang diinput
- **Cicilan/Bulan**: Hasil anuitas (tetap)
- **Total Bayar**: Pokok + Semua bunga
- **Total Bunga**: Selisih total bayar - pokok

### Tabel Detail:
- Tanggal jatuh tempo setiap bulan
- Breakdown: Pokok + Bunga
- Sisa hutang per bulan
- Footer: Total pokok, total bunga, total cicilan

---

## ⚡ Fitur Highlights

### ✅ Real-time Calculator
- Tidak perlu simpan untuk lihat preview
- Hitung ulang kapan saja
- Ubah data langsung ketahuan efeknya

### ✅ Metode Anuitas
- Cicilan tetap setiap bulan
- Bulan awal: Bunga tinggi, pokok rendah
- Bulan akhir: Bunga rendah, pokok tinggi

### ✅ Responsive Design
- Desktop: Tabel full width
- Mobile: Scroll horizontal, summary 2x2

### ✅ Visual Indicators
- 🏦 Icon bank di header form
- 📊 Icon chart di preview table
- Color-coded: Blue (pinjaman), Green (cicilan), Orange (total)

---

## 💾 Yang Tersimpan vs Tidak

### ✅ Tersimpan di Database:
- Transaksi income (penerimaan uang)
- Jumlah pinjaman
- Tanggal terima
- Pemberi pinjaman (di notes/description)

### ❌ Tidak Tersimpan:
- Jadwal cicilan detail
- Tracking pembayaran per bulan
- Status lunas/belum

**Solusi**: Screenshot atau catat jadwal cicilan

---

## 🔧 Tech Details

### State Variables (Added):
```typescript
const [loanLenderName, setLoanLenderName] = useState('')
const [loanInterestRate, setLoanInterestRate] = useState('')
const [loanTermMonths, setLoanTermMonths] = useState('')
const [loanFirstPaymentDate, setLoanFirstPaymentDate] = useState('')
const [loanInstallmentPreview, setLoanInstallmentPreview] = useState<any[]>([])
const [showLoanPreview, setShowLoanPreview] = useState(false)
```

### Formula:
```typescript
// Anuitas PMT formula
const monthlyRate = rate / 100 / 12
const installment = P * (monthlyRate * (1 + monthlyRate)^n) / 
                    ((1 + monthlyRate)^n - 1)

// Per installment
interest = remainingBalance * monthlyRate
principal = installment - interest
remaining = remainingBalance - principal
```

### Conditional Render:
```tsx
{category === 'loan_received' && (
  <LoanInputForm />
)}

{category === 'loan_received' && showLoanPreview && (
  <LoanPreviewTable />
)}
```

---

## 🎯 Production URLs

- **Production**: https://supabase-migration-g0uakdqji-katalaras-projects.vercel.app
- **Path**: `/dashboard/input-income`
- **Deployed**: November 24, 2025

---

## 📚 Related Docs

- Full Guide: `docs/INPUT_PENDAPATAN_LOAN_FEATURE.md`
- Finance API: `docs/FINANCE_API_DOCUMENTATION.md` (separate loan system)
- Quick Start: `docs/FINANCE_QUICK_START.md`

---

## 🔄 Comparison: Financing Features

| Feature | 🏦 Pinjaman | 🤝 Dana Investor | Finance Module |
|---------|------------|------------------|----------------|
| **Purpose** | Catat pinjaman | Investor funding | Full management |
| **Preview** | ✅ Installments | ✅ Profit share | ✅ Complete |
| **Tracking** | ❌ Manual | ✅ Auto-reminder | ✅ Full auto |
| **Database** | `incomes` only | `incomes` + `investor_funding` | 6 tables |
| **Notifications** | ❌ None | ✅ Period reminders | ✅ All events |
| **Payment** | Manual expense | Manual expense | ✅ Auto-link |
| **Reports** | ❌ None | ⏳ Coming | ✅ Full reports |

**Use Input Pendapatan Loan** jika:
- Hanya perlu catat penerimaan pinjaman
- Tracking manual via spreadsheet OK
- Simple workflow

**Use Finance Module** jika:
- Perlu full loan management
- Auto-tracking pembayaran cicilan
- Dashboard dan reports

---

## ✅ Testing Checklist

- [ ] Buka `/dashboard/input-income`
- [ ] Pilih "Pendanaan" → "Pinjaman Diterima"
- [ ] Isi: 50jt, Bank BCA, 12%, 12 bulan
- [ ] Set tanggal bayar pertama
- [ ] Klik "Hitung Preview" → Lihat tabel
- [ ] Verify: 12 rows, cicilan ~4.4jt/bulan
- [ ] Check total bunga & total bayar
- [ ] Simpan transaksi
- [ ] Check di daftar pendapatan → Ada record baru

---

## 🐛 Known Limitations

1. **No Auto-Save Installments**: Preview only, not stored
2. **No Payment Tracking**: Need manual expense input
3. **No Reminders**: Set calendar reminder manually
4. **No Late Fee**: Penalty not calculated
5. **No Edit Preview**: Must recalculate if change data

---

## 🎉 Done!

Feature ready di production. User bisa langsung pakai untuk:
- Catat pinjaman yang diterima
- Hitung cicilan bulanan
- Planning budget lebih baik

**No more manual calculator!** 🚀
