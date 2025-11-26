# 💰 INCOMES ENTITY - Finance Domain

**Status:** ✅ Complete  
**Version:** 1.0  
**Last Updated:** November 26, 2025

---

## 🎯 PERAN INCOMES DALAM FINANCE DOMAIN

Incomes adalah **entitas kritikal** untuk revenue tracking dengan 3 klasifikasi utama:

### 1. **Operating Income** (Pendapatan Operasional)
Pendapatan dari aktivitas bisnis inti:
- **Product Sales**: Penjualan produk/barang
- **Service Income**: Pendapatan jasa
- **Retail Sales**: Penjualan retail
- **Wholesale Sales**: Penjualan grosir
- **Commission Income**: Pendapatan komisi

### 2. **Investing Income** (Pendapatan Investasi)
Pendapatan dari aktivitas investasi:
- **Asset Sale**: Penjualan aset (mesin, kendaraan, properti)
- **Dividend Income**: Dividen dari investasi
- **Interest Income**: Bunga dari deposito/tabungan
- **Capital Gains**: Keuntungan dari penjualan investasi

### 3. **Financing Income** (Pendapatan Pembiayaan)
Pendapatan dari aktivitas pembiayaan:
- **Loan Receipt**: Penerimaan pinjaman
- **Investor Funding**: Dana dari investor
- **Capital Injection**: Penambahan modal
- **Grant/Subsidy**: Hibah/subsidi

---

## 🔗 RELASI DENGAN ENTITIES LAIN

### Database Relationships:

```
customers (1) ----< (many) incomes
products (1) ----< (many) income_items
incomes (1) ----< (many) income_items
```

### Entity Connections:

```sql
-- incomes table
CREATE TABLE incomes (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  -- ... other columns
);

-- income_items table
CREATE TABLE income_items (
  id UUID PRIMARY KEY,
  income_id UUID REFERENCES incomes(id),
  product_id UUID REFERENCES products(id),
  -- ... other columns
);
```

---

## 📊 ALUR DATA: CUSTOMER → INCOME → PIUTANG

### Flow Diagram:

```
┌─────────────────┐
│ Select CUSTOMER │
│                 │
│ - Name          │
│ - Credit Limit  │
│ - Payment Terms │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Input INCOME   │
│                 │
│ - Type & Cat    │
│ - Products      │
│ - Payment Info  │
└────────┬────────┘
         │
         ▼
    Payment Type?
    ┌────┴────┐
    │ Cash    │ Tempo
    ▼         ▼
┌───────┐  ┌──────────┐
│LUNAS  │  │ PIUTANG  │
│(Paid) │  │ (AR)     │
└───────┘  └─────┬────┘
                 │
                 ▼
        ┌────────────────┐
        │ Update CUSTOMER│
        │ outstanding_   │
        │ balance        │
        └────────────────┘
                 │
                 ▼
        ┌────────────────┐
        │ AR Aging Report│
        │ Reminder System│
        └────────────────┘
```

---

## 💡 USE CASES & SCENARIOS

### Use Case 1: **Product Sales (Operating Income)**

```
User jual produk ke "Toko Jaya"
↓
1. Select Customer: "Toko Jaya"
2. Input Income:
   - Type: Operating
   - Category: Product Sales
   - Payment: Tempo 30 hari
3. Add Products:
   - Produk A: 10 pcs × Rp 50.000 = Rp 500.000
   - Produk B: 5 pcs × Rp 100.000 = Rp 500.000
   - Subtotal: Rp 1.000.000
4. Apply Discount: 5% = Rp 50.000
5. Add PPN: 11% × Rp 950.000 = Rp 104.500
6. Grand Total: Rp 1.054.500
↓
Auto-update:
- customers.outstanding_balance += Rp 1.054.500
- customers.total_purchases += Rp 1.054.500
- Due date = today + 30 days
```

### Use Case 2: **Asset Sale (Investing Income)**

```
User jual mesin lama
↓
1. Input Income:
   - Type: Investing
   - Category: Asset Sale
   - Asset Name: Mesin Produksi A
   - Sale Price: Rp 50.000.000
   - Payment: Transfer (Lunas)
2. Grand Total: Rp 50.000.000
3. Payment Status: Paid
↓
Result:
- Cash flow: +Rp 50.000.000
- No piutang (paid immediately)
```

### Use Case 3: **Loan Receipt (Financing Income)**

```
User terima pinjaman dari bank
↓
1. Input Income:
   - Type: Financing
   - Category: Loan Receipt
   - Loan ID: Link to loans table
   - Amount: Rp 100.000.000
   - Payment: Transfer
2. Grand Total: Rp 100.000.000
3. Payment Status: Paid
↓
Result:
- Cash flow: +Rp 100.000.000
- Track loan repayment in expenses
```

