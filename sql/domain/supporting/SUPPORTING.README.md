# SUPPORTING Domain - README

**Version:** 1.0  
**Last Updated:** 2025  
**Author:** Platform Engineering Team  
**Status:** Production-Ready

---

## 📋 Table of Contents

1. [Domain Overview](#domain-overview)
2. [Architecture](#architecture)
3. [Entity Catalog](#entity-catalog)
4. [File Structure](#file-structure)
5. [Deployment Order](#deployment-order)
6. [Usage Examples](#usage-examples)
7. [Security Model](#security-model)
8. [Cross-Domain Integration](#cross-domain-integration)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Domain Overview

The **SUPPORTING** domain provides cross-cutting infrastructure features that support all other domains. It includes unit preferences, file storage, and activity logging systems.

### Purpose

- **Unit Settings**: Per-user custom unit preferences for products and services
- **File Storage**: Secure image storage for product photos, logos, and media
- **Activity Logs**: Comprehensive audit trail for all user actions

### Key Features

- ✅ Custom unit management (physical + service units)
- ✅ Folder-based storage isolation per user
- ✅ Public image access with authenticated upload
- ✅ Immutable audit trail (append-only logs)
- ✅ Full-text search on activity logs
- ✅ Storage quota management

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                   SUPPORTING DOMAIN                           │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────┐                                         │
│  │  auth.users     │  (Supabase Auth - External)            │
│  └────────┬────────┘                                         │
│           │                                                  │
│           ├─────────────────┐                                │
│           │                 │                                │
│           ↓                 ↓                                │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ user_unit_settings│  │ activity_logs   │                 │
│  │ (Unit preferences)│  │ (Audit trail)   │                 │
│  └──────────────────┘  └──────────────────┘                 │
│                                                               │
│           ↓                                                  │
│  ┌──────────────────┐                                        │
│  │storage.buckets   │ (Supabase Storage)                    │
│  │  - lapak-images  │ (Product/logo images)                 │
│  └──────────────────┘                                        │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Unit Settings**: User configures custom units → Stored in `user_unit_settings` → Used by Finance/Inventory domains
2. **File Upload**: User uploads image → Stored in `lapak-images` bucket → Folder: `<user_id>/<category>/<filename>`
3. **Activity Logging**: User performs action → Logged to `activity_logs` → Immutable audit trail

---

## 📦 Entity Catalog

### 1. user_unit_settings

**Purpose**: Store per-user unit preferences for products and services

**Key Columns**:
- `user_id` (UUID, FK to auth.users) - One config per user
- `has_physical_products` (boolean) - Whether user sells products
- `has_services` (boolean) - Whether user provides services
- `physical_units` (text[]) - Enabled units (pcs, kg, liter, etc)
- `service_units` (text[]) - Enabled units (jam, hari, proyek, etc)
- `custom_physical_units` (text[]) - User-added custom units
- `custom_service_units` (text[]) - User-added custom units
- `default_physical_unit` (varchar) - Default selection
- `default_service_unit` (varchar) - Default selection

**Functions** (8):
- `get_user_unit_settings(user_id)` - Retrieve settings
- `initialize_user_unit_settings(user_id)` - Create defaults
- `add_custom_physical_unit(user_id, unit)` - Add custom unit
- `add_custom_service_unit(user_id, unit)` - Add custom unit
- `remove_custom_physical_unit(user_id, unit)` - Remove custom unit
- `remove_custom_service_unit(user_id, unit)` - Remove custom unit
- `update_default_units(user_id, physical, service)` - Update defaults
- `get_all_available_units(user_id)` - Get all units (JSON)

**Security**: RLS enabled, users see own settings only, admins see all

**Files**:
- `user_units.schema.sql` (85 lines)
- `user_units.logic.sql` (380 lines)
- `user_units.policies.sql` (120 lines)
- `user_units.index.sql` (200 lines)

---

### 2. storage/lapak-images

**Purpose**: Secure storage bucket for product images, logos, and media

**Configuration**:
- `bucket_id`: lapak-images
- `public`: true (read access)
- `file_size_limit`: 5MB
- `allowed_mime_types`: JPEG, PNG, GIF, WebP

**Folder Structure**:
```
<user_id>/
  ├── logo/         - Business logo
  ├── products/     - Product images
  ├── banners/      - Banner/hero images
  ├── thumbnails/   - Auto-generated thumbnails
  └── qr/           - QR code images
```

**Functions** (4):
- `get_user_storage_usage(user_id)` - Get usage stats
- `get_user_images_by_category(user_id, category)` - List images
- `check_user_storage_quota(user_id, new_file_size, max_quota)` - Quota check
- `get_storage_statistics()` - Admin stats

**Security**: Public read, authenticated write to own folder only, admin full access

**Files**:
- `storage_lapak.schema.sql` (60 lines)
- `storage_lapak.logic.sql` (300 lines)
- `storage_lapak.policies.sql` (140 lines)
- `storage_lapak.index.sql` (80 lines)

---

### 3. activity_logs

**Purpose**: Immutable audit trail for all user actions

**Key Columns**:
- `user_id` (UUID, FK to auth.users) - Actor
- `action` (text) - Action type (create_income, delete_expense, etc)
- `description` (text) - Human-readable description
- `metadata` (jsonb) - Additional context (affected IDs, old/new values)
- `ip_address` (inet) - IP for security audit
- `user_agent` (text) - Browser/device info
- `created_at` (timestamptz) - Timestamp (immutable)

**Action Categories**:
- Income: `create_income`, `update_income`, `delete_income`
- Expense: `create_expense`, `update_expense`, `delete_expense`
- Customer: `create_customer`, `update_customer`, `delete_customer`
- Supplier: `create_supplier`, `update_supplier`, `delete_supplier`
- Product: `create_product`, `update_product`, `delete_product`
- User: `login`, `logout`, `password_change`, `profile_update`
- Admin: `approve_user`, `suspend_user`, `delete_user`

**Functions** (7):
- `log_activity(user_id, action, description, metadata, ip, user_agent)` - Log action
- `get_user_activity_logs(user_id, limit, offset)` - Get paginated logs
- `get_activity_logs_by_action(user_id, action, limit)` - Filter by action
- `get_activity_statistics(user_id, date_from, date_to)` - Stats
- `get_recent_activity_summary(user_id, hours)` - Recent summary
- `get_admin_activity_overview(date_from, date_to)` - Admin overview
- `search_activity_logs(user_id, search_term, limit)` - Search logs

**Security**: Append-only (no UPDATE/DELETE), users see own logs, admins see all

**Files**:
- `activity_logs.schema.sql` (90 lines)
- `activity_logs.logic.sql` (420 lines)
- `activity_logs.policies.sql` (150 lines)
- `activity_logs.index.sql` (210 lines)

---

## 📁 File Structure

```
sql/domain/supporting/
├── user_units.schema.sql          (85 lines)   - Table definition
├── user_units.logic.sql           (380 lines)  - 8 functions + 1 trigger + 1 view
├── user_units.policies.sql        (120 lines)  - 6 RLS policies
├── user_units.index.sql           (200 lines)  - 11 indexes + 11 constraints
│
├── storage_lapak.schema.sql       (60 lines)   - Bucket definition
├── storage_lapak.logic.sql        (300 lines)  - 4 functions + 2 views
├── storage_lapak.policies.sql     (140 lines)  - 7 RLS policies
├── storage_lapak.index.sql        (80 lines)   - Storage notes + optional indexes
│
├── activity_logs.schema.sql       (90 lines)   - Table definition
├── activity_logs.logic.sql        (420 lines)  - 7 functions + 2 views
├── activity_logs.policies.sql     (150 lines)  - 4 RLS policies (append-only)
├── activity_logs.index.sql        (210 lines)  - 10 indexes + 5 constraints
│
├── SUPPORTING.README.md           (this file)
└── supporting.debug.sql           (smoke tests - next)
```

**Total**: 12 SQL files + 2 documentation files = 14 files  
**Total Lines of Code**: ~2,235 lines of SQL

---

## 🚀 Deployment Order

**CRITICAL**: Deploy files in this exact order to satisfy dependencies.

### Step 1: Schema Layer (Tables + Bucket)

```sql
\i sql/domain/supporting/user_units.schema.sql
\i sql/domain/supporting/storage_lapak.schema.sql
\i sql/domain/supporting/activity_logs.schema.sql
```

### Step 2: Logic Layer (Functions + Triggers + Views)

```sql
\i sql/domain/supporting/user_units.logic.sql
\i sql/domain/supporting/storage_lapak.logic.sql
\i sql/domain/supporting/activity_logs.logic.sql
```

### Step 3: Security Layer (RLS Policies)

```sql
\i sql/domain/supporting/user_units.policies.sql
\i sql/domain/supporting/storage_lapak.policies.sql
\i sql/domain/supporting/activity_logs.policies.sql
```

### Step 4: Performance Layer (Indexes + Constraints)

```sql
\i sql/domain/supporting/user_units.index.sql
\i sql/domain/supporting/storage_lapak.index.sql
\i sql/domain/supporting/activity_logs.index.sql
```

### Verification

Run smoke tests after deployment:

```sql
\i sql/domain/supporting/supporting.debug.sql
```

---

## 💡 Usage Examples

### Example 1: Initialize User Unit Settings

```sql
-- Create default settings for new user
SELECT initialize_user_unit_settings('<user_uuid>');

-- Check settings
SELECT * FROM user_unit_settings WHERE user_id = '<user_uuid>';

-- Result:
-- physical_units: ['pcs', 'unit', 'pasang', 'lusin', 'box']
-- service_units: ['jam', 'hari', 'bulan', 'proyek', 'orang']
-- default_physical_unit: 'pcs'
-- default_service_unit: 'jam'
```

### Example 2: Add Custom Unit

```sql
-- Add custom physical unit
SELECT add_custom_physical_unit('<user_uuid>', 'karung');

-- Add custom service unit
SELECT add_custom_service_unit('<user_uuid>', 'sesi');

-- Get all available units
SELECT get_all_available_units('<user_uuid>');

-- Result (JSON):
-- {
--   "physical": {
--     "standard": ["pcs", "unit", ...],
--     "custom": ["karung"],
--     "default": "pcs"
--   },
--   "service": {
--     "standard": ["jam", "hari", ...],
--     "custom": ["sesi"],
--     "default": "jam"
--   }
-- }
```

### Example 3: Upload Image to Storage

```sql
-- Frontend code (JavaScript):
const file = document.getElementById('file-input').files[0];
const userId = '<user_uuid>';
const category = 'products';
const fileName = `${userId}/${category}/${file.name}`;

const { data, error } = await supabase.storage
  .from('lapak-images')
  .upload(fileName, file);

// Public URL:
// https://<project>.supabase.co/storage/v1/object/public/lapak-images/<user_uuid>/products/my-product.jpg
```

### Example 4: Check Storage Usage

```sql
-- Get user storage stats
SELECT * FROM get_user_storage_usage('<user_uuid>');

-- Result:
-- total_files: 15
-- total_size_bytes: 3145728
-- total_size_mb: 3.00
-- avg_file_size_kb: 204.80
-- mime_type_breakdown: {"image/jpeg": 10, "image/png": 5}
```

### Example 5: Check Storage Quota

```sql
-- Check if user can upload 2MB file (max 50MB quota)
SELECT check_user_storage_quota('<user_uuid>', 2097152, 50);

-- Result:
-- {
--   "can_upload": true,
--   "current_usage_mb": 3.00,
--   "new_file_size_mb": 2.00,
--   "new_total_mb": 5.00,
--   "max_quota_mb": 50,
--   "remaining_mb": 45.00
-- }
```

### Example 6: Log Activity

```sql
-- Log income creation
SELECT log_activity(
  '<user_uuid>',
  'create_income',
  'Created income INV-2025-001 for Rp 5,000,000',
  '{"affected_id": "550e8400-...", "amount": 5000000, "customer_id": "..."}'::jsonb,
  '192.168.1.1'::inet,
  'Mozilla/5.0 ...'
);
```

### Example 7: Get Activity Statistics

```sql
-- Get last 30 days activity stats
SELECT get_activity_statistics(
  '<user_uuid>',
  NOW() - INTERVAL '30 days',
  NOW()
);

-- Result:
-- {
--   "total_actions": 150,
--   "actions_by_type": {
--     "create_income": 25,
--     "create_expense": 40,
--     "update_product": 15,
--     ...
--   },
--   "most_common_action": "create_expense"
-- }
```

### Example 8: Search Activity Logs

```sql
-- Search for all income-related actions
SELECT * FROM search_activity_logs('<user_uuid>', 'income', 50);

-- Result: All logs with 'income' in action, description, or metadata
```

---

## 🔐 Security Model

### RLS Policies Summary

#### user_unit_settings (6 policies)

1. **user_units_select_own**: Users see their own settings
2. **user_units_insert_own**: Users create their own settings
3. **user_units_update_own**: Users update their own settings
4. **user_units_delete_own**: Users delete their own settings
5. **user_units_select_admin**: Admins see all settings
6. **user_units_update_admin**: Admins update any settings

#### storage/lapak-images (7 policies)

1. **storage_lapak_select_public**: Public can view all images
2. **storage_lapak_insert_own**: Users upload to own folder
3. **storage_lapak_update_own**: Users update own images
4. **storage_lapak_delete_own**: Users delete own images
5. **storage_lapak_select_admin**: Admins view all
6. **storage_lapak_update_admin**: Admins update any
7. **storage_lapak_delete_admin**: Admins delete any

#### activity_logs (4 policies - APPEND-ONLY)

1. **activity_logs_select_own**: Users view own logs
2. **activity_logs_insert_own**: Users insert own logs
3. **activity_logs_select_admin**: Admins view all logs
4. **activity_logs_insert_admin**: Admins insert for any user

**Note**: No UPDATE/DELETE policies for activity_logs (immutable audit trail)

### Security Best Practices

1. ✅ **Unit Settings**: Users isolated to own settings
2. ✅ **Storage**: Folder-based isolation (`/<user_id>/...`)
3. ✅ **Activity Logs**: Append-only, no modifications allowed
4. ✅ **File Size**: 5MB limit enforced at bucket level
5. ✅ **File Types**: Only images allowed (JPEG, PNG, GIF, WebP)

---

## 🌐 Cross-Domain Integration

The SUPPORTING domain is used by all other domains:

### Finance Domain Dependencies

```sql
-- Expenses table uses unit settings
SELECT * FROM user_unit_settings 
WHERE user_id = auth.uid();

-- Activity logs for finance operations
SELECT log_activity(
  auth.uid(),
  'create_expense',
  'Created expense EXP-2025-001',
  '{"expense_id": "...", "amount": 1000000}'::jsonb
);
```

### Inventory Domain Dependencies (Future)

```sql
-- Products use custom units
SELECT get_all_available_units(auth.uid());

-- Product images stored in lapak-images
-- Path: <user_id>/products/<product_id>.jpg
```

### Storefront Domain Dependencies (Future)

```sql
-- Business logo from storage
-- Path: <user_id>/logo/logo.png

-- Activity logs for order processing
SELECT log_activity(
  auth.uid(),
  'create_order',
  'New order from customer',
  '{"order_id": "...", "total": 500000}'::jsonb
);
```

---

## 🛠️ Troubleshooting

### Issue 1: Custom Unit Not Appearing

**Symptom**: Added custom unit but not showing in dropdown

**Diagnosis**:
```sql
-- Check if unit was added
SELECT custom_physical_units, custom_service_units
FROM user_unit_settings
WHERE user_id = '<user_uuid>';
```

**Solution**:
```sql
-- Re-add custom unit
SELECT add_custom_physical_unit('<user_uuid>', 'karung');
```

### Issue 2: Image Upload Fails

**Symptom**: 403 Forbidden when uploading image

**Diagnosis**:
```sql
-- Check bucket exists
SELECT * FROM storage.buckets WHERE id = 'lapak-images';

-- Check folder naming
-- ✅ Correct:   550e8400-e29b-41d4-a716-446655440000/products/my-image.jpg
-- ❌ Wrong:    products/my-image.jpg (no user_id)
```

**Solution**:
- Ensure path starts with `<user_id>/`
- Verify user is authenticated
- Check file size < 5MB
- Check MIME type is image/*

### Issue 3: Activity Logs Not Appearing

**Symptom**: Logs not showing in user's activity feed

**Diagnosis**:
```sql
-- Check if logs exist
SELECT COUNT(*) FROM activity_logs WHERE user_id = '<user_uuid>';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'activity_logs';
```

**Solution**:
```sql
-- Verify user_id matches auth.uid()
SELECT auth.uid(); -- Should match user_id in logs
```

### Issue 4: Storage Quota Exceeded

**Symptom**: Upload fails with quota exceeded error

**Diagnosis**:
```sql
-- Check current usage
SELECT * FROM get_user_storage_usage('<user_uuid>');

-- Check quota
SELECT check_user_storage_quota('<user_uuid>', 5242880, 50);
```

**Solution**:
- Delete unused images
- Compress images before upload
- Increase quota (if allowed)

### Debug Commands

Run comprehensive health check:

```sql
\i sql/domain/supporting/supporting.debug.sql
```

Check specific entity:

```sql
-- User units health
SELECT COUNT(*) AS total_users,
       AVG(array_length(custom_physical_units, 1)) AS avg_custom_physical,
       AVG(array_length(custom_service_units, 1)) AS avg_custom_service
FROM user_unit_settings;

-- Storage health
SELECT * FROM get_storage_statistics();

-- Activity logs health
SELECT COUNT(*) AS total_logs,
       COUNT(DISTINCT user_id) AS active_users,
       COUNT(DISTINCT action) AS unique_actions
FROM activity_logs;
```

---

## 📚 Related Documentation

- **CORE Domain**: `sql/domain/core/CORE.README.md`
- **Finance Domain**: `sql/domain/finance/FINANCE.README.md`
- **Master Setup Finance**: `MASTER_SETUP_FINANCE.md`
- **Quick Reference**: `QUICK_REFERENCE.md`
- **Deployment Checklist**: `DEPLOYMENT_CHECKLIST.md`

---

## 🏷️ Version History

- **v1.0** (2025-01-XX): Initial SUPPORTING domain release
  - 3 entities: user_unit_settings, storage/lapak-images, activity_logs
  - 12 SQL files (schema, logic, policies, index)
  - 19 functions, 3 triggers, 5 views
  - 17 RLS policies
  - 21 indexes, 16 constraints
  - Comprehensive storage management with quota system
  - Immutable audit trail with full-text search

---

## ✅ Success Criteria

After deployment, you should be able to:

- ✅ Create and manage custom units per user
- ✅ Upload images to folder-based storage
- ✅ Check storage usage and quota
- ✅ Log all user actions to audit trail
- ✅ Search and filter activity logs
- ✅ View storage and activity statistics
- ✅ RLS enforces user isolation and admin access
- ✅ Public can view images, authenticated can upload
- ✅ Activity logs are immutable (append-only)

---

**End of SUPPORTING Domain README**
