# 📦 INVENTORY DOMAIN - README

**Version:** 1.0  
**Status:** ✅ Production Ready  
**Created:** November 26, 2025

---

## 🎯 OVERVIEW

**INVENTORY Domain** adalah master data produk untuk seluruh sistem Katalara.

**Fungsi Utama:**
- Master data produk (barang & jasa)
- Tracking stok produk fisik
- Histori pergerakan stok (in/out/adjust)
- Perhitungan profit margin
- Alert stok minimum

**Relasi dengan Domain Lain:**
- **FINANCE** → `income_items.product_id` references `products.id` (untuk profit per produk)
- **STOREFRONT** → `storefront_products.product_id` references `products.id` (untuk display di lapak online)

---

## 🏗️ ARCHITECTURE

### **2 Entities × 4 Files = 8 SQL Files**

```
sql/domain/inventory/
├── products.schema.sql              (270 lines)
├── products.logic.sql               (310 lines)
├── products.policies.sql            (110 lines)
├── products.index.sql               (165 lines)
├── product_stock_movements.schema.sql    (120 lines)
├── product_stock_movements.logic.sql     (240 lines)
├── product_stock_movements.policies.sql  (100 lines)
├── product_stock_movements.index.sql     (150 lines)
├── INVENTORY.README.md              (this file)
└── inventory.debug.sql              (health check script)
```

**Total:** ~1,465 lines + documentation

---

## 📊 ENTITY REFERENCE

### 1️⃣ **products** (Master Produk)

**Purpose:** Master data produk yang digunakan seluruh sistem.

**Key Columns:**
- `id` - UUID primary key
- `user_id` - Owner (references auth.users)
- `name` - Nama produk (required)
- `sku` - Stock Keeping Unit (auto-generated: PRD-2025-001)
- `category` - Kategori: makanan, minuman, elektronik, jasa, dll
- `unit` - Satuan: pcs, kg, liter, jam, paket, dll
- `cost_price` - Harga beli/modal
- `selling_price` - Harga jual default
- `image_url` - URL gambar produk
- `track_inventory` - TRUE untuk barang fisik, FALSE untuk jasa
- `min_stock_alert` - Alert jika stok < nilai ini
- `is_active` - FALSE = archived

**Business Logic (5 functions):**
- `generate_product_sku()` - Auto-generate SKU (PRD-YYYY-NNN)
- `get_current_stock(product_id)` - Hitung stok dari movements
- `get_low_stock_products(user_id)` - Produk dengan stok < min_stock_alert
- `get_product_profit_margin(product_id)` - % margin profit
- `get_product_summary(user_id)` - Summary untuk dashboard

**Views:**
- `active_products_list` - Lightweight untuk dropdown
- `products_with_metrics` - Full metrics (stock, profit, status)

**RLS Policies:**
- User hanya bisa akses produknya sendiri (auth.uid = user_id)
- 4 policies: SELECT, INSERT, UPDATE, DELETE

**Indexes (9 total):**
- `user_id` - Primary filter
- `is_active` - Partial index (active only)
- `sku` - Unique per user
- `category` - Category filter
- `name` (trigram) - Full-text search
- Composite: user + active + category

---

### 2️⃣ **product_stock_movements** (Histori Stok)

**Purpose:** Append-only log pergerakan stok (IMMUTABLE).

**Key Columns:**
- `id` - UUID primary key
- `product_id` - References products(id)
- `quantity` - Jumlah (always positive)
- `movement_type` - 'in' / 'out' / 'adjust'
- `reference_type` - 'income' / 'expense' / 'manual' / 'adjustment' / 'return'
- `reference_id` - Link ke income/expense (optional)
- `note` - Catatan (max 1000 chars)
- `created_by` - User yang mencatat (references auth.users)
- `created_at` - Timestamp

**Movement Types:**
- `in` - Stok masuk (pembelian, produksi, return dari customer)
- `out` - Stok keluar (penjualan, rusak, hilang)
- `adjust` - Penyesuaian manual (stock opname, koreksi)

**Business Logic (4 functions):**
- `record_stock_movement()` - Helper untuk catat movement
- `get_product_stock_history()` - Histori dengan running stock
- `get_stock_summary_by_product()` - Aggregasi per produk
- `validate_stock_before_out()` - Cegah stok negatif (trigger)

**Views:**
- `recent_stock_movements` - Last 100 movements

