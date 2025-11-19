# 🚀 URGENT: Jalankan SQL Migration

## ⚠️ MASALAH SAAT INI

**Login gagal** karena tabel `user_profiles` dan `business_categories` **belum ada di database**. 

Aplikasi mencoba query tabel yang belum ter-create, sehingga:
- ✅ Register bisa (Supabase Auth)
- ❌ Login gagal (cari profile tidak ada)
- ❌ Business categories kosong

---

## 📋 SOLUSI: Jalankan SQL Migration

### Langkah 1: Buka Supabase Dashboard

1. Buka browser ke: https://app.supabase.com
2. Login dengan akun Anda
3. Pilih project: **usradkbchlkcfoabxvbo** (Katalara project)

### Langkah 2: Masuk ke SQL Editor

1. Sidebar kiri → Klik **"SQL Editor"**
2. Klik tombol **"+ New Query"**

### Langkah 3: Copy-Paste SQL Migration

1. Buka file: `katalara-nextjs/sql/09_user_profiles_roles.sql`
2. **Copy SEMUA isinya** (237 baris)
3. **Paste** ke SQL Editor di Supabase
4. Klik tombol **"Run"** (atau tekan Ctrl+Enter)

### Langkah 4: Verifikasi

Setelah run, cek di **Table Editor**:
- ✅ `business_categories` (16 kategori bisnis Indonesia)
- ✅ `user_profiles` (tabel kosong, siap terisi saat register)

---

## 📊 Apa yang Ter-Create?

### 1. **business_categories** Table
Kategori bisnis khas Indonesia:
- ✅ Kuliner & F&B
- ✅ Fashion & Konveksi
- ✅ Retail & Toko Kelontong
- ✅ Jasa & Service
- ✅ Kecantikan & Salon
- ✅ Kerajinan & Souvenir
- ✅ Pertanian & Peternakan
- ✅ Online Shop
- ✅ Otomotif & Bengkel
- ✅ Elektronik & Gadget
- ✅ Pendidikan & Kursus
- ✅ Event & Wedding Organizer
- ✅ Fotografi & Videografi
- ✅ Percetakan & Desain
- ✅ Properti & Kontrakan
- ✅ Lainnya

### 2. **user_profiles** Table
Informasi bisnis user:
- Full name
- Phone
- Address
- Business name
- Business category
- Role (user / super_admin)
- Approval status

### 3. **RLS Policies**
- Users hanya lihat profile sendiri
- Super admin lihat semua
- Auto-create profile saat register

### 4. **Helper Functions**
- `get_user_with_profile()` - Get user data lengkap
- `admin_users_overview` - View untuk admin dashboard

---

## 🔧 Setelah Migration

### Test Registration Flow:

1. **Buka**: http://localhost:3000/register
2. **Isi data**:
   - Email & Password
   - Data bisnis + pilih kategori (sudah ada 16 pilihan!)
3. **Klik "Selesaikan Pendaftaran"**
4. **Cek email** untuk verifikasi

### Test Login:

1. **Buka**: http://localhost:3000/login
2. **Login** dengan akun yang sudah dibuat
3. **Seharusnya**:
   - ✅ Bisa login
   - ✅ Redirect ke dashboard
   - ❌ Jika role = 'user' dan belum approved → dapat pesan "Menunggu approval"

---

## 🎨 Bonus: Logo Katalara

Logo sudah ditambahkan di landing page navigation dengan ikon orang + spark (melambangkan UMKM yang berkembang).

---

## ❓ Troubleshooting

### Error: "relation does not exist"
→ SQL belum dijalankan. Ulangi Langkah 1-3.

### Error: "permission denied"
→ Pastikan login sebagai owner project.

### Kategori bisnis tidak muncul
→ Refresh browser setelah run SQL.

---

**STATUS**: 
- ✅ SQL file ready
- ✅ Kategori bisnis updated (16 kategori Indonesia)
- ✅ Logo Katalara added
- ⏳ **Waiting**: Run SQL di Supabase Dashboard

Setelah run SQL, **semua akan berfungsi normal**! 🚀
