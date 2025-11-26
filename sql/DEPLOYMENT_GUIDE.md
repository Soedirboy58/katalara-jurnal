# 🚀 SQL DOMAIN DEPLOYMENT GUIDE

**Complete Deployment Order for Katalara UMKM Platform**  
**Last Updated:** November 26, 2025

---

## 📋 OVERVIEW

This guide provides **complete deployment order** for all SQL domains in Katalara platform:

**Domains:**
1. **CORE** - Users, business profiles, onboarding
2. **SUPPORTING** - Units, storage, activity logs
3. **INVENTORY** - Master products & stock tracking ← **NEW**
4. **FINANCE** - Expenses, incomes, suppliers, customers, loans, investments
5. **STOREFRONT** - Online storefronts (lapak) for e-commerce

**Total Files:** ~80 SQL files across 5 domains

---

## ⚠️ CRITICAL DEPENDENCIES

**Deployment Order MUST follow these rules:**

```
CORE (users)
  ↓
SUPPORTING (units, storage)
  ↓
INVENTORY (products) ← MUST be deployed before FINANCE & STOREFRONT
  ↓
  ├─→ FINANCE (income_items.product_id → products.id)
  └─→ STOREFRONT (storefront_products.product_id → products.id)
```

**Why this order?**
- INVENTORY provides `products` table (master data)
- FINANCE `income_items` has FK to `products.id`
- STOREFRONT `storefront_products` has FK to `products.id`
- Deploying FINANCE/STOREFRONT before INVENTORY = FK constraint errors!

---

## 🆕 FOR NEW DATABASE (Project Baru)

### Prerequisites

1. **Supabase Project** created
2. **PostgreSQL 15+** with extensions:
   - `uuid-ossp` (UUID generation)
   - `pg_trgm` (full-text search)
3. **psql** CLI installed or use Supabase SQL Editor

### Step-by-Step Deployment

#### **PHASE 1: CORE Domain**

```bash
cd sql/domain/core

# 1. Schema (tables)
psql -f users.schema.sql
psql -f business_profiles.schema.sql
psql -f onboarding_progress.schema.sql

# 2. Logic (functions & triggers)
psql -f users.logic.sql
psql -f business_profiles.logic.sql
psql -f onboarding_progress.logic.sql

# 3. Policies (RLS)
psql -f users.policies.sql
psql -f business_profiles.policies.sql
psql -f onboarding_progress.policies.sql

# 4. Indexes (performance)
psql -f users.index.sql
psql -f business_profiles.index.sql
psql -f onboarding_progress.index.sql

# 5. Verify
psql -f core.debug.sql
```

**Expected:** ✅ All sections pass in core.debug.sql

---

#### **PHASE 2: SUPPORTING Domain**

```bash
cd sql/domain/supporting

# 1. Schema
psql -f units.schema.sql
psql -f storage_lapak.schema.sql
psql -f activity_logs.schema.sql

# 2. Logic
psql -f units.logic.sql
psql -f storage_lapak.logic.sql
psql -f activity_logs.logic.sql

# 3. Policies
psql -f units.policies.sql
psql -f storage_lapak.policies.sql
psql -f activity_logs.policies.sql

# 4. Indexes
psql -f units.index.sql
psql -f storage_lapak.index.sql
psql -f activity_logs.index.sql

# 5. Verify
psql -f supporting.debug.sql
```

**Expected:** ✅ All sections pass in supporting.debug.sql

---

#### **PHASE 3: INVENTORY Domain** ← **CRITICAL**

```bash
cd sql/domain/inventory

# 1. Schema
psql -f products.schema.sql
psql -f product_stock_movements.schema.sql

# 2. Logic
psql -f products.logic.sql
psql -f product_stock_movements.logic.sql

# 3. Policies
psql -f products.policies.sql
psql -f product_stock_movements.policies.sql

# 4. Indexes
psql -f products.index.sql
psql -f product_stock_movements.index.sql

# 5. Verify
psql -f inventory.debug.sql
```

**Expected:** ✅ All sections pass in inventory.debug.sql

**⚠️ STOP HERE if health check fails!** FINANCE & STOREFRONT depend on `products` table.

---

#### **PHASE 4: FINANCE Domain**

```bash
cd sql/domain/finance

# 1. Schema (order matters: customers → suppliers → incomes → expenses → loans → investments)
psql -f customers.schema.sql
psql -f suppliers.schema.sql
psql -f incomes.schema.sql      # Has FK to products (INVENTORY)
psql -f expenses.schema.sql
psql -f loans.schema.sql
psql -f investments.schema.sql

# 2. Logic
psql -f customers.logic.sql
psql -f suppliers.logic.sql
psql -f incomes.logic.sql
psql -f expenses.logic.sql
psql -f loans.logic.sql
psql -f investments.logic.sql

# 3. Policies
psql -f customers.policies.sql
psql -f suppliers.policies.sql
psql -f incomes.policies.sql
psql -f expenses.policies.sql
psql -f loans.policies.sql
psql -f investments.policies.sql

# 4. Indexes
psql -f customers.index.sql
psql -f suppliers.index.sql
psql -f incomes.index.sql
psql -f expenses.index.sql
psql -f loans.index.sql
psql -f investments.index.sql

# 5. Verify
psql -f finance.debug.sql
```

