# FIX: Expense Items RLS Policy Bug

## 🐛 Problem
User mendapat error saat menyimpan transaksi pengeluaran:
```
Error: new row violates row-level security policy for table "expense_items"
```

## 🔍 Root Cause
RLS policy di tabel `expense_items` mengecek `expenses.user_id = auth.uid()` tetapi:
1. Tabel `expenses` memiliki DUA kolom: `user_id` dan `owner_id`
2. API insert menggunakan BOTH fields tapi RLS policy hanya cek `user_id`
3. Timing issue: RLS check terjadi sebelum data fully committed

## ✅ Solution

### Step 1: Run SQL Fix di Supabase
Copy file: `sql/fix-expense-items-rls.sql` ke Supabase SQL Editor dan execute.

SQL akan:
- Drop existing RLS policies yang bermasalah
- Recreate policies dengan check BOTH `user_id` OR `owner_id`
- Tambah index untuk performance
- Verify table structure

### Step 2: Verify di Supabase Dashboard
1. Buka **Database → Tables → expense_items**
2. Klik **RLS Policies** tab
3. Confirm ada 4 policies:
   - Users can view own expense items
   - Users can insert own expense items  
   - Users can update own expense items
   - Users can delete own expense items

### Step 3: Test Insert Expense
1. Login ke app
2. Input Pengeluaran → Pilih kategori "Pembelian Produk Jadi"
3. Add item (contoh: Kapasitor 5 pcs @ 35rb)
4. Klik Simpan
5. ✅ Should success without RLS error

## 📋 Issue #2: Item Tidak Terbaca di Preview

### Root Cause
GET endpoint tidak include `expense_items` dalam query result.

### Fix Required
Update `/api/expenses` GET endpoint:

```typescript
// Add expense_items to SELECT
let query = supabase
  .from('expenses')
  .select(`
    *,
    supplier:suppliers(id, name, phone, email),
    items:expense_items(*)
  `, { count: 'exact' })
```

Ini sudah ada di code tapi perlu re-deploy.

## 📋 Issue #3: Product Stock Sync

### Current Logic (Correct)
```typescript
// When expense with items created:
for (const item of line_items) {
  if (item.product_id) {
    // Auto-increase stock: stock += quantity
    const newStock = (product.stock_quantity || 0) + parseFloat(item.quantity)
    await supabase.from('products').update({ stock_quantity: newStock })
  }
}
```

Logic sudah benar: **Pembelian = Tambah Stok**

### Verify Stock Sync
1. Check current stock: Dashboard → Produk → Kapasitor (misal: 0)
2. Buat expense: Beli Kapasitor 5 pcs
3. Refresh Produk page
4. ✅ Stock should increase: 0 → 5

## 🚀 Deployment Steps

1. **Apply SQL Fix**
   ```sql
   -- Run sql/fix-expense-items-rls.sql di Supabase
   ```

2. **Verify Code Fix Already in Place**
   - ✅ API sudah include `items:expense_items(*)`
   - ✅ Stock sync logic sudah benar
   - ✅ POPreviewModal sudah handle items

3. **Re-deploy to Vercel**
   ```bash
   cd katalara-nextjs
   npm run build
   vercel --prod
   ```

## 🧪 Testing Checklist

- [ ] Insert expense dengan multi-items berhasil (no RLS error)
- [ ] Preview detail expense menampilkan items list
- [ ] Product stock auto-update setelah expense saved
- [ ] POPreviewModal menampilkan table items di desktop
- [ ] POPreviewModal menampilkan card items di mobile
- [ ] Production output (jika ada) juga update stock finished goods

## 📊 Expected Behavior After Fix

### Before (Broken)
```
POST /api/expenses → 500 Error
Message: "new row violates row-level security policy"
Items: [] (empty)
Stock: Tidak update
```

### After (Fixed)
```
POST /api/expenses → 200 Success
Message: "✅ Pengeluaran berhasil disimpan!"
Items: [
  {product_name: "Kapasitor", quantity: 5, price: 35000, subtotal: 175000}
]
Stock: Kapasitor 0 → 5
```

## 🔧 Maintenance Notes

### RLS Policy Best Practice
Gunakan OR condition untuk backward compatibility:
```sql
WHERE (expenses.user_id = auth.uid() OR expenses.owner_id = auth.uid())
```

### Index Optimization
```sql
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_owner_id ON expenses(owner_id);
```

Ini mempercepat RLS checks dari O(n) ke O(log n).

---

**Status:** Ready to deploy
**Estimated Fix Time:** 5 minutes
**Risk Level:** Low (only RLS policy update)
