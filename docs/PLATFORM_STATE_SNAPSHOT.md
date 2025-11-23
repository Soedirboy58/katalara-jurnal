# PLATFORM STATE SNAPSHOT - November 22, 2025

## 🚀 DEPLOYMENT INFORMATION

### Production URLs
- **Main Production**: https://supabase-migration-awwgnyn3b-katalaras-projects.vercel.app
- **Vercel Project**: katalaras-projects/supabase-migration
- **Latest Deploy**: November 22, 2025 (Major Update: Input Pendapatan)
- **Build ID**: FiLpfTS74vKghaFPHnquSTaBYwkn
- **Deploy Command**: `vercel --prod` (from katalara-nextjs directory)

### Tech Stack
- **Frontend**: Next.js 16.0.3 (App Router + Turbopack)
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Deployment**: Vercel
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, Lucide Icons

### Database & Storage
- **Supabase Project**: usradkbchlkcfoabxvbo.supabase.co
- **Storage Bucket**: `lapak-images` (public access for product images)
- **Auth**: Supabase Authentication with email/password
- **RLS**: Row Level Security enabled on all tables

---

## 🎯 PLATFORM OVERVIEW

**Katalara** adalah platform manajemen bisnis UMKM Indonesia yang menggabungkan:
1. **Dashboard Analytics** - KPI tracking, health score, visualisasi data
2. **Lapak Online** - Storefront builder untuk jualan online
3. **Inventory Management** - Kelola produk dan stok
4. **Financial Tracking** - Input penjualan dan pengeluaran
5. **Customer Management** - Database pelanggan
6. **Business Intelligence** - Insights otomatis berbasis data

### Target User
- UMKM (Usaha Mikro Kecil Menengah) Indonesia
- Pemilik toko/warung yang ingin digitalisasi bisnis
- Pedagang yang butuh lapak online sederhana
- Pengusaha yang perlu tracking keuangan dan inventory

---

## 📁 PROJECT STRUCTURE

```markdown
- **app/**: Next.js App Router
  - **/dashboard/**: Dashboard analytics
  - **/storefront/**: Storefront builder
  - **/inventory/**: Inventory management
  - **/finance/**: Financial tracking
  - **/customers/**: Customer management
  - **/intelligence/**: Business intelligence
- **lib/**: Shared utilities
  - **/supabase/**: Supabase client
  - **/auth/**: Authentication utilities
- **public/**: Static assets
  - **/images/**: Product images
  - **/styles/**: CSS files
- **src/**: Source code
  - **/components/**: Reusable components
  - **/pages/**: Page components
  - **/utils/**: Utility functions
- **.env**: Environment variables
```

---

## 📝 DOCUMENTATION

- **Platform Overview**: [Katalara Platform Overview](https://katalara.com)
- **Getting Started**: [Getting Started with Katalara](https://katalara.com/getting-started)
- **API Documentation**: [Katalara API Documentation](https://katalara.com/api)
- **Support**: [Katalara Support](https://katalara.com/support)

---

## 📞 CONTACT

- **Email**: support@katalara.com
- **Phone**: +62 812 345 6789
- **Address**: Jl. Katalara, Jakarta, Indonesia