**RLS Policies:**
- User bisa view/insert movements untuk produknya sendiri
- **NO UPDATE/DELETE** (append-only log)
- 2 policies: SELECT, INSERT

**Indexes (6 total):**
- `product_id` - Primary filter
- `movement_type` - Filter by type
- `reference_type + reference_id` - Link tracking
- `created_at` - Chronological sort
- Composite: product + created_at

**Constraints:**
- `movement_type IN ('in', 'out', 'adjust')`
- `quantity > 0` (always positive)
- `reference_type` validation
- Reference consistency (type & id must both exist or both null)

---

## 🔗 INTEGRATION WITH OTHER DOMAINS

### **FINANCE Domain**

**File:** `sql/domain/finance/incomes.schema.sql`

**Table:** `income_items`
```sql
product_id UUID REFERENCES products(id) ON DELETE SET NULL
```

**Usage:**
- Ketika create income dengan items, `product_id` di-link ke master products
- Auto-fill `sell_price` dan `buy_price` dari products
- Perhitungan profit per item: `(sell_price - buy_price) * quantity`

**Functions:**
- `calculate_income_profit()` - Total profit dari semua items
- `get_product_sales_report()` - Laporan penjualan per produk

---

### **STOREFRONT Domain**

**File:** `sql/domain/storefront/products.schema.sql`

**Table:** `storefront_products`
```sql
product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE
```

**Usage:**
- Produk di lapak online adalah **display layer** dari master products
- `display_price` optional override dari `products.selling_price`
- `display_name` optional override dari `products.name`

**Functions:**
- `publish_product_to_storefront(product_id, storefront_id, display_price)` - Publish produk ke lapak
- `sync_product_from_master(storefront_product_id)` - Sync dari master (jika ada update harga/nama)

**Flow:**
1. User create produk di master `products`
2. Call `publish_product_to_storefront()` untuk publish ke lapak
3. Storefront_products menyimpan display settings (price, visibility, featured)
4. Master products tetap single source of truth

---

## 🚀 DEPLOYMENT ORDER

**CRITICAL:** INVENTORY domain harus di-deploy **SEBELUM** FINANCE & STOREFRONT!

### For New Database:

```bash
# 1. INVENTORY Schema (create tables)
psql -f sql/domain/inventory/products.schema.sql
psql -f sql/domain/inventory/product_stock_movements.schema.sql

# 2. INVENTORY Logic (functions & triggers)
psql -f sql/domain/inventory/products.logic.sql
psql -f sql/domain/inventory/product_stock_movements.logic.sql

# 3. INVENTORY Policies (RLS)
psql -f sql/domain/inventory/products.policies.sql
psql -f sql/domain/inventory/product_stock_movements.policies.sql

# 4. INVENTORY Indexes (performance)
psql -f sql/domain/inventory/products.index.sql
psql -f sql/domain/inventory/product_stock_movements.index.sql

# 5. Health Check
psql -f sql/domain/inventory/inventory.debug.sql
```

### For Existing Database (with FINANCE/STOREFRONT already deployed):

**Use PATCH files instead:**
```bash
# Apply patches in order
psql -f sql/patches/2025-11-26-inventory-domain-setup.sql
psql -f sql/patches/2025-11-26-finance-add-product-fk.sql
psql -f sql/patches/2025-11-26-storefront-fix-product-fk.sql
```

---

## 🧪 TESTING & VALIDATION

**Run Health Check:**
```bash
psql -f sql/domain/inventory/inventory.debug.sql
```

**Expected Output:**
- ✅ Section 1: Tables exist (products, product_stock_movements)
- ✅ Section 2: RLS enabled on both tables
- ✅ Section 3: Functions exist (5 + 4 = 9 functions)
- ✅ Section 4: Indexes created (9 + 6 = 15 indexes)
- ✅ Section 5: Constraints valid (8 + 5 = 13 constraints)
- ✅ Section 6: Sample data test (create product → add stock → check current_stock)
- ✅ Section 7: RLS test (user can only see own products)
- ✅ Section 8: Low stock alert test
- ✅ Section 9: Performance test (queries < 50ms)

**All sections must PASS ✅ before production deployment!**

---

## 📝 COMMON OPERATIONS

### Create Product

```sql
INSERT INTO products (
  user_id,
  name,
  category,
  unit,
  cost_price,
  selling_price,
  track_inventory,
  min_stock_alert
) VALUES (
  auth.uid(),
  'Kopi Arabica 250gr',
  'makanan',
  'pcs',
  25000,
  35000,
  TRUE,
  10
);
-- SKU auto-generated: PRD-2025-001
```

