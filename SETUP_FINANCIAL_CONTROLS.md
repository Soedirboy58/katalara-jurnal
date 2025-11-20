# 🚀 Panduan Setup Fitur Kontrol Keuangan

## Update Terbaru
Katalara sekarang dilengkapi dengan fitur-fitur baru:
1. ✅ Favicon dengan logo Katalara
2. ✅ Show/Hide password di halaman login
3. ✅ Pengaturan limit pengeluaran harian
4. ✅ Target pemasukan harian
5. ✅ Notifikasi otomatis saat mendekati limit
6. ✅ Analisa ROI (Return on Investment)

---

## 📋 Langkah Setup Database

### 1. Jalankan SQL Migration
Buka **Supabase Dashboard** → **SQL Editor** → Copy & paste script berikut:

```sql
-- Add new columns to business_configurations for financial controls
ALTER TABLE business_configurations
ADD COLUMN IF NOT EXISTS daily_expense_limit DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS daily_revenue_target DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS enable_expense_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_threshold INTEGER DEFAULT 80,
ADD COLUMN IF NOT EXISTS track_roi BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS roi_period VARCHAR(20) DEFAULT 'monthly';

-- Add comments
COMMENT ON COLUMN business_configurations.daily_expense_limit IS 'Maximum daily expense limit';
COMMENT ON COLUMN business_configurations.daily_revenue_target IS 'Daily revenue target';
COMMENT ON COLUMN business_configurations.enable_expense_notifications IS 'Enable expense limit notifications';
COMMENT ON COLUMN business_configurations.notification_threshold IS 'Percentage threshold for notifications (e.g., 80 = notify at 80% of limit)';
COMMENT ON COLUMN business_configurations.track_roi IS 'Enable ROI tracking';
COMMENT ON COLUMN business_configurations.roi_period IS 'ROI calculation period: daily, weekly, monthly';
```

### 2. Klik **RUN** untuk eksekusi

### 3. Verifikasi
Cek apakah kolom berhasil ditambahkan:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'business_configurations'
AND column_name IN ('daily_expense_limit', 'daily_revenue_target', 'enable_expense_notifications', 'notification_threshold', 'track_roi', 'roi_period');
```

---

## 🎯 Cara Menggunakan Fitur Baru

### 1. **Atur Limit & Target**
- Buka **Dashboard** → **Pengaturan** (menu Sidebar)
- Atur **Limit Pengeluaran Harian** (contoh: Rp 1.000.000)
- Atur **Target Pemasukan Harian** (contoh: Rp 2.000.000)
- Klik **Simpan Pengaturan**

### 2. **Aktifkan Notifikasi**
- Di halaman **Pengaturan**, toggle **Aktifkan Notifikasi**
- Pilih **Threshold Notifikasi** (80% = alert saat pengeluaran sudah 80% dari limit)
- Notifikasi akan muncul otomatis saat input pengeluaran

### 3. **Tracking ROI**
- Toggle **Track ROI Otomatis** di halaman **Pengaturan**
- Pilih periode analisa: **Harian**, **Mingguan**, atau **Bulanan**
- ROI akan otomatis muncul di **Dashboard** sebagai widget biru/ungu

### 4. **Cek Dashboard**
Setelah atur limit, dashboard akan menampilkan:
- ⚠️ **Warning banner** saat mendekati limit (80%+)
- 🚨 **Error banner** saat melebihi limit (100%+)
- 📊 **ROI Widget** menampilkan performa investasi
- 💡 **Quick Setup Prompt** jika belum atur limit

---

## 🎨 Perubahan UI/UX

### Favicon
- Logo Katalara sekarang muncul di browser tab
- URL: `https://usradkbchlkcfoabxvbo.supabase.co/storage/v1/object/public/assets/Logo.png`

### Login Page
- Password field sekarang punya icon **👁️** untuk show/hide
- Klik icon untuk toggle visibility password

### Dashboard
- Widget ROI baru di atas Health Score
- Warning banner dinamis berdasarkan limit
- Setup prompt untuk user yang belum konfigurasi

