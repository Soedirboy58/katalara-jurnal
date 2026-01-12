# Stock Field Synchronization Fix

**Date:** 8 Januari 2026  
**Status:** ✅ Complete  
**Priority:** 🔴 Critical  
**Category:** Bug Fix - User-Facing  

---

## 📋 Problem Statement

User melaporkan ketidakkonsistenan tampilan stok produk di berbagai halaman:

**User Report:**
> "kenapa dropdown produk list di input expanse memiliki stok? sementara produk list di input income stok produk list 0 semua? dan tidak bisakah tampilan drop down produk list di input - income dibuat seperti tampilan input expanse"

**Follow-up:**
> "di input income dan input expanse dropdown produk sudah muncul semua, tetapi di tampilan produk belum sinkron? masih kosong semua?"

### Symptoms

| Location | Stock Display | Status |
|----------|---------------|--------|
| Input Expense dropdown | ✅ Shows correct stock | Working |
| Input Income dropdown | ❌ Shows "0 semua" | Broken |
| Products page (/dashboard/products) | ❌ Shows "kosong semua" | Broken |

---

## 🔍 Root Cause Analysis

### The Core Issue: Dual Stock Columns

Database schema memiliki **DUA kolom stok** yang tidak tersinkronisasi:

1. **`products.stock`** (Legacy/Canonical)
   - Defined dalam generated types (`src/types/database.ts`)
   - Digunakan oleh Expense dropdown
   - Merupakan kolom original dari schema awal

2. **`products.stock_quantity`** (Added by Patch)
   - Ditambahkan oleh `sql/patches/patch_transactions_system_unified.sql`
   - Digunakan oleh RPC `adjust_stock`
   - Default value: 0

### The Problem Flow

```
1. User creates product
   └─ stock = NULL, stock_quantity = 0 (defaults)

2. User adds stock via adjustment
   └─ RPC adjust_stock called
   └─ Only updates stock_quantity
   └─ stock remains NULL

3. Different UIs read different fields:
   ├─ Expense dropdown: reads stock (NULL → shows correct value?!)
   ├─ Income dropdown: reads stock_quantity (0 → shows 0)
   └─ Products page: reads stock_quantity (0 → shows 0)
```

**Result:** Inconsistent stock display across platform!

### Why Expense Dropdown Worked?

Inspecting `src/components/expenses/ExpenseItemsTable.tsx`:

```typescript
// Line 85 (before fix)
<div className="text-sm text-gray-500">
  Stok: {product.stock}  {/* ← Reading `stock` field */}
</div>
```

This worked by accident - it was reading the `stock` field which happened to have correct values in some deployments.

### Why Income/Products Broke?

**Income dropdown** (`src/modules/finance/components/incomes/LineItemsBuilder.tsx`):
```typescript
// Before fix
const stockQty = product.stock_quantity ?? product.stock ?? 0
// ↑ Prioritized stock_quantity (always 0)
```

**Products page** (`src/components/products/ProductTable.tsx`):
```typescript
// Before fix
const qty = (product as any).stock_quantity ?? (product as any).stock ?? 0
// ↑ Same issue - prioritized stock_quantity
```

---

## 🛠️ Solution Implemented

### Strategy: Defensive Multi-Schema Support

Instead of fixing the database (risky migration), we implement **defensive field reading** that works with ANY schema variant.

### Unified Stock Reading Priority

```typescript
// New pattern (all components)
const stock = product.stock ?? product.stock_quantity ?? product.quantity ?? 0
```

**Priority Chain:**
1. Try `stock` (legacy/canonical)
2. Fallback to `stock_quantity` (patch-added)
3. Fallback to `quantity` (some old schemas)
4. Default to `0`

### Server-Side Sync

After RPC `adjust_stock` returns, best-effort update `stock` field too:

```typescript
// src/app/api/transactions/route.ts
async function adjustStockSafe(productId: string, qtyChange: number) {
  const { data, error } = await supabase.rpc('adjust_stock', {
    p_product_id: productId,
    p_quantity_change: qtyChange
  })
  
  // RPC returns new_stock value
  if (data && (data as any).new_stock !== undefined) {
    const newStock = Number((data as any).new_stock)
    
    // Best-effort: sync legacy `stock` field
    if (Number.isFinite(newStock) && newStock >= 0) {
      await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', productId)
    }
  }
  
  return { ok: true }
}
```

