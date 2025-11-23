# 📋 EVALUASI & REDESIGN: INPUT PENGELUARAN
**Tanggal**: 23 November 2025  
**Tujuan**: Adopsi pola desain Input Pendapatan + Fitur UMKM Inventory Management

---

## 🔍 ANALISIS PERBANDINGAN

### ✅ Input Pendapatan (Reference Model)
**Kekuatan:**
1. ✨ **Professional Multi-Items UI**
   - Header Card gradien biru dengan nomor transaksi
   - Line items table dengan qty, unit, harga, subtotal
   - Ringkasan otomatis: subtotal → diskon → pajak → grand total
   
2. 🎯 **Customer Management**
   - Modal pilih customer existing atau tambah baru
   - Quick add customer dengan validasi
   - Support anonymous transaction
   
3. 💰 **Payment Tracking Professional**
   - Lunas vs Kredit/Tempo visual buttons
   - Auto-calculate due date (7/14/30/60 hari)
   - Down payment (DP) tracking
   - Sisa tagihan calculation
   - WhatsApp reminder field
   
4. 🛠️ **Product Integration**
   - Quick add product modal (langsung dari form)
   - Auto-populate harga dari database
   - Service duration tracking
   
5. 📊 **Transaction Management**
   - Recent transactions table with edit/delete
   - Edit mode dengan banner highlight
   - Transaction number auto-generate

### ⚠️ Input Pengeluaran (Current State)
**Kekurangan:**
1. ❌ **No Multi-Items Support**
   - Hanya 1 produk per transaksi
   - Tidak ada line items table
   - Tidak ada ringkasan subtotal/diskon/pajak
   
2. ❌ **No Vendor Management**
   - Hanya input text biasa (tidak structured)
   - Tidak ada quick add vendor
   - Tidak ada riwayat vendor
   
3. ⚠️ **Payment Tracking Terbatas**
   - Ada tempo/hutang, tapi UI kurang visual
   - Tidak ada vendor phone untuk reminder
   - Tidak ada DP tracking untuk pembelian besar
   
4. ❌ **No Purchase Order (PO) System**
   - Tidak ada nomor transaksi terstruktur
   - Sulit tracking pembelian ke supplier
   
5. 📦 **Batch Purchase Primitive**
   - Ada fitur batch, tapi UI kurang intuitif
   - Cost per unit calculation manual
   - Tidak integrated dengan inventory

---

## 🎯 KONSEP BELANJA: PRODUK JADI vs BAHAN BAKU

### 📦 Produk Jadi (Reseller/Dropshipper)
**Contoh:** Toko baju beli 50 kaos dari supplier

**Workflow Ideal:**
```
1. Pilih/Tambah Supplier (Quick Add)
2. Masukkan Multi-Items:
   - Kaos Polos Putih M: 20 pcs × Rp 25.000 = Rp 500.000
   - Kaos Polos Hitam L: 30 pcs × Rp 30.000 = Rp 900.000
3. Subtotal: Rp 1.400.000
4. Diskon Grosir: -5% (Rp 70.000)
5. Ongkir: +Rp 50.000
6. Grand Total: Rp 1.380.000
7. Payment: Tempo 30 hari (vendor WhatsApp: 0812xxx)
8. DP: Rp 500.000
9. Sisa: Rp 880.000 (jatuh tempo 23 Des 2025)

AUTO-ACTION BACKEND:
✅ Update stock products:
   - Kaos Polos Putih M: +20 pcs
   - Kaos Polos Hitam L: +30 pcs
✅ Set buy_price per produk: Rp 27.600 (setelah diskon+ongkir)
✅ Suggest sell_price: Rp 36.900 (markup 33%)
✅ Create hutang payable dengan reminder
```

### 🧪 Bahan Baku (Manufaktur/Produksi)
**Contoh:** Bakery beli tepung, telur, gula untuk buat kue

