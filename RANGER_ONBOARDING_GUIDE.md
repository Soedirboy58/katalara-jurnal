# 🎯 RANGER ONBOARDING IMPLEMENTATION

**Status:** ✅ Complete & Ready for Testing  
**Date:** December 2, 2025  
**Version:** 1.0

---

## 📋 OVERVIEW

Sistem onboarding untuk **Katalara Rangers** (mahasiswa/freelancer) yang ingin bergabung sebagai digital concierge untuk UMKM. Form multi-step yang user-friendly dengan auto-approval.

---

## 🎨 USER FLOW

```
┌─────────────────┐
│ Register Role   │ User pilih "Daftar sebagai Ranger"
│ Selection Page  │
└────────┬────────┘
         │
         v
┌─────────────────┐
│ Register Page   │ Input email & password
│ (/register)     │ Role: Ranger (purple badge)
└────────┬────────┘
         │
         v
┌─────────────────┐
│ Email           │ User cek email untuk verifikasi
│ Verification    │
└────────┬────────┘
         │
         v
┌─────────────────┐
│ Login Page      │ Login dengan email/password
│                 │
└────────┬────────┘
         │
         v (auto-detect: role = ranger, no ranger_profile)
         │
┌─────────────────┐
│ Ranger          │ 6-step onboarding form
│ Onboarding      │ (/register/ranger-info)
│ Multi-Step Form │
└────────┬────────┘
         │
         v
┌─────────────────┐
│ Rangers         │ Dashboard untuk cari job
│ Dashboard       │ (/dashboard/rangers)
└─────────────────┘
```

---

## 🧩 FORM STRUCTURE

### **Step 1: Data Diri** 👤
**Fields (Semua Wajib kecuali Gender):**
- ✅ Nama Lengkap (sesuai KTP/KTM)
- ✅ Email (auto-fill dari auth, disabled)
- ✅ Nomor WhatsApp (08xxxxxxxxxx)
- ✅ Tanggal Lahir (date picker)
- ⭕ Jenis Kelamin (radio: Laki-laki/Perempuan, opsional)

**Validation:**
- Nama tidak boleh kosong
- Phone wajib diisi
- Tanggal lahir wajib (untuk pastikan 17+ tahun)

---

### **Step 2: Alamat** 📍
**Fields:**
- ✅ Provinsi (dropdown)
- ✅ Kabupaten/Kota (dropdown, dependent on Provinsi)
- ✅ Kecamatan (dropdown, dependent on Kabupaten)
- ✅ Alamat Lengkap (textarea, Jalan/RT/RW)
- ⭕ Kode Pos (opsional)

**Auto-populate Logic:**
- Pilih Provinsi → Load Kabupaten
- Pilih Kabupaten → Load Kecamatan
- Sama dengan sistem wilayah-indonesia di business-info

**Validation:**
- Provinsi, Kabupaten, Kecamatan wajib dipilih
- Alamat lengkap tidak boleh kosong

---

### **Step 3: Status Pendidikan** 🎓
**Status Selection (Radio):**
1. **Mahasiswa Aktif** - Wajib isi data kampus
2. **Fresh Graduate** - Wajib isi data kampus (NIM opsional)
3. **Freelancer Umum** - Skip data kampus

**Fields (Conditional - jika pilih Mahasiswa/Fresh Grad):**
- ✅ Nama Universitas (dropdown list + "Lainnya")
- ⭕ Jurusan/Program Studi
- ⭕ NIM/NPM (wajib untuk Mahasiswa, opsional untuk Fresh Grad)
- ⭕ Tahun Lulus/Angkatan
- ⭕ Upload KTM/Kartu Mahasiswa (image, max 2MB)

**University List:** (20+ kampus populer + "Lainnya")
- UI, ITB, UGM, IPB, Unair, Undip, UB, Unpad, ITS, Unhas
- Telkom University, Binus, UMN, Trisakti, dll