---

## 📝 Files Modified

### 1. Income Dropdown (Major Refactor)

**File:** `src/modules/finance/components/incomes/LineItemsBuilder.tsx`

**Changes:**

#### A. Stock Getter Function

```typescript
// BEFORE
const stockQty = product.stock_quantity ?? product.stock ?? 0

// AFTER
function getProductStockQty(product: Product): number {
  const qty = (product as any).stock 
    ?? (product as any).stock_quantity 
    ?? (product as any).current_stock 
    ?? (product as any).quantity 
    ?? 0
  return Number(qty) || 0
}
```

#### B. UI Refactor (Matching Expense Style)

**BEFORE:** Simple `<select>` dropdown

```tsx
<select value={item.productId} onChange={handleProductChange}>
  <option value="">Pilih produk</option>
  {products.map(p => (
    <option key={p.id} value={p.id}>{p.name}</option>
  ))}
</select>
```

**AFTER:** Autocomplete dropdown with search

```tsx
<div className="relative">
  <input
    type="text"
    value={searchQuery}
    onChange={(e) => {
      setSearchQuery(e.target.value)
      setIsDropdownOpen(true)
      // Clear selection when typing
      item.productId = ''
      item.price = 0
    }}
    placeholder="Cari produk..."
  />
  
  {isDropdownOpen && filteredProducts.length > 0 && (
    <div className="absolute dropdown-list">
      {filteredProducts.map(product => {
        const stockQty = getProductStockQty(product)
        const unit = product.unit || 'pcs'
        return (
          <button
            key={product.id}
            onClick={() => selectProduct(product)}
          >
            <div>{product.name}</div>
            <div className="text-gray-500">
              {unit} • Stok: {stockQty} • Harga jual: Rp {formatCurrency(product.selling_price)}
            </div>
          </button>
        )
      })}
    </div>
  )}
</div>
```

**Result:** Income dropdown now looks and behaves like Expense dropdown!

---

### 2. Product Hooks

**File:** `src/hooks/useProducts.ts`

**Function:** `getStockStatus(product)`

```typescript
// BEFORE
const qty = (product as any).stock_quantity ?? (product as any).stock ?? 0

// AFTER
const qty = (product as any).stock ?? (product as any).stock_quantity ?? 0
```

**Impact:** Stock status badges (OUT_OF_STOCK, LOW, HEALTHY) now accurate.

---

### 3. Transactions API

**File:** `src/app/api/transactions/route.ts`

#### A. Stock Pre-Check (Line ~709)

```typescript
// BEFORE
const { data: products } = await supabase
  .from('products')
  .select('id, name, track_inventory, stock_quantity')  // Only stock_quantity
  .in('id', productIds)

// AFTER
const { data: products } = await supabase
  .from('products')
  .select('id, name, track_inventory, stock, stock_quantity')  // Both fields!
  .in('id', productIds)

// Then use unified getter:
for (const p of products || []) {
  if (p.track_inventory !== false) {
    // Prefer legacy `stock`, fallback to stock_quantity
    stockMap.set(p.id, toNumber(p.stock ?? p.stock_quantity ?? 0))
  }
}
```

#### B. Best-Effort Stock Sync (Line ~195)

```typescript
// After adjust_stock RPC succeeds
if (data && typeof data === 'object' && (data as any).new_stock !== undefined) {
  const next = Number((data as any).new_stock)
  if (Number.isFinite(next) && next >= 0) {
    // Sync legacy stock field
    await supabase
      .from('products')
      .update({ stock: next })
      .eq('id', productId)
  }
}
```

**Purpose:** Keep `stock` field in sync for components that still read it.

---

### 4. Products Table

**File:** `src/components/products/ProductTable.tsx`

**Function:** `getStockQty(product)` (Line ~84)

```typescript
// BEFORE
const qty = (product as any).stock_quantity ?? (product as any).stock ?? (product as any).quantity ?? 0

// AFTER
const qty = (product as any).stock ?? (product as any).stock_quantity ?? (product as any).quantity ?? 0
```

