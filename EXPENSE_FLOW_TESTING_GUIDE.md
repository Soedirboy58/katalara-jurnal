# 🧪 EXPENSE FLOW - TESTING GUIDE

**Quick guide untuk test fix "amount column not found" + INVENTORY integration**

---

## 📋 PRE-TEST CHECKLIST

1. ✅ Database types fixed (`grand_total` field)
2. ✅ API route updated (INVENTORY integration)
3. ✅ Frontend form updated (auto-fill price)
4. ✅ Dashboard component updated (KPI queries)

---

## 🧪 TEST SCENARIOS

### Scenario 1: Create Expense WITHOUT Inventory Items

**Steps:**
1. Go to `/dashboard/input-expenses`
2. Select category: "Biaya Operasional"
3. Add manual item:
   - Name: "Biaya Listrik Bulan Januari"
   - Quantity: 1
   - Price: 500000
4. Click "Simpan"

**Expected Result:**
- ✅ No error "amount column not found"
- ✅ Expense saved with `grand_total = 500000`
- ✅ Dashboard shows updated total
- ✅ NO stock movement (karena manual item, bukan inventory)

**SQL Verification:**
```sql
-- Check last expense
SELECT id, category, description, grand_total, subtotal, created_at
FROM expenses
ORDER BY created_at DESC
LIMIT 1;

-- Check expense items
SELECT ei.product_name, ei.qty, ei.price_per_unit, ei.subtotal, ei.is_restock
FROM expense_items ei
WHERE ei.expense_id = 'YOUR_EXPENSE_ID'
ORDER BY ei.created_at;

-- Check stock movements (should be empty)
SELECT * FROM product_stock_movements
WHERE reference_type = 'expense' AND reference_id = 'YOUR_EXPENSE_ID';
```

---

### Scenario 2: Create Expense WITH Inventory Items

**Steps:**
1. Go to `/dashboard/input-expenses`
2. Select category: "Pembelian Bahan Baku"
3. Select supplier (optional)
4. Add inventory items:
   - **Item 1:** Select product "Kopi Arabica" from dropdown
     - Price should auto-fill from `cost_price` ✅
     - Quantity: 50 kg
   - **Item 2:** Select product "Gula Pasir"
     - Price should auto-fill ✅
     - Quantity: 20 kg
5. Add discount: 100000
6. Add PPN 11%
7. Click "Simpan"

**Expected Result:**
- ✅ Both items show auto-filled prices
- ✅ Grand total = (Subtotal - Discount + PPN)
- ✅ Expense saved successfully
- ✅ **2 stock movements created** (movement_type='in')
- ✅ Product stock quantities increased

**SQL Verification:**
```sql
-- 1. Check expense details
SELECT 
  id,
  category,
  supplier_id,
  subtotal,
  discount_amount,
  ppn_amount,
  grand_total,
  created_at
FROM expenses
ORDER BY created_at DESC
LIMIT 1;

-- 2. Check expense items
SELECT 
  product_id,
  product_name,
  qty,
  unit,
  price_per_unit,
  subtotal,
  is_restock,
  quantity_added
FROM expense_items
WHERE expense_id = 'YOUR_EXPENSE_ID'
ORDER BY created_at;

-- 3. ✅ MOST IMPORTANT: Check stock movements
SELECT 
  psm.id,
  p.name AS product_name,
  psm.quantity,
  psm.movement_type,
  psm.reference_type,
  psm.reference_id,
  psm.note,
  psm.created_at
FROM product_stock_movements psm
JOIN products p ON p.id = psm.product_id
WHERE psm.reference_type = 'expense'
  AND psm.reference_id = 'YOUR_EXPENSE_ID'
ORDER BY psm.created_at;

-- 4. Check product stock updated
SELECT 
  id,
  name,
  stock_quantity,
  last_restocked_at
FROM products
WHERE id IN ('KOPI_ARABICA_ID', 'GULA_PASIR_ID');
```

**Expected Stock Movements:**
```
| product_name  | quantity | movement_type | reference_type | note                          |
|---------------|----------|---------------|----------------|-------------------------------|
| Kopi Arabica  | +50      | in            | expense        | Pembelian via Pembelian...    |
| Gula Pasir    | +20      | in            | expense        | Pembelian via Pembelian...    |
```

---

### Scenario 3: Mixed Items (Inventory + Manual)

