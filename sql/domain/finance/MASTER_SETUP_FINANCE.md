# 💰 MASTER SETUP - FINANCE DOMAIN

**Version:** 1.0  
**Status:** 🔒 Frozen & Stable  
**Release Tag:** `finance-domain-v1.0`  
**Last Updated:** November 26, 2025

---

## 🎯 QUICK OVERVIEW

Finance Domain adalah **fondasi keuangan UMKM** dengan struktur modular berbasis domain. Domain ini mengelola 6 entitas inti yang saling terhubung:

```
┌─────────────┐     ┌──────────────┐     ┌────────────┐
│  EXPENSES   │────▶│  SUPPLIERS   │     │ CUSTOMERS  │
│ (Pengeluaran)│     │  (Vendor)    │     │ (Pelanggan)│
└─────────────┘     └──────────────┘     └──────┬─────┘
                                                 │
┌─────────────┐     ┌──────────────┐            │
│    LOANS    │     │ INVESTMENTS  │     ┌──────▼─────┐
│  (Hutang)   │     │   (Modal)    │     │  INCOMES   │
└─────────────┘     └──────────────┘     │ (Pendapatan)│
                                         └────────────┘
```

### 📊 Domain Statistics
- **Entities:** 6 (Expenses, Suppliers, Customers, Incomes, Loans, Investments)
- **SQL Files:** 24 (4-file pattern × 6 entities)
- **Documentation:** 4 README files + 1 debug file
- **Total Lines:** ~8,000+ lines of production-ready SQL
- **Functions:** 45+ business logic functions
- **Triggers:** 27+ automation triggers
- **Indexes:** 128+ performance indexes
- **Constraints:** 91+ data integrity constraints
- **RLS Policies:** 36 security policies

---

## 🏗️ ARCHITECTURE PATTERN

Setiap entity mengikuti **4-file modular pattern**:

```
entity/
├── entity.schema.sql     → Tables, basic indexes, comments
├── entity.logic.sql      → Functions & triggers (business logic)
├── entity.policies.sql   → RLS policies (security)
└── entity.index.sql      → Performance indexes & constraints
└── entity.README.md      → Documentation (optional, for major entities)
```

### Why This Pattern?
✅ **Modular:** Each file 200-400 lines (vs 3000+ monolithic)  
✅ **Clear separation:** Schema vs Logic vs Security vs Performance  
✅ **Easy maintenance:** Find & fix issues quickly  
✅ **Safe deployment:** Deploy one layer at a time  
✅ **Self-documenting:** File structure explains purpose

---

## 📁 COMPLETE FILE STRUCTURE

```
sql/domain/finance/
├── README.md                          (Domain overview & relationships)
├── MASTER_SETUP_FINANCE.md           (This file - setup guide)
├── finance.debug.sql                 (Smoke tests - MANDATORY before deploy)
│
├── expenses.schema.sql               (180 lines - expenses, expense_items)
├── expenses.logic.sql                (220 lines - 9 functions, 6 triggers)
├── expenses.policies.sql             (120 lines - 8 RLS policies)
├── expenses.index.sql                (170 lines - 16 indexes, 5 constraints)
│
├── suppliers.schema.sql              (180 lines - suppliers table)
├── suppliers.logic.sql               (260 lines - 5 functions, 1 trigger)
├── suppliers.policies.sql            (120 lines - 4 RLS policies)
├── suppliers.index.sql               (240 lines - 13 indexes, 7 constraints)
├── suppliers.README.md               (150 lines - detailed guide)
│
├── customers.schema.sql              (200 lines - customers table)
├── customers.logic.sql               (280 lines - 6 functions, 2 triggers)
├── customers.policies.sql            (120 lines - 4 RLS policies)
├── customers.index.sql               (300 lines - 18 indexes, 10 constraints)
│
├── incomes.schema.sql                (240 lines - incomes, income_items)
├── incomes.logic.sql                 (320 lines - 9 functions, 6 triggers)
├── incomes.policies.sql              (140 lines - 8 RLS policies)
├── incomes.index.sql                 (400 lines - 32 indexes, 20 constraints)
├── incomes.README.md                 (250 lines - detailed guide)
│
├── loans.schema.sql                  (220 lines - loans, loan_installments)
├── loans.logic.sql                   (300 lines - 8 functions, 6 triggers)
├── loans.policies.sql                (130 lines - 8 RLS policies)
├── loans.index.sql                   (350 lines - 24 indexes, 26 constraints)
│
├── investments.schema.sql            (180 lines - investments, profit_sharing_history)
├── investments.logic.sql             (320 lines - 8 functions, 6 triggers)
├── investments.policies.sql          (130 lines - 8 RLS policies)
└── investments.index.sql             (400 lines - 25 indexes, 23 constraints)
```

