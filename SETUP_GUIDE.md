# 🚀 Katalara Next.js - Setup & Running Guide

## ✅ Status Migrasi

### Completed:
- ✅ Next.js 14 dengan TypeScript & Tailwind CSS
- ✅ Supabase integration (browser + server clients)
- ✅ Auth middleware untuk session management
- ✅ Complete TypeScript types (database + application)
- ✅ Custom hooks: `useProducts`, `useAuth`
- ✅ UI component library: Button, Input, Modal, Toast
- ✅ **Products Module (COMPLETE)**:
  - ProductsView (main container)
  - ProductTable (data table)
  - ProductModal (add/edit form)
  - StockAdjustModal (stock adjustment)
- ✅ Dashboard layout dengan navigation

### Build Status:
✅ **TypeScript compilation: SUCCESS**
⚠️ Runtime needs: Supabase credentials

---

## 📋 Quick Start

### 1. Setup Environment Variables

Edit file `.env.local` di root `katalara-nextjs/`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key-here

# App Configuration
NEXT_PUBLIC_APP_NAME=Katalara Platform
NEXT_PUBLIC_APP_VERSION=2.0.0
```

**Cara mendapatkan credentials:**
1. Buka [Supabase Dashboard](https://app.supabase.com)
2. Pilih project Anda
3. Sidebar → Settings → API
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Run Development Server

```bash
cd "c:\Users\user\Downloads\Platform\new\katalara-nextjs"
npm run dev
```

Server akan berjalan di: **http://localhost:3000**

### 3. Test Products Module

Buka browser ke:
- **Products page**: http://localhost:3000/dashboard/products

**Fitur yang bisa ditest:**
- ✅ Lihat list produk dari database
- ✅ Filter by category, search, status
- ✅ Tambah produk baru (auto-generate SKU)
- ✅ Edit produk existing
- ✅ Adjust stock (+ atau -)
- ✅ Delete produk (soft delete)
- ✅ Stock status badges (Healthy/Low/Critical/Out of Stock)

---

## 🏗️ Struktur Project

```
katalara-nextjs/
├── src/
│   ├── app/
│   │   ├── dashboard/
│   │   │   ├── layout.tsx          # Dashboard layout + nav
│   │   │   └── products/
│   │   │       └── page.tsx        # Products page route
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                     # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Toast.tsx
│   │   └── products/               # Products module
│   │       ├── ProductsView.tsx    # Main container
│   │       ├── ProductTable.tsx    # Data table
│   │       ├── ProductModal.tsx    # Add/Edit form
│   │       └── StockAdjustModal.tsx
│   ├── hooks/
│   │   ├── useProducts.ts          # Product CRUD operations
│   │   └── useAuth.ts              # Authentication
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts           # Browser client
│   │   │   ├── server.ts           # Server client
│   │   │   └── middleware.ts       # Session refresh
│   │   └── utils.ts                # cn() helper
│   ├── types/
│   │   ├── database.ts             # Supabase generated types
│   │   └── index.ts                # Application types
│   └── utils/
│       └── helpers.ts              # Format, validation utils
├── middleware.ts                   # Next.js middleware
├── .env.local                      # Environment variables
└── package.json
```

---

## 🔧 Available Commands

```bash
# Development
npm run dev          # Start dev server (http://localhost:3000)

# Production
npm run build        # Build for production
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint
```

---

## 🎯 Products Module Features

### 1. **ProductsView** (Main Container)
- Filters: Category, Search, Stock Status
- Low stock alert banner
- Add new product button
- Integrates ProductTable + Modals

### 2. **ProductTable** (Data Display)
- Shows: Name, SKU, Category, Stock, Buy/Sell Price, Margin
- Stock status badges dengan warna:
  - 🟢 Healthy (green)
  - 🟡 Low (yellow)
  - 🔴 Critical (red)
  - ⚫ Out of Stock (gray)
- Actions: Edit, Adjust Stock, Delete
- Loading & empty states

### 3. **ProductModal** (Add/Edit Form)
- Fields:
  - Nama Produk (required)
  - SKU (auto-generate if empty)
  - Kategori
  - Harga Beli & Jual (required)
  - Stok Awal & Satuan
  - Min. Stock Alert
  - Track Inventory toggle
- Form validation
- Auto-generate SKU from name + category

### 4. **StockAdjustModal** (Manual Adjustment)
- Shows current stock
- Input: quantity change (+/- numbers)
- Notes field (optional)
- Calls RPC function `adjust_stock`
- Updates stock_movements table

---

## 🗄️ Database Requirements

Products module memerlukan:

1. **products** table (sudah ada)
2. **stock_movements** table (sudah ada)
3. **adjust_stock** RPC function (dari `sql/08_inventory_tracking.sql`)

Pastikan SQL migration sudah dijalankan:
```sql
-- File: supabase-migration/sql/08_inventory_tracking.sql
-- Berisi: stock_movements table + adjust_stock function
```

---

## 🚀 Next Steps

### Immediate:
1. ✅ Test Products module end-to-end
2. ⏳ Create Dashboard home page (KPI overview)
3. ⏳ Migrate Sales module
4. ⏳ Migrate Expenses module

### Week 1-2 Roadmap:
- [x] Setup Next.js infrastructure
- [x] Create component library
- [x] Migrate Products module ← **YOU ARE HERE**
- [ ] Create auth pages (login/register)
- [ ] Dashboard home with KPIs
- [ ] Sales transaction module

### Week 3-4:
- [ ] Complete Expenses module
- [ ] Reports & analytics
- [ ] Export functionality (CSV/PDF)

### Week 5+:
- [ ] Polish UI/UX
- [ ] Testing
- [ ] Deploy to Vercel
- [ ] Phase 2: BOM System

---

## 🐛 Troubleshooting

### Error: "Invalid supabaseUrl"
**Solution:** Update `.env.local` dengan Supabase credentials yang benar

### Error: "Cannot find module..."
**Solution:** 
```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript errors
**Solution:**
```bash
npm run build  # Check for compilation errors
```

### Supabase RLS errors
**Solution:** Pastikan user sudah login dan RLS policies sudah di-setup:
- `sql/02_rls_policies.sql` - Main RLS policies
- `sql/04_rls_policies_reference_tables.sql` - Reference table policies

---

## 📞 Support

Jika ada error atau pertanyaan:
1. Check browser console untuk error messages
2. Check terminal untuk server errors
3. Verify `.env.local` credentials
4. Verify database schema sudah lengkap

---

**Status Update:** TypeScript compilation ✅ SUCCESS. Products module siap untuk testing!
