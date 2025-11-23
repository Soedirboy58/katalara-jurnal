# 🤝 Fitur Dana Investor & Profit Sharing

## 📍 Lokasi Fitur
**Dashboard → Input Pendapatan → Pendanaan → 🤝 Dana Investor**

URL: `/dashboard/input-income`

---

## ✨ Cara Menggunakan

### 1. Buka Form Input Pendapatan
- Login ke dashboard
- Klik menu **"Input Pendapatan"** di sidebar

### 2. Pilih Kategori Dana Investor
- **Jenis Pendapatan**: Pilih **"Pendanaan"**
- **Kategori**: Pilih **"🤝 Dana Investor"**

### 3. Isi Data Investor & Agreement
Form khusus investor akan muncul dengan field:

#### a. Jumlah Dana Investasi
- Masukkan jumlah dana yang diterima dari investor
- Contoh: `100.000.000` (100 juta)

#### b. Nama Investor
- Nama lengkap investor / perusahaan
- Contoh: `PT. Venture Capital`, `Bpk. Andi Wijaya`

#### c. Kontak Investor
- WhatsApp atau Email untuk komunikasi
- Contoh: `081234567890`, `investor@email.com`

#### d. Persentase Profit Sharing
- Berapa persen profit yang dibagikan ke investor
- Contoh: `20` (investor dapat 20% dari profit bersih)
- Range: 1-100%

#### e. Frekuensi Pembagian
Pilih jadwal pembagian profit:
- **📅 Bulanan** - Setiap bulan (12x setahun)
- **📅 Per 3 Bulan (Quarterly)** - Setiap 3 bulan (4x setahun)
- **📅 Tahunan** - Sekali setahun

#### f. Tanggal Mulai Investasi
- Tanggal mulai berlaku agreement
- Contoh: `2025-01-01`

#### g. Tanggal Berakhir (Opsional)
- Tanggal akhir agreement (jika ada)
- Kosongkan jika investasi tanpa batas waktu

#### h. Aktifkan Pengingat
- ✅ Checkbox untuk aktifkan notifikasi otomatis
- Sistem akan mengirim reminder sesuai jadwal
- Default: **Aktif**

#### i. Catatan (Opsional)
- Deskripsi tambahan
- Contoh: `Investasi untuk ekspansi cabang baru`

### 4. Hitung Preview Profit Sharing
- Klik tombol **"🧮 Hitung Preview Profit Sharing"**
- Sistem akan menampilkan preview dengan contoh profit
- Preview menunjukkan:
  - ✅ Jumlah investasi
  - ✅ Persentase investor
  - ✅ Frekuensi pembagian
  - ✅ Contoh perhitungan profit share
  - ✅ Bagian investor vs bisnis

### 5. Simpan Transaksi
- Scroll ke bawah
- Pilih **Metode Pembayaran** (Transfer, Tunai, dll)
- Klik **"💾 Simpan Pendapatan"**
- ✅ Transaksi penerimaan dana + agreement tersimpan
- ✅ Notifikasi otomatis aktif sesuai jadwal

---

## 📊 Contoh Penggunaan

### Contoh 1: Investor Venture Capital

**Input:**
- Jumlah Dana: **Rp 100.000.000**
- Investor: **PT. Venture Indonesia**
- Kontak: **0812-3456-7890**
- Profit Share: **20%**
- Frekuensi: **Quarterly (3 bulan)**
- Mulai: **1 Januari 2025**
- Berakhir: **31 Desember 2027** (3 tahun)
- Reminder: **✅ Aktif**

**Output Preview:**
Dengan asumsi profit bersih Rp 12 juta/bulan:
- Profit bersih per quarter (3 bulan): **Rp 36.000.000**
- Bagian Investor (20%): **Rp 7.200.000**
- Bagian Bisnis (80%): **Rp 28.800.000**
- Frekuensi: **4x setahun** (setiap 3 bulan)

**Notifikasi:**
Sistem akan reminder setiap 3 bulan untuk:
1. Hitung profit bersih periode berjalan
2. Bayar profit share ke investor
3. Catat pembayaran di sistem

---

### Contoh 2: Investor Pribadi Bulanan

**Input:**
- Jumlah Dana: **Rp 50.000.000**
- Investor: **Ibu Siti Nurhaliza**
- Kontak: **siti@email.com**
- Profit Share: **15%**
- Frekuensi: **Bulanan**
- Mulai: **1 Februari 2025**
- Berakhir: **(Kosong - tanpa batas)**
- Reminder: **✅ Aktif**

