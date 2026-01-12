# Database Schema & Architecture

**Date:** Desember 2025  
**Status:** ✅ Complete  
**Category:** Foundation  

---

## 🗄️ Database Architecture

### Platform: Supabase (PostgreSQL 15)

**Connection:**
- Host: Project-specific Supabase URL
- Authentication: Row Level Security (RLS)
- Extensions: uuid-ossp, pgcrypto

---

## 📊 Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   auth.     │         │   products   │         │  customers  │
│   users     │◄────────┤              │         │             │
│             │         │ - id (PK)    │         │ - id (PK)   │
└─────────────┘         │ - user_id    │         │ - user_id   │
                        │ - name       │         │ - name      │
                        │ - stock      │         │ - phone     │
                        │ - stock_qty  │         └──────┬──────┘
                        │ - cost_price │                │
                        │ - sell_price │                │
                        └──────┬───────┘                │
                               │                        │
                               │                        │
                        ┌──────▼────────────────────────▼─────┐
                        │        transactions                 │
                        │  - id (PK)                         │
                        │  - user_id                         │
                        │  - invoice_number                  │
                        │  - customer_id (FK)                │
                        │  - total, payment_status           │
                        └──────┬──────────────────────────────┘
                               │
                               │
                        ┌──────▼──────────────┐
                        │ transaction_items   │
                        │  - id (PK)          │
                        │  - transaction_id   │
                        │  - product_id (FK)  │
                        │  - qty, price       │
                        └─────────────────────┘
                               │
                               │
                        ┌──────▼──────────────┐
                        │  stock_movements    │
                        │  - id (PK)          │
                        │  - product_id (FK)  │
                        │  - quantity_change  │
                        │  - stock_before/after│
                        └─────────────────────┘
```

---

## 📋 Core Tables

### 1. products

**Purpose:** Product catalog dengan inventory tracking

```sql
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  owner_id UUID,
  
  -- Product Info
  name TEXT NOT NULL,
  sku TEXT,
  category TEXT,
  unit TEXT DEFAULT 'pcs',
  
  -- Pricing
  price NUMERIC DEFAULT 0,           -- Legacy field
  cost_price NUMERIC DEFAULT 0,      -- Harga beli (canonical)
  buy_price NUMERIC DEFAULT 0,       -- Alias cost_price
  selling_price NUMERIC DEFAULT 0,   -- Harga jual (canonical)
  sell_price NUMERIC DEFAULT 0,      -- Alias selling_price
  
  -- Stock (DUAL COLUMNS - See note below)
  stock NUMERIC,                     -- Legacy/canonical
  stock_quantity NUMERIC DEFAULT 0,  -- Patch-added
  stock_unit TEXT DEFAULT 'pcs',
  min_stock_alert NUMERIC DEFAULT 0,
  track_inventory BOOLEAN DEFAULT true,
  last_restock_date TIMESTAMPTZ,
  
  -- Meta
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
```sql
CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_products_owner_id ON products(owner_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_stock ON products(owner_id, stock_quantity);
```

**Critical Note - Dual Stock Columns:**

⚠️ **Database has TWO stock columns due to schema evolution:**

1. **`stock`** - Legacy/canonical field
   - Present in original schema
   - Used by many UI components
   - May be NULL

2. **`stock_quantity`** - Added by patch
   - Added via `patch_transactions_system_unified.sql`
   - Used by `adjust_stock` RPC
   - Default value: 0

**Impact:** Always use fallback chain when reading:
```typescript
const stockQty = product.stock ?? product.stock_quantity ?? 0
```

**See:** [Stock Field Synchronization](../../04-BUGFIXES/04_stock_field_synchronization.md)

---

### 2. transactions

**Purpose:** Sales/income records (invoices)

```sql
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  owner_id UUID,
  
  -- Invoice Info
  invoice_number TEXT NOT NULL,      -- Format: INV-YYYY-NNNN
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  
  -- Customer
  customer_id UUID REFERENCES customers(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_address TEXT,
  
  -- Payment
  payment_type TEXT DEFAULT 'cash',  -- 'cash' or 'tempo'
  due_date DATE,
  
  -- Amounts
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount_type TEXT DEFAULT 'percentage',
  discount_value NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  ppn_rate NUMERIC DEFAULT 11,       -- PPN 11%
  ppn_amount NUMERIC DEFAULT 0,
  pph_rate NUMERIC DEFAULT 0,
  pph_amount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  remaining_amount NUMERIC DEFAULT 0,
  payment_status TEXT DEFAULT 'unpaid',  -- 'paid', 'unpaid', 'partial'
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique invoice per user (not globally unique!)
  CONSTRAINT idx_transactions_user_invoice UNIQUE (user_id, invoice_number)
);
```