### Use Case 4: **Payment Collection (Piutang)**

```
Customer bayar piutang yang jatuh tempo
↓
1. Find unpaid income (piutang)
2. Update:
   - paid_amount += payment received
   - remaining_payment = grand_total - paid_amount
   - payment_status = 'paid' (if fully paid)
   - payment_date = today
↓
Auto-trigger:
- Update customers.outstanding_balance
- Trigger get_piutang_aging() refresh
```

---

## 📈 ANALYTICS & REPORTING

### 1. **Revenue Summary**

```sql
-- Get revenue by income type
SELECT * FROM get_revenue_summary(
  p_owner_id := auth.uid(),
  p_start_date := '2025-01-01',
  p_end_date := '2025-12-31',
  p_income_type := NULL -- All types
);

-- Returns:
- income_type, income_category
- total_revenue, total_paid, total_outstanding
- total_profit (from income_items)
- transaction_count, avg_transaction_value
```

### 2. **Operating Income Breakdown**

```sql
-- Detailed sales performance
SELECT * FROM get_operating_income_breakdown(
  p_owner_id := auth.uid(),
  p_start_date := CURRENT_DATE - INTERVAL '30 days',
  p_end_date := CURRENT_DATE
);

-- Returns per day:
- total_sales (revenue)
- total_cost (COGS)
- gross_profit
- profit_margin (%)
- transaction_count
```

### 3. **Piutang Aging Report**

```sql
-- AR aging analysis
SELECT * FROM get_piutang_aging(auth.uid());

-- Returns:
- customer_id, customer_name
- invoice_number, income_date, due_date
- days_overdue
- remaining_payment
- aging_category: current, 1-30 days, 31-60, 61-90, over 90 days
```

### 4. **KPI Dashboard Queries**

```sql
-- Total Revenue (Operating Only)
SELECT SUM(grand_total) 
FROM incomes 
WHERE owner_id = auth.uid() 
  AND income_type = 'operating'
  AND income_date BETWEEN '2025-01-01' AND '2025-12-31';

-- Total Piutang (Outstanding AR)
SELECT SUM(remaining_payment) 
FROM incomes 
WHERE owner_id = auth.uid() 
  AND payment_status IN ('unpaid', 'partial');

-- Gross Profit
SELECT SUM(total_profit) 
FROM income_items 
WHERE owner_id = auth.uid()
  AND created_at BETWEEN '2025-01-01' AND '2025-12-31';

-- Profit Margin (%)
SELECT 
  (SUM(ii.total_profit) / SUM(i.grand_total)) * 100 AS profit_margin_pct
FROM incomes i
LEFT JOIN income_items ii ON ii.income_id = i.id
WHERE i.owner_id = auth.uid()
  AND i.income_type = 'operating';
```

---

## 📁 FILE STRUCTURE

```
sql/domain/finance/
├── incomes.schema.sql      (Tables: incomes + income_items)
├── incomes.logic.sql       (9 functions + 6 triggers)
├── incomes.policies.sql    (RLS policies)
├── incomes.index.sql       (32 indexes + 20 constraints)
└── incomes.README.md       (This file)
```

### File Details:

| File | Size | Purpose | Key Features |
|------|------|---------|--------------|
| **schema.sql** | 240 lines | Table definitions | 3-tier classification, payment tracking, profit calculation |
| **logic.sql** | 320 lines | Business logic | Grand total calc, payment handling, revenue analytics, AR aging |
| **policies.sql** | 140 lines | Security | 8 RLS policies (4 per table) |
| **index.sql** | 400 lines | Performance | 32 indexes, 20 constraints, full-text search |

---

## 🔑 KEY FEATURES

### 1. **3-Tier Classification System**

```
Level 1: income_type (operating / investing / financing)
Level 2: income_category (product_sales, service_income, etc)
Level 3: income_description (free text details)
```

**Benefits:**
- Granular revenue analysis
- Financial reporting compliance
- Easy filtering & segmentation

### 2. **Payment Handling**

```sql
-- Payment Methods:
- 'cash': Paid immediately (no piutang)
- 'transfer': Bank transfer (no piutang)
- 'tempo': Credit sales (creates piutang)

-- Payment Status (auto-updated by trigger):
- 'unpaid': paid_amount = 0
- 'partial': 0 < paid_amount < grand_total
- 'paid': paid_amount >= grand_total
```

### 3. **Profit Tracking**

```sql
-- Income Items:
- price_per_unit: Selling price
- buy_price: Cost of goods sold (COGS)
- profit_per_unit: price_per_unit - buy_price
- total_profit: qty * profit_per_unit

-- Aggregate Profit:
SELECT SUM(total_profit) FROM income_items WHERE income_id = 'xxx';
```