**Steps:**
1. Go to `/dashboard/input-expenses`
2. Add items:
   - Item 1: Select "Kopi Arabica" (inventory) - 30 kg
   - Item 2: Manual "Biaya Kirim" - Rp 150.000
   - Item 3: Select "Gula Pasir" (inventory) - 10 kg
3. Click "Simpan"

**Expected Result:**
- ✅ 3 items inserted to `expense_items`
- ✅ **Only 2 stock movements** (for Kopi Arabica + Gula Pasir)
- ✅ Manual item "Biaya Kirim" has `is_restock = false`, no stock movement

**SQL Verification:**
```sql
-- Check items with restock flags
SELECT 
  product_name,
  qty,
  is_restock,
  quantity_added
FROM expense_items
WHERE expense_id = 'YOUR_EXPENSE_ID'
ORDER BY created_at;

-- Expected:
-- Kopi Arabica | 30 | true  | 30
-- Biaya Kirim  | 1  | false | 0
-- Gula Pasir   | 10 | true  | 10

-- Check stock movements (should only have 2 records)
SELECT COUNT(*) AS movement_count
FROM product_stock_movements
WHERE reference_type = 'expense' AND reference_id = 'YOUR_EXPENSE_ID';
-- Expected: 2 (not 3!)
```

---

### Scenario 4: Production Output (Bahan Baku → Barang Jadi)

**Steps:**
1. Go to `/dashboard/input-expenses`
2. Select category: "Pembelian Bahan Baku"
3. Add raw materials:
   - Item 1: "Biji Kopi Mentah" - 100 kg
   - Item 2: "Kemasan Plastik" - 500 pcs
4. **Enable "Hasil Produksi"** toggle
5. Select finished product: "Kopi Arabica Roasted"
6. Enter quantity: 90 kg (loss ~10% dari 100 kg)
7. Click "Simpan"

**Expected Result:**
- ✅ Expense created with 2 items
- ✅ **3 stock movements total:**
  - Movement 1: Biji Kopi Mentah +100 kg (raw material IN)
  - Movement 2: Kemasan Plastik +500 pcs (raw material IN)
  - Movement 3: Kopi Arabica Roasted +90 kg (finished goods IN)

**SQL Verification:**
```sql
SELECT 
  p.name AS product_name,
  psm.quantity,
  psm.movement_type,
  psm.note
FROM product_stock_movements psm
JOIN products p ON p.id = psm.product_id
WHERE psm.reference_type = 'expense'
  AND psm.reference_id = 'YOUR_EXPENSE_ID'
ORDER BY psm.created_at;

-- Expected 3 rows:
-- Biji Kopi Mentah        | +100 | in | Pembelian via...
-- Kemasan Plastik         | +500 | in | Pembelian via...
-- Kopi Arabica Roasted    | +90  | in | Hasil produksi dari bahan baku...
```

---

### Scenario 5: Dashboard KPI Display

**Steps:**
1. Create 3 expenses today (use Scenario 1, 2, 3)
2. Go to `/dashboard`
3. Check "Pengeluaran Hari Ini" card

**Expected Result:**
- ✅ Total shows sum of all `grand_total` from today's expenses
- ✅ No console errors about "amount column"
- ✅ Recent transactions list shows expenses with correct amounts

**Browser Console Check:**
```javascript
// Open DevTools → Console
// Should see NO errors like:
// ❌ "Could not find the 'amount' column of 'expenses'"
// ❌ "column expenses.amount does not exist"

// Should see logs like:
// ✅ "Stock updated: Kopi Arabica +50"
// ✅ "Production output: Product abc-123 +90"
```

---

## 🔍 DEBUGGING QUERIES

### Check All Expenses Today
```sql
SELECT 
  id,
  expense_date,
  category,
  description,
  subtotal,
  discount_amount,
  ppn_amount,
  grand_total,
  created_at
FROM expenses
WHERE expense_date = CURRENT_DATE
  AND owner_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;
```

### Check Stock Movements Last 24h
```sql
SELECT 
  psm.created_at,
  p.name AS product_name,
  psm.quantity,
  psm.movement_type,
  psm.reference_type,
  psm.reference_id,
  psm.note
FROM product_stock_movements psm
JOIN products p ON p.id = psm.product_id
WHERE psm.created_at >= NOW() - INTERVAL '24 hours'
  AND psm.reference_type = 'expense'
ORDER BY psm.created_at DESC;
```

### Check Product Stock History
```sql
SELECT 
  p.name,
  p.stock_quantity AS current_stock,
  p.last_restocked_at,
  COUNT(psm.id) AS total_movements
FROM products p
LEFT JOIN product_stock_movements psm ON psm.product_id = p.id
WHERE p.track_inventory = true
GROUP BY p.id
ORDER BY p.last_restocked_at DESC NULLS LAST;
```