**Indexes:**
```sql
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_customer ON transactions(customer_id);
CREATE INDEX idx_transactions_status ON transactions(payment_status);
CREATE INDEX idx_transactions_invoice ON transactions(invoice_number);
```

**Important:** Invoice numbers are **per-user**, not global. This prevents collision when multiple users start at INV-2026-0001.

---

### 3. transaction_items

**Purpose:** Line items per transaction (invoice detail)

```sql
CREATE TABLE public.transaction_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  
  product_name TEXT NOT NULL,
  qty NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  price NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL,
  
  stock_deducted BOOLEAN DEFAULT false,  -- Track if stock was adjusted
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
```sql
CREATE INDEX idx_transaction_items_transaction ON transaction_items(transaction_id);
CREATE INDEX idx_transaction_items_product ON transaction_items(product_id);
```

---

### 4. customers

**Purpose:** Customer database untuk transactions

```sql
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  owner_id UUID,
  
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  
  -- Statistics (denormalized for performance)
  total_transactions INTEGER DEFAULT 0,
  total_purchase NUMERIC DEFAULT 0,
  last_transaction_date TIMESTAMPTZ,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
```sql
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_name ON customers(name);
```

---

### 5. stock_movements

**Purpose:** Audit trail untuk stock changes

```sql
CREATE TABLE public.stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  owner_id UUID,
  
  movement_type TEXT NOT NULL,       -- 'adjustment', 'sale', 'purchase', 'return'
  quantity_change NUMERIC NOT NULL,  -- Positive or negative
  
  stock_before NUMERIC NOT NULL,
  stock_after NUMERIC NOT NULL,
  
  reference_type TEXT,               -- 'transaction', 'manual', etc.
  reference_id UUID,                 -- FK to transactions or other tables
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
```sql
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_user_id ON stock_movements(user_id);
CREATE INDEX idx_stock_movements_date ON stock_movements(created_at);
```

---

## 🔐 Row Level Security (RLS)

### Security Model

All tables use RLS to ensure users only see their own data.

### Policy Pattern

```sql
-- Example for products table
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- SELECT policy
CREATE POLICY "products_select_own" ON public.products
FOR SELECT USING (COALESCE(user_id, owner_id) = auth.uid());

-- INSERT policy
CREATE POLICY "products_insert_own" ON public.products
FOR INSERT WITH CHECK (COALESCE(user_id, owner_id) = auth.uid());

-- UPDATE policy
CREATE POLICY "products_update_own" ON public.products
FOR UPDATE USING (COALESCE(user_id, owner_id) = auth.uid())
WITH CHECK (COALESCE(user_id, owner_id) = auth.uid());

-- DELETE policy
CREATE POLICY "products_delete_own" ON public.products
FOR DELETE USING (COALESCE(user_id, owner_id) = auth.uid());
```

**Note:** `COALESCE(user_id, owner_id)` supports both old (owner_id) and new (user_id) schemas.

### Special Case: transaction_items

Transaction items inherit ownership through parent transaction:

```sql
CREATE POLICY "transaction_items_select_own" ON public.transaction_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.id = transaction_items.transaction_id
      AND COALESCE(t.user_id, t.owner_id) = auth.uid()
  )
);
```

---

## 🔧 Stored Procedures (RPC)

### 1. adjust_stock

**Purpose:** Safely adjust product stock with validation & audit trail

**Signature:**
```sql
public.adjust_stock(
  p_product_id UUID,
  p_quantity_change NUMERIC,
  p_notes TEXT DEFAULT NULL
) RETURNS JSON
```

**Logic:**
1. Verify product ownership (via RLS)
2. Check if track_inventory is enabled
3. Validate: prevent negative stock
4. Insert stock_movements record
5. Update products.stock_quantity
6. Return JSON: `{success: true, previous_stock, new_stock}`

**Usage Example:**
```sql
SELECT adjust_stock(
  'product-uuid-here',
  -5,  -- Negative for deduction, positive for addition
  'Sold via transaction INV-2026-0001'
);
```

**Returns:**
```json
{
  "success": true,
  "message": "Stock adjusted successfully",
  "previous_stock": 10,
  "new_stock": 5
}
```

**Error Cases:**
```json
{"success": false, "message": "Insufficient stock"}
{"success": false, "message": "Product not found or inventory tracking disabled"}
```

---

### 2. generate_invoice_number

**Purpose:** Generate sequential invoice numbers per user

**Signature:**
```sql
public.generate_invoice_number(p_user_id UUID) RETURNS TEXT
```

**Logic:**
1. Acquire advisory lock (prevent concurrent collisions)
2. Find highest invoice number for current year
3. Increment and format: `INV-YYYY-NNNN`

**Example:**
```sql
SELECT generate_invoice_number('user-uuid-here');
-- Returns: 'INV-2026-0001' (first invoice of 2026)
-- Next call: 'INV-2026-0002'
```

**Format:** `INV-{YEAR}-{SEQUENTIAL_NUMBER}`
- Year resets sequence annually
- Padded to 4 digits (0001, 0002, ..., 9999)
- Per-user isolation (each user has own sequence)

---

## 🔄 Data Flow Diagrams

### Income Transaction Flow

```
User creates sale
    ↓
