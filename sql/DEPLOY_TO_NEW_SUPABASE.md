# 🚀 DEPLOY DATABASE SCHEMA TO NEW SUPABASE

**Target Supabase**: `https://zhuxonyuksnhplxinikl.supabase.co`  
**Date**: 2024-11-26  
**Status**: Fresh database (empty)

---

## 📋 Deployment Order

Deploy SQL files **dalam urutan ini** via Supabase SQL Editor:

### **Phase 1: CORE Domain** (Foundation)

```sql
-- 1. Business Profiles Table
-- File: sql/domain/core/business_profiles.schema.sql
-- Copy & paste entire file to SQL Editor, then run

-- 2. Business Profiles Logic
-- File: sql/domain/core/business_profiles.logic.sql

-- 3. Business Profiles Policies (RLS)
-- File: sql/domain/core/business_profiles.policies.sql

-- 4. Business Profiles Indexes
-- File: sql/domain/core/business_profiles.index.sql

-- 5. Onboarding Steps
-- File: sql/domain/core/onboarding_steps.schema.sql

-- 6. Onboarding Logic
-- File: sql/domain/core/onboarding_steps.logic.sql

-- 7. Onboarding Policies
-- File: sql/domain/core/onboarding_steps.policies.sql

-- 8. Onboarding Indexes
-- File: sql/domain/core/onboarding_steps.index.sql
```

**Verification CORE**:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('business_profiles', 'onboarding_steps')
ORDER BY table_name;

-- Expected: 2 tables
```

---

### **Phase 2: INVENTORY Domain** (Products)

```sql
-- 1. Products Table
-- File: sql/domain/inventory/products.schema.sql

-- 2. Product Stock Movements Table
-- File: sql/domain/inventory/product_stock_movements.schema.sql

-- 3. Products Logic (Functions)
-- File: sql/domain/inventory/products.logic.sql

-- 4. Stock Movements Logic
-- File: sql/domain/inventory/product_stock_movements.logic.sql

-- 5. Products Policies (RLS)
-- File: sql/domain/inventory/products.policies.sql

-- 6. Stock Movements Policies
-- File: sql/domain/inventory/product_stock_movements.policies.sql

-- 7. Products Indexes
-- File: sql/domain/inventory/products.index.sql

-- 8. Stock Movements Indexes
-- File: sql/domain/inventory/product_stock_movements.index.sql
```

**Verification INVENTORY**:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('products', 'product_stock_movements')
ORDER BY table_name;

-- Expected: 2 tables
```

---

### **Phase 3: FINANCE Domain** (Incomes & Expenses)

```sql
-- 1. Customers Table
-- File: sql/domain/finance/customers.schema.sql

-- 2. Customers Logic
-- File: sql/domain/finance/customers.logic.sql

-- 3. Customers Policies
-- File: sql/domain/finance/customers.policies.sql

-- 4. Customers Indexes
-- File: sql/domain/finance/customers.index.sql

-- 5. Suppliers Table
-- File: sql/domain/finance/suppliers.schema.sql

-- 6. Suppliers Logic
-- File: sql/domain/finance/suppliers.logic.sql

-- 7. Suppliers Policies
-- File: sql/domain/finance/suppliers.policies.sql

-- 8. Suppliers Indexes
-- File: sql/domain/finance/suppliers.index.sql

-- 9. Incomes Table
-- File: sql/domain/finance/incomes.schema.sql

-- 10. Income Items Table
-- File: sql/domain/finance/income_items.schema.sql

-- 11. Incomes Logic
-- File: sql/domain/finance/incomes.logic.sql

-- 12. Income Items Logic
-- File: sql/domain/finance/income_items.logic.sql

-- 13. Incomes Policies
-- File: sql/domain/finance/incomes.policies.sql

-- 14. Income Items Policies
-- File: sql/domain/finance/income_items.policies.sql

-- 15. Incomes Indexes
-- File: sql/domain/finance/incomes.index.sql

-- 16. Income Items Indexes
-- File: sql/domain/finance/income_items.index.sql

-- 17. Expenses Table
-- File: sql/domain/finance/expenses.schema.sql

-- 18. Expense Items Table
-- File: sql/domain/finance/expense_items.schema.sql

-- 19. Expenses Logic
-- File: sql/domain/finance/expenses.logic.sql

-- 20. Expense Items Logic
-- File: sql/domain/finance/expense_items.logic.sql

-- 21. Expenses Policies
-- File: sql/domain/finance/expenses.policies.sql

-- 22. Expense Items Policies
-- File: sql/domain/finance/expense_items.policies.sql

-- 23. Expenses Indexes
-- File: sql/domain/finance/expenses.index.sql

-- 24. Expense Items Indexes
-- File: sql/domain/finance/expense_items.index.sql
```