**Expected:** ✅ All sections pass in finance.debug.sql

---

#### **PHASE 5: STOREFRONT Domain**

```bash
cd sql/domain/storefront

# 1. Schema (order matters: storefronts → products → analytics → carts)
psql -f storefronts.schema.sql
psql -f products.schema.sql      # Has FK to products (INVENTORY)
psql -f analytics.schema.sql
psql -f carts.schema.sql

# 2. Logic
psql -f storefronts.logic.sql
psql -f products.logic.sql
psql -f analytics.logic.sql
psql -f carts.logic.sql

# 3. Policies
psql -f storefronts.policies.sql
psql -f products.policies.sql
psql -f analytics.policies.sql
psql -f carts.policies.sql

# 4. Indexes
psql -f storefronts.index.sql
psql -f products.index.sql
psql -f analytics.index.sql
psql -f carts.index.sql

# 5. Verify
psql -f storefront.debug.sql
```

**Expected:** ✅ All sections pass in storefront.debug.sql

---

#### **FINAL VERIFICATION**

```bash
# Run all health checks
psql -f sql/domain/core/core.debug.sql
psql -f sql/domain/supporting/supporting.debug.sql
psql -f sql/domain/inventory/inventory.debug.sql
psql -f sql/domain/finance/finance.debug.sql
psql -f sql/domain/storefront/storefront.debug.sql
```

**All checks must pass ✅ before production deployment!**

---

## 🔄 FOR EXISTING DATABASE (Database Sudah Jalan)

### Scenario

You already have **FINANCE v1.0** and **STOREFRONT v1.0** deployed, but **INVENTORY domain** doesn't exist yet.

### Step-by-Step Patch Deployment

#### **STEP 1: Backup Database First!**

```bash
# Supabase CLI
supabase db dump -f backup-before-inventory-$(date +%Y%m%d).sql

# Or manual
pg_dump -U postgres -h db.project.supabase.co your_db > backup.sql
```

---

#### **STEP 2: Apply INVENTORY Domain Patch**

```bash
cd sql/patches

# This will create INVENTORY tables (products, product_stock_movements)
psql -f 2025-11-26-inventory-domain-setup.sql
```

**Expected Output:**
```
✅ INVENTORY tables created
✅ INVENTORY logic created
✅ INVENTORY policies created
✅ INVENTORY indexes created
✅ All INVENTORY tables exist
✅ All INVENTORY functions exist (9/9+)
```

---

#### **STEP 3: Apply FINANCE Patch**

```bash
# This ensures income_items.product_id FK exists and points to products table
psql -f 2025-11-26-finance-add-product-fk.sql
```

**Expected Output:**
```
✅ products table exists
✅ product_id column already exists (or added)
✅ FK constraint added
✅ Index created
✅ Logic updated
```

---

#### **STEP 4: Apply STOREFRONT Patch**

```bash
# This ensures storefront_products.product_id FK exists and points to products table
psql -f 2025-11-26-storefront-fix-product-fk.sql
```

**Expected Output:**
```
✅ products table exists
✅ product_id column already exists (or added)
✅ FK constraint added
✅ Index created
✅ publish_product_to_storefront function exists
```

---

#### **STEP 5: Data Migration (Optional)**

**Link existing income_items to products:**

```sql
-- WARNING: Test in staging first!

-- Create products from existing income_items (if needed)
INSERT INTO products (user_id, name, selling_price, is_active)
SELECT DISTINCT owner_id, product_name, price_per_unit, true
FROM income_items
WHERE product_id IS NULL
  AND product_name IS NOT NULL
ON CONFLICT (user_id, name) DO NOTHING;

-- Link income_items to products
UPDATE income_items ii
SET product_id = p.id
FROM products p
WHERE ii.product_name = p.name
  AND ii.owner_id = p.user_id
  AND ii.product_id IS NULL;
```

**Link existing storefront_products to products:**

```sql
-- WARNING: Test in staging first!

-- Create products from storefront_products (if needed)
INSERT INTO products (user_id, name, selling_price, is_active)
SELECT DISTINCT user_id, name, price, true
FROM storefront_products
WHERE product_id IS NULL
  AND name IS NOT NULL
ON CONFLICT (user_id, name) DO NOTHING;

-- Link storefront_products to products
UPDATE storefront_products sp
SET product_id = p.id
FROM products p
WHERE sp.name = p.name
  AND sp.user_id = p.user_id
  AND sp.product_id IS NULL;
```

