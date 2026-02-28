# 🔧 FIX: Banner Carousel Cropping & Reset Data Gagal

**Tanggal**: 23 Februari 2026  
**Production URL**: https://katalara-nextjs-rck9j21no-katalaras-projects.vercel.app  
**Status**: ✅ **DEPLOYED**

---

## 🎯 MASALAH YANG DIPERBAIKI

### **1. ✅ Buat Lapak Baru Berhasil (FIXED via RLS)**
- **Before**: Gagal buat lapak karena tidak ada RLS policy untuk INSERT
- **After**: Berhasil setelah tambah RLS policies di database ✅

### **2. ✅ Banner Carousel Ukuran Sesuai Cropping (FIXED via Deployment)**
- **Before**: Banner di-crop 16:9 di settings, tapi tampil terpotong di storefront
- **After**: Banner tampil sesuai hasil cropping dengan aspect ratio 16:9 ✅

### **3. ⏳ Reset Data Total Masih Gagal (PENDING - Service-Role Key)**
- **Root Cause**: `SUPABASE_SERVICE_ROLE_KEY` belum di-set di Vercel environment variables
- **Solution**: Tambah env variable di Vercel (lihat instruksi di bawah)

---

## 🔍 ROOT CAUSE ANALYSIS

### **Masalah Banner Carousel:**

**Diagnosa:**
- Di **settings**: Banner di-crop dengan aspect ratio **16:9** (`aspectRatio="wide"`)
- Di **storefront**: Container menggunakan **fixed height** (`h-40 sm:h-52 lg:h-64`)
- Width container: `w-full` (100% screen)
- **Problem**: Fixed height + full width = aspect ratio TIDAK 16:9!
  - Mobile: 160px × 375px ≈ **2.34:1** (lebih wide dari 16:9)
  - Desktop: 256px × 1200px ≈ **4.7:1** (jauh lebih wide!)
- `object-cover` akan **crop ulang** gambar untuk fit container → hasil crop hilang!

**Fix:**
```diff
- <div className="relative h-40 sm:h-52 lg:h-64">
+ <div className="relative aspect-video">
```

Ganti dari fixed height ke **aspect-video** (Tailwind CSS class untuk 16:9 ratio).

**Sekarang:**
- Container selalu maintain **16:9 ratio** di semua screen size
- Gambar tampil sesuai hasil crop di settings ✅
- Responsive: height akan adjust otomatis berdasarkan width

---

### **Masalah Reset Data:**

**Diagnosa:**
- Code sudah benar menggunakan `service-role client` untuk bypass RLS
- Tapi `SUPABASE_SERVICE_ROLE_KEY` environment variable **belum di-set di Vercel**
- Tanpa service-role key, API pakai auth client biasa yang kena RLS blocking

**Evidence:**
Code di `src/app/api/settings/reset-data/route.ts`:
```typescript
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = supabaseUrl && serviceKey
  ? createSupabaseJsClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : authSupabase  // ← Fallback ke auth client (kena RLS)
```

**Fix:** Tambah `SUPABASE_SERVICE_ROLE_KEY` di Vercel env (instruksi di bawah)

---

## 🛠️ IMPLEMENTASI FIX

### **Fix 1: Banner Carousel Aspect Ratio**