**Validation:**
- Status wajib dipilih
- Jika Mahasiswa/Fresh Grad → Universitas wajib diisi

---

### **Step 4: Keahlian Digital** ⚡
**Skills Selection (Checkbox - Multiple):**
- 📸 Foto Produk (pakai HP)
- ⌨️ Input Data Produk
- 🎨 Desain Grafis Simple
- ✍️ Tulis Deskripsi Produk
- 📱 Posting Social Media
- 🚀 Optimasi Toko Online
- ➕ Lainnya (tulis manual)

**Experience Level (Radio):**
1. **Belum pernah** - Siap belajar!
2. **Pernah 1-5 kali** - Punya pengalaman dasar
3. **Sering (>5 kali)** - Sudah terbiasa
4. **Profesional** - Expert di bidang ini

**Validation:**
- Minimal 1 skill harus dipilih
- Jika pilih "Lainnya" → wajib isi text field
- Experience level wajib dipilih

**Note:** Rating keahlian tidak diinput manual, tapi **dievaluasi dari hasil pekerjaan** (review dari UMKM).

---

### **Step 5: Portofolio** 💼
**Semua Fields OPSIONAL:**
- ⭕ Username Instagram (@username)
- ⭕ Link Portfolio/Behance (URL)
- ⭕ Upload Hasil Karya (max 5 foto, 2MB each)

**Info Banner:**
> "Bisa diisi nanti. Portofolio baru akan ter-record otomatis dari setiap job yang selesai."

**Validation:** None (semua opsional)

---

### **Step 6: Data Bank** 💳
**Fields (Semua Wajib):**
- ✅ Nama Bank (dropdown: BCA, Mandiri, BRI, BNI, Gopay, OVO, DANA, dll)
- ✅ Nomor Rekening (atau nomor HP untuk e-wallet)
- ✅ Nama Pemilik Rekening (sesuai buku tabungan)

**Warning Banner:**
> ⚠️ **Penting:** Pastikan data bank sesuai dengan nama Anda. Transfer hanya bisa ke rekening atas nama pribadi.

**Tip Banner:**
> 💡 **Tips:** Untuk e-wallet (Gopay, OVO, DANA), masukkan nomor HP yang terdaftar sebagai nomor rekening.

**Validation:**
- Bank wajib dipilih
- Nomor rekening tidak boleh kosong
- Nama pemilik rekening tidak boleh kosong

**Alasan Wajib di Awal:**
- Rangers langsung bisa terima pembayaran setelah job pertama
- Menghindari delay pembayaran
- Validasi identitas (nama bank vs nama profile)

---

## 🎯 DESIGN DECISIONS

### ✅ **Auto-Approval**
- **Langsung approved** setelah submit form
- Tidak perlu review admin
- `is_verified = true`, `verification_status = 'approved'`
- **Evaluasi berbasis rating** dari hasil pekerjaan

**Reasoning:**
- Barrier to entry rendah
- Kurasi natural via review system
- Rangers bad performers akan ter-filter via rating

### ✅ **Freelancer Umum Allowed**
- Tidak harus mahasiswa
- Target lebih luas: gap year students, ibu rumah tangga, part-timers
- Flexibilitas untuk semua kalangan

### ✅ **Skills: Checkbox (bukan Rating)**
- User pilih skill yang bisa dikerjakan
- **No self-assessment rating**
- Rating didapat dari review UMKM setelah job selesai
- Lebih objektif & reliable

### ✅ **Portofolio Opsional**
- Bisa diisi nanti
- Auto-record dari setiap job (`ranger_portfolio` table)
- Tidak menjadi barrier untuk pemula

### ✅ **Bank Required Upfront**
- Siap terima payment langsung setelah job pertama
- Menghindari friction saat pembayaran
- Validasi identitas via nama rekening

---

## 🗂️ FILES CREATED/MODIFIED

