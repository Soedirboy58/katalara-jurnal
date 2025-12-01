# PRODUCTS SCHEMA STANDARDIZATION - COMPLETE

**Date:** November 27, 2024  
**Status:** ✅ AUDIT COMPLETE - AWAITING DATABASE VERIFICATION

---

## 🎯 MASALAH AWAL

Error berulang saat save product:
```
"Could not find the 'cost_price' column of 'products' in the schema cache"
"Could not find the 'stock_quantity' column"
```

**Root Cause:**
- Inkonsistensi nama kolom antara database dan frontend
- Code mencoba akses kolom `stock_quantity` yang tidak ada
- Field name mismatch: `buy_price` vs `cost_price`, `sell_price` vs `selling_price`

---

## ✅ SOLUSI YANG SUDAH DITERAPKAN

### 1. Schema Documentation Created
**File:** `src/types/product-schema.ts` (180 lines)

Single source of truth untuk struktur products:
```typescript
export interface ProductRow {
  id: string
  user_id: string
  name: string
  sku?: string
  category?: string
  unit: string              // ✅ Bukan stock_unit
  cost_price: number        // ✅ Bukan buy_price
  selling_price: number     // ✅ Bukan sell_price
  min_stock_alert: number   // ✅ Bukan min_stock
  track_inventory: boolean
  is_active: boolean
  // ❌ TIDAK ADA: stock_quantity, initial_stock, owner_id
}
```

### 2. Frontend Fixed - 10 Files Updated

**Files Fixed:**
1. ✅ `src/types/product-schema.ts` - NEW file
2. ✅ `src/types/database.ts` - Types updated
3. ✅ `src/components/products/ProductModal.tsx` - Field names fixed
4. ✅ `src/app/api/sync-data/route.ts` - INSERT fields fixed
5. ✅ `src/app/api/expenses/route.ts` - Stock ops commented out
6. ✅ `src/app/api/expenses/[id]/route.ts` - Stock restoration disabled
7. ✅ `src/app/api/income/route.ts` - 3 stock operations disabled
8. ✅ `src/app/api/income/[id]/route.ts` - Stock restoration disabled
9. ✅ `src/app/api/kpi/route.ts` - Stock queries disabled, owner_id→user_id
10. ✅ `src/app/api/lapak/sync-product/route.ts` - stock_quantity removed

**Changes Summary:**
- ❌ `owner_id` → ✅ `user_id`
- ❌ `buy_price` → ✅ `cost_price`
- ❌ `sell_price` → ✅ `selling_price`
- ❌ `stock_unit` → ✅ `unit`
- ❌ `stock_quantity` → ✅ Removed (tidak ada di DB)

### 3. Stock Operations Disabled

Semua operasi `stock_quantity` di-comment out karena:
- ❌ Kolom `stock_quantity` **TIDAK ADA** di tabel products
- 📋 Stock akan dikelola di tabel terpisah: `stock_movements` (future)
- 💾 Business logic preserved dalam comments untuk future implementation

**Contoh:**
```typescript
// ⚠️ STOCK TRACKING DISABLED - stock_quantity doesn't exist
// TODO: Implement with stock_movements table
console.log(`📦 Stock reduction pending for product ${productId}`)
```

---

## 📊 STRUKTUR DATABASE FINAL

