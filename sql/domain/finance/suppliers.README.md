# 📦 SUPPLIERS ENTITY - Finance Domain

**Status:** ✅ Complete  
**Version:** 1.0  
**Last Updated:** November 26, 2025

---

## 🎯 PERAN SUPPLIERS DALAM FINANCE DOMAIN

Suppliers adalah **master data vendor/pemasok** yang digunakan untuk:

### 1. **Expense Tracking**
- Setiap expense bisa dikaitkan dengan supplier tertentu
- Tracking total pembelian per supplier
- Analisis performa supplier

### 2. **Payables Management**
- Monitor hutang kepada supplier (`outstanding_balance`)
- Track credit limit untuk mencegah over-limit
- Reminder pembayaran hutang yang jatuh tempo

### 3. **Procurement Analytics**
- Supplier mana yang paling sering digunakan?
- Supplier mana yang total pembeliannya tertinggi?
- Rata-rata lama pembayaran per supplier

### 4. **Relationship Management**
- Rating supplier (1-5 bintang)
- Notes internal tentang supplier
- Contact info untuk follow-up

---

## 🔗 RELASI DENGAN EXPENSES

### Database Relationship:
```
suppliers (1) ----< (many) expenses
```

### Koneksi:
```sql
-- expenses table
CREATE TABLE expenses (
  id UUID PRIMARY KEY,
  supplier_id UUID REFERENCES suppliers(id),
  -- ... other columns
)
```

### Use Cases:

#### Case 1: Pembelian dari Supplier
```
User beli barang dari "Toko Sejahtera"
↓
1. Pilih Supplier: "Toko Sejahtera" (dari dropdown)
2. Input expense details
3. Save expense
↓
Auto-update:
- suppliers.total_purchases += expense.grand_total
- suppliers.last_purchase_date = expense.expense_date
- suppliers.outstanding_balance += expense.remaining_payment (jika tempo)
```

#### Case 2: Pembayaran Hutang
```
User bayar hutang ke "Toko Sejahtera"
↓
1. Update expense payment_status = 'paid'
2. Trigger update_supplier_outstanding_balance()
↓
Auto-update:
- suppliers.outstanding_balance -= expense.remaining_payment
```

#### Case 3: Credit Limit Check
```
User input expense baru dengan tempo
↓
1. Check: outstanding_balance + new_expense.remaining_payment > credit_limit?
2. If YES → REJECT with error message
3. If NO → Allow transaction
```

---

## 📊 ALUR DATA: SUPPLIER → EXPENSE → HUTANG

### Flow Diagram:

```
┌─────────────────┐
│  Create/Select  │
│    SUPPLIER     │
│                 │
│ - Name          │
│ - Contact       │
│ - Credit Limit  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Input EXPENSE  │
│                 │
│ - Link supplier │
│ - Amount        │
│ - Payment type  │
└────────┬────────┘
         │
         ▼
    Is Tempo?
    ┌───┴───┐
    │ YES   │ NO
    ▼       ▼
┌───────┐  ┌────────┐
│HUTANG │  │ LUNAS  │
│(Debt) │  │ (Paid) │
└───┬───┘  └────────┘
    │
    ▼
┌─────────────────────┐
│ Update SUPPLIER     │
│ outstanding_balance │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ Check Credit Limit  │
│ Send Alert if       │
│ over limit          │
└─────────────────────┘
```

### Detailed Steps:

#### Step 1: Create Supplier
```sql
INSERT INTO suppliers (owner_id, name, credit_limit)
VALUES (auth.uid(), 'Toko Sejahtera', 50000000);
-- Result: supplier_id = 'abc-123'
```

#### Step 2: Create Expense (Tempo)
```sql
INSERT INTO expenses (
  owner_id, 
  supplier_id, 
  grand_total, 
  payment_method,
  remaining_payment
)
VALUES (
  auth.uid(), 
  'abc-123',     -- supplier_id
  10000000,      -- grand_total
  'tempo',       -- payment_method
  10000000       -- remaining_payment
);
```

#### Step 3: Auto-Update Supplier (via trigger)
```sql
-- Triggered automatically by update_supplier_outstanding_balance()
UPDATE suppliers
SET 
  outstanding_balance = outstanding_balance + 10000000,
  total_purchases = total_purchases + 10000000,
  last_purchase_date = NOW()
WHERE id = 'abc-123';
```

#### Step 4: Credit Limit Check (via trigger)
```sql
-- Triggered by check_supplier_credit_limit()
IF (outstanding_balance + remaining_payment) > credit_limit THEN
  RAISE EXCEPTION 'Credit limit exceeded!'
END IF;
```

#### Step 5: Payment (User Action)
```sql
UPDATE expenses
SET 
  payment_status = 'paid',
  remaining_payment = 0,
  payment_date = NOW()
WHERE id = 'expense-xyz';

-- Auto-trigger update_supplier_outstanding_balance()
-- Result: suppliers.outstanding_balance -= 10000000
```

---

## 📁 FILE STRUCTURE

```
sql/domain/finance/
├── suppliers.schema.sql      (Table structure + basic indexes)
├── suppliers.logic.sql       (Functions + triggers)
├── suppliers.policies.sql    (RLS policies)
├── suppliers.index.sql       (Performance indexes + constraints)
└── suppliers.README.md       (This file)
```

### File Details:

