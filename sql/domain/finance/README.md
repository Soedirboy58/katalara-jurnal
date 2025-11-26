# 💰 DOMAIN: FINANCE

## TANGGUNG JAWAB

Domain Finance mengelola seluruh aspek keuangan bisnis UMKM:

* **Incomes** - Pendapatan (Operating, Investing, Financing)
* **Expenses** - Pengeluaran operasional dan investasi
* **Suppliers** - Manajemen vendor/pemasok
* **Customers** - Manajemen pelanggan (untuk piutang)
* **Loans** - Hutang/pinjaman
* **Investments** - Modal investor dan profit sharing

---

## TABEL INTI

### 1. `incomes`
Mencatat semua pemasukan bisnis dengan tipe:
- Operating (penjualan produk/jasa)
- Investing (return investasi, bunga)
- Financing (modal owner, pinjaman diterima, dana investor)

### 2. `income_items`
Detail line items untuk setiap income transaction

### 3. `expenses`
Mencatat semua pengeluaran dengan tipe:
- Operating (bahan baku, gaji, utilitas)
- Investing (pembelian aset, R&D)
- Financing (pembayaran utang, dividen investor)

### 4. `expense_items`
Detail line items untuk setiap expense transaction

### 5. `suppliers`
Data vendor/supplier untuk expense tracking

### 6. `customers`
Data customer untuk income tracking (piutang)

### 7. `loans`
Hutang/pinjaman dengan cicilan dan reminder

### 8. `loan_installments`
History cicilan hutang

### 9. `investments`
Modal investor dengan profit sharing

### 10. `profit_sharing_history`
History bagi hasil investor

---

## ALUR DATA

```
USER
  ↓
INPUT INCOME/EXPENSE
  ↓
VALIDATION ← useIncomeForm / useExpenseForm (hooks)
  ↓
SAVE TO DATABASE
  ├→ incomes / expenses (header)
  ├→ income_items / expense_items (details)
  └→ UPDATE supplier/customer balance
  ↓
TRIGGER AUTO-CALCULATIONS
  ├→ Update inventory (if product)
  ├→ Calculate profit margin
  └→ Update KPI stats
```

---

## FILE STRUCTURE

```
finance/
├── README.md                      (this file)
├── incomes.schema.sql             (CREATE TABLE incomes, income_items)
├── incomes.logic.sql              (FUNCTION, TRIGGER untuk income)
├── incomes.policies.sql           (RLS policies untuk incomes)
├── expenses.schema.sql            (CREATE TABLE expenses, expense_items)
├── expenses.logic.sql             (FUNCTION, TRIGGER untuk expense)
├── expenses.policies.sql          (RLS policies untuk expenses)
├── suppliers.schema.sql           (CREATE TABLE suppliers)
├── suppliers.policies.sql         (RLS untuk suppliers)
├── customers.schema.sql           (CREATE TABLE customers)
├── customers.policies.sql         (RLS untuk customers)
├── loans.schema.sql               (CREATE TABLE loans, loan_installments)
├── loans.logic.sql                (FUNCTION untuk cicilan, reminder)
├── loans.policies.sql             (RLS untuk loans)
├── investments.schema.sql         (CREATE TABLE investments, profit_sharing)
├── investments.logic.sql          (FUNCTION profit sharing calculation)
└── investments.policies.sql       (RLS untuk investments)
```

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

## CONTOH QUERY

### Get Total Income Hari Ini
```sql
SELECT 
  SUM(grand_total) as total_income
FROM incomes
WHERE owner_id = auth.uid()
  AND income_date = CURRENT_DATE;
```

### Get Expenses by Category (Bulan Ini)
```sql
SELECT 
  category,
  SUM(grand_total) as total
FROM expenses
WHERE owner_id = auth.uid()
  AND expense_date >= date_trunc('month', CURRENT_DATE)
GROUP BY category
ORDER BY total DESC;
```

### Get Outstanding Loans
```sql
SELECT 
  l.*,
  l.original_amount - COALESCE(SUM(li.amount_paid), 0) as remaining
FROM loans l
LEFT JOIN loan_installments li ON li.loan_id = l.id
WHERE l.owner_id = auth.uid()
  AND l.status != 'lunas'
GROUP BY l.id;
```

---

**Domain Owner:** Finance Team  
**Last Updated:** 2025-11-26  
**Status:** ✅ Active - Production Ready