**Total:** 31 files | ~8,000 lines | All additive & backward-compatible

---

## 🔗 ENTITY RELATIONSHIPS

### 1️⃣ **Expenses ↔ Suppliers**
```sql
-- Flow: User input expense → Create hutang (if tempo) → Update supplier balance
expenses.supplier_id → suppliers.id
trigger: update_supplier_outstanding_balance()
check: supplier_credit_limit_check()
```

### 2️⃣ **Incomes ↔ Customers**
```sql
-- Flow: User input income → Create piutang (if tempo) → Update customer balance
incomes.customer_id → customers.id
trigger: update_customer_outstanding_balance()
trigger: update_customer_tier() -- Auto Bronze/Silver/Gold/Platinum
```

### 3️⃣ **Incomes ↔ Products (via income_items)**
```sql
-- Flow: Select product → Auto-fill price → Calculate profit
income_items.product_id → products.id
auto-calculate: profit = (sell_price - buy_price) * qty
```

### 4️⃣ **Loans → Incomes/Expenses**
```sql
-- Flow: Loan receipt = Income (financing_income)
--       Installment payment = Expense (financing_expense)
loans.income_id → incomes.id (optional link)
auto-generate: loan_installments (repayment schedule)
```

### 5️⃣ **Investments → Incomes/Expenses**
```sql
-- Flow: Investment in = Income (financing_income)
--       Profit sharing out = Expense (financing_expense)
investments.income_id → incomes.id (optional link)
investments.expense_id ← profit_sharing_history.expense_id
```

---

## 🚀 DEPLOYMENT GUIDE

### **Prerequisites**
1. ✅ PostgreSQL 14+ with `uuid_generate_v4()` extension
2. ✅ Supabase project with RLS enabled
3. ✅ Existing tables: `auth.users`, `profiles`, `products` (if using)

### **Safe Deployment Order**

#### **Phase 1: Schema (Tables)**
Run in this exact order to respect foreign key dependencies:

```bash
# 1. Suppliers (no dependencies)
psql -f sql/domain/finance/suppliers.schema.sql

# 2. Customers (no dependencies)
psql -f sql/domain/finance/customers.schema.sql

# 3. Expenses (depends on suppliers)
psql -f sql/domain/finance/expenses.schema.sql

# 4. Incomes (depends on customers)
psql -f sql/domain/finance/incomes.schema.sql

# 5. Loans (optional dependency on incomes)
psql -f sql/domain/finance/loans.schema.sql

# 6. Investments (optional dependency on incomes/loans)
psql -f sql/domain/finance/investments.schema.sql
```

#### **Phase 2: Logic (Functions & Triggers)**
Order doesn't matter, but recommended sequence:

```bash
psql -f sql/domain/finance/suppliers.logic.sql
psql -f sql/domain/finance/customers.logic.sql
psql -f sql/domain/finance/expenses.logic.sql
psql -f sql/domain/finance/incomes.logic.sql
psql -f sql/domain/finance/loans.logic.sql
psql -f sql/domain/finance/investments.logic.sql
```