**Workflow Ideal:**
```
1. Pilih/Tambah Supplier Bahan Baku
2. Masukkan Multi-Items:
   - Tepung Terigu 10kg: 2 sak × Rp 120.000 = Rp 240.000
   - Telur: 5 kg × Rp 35.000 = Rp 175.000
   - Gula Pasir: 5 kg × Rp 15.000 = Rp 75.000
3. Subtotal: Rp 490.000
4. Grand Total: Rp 490.000
5. Payment: Lunas

SMART PRODUCTION PLANNING:
📊 Sistem Track Cost per Produk Jadi:
   Input: Rp 490.000 bahan baku
   Output (estimated): 100 box brownies
   Cost per box: Rp 4.900
   Suggested Price: Rp 15.000 (margin 206%)

AUTO-ACTION BACKEND:
✅ Update raw_materials inventory:
   - Tepung: +20 kg
   - Telur: +5 kg
   - Gula: +5 kg
✅ Link to production batch (future feature)
✅ Calculate COGS when product sold
```

---

## 🏗️ PROPOSAL REDESIGN: INPUT PENGELUARAN PROFESSIONAL

### 1️⃣ HEADER CARD (Gradien Merah/Orange)
```tsx
┌─────────────────────────────────────────────────────┐
│ 🔴 HEADER (Gradient Red-Orange)                     │
├─────────────────────────────────────────────────────┤
│ [📋 PO-2025-123456] [👤 Supplier] [📅 Tanggal]    │
│ [📝 Catatan pembelian...]                           │
└─────────────────────────────────────────────────────┘
```

**Fields:**
- `purchase_order_number`: Auto-generate `PO/YYYY/XXXXXX`
- `supplier_id`: FK to `suppliers` table (NEW)
- `expense_date`: Date picker
- `notes`: Catatan transaksi

### 2️⃣ KATEGORI & TIPE PENGELUARAN
**Sama dengan current**, tapi tambahkan helper text:

```
Operating → Pembelian Stok:
┌─────────────────────────────────────────────────┐
│ ( ) Bahan Baku      (untuk produksi)            │
│ (*) Produk Jadi     (untuk dijual langsung)     │
└─────────────────────────────────────────────────┘
```

### 3️⃣ MULTI-ITEMS INPUT (Like Income)
```tsx
┌─────────────────────────────────────────────────────────┐
│ Tambah Produk/Bahan                                     │
├─────────────────────────────────────────────────────────┤
│ [Dropdown Produk ▼]  [Qty]  [Unit]  [Harga]  [+Tambah] │
│                                                          │
│ ➕ Tambah Produk Baru (Quick Add)                       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Daftar Item                                              │
├────────────────┬─────┬──────┬──────────┬─────────┬──────┤
│ Produk         │ Qty │ Unit │ Harga    │ Subtotal│ Aksi │
├────────────────┼─────┼──────┼──────────┼─────────┼──────┤
│ Tepung 10kg    │ 2   │ sak  │ 120.000  │ 240.000 │ 🗑️  │
│ Telur Fresh    │ 5   │ kg   │ 35.000   │ 175.000 │ 🗑️  │
│ Gula Pasir     │ 5   │ kg   │ 15.000   │  75.000 │ 🗑️  │
└────────────────┴─────┴──────┴──────────┴─────────┴──────┘
```

### 4️⃣ RINGKASAN (Like Income)
```tsx
┌─────────────────────────────────────────────────┐
│ Ringkasan                                       │
├─────────────────────────────────────────────────┤
│ Subtotal:                        Rp   490.000   │
│ Diskon:          [5]%            - Rp  24.500   │
│ Ongkir/Biaya Lain:               + Rp  50.000   │
├─────────────────────────────────────────────────┤
│ TOTAL:                           Rp   515.500   │
└─────────────────────────────────────────────────┘
```

### 5️⃣ PAYMENT TRACKING (Enhanced)
```tsx
┌─────────────────────────────────────────────────┐
│ Pembayaran                                       │
├─────────────────────────────────────────────────┤
│ [Metode: Transfer ▼]                            │
│                                                  │
│ ┌────────┐  ┌────────┐                         │
│ │  💵    │  │  📅    │                         │
│ │ LUNAS  │  │ TEMPO  │ ← Visual buttons       │
│ └────────┘  └────────┘                         │
│                                                  │
│ ⚠️ Hutang Aktif - Jatuh Tempo: 23 Des 2025    │
│ [Jangka Waktu: 7|14|30|60 hari]                │
│ WhatsApp Vendor: [0812xxx] (reminder)          │
│                                                  │
│ Uang Muka (DP):  Rp [200.000]                  │
│ Sisa Hutang:     Rp  315.500                   │
└─────────────────────────────────────────────────┘
```