**File**: [src/app/lapak/[slug]/page.tsx](src/app/lapak/[slug]/page.tsx#L459)

**Before:**
```tsx
<div className="relative h-40 sm:h-52 lg:h-64">
  <img
    src={bannerImages[activeBannerIndex]}
    className="w-full h-full object-cover"
  />
</div>
```

**After:**
```tsx
<div className="relative aspect-video">
  <img
    src={bannerImages[activeBannerIndex]}
    className="w-full h-full object-cover"
  />
</div>
```

**What Changed:**
- ✅ Container sekarang **aspect-video** (16:9) instead of fixed height
- ✅ Height akan auto-adjust berdasarkan width
- ✅ Responsive di semua device tanpa distorsi
- ✅ Gambar tampil sesuai hasil crop dari settings

**Deployment:**
- Build: 11.1s ✅
- Deploy: 2m ✅
- Production: https://katalara-nextjs-rck9j21no-katalaras-projects.vercel.app

---

### **Fix 2: Service-Role Key untuk Reset Data**

**Status**: ⏳ **PENDING - Butuh Action Manual**

#### **Langkah 1: Ambil Service-Role Key dari Supabase**

1. Buka **Supabase Dashboard**: https://supabase.com/dashboard
2. Pilih project Anda
3. Klik **Settings** (gear icon di sidebar) → **API**
4. Scroll ke bagian **Project API keys**
5. Copy **service_role** key (secret key, bukan anon key!)
   - Panjang ~300+ karakter
   - Format: `eyJhbGc...`
   - ⚠️ **JANGAN share key ini ke publik!**

#### **Langkah 2: Tambah ke Vercel Environment Variables**

1. Buka **Vercel Dashboard**: https://vercel.com
2. Pilih project **katalara-nextjs**
3. Klik **Settings** tab
4. Klik **Environment Variables** di sidebar
5. Klik **Add New** button
6. Isi form:
   ```
   Name: SUPABASE_SERVICE_ROLE_KEY
   Value: (paste service_role key dari Supabase)
   
   Environments:
   ✅ Production
   ✅ Preview
   ✅ Development
   ```
7. Klik **Save**

#### **Langkah 3: Redeploy (Optional)**

Sebenarnya **tidak perlu redeploy**! Environment variable akan aktif di function invocation berikutnya (warm restart otomatis).

Tapi jika ingin force refresh:
```bash
cd katalara-nextjs
vercel --prod --yes
```

#### **Langkah 4: Test Reset Data**

1. Login ke aplikasi
2. Buka **Dashboard** → **Pengaturan**
3. Scroll ke **"Hapus Data"**
4. Pilih **"Restart Riwayat Lapak"**
5. Klik **"Preview"** → Harus show data count ✅
6. Klik **"Preview & Hapus"** → Data harus terhapus ✅

**Expected Result:**
- Toast success: "Order 4→0, Analytics 89→0" ✅
- Data order & analytics hilang dari database ✅
- Refresh halaman → data tetap kosong ✅

---

## 🧪 CARA TEST

### **Test 1: Banner Carousel (Sudah Fixed ✅)**

#### **A. Test di Settings:**
1. Login ke: https://katalara-nextjs-rck9j21no-katalaras-projects.vercel.app/dashboard/lapak
2. Scroll ke **"Main Banner Carousel"**
3. Upload banner baru → crop dengan **aspect ratio 16:9**
4. Perhatikan preview di settings → harus tampil sesuai crop ✅
5. Klik **"Perbarui Lapak"**

#### **B. Test di Storefront:**
1. Buka lapak Anda: `https://katalara-nextjs-rck9j21no-katalaras-projects.vercel.app/lapak/[slug-anda]`
2. Lihat banner carousel
3. **Bandingkan dengan hasil crop di settings**
4. **Expected**: Banner tampil PERSIS seperti hasil crop ✅
   - Tidak ada bagian yang terpotong berlebihan
   - Aspect ratio 16:9 maintained
   - Responsive di mobile & desktop

#### **C. Test Multiple Device:**
1. **Mobile** (375px):
   - Banner width ~375px, height ~211px (16:9) ✅
   - Tidak ada horizontal scrolling
   - Gambar tidak stretched/squashed

2. **Tablet** (768px):
   - Banner width ~768px, height ~432px (16:9) ✅

3. **Desktop** (1200px):
   - Banner width ~1200px, height ~675px (16:9) ✅

**Jika masih terpotong:**
- Screenshot banner di storefront
- Screenshot hasil crop di settings
- Kirim untuk investigasi lebih lanjut

---

### **Test 2: Reset Data (Pending Service-Role Key)**

**Before Fix:**
- ❌ Reset gagal
- ❌ Data tidak terhapus
- ❌ Toast error atau data masih muncul

**After Add Service-Role Key:**
1. Buka **Dashboard** → **Pengaturan** → **Hapus Data**
2. Pilih scope:
   - **Restart Riwayat Lapak** (orders + analytics)
   - **Hapus Semua Data** (full reset)
3. Klik **"Preview"**
   - ✅ Harus show: "Order 4→0, Analytics 89→0"
   - ✅ Tidak ada error
4. Klik **"Preview & Hapus"**
   - ✅ Toast success dengan detail data yang dihapus
   - ✅ Data hilang dari tabel
5. **Refresh halaman** (F5)
   - ✅ Data tetap kosong (tidak muncul lagi)

**Jika masih gagal setelah add service-role key:**
1. Cek **Vercel Logs**: https://vercel.com/katalaras-projects/katalara-nextjs/logs
2. Filter by: `[Reset Orders]` atau `reset-data`
3. Screenshot error log
4. Cek apakah `serviceKey` ada dengan console.log:
   ```
   console.log('Service key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
   ```
5. Kirim hasil untuk investigasi

---

## 📊 CHANGES SUMMARY

| Fix | File | Change | Status |
|-----|------|--------|--------|
| **Banner Aspect Ratio** | `lapak/[slug]/page.tsx` L459 | `h-40 sm:h-52 lg:h-64` → `aspect-video` | ✅ DEPLOYED |
| **RLS Policies** | Supabase Database | Added INSERT/UPDATE/DELETE policies | ✅ APPLIED |
| **Service-Role Key** | Vercel Env Variables | Add `SUPABASE_SERVICE_ROLE_KEY` | ⏳ PENDING |

---

## ✅ SUCCESS CRITERIA

| Test | Criteria | Status |
|------|----------|--------|
| **Buat Lapak Baru** | Akun baru bisa buat lapak tanpa error | ✅ FIXED (via RLS) |
| **Banner Cropping** | Banner tampil sesuai hasil crop 16:9 | ✅ FIXED (deployed) |
| **Banner Responsive** | Aspect ratio maintained di semua device | ✅ FIXED (deployed) |
| **Reset Data** | Orders & analytics terhapus permanently | ⏳ PENDING (need service-role key) |

---

## 🚀 NEXT STEPS

### **1. Test Banner Carousel (Immediate)**
- Buka storefront Anda
- Verify banner tampil sesuai crop
- Test di mobile & desktop

### **2. Add Service-Role Key (5 menit)**
- Follow "Fix 2" instruksi di atas
- Ambil key dari Supabase Dashboard
- Tambah ke Vercel env variables
- Test reset data

### **3. Jika Ada Masalah**
- Screenshot error + console logs
- Check Vercel function logs
- Kirim untuk investigasi

---

## 💡 TECHNICAL NOTES

### **Why `aspect-video` Works:**

Tailwind CSS `aspect-video` class = `aspect-ratio: 16 / 9`:
```css
.aspect-video {
  aspect-ratio: 16 / 9;
}
```

Dengan class ini:
- Container width: 100% (parent width)
- Container height: **auto-calculated** to maintain 16:9
- Example: 
  - Width 375px (mobile) → Height 211px (375 ÷ 16 × 9)
  - Width 1200px (desktop) → Height 675px (1200 ÷ 16 × 9)

### **Why `object-cover` Still Used:**

`object-cover` masih diperlukan untuk:
- Fill container jika gambar aspect ratio tidak PERSIS 16:9
- Prevent distortion (stretching/squashing)
- Center gambar dalam container

Tapi sekarang container sudah 16:9, jadi `object-cover` hanya minor adjustment (bukan major crop seperti sebelumnya).

### **Why Service-Role Needed for Reset:**

RLS (Row Level Security) di Supabase:
- **Auth client**: Subject to RLS policies (user hanya bisa delete data sendiri)
- **Service-role client**: **Bypass RLS** (full admin access)

Reset data butuh delete orders/analytics milik user:
- Dengan auth client: RLS bisa block jika policy tidak allow DELETE
- Dengan service-role: Delete guaranteed success (bypass RLS)

---

**Deployment Info:**
- **Build Time**: 11.1s
- **Deploy Time**: 2m
- **Production URL**: https://katalara-nextjs-rck9j21no-katalaras-projects.vercel.app
- **Vercel Inspect**: https://vercel.com/katalaras-projects/katalara-nextjs/6KPBBknAdsnEsfZz2EbnoXUY8vtB

**Timestamp:** 23 Februari 2026, 23:55 WIB

---

**Status:** 
- ✅ Banner Carousel: **FIXED & DEPLOYED**
- ⏳ Reset Data: **PENDING SERVICE-ROLE KEY**

Silakan test banner carousel dan tambah service-role key! 🚀