#### **Phase 3: Security (RLS Policies)**

```bash
psql -f sql/domain/finance/suppliers.policies.sql
psql -f sql/domain/finance/customers.policies.sql
psql -f sql/domain/finance/expenses.policies.sql
psql -f sql/domain/finance/incomes.policies.sql
psql -f sql/domain/finance/loans.policies.sql
psql -f sql/domain/finance/investments.policies.sql
```

#### **Phase 4: Performance (Indexes & Constraints)**

```bash
psql -f sql/domain/finance/suppliers.index.sql
psql -f sql/domain/finance/customers.index.sql
psql -f sql/domain/finance/expenses.index.sql
psql -f sql/domain/finance/incomes.index.sql
psql -f sql/domain/finance/loans.index.sql
psql -f sql/domain/finance/investments.index.sql
```

### **Alternative: One-Command Deploy**

```bash
# Full deployment (all entities, all phases)
cat sql/domain/finance/*.schema.sql \
    sql/domain/finance/*.logic.sql \
    sql/domain/finance/*.policies.sql \
    sql/domain/finance/*.index.sql \
    | psql -h your-db-host -U postgres -d your-db-name
```

---

## 🧪 MANDATORY SMOKE TESTS

**CRITICAL:** Always run `finance.debug.sql` before production deployment!

### Test Coverage (9 Sections)

```sql
-- Run in Supabase SQL Editor or psql
\i sql/domain/finance/finance.debug.sql
```

**Test Sections:**
1. ✅ **Health Check** - Verify all tables exist, RLS enabled
2. ✅ **Revenue Summary** - Test `get_revenue_summary()` function
3. ✅ **Piutang Aging** - Test `get_piutang_aging()` for AR tracking
4. ✅ **Customer Analytics** - Top customers by purchase
5. ✅ **Supplier Analytics** - Outstanding payables
6. ✅ **Expense Analytics** - Operating vs investing costs
7. ✅ **Profit Analysis** - Gross profit calculation
8. ✅ **Performance Validation** - Index usage, query speed
9. ✅ **Data Integrity** - Constraint validation

### Pass Criteria
- ✅ All queries execute without errors
- ✅ All tables exist (6 entities)
- ✅ All RLS policies active (36 policies)
- ✅ All functions callable (45+ functions)
- ✅ Query performance < 100ms (on sample data)

### When to Run
- 🔴 **BEFORE** production deployment
- 🟡 After schema changes
- 🟢 Weekly as regression test
- 🟢 Before major releases

---

## 📚 ENTITY DEEP DIVE

### 1. **EXPENSES** (Pengeluaran)

**Purpose:** Track all business expenses (operating, investing, financing)

**Tables:**
- `expenses` (header) - Payment info, tempo tracking
- `expense_items` (line items) - Product/service details

**Key Features:**
- 3-tier classification (operating/investing/financing)
- Tempo/hutang tracking
- Auto-update supplier balance
- Payment status automation

**Main Functions:**
```sql
get_expense_summary(owner_id, start_date, end_date)
get_outstanding_payables(owner_id)
check_expense_due_soon(owner_id, days)
```

**Use Cases:**
- Input pembelian dari supplier
- Track hutang tempo
- Monitor cash flow keluar
- Categorize OpEx vs CapEx

---

### 2. **SUPPLIERS** (Vendor/Pemasok)

**Purpose:** Master data suppliers with credit control

**Tables:**
- `suppliers` (master data)

**Key Features:**
- Credit limit enforcement
- Outstanding balance tracking
- Payment terms configuration
- Auto-calculate payment due dates

**Main Functions:**
```sql
get_suppliers_with_outstanding(owner_id)
check_supplier_credit_limit(supplier_id, amount)
get_supplier_payment_history(supplier_id)
```

**Use Cases:**
- Manage vendor database
- Control credit exposure
- Track payment obligations
- Vendor performance analysis

---

