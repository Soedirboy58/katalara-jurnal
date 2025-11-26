# 💰 DOMAIN: FINANCE

**Status:** ✅ Production Ready  
**Version:** 2.0  
**Last Updated:** November 26, 2025

---

## 🎯 TANGGUNG JAWAB

Domain Finance mengelola seluruh aspek keuangan bisnis UMKM dengan struktur modular:

### **Core Entities:**
* **Expenses** ↔ **Suppliers** - Pengeluaran & manajemen hutang (payables)
* **Incomes** ↔ **Customers** ↔ **Products** - Pendapatan & manajemen piutang (receivables)
* **Loans** - Hutang/pinjaman dengan cicilan tracking
* **Investments** - Modal investor dengan profit sharing

---

## 🔗 RELASI ANTAR ENTITY

### 1. **Expenses ↔ Suppliers Flow**

```
┌──────────┐         ┌──────────┐
│ EXPENSES │────────>│SUPPLIERS │
│          │ updates │          │
│ - Amount │         │ - Balance│
│ - Tempo  │         │ - Hutang │
└──────────┘         └──────────┘
     │
     ▼
┌──────────────┐
│EXPENSE_ITEMS │
│ - Products   │
│ - Qty/Price  │
└──────────────┘
```

**Alur:**
1. User input expense dengan supplier
2. Jika payment_method = 'tempo' → Create hutang
3. Auto-update `suppliers.outstanding_balance`
4. Trigger credit limit check
5. Track via `get_expense_summary()`

### 2. **Incomes ↔ Customers ↔ Products Flow**

```
┌──────────┐         ┌───────────┐
│ INCOMES  │────────>│ CUSTOMERS │
│          │ updates │           │
│ - Amount │         │ - Balance │
│ - Tempo  │         │ - Piutang │
└─────┬────┘         └───────────┘
      │
      ▼
┌─────────────┐       ┌──────────┐
│INCOME_ITEMS │──────>│ PRODUCTS │
│ - Products  │ links │          │
│ - Qty/Price │       │ - Stock  │
│ - Profit    │       │ - Price  │
└─────────────┘       └──────────┘
```

**Alur:**
1. User input income dengan customer
2. Select products → Auto-fill price & calculate profit
3. Jika payment_method = 'tempo' → Create piutang
4. Auto-update `customers.outstanding_balance`
5. Auto-update `customers.total_purchases` & CLV metrics
6. Trigger credit limit check
7. Track via `get_revenue_summary()` & `get_piutang_aging()`

### 3. **Loans/Investments ↔ Incomes/Expenses**

```
┌─────────────┐
│    LOANS    │
│ (Hutang)    │
└──────┬──────┘
       │
       ├─> Loan Receipt → INCOMES (financing_income)
       │
       └─> Installment Payment → EXPENSES (financing_expense)

┌─────────────┐
│ INVESTMENTS │
│ (Modal)     │
└──────┬──────┘
       │
       ├─> Investment Receipt → INCOMES (financing_income)
       │
       └─> Profit Sharing → EXPENSES (financing_expense)
```

**Alur:**
1. **Loan Receipt**: Bank transfer masuk → Income (financing)
2. **Loan Payment**: Cicilan keluar → Expense (financing)
3. **Investment In**: Modal masuk → Income (financing)
4. **Profit Share Out**: Bagi hasil keluar → Expense (financing)

---

## 📊 TABEL INTI & PERAN

| Entity | Tables | Peran | Key Features |
|--------|--------|-------|--------------|
| **Expenses** | `expenses`, `expense_items` | Track pengeluaran operasional/investasi | 3-tier classification, payment tracking, supplier link |
| **Suppliers** | `suppliers` | Master data vendor | Credit limit, outstanding balance, payment terms |
| **Incomes** | `incomes`, `income_items` | Track pendapatan 3 kategori | Operating/Investing/Financing, profit tracking |
| **Customers** | `customers` | Master data pelanggan | CLV tracking, loyalty tiers, credit limit |
| **Loans** | `loans`, `loan_installments` | Hutang & cicilan | Repayment schedule, interest calculation |
| **Investments** | `investments`, `profit_sharing_history` | Modal investor | Profit sharing, ROI tracking |

---

## 🔄 ALUR DATA LENGKAP

### **Input Transaction Flow:**

```
┌─────────────────┐
│  USER INPUT     │
│  (Frontend)     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  VALIDATION & HOOKS     │
│  - useIncomeForm        │
│  - useExpenseForm       │
│  - usePaymentCalculation│
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  SAVE TO DATABASE       │
│  1. Header (incomes/    │
│     expenses)           │
│  2. Line Items          │
│  3. Trigger Cascade     │
└────────┬────────────────┘
         │
         ├─> UPDATE Supplier/Customer Balance
         ├─> CALCULATE Grand Total
         ├─> UPDATE Payment Status
         ├─> SYNC Product Stock (if applicable)
         └─> REFRESH KPI Stats
         │
         ▼
┌─────────────────────────┐
│  ANALYTICS & REPORTING  │
│  - get_revenue_summary()│
│  - get_expense_summary()│
│  - get_piutang_aging()  │
└─────────────────────────┘
```

### **Payment Collection Flow:**

```
Customer pays receivable:
1. Find unpaid income (piutang)
2. Update paid_amount
3. Trigger: update_customer_outstanding_balance()
4. Auto-update payment_status
5. Refresh AR aging report

Supplier payment:
1. Find unpaid expense (hutang)
2. Update paid_amount
3. Trigger: update_supplier_outstanding_balance()
4. Auto-update payment_status
5. Refresh AP aging report
```

---

## 📁 FILE STRUCTURE