### **New Files:**
1. **src/types/ranger-onboarding.ts** (200 lines)
   - Complete TypeScript definitions
   - `RangerOnboardingFormData` interface
   - Skill, Experience, Bank, University options
   - Form step configurations

2. **src/app/register/ranger-info/page.tsx** (700+ lines)
   - Multi-step form component (6 steps)
   - Location auto-populate (provinsi → kabupaten → kecamatan)
   - File upload dengan preview (KTM, portfolio)
   - Comprehensive validation per step
   - Supabase storage integration
   - Auto-insert to `ranger_profiles` table
   - Role update in `user_profiles`

3. **sql/06_rangers_storage_buckets.sql** (120 lines)
   - Create storage buckets: `ranger-documents`, `ranger-portfolio`
   - RLS policies untuk upload/view/delete
   - File size limits (2MB)
   - Allowed MIME types
   - Policy: Rangers can insert own profile

### **Modified Files:**
1. **src/app/register/page.tsx**
   - Dynamic progress label (Data Bisnis vs Data Ranger)
   - Dynamic button text based on role

2. **src/app/login/page.tsx**
   - Check `ranger_profiles` table after login
   - Redirect to `/register/ranger-info` if profile not complete
   - Rangers → `/dashboard/rangers`
   - UMKM → `/dashboard` (default)

---

## 🗄️ DATABASE SCHEMA

### **Table: `ranger_profiles`**
Already created in `05_rangers_ecosystem.sql`. Key fields:

```sql
-- Personal Info
full_name VARCHAR(255) NOT NULL
phone VARCHAR(20) NOT NULL
email VARCHAR(255)
date_of_birth DATE
gender VARCHAR(20) -- 'male', 'female', 'other'

-- Location
province VARCHAR(100)
city VARCHAR(100)
district VARCHAR(100)
address TEXT
latitude DECIMAL(10, 8)
longitude DECIMAL(11, 8)

-- Professional
university VARCHAR(255) -- Nullable for freelancer
major VARCHAR(255)
student_id VARCHAR(50) -- NIM
graduation_year INTEGER

-- Skills
skills TEXT[] -- Array: ['product_photography', 'data_entry', ...]
portfolio_url TEXT
instagram_handle VARCHAR(100)

-- Verification
is_verified BOOLEAN DEFAULT false
verification_status VARCHAR(50) DEFAULT 'pending'
id_card_url TEXT -- KTM/KTP upload URL

-- Banking
bank_name VARCHAR(100)
bank_account_number VARCHAR(50)
bank_account_name VARCHAR(255)

-- Metrics (auto-updated)
total_jobs_completed INTEGER DEFAULT 0
total_earnings DECIMAL(15, 2) DEFAULT 0
average_rating DECIMAL(3, 2) DEFAULT 0
total_reviews INTEGER DEFAULT 0
```

---

## 🔒 SECURITY & VALIDATION

### **Frontend Validation:**
✅ Required field checks per step  
✅ Email format validation (auto from Input component)  
✅ Phone number format (08xxx)  
✅ File size limits (2MB)  
✅ File type validation (JPEG, PNG, PDF)  
✅ Conditional validation (status-based)

### **Backend Security:**
✅ **RLS Policies:**
- Rangers can only insert/update own profile
- Rangers can only upload to own folder in storage
- Anyone can view public portfolio
- Admins can view all documents

✅ **Storage Policies:**
- File size limit: 2MB per file
- MIME type whitelist
- User-based folder structure (`{user_id}_*.jpg`)

✅ **Auto-Approval Safety:**
- Initial `average_rating = 0` (not verified via jobs)
- Will be updated after first review
- Low-rated Rangers will naturally filter out

---

## 🚀 TESTING CHECKLIST

### **Registration Flow:**
- [ ] Click "Daftar sebagai Ranger" di landing page
- [ ] Register dengan email/password
- [ ] Verify email via link
- [ ] Login dengan credentials
- [ ] Auto-redirect ke `/register/ranger-info`