### Record Stock In (Pembelian)

```sql
SELECT record_stock_movement(
  p_product_id := '<product_id>',
  p_quantity := 50,
  p_movement_type := 'in',
  p_reference_type := 'expense',
  p_reference_id := '<expense_id>',
  p_note := 'Pembelian dari Supplier ABC'
);
```

### Record Stock Out (Penjualan)

```sql
SELECT record_stock_movement(
  p_product_id := '<product_id>',
  p_quantity := 5,
  p_movement_type := 'out',
  p_reference_type := 'income',
  p_reference_id := '<income_id>',
  p_note := 'Penjualan ke Customer XYZ'
);
```

### Check Current Stock

```sql
SELECT get_current_stock('<product_id>');
-- Returns: integer (current stock)
```

### Get Low Stock Products

```sql
SELECT * FROM get_low_stock_products(auth.uid());
-- Returns: products with stock < min_stock_alert
```

### Get Product History

```sql
SELECT * FROM get_product_stock_history('<product_id>', 50, 0);
-- Returns: last 50 movements with running stock
```

---

## 🔒 SECURITY MODEL

### **RLS Policies (Row Level Security)**

**products:**
- User hanya bisa akses produknya sendiri (user_id = auth.uid())
- 4 policies: SELECT, INSERT, UPDATE, DELETE

**product_stock_movements:**
- User hanya bisa akses movements dari produknya sendiri
- 2 policies: SELECT, INSERT
- **NO UPDATE/DELETE** (immutable log)

### **Data Isolation**

- Setiap user 100% terisolasi (tidak bisa lihat data user lain)
- RLS di-enforce di database level (tidak bisa di-bypass dari frontend)

### **Audit Trail**

- `product_stock_movements` adalah append-only log
- Setiap movement mencatat `created_by` dan `created_at`
- Tidak bisa di-edit/hapus (gunakan 'adjust' movement untuk koreksi)

---

## ⚡ PERFORMANCE CONSIDERATIONS

### **Indexes Optimization**

- **products:** 9 indexes (user_id, is_active, sku, category, name trigram, composite)
- **product_stock_movements:** 6 indexes (product_id, movement_type, reference, created_at, composite)

### **Query Performance Targets**

- Product list: < 50ms
- Current stock calculation: < 100ms
- Stock history (50 rows): < 200ms
- Low stock alert: < 100ms

### **Full-Text Search**

- `products.name` indexed with trigram (pg_trgm)
- Supports partial/fuzzy search
- Enable extension: `CREATE EXTENSION pg_trgm;`

---

## 🐛 TROUBLESHOOTING

### "Function get_current_stock does not exist"
→ Deploy `products.logic.sql` first

### "Insufficient stock" error
→ Check current stock with `get_current_stock(product_id)`
→ Use 'adjust' movement to fix stock count

### "Permission denied on products"
→ Deploy `products.policies.sql` (RLS policies)
→ Ensure user is authenticated (auth.uid() not null)

### "Stock movements tidak bisa di-delete"
→ By design (append-only log)
→ Use 'adjust' movement to correct errors

### "SKU duplicate error"
→ SKU must be unique per user
→ Auto-generated SKU always unique
→ Manual SKU must be checked first

---

## 📚 RELATED DOCUMENTATION

- **Master Setup:** `sql/domain/inventory/INVENTORY.README.md` (this file)
- **Health Check:** `sql/domain/inventory/inventory.debug.sql`
- **Finance Integration:** `sql/domain/finance/README.md`
- **Storefront Integration:** `sql/domain/storefront/STOREFRONT.README.md`
- **Deployment Guide:** See "DEPLOYMENT ORDER" section above

---

## 🎯 KEY TAKEAWAYS

1. **INVENTORY adalah master data** - single source of truth untuk produk
2. **FINANCE & STOREFRONT** link via FK `product_id`
3. **Stock movements adalah append-only** - tidak bisa edit/delete
4. **Deploy INVENTORY dulu** sebelum FINANCE/STOREFRONT
5. **Use PATCH files** untuk database yang sudah jalan
6. **RLS di-enforce** di database level (user isolation)
7. **Current stock dihitung** dari movements (not stored)
8. **Auto-generate SKU** jika tidak diisi manual

---

**Status:** ✅ Production Ready  
**Version:** 1.0  
**Last Updated:** November 26, 2025
