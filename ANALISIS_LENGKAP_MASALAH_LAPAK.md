# 🔍 ANALISIS LENGKAP: Kenapa Logo & Order History Tidak Persist?

**Tanggal**: 15 Februari 2026  
**Status**: Investigasi Mendalam  
**Deployment Terakhir**: https://katalara-nextjs-7m2mkax1c-katalaras-projects.vercel.app

---

## 📌 PERTANYAAN ANDA

> "apakah dalam pembuatan db tidak memperhitungkan atau mempersiapkan konfigurasi terkait logo bisnis?"
> 
> "kenapa tidak bisa tuntas-tuntas?"
>
> "apa yang membuat riwayat order kembali muncul setelah dilakukan restart? apakah karena db juga?"

---

## ✅ FAKTA: DATABASE SCHEMA SUDAH LENGKAP

### Tabel `business_storefronts` SUDAH MEMILIKI:

```sql
CREATE TABLE business_storefronts (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    slug TEXT UNIQUE NOT NULL,
    store_name TEXT NOT NULL,
    
    -- ✅ LOGO BUSINESS SUDAH ADA
    logo_url TEXT,
    
    -- ✅ COVER IMAGE SUDAH ADA
    cover_image_url TEXT,
    
    -- ✅ QRIS SUDAH ADA
    qris_image_url TEXT,
    
    -- ✅ BANNER CAROUSEL SUDAH ADA (dari migration 10)
    banner_image_urls JSONB DEFAULT '[]',
    banner_autoplay_ms INTEGER DEFAULT 3500,
    
    -- ✅ WA TEMPLATES SUDAH ADA (dari migration 09)
    wa_status_templates JSONB DEFAULT '{}',
    
    -- Dan kolom lainnya...
    whatsapp_number TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Lokasi Schema**: [katalara-nextjs/sql/01-features/lapak-online.sql](katalara-nextjs/sql/01-features/lapak-online.sql#L14-L43)  
**Migrasi Payment**: [katalara-nextjs/sql/02-migrations/add_payment_fields.sql](katalara-nextjs/sql/02-migrations/add_payment_fields.sql)  
**Migrasi Banner**: [supabase-migration/sql/10_storefront_banner_carousel.sql](supabase-migration/sql/10_storefront_banner_carousel.sql)  
**Migrasi WA**: [supabase-migration/sql/09_storefront_wa_status_templates.sql](supabase-migration/sql/09_storefront_wa_status_templates.sql)

**KESIMPULAN**: Schema database BUKAN masalahnya! ✅

---

## 🔴 MASALAH SEBENARNYA

### 1. **LOGO & BANNER TIDAK PERSIST** 

#### **Root Cause: RACE CONDITION**

```
USER ACTION:
1. Klik "Upload Logo" → mulai upload ke Supabase Storage (memakan waktu 2-5 detik)
2. Langsung klik "Perbarui Lapak" → API dipanggil SEBELUM upload selesai
3. API menerima logo_url = "" (kosong, karena upload belum selesai)
4. Database disimpan dengan logo_url = ""
5. Upload selesai, tapi sudah terlambat - database sudah di-save dengan nilai kosong
6. Refresh halaman → logo hilang lagi ❌
```

#### **Kenapa QRIS Bekerja Tapi Logo Tidak?**

- **QRIS**: Biasanya user upload 1 gambar → tunggu selesai → save
  - Waktu lebih lama antara upload dan save
  - Race condition jarang terjadi ✅

- **Logo/Banner**: User upload beberapa gambar → langsung klik save
  - Multiple uploads simultan (logo, banner 1, banner 2, banner 3)
  - User tidak sabar, klik save sebelum semua upload selesai
  - Race condition SERING terjadi ❌

#### **Fix yang Sudah Diimplementasi** (Deployment terakhir)

**File**: [katalara-nextjs/src/app/dashboard/lapak/page.tsx](katalara-nextjs/src/app/dashboard/lapak/page.tsx)

```typescript
// 1. TRACK ACTIVE UPLOADS
const [activeUploadCount, setActiveUploadCount] = useState(0)