Frontend validates
    ↓
API: /api/transactions (POST)
    ↓
1. Generate invoice number (RPC)
    ↓
2. Pre-check stock availability
   (reads: stock ?? stock_quantity)
    ↓
3. Create transaction record
    ↓
4. Create transaction_items records
    ↓
5. For each item:
   └─ adjust_stock(product_id, -qty, notes)
      ├─ Updates stock_quantity
      ├─ Creates stock_movements
      └─ Returns new_stock
    ↓
6. Best-effort: sync products.stock
    ↓
7. Return success + invoice data
```

### Expense/Purchase Flow

```
User creates purchase
    ↓
Frontend validates
    ↓
API: Create expense record
    ↓
For each item:
  └─ adjust_stock(product_id, +qty, notes)
     └─ Increases stock
    ↓
Update product prices if changed
    ↓
Return success
```

---

## 🎯 Schema Design Principles

### 1. UUID Primary Keys

**Why:** 
- No collision across distributed systems
- Easier merging of databases
- Security (non-sequential)

**Trade-off:**
- 16 bytes vs 4 bytes (INT)
- Slightly slower joins (negligible at UMKM scale)

### 2. Denormalization (Selective)

**Where Used:**
- `transaction_items.product_name` (snapshot product name at sale time)
- `customers.total_transactions` (performance for dashboard)

**Why:**
- Historical accuracy (product names can change)
- Query performance (avoid joins for common queries)

### 3. Dual Ownership Columns

**Pattern:** Both `user_id` and `owner_id` exist

**Reason:** Backward compatibility with old schemas

**Usage:** Always use `COALESCE(user_id, owner_id)`

### 4. Audit Trail

**Pattern:** `created_at`, `updated_at` on most tables

**Benefit:** Troubleshooting, analytics, compliance

---

## 📊 Performance Considerations

### Indexes Strategy

**User Isolation:**
```sql
CREATE INDEX idx_products_user_id ON products(user_id);
```
Every query filters by user_id → must be indexed.

**Composite Indexes:**
```sql
CREATE INDEX idx_products_stock ON products(owner_id, stock_quantity);
```
For queries like "low stock products per user".

**Foreign Keys:**
```sql
CREATE INDEX idx_transaction_items_transaction ON transaction_items(transaction_id);
```
Speed up joins and CASCADE deletes.

### Query Optimization

**Use RLS:** Automatic filtering by user_id
```sql
-- Query looks simple
SELECT * FROM products;

-- Supabase adds RLS filter automatically:
SELECT * FROM products WHERE user_id = auth.uid();
```

**Avoid N+1 Queries:**
```sql
-- ❌ Bad: Multiple queries
SELECT * FROM transactions WHERE user_id = 'xxx';
-- Then for each transaction:
SELECT * FROM transaction_items WHERE transaction_id = 'yyy';

-- ✅ Good: Single query with join
SELECT t.*, ti.*
FROM transactions t
LEFT JOIN transaction_items ti ON ti.transaction_id = t.id
WHERE t.user_id = 'xxx';
```

---

## 🗄️ Storage & Backup

### Supabase Storage Buckets

**products-images:**
- Product photos
- Public access (if product is_active)
- Automatic image optimization

**documents:**
- Invoices (PDF)
- Reports
- Private (user-only access via RLS)

### Backup Strategy

**Supabase Managed:**
- Daily automated backups
- Point-in-time recovery (7 days)
- Retention: 30 days (paid plans)

**Manual Backup:**
```bash
# Export specific table
pg_dump -h db.xxx.supabase.co \
  -U postgres \
  -d postgres \
  -t products \
  -t transactions \
  -t transaction_items \
  > backup-$(date +%Y%m%d).sql
```

---

## 🔗 Related Documentation

- [Platform Initialization](./01_platform_initialization.md)
- [Authentication System](./03_authentication_system.md)
- [Stock Field Sync Fix](../../04-BUGFIXES/04_stock_field_synchronization.md)

---

**Schema Version:** 1.0  
**Last Migration:** patch_transactions_system_unified.sql  
**Database:** PostgreSQL 15 (Supabase)  
**Status:** ✅ Production Ready
