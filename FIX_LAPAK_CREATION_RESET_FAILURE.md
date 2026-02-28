# 🔧 FIX: BUAT LAPAK GAGAL & RESET DATA GAGAL

**Tanggal**: 23 Februari 2026  
**Masalah**: 
1. ❌ Restart semua data gagal
2. ❌ Akun baru tidak bisa membuat lapak baru

---

## 🔍 DIAGNOSA

### Root Cause Analysis

**Migration 10** menambahkan kolom dengan constraint NOT NULL:
```sql
ALTER TABLE business_storefronts
ADD COLUMN banner_image_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN banner_autoplay_ms INTEGER NOT NULL DEFAULT 3500;
```

**Kemungkinan Penyebab:**
1. ✅ Migration **belum dijalankan** di Supabase production
2. ✅ Migration **gagal sebagian** (kolom ada tapi constraint tidak)
3. ✅ **Service-role key** tidak valid atau tidak tersedia
4. ✅ **RLS policy** blocking INSERT untuk user baru

---

## 🛠️ LANGKAH PERBAIKAN

### **STEP 1: Verifikasi Migration di Supabase**

1. Buka **Supabase Dashboard** → Project Anda
2. Klik **SQL Editor** di sidebar kiri
3. Buat **New query** dan jalankan:

```sql
-- Cek apakah kolom sudah ada
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'business_storefronts'
  AND column_name IN ('banner_image_urls', 'banner_autoplay_ms', 'wa_status_templates')
ORDER BY column_name;
```

**Expected Result:**
```
banner_image_urls    | jsonb   | NO  | '[]'::jsonb
banner_autoplay_ms   | integer | NO  | 3500
wa_status_templates  | jsonb   | YES | NULL
```

**Jika kolom TIDAK ADA atau is_nullable = YES untuk banner:**  
👉 **Migration belum dijalankan dengan benar!**

---

### **STEP 2A: Jika Kolom Belum Ada - Jalankan Migration**

Di Supabase SQL Editor, jalankan full migration:

```sql
-- Migration 10: Add banner carousel columns
BEGIN;

-- Add banner columns dengan default values
ALTER TABLE business_storefronts
ADD COLUMN IF NOT EXISTS banner_image_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS banner_autoplay_ms INTEGER NOT NULL DEFAULT 3500;

-- Add constraint untuk autoplay range
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'business_storefronts_banner_autoplay_ms_check'
  ) THEN
    ALTER TABLE business_storefronts
      ADD CONSTRAINT business_storefronts_banner_autoplay_ms_check
      CHECK (banner_autoplay_ms BETWEEN 1200 AND 10000);
  END IF;
END $$;

-- Verify kolom sudah ada
SELECT 
  column_name, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'business_storefronts'
  AND column_name IN ('banner_image_urls', 'banner_autoplay_ms');

COMMIT;
```

**Setelah selesai, coba buat lapak lagi!**

---

### **STEP 2B: Jika Kolom Sudah Ada Tapi Masih Gagal**

Berarti ada issue di **service-role key** atau **RLS policy**.

#### **A. Cek Service Role Key**

1. Buka file: `.env.local` di folder `katalara-nextjs`
2. Cari baris: `SUPABASE_SERVICE_ROLE_KEY=...`
3. Pastikan key ada dan valid (panjang ~300+ karakter)

**Jika key TIDAK ADA atau salah:**

1. Buka **Supabase Dashboard** → **Settings** → **API**
2. Di bagian **Project API keys**, copy **service_role key** (secret)
3. Edit `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...(copy service_role key di sini)
   ```

4. **Restart dev server** atau **rebuild + redeploy**:
   ```powershell
   cd katalara-nextjs
   npm run build
   vercel --prod --yes
   ```

#### **B. Cek RLS Policy untuk INSERT**

Di Supabase SQL Editor, jalankan:

```sql
-- Cek policy untuk business_storefronts
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'business_storefronts'
  AND cmd = 'INSERT';
```

**Harus ada policy seperti:**
- `Enable insert for authenticated users only` atau
- Policy dengan `cmd = INSERT` dan `qual` yang allow user insert dengan `user_id = auth.uid()`

**Jika TIDAK ADA policy INSERT:**

```sql
-- Create RLS policy untuk INSERT
CREATE POLICY "Users can insert their own storefronts"
ON business_storefronts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
```

---

### **STEP 3: Test Lagi**

#### **Test 1: Buat Lapak Baru**

1. Buka aplikasi di browser (production URL atau localhost)
2. Login dengan **akun baru** atau akun yang belum punya lapak
3. Buka **Dashboard** → **Lapak**
4. Klik **"Buat Lapak Baru"** atau isi form
5. **Buka DevTools Console (F12)** - perhatikan error
6. Klik **"Simpan"** atau **"Buat Lapak"**

**Expected:**
- ✅ Toast success: "Lapak berhasil dibuat"
- ✅ Redirect ke halaman lapak settings

**Jika masih GAGAL:**
- 📸 Screenshot **console error**
- 📸 Screenshot **network tab** (API response)
- Kirim ke saya untuk analisa

#### **Test 2: Reset Data**