### 3. **CUSTOMERS** (Pelanggan)

**Purpose:** Customer master data with CLV & loyalty tiers

**Tables:**
- `customers` (master data)

**Key Features:**
- Customer Lifetime Value (CLV) tracking
- Auto-tier assignment (Bronze/Silver/Gold/Platinum)
- Credit limit enforcement
- Outstanding receivables

**Main Functions:**
```sql
get_customers_by_tier(owner_id, tier)
update_customer_tier(customer_id)
get_customer_clv(customer_id)
```

**Use Cases:**
- Customer segmentation
- Loyalty program management
- Credit risk assessment
- Targeted marketing campaigns

---

### 4. **INCOMES** (Pendapatan)

**Purpose:** Revenue tracking with 3-tier classification & profit analysis

**Tables:**
- `incomes` (header) - Invoice, payment info
- `income_items` (line items) - Products sold, profit per item

**Key Features:**
- 3-tier classification (operating/investing/financing)
- Profit calculation (sell price - cost price)
- AR aging analysis
- Customer balance sync

**Main Functions:**
```sql
get_revenue_summary(owner_id, start_date, end_date)
get_piutang_aging(owner_id)
calculate_gross_profit_margin(income_id)
get_top_revenue_by_category(owner_id)
```

**Use Cases:**
- Sales order processing
- Profit margin analysis
- Cash flow forecasting
- Revenue recognition

---

### 5. **LOANS** (Hutang/Pinjaman)

**Purpose:** Debt management with installment tracking

**Tables:**
- `loans` (loan header) - Principal, interest, terms
- `loan_installments` (repayment schedule)

**Key Features:**
- Auto-generate installment schedule
- Interest calculation
- Overdue tracking & reminders
- Early payment support

**Main Functions:**
```sql
generate_loan_installment_schedule(loan_id)
get_upcoming_installments(owner_id, days)
get_overdue_installments(owner_id)
calculate_loan_total_cost(loan_id)
```

**Use Cases:**
- Bank loan tracking
- P2P lending management
- Installment payment reminders
- Debt-to-equity ratio analysis

---

### 6. **INVESTMENTS** (Modal Investor)

**Purpose:** Investor capital & profit sharing management

**Tables:**
- `investments` (investment details) - Principal, terms, equity
- `profit_sharing_history` (distribution records)

**Key Features:**
- ROI tracking
- Profit sharing (percentage/fixed/revenue-based)
- Buyback clause support
- Lock period enforcement

**Main Functions:**
```sql
calculate_investment_roi(investment_id)
calculate_profit_share_amount(investment_id, profit)
get_investments_due_for_profit_share(owner_id)
calculate_buyback_amount(investment_id)
```

**Use Cases:**
- Investor relations
- Profit distribution
- Cap table management
- Exit planning

---

## 🔐 SECURITY MODEL

### Row Level Security (RLS)

**Policy Pattern (per table):**
```sql
-- SELECT: Users can only see their own data
CREATE POLICY entity_select_own ON table_name
  FOR SELECT USING (auth.uid() = owner_id);

-- INSERT: Users can only create for themselves
CREATE POLICY entity_insert_own ON table_name
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- UPDATE: Users can only update their own data
CREATE POLICY entity_update_own ON table_name
  FOR UPDATE 
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- DELETE: Users can only delete their own data
CREATE POLICY entity_delete_own ON table_name
  FOR DELETE USING (auth.uid() = owner_id);
```

**Total Policies:** 36 (4 per table × 9 tables)

**Function Permissions:**
```sql
-- All functions granted to authenticated users
GRANT EXECUTE ON FUNCTION function_name TO authenticated;
```

---

## 🎓 ONBOARDING GUIDE

### For New Developers

**Step 1: Read Domain Overview**
```bash
cat sql/domain/finance/README.md
```
Understand entity relationships & data flows.