### 6️⃣ SUPPLIER MANAGEMENT (NEW)
```tsx
┌─────────────────────────────────────────────────┐
│ 👤 Pilih Supplier                               │
├─────────────────────────────────────────────────┤
│ [Button: Klik untuk Pilih Supplier]             │
└─────────────────────────────────────────────────┘

MODAL:
┌────────────────────────────────────────────────┐
│ 📋 Daftar Supplier                             │
├────────────────────────────────────────────────┤
│ ➕ Tambah Supplier Baru                        │
│                                                 │
│ ─────────────────────────────────────────────  │
│ PT Tepung Jaya (Bahan Baku)                   │
│ 📞 0812xxx | 📧 sales@tepungjaya.com          │
│                                                 │
│ Toko Grosir Sentosa (Produk Jadi)             │
│ 📞 0821xxx | 📍 Tanah Abang                   │
└────────────────────────────────────────────────┘

Quick Add Supplier:
┌────────────────────────────────────────────────┐
│ Nama Supplier: [________________]              │
│ Tipe: ( ) Bahan Baku (*) Produk Jadi         │
│ WhatsApp: [_____________] (reminder)           │
│ Email: [_____________] (opsional)              │
│ Alamat: [_____________] (opsional)             │
│                                                 │
│ [Batal]  [✅ Simpan]                           │
└────────────────────────────────────────────────┘
```

---

## 🗄️ DATABASE SCHEMA BARU

### Table: `suppliers`
```sql
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  name VARCHAR(255) NOT NULL,
  supplier_type VARCHAR(50), -- 'raw_materials', 'finished_goods', 'both'
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_suppliers_owner ON suppliers(owner_id);
CREATE INDEX idx_suppliers_type ON suppliers(supplier_type);
```

### Table: `expense_items` (NEW - for multi-items)
```sql
CREATE TABLE expense_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id), -- Link to product if exists
  product_name VARCHAR(255) NOT NULL, -- Snapshot name
  quantity NUMERIC(10,2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  price_per_unit NUMERIC(15,2) NOT NULL,
  subtotal NUMERIC(15,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expense_items_expense ON expense_items(expense_id);
CREATE INDEX idx_expense_items_product ON expense_items(product_id);
```

### Update `expenses` table
```sql
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS purchase_order_number VARCHAR(50);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS supplier_name VARCHAR(255); -- Snapshot
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS subtotal NUMERIC(15,2);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5,2) DEFAULT 0;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(15,2) DEFAULT 0;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS other_fees NUMERIC(15,2) DEFAULT 0; -- Ongkir, handling fee
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS down_payment NUMERIC(15,2) DEFAULT 0;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS remaining NUMERIC(15,2) DEFAULT 0;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS supplier_phone VARCHAR(20); -- For WhatsApp reminder

CREATE INDEX idx_expenses_supplier ON expenses(supplier_id);
CREATE INDEX idx_expenses_po_number ON expenses(purchase_order_number);
```

---

## 🤖 BACKEND AUTO-ACTIONS

### Action 1: Update Product Inventory
```typescript
// When user saves expense with product_sales or raw_materials category
async function updateInventoryFromPurchase(expenseItems: ExpenseItem[]) {
  for (const item of expenseItems) {
    if (!item.product_id) {
      // Option 1: Create new product if not exists
      const newProduct = await createProductFromExpense(item)
      item.product_id = newProduct.id
    }
    
    // Update stock
    await supabase
      .from('products')
      .update({
        stock_quantity: sql`stock_quantity + ${item.quantity}`,
        buy_price: item.price_per_unit,
        last_restock_date: new Date(),
        updated_at: new Date()
      })
      .eq('id', item.product_id)
  }
}
```