| File | Size | Purpose | Key Features |
|------|------|---------|--------------|
| **schema.sql** | 180 lines | Table definition | Contact info, payment terms, credit tracking |
| **logic.sql** | 260 lines | Business logic | 5 functions, 1 trigger, credit limit check |
| **policies.sql** | 120 lines | Security | 4 RLS policies (SELECT, INSERT, UPDATE, DELETE) |
| **index.sql** | 240 lines | Performance | 13 indexes, 7 constraints, full-text search |

---

## 🔑 KEY FEATURES

### 1. **Credit Limit Control**
```sql
-- Function: check_supplier_credit_limit()
-- Prevents creating expenses that exceed supplier credit limit
-- Triggered BEFORE INSERT/UPDATE on expenses table
```

**Example:**
```
Supplier "Toko A" credit_limit = 50 juta
Current outstanding_balance = 40 juta
New expense = 15 juta
Total would be = 55 juta → ❌ REJECTED!
```

### 2. **Auto-Update Financials**
```sql
-- Function: update_supplier_outstanding_balance()
-- Function: update_supplier_total_purchases()
-- Auto-sync supplier financial data from expenses
```

**Triggered by:**
- New expense created
- Expense payment status changed
- Expense deleted

### 3. **Performance Optimization**
```sql
-- 13 indexes created:
- idx_suppliers_owner (primary filter)
- idx_suppliers_active (dropdown lists)
- idx_suppliers_outstanding (payables monitoring)
- idx_suppliers_overlimit (alert system)
- idx_suppliers_name_search (full-text search)
-- ... and 8 more
```

### 4. **Data Validation**
```sql
-- 7 constraints:
- credit_limit >= 0
- outstanding_balance >= 0
- total_purchases >= 0
- default_payment_term_days >= 0
- rating BETWEEN 1 AND 5
- email format validation
```

---

## 📈 USE CASES

### Use Case 1: **Supplier Performance Dashboard**
```sql
-- Query menggunakan get_supplier_summary()
SELECT * FROM get_supplier_summary(auth.uid());

-- Returns:
- Total purchases per supplier
- Outstanding balance
- Number of transactions
- Average payment days
- Over-limit status
```

### Use Case 2: **Payables Monitoring**
```sql
-- Suppliers with outstanding balance
SELECT * FROM suppliers
WHERE owner_id = auth.uid()
  AND outstanding_balance > 0
ORDER BY outstanding_balance DESC;

-- Uses index: idx_suppliers_outstanding
```

### Use Case 3: **Over-Limit Alerts**
```sql
-- Suppliers exceeding credit limit
SELECT 
  name,
  credit_limit,
  outstanding_balance,
  (outstanding_balance - credit_limit) as over_amount
FROM suppliers
WHERE owner_id = auth.uid()
  AND credit_limit > 0
  AND outstanding_balance > credit_limit;

-- Uses index: idx_suppliers_overlimit
```

### Use Case 4: **Supplier Search**
```sql
-- Full-text search by name
SELECT * FROM suppliers
WHERE to_tsvector('simple', name) @@ to_tsquery('simple', 'toko');

-- Uses index: idx_suppliers_name_search
```

---

## 🔄 INTEGRATION WITH OTHER ENTITIES

### 1. **With Expenses**
```
Supplier selected → Auto-fill payment_term_days
Expense created → Update supplier financials
Payment made → Reduce outstanding_balance
```

### 2. **With Products (Indirect)**
```
Supplier provides products → Track via expense_items
Analyze: Which supplier provides which products
```

### 3. **With Dashboard KPI**
```
Total Payables = SUM(suppliers.outstanding_balance)
Top Suppliers = ORDER BY total_purchases DESC
Overdue Payments = JOIN with expenses.due_date
```

---

## 🛠️ MAINTENANCE NOTES

### Adding New Supplier Fields:
```sql
-- Always use ALTER TABLE ADD COLUMN (additive only!)
ALTER TABLE suppliers 
ADD COLUMN new_field TEXT;

-- Never DROP COLUMN (would break existing code)
```

### Adding New Indexes:
```sql
-- Add to suppliers.index.sql
CREATE INDEX idx_suppliers_new_field 
ON suppliers(owner_id, new_field);
```

### Adding New Functions:
```sql
-- Add to suppliers.logic.sql
CREATE OR REPLACE FUNCTION new_supplier_function()
RETURNS ...
```

---

## 🧪 TESTING CHECKLIST

- [ ] Create supplier with credit limit
- [ ] Create expense linked to supplier (cash)
- [ ] Create expense linked to supplier (tempo)
- [ ] Verify `outstanding_balance` auto-updated
- [ ] Verify `total_purchases` auto-updated
- [ ] Try to exceed credit limit → Should be rejected
- [ ] Make payment → Verify `outstanding_balance` reduced
- [ ] Test full-text search
- [ ] Test supplier filtering (active/inactive)
- [ ] Test get_supplier_summary() function
- [ ] Verify RLS policies (user can only see own suppliers)

---

## 📚 RELATED DOCUMENTATION

- **Finance Domain Overview:** `finance/README.md`
- **Expenses Entity:** `finance/expenses.README.md` (coming soon)
- **Database Schema:** `finance/suppliers.schema.sql`
- **Business Logic:** `finance/suppliers.logic.sql`

---

**Next Entity:** CUSTOMERS (similar pattern for income tracking)
