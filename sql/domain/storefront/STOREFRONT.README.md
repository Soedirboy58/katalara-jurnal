# STOREFRONT DOMAIN v1.0

**Lapak Online UMKM** - Public-facing e-commerce storefronts for small businesses.

---

## 📋 TABLE OF CONTENTS

1. [Overview](#overview)
2. [Domain Architecture](#domain-architecture)
3. [Entity Reference](#entity-reference)
4. [Critical Features](#critical-features)
5. [Deployment Guide](#deployment-guide)
6. [Security Model](#security-model)
7. [Testing & Validation](#testing--validation)

---

## 🎯 OVERVIEW

The **STOREFRONT domain** provides a complete e-commerce solution for UMKM (Usaha Mikro Kecil Menengah) to sell products online. Each business can create one storefront accessible at `/lapak/[slug]`.

### Key Capabilities

- ✅ **Public Storefronts**: Accessible at unique `/lapak/[slug]` URLs
- ✅ **Product Display**: Links to master Inventory products via FK
- ✅ **Shopping Carts**: Anonymous cart sessions with auto-expiry
- ✅ **Analytics Tracking**: Event-based metrics (views, clicks, conversions)
- ✅ **Payment Options**: QRIS & bank transfer integration
- ✅ **Mobile-First**: Optimized for WhatsApp ordering workflow

### Domain Entities (4)

| Entity | Purpose | Public Access | Files |
|--------|---------|---------------|-------|
| **business_storefronts** | Storefront configuration | ✅ Active storefronts | 4 |
| **storefront_products** | Products displayed in lapak | ✅ Visible products | 4 |
| **storefront_analytics** | Event tracking | ❌ Insert only | 4 |
| **cart_sessions** | Shopping carts | ✅ Full access | 4 |

**Total**: 16 SQL files + 2 docs = **18 files**

---

## 🏗️ DOMAIN ARCHITECTURE

### Entity Relationships

```
auth.users
    ↓ (user_id FK)
business_storefronts
    ↓ (storefront_id FK)
    ├── storefront_products ←─[product_id FK]─→ products (Inventory)
    ├── storefront_analytics
    └── cart_sessions
```

### Critical Relationships

1. **Storefronts → Users**: One-to-one (one user = one storefront)
2. **Products → Master Products**: Many-to-one (storefront_products.product_id → products.id)
3. **Products → Storefront**: Many-to-one (many products per storefront)
4. **Analytics → Storefront**: Many-to-one (many events per storefront)
5. **Carts → Storefront**: Many-to-one (many carts per storefront)

### Cross-Domain Integration

- **CORE Domain**: Users (auth.users) own storefronts
- **INVENTORY Domain**: Products table is master data source (via product_id FK)
- **SUPPORTING Domain**: Uses `lapak-images` storage bucket

---

## 📚 ENTITY REFERENCE

### 1. business_storefronts (Storefronts)

**Purpose**: Configuration and branding for each UMKM's online storefront.

**Key Columns**:
- `slug` (UNIQUE): URL identifier (e.g., "toko-kue-ani")
- `store_name`: Display name
- `whatsapp_number`: For orders (format: 628XXXXXXXXX)
- `is_active`: Public visibility flag
- `qris_image_url`, `bank_*`: Payment methods
- `total_views`, `total_clicks`: Analytics counters

**Public Access**: ✅ SELECT (WHERE is_active = true)

**Functions**:
- `generate_storefront_slug(store_name)` → Unique slug generation
- `increment_storefront_views(slug)` → View counter
- `increment_storefront_clicks(slug)` → Click counter
- `get_storefront_by_slug(slug)` → Public retrieval

**Constraints**:
- One storefront per user (UNIQUE idx_storefronts_one_per_user)
- Slug format: lowercase alphanumeric + hyphens, 3-50 chars
- WhatsApp format: 62XXXXXXXXX (Indonesia)
- Theme color: #RRGGBB hex format

**Views**:
- `active_storefronts_summary`: Public listing with product counts
- `my_storefront_analytics`: Owner metrics & conversion rate

---

### 2. storefront_products (Products)

**Purpose**: Products displayed in storefronts (links to master products table).

**CRITICAL ARCHITECTURE**:
```
products (Inventory) ←──[product_id FK]──→ storefront_products
  Master data                              Display layer
```

**Key Columns**:
- `product_id` (FK): **Link to master products table** (Inventory domain)
- `storefront_id` (FK): Parent storefront
- `name`, `description`: Display info (can differ from master)
- `price`: Storefront-specific price
- `product_type`: 'barang' (goods) or 'jasa' (services)
- `is_visible`, `is_featured`: Visibility flags
- `view_count`, `click_count`, `cart_add_count`: Analytics

**Public Access**: ✅ SELECT (WHERE is_visible = true AND storefront.is_active = true)

**Functions**:
- `publish_product_to_storefront(product_id, storefront_id, price)` → **Link master → display**
- `sync_product_from_master(storefront_product_id)` → Sync from master
- `increment_product_views(product_id)` → View counter
- `check_stock_availability(product_id, quantity)` → Stock check

**Constraints**:
- Price > 0
- compare_at_price >= price (if set)
- stock_quantity >= 0
- product_type IN ('barang', 'jasa')

**Views**:
- `visible_products_with_storefront`: Public listing with storefront info
- `my_products_analytics`: Owner metrics with conversion rates

---

### 3. storefront_analytics (Analytics)

**Purpose**: Event tracking for visitor behavior (append-only log).

**Event Types**:
- `page_view`: Storefront page view
- `product_view`: Product detail page view
- `product_click`: "Buy" button click
- `cart_add`: Add to cart action
- `checkout_start`: Checkout initiated
- `whatsapp_click`: WhatsApp button click

**Key Columns**:
- `storefront_id` (FK): Parent storefront
- `product_id` (FK, nullable): Optional product reference
- `event_type`: Event type (CHECK constraint)
- `session_id`: Optional session identifier
- `metadata` (JSONB): Flexible event data

**Public Access**: 
- ✅ INSERT (for tracking)
- ❌ SELECT (owner only)

**Immutability**: No UPDATE/DELETE policies (audit trail integrity)

**Functions**:
- `log_analytics_event(storefront_id, event_type, ...)` → Log event
- `get_storefront_event_counts(storefront_id)` → Event aggregation
- `get_unique_visitors(storefront_id)` → Unique session count
- `get_conversion_funnel(storefront_id)` → Funnel analysis

**Constraints**:
- event_type IN ('page_view', 'product_view', 'product_click', 'cart_add', 'checkout_start', 'whatsapp_click')
- Product events require product_id (CHECK constraint)

**Views**:
- `analytics_daily_summary`: Daily aggregation (last 30 days)
- `top_products_by_views`: Top 10 products by view count

---

### 4. cart_sessions (Carts)

**Purpose**: Anonymous shopping cart sessions with auto-expiry.

**Key Columns**:
- `storefront_id` (FK): Parent storefront
- `session_id`: Unique session identifier (client-generated)
- `cart_items` (JSONB): Array of items `[{product_id, quantity, variant, price, ...}]`
- `customer_name`, `customer_phone`, `customer_address`: Checkout info
- `status`: 'active', 'checked_out', 'abandoned'
- `expires_at`: Auto-expiry (default: 7 days)

**Public Access**: ✅ FOR ALL (anonymous e-commerce requirement)

**Functions**:
- `get_or_create_cart(storefront_id, session_id)` → Cart retrieval/creation
- `add_item_to_cart(cart_id, product_id, quantity, ...)` → Add product
- `remove_item_from_cart(cart_id, product_id, variant)` → Remove product
- `update_cart_status(cart_id, status)` → Status update
- `cleanup_expired_carts()` → **Run daily via cron**
- `get_cart_total(cart_id)` → Calculate total price

**Constraints**:
- status IN ('active', 'checked_out', 'abandoned')
- cart_items must be JSONB array
- expires_at > created_at
- customer_phone format: 62XXXXXXXXX (if provided)

**Views**:
- `active_carts_summary`: Active carts with item count & total
- `cart_status_distribution`: Cart status distribution

---

## 🔥 CRITICAL FEATURES

### 1. Product Linking Architecture

**CRITICAL**: `storefront_products` is NOT master data. Master products live in `products` table (Inventory domain).

```sql
-- ❌ WRONG: Create product directly in storefront
INSERT INTO storefront_products (storefront_id, name, price, ...)
VALUES ('storefront-uuid', 'Kue Lapis', 50000, ...);

-- ✅ CORRECT: Link from master products table
SELECT publish_product_to_storefront(
    (SELECT id FROM products WHERE name = 'Kue Lapis'),
    'storefront-uuid',
    50000.00,  -- Display price (can differ from master)
    true,      -- is_visible
    false      -- is_featured
);
```

**Workflow**:
1. User creates product in Inventory module → `products` table
2. User publishes to storefront → `publish_product_to_storefront()` function
3. Creates row in `storefront_products` with `product_id` FK linking to master
4. Public views product on `/lapak/[slug]` → reads from `storefront_products`

**Benefits**:
- Master product data integrity (single source of truth)
- Storefront-specific pricing (promos, discounts)
- Display customization without affecting master data
- Sync capability (`sync_product_from_master()` function)

---

### 2. Public Access Security

**STOREFRONT is public-facing**. RLS policies must be strict yet permissive.

**Public Can**:
- ✅ View active storefronts (is_active = true)
- ✅ View visible products (is_visible = true AND storefront.is_active = true)
- ✅ Insert analytics events (tracking)
- ✅ Manage carts (FOR ALL operations)

**Public Cannot**:
- ❌ View inactive storefronts
- ❌ View draft products
- ❌ Read analytics data
- ❌ Modify other users' data

**Owner Can**:
- ✅ View/edit own storefronts (including inactive)
- ✅ View/edit own products (including drafts)
- ✅ View own analytics
- ✅ View all carts for own storefronts

---

### 3. Anonymous Cart Sessions

**Challenge**: E-commerce requires anonymous carts (no authentication).

**Solution**: Permissive RLS policy + client-side session management.

```sql
-- Policy: Public can manage carts
CREATE POLICY "Public can manage carts"
    ON cart_sessions
    FOR ALL
    USING (true)
    WITH CHECK (true);
```

**Security Considerations**:
- Session ID is client-generated (browser localStorage)
- Application must validate session_id format
- Rate limiting at application/proxy level
- Carts auto-expire after 7 days
- No PII until checkout (customer_name, customer_phone)

**Alternative** (more restrictive):
```sql
-- Require session_id to be set via SET LOCAL
USING (session_id = current_setting('app.session_id', true))
```

---

### 4. Analytics Immutability

**Analytics is an append-only audit trail**. No UPDATE/DELETE allowed.

**Implementation**:
- ✅ Public can INSERT (tracking)
- ✅ Owner can SELECT (analytics)
- ❌ No UPDATE policy (immutable log)
- ❌ No DELETE policy (audit trail)

**Exception**: CASCADE DELETE from storefront deletion (FK behavior)

**Cleanup Strategy**:
- Use TTL at database level (not via app)
- Consider partitioning by `created_at` if > 1M rows
- Archive old data, don't delete via app

---

## 🚀 DEPLOYMENT GUIDE

### 1. Pre-Deployment Checklist

- [ ] **CORE domain** deployed (auth.users table exists)
- [ ] **INVENTORY domain** deployed (products table exists)
- [ ] **SUPPORTING domain** deployed (lapak-images storage bucket exists)
- [ ] Verify no existing `business_storefronts`, `storefront_products`, etc. tables
- [ ] Database user has CREATE TABLE, CREATE INDEX, CREATE TRIGGER permissions

### 2. Deployment Order

**Execute files in this exact order**:

```bash
# Entity 1: Storefronts
psql -f sql/domain/storefront/storefronts.schema.sql
psql -f sql/domain/storefront/storefronts.logic.sql
psql -f sql/domain/storefront/storefronts.policies.sql
psql -f sql/domain/storefront/storefronts.index.sql

# Entity 2: Products (requires storefronts + products from Inventory)
psql -f sql/domain/storefront/products.schema.sql
psql -f sql/domain/storefront/products.logic.sql
psql -f sql/domain/storefront/products.policies.sql
psql -f sql/domain/storefront/products.index.sql

# Entity 3: Analytics (requires storefronts, optional products)
psql -f sql/domain/storefront/analytics.schema.sql
psql -f sql/domain/storefront/analytics.logic.sql
psql -f sql/domain/storefront/analytics.policies.sql
psql -f sql/domain/storefront/analytics.index.sql

# Entity 4: Carts (requires storefronts)
psql -f sql/domain/storefront/carts.schema.sql
psql -f sql/domain/storefront/carts.logic.sql
psql -f sql/domain/storefront/carts.policies.sql
psql -f sql/domain/storefront/carts.index.sql
```

### 3. Post-Deployment Validation

```bash
# Run health check
psql -f sql/domain/storefront/storefront.debug.sql

# Verify tables exist
psql -c "\d business_storefronts"
psql -c "\d storefront_products"
psql -c "\d storefront_analytics"
psql -c "\d cart_sessions"

# Verify RLS enabled
psql -c "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'storefront%' OR tablename = 'business_storefronts' OR tablename = 'cart_sessions';"

# Test functions
psql -c "SELECT generate_storefront_slug('Test Store');"
psql -c "SELECT * FROM active_storefronts_summary LIMIT 5;"
```

### 4. Setup Cron Jobs

```bash
# Daily cart cleanup (delete expired carts)
0 2 * * * psql -c "SELECT cleanup_expired_carts();"
```

---

## 🔒 SECURITY MODEL

### RLS Policy Matrix

| Entity | Public SELECT | Public INSERT | Public UPDATE | Public DELETE | Owner SELECT | Owner WRITE |
|--------|---------------|---------------|---------------|---------------|--------------|-------------|
| **storefronts** | ✅ (active) | ❌ | ❌ | ❌ | ✅ (all) | ✅ |
| **products** | ✅ (visible) | ❌ | ❌ | ❌ | ✅ (all) | ✅ |
| **analytics** | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **carts** | ✅ | ✅ | ✅ | ✅ | ✅ (all) | ✅ (all) |

### Key Security Principles

1. **Public Visibility**: Only active storefronts + visible products exposed
2. **Owner Isolation**: Users can only manage own storefronts/products
3. **Analytics Privacy**: Only owner can read analytics, public can only INSERT
4. **Cart Permissiveness**: Fully permissive for anonymous e-commerce
5. **Immutable Logs**: Analytics cannot be modified (audit trail)

### Rate Limiting Recommendations

- **Cart Operations**: 100 requests/minute per IP
- **Analytics Insert**: 200 events/minute per session
- **Product Views**: 1000 views/hour per storefront
- **Checkout**: 10 checkouts/hour per session

---

## 🧪 TESTING & VALIDATION

### Smoke Tests

```sql
-- Test 1: Create storefront
INSERT INTO business_storefronts (user_id, slug, store_name, whatsapp_number)
VALUES (auth.uid(), 'test-store', 'Test Store', '628123456789')
RETURNING *;

-- Test 2: Publish product from Inventory
SELECT publish_product_to_storefront(
    (SELECT id FROM products LIMIT 1),
    (SELECT id FROM business_storefronts WHERE slug = 'test-store'),
    50000.00
);

-- Test 3: Log analytics event
SELECT log_analytics_event(
    (SELECT id FROM business_storefronts WHERE slug = 'test-store'),
    'page_view',
    NULL,
    'test-session-id',
    '{"referrer": "google.com"}'::JSONB
);

-- Test 4: Create cart
SELECT get_or_create_cart(
    (SELECT id FROM business_storefronts WHERE slug = 'test-store'),
    'test-session-id'
);
```

### Load Tests

```sql
-- Test index performance
EXPLAIN ANALYZE SELECT * FROM storefront_products 
WHERE storefront_id = 'uuid' AND is_visible = true 
ORDER BY sort_order;

-- Test cart retrieval
EXPLAIN ANALYZE SELECT * FROM cart_sessions 
WHERE session_id = 'test-session-id' AND status = 'active';

-- Test analytics aggregation
EXPLAIN ANALYZE SELECT * FROM get_storefront_event_counts('storefront-uuid');
```

### RLS Policy Tests

See `storefront.debug.sql` section 15-20 for comprehensive RLS tests.

---

## 📊 STATISTICS

### Domain Overview

- **Entities**: 4
- **SQL Files**: 16
- **Total Lines**: ~8,500 lines
- **Functions**: 20
- **Views**: 6
- **Triggers**: 4
- **Indexes**: 35
- **Constraints**: 21
- **RLS Policies**: 14

### File Breakdown

| Entity | Schema | Logic | Policies | Index | Total |
|--------|--------|-------|----------|-------|-------|
| storefronts | 270 | 365 | 210 | 340 | **1,185** |
| products | 330 | 480 | 240 | 420 | **1,470** |
| analytics | 180 | 410 | 185 | 390 | **1,165** |
| carts | 220 | 450 | 215 | 385 | **1,270** |

**Documentation**: README (~800 lines) + debug.sql (~500 lines) = **1,300 lines**

---

## 🔗 RELATED DOMAINS

- **CORE**: User authentication (auth.users)
- **INVENTORY**: Master product data (products table)
- **SUPPORTING**: Storage buckets (lapak-images)
- **FINANCE**: Future integration for payment processing

---

## 📝 MIGRATION NOTES

- **ADDITIVE ONLY**: No DROP operations
- **BACKWARD COMPATIBLE**: Preserves existing data
- **Legacy Support**: product_id can be NULL (existing products)
- **Partitioning**: Consider if analytics > 1M rows

---

**Version**: 1.0  
**Date**: 2025-01-09  
**Author**: Katalara Platform Team  
**Git Tag**: `storefront-domain-v1.0`
