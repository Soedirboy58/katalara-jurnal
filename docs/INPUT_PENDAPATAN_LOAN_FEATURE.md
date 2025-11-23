# 💰 Fitur Input Pinjaman di Pendapatan

## 📍 Lokasi Fitur
**Dashboard → Input Pendapatan → Pendanaan → 🏦 Pinjaman Diterima**

URL: `/dashboard/input-income`

---

## ✨ Cara Menggunakan

### 1. Buka Form Input Pendapatan
- Login ke dashboard
- Klik menu **"Input Pendapatan"** di sidebar

### 2. Pilih Kategori Pinjaman
- **Jenis Pendapatan**: Pilih **"Pendanaan"**
- **Kategori**: Pilih **"🏦 Pinjaman Diterima"**

### 3. Isi Data Pinjaman
Form khusus pinjaman akan muncul dengan field:

#### a. Jumlah Pinjaman
- Masukkan jumlah pinjaman yang diterima
- Contoh: `50.000.000` (50 juta)

#### b. Pemberi Pinjaman
- Nama bank, lembaga, atau orang yang memberi pinjaman
- Contoh: `Bank BCA`, `PT. Maju Jaya`, `Bpk. Budi`

#### c. Bunga (% per tahun)
- Suku bunga tahunan dalam persen
- Contoh: `12` (untuk 12% per tahun)
- Jika tanpa bunga, masukkan `0`

#### d. Jangka Waktu
- Durasi pinjaman dalam bulan
- Contoh: `12` (12 bulan = 1 tahun)

#### e. Tanggal Bayar Pertama
- Pilih tanggal cicilan pertama jatuh tempo
- Contoh: `2025-02-01`

#### f. Catatan (Opsional)
- Deskripsi tambahan
- Contoh: `Pinjaman modal usaha untuk beli mesin`

### 4. Hitung Preview Cicilan
- Klik tombol **"🧮 Hitung Preview Cicilan"**
- Sistem akan menghitung jadwal cicilan otomatis
- Preview menampilkan:
  - ✅ Total Pinjaman
  - ✅ Cicilan per Bulan (tetap dengan metode Anuitas)
  - ✅ Total yang Harus Dibayar (pokok + bunga)
  - ✅ Total Bunga
  - ✅ Tabel detail per bulan:
    - Tanggal jatuh tempo
    - Pokok
    - Bunga
    - Total cicilan
    - Sisa hutang

### 5. Simpan Transaksi
- Scroll ke bawah
- Pilih **Metode Pembayaran** (Transfer, Tunai, dll)
- Klik **"💾 Simpan Pendapatan"**
- ✅ Transaksi penerimaan pinjaman akan tersimpan

---

## 📊 Contoh Perhitungan

### Input:
- Jumlah Pinjaman: **Rp 50.000.000**
- Bunga: **12%** per tahun
- Jangka Waktu: **12 bulan**
- Tanggal Bayar Pertama: **1 Februari 2025**

### Output:
- **Cicilan per Bulan**: Rp 4.440.383 (tetap setiap bulan)
- **Total Dibayar**: Rp 53.284.596
- **Total Bunga**: Rp 3.284.596

### Jadwal Cicilan (Sample 3 bulan pertama):
| # | Tgl Jatuh Tempo | Pokok | Bunga | Total Cicilan | Sisa Hutang |
|---|-----------------|--------|-------|---------------|-------------|
| 1 | 01/02/2025 | Rp 3.940.383 | Rp 500.000 | Rp 4.440.383 | Rp 46.059.617 |
| 2 | 01/03/2025 | Rp 3.979.787 | Rp 460.596 | Rp 4.440.383 | Rp 42.079.830 |
| 3 | 01/04/2025 | Rp 4.019.585 | Rp 420.798 | Rp 4.440.383 | Rp 38.060.245 |

---

## 🧮 Metode Perhitungan

### Formula Anuitas
Sistem menggunakan metode **Anuitas** (cicilan tetap):

```
PMT = P × (r × (1 + r)^n) / ((1 + r)^n - 1)

Dimana:
P = Pokok pinjaman
r = Suku bunga per bulan (bunga tahunan ÷ 12 ÷ 100)
n = Jumlah bulan
```

### Breakdown per Bulan:
1. **Bunga** = Sisa hutang × Suku bunga bulanan
2. **Pokok** = Cicilan tetap - Bunga
3. **Sisa Hutang Baru** = Sisa lama - Pokok

---

## 💡 Fitur Unggulan

### ✅ Preview Cicilan Real-Time
- Hitung otomatis tanpa perlu simpan
- Lihat breakdown pokok & bunga per bulan
- Tabel lengkap jadwal pembayaran

### ✅ Cicilan Tetap (Anuitas)
- Cicilan sama setiap bulan
- Mudah untuk budgeting
- Standard perbankan Indonesia

### ✅ Total Transparansi
- Lihat total bunga yang harus dibayar
- Bandingkan dengan pokok
- Ketahui total pengeluaran

### ✅ Jadwal Lengkap
- Tanggal jatuh tempo setiap cicilan
- Sisa hutang setelah bayar
- Export-ready (copy dari tabel)

---

## ⚠️ Catatan Penting

### 1. Preview Tidak Tersimpan Otomatis
- Jadwal cicilan hanya untuk **referensi**
- Anda perlu **catat manual** atau screenshot
- Sistem belum auto-tracking pembayaran cicilan
- Gunakan sebagai panduan untuk budgeting