### Verify Expense Items vs Stock Movements
```sql
-- Should match: expense_items.is_restock=true COUNT = stock_movements COUNT
SELECT 
  e.id AS expense_id,
  e.category,
  (SELECT COUNT(*) FROM expense_items WHERE expense_id = e.id AND is_restock = true) AS restock_items,
  (SELECT COUNT(*) FROM product_stock_movements WHERE reference_id = e.id AND reference_type = 'expense') AS stock_movements
FROM expenses e
WHERE e.created_at >= NOW() - INTERVAL '24 hours'
ORDER BY e.created_at DESC;

-- Expected: restock_items = stock_movements (atau stock_movements = restock_items + production_output)
```

---

## 🚨 COMMON ISSUES & FIXES

### Issue 1: "amount column not found"
**Cause:** Database types masih gunakan `amount` field  
**Fix:** Already fixed in `src/types/database.ts` ✅  
**Verify:** Check file Lines 191-305

### Issue 2: Price tidak auto-fill
**Cause:** `handleProductSelect()` gunakan wrong field  
**Fix:** Already fixed, now uses `cost_price` ✅  
**Verify:** Select product di form, price harus terisi otomatis

### Issue 3: Stock tidak update
**Cause:** `record_stock_movement()` tidak dipanggil atau error  
**Fix:** Check server logs `/api/expenses` POST handler  
**Debug:**
```javascript
// Check console for:
console.log(`✅ Stock updated: ${item.product_name} +${item.quantity}`)
// or
console.error(`❌ Error record_stock_movement for ${item.product_id}:`, stockError)
```

### Issue 4: RPC function error "record_stock_movement does not exist"
**Cause:** INVENTORY domain belum di-setup atau function belum deployed  
**Fix:** Run SQL migration:
```sql
-- Check if function exists
SELECT proname, proargnames 
FROM pg_proc 
WHERE proname = 'record_stock_movement';

-- If empty, deploy from:
-- sql/domain/inventory/products.logic.sql
```

### Issue 5: Dashboard masih error
**Cause:** Old browser cache atau React state issue  
**Fix:**
1. Hard refresh: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)
2. Clear localStorage: `localStorage.clear()`
3. Restart dev server: `npm run dev`

---

## ✅ SUCCESS CRITERIA

Test dianggap **PASS** jika:

- [x] No "amount column not found" error di console
- [x] Expenses tersimpan dengan `grand_total` field
- [x] Price auto-fills dari `products.cost_price`
- [x] `product_stock_movements` table bertambah record
- [x] `products.stock_quantity` meningkat sesuai qty
- [x] Dashboard KPI menampilkan total yang benar
- [x] Recent transactions list show data tanpa error

---

## 📊 PERFORMANCE CHECK

After testing, verify:

```sql
-- Check index performance
EXPLAIN ANALYZE
SELECT * FROM product_stock_movements
WHERE reference_type = 'expense'
  AND reference_id = 'some-uuid'
ORDER BY created_at DESC;

-- Should use index, not sequential scan
-- Expected: "Index Scan using idx_stock_movements_reference..."
```

---

## 🎉 FINAL VERIFICATION

Run this comprehensive check:

```sql
-- 1. Count expenses created today
SELECT COUNT(*) AS expenses_today
FROM expenses
WHERE expense_date = CURRENT_DATE;

-- 2. Count stock movements from those expenses
SELECT COUNT(*) AS movements_today
FROM product_stock_movements
WHERE reference_type = 'expense'
  AND created_at::date = CURRENT_DATE;

-- 3. Verify all movements have valid product references
SELECT COUNT(*) AS orphaned_movements
FROM product_stock_movements psm
LEFT JOIN products p ON p.id = psm.product_id
WHERE psm.reference_type = 'expense'
  AND p.id IS NULL;
-- Expected: 0 (no orphaned records)

-- 4. Check grand_total field exists and has data
SELECT 
  COUNT(*) AS total_expenses,
  COUNT(grand_total) AS has_grand_total,
  AVG(grand_total) AS avg_grand_total
FROM expenses
WHERE created_at >= NOW() - INTERVAL '7 days';
-- Expected: total_expenses = has_grand_total (100% coverage)
```

---

**Happy Testing! 🚀**

If all scenarios pass → ✅ **READY FOR PRODUCTION**