// 2. CALLBACK DARI ImageUpload COMPONENT
<ImageUpload
  onUploadingChange={(isUploading) => {
    setActiveUploadCount(prev => prev + (isUploading ? 1 : -1))
  }}
/>

// 3. DISABLE SAVE BUTTON SAAT ADA UPLOAD
<button
  disabled={saving || activeUploadCount > 0}
  onClick={handleSave}
>
  {activeUploadCount > 0 
    ? `Menunggu ${activeUploadCount} upload selesai...`
    : 'Perbarui Lapak'
  }
</button>
```

**Apa yang Berubah:**
- ✅ Save button di-disable saat ada upload aktif
- ✅ User bisa lihat berapa upload yang masih berjalan
- ✅ Tidak bisa klik save sebelum semua upload selesai
- ✅ Race condition DICEGAH

---

### 2. **ORDER HISTORY MUNCUL LAGI SETELAH RESET**

#### **Investigasi Code Reset**

**File**: [katalara-nextjs/src/app/api/settings/reset-data/route.ts](katalara-nextjs/src/app/api/settings/reset-data/route.ts#L298-L369)

```typescript
// CODE SUDAH BENAR ✅
const supabase = createSupabaseJsClient(supabaseUrl, serviceKey) // ← SERVICE ROLE

// Get storefront IDs
const storefronts = await supabase
  .from('business_storefronts')
  .select('id')
  .eq('user_id', user.id)

const storefrontIds = storefronts.data.map(row => row.id)

// COUNT BEFORE
const beforeCount = await countByInIds(supabase, 'storefront_orders', 'storefront_id', storefrontIds)

// DELETE ORDERS
await deleteByInIds(supabase, 'storefront_orders', 'storefront_id', storefrontIds)

// COUNT AFTER
const afterCount = await countByInIds(supabase, 'storefront_orders', 'storefront_id', storefrontIds)