### **Form Step 1 (Data Diri):**
- [ ] Nama lengkap required
- [ ] Email auto-filled & disabled
- [ ] Phone required, format validation
- [ ] Date of birth required
- [ ] Gender optional (radio buttons work)
- [ ] Next button enabled when valid

### **Form Step 2 (Alamat):**
- [ ] Provinsi dropdown loads correctly
- [ ] Kabupaten auto-loads after provinsi selection
- [ ] Kecamatan auto-loads after kabupaten selection
- [ ] Reset kabupaten/kecamatan when provinsi changes
- [ ] Address textarea required
- [ ] Postal code optional

### **Form Step 3 (Pendidikan):**
- [ ] 3 status options (Mahasiswa, Fresh Grad, Freelancer)
- [ ] Conditional fields show/hide based on status
- [ ] University dropdown loads (20+ options)
- [ ] "Lainnya" option shows text input
- [ ] KTM upload works (max 2MB)
- [ ] Image preview displays after upload
- [ ] Freelancer can skip all education fields

### **Form Step 4 (Keahlian):**
- [ ] Multiple checkboxes selectable
- [ ] "Lainnya" shows text input when checked
- [ ] Minimum 1 skill validation
- [ ] Experience level radio works
- [ ] All 4 experience options display

### **Form Step 5 (Portofolio):**
- [ ] All fields optional (can skip)
- [ ] Instagram handle accepts @username
- [ ] Portfolio URL accepts https://
- [ ] Multiple file upload (max 5)
- [ ] Preview shows all uploaded images
- [ ] File size validation (2MB each)

### **Form Step 6 (Bank):**
- [ ] Bank dropdown loads (15+ options)
- [ ] Account number required
- [ ] Account name required
- [ ] Warning banner displays
- [ ] Tip banner for e-wallet displays

### **Submission:**
- [ ] Loading state shows during submit
- [ ] KTM uploads to `ranger-documents` bucket
- [ ] Portfolio uploads to `ranger-portfolio` bucket
- [ ] Data inserts to `ranger_profiles` table
- [ ] `user_profiles.role` updates to 'ranger'
- [ ] Auto-redirect to `/dashboard/rangers`

### **Error Handling:**
- [ ] Network error shows proper message
- [ ] Duplicate email handled
- [ ] File upload failure handled gracefully
- [ ] Form preserves data on error

---

## 📊 SUCCESS METRICS

**Onboarding Completion Rate:**
- Target: >80% complete all 6 steps
- Track: Dropoff per step

**Time to Complete:**
- Target: <10 minutes average
- Optimal: 5-7 minutes

**Profile Quality:**
- % with portfolio uploaded: >30%
- % with university data: >60%
- % with 3+ skills selected: >70%

---

## 🔄 NEXT STEPS (Post-MVP)

### **Phase 1: Enhancements**
1. **Address Auto-Complete:**
   - Google Maps API integration
   - Auto-detect lat/lng from address

2. **Portfolio Builder:**
   - Drag-drop portfolio uploader
   - Before/after image pairing
   - Portfolio item descriptions

3. **Skill Testing:**
   - Optional skill quiz
   - Badge system for verified skills
   - Showcase on profile

### **Phase 2: Advanced Features**
1. **Video Introduction:**
   - Optional 30-second video upload
   - Helps UMKM trust Rangers

2. **References:**
   - Optional contact references
   - Previous client testimonials

3. **Training Module:**
   - Onboarding tutorial videos
   - "How to be a great Ranger" guide
   - Certification program

### **Phase 3: Gamification**
1. **Onboarding Badges:**
   - "Profile Complete" badge
   - "Portfolio Star" badge
   - "Fast Responder" badge

2. **Leaderboard:**
   - Top-rated Rangers
   - Most jobs completed
   - Fastest response time

---

## 🐛 KNOWN LIMITATIONS

1. **No Email Verification for Rangers (yet):**
   - Currently relies on Supabase auth email verification
   - Could add phone SMS verification later

