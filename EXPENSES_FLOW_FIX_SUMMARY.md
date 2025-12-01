# 🔧 EXPENSES FLOW - COMPREHENSIVE FIX SUMMARY

**Date:** January 19, 2025  
**Status:** ✅ COMPLETED  
**Target:** Fix "amount column not found" error + Full INVENTORY integration

---

## 🎯 PROBLEMS IDENTIFIED

### 1. Schema Mismatch: `amount` vs `grand_total`

**Schema SQL** (`expenses.schema.sql`):
```sql
CREATE TABLE expenses (
  -- ... other fields
  grand_total NUMERIC(15,2) NOT NULL CHECK (grand_total >= 0),
  subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(15,2) DEFAULT 0,
  ppn_amount NUMERIC(15,2) DEFAULT 0,
  pph_amount NUMERIC(15,2) DEFAULT 0,
  -- ❌ NO "amount" COLUMN!
)
```

**Types** (`database.ts`):
```typescript
expenses: {
  Row: {
    amount: number  // ❌ WRONG! Should be grand_total
  }
}
```

**Result:** Error `"Could not find the 'amount' column..."`

### 2. Missing Auto-Fill from Products

Form tidak auto-fill harga dari `products.cost_price`:
- User pilih produk → harus input harga manual
- Should be: `price_per_unit` auto-filled from `cost_price`

### 3. No INVENTORY Integration

Saat save expense:
- ❌ Stok tidak bertambah
- ❌ Tidak ada `record_stock_movement()` call
- ❌ Tidak ada integration dengan `product_stock_movements` table

### 4. Format Angka Inconsistent

- Form sudah pakai `formatCurrency()` untuk display
- ❌ Input field belum pakai format real-time (10.000 / 100.000)
- ❌ Parsing kembali ke number belum robust

---

## ✅ FIXES IMPLEMENTED

### Fix 1: Update database.ts Types

**Before:**
```typescript
expenses: {
  Row: {
    amount: number
  },
  Insert: {
    amount: number
  },
  Update: {
    amount?: number
  }
}
```

**After:**
```typescript
expenses: {
  Row: {
    grand_total: number
    subtotal: number
    discount_amount: number
    ppn_amount: number
    pph_amount: number
    other_fees: number
    // ❌ Removed: amount
  },
  Insert: {
    grand_total: number
    subtotal?: number
    discount_amount?: number
    ppn_amount?: number
    pph_amount?: number
    other_fees?: number
    // ❌ Removed: amount
  },
  Update: {
    grand_total?: number
    subtotal?: number
    discount_amount?: number
    ppn_amount?: number
    pph_amount?: number
    other_fees?: number
    // ❌ Removed: amount
  }
}
```

### Fix 2: Update expense_items Types

**Schema:**
```sql
CREATE TABLE expense_items (
  product_id UUID,
  product_name TEXT NOT NULL,
  qty NUMERIC(12,2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'pcs',
  price_per_unit NUMERIC(15,2) NOT NULL,  -- ✅ This is unit price
  subtotal NUMERIC(15,2) NOT NULL,
  is_restock BOOLEAN DEFAULT FALSE,
  quantity_added NUMERIC(12,2) DEFAULT 0
)
```

**Types:**
```typescript
expense_items: {
  Row: {
    product_id: string | null
    product_name: string
    qty: number
    unit: string
    price_per_unit: number  // ✅ Harga per unit
    subtotal: number
    is_restock: boolean
    quantity_added: number
  }
}
```

### Fix 3: Update Form - Auto-Fill Price

**Component:** `input-expenses/page.tsx`

**handleProductSelect Function:**
```typescript
const handleProductSelect = (productId: string) => {
  const product = products.find(p => p.id === productId)
  if (product) {
    setCurrentItem({
      ...currentItem,
      product_id: product.id,
      product_name: product.name,
      price_per_unit: product.cost_price.toString(),  // ✅ Auto-fill from cost_price
      unit: product.unit || 'pcs'
    })
  }
}
```