```
finance/
├── README.md                      (Domain overview - this file)
├── finance.debug.sql              (Test queries for smoke testing)
│
├── expenses.schema.sql            (Tables: expenses, expense_items)
├── expenses.logic.sql             (9 functions + 6 triggers)
├── expenses.policies.sql          (RLS: 8 policies)
├── expenses.index.sql             (16 indexes + 5 constraints)
│
├── suppliers.schema.sql           (Table: suppliers)
├── suppliers.logic.sql            (5 functions + 1 trigger)
├── suppliers.policies.sql         (RLS: 4 policies)
├── suppliers.index.sql            (13 indexes + 7 constraints)
├── suppliers.README.md            (Supplier entity docs)
│
├── customers.schema.sql           (Table: customers)
├── customers.logic.sql            (6 functions + 2 triggers)
├── customers.policies.sql         (RLS: 4 policies)
├── customers.index.sql            (18 indexes + 10 constraints)
│
├── incomes.schema.sql             (Tables: incomes, income_items)
├── incomes.logic.sql              (9 functions + 6 triggers)
├── incomes.policies.sql           (RLS: 8 policies)
├── incomes.index.sql              (32 indexes + 20 constraints)
├── incomes.README.md              (Income entity docs)
│
├── loans.schema.sql               (Tables: loans, loan_installments)
├── loans.logic.sql                (8 functions + 6 triggers)
├── loans.policies.sql             (RLS: 8 policies)
├── loans.index.sql                (24 indexes + 26 constraints)
│
├── investments.schema.sql         (Tables: investments, profit_sharing_history)
├── investments.logic.sql          (8 functions + 6 triggers)
├── investments.policies.sql       (RLS: 8 policies)
└── investments.index.sql          (25 indexes + 23 constraints)
```

**Total Files:** 31 files (4 files per entity × 6 entities + 3 READMEs + 1 debug file + 1 domain README)  
**Pattern:** entity.{schema, logic, policies, index}.sql + README (for major entities)

**Statistics:**
- Total SQL Files: 24 (4 × 6 entities)
- Total Documentation: 4 READMEs (domain + 3 entities)
- Total Debug/Test: 1 file (finance.debug.sql)
- Total Lines of SQL: ~8,000+ lines
- Total Functions: 45+
- Total Triggers: 27+
- Total Indexes: 128+
- Total Constraints: 91+
- Total RLS Policies: 36 (6 per entity avg)

---

## DEPENDENCIES

**Depends on:**
- `core/users.sql` (auth.users, profiles)
- `core/business_config.sql` (businesses table)

**Used by:**
- Frontend: `/dashboard/input-income`
- Frontend: `/dashboard/input-expenses`
- Frontend: `/dashboard/finance/loans`
- API: `/api/income`, `/api/expenses`, `/api/kpi`

---

## MIGRASI SEQUENCE

**Safe Migration Order:**
1. `suppliers.schema.sql`
2. `customers.schema.sql`
3. `incomes.schema.sql`
4. `expenses.schema.sql`
5. `loans.schema.sql`
6. `investments.schema.sql`
7. `*.logic.sql` (functions & triggers)
8. `*.policies.sql` (RLS policies)

---

## BACKWARD COMPATIBILITY

✅ **Compatible dengan existing data**
- Tidak ada DROP TABLE (kecuali development)
- Hanya ADD/ALTER column dengan DEFAULT
- RLS policies additive (tidak menghapus existing)

⚠️ **Breaking Changes:** None in production

---

## 🧪 TESTING & SMOKE TESTS

**Test Queries:** See `finance.debug.sql` for comprehensive smoke tests

**Quick Health Check:**
```sql
-- Verify all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('incomes', 'expenses', 'suppliers', 'customers', 'loans', 'investments');

-- Verify RLS enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('incomes', 'expenses', 'suppliers', 'customers');

-- Verify functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%income%' OR routine_name LIKE '%expense%';
```

---

## 🚀 DEPLOYMENT CHECKLIST

**Pre-Deployment:**
- [ ] Run `finance.debug.sql` smoke tests
- [ ] Verify no syntax errors in all .sql files
- [ ] Check foreign key constraints
- [ ] Validate RLS policies

**Deployment Order:**
1. Run schema files first (expenses, suppliers, customers, incomes, loans, investments)
2. Run logic files (functions & triggers)
3. Run policies files (RLS)
4. Run index files (performance)
5. Run smoke tests from `finance.debug.sql`

**Post-Deployment:**
- [ ] Verify all tables created
- [ ] Test basic CRUD operations
- [ ] Check trigger execution
- [ ] Validate RLS working
- [ ] Run performance benchmarks

---

## 📚 ENTITY DOCUMENTATION

**Detailed Guides:**
- **Suppliers:** See `suppliers.README.md` - Credit limit, payment tracking
- **Incomes:** See `incomes.README.md` - 3-tier classification, profit tracking, AR aging

**Summary by Entity:**
- **Expenses:** Operating/investing/financing classification, supplier sync, payment tracking
- **Suppliers:** Credit control, outstanding balance, payment terms management
- **Customers:** CLV tracking, loyalty tiers (Bronze/Silver/Gold/Platinum), credit limits
- **Incomes:** 3-tier revenue classification, profit calculation, AR aging, customer sync
- **Loans:** Installment generation, interest calculation, overdue tracking, payment reminders
- **Investments:** ROI tracking, profit sharing (percentage/fixed/revenue-based), buyback clause

---

**Domain Owner:** Finance Team  
**Contributors:** Development Team  
**Last Updated:** November 26, 2025  
**Status:** ✅ Production Ready - All 6 entities complete (100%)