1. Login ke akun yang **sudah ada order di lapak**
2. Buka **Dashboard** → **Pengaturan**
3. Scroll ke bawah ke bagian **"Hapus Data"**
4. **Buka DevTools Console (F12)**
5. Pilih **"Restart Riwayat Lapak"** atau **"Hapus Semua Data"**
6. Klik **"Preview"** dulu untuk lihat data apa yang akan dihapus
7. Jika preview berhasil, klik **"Preview & Hapus"**

**Expected:**
- ✅ Toast success dengan detail berapa data yang dihapus
- ✅ Data order/analytics hilang dari database

**Jika GAGAL:**
- Check console untuk error message
- Cek **Vercel Logs**: https://vercel.com/katalaras-projects/katalara-nextjs/logs
- Filter by: `[Reset Orders]` atau `reset-data`
- Screenshot error dan kirim

---

## 🔍 DIAGNOSTIC TOOLS

Saya sudah buat SQL diagnostic file: [DIAGNOSA_LAPAK_CREATION.sql](DIAGNOSA_LAPAK_CREATION.sql)

**Cara pakai:**
1. Buka file SQL tersebut
2. Copy query yang ingin dijalankan
3. Paste di **Supabase SQL Editor**
4. Jalankan dan screenshot hasilnya

**Queries yang tersedia:**
- Query 1: Cek kolom banner sudah ada
- Query 2: Cek constraint banner_autoplay_ms
- Query 4: Cek RLS policies
- Query 5: Cek existing storefronts
- Query 6-7: Cek orders & analytics untuk reset

---

## 📊 KEMUNGKINAN ERROR & SOLUSI

### **Error 1: "column banner_image_urls does not exist"**

**Cause:** Migration 10 belum dijalankan

**Solution:**
- Jalankan **STEP 2A** di atas (run migration SQL)
- Restart server setelah migration success

---

### **Error 2: "new row violates check constraint business_storefronts_banner_autoplay_ms_check"**

**Cause:** Nilai `banner_autoplay_ms` di luar range 1200-10000

**Solution:**
- Ini seharusnya tidak terjadi karena code sudah ada normalization
- Jika terjadi, ada bug di normalization logic
- **Temporary fix:** Set manual di form ke 3500

---

### **Error 3: "new row violates row-level security policy"**

**Cause:** RLS policy blocking INSERT untuk user baru

**Solution:**
- Jalankan **STEP 2B part B** (create RLS policy untuk INSERT)
- Atau disable RLS temporary:
  ```sql
  ALTER TABLE business_storefronts DISABLE ROW LEVEL SECURITY;
  ```
  ⚠️ **WARNING:** Jangan disable RLS di production!

---

### **Error 4: "Gagal menghapus storefront_orders"**

**Cause:** Service-role key tidak valid atau RLS blocking DELETE

**Solution:**
- Cek **STEP 2B part A** (verify service-role key)
- Pastikan `SUPABASE_SERVICE_ROLE_KEY` ada di `.env.local` dan production (Vercel Environment Variables)

**Cara add to Vercel:**
1. Buka **Vercel Dashboard** → Project → **Settings** → **Environment Variables**
2. Add new variable:
   - **Key:** `SUPABASE_SERVICE_ROLE_KEY`
   - **Value:** (paste service_role key dari Supabase)
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development
3. **Redeploy** aplikasi

---

## 🚀 QUICK FIX CHECKLIST

Cek satu-satu:

- [ ] **Migration 10 sudah dijalankan** (Query 1 di SQL Editor)
  - [ ] Kolom `banner_image_urls` ada dan NOT NULL
  - [ ] Kolom `banner_autoplay_ms` ada dan NOT NULL
  - [ ] Constraint `banner_autoplay_ms_check` exists

- [ ] **Service-role key valid**
  - [ ] Ada di `.env.local`
  - [ ] Ada di Vercel Environment Variables (Production)
  - [ ] Panjang ~300+ karakter, format `eyJhbGc...`

- [ ] **RLS Policy untuk INSERT**
  - [ ] Ada policy `INSERT` untuk `business_storefronts`
  - [ ] Policy allow user dengan `auth.uid() = user_id`

- [ ] **Test Creation**
  - [ ] Akun baru bisa buat lapak
  - [ ] No error di console
  - [ ] Lapak muncul di dashboard

- [ ] **Test Reset**
  - [ ] Preview reset berhasil show data count
  - [ ] Reset execute menghapus data
  - [ ] Orders/analytics hilang dari database

---

## 📞 JIKA MASIH GAGAL

Kirim ke saya:

1. **Screenshot console error** (F12 → Console)
2. **Screenshot network error** (F12 → Network → response API)
3. **Hasil Query 1** dari DIAGNOSA_LAPAK_CREATION.sql
4. **Hasil Query 4** (RLS policies)
5. **Vercel logs** (filter: `[Media Sync]`, `[Reset Orders]`, atau `error`)

Dengan info ini saya bisa diagnosa lebih detail! 🔍

---

**Status:** ⏳ **PENDING TEST & VERIFICATION**

Timestamp: 23 Februari 2026, 23:40 WIB