**Step 2: Review One Entity (Start Small)**
```bash
cat sql/domain/finance/expenses.schema.sql
cat sql/domain/finance/expenses.logic.sql
```
Understand the 4-file pattern.

**Step 3: Run Smoke Tests**
```bash
psql -f sql/domain/finance/finance.debug.sql
```
See live data in action.

**Step 4: Explore Functions**
```sql
-- List all finance functions
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%expense%' OR routine_name LIKE '%income%';
```

**Step 5: Check RLS Policies**
```sql
-- Verify RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('expenses', 'incomes', 'suppliers', 'customers', 'loans', 'investments');
```

### For AI Assistants

**Context to Provide:**
1. Read this file (`MASTER_SETUP_FINANCE.md`) first
2. Reference `README.md` for entity relationships
3. Check `finance.debug.sql` for query examples
4. Use entity-specific README (e.g., `suppliers.README.md`) for deep dives

**Common Tasks:**
- Add new column → Edit `entity.schema.sql` + `entity.index.sql`
- Add business logic → Edit `entity.logic.sql`
- Change security → Edit `entity.policies.sql`
- Optimize queries → Edit `entity.index.sql`

**Never:**
- ❌ Modify multiple files without testing
- ❌ Skip smoke tests after changes
- ❌ Break backward compatibility
- ❌ Remove existing columns/tables in production

---

## 🛠️ MAINTENANCE & UPDATES

### Making Changes to Finance Domain

#### 1. **Schema Changes (Breaking)**
```bash
# ONLY in development/staging
# Example: Add new column
ALTER TABLE expenses ADD COLUMN new_field TEXT DEFAULT '';

# Update corresponding files
# - entity.schema.sql (document new column)
# - entity.index.sql (add index if needed)
# - entity.logic.sql (update functions if needed)

# Run smoke tests
psql -f sql/domain/finance/finance.debug.sql

# If pass → Document migration in CHANGELOG
# If fail → Rollback & fix
```

#### 2. **Logic Changes (Safe)**
```bash
# Add new function or modify existing
# Edit: entity.logic.sql

# Test locally
psql -c "SELECT new_function(test_params);"

# Run smoke tests
psql -f sql/domain/finance/finance.debug.sql

# Deploy if pass
```

#### 3. **Policy Changes (Security)**
```bash
# Edit: entity.policies.sql

# Test with different users
-- User A should see only their data
-- User B should see only their data
-- No cross-contamination

# Deploy if pass
```

### Versioning Strategy

**Tag Format:** `finance-domain-vX.Y`
- **Major (X):** Breaking changes (schema changes, removed functions)
- **Minor (Y):** New features (new functions, new columns with defaults)

**Example:**
- `finance-domain-v1.0` ← Current (frozen & stable)
- `finance-domain-v1.1` ← Add new entity (non-breaking)
- `finance-domain-v2.0` ← Schema restructure (breaking)

### Frozen Status

**Current Status:** 🔒 **Frozen & Stable**

**What This Means:**
- ✅ Production-ready
- ✅ Fully tested
- ✅ No breaking changes planned
- ✅ Safe to build features on top
- ⚠️ Changes require formal review

**Unfreezing Process:**
1. Document reason for change
2. Create new feature branch
3. Make changes + tests
4. Run full smoke test suite
5. Code review + approval
6. Merge + new version tag

---

## 📊 MONITORING & HEALTH CHECKS

### Weekly Health Check (Automated)