**Output Preview:**
Dengan asumsi profit bersih Rp 10 juta/bulan:
- Profit bersih per bulan: **Rp 10.000.000**
- Bagian Investor (15%): **Rp 1.500.000**
- Bagian Bisnis (85%): **Rp 8.500.000**
- Frekuensi: **12x setahun** (setiap bulan)

**Notifikasi:**
Sistem akan reminder setiap bulan untuk bayar Rp 1.5 juta (berdasarkan profit aktual).

---

## 🧮 Cara Kerja Sistem

### 1. Saat Input Dana Investor
Sistem menyimpan:
- ✅ Transaksi penerimaan dana (income)
- ✅ Agreement profit sharing (investor_funding table)
- ✅ Jadwal notifikasi otomatis

### 2. Notifikasi Otomatis
Berdasarkan frekuensi yang dipilih:
- **Bulanan**: Reminder setiap tanggal yang sama
- **Quarterly**: Reminder setiap 3 bulan
- **Tahunan**: Reminder setahun sekali

Notifikasi berisi:
- 🔔 Pengingat bayar profit share
- 📊 Link ke dashboard untuk input pembayaran
- 📝 Info investor & persentase

### 3. Saat Bayar Profit Share
User perlu:
1. Hitung profit bersih periode (Revenue - Expense)
2. Kalikan dengan persentase investor
3. Input di **"Pengeluaran"** → Kategori **"Profit Sharing"**
4. Link ke investor agreement

### 4. Tracking & Report
Sistem akan track:
- ✅ Total yang sudah dibayar ke investor
- ✅ Frekuensi pembayaran
- ✅ History profit share
- ✅ ROI untuk investor

---

## 💡 Fitur Unggulan

### ✅ Auto-Reminder System
- Notifikasi otomatis sesuai jadwal
- Tidak akan lupa bayar profit share
- Menjaga hubungan baik dengan investor

### ✅ Agreement Management
- Data investor tersimpan rapi
- Persentase & frekuensi tercatat
- Tanggal mulai & berakhir jelas

### ✅ Preview Calculation
- Lihat simulasi profit sharing
- Contoh perhitungan dengan angka riil
- Transparansi pembagian profit

### ✅ Flexible Frequency
- Bulanan untuk investor aktif
- Quarterly untuk investor institusi
- Tahunan untuk investor pasif

### ✅ Kontrol Penuh
- User tentukan kapan bayar
- Hitung profit aktual sendiri
- Input manual untuk akurasi

---

## 🔧 Integrasi dengan Finance Module

### Link ke API Finance
Jika sudah execute SQL schema finance:
- Agreement tersimpan di table `investor_funding`
- Profit share payment tercatat di `profit_sharing_payments`
- Auto-create expense saat bayar

### Database Schema
```sql
investor_funding:
  - investment_amount (Rp)
  - profit_share_percentage (%)
  - payment_frequency (monthly/quarterly/annually)
  - start_date, end_date
  - investor_name, contact
  - enable_reminder (boolean)

profit_sharing_payments:
  - funding_id (link ke investor_funding)
  - period_start, period_end
  - revenue, expenses, net_profit
  - share_amount
  - payment_date, status
  - expense_transaction_id (auto-link)
```

---

## 📱 Workflow Lengkap

### Setup Investor (Sekali)
1. ✅ Input Pendapatan → Dana Investor
2. ✅ Isi data investor & agreement
3. ✅ Hitung preview
4. ✅ Aktifkan reminder
5. ✅ Simpan

### Setiap Periode Pembayaran
1. 🔔 Dapat notifikasi reminder
2. 📊 Hitung profit bersih periode:
   - Total Revenue - Total Expense = Net Profit
3. 🧮 Kalikan dengan persentase:
   - Profit Share = Net Profit × (% / 100)
4. 💸 Bayar ke investor (transfer bank)
5. 💾 Input di **"Pengeluaran"**:
   - Kategori: "Profit Sharing"
   - Amount: Sesuai perhitungan
   - Link ke investor
6. ✅ Sistem update total_profit_shared

### Monitoring
- Dashboard widget: "Upcoming Profit Share"
- Report: "Profit Sharing History"
- Analytics: ROI per investor

---

## ⚠️ Penting Diketahui

### 1. Preview Menggunakan Angka Contoh
- Preview hanya simulasi
- Profit aktual bisa berbeda
- User harus hitung manual saat bayar

