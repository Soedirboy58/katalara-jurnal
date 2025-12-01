# TEST: Product Creation After Schema Fix

## 🎯 Tujuan
Memverifikasi bahwa save product berhasil tanpa error schema cache.

## 📝 Test Cases

### Test 1: Create Product - Basic
1. Buka browser: `http://localhost:3000/dashboard/input-expenses`
2. Klik "Tambah Produk Baru"
3. Isi form:
   - **Nama**: Test Product 001
   - **SKU**: (kosong - auto-generate)
   - **Kategori**: Elektronik
   - **Harga Modal**: 100000
   - **Harga Jual**: 150000
   - **Satuan**: pcs
   - **Min Stock Alert**: 10
   - **Track Inventory**: ✅ ON
4. Klik "Simpan Produk"

**Expected:**
- ✅ No error in console
- ✅ Toast notification: "Produk berhasil ditambahkan"
- ✅ Product appears in dropdown

**Debugging:**
If error occurs:
```javascript
// Check browser console (F12)
// Look for:
// 1. Network tab → Request payload
// 2. Response → Error message
// 3. Console → Red errors
```

---

### Test 2: Create Product - All Fields
Repeat Test 1 dengan semua field diisi:
- Nama: Test Product 002
- SKU: TST-002
- Kategori: Makanan
- Deskripsi: Test product dengan deskripsi lengkap
- Harga Modal: 50000
- Harga Jual: 75000
- Satuan: kg
- Min Stock Alert: 5
- Track Inventory: ✅ ON

---

### Test 3: Create Product - Service (No Stock)
1. Nama: Jasa Service Laptop
2. Kategori: Jasa
3. Harga Modal: 0
4. Harga Jual: 200000
5. Satuan: jam
6. Track Inventory: ❌ OFF

**Expected:**
- ✅ Saves without requiring stock fields
- ✅ track_inventory = false

---

### Test 4: Verify in Database
Jalankan di Supabase SQL Editor:
```sql
SELECT 
  id,
  name,
  sku,
  category,
  cost_price,      -- Should have value
  selling_price,   -- Should have value
  unit,
  min_stock_alert,
  track_inventory,
  created_at
FROM products
ORDER BY created_at DESC
LIMIT 5;
```

**Expected:**
- ✅ All 3 test products exist
- ✅ Field names match: cost_price, selling_price
- ✅ NO columns: sell_price, buy_price, stock_quantity

---

## 🐛 Common Errors & Solutions

### Error: "Could not find 'cost_price' column"
**Cause:** Database masih pakai `buy_price`  
**Fix:** Run migration `sql/migrations/standardize-products-schema.sql`

### Error: "Could not find 'stock_quantity' column"
**Cause:** Code trying to access non-existent column  
**Fix:** Already fixed in audit (stock operations commented out)

### Error: 400 Bad Request
**Cause:** Field name mismatch  
**Fix:** Check browser console → Network → Request payload  
Compare with database columns

---

## ✅ Success Criteria

All tests pass when:
1. ✅ No errors in browser console
2. ✅ No 400/500 responses in Network tab
3. ✅ Products save to database successfully
4. ✅ Products appear in dropdown immediately
5. ✅ Database query shows correct field values

---

## 📊 Test Results Template

```
Test Date: _____________
Tester: _____________

Test 1: Basic Product
[ ] PASS / [ ] FAIL
Notes: ___________________________

Test 2: All Fields
[ ] PASS / [ ] FAIL
Notes: ___________________________

Test 3: Service Product
[ ] PASS / [ ] FAIL
Notes: ___________________________

Test 4: Database Verification
[ ] PASS / [ ] FAIL
Notes: ___________________________

Overall Status: [ ] ALL PASS / [ ] NEEDS FIX
```