### Input Pengeluaran
- Notifikasi real-time saat mendekati/melebihi limit
- Toast warning muncul sebelum submit
- Auto-load settings dari database

---

## 📊 Formula ROI

```
ROI = ((Revenue - Expenses) / Expenses) × 100%
```

**Contoh:**
- Revenue bulan ini: Rp 10.000.000
- Expenses bulan ini: Rp 7.000.000
- ROI = ((10jt - 7jt) / 7jt) × 100% = **42.86%**

Artinya: Setiap Rp 1 yang dikeluarkan menghasilkan return Rp 1.43

---

## 🔔 Jenis Notifikasi

### 1. Warning (Amber) - 80-99% dari limit
```
⚠️ Peringatan: Pengeluaran hari ini sudah mencapai 85% dari limit 
(Rp 850.000 / Rp 1.000.000)
```

### 2. Error (Red) - 100%+ dari limit
```
🚨 OVER LIMIT! Pengeluaran hari ini (Rp 1.100.000) 
melebihi limit harian (Rp 1.000.000)
```

### 3. Dashboard Banner
Muncul otomatis di dashboard dengan link ke **Pengaturan**

---

## 🛠️ Troubleshooting

### Notifikasi tidak muncul?
1. Cek apakah sudah atur limit di **Pengaturan**
2. Pastikan toggle **Aktifkan Notifikasi** ON
3. Clear browser cache dan reload

### ROI tidak muncul di dashboard?
1. Pastikan toggle **Track ROI Otomatis** ON di **Pengaturan**
2. Pastikan ada data revenue dan expenses
3. ROI = 0% jika belum ada pengeluaran

### SQL migration error?
1. Pastikan tabel `business_configurations` sudah ada
2. Jalankan migration `create_business_config_schema.sql` dulu jika belum
3. Contact support jika masih error

---

## 🎯 Best Practices

### Setting Limit Realistis
- Review pengeluaran 30 hari terakhir
- Hitung rata-rata pengeluaran harian
- Set limit 20-30% lebih tinggi dari rata-rata
- Adjust secara bertahap

### Threshold Notifikasi
- **50%** = Terlalu dini, banyak notifikasi
- **80%** = Recommended, balance antara warning & operasional
- **95%** = Terlalu telat, susah control

### ROI Period
- **Harian** = Untuk bisnis dengan transaksi harian tinggi (F&B, retail)
- **Mingguan** = Untuk bisnis dengan cycle mingguan
- **Bulanan** = Untuk analisa trend jangka panjang (recommended)

---

## 📱 Mobile Responsive
Semua fitur baru sudah responsive:
- Settings page full responsive
- ROI widget responsive
- Warning banner responsive
- Toast notifications mobile-friendly

---

## 🔗 Quick Links
- **Dashboard**: `/dashboard`
- **Pengaturan**: `/dashboard/settings`
- **Input Pengeluaran**: `/dashboard/input-expenses`
- **SQL File**: `sql/add_financial_controls.sql`

---

## ✅ Checklist Setup

- [ ] Jalankan SQL migration di Supabase
- [ ] Verifikasi kolom baru ada di `business_configurations`
- [ ] Login ke platform
- [ ] Buka menu **Pengaturan**
- [ ] Atur **Limit Pengeluaran Harian**
- [ ] Atur **Target Pemasukan Harian** (opsional)
- [ ] Toggle **Aktifkan Notifikasi** ON
- [ ] Pilih **Threshold Notifikasi** (80% recommended)
- [ ] Toggle **Track ROI** ON
- [ ] Pilih **Period Analisa ROI**
- [ ] Klik **Simpan Pengaturan**
- [ ] Kembali ke **Dashboard** untuk lihat ROI widget
- [ ] Test input pengeluaran untuk cek notifikasi
- [ ] Cek password show/hide di halaman login
- [ ] Verify favicon muncul di browser tab

---

**Need help?** Contact support atau check documentation di `/dashboard/help`

🎉 **Selamat menggunakan fitur baru Katalara!**