### Action 2: Calculate COGS (Cost of Goods Sold)
```typescript
// Auto-calculate weighted average cost
async function updateWeightedAverageCost(productId: string, newQty: number, newCost: number) {
  const product = await getProduct(productId)
  
  const oldValue = product.stock_quantity * product.buy_price
  const newValue = newQty * newCost
  const totalQty = product.stock_quantity + newQty
  
  const avgCost = (oldValue + newValue) / totalQty
  
  await supabase
    .from('products')
    .update({ 
      buy_price: avgCost,
      stock_quantity: totalQty 
    })
    .eq('id', productId)
}
```

### Action 3: Hutang/Payable Tracking
```typescript
// When payment_type === 'tempo'
async function createPayableReminder(expense: Expense) {
  await supabase.from('payables').insert({
    expense_id: expense.id,
    supplier_id: expense.supplier_id,
    amount: expense.remaining || expense.amount,
    due_date: expense.due_date,
    status: 'pending',
    reminder_phone: expense.supplier_phone,
    reminder_enabled: true,
    reminder_days_before: [7, 3, 1, 0] // 7 days before, 3 days, 1 day, due date
  })
}
```

---

## 📱 FITUR MVSP (MINIMUM VIABLE FOR UMKM)

### ✅ Core Features (MUST HAVE)
1. **Multi-Items Input** - Belanja banyak produk sekaligus
2. **Supplier Management** - Quick add & select supplier
3. **Inventory Auto-Update** - Stock bertambah otomatis
4. **Payment Tempo Tracking** - Hutang ke supplier dengan reminder
5. **Cost Calculation** - Auto-calculate buy_price per product

### 🎯 Enhanced Features (NICE TO HAVE)
1. **Purchase Order PDF** - Generate PO untuk dikirim ke supplier
2. **Supplier Performance** - Ranking supplier by on-time delivery, price
3. **Reorder Point Alert** - "Stock Tepung tinggal 2kg, biasanya order ke Supplier A"
4. **Batch Production Tracking** - Link pembelian bahan baku → produk jadi
5. **Price History** - Track harga beli dari supplier (tren naik/turun)

### 🚀 Advanced Features (FUTURE)
1. **Purchase Requisition** - Staff request pembelian → owner approve
2. **Multi-Currency** - Import dari luar negeri (USD, CNY)
3. **Quality Control** - Catat produk reject/rusak dari supplier
4. **Supplier Credit Limit** - Max hutang Rp 10jt ke Supplier A
5. **Automated Reorder** - AI suggest kapan order lagi berdasarkan sales velocity

---

## 🎨 UI/UX CONSISTENCY

### Color Palette
- **Pendapatan**: Hijau/Biru (positif, optimis)
- **Pengeluaran**: Merah/Orange (hati-hati, kontrol)

### Component Reuse
```
✅ HeaderCard (gradient)
✅ CustomerModal → SupplierModal (same logic)
✅ LineItemsTable (same structure)
✅ SummaryCard (same calculation pattern)
✅ PaymentSection (visual buttons)
✅ QuickAddModal (product/supplier)
```

### Responsive Behavior
- Desktop: Full table with all columns
- Mobile: Card-based dengan collapse sections

---

## 🔄 MIGRATION PLAN

### Phase 1: Database (Week 1)
1. Create `suppliers` table
2. Create `expense_items` table
3. Add columns to `expenses` table
4. Migrate existing expenses to new structure

### Phase 2: Backend API (Week 2)
1. `/api/suppliers` - CRUD endpoints
2. `/api/expenses` - Update untuk multi-items
3. Inventory update logic
4. Payable tracking logic

### Phase 3: Frontend (Week 3-4)
1. SupplierModal component
2. Multi-items input component
3. Enhanced payment section
4. Summary card with calculations
5. Testing & bug fixes

### Phase 4: Polish (Week 5)
1. Educational modal
2. Quick add flows
3. Mobile responsive
4. Performance optimization

---

## 📊 SUCCESS METRICS