### 4. **Auto-Calculations**

```sql
-- Triggers handle:
✅ Grand total calculation (subtotal - discount + PPN - PPh + other fees)
✅ Remaining payment (piutang tracking)
✅ Payment status (unpaid → partial → paid)
✅ Subtotal sync (from income_items)
✅ Customer outstanding balance
✅ Customer CLV metrics
```

### 5. **Revenue Analytics**

```sql
-- Built-in functions:
- get_revenue_summary(): By type/category
- get_operating_income_breakdown(): Daily sales performance
- get_piutang_aging(): AR aging analysis
```

---

## 🔄 INTEGRATION WITH OTHER ENTITIES

### 1. **With Customers**

```
Income created with customer_id → Update customer metrics
Payment received → Reduce customer outstanding_balance
Overdue payment → Alert via get_piutang_aging()
```

### 2. **With Products**

```
Income created → Add income_items (product_id)
Track: Best selling products, profit per product
Analytics: Product performance, inventory turnover
```

### 3. **With Dashboard KPI**

```
Total Revenue = SUM(incomes.grand_total) WHERE income_type = 'operating'
Total Piutang = SUM(incomes.remaining_payment)
Gross Profit = SUM(income_items.total_profit)
Profit Margin = gross_profit / revenue * 100
```

---

## 🛠️ MAINTENANCE NOTES

### Adding New Income Types:

```sql
-- Update constraint in incomes.index.sql
ALTER TABLE incomes 
DROP CONSTRAINT incomes_type_check;

ALTER TABLE incomes 
ADD CONSTRAINT incomes_type_check 
CHECK (income_type IN ('operating', 'investing', 'financing', 'other'));
```

### Adding New Fields:

```sql
-- Always use ALTER TABLE ADD COLUMN (additive only!)
ALTER TABLE incomes 
ADD COLUMN new_field TEXT;

-- Never DROP COLUMN (would break existing code)
```

### Adding New Analytics:

```sql
-- Add new function to incomes.logic.sql
CREATE OR REPLACE FUNCTION get_custom_report(...)
RETURNS TABLE (...) AS $$
-- Implementation
$$;
```

---

## 🧪 TESTING CHECKLIST

### Basic Operations:
- [ ] Create income (operating) with customer
- [ ] Add income_items (products)
- [ ] Verify subtotal auto-calculated
- [ ] Verify grand total auto-calculated
- [ ] Verify profit auto-calculated

### Payment Scenarios:
- [ ] Create income with payment_method = 'cash'
  - Verify: payment_status = 'paid', remaining_payment = 0
- [ ] Create income with payment_method = 'tempo'
  - Verify: payment_status = 'unpaid', remaining_payment = grand_total
- [ ] Partial payment
  - Verify: payment_status = 'partial', remaining_payment updated
- [ ] Full payment
  - Verify: payment_status = 'paid', payment_date set

### Customer Integration:
- [ ] Income with customer_id
  - Verify: customer.outstanding_balance updated
  - Verify: customer.total_purchases updated
  - Verify: customer.purchase_frequency updated
- [ ] Payment received
  - Verify: customer.outstanding_balance reduced

### Analytics Functions:
- [ ] Test get_revenue_summary()
- [ ] Test get_operating_income_breakdown()
- [ ] Test get_piutang_aging()
- [ ] Verify indexes used (check EXPLAIN ANALYZE)

### Constraints:
- [ ] Try invalid income_type → Should reject
- [ ] Try paid_amount > grand_total → Should reject
- [ ] Try negative values → Should reject
- [ ] Try discount > subtotal → Should reject

---

## 🚨 CRITICAL NOTES

### 1. **Existing Relations Preserved**
✅ All existing foreign keys intact:
- `customer_id → customers(id)`
- `product_id → products(id)` (in income_items)

### 2. **Additive Changes Only**
✅ No DROP TABLE, DROP COLUMN, or breaking changes
✅ All new fields have defaults
✅ Backward compatible with existing data

### 3. **Trigger Consistency**
✅ Pattern matches expenses & suppliers:
- Auto-update timestamps
- Auto-calculate totals
- Auto-sync related entities
- Performance optimized

---

## 📚 RELATED DOCUMENTATION

- **Finance Domain Overview:** `finance/README.md`
- **Customers Entity:** `finance/customers.README.md` (coming soon)
- **Expenses Entity:** `finance/expenses.README.md` (coming soon)
- **Database Schema:** `finance/incomes.schema.sql`
- **Business Logic:** `finance/incomes.logic.sql`

---

## 🎯 NEXT ENTITY

**Remaining Finance Entities:**
- ⏳ Loans (debt tracking)
- ⏳ Investments (investment portfolio)

**Next:** LOANS entity (similar pattern with repayment tracking)