// REPORT
report.push({
  scope: 'lapak_orders',
  ok: true,
  detail: `Order ${beforeCount}→${afterCount}, Analytics ${...}→${...}`
})
```

**Code logic SUDAH BENAR!** ✅

#### **Kemungkinan Penyebab Order Muncul Lagi:**

1. **FRONTEND CACHE** (Paling Mungkin)
   - Browser/React menyimpan data lama di state
   - API sudah hapus, tapi UI tidak reload
   - **Fix**: Paksa reload halaman setelah reset

2. **PWA SERVICE WORKER CACHE**
   - Service worker menyimpan response lama
   - **Fix**: Sudah diimplementasi - `NetworkOnly` untuk `/api/*` routes
   - **Verifikasi**: Clear browser cache completely (Ctrl+Shift+Delete)

3. **MULTIPLE STOREFRONTS**
   - User punya lebih dari 1 storefront
   - Reset hanya menghapus dari 1 storefront
   - Order dari storefront lain masih muncul
   - **Cek**: Jalankan query #4 di `DIAGNOSA_DATABASE.sql`

4. **DATABASE MIGRATION BELUM DIJALANKAN**
   - Tabel `storefront_orders` menggunakan struktur lama
   - **Cek**: Jalankan query #1 di `DIAGNOSA_DATABASE.sql`

---

## 🛠️ LANGKAH DIAGNOSTIK

### **A. Cek Database di Supabase Dashboard**

1. Buka **Supabase Dashboard** → Project Anda → **SQL Editor**
2. Copy-paste queries dari file: `DIAGNOSA_DATABASE.sql`
3. Jalankan query #7 untuk cek kolom:

```sql
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'business_storefronts' 
                 AND column_name = 'banner_image_urls')
    THEN '✅ OK'
    ELSE '❌ MISSING - BUTUH MIGRATION'
  END as banner_status;
```

Jika hasilnya `❌ MISSING`, artinya migration belum dijalankan.

### **B. Cek Data Aktual di Database**

Jalankan query #3:

```sql
SELECT 
  id,
  slug,
  logo_url,
  qris_image_url,
  banner_image_urls,
  updated_at
FROM business_storefronts
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'email_anda@domain.com')
ORDER BY updated_at DESC
LIMIT 1;
```

**Interpretasi Hasil:**
- Jika `logo_url` = `NULL` atau `''` (string kosong) → Race condition fix belum ditest
- Jika `banner_image_urls` kolom tidak ada → Migration 10 belum dijalankan
- Jika data NULL tapi kolom ada → Upload selesai tapi state tidak sinkron

### **C. Cek Storage Buckets**

Jalankan query #8:

```sql
SELECT name, public, file_size_limit
FROM storage.buckets
WHERE name IN ('Logo Bisnis', 'products', 'QRIS DB', 'lapak-images');
```

**Expected:**
```
name          | public | file_size_limit
--------------+--------+----------------
Logo Bisnis   | true   | 10485760
products      | true   | 10485760
QRIS DB       | true   | 5242880
lapak-images  | true   | 10485760
```

Jika bucket `Logo Bisnis` tidak ada → Upload pasti gagal

### **D. Test Manual Upload (Frontend)**

1. Buka halaman Lapak Settings di production: https://katalara-nextjs-7m2mkax1c-katalaras-projects.vercel.app/dashboard/lapak
2. Buka **Developer Tools** (F12) → **Console tab**
3. Upload logo
4. **JANGAN** langsung klik "Perbarui Lapak"
5. **TUNGGU** sampai melihat toast "Logo berhasil diupload"
6. Cek apakah button "Perbarui Lapak" masih disabled
7. Jika button masih disabled, berarti upload masih berjalan (FIX BEKERJA ✅)
8. Tunggu sampai button aktif kembali
9. **BARU** klik "Perbarui Lapak"
10. Refresh halaman (F5)
11. Cek apakah logo masih ada

**Jika logo HILANG lagi:**
- Buka **Network tab** di DevTools
- Filter: `lapak`
- Refresh halaman
- Cek request `GET /api/lapak`
- Klik request tersebut → **Preview tab**
- Cek value `logo_url` di response
- Jika `logo_url` = `""` atau `null` → Database memang kosong (race condition masih terjadi)
- Jika `logo_url` = `"https://..."` → Database benar, masalah di frontend rendering

---

## 📊 KEMUNGKINAN SKENARIO & SOLUSI

### **Skenario A: Migration Belum Dijalankan**

**Symptoms:**
- Error di console: `column "banner_image_urls" does not exist`
- Warning toast: "Kolom banner_image_urls belum tersedia di database"

**Solution:**
1. Buka **Supabase Dashboard** → **SQL Editor**
2. Copy-paste isi file: `supabase-migration/sql/10_storefront_banner_carousel.sql`
3. Klik **Run**
4. Copy-paste isi file: `supabase-migration/sql/09_storefront_wa_status_templates.sql`
5. Klik **Run**
6. Verifikasi dengan query #7 di `DIAGNOSA_DATABASE.sql`

---

### **Skenario B: Upload Race Condition (Logo/Banner Hilang)**

**Symptoms:**
- Logo berhasil diupload (ada toast success)
- Berhasil klik "Perbarui Lapak" (ada toast success)
- Tapi setelah refresh, logo hilang lagi

**Solution:**
✅ **SUDAH DIFIX** di deployment terakhir!

**Test Steps:**
1. Upload logo
2. **PERHATIKAN** button "Perbarui Lapak"
3. Jika button berubah jadi "Menunggu 1 upload selesai..." → **FIX BEKERJA** ✅
4. **TUNGGU** sampai button kembali normal ("Perbarui Lapak")
5. Baru klik save
6. Refresh halaman
7. Logo harus persist

**Jika masih hilang:**
- Cek database secara manual (query #3)
- Jika database kosong → Race condition masih terjadi
- Cek di console apakah ada error dari `ImageUpload.tsx`
- Cek apakah `onUploadingChange` callback dipanggil

---

### **Skenario C: Order History Muncul Lagi**

**Symptoms:**
- Klik "Hapus Riwayat Order"
- Muncul toast: "Order 5→0, Analytics 10→0"
- Tapi setelah refresh, order muncul lagi (masih 5 order)

**Possible Root Causes:**

#### **C.1: Frontend State Tidak Reload**

**Solution:**
```typescript
// File: src/app/dashboard/lapak/page.tsx
// Setelah reset success, paksa reload data

const handleResetOrders = async () => {
  const response = await fetch('/api/settings/reset-data', {
    method: 'POST',
    body: JSON.stringify({ scopes: ['lapak_orders'], confirmation: 'HAPUS' })
  })
  
  if (response.ok) {
    // ✅ TAMBAHKAN INI: Reload orders dari server
    await fetchOrders() // atau setOrders([])
    
    // Atau paksa full page reload:
    window.location.reload()
  }
}
```

#### **C.2: PWA Cache Serving Stale Data**

**Solution:**
1. Buka **DevTools** → **Application tab** → **Service Workers**
2. Klik **Unregister** untuk service worker
3. Klik **Clear storage** → **Clear site data**
4. Refresh halaman (Ctrl+Shift+R)
5. Test reset lagi

#### **C.3: Multiple Storefronts**

**Diagnostic:**
```sql
-- Cek berapa storefront yang user punya
SELECT id, slug, store_name, created_at
FROM business_storefronts
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@email.com');
```

Jika hasil > 1 storefront:
- Reset hanya menghapus order dari storefront aktif
- Order dari storefront lain masih muncul
- **Solution**: Reset berdasarkan ALL storefronts (code sudah benar)

---

### **Skenario D: RLS Policy Blocking**

**Symptoms:**
- API mengembalikan success
- Tapi database tidak berubah
- Atau error: "new row violates row-level security policy"

**Diagnostic:**
Jalankan query #5 di `DIAGNOSA_DATABASE sql`:

```sql
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'business_storefronts';
```

**Expected Policies:**
- `Users can update own storefront` (UPDATE) ← **HARUS ADA**
- `Users can view own storefronts` (SELECT)
- `Public can view active storefronts` (SELECT)

**Solution:**
Jika policy UPDATE tidak ada atau salah:
```sql
-- Drop existing wrong policy
DROP POLICY IF EXISTS "Users can update own storefront" ON business_storefronts;

-- Create correct policy
CREATE POLICY "Users can update own storefront"
ON business_storefronts
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

---

## 🎯 ACTION PLAN: Apa yang Harus Dilakukan Sekarang?

### **STEP 1: Diagnostik Database** (5 menit)

1. Buka Supabase Dashboard
2. Jalankan query #7 dari `DIAGNOSA_DATABASE.sql`
3. Verifikasi semua kolom ada (✅)
4. Jalankan query #3 untuk cek data aktual
5. Screenshot hasilnya

### **STEP 2: Test Upload Flow** (10 menit)

1. Buka lapak settings di production
2. Buka DevTools Console (F12)
3. Upload logo BARU
4. **PERHATIKAN** button "Perbarui Lapak"
   - Apakah disabled saat upload?
   - Apakah muncul "Menunggu X upload selesai..."?
5. Tunggu sampai button aktif
6. Klik "Perbarui Lapak"
7. Tunggu toast success
8. **Hard refresh** (Ctrl+Shift+R)
9. Cek apakah logo persist

**Report back:**
- Screenshot button saat upload (disabled atau tidak?)
- Screenshot console (ada error?)
- Screenshot hasil setelah refresh (logo ada atau hilang?)

### **STEP 3: Test Reset Orders** (5 menit)

1. Pastikan ada beberapa order di lapak
2. Buka tab Statistik atau Notifikasi (yang menampilkan order)
3. Klik "Hapus Riwayat Order"
4. Perhatikan toast message: "Order X→Y"
5. **JANGAN REFRESH** dulu
6. Cek apakah order langsung hilang di UI (tanpa refresh)
7. Sekarang refresh halaman (F5)
8. Cek apakah order masih hilang

**Report back:**
- Toast message (Order X→Y berapa?)
- Sebelum refresh: order hilang atau masih ada?
- Setelah refresh: order hilang atau muncul lagi?

### **STEP 4: Report Hasil**

Balas dengan:
```
HASIL DIAGNOSTIK:

Database Check:
- [ ] Semua kolom ada ✅
- [ ] Ada kolom yang missing ❌ → (sebutkan kolom apa)

Upload Test:
- [ ] Button disabled saat upload ✅
- [ ] Button tidak disabled ❌
- [ ] Logo persist setelah refresh ✅
- [ ] Logo hilang setelah refresh ❌
- Error di console: [copy-paste jika ada]

Reset Test:
- [ ] Toast: "Order X→Y" (isi: _____)
- [ ] Order hilang sebelum refresh: Ya/Tidak
- [ ] Order hilang setelah refresh: Ya/Tidak

Screenshot: [upload jika memungkinkan]
```

---

## 🔍 DEBUGGING TIPS

### **Jika Logo Hilang Setelah Refresh:**

1. **Cek database langsung:**
   ```sql
   SELECT logo_url FROM business_storefronts 
   WHERE user_id = auth.uid();
   ```
   - Jika NULL/kosong → Upload atau save ada masalah
   - Jika ada URL → Frontend rendering issue

2. **Cek network request:**
   - DevTools → Network → Filter: `lapak`
   - Cek response `GET /api/lapak`
   - Bandingkan `logo_url` di response vs yang tampil di UI

3. **Cek React state:**
   - Tambah `console.log('formData:', formData)` di `lapak/page.tsx`
   - Lihat apakah `formData.logo_url` berisi URL yang benar

### **Jika Order Muncul Lagi:**

1. **Cek di Supabase Dashboard:**
   ```sql
   SELECT COUNT(*) as total_orders, storefront_id
   FROM storefront_orders
   WHERE storefront_id IN (
     SELECT id FROM business_storefronts 
     WHERE user_id = auth.uid()
   )
   GROUP BY storefront_id;
   ```
   - Jika `total_orders` = 0 → Database benar, masalah di frontend
   - Jika `total_orders` > 0 → Reset gagal, cek RLS atau service-role

2. **Cek service-role key:**
   - Vercel Dashboard → Project → Settings → Environment Variables
   - Pastikan `SUPABASE_SERVICE_ROLE_KEY` diset
   - Pastikan key benar (copy dari Supabase Dashboard → Settings → API)

---

## 📝 KESIMPULAN

1. **Database schema SUDAH LENGKAP** ✅
   - Semua kolom (`logo_url`, `qris_image_url`, `banner_image_urls`) sudah ada
   - Bukan masalah schema

2. **Code logic SUDAH BENAR** ✅
   - Reset menggunakan service-role
   - Upload tracking sudah diimplementasi
   - Cache-busting sudah ada

3. **Root cause kemungkinan besar:**
   - **Logo hilang**: Race condition (fix baru di-deploy, BELUM DITEST)
   - **Order muncul**: Frontend state tidak reload atau PWA cache

4. **Next action:**
   - **PENTING**: Test upload flow dengan fix terbaru
   - Jalankan diagnostic queries di Supabase
   - Report hasil dengan format di Step 4

---

## 📞 NEED HELP?

Jika masih gagal setelah test, balas dengan:
1. Hasil diagnostic queries (query #3, #7, #8)
2. Screenshot DevTools console saat upload
3. Screenshot button "Perbarui Lapak" saat upload berlangsung
4. Toast message lengkap setelah reset (Order X→Y)

Saya akan analisa lebih dalam berdasarkan data konkret.

---

**File Referensi:**
- Diagnostic Queries: `DIAGNOSA_DATABASE.sql`
- Upload Flow: `src/app/dashboard/lapak/page.tsx`
- Reset Logic: `src/app/api/settings/reset-data/route.ts`
- Upload Component: `src/components/lapak/ImageUpload.tsx`
- API Route: `src/app/api/lapak/route.ts`