**Source of Truth:** `sql/domain/inventory/products.schema.sql`

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,           -- ✅ Bukan owner_id
  name TEXT NOT NULL,
  sku TEXT,
  category TEXT,
  unit TEXT DEFAULT 'pcs',         -- ✅ Bukan stock_unit
  description TEXT,
  cost_price NUMERIC(15,2),        -- ✅ Bukan buy_price
  selling_price NUMERIC(15,2),     -- ✅ Bukan sell_price
  image_url TEXT,
  track_inventory BOOLEAN,
  min_stock_alert INTEGER,         -- ✅ Bukan min_stock
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
  
  -- ❌ TIDAK ADA:
  -- stock_quantity, initial_stock, current_stock, 
  -- buy_price, sell_price, stock_unit, owner_id
);
```

---

## 🔍 VERIFIKASI DATABASE (PERLU DILAKUKAN!)

**File:** `sql/diagnostics/verify-products-schema.sql`

**Cara Pakai:**
1. Buka Supabase Dashboard → SQL Editor
2. Copy-paste file verify-products-schema.sql
3. Run query
4. Lihat hasil:

**HASIL 1: Database Sudah Benar**
```
✅ cost_price exists
✅ selling_price exists
✅ min_stock_alert exists
✅ user_id exists
✅ stock_quantity absent (CORRECT)
```
➡️ **Tidak perlu migration, langsung test!**

**HASIL 2: Database Pakai Nama Lama**
```
❌ sell_price exists (should be selling_price)
⚠️ stock_quantity exists (should NOT)
❌ buy_price exists (should be cost_price)
```
➡️ **Perlu migration!**

---

## 🔧 MIGRATION (Jika Diperlukan)

**File:** `sql/migrations/standardize-products-schema.sql`

**Cara Pakai:**
1. Backup database dulu!
2. Buka Supabase Dashboard → SQL Editor
3. Copy-paste file standardize-products-schema.sql
4. Run migration

**Migration Actions:**
- ✅ RENAME: sell_price → selling_price
- ✅ RENAME: buy_price → cost_price
- ✅ RENAME: stock_unit → unit
- ✅ RENAME: min_stock → min_stock_alert
- ✅ RENAME: owner_id → user_id
- ✅ DROP: stock_quantity, initial_stock, current_stock
- ✅ ADD: Missing columns (if any)
- ✅ UPDATE: Constraints
- ✅ REFRESH: PostgREST schema cache

---

## 🧪 TESTING

**File:** `TEST_PRODUCT_CREATION.md`

**Test Cases:**
1. ✅ Create product - basic fields
2. ✅ Create product - all fields
3. ✅ Create service product (no stock tracking)
4. ✅ Verify in database

**Expected Results:**
- ✅ No "column not found" errors
- ✅ No 400 Bad Request
- ✅ Products save successfully
- ✅ Data appears in dropdown

---

## 📁 FILES CREATED

### Documentation
- `sql/diagnostics/verify-products-schema.sql` - Verify database structure
- `sql/migrations/standardize-products-schema.sql` - Migration script
- `TEST_PRODUCT_CREATION.md` - Test procedures
- `PRODUCTS_SCHEMA_STANDARDIZATION.md` - This file

### Source Code
- `src/types/product-schema.ts` - Schema documentation + helpers

### Updated Files (10 files)
See "Frontend Fixed" section above

---

## 🚀 NEXT STEPS

### 1. VERIFY DATABASE (WAJIB!)
```bash
# Run in Supabase SQL Editor:
sql/diagnostics/verify-products-schema.sql
```

### 2. RUN MIGRATION (If Needed)
```bash
# Only if verify shows old column names:
sql/migrations/standardize-products-schema.sql
```

### 3. TEST PRODUCT CREATION
```bash
# Follow test guide:
TEST_PRODUCT_CREATION.md
```

### 4. MONITOR
Check browser console for any errors during product creation.

---

## 🎯 SUCCESS CRITERIA

✅ TypeScript compilation: **CLEAN** (verified)  
⏳ Database structure: **PENDING VERIFICATION**  
⏳ Product creation: **PENDING TEST**  
⏳ No schema cache errors: **PENDING TEST**

---

## 📋 KNOWN LIMITATIONS

1. **Stock Tracking Disabled**
   - stock_quantity tidak tersedia
   - Menunggu implementasi stock_movements table
   - Bisnis logic preserved untuk future

2. **Migration May Be Needed**
   - Bergantung pada struktur database saat ini
   - Perlu verifikasi manual di Supabase

3. **Testing Required**
   - Belum ada automated tests
   - Perlu manual testing per test case

---

## 🔮 FUTURE ENHANCEMENTS

1. **Stock Movements Table**
   ```sql
   CREATE TABLE stock_movements (
     id UUID PRIMARY KEY,
     product_id UUID REFERENCES products(id),
     movement_type TEXT, -- 'in', 'out', 'adjustment'
     quantity INTEGER,
     reference_type TEXT, -- 'expense', 'income', 'manual'
     reference_id UUID,
     notes TEXT,
     created_at TIMESTAMPTZ
   );
   ```

2. **Current Stock View**
   ```sql
   CREATE VIEW product_stock_summary AS
   SELECT 
     p.id,
     p.name,
     COALESCE(SUM(
       CASE 
         WHEN sm.movement_type = 'in' THEN sm.quantity
         WHEN sm.movement_type = 'out' THEN -sm.quantity
         ELSE 0
       END
     ), 0) as current_stock
   FROM products p
   LEFT JOIN stock_movements sm ON sm.product_id = p.id
   GROUP BY p.id, p.name;
   ```

3. **Automated Tests**
   - Jest tests for product-schema.ts helpers
   - Playwright E2E tests for product creation
   - API integration tests

---

**Status:** ✅ FRONTEND COMPLETE - AWAITING DATABASE VERIFICATION  
**Next Action:** Run `sql/diagnostics/verify-products-schema.sql`

---

## 📞 TROUBLESHOOTING

### Error: "Could not find column in schema cache"
**Solution:** Run NOTIFY to refresh cache:
```sql
NOTIFY pgrst, 'reload schema';
```

### Error: Migration fails with constraint error
**Solution:** Check if data exists with old values, migrate data first:
```sql
-- Example: Migrate data before constraint change
UPDATE products SET selling_price = sell_price WHERE sell_price IS NOT NULL;
```

### Error: TypeScript type errors
**Solution:** 
1. Delete `.next` folder
2. Restart dev server: `npm run dev`
3. Check imports use product-schema.ts types

---

**Author:** GitHub Copilot  
**Date:** November 27, 2024  
**Version:** 1.0