**Verification FINANCE**:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'customers', 'suppliers', 
    'incomes', 'income_items', 
    'expenses', 'expense_items'
  )
ORDER BY table_name;

-- Expected: 6 tables
```

---

### **Phase 4: STOREFRONT Domain** (Optional - for online store)

```sql
-- 1. Storefronts Table
-- File: sql/domain/storefront/storefronts.schema.sql

-- 2. Storefronts Logic
-- File: sql/domain/storefront/storefronts.logic.sql

-- 3. Storefronts Policies
-- File: sql/domain/storefront/storefronts.policies.sql

-- 4. Storefronts Indexes
-- File: sql/domain/storefront/storefronts.index.sql
```

**Verification STOREFRONT**:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'storefronts';

-- Expected: 1 table
```

---

## ✅ Final Verification - All Domains

Run this to check all tables:

```sql
-- Check all tables
SELECT 
  table_schema,
  table_name,
  CASE 
    WHEN table_name IN ('business_profiles', 'onboarding_steps') THEN 'CORE'
    WHEN table_name IN ('products', 'product_stock_movements') THEN 'INVENTORY'
    WHEN table_name IN ('customers', 'suppliers', 'incomes', 'income_items', 'expenses', 'expense_items') THEN 'FINANCE'
    WHEN table_name = 'storefronts' THEN 'STOREFRONT'
    ELSE 'OTHER'
  END as domain
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY domain, table_name;

-- Expected: 11-13 tables total
```

Check RLS (Row Level Security) enabled:

```sql
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- All tables should have rls_enabled = true
```

Check functions created:

```sql
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- Expected: 20+ functions
```

---

## 🎯 Quick Deploy Script (Alternative)

Jika ingin deploy semua sekaligus, buat file `deploy_all.sql` dengan menggabungkan semua file dalam urutan di atas.

**ATAU** gunakan Supabase CLI:

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login
supabase login

# Link to project
supabase link --project-ref zhuxonyuksnhplxinikl

# Deploy migrations
supabase db push
```

---

## 🧪 Testing After Deployment

### 1. Test Authentication
- Sign up user di aplikasi
- Verify user_id di auth.users

### 2. Test Business Profile Creation
```sql
-- Check if business_profiles created automatically
SELECT * FROM business_profiles;
```

### 3. Test Products CRUD
- Buat produk via aplikasi
- Check: `SELECT * FROM products;`

### 4. Test Income Creation (Your Refactored Module!)
- Buka `/dashboard/input-income`
- Tambah transaksi
- Check: `SELECT * FROM incomes; SELECT * FROM income_items;`

### 5. Test Stock Movement
```sql
-- Check stock movements logged
SELECT * FROM product_stock_movements;
```

---

## 📝 Post-Deployment Checklist

- [ ] Phase 1: CORE domain deployed
- [ ] Phase 2: INVENTORY domain deployed
- [ ] Phase 3: FINANCE domain deployed
- [ ] Phase 4: STOREFRONT domain deployed (optional)
- [ ] All RLS policies enabled
- [ ] All functions created
- [ ] All indexes created
- [ ] Test user registration
- [ ] Test business profile creation
- [ ] Test product creation
- [ ] Test income creation (refactored module!)
- [ ] Test expense creation
- [ ] Check foreign key constraints working
- [ ] Verify stock movements logging

---

## 🚨 Troubleshooting

### Error: "relation already exists"
- Skip yang sudah ada, lanjut ke file berikutnya

### Error: "function already exists"
- Replace dengan: `CREATE OR REPLACE FUNCTION ...`

### Error: "permission denied"
- Check RLS policies sudah dijalankan
- Pastikan auth.uid() dapat nilai user yang login

### Error: "foreign key constraint"
- Pastikan parent table sudah ada (contoh: products harus ada sebelum income_items)

---

## 📞 Support

Jika ada masalah deployment, cek:
1. `sql/domain/{domain}/*.debug.sql` untuk query debugging
2. Supabase logs di Dashboard > Database > Logs
3. Browser console untuk error frontend

---

**Status**: ✅ Ready to Deploy  
**Next Step**: Copy-paste SQL files ke Supabase SQL Editor satu per satu  
**Time Estimate**: 15-20 menit untuk semua domain