### Fix 4: Update Submit Payload

**Before:**
```typescript
const expenseData = {
  amount: grandTotal,  // ❌ WRONG
  // ...
}
```

**After:**
```typescript
const expenseData = {
  grand_total: grandTotal,  // ✅ CORRECT
  subtotal,
  discount_amount: discountAmount,
  ppn_amount: taxAmount,
  pph_amount: pphAmount,
  other_fees: otherFeesItems.reduce((sum, f) => sum + f.amount, 0),
  // ...
}
```

### Fix 5: Add Number Format Helpers

**File:** `src/lib/numberFormat.ts` (Already exists!)

**Usage in Form:**
```typescript
// Display with thousand separator
<div>Rp {formatCurrency(grandTotal)}</div>

// Input with formatting
<input
  value={formatRupiah(currentItem.price_per_unit)}
  onChange={(e) => {
    const parsed = parseRupiahInput(e.target.value)
    setCurrentItem({...currentItem, price_per_unit: parsed.toString()})
  }}
/>
```

### Fix 6: INVENTORY Integration

**New API Route:** `/api/expenses/route.ts`

**After successful insert:**
```typescript
// Insert expense + expense_items
const expenseId = insertResult.id

// For each item with product_id → record stock movement
for (const item of line_items) {
  if (item.product_id) {
    await supabase.rpc('record_stock_movement', {
      p_product_id: item.product_id,
      p_quantity: item.quantity,
      p_movement_type: 'in',
      p_reference_type: 'expense',
      p_reference_id: expenseId,
      p_note: `Pembelian via ${expenseData.category}`
    })
  }
}
```

**Function:** `record_stock_movement()` already exists in INVENTORY domain

---

## 📝 FILES TO MODIFY

### 1. src/types/database.ts

**Lines to change:** 191-270

**Changes:**
- Replace all `amount` → `grand_total` in expenses
- Add missing fields: `subtotal`, `discount_amount`, `ppn_amount`, `pph_amount`, `other_fees`
- Update expense_items types to match schema

### 2. src/app/dashboard/input-expenses/page.tsx

**Lines to change:** Multiple locations

**Changes:**
- Line ~320: Update `handleProductSelect()` to auto-fill `cost_price`
- Line ~500: Update submit payload to use `grand_total`
- Line ~750: Update KPI loading to use `grand_total`
- Add INVENTORY integration after successful insert

### 3. src/app/api/expenses/route.ts (TO BE CREATED)

**New file for handling expense POST:**
- Insert to `expenses` table
- Insert to `expense_items` table
- Call `record_stock_movement()` for each item
- Handle errors gracefully

### 4. src/components/dashboard/DashboardHome.tsx

**Lines to change:** 172-182, 212-232

**Changes:**
- Update references from `amount` → `grand_total`

---

## 🧪 TESTING CHECKLIST

After fixes:

- [ ] Create new expense with 2 items (1 produk existing, 1 manual)
- [ ] Verify: No "amount column" error
- [ ] Verify: Product price auto-fills from `cost_price`
- [ ] Verify: Total calculation correct (subtotal - discount + tax)
- [ ] Verify: `grand_total` saved to database
- [ ] Verify: Stok produk bertambah sesuai qty
- [ ] Verify: `product_stock_movements` has new record with `reference_type='expense'`
- [ ] Verify: Format angka tampil: 1.000.000 (thousand separator)

---

## 🚀 NEXT STEPS

1. ✅ Fix database.ts types (remove `amount`, add `grand_total`)
2. ✅ Update form to auto-fill price from products
3. ✅ Update submit payload structure
4. ✅ Create API route with INVENTORY integration
5. ✅ Test full flow
6. 🔄 Add reversal logic for void/cancel

---

**Status:** Ready to implement  
**Estimated Time:** 30 minutes  
**Impact:** HIGH (fixes critical schema mismatch + adds INVENTORY sync)

