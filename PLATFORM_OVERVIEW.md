# KATALARA PLATFORM - Dokumen Perencanaan & Fitur

## 🎯 Visi & Misi

### Visi
Menjadi platform digital terdepan yang memberdayakan UMKM Indonesia untuk tumbuh dan berkembang melalui digitalisasi bisnis yang mudah dan terjangkau.

### Misi
1. Mempermudah UMKM dalam mengelola operasional bisnis secara digital
2. Memberikan insight dan data analytics untuk pengambilan keputusan bisnis
3. Memfasilitasi inkubasi dan pendampingan UMKM berkelanjutan
4. Menyediakan platform yang user-friendly untuk pengguna dengan literasi digital terbatas

---

## 💡 Latar Belakang

### Permasalahan UMKM di Indonesia
1. **Pencatatan Manual**: 70% UMKM masih mencatat transaksi secara manual
2. **Kesulitan Analisis**: Tidak ada data terstruktur untuk evaluasi bisnis
3. **Gap Digitalisasi**: Rendahnya literasi digital pada pelaku UMKM
4. **Kurangnya Pendampingan**: Minimnya akses ke program inkubasi/mentoring
5. **Data Fragmentasi**: Tidak ada database terpusat untuk pemetaan UMKM

### Solusi yang Ditawarkan
**KATALARA** - Platform Asisten UMKM yang menyediakan:
- Sistem manajemen bisnis terintegrasi
- Dashboard analytics real-time
- Proses onboarding yang mudah dan intuitif
- Database terstruktur untuk pemetaan dan pendampingan UMKM

---

## 🚀 Fitur Utama Platform

### 1. Authentication & Onboarding
**Tujuan**: Proses pendaftaran yang mudah dengan user experience optimal untuk pengguna awam digital

**Fitur**:
- ✅ Landing page informatif dengan branding profesional
- ✅ Registrasi 2 langkah (Email/Password → Data Bisnis)
- ✅ Verifikasi email otomatis dengan redirect ke login
- ✅ Login dengan role-based access (super_admin vs user)
- ✅ Forgot password & reset password flow
- ✅ Modal notifikasi profesional dan user-friendly

**Alur User Journey**:
```
Landing → Daftar → Verifikasi Email → Login → Lengkapi Data Bisnis → Dashboard
```

**UX Considerations**:
- Modal notifikasi yang jelas dan estetik (bukan alert())
- Background branding konsisten di semua halaman auth
- Pesan instruksi yang mudah dipahami
- Progress indicator untuk multi-step form

---

### 2. Data Collection & Profiling
**Tujuan**: Mengumpulkan data UMKM yang terstruktur untuk analisis dan pendampingan

**Data yang Dikumpulkan**:

#### A. Data Pribadi
- Nama lengkap
- Nomor telepon
- Email

#### B. Data Lokasi (Segmentasi Geografis)
- Alamat lengkap
- Kecamatan
- Kabupaten/Kota
- Provinsi

**Manfaat**:
- Pemetaan persebaran UMKM per wilayah
- Analisis cluster bisnis regional
- Targeting program pendampingan berbasis lokasi

#### C. Data Bisnis (Klasifikasi & Profiling)
- **Nama Bisnis**: Identitas usaha
- **Kategori Bisnis**: Makanan & Minuman, Fashion, Jasa, dll (10 kategori)
- **Bentuk Usaha**: Perorangan, CV, PT, Koperasi, Lainnya
- **Tahun Mulai Bisnis**: Untuk menghitung usia bisnis
- **Jumlah Karyawan**: 1-5, 6-20, 21-50, 51-100, 100+

**Manfaat**:
- Klasifikasi UMKM (mikro/kecil/menengah)
- Analisis pertumbuhan bisnis berdasarkan usia
- Segmentasi program berdasarkan skala bisnis
- Laporan statistik untuk stakeholder

---

### 3. Dashboard & Analytics (Planned)
**Tujuan**: Memberikan insight bisnis yang actionable

**Fitur yang Direncanakan**:
- 📊 Real-time dashboard dengan KPI utama
- 📈 Grafik penjualan & trend
- 💰 Analisis profit & loss
- 📦 Manajemen inventori
- 👥 Manajemen pelanggan
- 📑 Laporan keuangan otomatis

---

### 4. Inventory Management (Existing - akan diintegrasikan)
**Tujuan**: Kelola stok produk dengan mudah

**Fitur**:
- ✅ CRUD produk (Create, Read, Update, Delete)
- ✅ Kategori produk
- ✅ Tracking stok
- ✅ Harga jual & modal
- ✅ Search & filter produk

---

### 5. Sales Transaction (Planned)
**Tujuan**: Pencatatan transaksi penjualan yang cepat dan akurat

**Fitur yang Direncanakan**:
- POS (Point of Sale) interface
- Pencatatan transaksi multi-item
- Print receipt
- Riwayat transaksi
- Laporan penjualan harian/bulanan

---

### 6. Expense Management (Planned)
**Tujuan**: Monitoring pengeluaran bisnis

**Fitur yang Direncanakan**:
- Pencatatan biaya operasional
- Kategorisasi expense
- Recurring expenses
- Analisis cost vs revenue

---

### 7. Super Admin Dashboard (Planned)
**Tujuan**: Monitoring dan pendampingan UMKM oleh admin/mentor

**Fitur yang Direncanakan**:
- 👥 User management (approve/reject registrasi)
- 📍 Peta persebaran UMKM (GIS)
- 📊 Statistik agregat (jumlah UMKM per wilayah, kategori, dll)
- 📈 Dashboard pertumbuhan UMKM
- 💬 Messaging/notification ke user
- 📝 Program inkubasi management