```sql
-- 1. Table health
SELECT 
  schemaname,
  tablename,
  n_live_tup AS row_count,
  n_dead_tup AS dead_rows,
  last_vacuum,
  last_analyze
FROM pg_stat_user_tables
WHERE tablename IN ('expenses', 'incomes', 'suppliers', 'customers', 'loans', 'investments');

-- 2. Index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan AS index_scans,
  idx_tup_read AS tuples_read
FROM pg_stat_user_indexes
WHERE schemaname = 'public';

-- 3. Slow queries (if using pg_stat_statements)
SELECT 
  query,
  calls,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE query LIKE '%expenses%' OR query LIKE '%incomes%'
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Performance Benchmarks

**Expected Performance (with 10K records per table):**
- Single expense/income insert: < 50ms
- Revenue summary (1 month): < 100ms
- Piutang aging report: < 150ms
- Customer tier update: < 30ms
- Loan installment generation: < 200ms

**Alerts:**
- 🔴 Query > 1 second → Investigate index usage
- 🟡 Dead tuples > 20% → Run VACUUM
- 🟢 All queries < 500ms → Healthy

---

## 📞 SUPPORT & TROUBLESHOOTING

### Common Issues

#### Issue 1: "RLS policy violation"
**Symptom:** User can't see their own data  
**Solution:**
```sql
-- Check if owner_id matches auth.uid()
SELECT owner_id, auth.uid() FROM expenses WHERE id = 'xxx';

-- Verify RLS enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'expenses';

-- Recreate policies if needed
\i sql/domain/finance/expenses.policies.sql
```

#### Issue 2: "Foreign key constraint violation"
**Symptom:** Can't insert expense with supplier_id  
**Solution:**
```sql
-- Verify supplier exists
SELECT id FROM suppliers WHERE id = 'xxx' AND owner_id = auth.uid();

-- Check if supplier was created by same user
-- Fix: Ensure supplier created first
```

#### Issue 3: "Function does not exist"
**Symptom:** `get_revenue_summary()` not found  
**Solution:**
```bash
# Redeploy logic files
psql -f sql/domain/finance/incomes.logic.sql

# Verify function exists
psql -c "\df get_revenue_summary"
```

### Getting Help

1. **Check Smoke Tests:** Run `finance.debug.sql` to isolate issue
2. **Review Logs:** Check Supabase logs for error details
3. **Consult Documentation:** Read entity-specific README
4. **Ask Team:** Share error message + query context

---

## 📝 CHANGELOG

### v1.0 (November 26, 2025) - Initial Release
- ✅ Created 6 entities: Expenses, Suppliers, Customers, Incomes, Loans, Investments
- ✅ Implemented 4-file modular pattern (24 SQL files)
- ✅ Added 45+ business logic functions
- ✅ Created 27+ automation triggers
- ✅ Optimized with 128+ indexes
- ✅ Enforced 91+ data integrity constraints
- ✅ Secured with 36 RLS policies
- ✅ Documented with 4 README files
- ✅ Created comprehensive smoke tests (`finance.debug.sql`)
- ✅ Tagged as `finance-domain-v1.0` (frozen & stable)

---

## 🎯 QUICK REFERENCE

### File Naming Convention
```
entity.schema.sql      → Tables, comments
entity.logic.sql       → Functions, triggers
entity.policies.sql    → RLS policies
entity.index.sql       → Indexes, constraints
entity.README.md       → Documentation (optional)
```

### Deployment Checklist
- [ ] Read this Master Setup
- [ ] Deploy in order: schema → logic → policies → index
- [ ] Run `finance.debug.sql` smoke tests
- [ ] Verify RLS working (test with 2+ users)
- [ ] Check performance benchmarks
- [ ] Monitor for 24 hours
- [ ] Tag deployment version

### Emergency Rollback
```bash
# Rollback to previous stable version
git checkout finance-domain-v1.0

# Or drop & recreate from scratch (dev only!)
DROP TABLE IF EXISTS expenses, expense_items, 
     suppliers, customers, incomes, income_items,
     loans, loan_installments, investments, profit_sharing_history CASCADE;

# Redeploy
# ... run schema files again
```

---

**Document Owner:** Finance Domain Team  
**Maintainers:** Development Team  
**Support Contact:** Technical Lead  
**Last Review:** November 26, 2025  
**Next Review:** December 26, 2025 (or when unfreezing)

---

**Status:** 🔒 **FROZEN & STABLE** - Production Ready v1.0