### 2. Reminder Tidak Auto-Bayar
- Sistem hanya mengingatkan
- User tetap harus input pembayaran manual
- Kontrol penuh di tangan user

### 3. Profit Bersih = Revenue - Expense
- Hitung dari data aktual periode berjalan
- Bukan dari modal investasi
- Sesuai kesepakatan di agreement

### 4. Tanpa Batas Waktu
- Jika end_date kosong = investasi perpetual
- Investor berhak dapat profit share selamanya
- Atau sampai keluar dengan exit strategy

---

## 🎯 Use Cases

### Use Case 1: Angel Investor
```
Investor: Bpk. John (Angel Investor)
Dana: Rp 200.000.000
Profit Share: 25%
Frekuensi: Quarterly
Durasi: 5 tahun
Reminder: Aktif

Expected: Rp 15-20 juta per quarter
```

### Use Case 2: Silent Partner
```
Investor: PT. XYZ Capital
Dana: Rp 500.000.000
Profit Share: 30%
Frekuensi: Quarterly
Durasi: Perpetual (no end date)
Reminder: Aktif

Expected: Rp 30-50 juta per quarter
```

### Use Case 3: Family & Friends
```
Investor: Teman/Keluarga
Dana: Rp 30.000.000
Profit Share: 10%
Frekuensi: Bulanan
Durasi: 2 tahun
Reminder: Aktif

Expected: Rp 500k-1jt per bulan
```

---

## 🚀 Benefits

### Untuk User:
- ✅ Tidak lupa bayar profit share
- ✅ Hubungan baik dengan investor terjaga
- ✅ Data tersimpan rapi & terorganisir
- ✅ Transparansi pembagian profit
- ✅ Easy tracking & reporting

### Untuk Investor:
- ✅ Agreement tercatat jelas
- ✅ Mendapat notifikasi pembayaran
- ✅ Bisa track history profit share
- ✅ Transparansi perhitungan

---

## 📊 Dashboard & Reports

### Widget Recommendations:
1. **Upcoming Profit Share**
   - List investor yang jatuh tempo
   - Amount estimasi
   - Link ke payment form

2. **Total Investor Funding**
   - Total dana dari semua investor
   - Jumlah investor aktif
   - Total profit shared YTD

3. **Profit Share Calendar**
   - Timeline pembayaran
   - Monthly/Quarterly view
   - Color-coded by status

### Reports:
1. **Profit Sharing History**
   - Per investor
   - Per periode
   - Total paid vs expected

2. **Investor ROI**
   - Return on Investment calculation
   - Profit share / Investment amount
   - Annualized return

---

## ❓ FAQ

**Q: Apakah sistem otomatis bayar ke investor?**  
A: Tidak, sistem hanya reminder. User tetap bayar manual dan input ke pengeluaran.

**Q: Bagaimana jika profit bersih negatif (rugi)?**  
A: Tidak ada pembayaran. Profit share hanya dari profit positif.

**Q: Bisa ada multiple investor?**  
A: Ya, input satu per satu. Setiap investor punya agreement terpisah.

**Q: Kalau mau stop agreement?**  
A: Set end_date atau update status menjadi "terminated".

**Q: Profit share dihitung dari omzet atau profit bersih?**  
A: **Profit bersih** (Revenue - Expense). Sesuai standar industri.

**Q: Bisa edit persentase setelah disimpan?**  
A: Ya, bisa edit agreement (dengan persetujuan investor).

---

## 🎉 Kesimpulan

Fitur ini membantu Anda:
- ✅ Kelola investor funding dengan profesional
- ✅ Auto-reminder untuk pembayaran profit share
- ✅ Transparansi & akuntabilitas tinggi
- ✅ Menjaga hubungan baik dengan investor
- ✅ Data terorganisir & mudah di-track

**Perfect untuk bisnis yang:**
- Punya investor aktif
- Perlu sistem reminder otomatis
- Ingin transparansi pembagian profit
- Perlu data untuk report ke investor

---

## 🔗 Related Features

- **Input Pendapatan (Loan)**: Untuk pinjaman dengan cicilan tetap
- **Finance Module**: Full investor management system (coming soon)
- **Dashboard Widgets**: Visual tracking profit share (roadmap)
- **Reports**: Investor ROI & profit share history (roadmap)

---

## 📚 Next Steps

Setelah setup investor:
1. Tunggu notifikasi reminder
2. Hitung profit bersih periode
3. Bayar profit share sesuai %
4. Input di Pengeluaran
5. Investor happy, bisnis lancar! 🎉