**Analytics Dashboard**:
- Total UMKM terdaftar
- Breakdown per provinsi/kabupaten
- Breakdown per kategori bisnis
- Breakdown per skala bisnis (berdasarkan karyawan)
- Growth chart (UMKM baru per bulan)
- Aktifitas user (login, transaksi, dll)

---

## 🎨 Design System & Branding

### Brand Identity
- **Primary Color**: Dodger Blue (#1088ff)
- **Secondary Color**: Ripe Lemon (#fdc800)
- **Neutral**: Garden Seat (#eae4ca)
- **Typography**: Modern, clean, easy-to-read

### UX Principles
1. **Simplicity**: Desain minimal dan fokus pada fungsi
2. **Clarity**: Instruksi jelas untuk user dengan literasi digital rendah
3. **Feedback**: Modal dan notifikasi yang informatif
4. **Consistency**: Branding konsisten di seluruh platform
5. **Accessibility**: Mudah diakses dari berbagai device

---

## 📊 Data Strategy

### Tujuan Pengumpulan Data
1. **Pemetaan UMKM**: Memahami persebaran geografis dan sektor bisnis
2. **Profiling**: Klasifikasi UMKM untuk program yang tepat sasaran
3. **Monitoring**: Tracking perkembangan dan kesehatan bisnis
4. **Policy Making**: Data untuk pembuatan kebijakan pendukung UMKM
5. **Inkubasi**: Identifikasi UMKM yang membutuhkan pendampingan

### Data Points Kunci
- **Geografis**: Provinsi → Kabupaten → Kecamatan
- **Sektor**: 10 kategori bisnis utama
- **Skala**: Berdasarkan jumlah karyawan
- **Usia**: Tahun mulai bisnis
- **Legal**: Bentuk usaha (Perorangan/CV/PT/Koperasi)

### Use Cases Data
1. **Dashboard Admin**: "Berapa UMKM kategori F&B di Jawa Barat?"
2. **Program Targeting**: "UMKM baru (< 2 tahun) di Surabaya untuk program mentoring"
3. **Statistik**: "Pertumbuhan UMKM fashion tahun 2024-2025"
4. **Mapping**: "Visualisasi cluster UMKM di Indonesia"

---

## 🔐 Security & Privacy

### Data Protection
- ✅ Authentication dengan Supabase Auth
- ✅ Row Level Security (RLS) policies
- ✅ Encrypted password
- ✅ Email verification
- ✅ Session management

### User Roles & Permissions
- **User**: Akses ke data bisnis sendiri saja
- **Super Admin**: Akses ke semua data + user management

---

## 🛣️ Roadmap

### Phase 1: Foundation (✅ COMPLETED)
- ✅ Landing page & branding
- ✅ Authentication flow (register, login, email verification)
- ✅ Forgot/reset password
- ✅ Data collection form (business info dengan data lengkap)
- ✅ Database schema dengan RLS
- ✅ Deployment to Vercel

### Phase 2: Core Features (🚧 IN PROGRESS)
- 🔄 Dashboard layout dengan sidebar navigation
- 🔄 Integration produk management (existing feature)
- 📝 Sales transaction module
- 📝 Expense management module
- 📝 Basic analytics & reporting

### Phase 3: Advanced Features (📋 PLANNED)
- Super admin dashboard
- User management & approval workflow
- GIS mapping untuk persebaran UMKM
- Advanced analytics & insights
- Export reports (PDF/Excel)
- Notification system

### Phase 4: Growth & Scale (🔮 FUTURE)
- Mobile app (React Native)
- Marketplace integration
- Payment gateway
- Multi-language support
- API for third-party integration
- Machine learning untuk business recommendations

---

## 🎯 Target User

### Primary User
- **Pelaku UMKM**: Pemilik usaha kecil dan menengah
- **Karakteristik**: 
  - Usia 25-50 tahun
  - Literasi digital rendah-menengah
  - Butuh solusi pencatatan bisnis yang simple
  - Akses smartphone/laptop

### Secondary User
- **Admin/Mentor**: Pendamping UMKM
- **Pemerintah**: Untuk policy making
- **Stakeholder**: Lembaga pendukung UMKM

---

## 📈 Success Metrics

### KPI Platform
1. **User Adoption**: Jumlah UMKM terdaftar
2. **Active Users**: Monthly Active Users (MAU)
3. **Data Quality**: % profil lengkap
4. **Geographic Coverage**: Jumlah provinsi/kabupaten terwakili
5. **User Retention**: % user yang aktif setelah 3 bulan

### Business Impact (Long-term)
1. UMKM yang meningkat omzetnya
2. UMKM yang mendapat pendampingan
3. Data untuk policy making pemerintah
4. Jumlah program inkubasi yang terfasilitasi

---

## 🤝 Stakeholder

### Internal
- Development Team
- Product Manager
- UX/UI Designer

### External
- Pelaku UMKM (end user)
- Dinas UMKM & Koperasi
- Lembaga inkubasi bisnis
- Investor/funding institutions
- Academic researchers

---

## 📝 Conclusion

**KATALARA** adalah platform yang dirancang untuk:
1. ✅ **Empowering**: Memberdayakan UMKM dengan tools digital yang mudah
2. ✅ **Data-Driven**: Mengumpulkan data terstruktur untuk analisis dan pendampingan
3. ✅ **User-Centric**: Fokus pada UX yang mudah untuk pengguna awam digital
4. ✅ **Scalable**: Arsitektur yang siap untuk growth jangka panjang

Platform ini bukan hanya tools manajemen bisnis, tapi juga **ekosistem data** yang dapat mendukung:
- Program inkubasi UMKM
- Policy making berbasis data
- Research & development
- Kolaborasi antar stakeholder

---

**Last Updated**: November 19, 2025  
**Version**: 1.0  
**Status**: Phase 1 Completed, Phase 2 In Progress