---

#### **STEP 6: Verify Deployment**

```bash
# Run all health checks
psql -f sql/domain/inventory/inventory.debug.sql
psql -f sql/domain/finance/finance.debug.sql
psql -f sql/domain/storefront/storefront.debug.sql
```

**All checks must pass ✅!**

---

## 🧪 TESTING CHECKLIST

After deployment, test these critical flows:

### **INVENTORY Domain**

- [ ] Create product: `INSERT INTO products (user_id, name, selling_price) VALUES (auth.uid(), 'Test', 50000)`
- [ ] SKU auto-generated: Check `sku` column (should be `PRD-2025-001`)
- [ ] Record stock in: `SELECT record_stock_movement(product_id, 100, 'in', 'manual', NULL, 'Initial')`
- [ ] Check current stock: `SELECT get_current_stock(product_id)` (should be 100)
- [ ] Record stock out: `SELECT record_stock_movement(product_id, 10, 'out', 'manual', NULL, 'Sale')`
- [ ] Check current stock: `SELECT get_current_stock(product_id)` (should be 90)
- [ ] Delete test product

### **FINANCE Integration**

- [ ] Create income with product_id: Link to existing product
- [ ] Profit calculation works: Check `income_items.total_profit`
- [ ] Product summary: `SELECT * FROM get_product_sales_report(auth.uid())`

### **STOREFRONT Integration**

- [ ] Publish product to storefront: `SELECT publish_product_to_storefront(product_id, storefront_id, 45000)`
- [ ] Check storefront_products.product_id: Should have FK to products.id
- [ ] View public product: `SELECT * FROM visible_products_with_storefront WHERE storefront_id = ?`
- [ ] Sync from master: `SELECT sync_product_from_master(storefront_product_id)`

---

## 🚨 TROUBLESHOOTING

### Error: "relation products does not exist"

**Cause:** INVENTORY domain not deployed  
**Fix:** Deploy INVENTORY domain first (Phase 3)

### Error: "insert or update on table income_items violates foreign key constraint"

**Cause:** Trying to insert income_items with product_id that doesn't exist  
**Fix:** Create product in INVENTORY first, or set product_id = NULL

### Error: "must be owner of relation buckets"

**Cause:** Trying to ALTER storage.buckets table  
**Fix:** Use `INSERT ... ON CONFLICT DO NOTHING` (already fixed in storage_lapak.schema.sql)

### Error: "function get_current_stock does not exist"

**Cause:** INVENTORY logic not deployed  
**Fix:** Run `psql -f sql/domain/inventory/products.logic.sql`

### Slow queries

**Cause:** Indexes not created  
**Fix:** Run all `*.index.sql` files for each domain

---

## 📝 ROLLBACK PROCEDURE

If deployment fails:

```bash
# 1. Restore from backup
psql -f backup-before-inventory-YYYYMMDD.sql

# 2. Or drop INVENTORY domain manually
DROP TABLE IF EXISTS product_stock_movements CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP FUNCTION IF EXISTS get_current_stock CASCADE;
# ... (drop all INVENTORY functions)

# 3. Verify rollback
psql -f sql/domain/finance/finance.debug.sql
psql -f sql/domain/storefront/storefront.debug.sql
```

---

## ✅ SUCCESS CRITERIA

Deployment is successful when:

- [ ] All 5 domain health checks pass ✅
- [ ] No FK constraint errors
- [ ] RLS policies working (users can't see other users' data)
- [ ] Functions exist and execute without errors
- [ ] Indexes created (query performance < 100ms)
- [ ] Test data can be created and queried
- [ ] Integration tests pass (FINANCE ↔ INVENTORY, STOREFRONT ↔ INVENTORY)

---

## 📚 DOCUMENTATION LINKS

- **CORE Domain:** `sql/domain/core/README.md`
- **SUPPORTING Domain:** `sql/domain/supporting/README.md`
- **INVENTORY Domain:** `sql/domain/inventory/INVENTORY.README.md` ← **NEW**
- **FINANCE Domain:** `sql/domain/finance/README.md`
- **STOREFRONT Domain:** `sql/domain/storefront/STOREFRONT.README.md`

---

## 🎯 NEXT STEPS

After successful deployment:

1. **Update Frontend**: Ensure API calls use new INVENTORY domain
2. **Migrate Data**: Link existing income_items/storefront_products to products (if needed)
3. **Monitor Performance**: Check query logs for slow queries
4. **Setup Cron Jobs**: 
   - `cleanup_expired_carts()` - Daily at 2am
   - `cleanup_old_activity_logs()` - Weekly
5. **Documentation**: Update API docs with new product_id requirements

---

**Deployment Guide Version:** 1.0  
**Last Updated:** November 26, 2025  
**Status:** ✅ Production Ready