### 2. Data yang Tersimpan
Yang tersimpan di sistem:
- ✅ Transaksi penerimaan uang pinjaman (income)
- ✅ Jumlah pinjaman
- ✅ Pemberi pinjaman (di deskripsi)
- ✅ Tanggal terima uang

Yang **TIDAK** tersimpan otomatis:
- ❌ Jadwal cicilan detail
- ❌ Tracking pembayaran cicilan
- ❌ Status lunas/belum

### 3. Tracking Pembayaran Manual
Untuk mencatat pembayaran cicilan:
- Gunakan menu **"Input Pengeluaran"**
- Kategori: **"Hutang & Pinjaman"** → **"Bayar Cicilan Pinjaman"**
- Masukkan jumlah cicilan yang dibayar
- Catat manual di notes: "Cicilan ke-X dari Y"

### 4. Bunga 0%
- Jika pinjaman tanpa bunga, masukkan `0` di field bunga
- Cicilan = Pokok pinjaman ÷ Jangka waktu
- Tidak ada biaya tambahan

---

## 🎯 Use Cases

### 1. Pinjaman Bank
```
Jumlah: Rp 100.000.000
Bunga: 10% per tahun
Tenor: 24 bulan
Preview: Cicilan Rp 4.614.493/bulan
```

### 2. Pinjaman Peer-to-Peer
```
Jumlah: Rp 20.000.000
Bunga: 15% per tahun
Tenor: 6 bulan
Preview: Cicilan Rp 3.487.090/bulan
```

### 3. Pinjaman Tanpa Bunga (Keluarga)
```
Jumlah: Rp 10.000.000
Bunga: 0%
Tenor: 12 bulan
Preview: Cicilan Rp 833.333/bulan (tetap)
```

### 4. KTA (Kredit Tanpa Agunan)
```
Jumlah: Rp 50.000.000
Bunga: 12% per tahun
Tenor: 12 bulan
Preview: Cicilan Rp 4.440.383/bulan
```

---

## 🔄 Workflow Lengkap

### Saat Terima Pinjaman:
1. ✅ Input di **"Pendapatan"** → Kategori **"Pinjaman Diterima"**
2. ✅ Hitung preview cicilan
3. ✅ Screenshot atau catat jadwal cicilan
4. ✅ Simpan transaksi

### Setiap Bulan Bayar Cicilan:
1. ✅ Input di **"Pengeluaran"** → Kategori **"Bayar Cicilan Pinjaman"**
2. ✅ Masukkan jumlah sesuai jadwal
3. ✅ Catat: "Cicilan ke-X dari Y - Bank ABC"

### Tracking Manual:
- Gunakan Excel/Notes untuk track cicilan
- Atau buat reminder di kalender setiap bulan
- Cross-check dengan jadwal preview

---

## 📱 Tampilan Mobile

Form tetap responsive di mobile:
- ✅ Field input full-width
- ✅ Tabel preview scroll horizontal
- ✅ Summary cards 2x2 grid
- ✅ Touch-friendly buttons

---

## 🚀 Fitur Auto-Reminder ⭐ NEW!

### ✅ Notifikasi Otomatis Pembayaran Cicilan
Sistem sekarang mendukung **reminder otomatis** untuk pembayaran cicilan!

**Cara Aktifkan:**
1. Saat input pinjaman, centang: **"🔔 Aktifkan Pengingat Pembayaran Cicilan"**
2. (Opsional) Isi kontak pemberi pinjaman untuk referensi
3. Simpan transaksi

**Cara Kerja:**
- ✅ Sistem mengirim notifikasi **3 hari sebelum** tanggal jatuh tempo
- ✅ Reminder setiap bulan sesuai jadwal cicilan
- ✅ Notifikasi berisi: Jumlah cicilan, tanggal tempo, pemberi pinjaman
- ✅ Link langsung ke form pembayaran (Input Pengeluaran)

**Benefits:**
- 🔔 Tidak lupa bayar cicilan
- 📅 Planning keuangan lebih baik
- ⚠️ Hindari denda keterlambatan
- 📊 Professional loan management

---

## 🚀 Roadmap Future

Fitur yang sedang dikembangkan:
- ✅ **Notifikasi reminder jatuh tempo** ← DONE!
- ⏳ Auto-save jadwal cicilan ke database
- ⏳ Tracking status pembayaran per cicilan
- ⏳ Link expense cicilan ke loan record
- ⏳ Report total hutang aktif
- ⏳ Dashboard widget: "Cicilan Bulan Ini"

---

## ❓ FAQ

**Q: Apakah jadwal cicilan tersimpan otomatis?**  
A: Tidak, preview hanya untuk referensi. Screenshot atau catat manual.

**Q: Bagaimana cara track pembayaran cicilan?**  
A: Input manual di **Pengeluaran** setiap kali bayar cicilan.

**Q: Bisa ubah data pinjaman setelah disimpan?**  
A: Ya, edit transaksi dari daftar pendapatan.

**Q: Kalau telat bayar, ada denda?**  
A: Sistem tidak hitung denda otomatis. Catat manual jika ada.

**Q: Bisa export jadwal cicilan ke Excel?**  
A: Belum otomatis, copy manual dari tabel preview.

---

## 🎉 Kesimpulan

Fitur ini membantu Anda:
- ✅ Catat penerimaan pinjaman dengan proper
- ✅ Hitung cicilan bulanan secara akurat
- ✅ Lihat total bunga yang harus dibayar
- ✅ Planning keuangan lebih baik
- ✅ Transparansi biaya pinjaman

**Tidak perlu kalkulator manual lagi!** 🎯