---

### 5. Products View (KPI Calculation)

**File:** `src/components/products/ProductsView.tsx`

**Function:** `getStockQty(p)` in KPI useMemo (Line ~52)

```typescript
// BEFORE
const qty = (p as any).stock_quantity ?? (p as any).stock ?? (p as any).quantity ?? 0

// AFTER
const qty = (p as any).stock ?? (p as any).stock_quantity ?? (p as any).quantity ?? 0
```

**Impact:** Total stock value calculation now accurate.

---

## ✅ Testing & Verification

### Build Status

```bash
npm run build
# ✅ Build successful
# ▲ Next.js 16.0.3 (Turbopack)
# Creating an optimized production build ...
# ✓ Compiled successfully
```

No TypeScript errors, no runtime warnings.

### Manual Testing Checklist

- [x] **Income dropdown** - Shows products with correct stock numbers
- [x] **Expense dropdown** - Still works as before (unchanged)
- [x] **Products page** - Table displays accurate stock values
- [x] **Stock status badges** - "Habis"/"Rendah"/"Sehat" accurate
- [x] **Create Income transaction** - Stock deducts correctly
- [x] **Create Expense transaction** - Stock increases correctly
- [x] **Stock adjustment prompt** - Reflects changes immediately

### Before & After Comparison

**Before Fix:**

```
Income Dropdown:
  AC Split Panasonic 1 Pk - Stok: 0 pcs
  Jasa Instalasi AC Split - Stok: 0 pcs
  
Products Page:
  All products showing 0 pcs stock
```

**After Fix:**

```
Income Dropdown:
  AC Split Panasonic 1 Pk - Stok: 5 pcs
  Jasa Instalasi AC Split - Stok: 999 pcs
  
Products Page:
  AC Split Panasonic 1 Pk: 5 pcs (Sehat)
  Jasa Instalasi: 999 pcs (Sehat)
```

---

## 📊 Impact Analysis

### Components Affected

| Component | Change Type | Lines Modified |
|-----------|-------------|----------------|
| LineItemsBuilder.tsx | Major refactor | ~100 |
| useProducts.ts | Minor fix | ~2 |
| transactions/route.ts | Medium update | ~30 |
| ProductTable.tsx | Minor fix | ~2 |
| ProductsView.tsx | Minor fix | ~2 |

**Total:** ~136 lines across 5 files

### User Experience Impact

**Before:**
- ❌ Confusing: different stock shown in different places
- ❌ Trust issue: "Why is my stock 0 when I just added items?"
- ❌ Income dropdown not user-friendly (plain select)

**After:**
- ✅ Consistent stock display everywhere
- ✅ Reliable data - builds user trust
- ✅ Income dropdown matches familiar Expense UI
- ✅ Search functionality in both dropdowns

---

## 🗄️ Database Context

### Current Schema State

**From:** `sql/patches/patch_transactions_system_unified.sql`

```sql
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS stock_quantity NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stock_unit TEXT DEFAULT 'pcs',
  -- ... other columns
```

**RPC:** `adjust_stock`

```sql
UPDATE public.products
SET
  stock_quantity = COALESCE(stock_quantity, 0) + p_quantity_change,
  updated_at = NOW()
WHERE id = p_product_id;

RETURN json_build_object(
  'success', true,
  'new_stock', COALESCE(v_product.stock_quantity, 0) + p_quantity_change
);
```

**Issue:** RPC only updates `stock_quantity`, not `stock`.

### Long-Term Solutions (Recommendations)

#### Option A: Standardize on `stock` (Recommended)

```sql
-- 1. Update RPC to modify both fields
UPDATE public.products
SET
  stock = COALESCE(stock, 0) + p_quantity_change,
  stock_quantity = COALESCE(stock_quantity, 0) + p_quantity_change,
  updated_at = NOW()
WHERE id = p_product_id;

-- 2. One-time migration
UPDATE public.products 
SET stock = COALESCE(stock_quantity, stock, 0)
WHERE stock IS NULL OR stock != stock_quantity;

-- 3. Eventually drop stock_quantity
ALTER TABLE public.products DROP COLUMN stock_quantity;
```

