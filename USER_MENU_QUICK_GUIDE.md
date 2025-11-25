# 🎯 User Menu - Quick Reference Guide

## Fitur Baru yang Ditambahkan

### 1. 📱 User Menu Dropdown
Klik avatar di sidebar untuk membuka menu dengan opsi:

**Account:**
- Profile - Edit nama, email, telepon, alamat, info bisnis
- General Settings - Tema, bahasa, notifikasi, alerts

**Activity:**
- Activity Log (NEW) - Lihat semua aktivitas yang dilakukan
- Notifications (3) - Notifikasi sistem

**Support:**
- Help & Support - Bantuan dan dokumentasi
- Keyboard Shortcuts - Shortcut cepat aplikasi

### 2. 👤 Halaman Profile
**Lokasi:** Dashboard → Avatar → Profile  
**URL:** `/dashboard/profile`

**Informasi Personal:**
- Nama Lengkap (wajib)
- Email (tidak bisa diubah)
- Nomor Telepon
- Alamat

**Informasi Bisnis:**
- Nama Bisnis (wajib)
- Jenis Bisnis (dropdown)

**Fitur:**
- Auto-load data yang sudah ada
- Validasi form sebelum save
- Notifikasi sukses/gagal
- Activity log otomatis saat update

### 3. 📋 Activity Log
**Lokasi:** Dashboard → Avatar → Activity Log  
**URL:** `/dashboard/activity-log`

**Filter Aktivitas:**
- Semua
- Pendapatan
- Pengeluaran
- Produk
- Lainnya

**Filter Periode:**
- Hari Ini
- 7 Hari Terakhir
- 30 Hari Terakhir
- Semua

**Informasi yang Ditampilkan:**
- Icon dan warna sesuai jenis aktivitas
- Deskripsi lengkap
- Waktu relatif ("2 jam yang lalu")
- Metadata tambahan jika ada

### 4. ⚙️ General Settings
**Lokasi:** Dashboard → Avatar → General Settings  
**URL:** `/dashboard/general-settings`

**Tampilan:**
- Tema: Terang / Gelap / Otomatis
- Bahasa: Indonesia / English

**Regional:**
- Mata Uang: IDR / USD / EUR / SGD
- Format Tanggal: DD/MM/YYYY / MM/DD/YYYY / YYYY-MM-DD

**Notifikasi:**
- Email Notifications (toggle)
- Push Notifications (toggle)

**Alerts:**
- Expense Alerts (toggle + threshold Rp)
- Low Stock Alerts (toggle + minimum stok)

**Fitur:**
- Semua pengaturan tersimpan otomatis
- Reset ke Default
- Notifikasi sukses saat save
- Activity log otomatis

## 🔧 Setup Database

### Cara Menjalankan Migrasi:

1. **Buka Supabase Dashboard**
2. **Masuk ke SQL Editor**
3. **Jalankan file ini satu per satu:**

```bash
# File 1: Create activity_logs table
katalara-nextjs/sql/create_activity_logs_table.sql

# File 2: Add settings columns
katalara-nextjs/sql/add_settings_to_business_config.sql
```

4. **Atau jalankan setup lengkap:**
```bash
katalara-nextjs/sql/setup_user_menu_feature.sql
```

### Verifikasi:
```sql
-- Cek activity_logs table
SELECT * FROM activity_logs LIMIT 5;

-- Cek business_configurations columns
\d business_configurations
```

## 🚀 Deploy ke Production

### Langkah Deploy:

1. **Build Project (sudah selesai):**
```bash
cd katalara-nextjs
npm run build
# ✅ Build successful!
```

2. **Deploy ke Vercel:**
```bash
vercel --prod
```

3. **Test Setelah Deploy:**
- [ ] Login ke dashboard
- [ ] Klik avatar di sidebar
- [ ] Buka halaman Profile
- [ ] Update info dan save
- [ ] Buka Activity Log
- [ ] Lihat activity yang baru saja dilakukan
- [ ] Buka General Settings
- [ ] Ubah beberapa setting dan save
- [ ] Refresh page, pastikan setting tetap tersimpan

## 💡 Tips Penggunaan

### Activity Log:
- Gunakan filter untuk mencari aktivitas spesifik
- Log maksimal 100 aktivitas terakhir per filter
- Data tidak bisa diubah/dihapus (audit trail)

### General Settings:
- Gunakan "Reset ke Default" jika bingung
- Expense threshold dalam Rupiah (contoh: 1000000 = 1 juta)
- Low stock threshold dalam unit (contoh: 10 = minimal 10 unit)

### Profile:
- Email tidak bisa diubah (gunakan untuk login)
- Nama Bisnis wajib diisi
- Semua perubahan tercatat di Activity Log

## 🎨 Keyboard Shortcuts

- **Esc** - Tutup user menu dropdown
- **Ctrl+K** - Quick Search (coming soon)
- **Ctrl+N** - New Transaction (coming soon)
- **Ctrl+D** - Dashboard (coming soon)

## 🔒 Keamanan

- ✅ RLS (Row Level Security) aktif
- ✅ User hanya bisa lihat data sendiri
- ✅ Activity log immutable (tidak bisa diubah)
- ✅ Settings tersimpan per user
- ✅ Auth protection di semua halaman

## 📊 Database Tables

### `activity_logs`
```
- id (UUID)
- user_id (UUID)
- action (TEXT)
- description (TEXT)
- metadata (JSONB)
- created_at (TIMESTAMP)
```

### `business_configurations` (kolom baru)
```
- theme (TEXT)
- language (TEXT)
- currency (TEXT)
- date_format (TEXT)
- email_notifications (BOOLEAN)
- push_notifications (BOOLEAN)
- expense_alerts (BOOLEAN)
- expense_threshold (BIGINT)
- low_stock_alerts (BOOLEAN)
- low_stock_threshold (INTEGER)
```

## 🐛 Troubleshooting

### User Menu tidak muncul?
- Pastikan sudah login
- Refresh halaman
- Clear browser cache

### Activity Log kosong?
- Normal jika baru pertama kali pakai
- Lakukan aktivitas (update profile, ubah setting)
- Refresh halaman Activity Log

### Settings tidak tersimpan?
- Cek koneksi internet
- Pastikan database migration sudah dijalankan
- Lihat console browser untuk error
- Pastikan RLS policy benar

### Data tidak muncul setelah deploy?
- Pastikan environment variables sudah benar di Vercel
- Cek Supabase connection string
- Pastikan database migration sudah dijalankan di production

## 📞 Support

Jika ada masalah atau pertanyaan, cek:
1. Browser console untuk error messages
2. Supabase logs untuk database errors
3. Vercel logs untuk deployment issues
4. File `USER_MENU_IMPLEMENTATION.md` untuk detail teknis

---

**Status:** ✅ Production Ready  
**Build:** Successful  
**Deployment:** Pending database migration