2. **No Admin Review:**
   - Auto-approved immediately
   - Could add manual review for suspicious profiles

3. **No Duplicate Detection:**
   - Same person could register multiple accounts
   - Could add phone number uniqueness check

4. **No Background Check:**
   - Relying on review system for quality control
   - Could integrate KTP verification API later

---

## 💡 DESIGN RATIONALE

### **Why Multi-Step Form?**
- **Cognitive Load:** Breaking into 6 steps reduces overwhelm
- **Progress Indication:** Users see clear advancement (motivating)
- **Conditional Logic:** Easy to show/hide based on previous answers
- **Mobile-Friendly:** One section at a time, better UX on small screens

### **Why Auto-Approval?**
- **Low Barrier:** Encourages more sign-ups
- **Faster Time-to-Value:** Rangers can start earning immediately
- **Natural Selection:** Bad performers filtered by ratings
- **Scalability:** No manual admin work required

### **Why Bank Info Upfront?**
- **Payment Friction:** Avoid delays when first job completes
- **Identity Validation:** Nama rekening must match nama profile
- **Trust Signal:** Shows Rangers are serious about earning

---

## 🎓 KEY LEARNINGS

1. **Conditional Forms Are Complex:**
   - React state management for multi-step forms needs careful planning
   - Validation must be step-aware

2. **Location Data is Messy:**
   - Reused `wilayah-indonesia` lib (consistency with UMKM flow)
   - Dependent dropdowns need proper state reset

3. **File Uploads Need Preview:**
   - Users need visual confirmation before submit
   - FileReader API for instant preview

4. **Progressive Disclosure Works:**
   - Showing fields only when relevant reduces cognitive load
   - Status-based conditional rendering is intuitive

---

## ✅ COMPLETION STATUS

**Development:** ✅ 100% Complete  
**Testing:** ⏳ Pending (requires user testing)  
**Documentation:** ✅ Complete  
**SQL Migration:** ✅ Ready (`06_rangers_storage_buckets.sql`)  
**Deployment:** ⏳ Pending (requires Supabase setup)

---

## 🚦 DEPLOYMENT STEPS

### **1. Run SQL Migrations:**
```sql
-- In Supabase SQL Editor:
-- 1. Ensure 05_rangers_ecosystem.sql has been run
-- 2. Run 06_rangers_storage_buckets.sql
```

### **2. Create Storage Buckets (Manual in Supabase Dashboard):**
- Go to Storage → Create Bucket
- Name: `ranger-documents` (Public: Yes, File size limit: 2MB)
- Name: `ranger-portfolio` (Public: Yes, File size limit: 2MB)
- Apply policies from SQL file

### **3. Test Registration Flow:**
```
1. Navigate to http://localhost:3000/register-role
2. Click "Daftar sebagai Ranger"
3. Complete registration
4. Verify email
5. Login
6. Complete onboarding form (all 6 steps)
7. Verify redirect to /dashboard/rangers
```

### **4. Verify Database:**
```sql
-- Check if ranger profile created:
SELECT * FROM ranger_profiles WHERE user_id = '{new_user_id}';

-- Check if role updated:
SELECT role FROM user_profiles WHERE user_id = '{new_user_id}';

-- Check storage uploads:
SELECT * FROM storage.objects 
WHERE bucket_id IN ('ranger-documents', 'ranger-portfolio');
```

---

## 📞 SUPPORT

**Questions?** Check:
1. `RANGERS_ROADMAP.md` - Full business logic
2. `DUAL_ROLE_AUTH_GUIDE.md` - Authentication flow
3. `src/types/ranger-onboarding.ts` - Type definitions

**Issues?**
- TypeScript errors → Check import paths
- Upload errors → Verify bucket policies
- Redirect errors → Check login.tsx logic

---

**Last Updated:** December 2, 2025  
**Next Review:** After user testing phase