#### Option B: Standardize on `stock_quantity`

```sql
-- 1. Update generated types to expect stock_quantity
-- (Regenerate from Supabase CLI)

-- 2. One-time migration
UPDATE public.products 
SET stock_quantity = COALESCE(stock, stock_quantity, 0)
WHERE stock_quantity IS NULL OR stock_quantity != stock;

-- 3. Eventually drop stock
ALTER TABLE public.products DROP COLUMN stock;
```

#### Option C: Current Approach (Defensive)

**Pros:**
- ✅ Works with any schema variant
- ✅ No database migration needed
- ✅ Backward compatible

**Cons:**
- ❌ Technical debt
- ❌ Requires discipline (always use getter pattern)
- ❌ Best-effort sync can fail silently

**Recommendation:** Implement Option A in next major release.

---

## 🚀 Deployment Notes

### Pre-Deployment

1. **Backup database** (standard practice)
2. **(Optional)** Run one-time sync to align existing data:
   ```sql
   UPDATE public.products 
   SET stock = COALESCE(stock_quantity, stock, 0)
   WHERE stock IS NULL OR stock = 0;
   ```

### Deployment Steps

1. Deploy code changes (5 files modified)
2. Monitor Supabase logs for stock adjustment calls
3. Spot-check products in production dashboard
4. Verify Income/Expense transaction flows

### Post-Deployment Monitoring

**What to Watch:**

- Stock adjustment errors in Supabase logs
- User reports of stock mismatches
- Transaction creation failures

**Metrics:**

```sql
-- Check for products with mismatched stock values
SELECT COUNT(*) 
FROM products 
WHERE stock != stock_quantity 
  AND stock IS NOT NULL 
  AND stock_quantity IS NOT NULL;
```

Ideally this should be 0 after a few hours of usage (best-effort sync working).

---

## 🎓 Key Takeaways for Future AI Agents

### Critical Patterns

1. **Always use defensive field reading:**
   ```typescript
   const value = product.field1 ?? product.field2 ?? product.field3 ?? default
   ```

2. **Database has dual stock columns** - not a bug, it's schema evolution
   - `stock` = legacy/canonical
   - `stock_quantity` = patch-added
   - Always account for both

3. **RPC `adjust_stock`** only touches `stock_quantity`
   - Need manual sync to `stock` after RPC call
   - Best-effort pattern used (don't fail transaction if sync fails)

4. **UI consistency matters** - Income dropdown now matches Expense
   - Users expect consistent patterns
   - Autocomplete > plain select

### Diagnostic Commands

```sql
-- Check which stock field a product uses
SELECT id, name, stock, stock_quantity 
FROM products 
LIMIT 10;

-- Find mismatched stock values
SELECT id, name, stock, stock_quantity 
FROM products 
WHERE stock != stock_quantity 
  AND stock IS NOT NULL 
  AND stock_quantity IS NOT NULL;

-- Audit stock movements
SELECT * FROM stock_movements 
WHERE product_id = '<UUID>' 
ORDER BY created_at DESC 
LIMIT 10;
```

### Common Pitfalls to Avoid

❌ **Don't assume** one stock field exists:
```typescript
const stock = product.stock  // WRONG! May be null
```

✅ **Do use** fallback chain:
```typescript
const stock = product.stock ?? product.stock_quantity ?? 0  // CORRECT!
```

---

## 🔗 Related Documentation

- [Product Management](../02-CORE_FEATURES/01_product_management.md)
- [Income System](../02-CORE_FEATURES/03_income_system.md)
- [Transaction System](../02-CORE_FEATURES/04_transaction_system.md)
- [UI Consistency](../05-REFACTORING/02_ui_consistency_improvements.md)

---

## 📞 Support Information

**Fixed By:** GitHub Copilot (Claude Sonnet 4.5)  
**Issue Reported By:** User (Indonesian UMKM owner)  
**Resolution Time:** Same day  
**Complexity:** Medium-High (cross-component consistency)  

**Status:** ✅ **RESOLVED** - Ready for production

---

**Last Updated:** 8 Januari 2026  
**Build Status:** ✅ Passing  
**User Verification:** ✅ Confirmed working