### User Experience
- ⏱️ Time to record expense: < 2 minutes (vs 5 minutes manual)
- 📉 Error rate: < 5% (auto-calculations reduce mistakes)
- 😊 User satisfaction: > 4.5/5 (professional feel)

### Business Impact
- 📦 Inventory accuracy: > 95% (auto stock updates)
- 💰 Payment tracking: 100% hutang ter-record dengan reminder
- 📈 Supplier insights: Track top 5 suppliers by spend

---

## 🎓 EDUCATIONAL CONTENT

### Modal: "Panduan Belanja Cerdas UMKM"
```markdown
## 🛒 Beli Produk Jadi (Reseller)
Untuk yang **beli barang jadi langsung dijual lagi**:
- Pilih kategori: Pembelian Stok → Produk Jadi
- Catat harga beli per unit
- Sistem otomatis update stock & suggest harga jual

Contoh: Beli baju 50 pcs dari supplier Rp 50.000/pcs
→ Stock +50, Harga Modal Rp 50.000
→ Sistem suggest jual Rp 75.000 (margin 50%)

## 🧪 Beli Bahan Baku (Produksi)
Untuk yang **produksi sendiri** (bakery, kerajinan, dll):
- Pilih kategori: Pembelian Stok → Bahan Baku
- Catat semua bahan yang dibeli
- Sistem track berapa cost per produk jadi

Contoh: Beli tepung Rp 500.000 + telur Rp 200.000
→ Bikin 100 box brownies
→ Cost per box: Rp 7.000
→ Sistem suggest jual Rp 20.000
```

---

## ✅ ACCEPTANCE CRITERIA

### Scenario 1: Belanja Produk Jadi (Reseller)
```gherkin
Given: User bisnis fashion (reseller)
When: Beli 3 produk dari supplier Tanah Abang
Then:
  - Dapat input multi-items (3 produk beda)
  - Dapat set diskon grosir 10%
  - Dapat bayar DP 50% (tempo 30 hari)
  - Stock produk otomatis bertambah
  - Hutang Rp 5jt tercatat dengan reminder
  - Cost per item ter-update di database
```

### Scenario 2: Belanja Bahan Baku (Produksi)
```gherkin
Given: User bakery (produksi kue)
When: Beli tepung 20kg, telur 10kg, gula 5kg
Then:
  - Dapat input multi-items bahan baku
  - Dapat link ke supplier "Toko Bahan Kue"
  - Stock bahan mentah bertambah
  - Sistem suggest: "Bisa produksi 200 box brownies"
  - Cost per box ter-calculate: Rp 4.500
```

---

## 🚀 IMPLEMENTATION CHECKLIST

### Backend
- [ ] Create `suppliers` table
- [ ] Create `expense_items` table  
- [ ] Update `expenses` table schema
- [ ] API: POST /api/suppliers (CRUD)
- [ ] API: GET /api/suppliers?type=raw_materials
- [ ] API: POST /api/expenses (multi-items support)
- [ ] Logic: Auto-update inventory from purchase
- [ ] Logic: Calculate weighted average cost
- [ ] Logic: Create payable reminders
- [ ] Migration script: Existing data → new structure

### Frontend Components
- [ ] SupplierModal (select/add supplier)
- [ ] QuickAddSupplierModal
- [ ] MultiItemsInput (like income)
- [ ] LineItemsTable (desktop + mobile)
- [ ] SummaryCard (subtotal → discount → total)
- [ ] PaymentSection (Lunas/Tempo visual)
- [ ] TempoFields (DP, sisa, due date, phone)
- [ ] Educational modal
- [ ] HeaderCard (gradient red-orange)

### Testing
- [ ] Unit tests: Inventory update logic
- [ ] Unit tests: Cost calculation
- [ ] Integration: Full expense flow (multi-items → save → inventory)
- [ ] E2E: Reseller scenario
- [ ] E2E: Produksi scenario
- [ ] Mobile responsive test

---

**🎯 Target Completion**: 5 weeks  
**👥 Team Required**: 1 Full-stack Developer  
**📊 Estimated Effort**: 120-150 hours

---

**Status**: ✅ PROPOSAL READY FOR APPROVAL
