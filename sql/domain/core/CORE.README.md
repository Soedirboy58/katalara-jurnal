# CORE Domain - README

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
5. [Relationships](#relationships)
6. [Deployment Order](#deployment-order)
7. [Usage Examples](#usage-examples)
8. [Security Model](#security-model)
9. [Cross-Domain Integration](#cross-domain-integration)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Domain Overview

The **CORE** domain manages the foundational user identity, business configurations, and business type classification systems. It serves as the central authentication and profile management layer that all other domains depend on.

### Purpose

- **User Identity**: Link Supabase Auth to application-level user profiles with roles
- **Business Configuration**: Store per-user business settings, onboarding progress, and preferences
- **Business Classification**: Categorize businesses by keywords to enable tailored features

### Key Features

- ✅ Role-based access control (super_admin / user)
- ✅ User approval workflow for account activation
- ✅ Onboarding progress tracking (7 steps)
- ✅ Business type auto-classification with 5 categories
- ✅ Keyword-based business detection (200+ keywords)
- ✅ Business health score calculation
- ✅ Multi-language/currency/timezone support
- ✅ Alert preferences and revenue targets

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      CORE DOMAIN                              │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────┐                                         │
│  │  auth.users     │  (Supabase Auth - External)            │
│  └────────┬────────┘                                         │
│           │ FK: user_id                                      │
│           ↓                                                  │
│  ┌─────────────────┐                                         │
│  │ user_profiles   │  (Application-level profiles + roles)  │
│  └────────┬────────┘                                         │
│           │ FK: user_id                                      │
│           ↓                                                  │
│  ┌──────────────────────┐                                    │
│  │business_configurations│ (User settings + onboarding)     │
│  └────────┬──────────────┘                                   │
│           │ FK: business_category (optional)                │
│           ↓                                                  │
│  ┌──────────────────────┐                                    │
│  │business_type_mappings│ (Reference data: 5 categories)    │
│  └──────────────────────┘                                    │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Signup**: User creates account in `auth.users` (Supabase Auth)
2. **Profile Creation**: Trigger auto-creates entry in `user_profiles` with `role=user`, `account_status=pending_approval`
3. **Approval**: Super admin approves account → status = `active`
4. **Onboarding**: User completes 7-step onboarding → business config initialized
5. **Classification**: System auto-detects business category from keywords → links to `business_type_mappings`

---

## 📦 Entity Catalog

### 1. user_profiles

**Purpose**: Application-level user profiles with role management and approval workflow

**Key Columns**:
- `user_id` (UUID, FK to auth.users) - Primary identifier
- `full_name`, `phone`, `business_name` - Profile info
- `role` (enum: super_admin | user) - Access level
- `account_status` (enum: pending_approval | active | suspended) - Account state
- `approved_by`, `approved_at` - Audit trail

**Functions** (6):
- `handle_new_user()` - Trigger to auto-create profile on signup
- `get_user_with_profile(user_id)` - Join auth.users + user_profiles
- `get_pending_approval_users()` - List users awaiting approval
- `approve_user_account(user_id)` - Activate account
- `deactivate_user_account(user_id)` - Suspend account
- `get_user_statistics()` - Admin analytics

**Security**: RLS enabled, users see own profile only, super_admins see all

**Files**:
- `user_profiles.schema.sql` (85 lines)
- `user_profiles.logic.sql` (320 lines)
- `user_profiles.policies.sql` (130 lines)
- `user_profiles.index.sql` (180 lines)

---

### 2. business_configurations

**Purpose**: Per-user business settings, onboarding progress, targets, and preferences

**Key Columns**:
- `user_id` (UUID, FK to user_profiles) - One config per user
- `business_category` (text, FK to business_type_mappings) - Auto-detected or manual
- `onboarding_completed` (boolean) - Has user finished setup?
- `onboarding_step` (int 0-7) - Current step in wizard
- `onboarding_progress` (JSONB) - Step completion details
- `monthly_revenue_target`, `initial_capital` - Financial goals
- `alert_preferences` (JSONB) - Notification settings
- `default_language`, `default_currency`, `timezone` - Localization

**Functions** (7):
- `get_business_config(user_id)` - Retrieve config
- `initialize_business_config(user_id, category)` - Create initial config
- `complete_onboarding(user_id)` - Mark onboarding done
- `update_onboarding_step(user_id, step, data)` - Track progress
- `get_onboarding_statistics()` - Admin analytics
- `get_users_by_category(category)` - Filter by business type
- `calculate_business_health_score(user_id)` - Health metric

**Security**: RLS enabled, users see own config only, super_admins see all

**Files**:
- `business_config.schema.sql` (140 lines)
- `business_config.logic.sql` (300 lines)
- `business_config.policies.sql` (130 lines)
- `business_config.index.sql` (220 lines)

---

### 3. business_type_mappings

**Purpose**: Reference data for business categorization with keyword matching

**Key Columns**:
- `category` (text, UNIQUE) - Category name (e.g., "Produk Dengan Stok")
- `keywords[]` (text[]) - Matching keywords for auto-classification
- `indicators[]` (text[]) - Business characteristic indicators
- `examples[]` (text[]) - Example businesses
- `description` (text) - Category explanation
- `recommended_features[]` (text[]) - Platform features to enable
- `usage_count` (int) - How many businesses use this category

**Seed Data** (5 categories):
1. **Produk dengan Stok** - 70+ keywords (toko, retail, grosir, etc.)
2. **Produk Tanpa Stok** - 30+ keywords (dropship, reseller, affiliate, etc.)
3. **Jasa/Layanan** - 60+ keywords (salon, konsultan, service, etc.)
4. **Trading/Reseller** - 25+ keywords (importir, distributor, agen, etc.)
5. **Hybrid** - 15+ keywords (cafe, restoran, hotel, etc.)

**Functions** (7):
- `classify_business_by_keywords(description)` - Auto-detect category with confidence score
- `get_business_type_by_category(category)` - Retrieve category details
- `get_all_business_types()` - List all categories
- `search_business_types_by_keyword(keyword)` - Search by keyword
- `get_recommended_features(category)` - Get feature list
- `update_business_type_mapping(category, data)` - Admin update
- `get_category_usage_statistics()` - Analytics

**Security**: RLS enabled, all authenticated users can SELECT, only super_admins can INSERT/UPDATE/DELETE

**Files**:
- `business_types.schema.sql` (220 lines)
- `business_types.logic.sql` (260 lines)
- `business_types.policies.sql` (95 lines)
- `business_types.index.sql` (190 lines)

---

## 📁 File Structure

```
sql/domain/core/
├── user_profiles.schema.sql       (85 lines)   - Table definition + enums
├── user_profiles.logic.sql        (320 lines)  - 6 functions + 2 triggers + 1 view
├── user_profiles.policies.sql     (130 lines)  - 7 RLS policies
├── user_profiles.index.sql        (180 lines)  - 14 indexes + 10 constraints
│
├── business_config.schema.sql     (140 lines)  - Table definition
├── business_config.logic.sql      (300 lines)  - 7 functions + 2 triggers + 1 view
├── business_config.policies.sql   (130 lines)  - 8 RLS policies
├── business_config.index.sql      (220 lines)  - 17 indexes + 15 constraints
│
├── business_types.schema.sql      (220 lines)  - Table + seed data (5 categories)
├── business_types.logic.sql       (260 lines)  - 7 functions + 1 trigger + 1 view
├── business_types.policies.sql    (95 lines)   - 4 RLS policies (public read)
├── business_types.index.sql       (190 lines)  - 8 indexes + 13 constraints
│
├── CORE.README.md                 (this file)
└── core.debug.sql                 (smoke tests - TBD)
```

**Total**: 12 SQL files + 2 documentation files = 14 files  
**Total Lines of Code**: ~2,260 lines of SQL

---

## 🔗 Relationships

### Entity Relationship Diagram

```
auth.users (Supabase Auth)
    │
    │ 1:1
    ↓
user_profiles
    │ user_id (PK)
    │ role (super_admin | user)
    │ account_status (pending_approval | active | suspended)
    │
    │ 1:1
    ↓
business_configurations
    │ user_id (PK, FK)
    │ business_category (FK) ← Optional
    │ onboarding_step (0-7)
    │ monthly_revenue_target
    │
    │ N:1 (optional)
    ↓
business_type_mappings (Reference Data)
    │ category (PK)
    │ keywords[]
    │ recommended_features[]
```

### Relationship Details

1. **auth.users → user_profiles** (1:1, required)
   - FK: `user_profiles.user_id` → `auth.users.id`
   - Trigger: Auto-create profile on signup
   - Cascade: ON DELETE CASCADE

2. **user_profiles → business_configurations** (1:1, required after onboarding)
   - FK: `business_configurations.user_id` → `user_profiles.user_id`
   - Initialized during onboarding
   - Cascade: ON DELETE CASCADE

3. **business_configurations → business_type_mappings** (N:1, optional)
   - FK: `business_configurations.business_category` → `business_type_mappings.category`
   - Can be NULL (not yet classified)
   - Auto-detected via `classify_business_by_keywords()`
   - Cascade: ON DELETE SET NULL

---

## 🚀 Deployment Order

**CRITICAL**: Deploy files in this exact order to satisfy dependencies.

### Step 1: Schema Layer (Tables)

```sql
\i sql/domain/core/user_profiles.schema.sql
\i sql/domain/core/business_config.schema.sql
\i sql/domain/core/business_types.schema.sql  -- Includes seed data
```

### Step 2: Logic Layer (Functions + Triggers + Views)

```sql
\i sql/domain/core/user_profiles.logic.sql
\i sql/domain/core/business_config.logic.sql
\i sql/domain/core/business_types.logic.sql
```

### Step 3: Security Layer (RLS Policies)

```sql
\i sql/domain/core/user_profiles.policies.sql
\i sql/domain/core/business_config.policies.sql
\i sql/domain/core/business_types.policies.sql
```

### Step 4: Performance Layer (Indexes + Constraints)

```sql
\i sql/domain/core/user_profiles.index.sql
\i sql/domain/core/business_config.index.sql
\i sql/domain/core/business_types.index.sql
```

### Verification

Run smoke tests after deployment:

```sql
\i sql/domain/core/core.debug.sql
```

---

## 💡 Usage Examples

### Example 1: User Signup Flow

```sql
-- 1. User creates account (Supabase Auth handles this)
-- auth.users table gets new row

-- 2. Trigger auto-creates profile
-- Trigger: handle_new_user() fires after INSERT on auth.users

-- 3. Check profile created
SELECT * FROM user_profiles WHERE user_id = '<user_uuid>';

-- Result:
-- user_id: <uuid>
-- role: 'user'
-- account_status: 'pending_approval'
-- created_at: <timestamp>
```

### Example 2: Admin Approves User

```sql
-- Super admin approves user account
SELECT approve_user_account('<user_uuid>');

-- Check status
SELECT account_status, approved_by, approved_at 
FROM user_profiles 
WHERE user_id = '<user_uuid>';

-- Result:
-- account_status: 'active'
-- approved_by: '<admin_uuid>'
-- approved_at: <timestamp>
```

### Example 3: Initialize Business Config

```sql
-- Create business config during onboarding
SELECT initialize_business_config(
  '<user_uuid>',
  'Produk Dengan Stok'  -- Optional category
);

-- Check config
SELECT * FROM business_configurations WHERE user_id = '<user_uuid>';

-- Result:
-- user_id: <uuid>
-- business_category: 'Produk Dengan Stok'
-- onboarding_completed: false
-- onboarding_step: 0
-- default_language: 'id'
-- default_currency: 'IDR'
```

### Example 4: Auto-Classify Business

```sql
-- Classify business by description
SELECT classify_business_by_keywords(
  'Saya punya toko kelontong menjual berbagai produk retail'
);

-- Result:
-- {
--   "category": "Produk Dengan Stok",
--   "confidence_score": 85,
--   "matched_keywords": ["toko", "kelontong", "produk", "retail"]
-- }
```

### Example 5: Track Onboarding Progress

```sql
-- User completes onboarding step
SELECT update_onboarding_step(
  '<user_uuid>',
  3,  -- Step number
  '{"business_name": "Toko Maju", "business_type": "retail"}'::jsonb
);

-- Check progress
SELECT onboarding_step, onboarding_completed, onboarding_progress
FROM business_configurations
WHERE user_id = '<user_uuid>';

-- Result:
-- onboarding_step: 3
-- onboarding_completed: false
-- onboarding_progress: {"step_3_completed": true, ...}
```

### Example 6: Calculate Business Health Score

```sql
-- Get health score
SELECT calculate_business_health_score('<user_uuid>');

-- Result:
-- {
--   "health_score": 75,
--   "factors": {
--     "profile_completeness": 100,
--     "onboarding_progress": 85,
--     "business_activity": 50
--   }
-- }
```

### Example 7: Get Recommended Features

```sql
-- Get platform features for category
SELECT get_recommended_features('Jasa/Layanan');

-- Result:
-- [
--   "appointment_booking",
--   "customer_management",
--   "service_packages",
--   "commission_tracking"
-- ]
```

---

## 🔐 Security Model

### RLS Policies Summary

#### user_profiles (7 policies)

1. **user_profiles_select_own**: Users see their own profile
2. **user_profiles_select_admin**: Super admins see all profiles
3. **user_profiles_update_own**: Users update their own profile
4. **user_profiles_update_admin**: Super admins update any profile
5. **user_profiles_insert**: Auto-insert via trigger only
6. **user_profiles_delete_admin**: Super admins delete profiles
7. **user_profiles_approve_admin**: Super admins approve accounts

#### business_configurations (8 policies)

1. **business_config_select_own**: Users see their own config
2. **business_config_select_admin**: Super admins see all configs
3. **business_config_insert_own**: Users create their own config
4. **business_config_insert_admin**: Super admins create any config
5. **business_config_update_own**: Users update their own config
6. **business_config_update_admin**: Super admins update any config
7. **business_config_delete_own**: Users delete their own config
8. **business_config_delete_admin**: Super admins delete any config

#### business_type_mappings (4 policies)

1. **business_types_select_public**: All authenticated users can view (reference data)
2. **business_types_insert_admin**: Super admins add new categories
3. **business_types_update_admin**: Super admins update categories
4. **business_types_delete_admin**: Super admins delete categories

### Role Hierarchy

```
super_admin (Full Access)
    │
    ├─ View all user profiles
    ├─ Approve/suspend accounts
    ├─ Manage business configurations
    ├─ Manage business type mappings
    └─ Access admin analytics
    
user (Own Data Only)
    │
    ├─ View own profile
    ├─ Update own profile
    ├─ View own business config
    ├─ Update own business config
    └─ View business type mappings (read-only)
```

### Security Best Practices

1. ✅ **Always enable RLS**: All tables have RLS enabled
2. ✅ **Use auth.uid()**: Policies filter by authenticated user ID
3. ✅ **Check role in policies**: Super admin policies verify `role='super_admin'`
4. ✅ **Audit trails**: Track approved_by, approved_at
5. ✅ **No direct deletes**: Use `account_status='suspended'` instead of DELETE

---

## 🌐 Cross-Domain Integration

The CORE domain is referenced by all other domains (Finance, Inventory, etc.)

### Finance Domain Dependencies

```sql
-- Expenses table references user_profiles
expenses (
  user_id UUID REFERENCES user_profiles(user_id)
)

-- Suppliers table references user_profiles
suppliers (
  user_id UUID REFERENCES user_profiles(user_id)
)
```

### Inventory Domain Dependencies (Future)

```sql
-- Products table references user_profiles
products (
  user_id UUID REFERENCES user_profiles(user_id)
)

-- Stock movements reference user_profiles
stock_movements (
  user_id UUID REFERENCES user_profiles(user_id)
)
```

### Integration Pattern

All domain tables should:

1. Include `user_id UUID NOT NULL` column
2. Add FK constraint: `REFERENCES user_profiles(user_id) ON DELETE CASCADE`
3. Add index: `CREATE INDEX idx_<table>_user_id ON <table>(user_id)`
4. Add RLS policy: `WHERE user_id = auth.uid() OR is_super_admin()`

---

## 🛠️ Troubleshooting

### Issue 1: Profile Not Created on Signup

**Symptom**: User in `auth.users` but not in `user_profiles`

**Diagnosis**:
```sql
-- Check if trigger exists
SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check if function exists
SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';
```

**Solution**:
```sql
-- Re-deploy trigger
\i sql/domain/core/user_profiles.logic.sql
```

### Issue 2: User Can't Access Business Config

**Symptom**: RLS denies access to business_configurations

**Diagnosis**:
```sql
-- Check if config exists
SELECT * FROM business_configurations WHERE user_id = auth.uid();

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'business_configurations';
```

**Solution**:
```sql
-- Initialize config if missing
SELECT initialize_business_config(auth.uid());
```

### Issue 3: Business Type Not Detected

**Symptom**: `classify_business_by_keywords()` returns NULL

**Diagnosis**:
```sql
-- Check if seed data exists
SELECT category, array_length(keywords, 1) 
FROM business_type_mappings;

-- Should return 5 rows with 15-70 keywords each
```

**Solution**:
```sql
-- Re-seed data
\i sql/domain/core/business_types.schema.sql
```

### Issue 4: Onboarding Stuck

**Symptom**: Onboarding step not advancing

**Diagnosis**:
```sql
-- Check onboarding state
SELECT onboarding_step, onboarding_completed, onboarding_progress
FROM business_configurations
WHERE user_id = '<user_uuid>';
```

**Solution**:
```sql
-- Manually advance step
SELECT update_onboarding_step('<user_uuid>', <next_step>, '{}'::jsonb);
```

### Debug Commands

Run comprehensive health check:

```sql
\i sql/domain/core/core.debug.sql
```

Check specific entity:

```sql
-- User profiles health
SELECT COUNT(*) AS total_users,
       COUNT(*) FILTER (WHERE account_status = 'active') AS active_users,
       COUNT(*) FILTER (WHERE account_status = 'pending_approval') AS pending_users
FROM user_profiles;

-- Business configs health
SELECT COUNT(*) AS total_configs,
       COUNT(*) FILTER (WHERE onboarding_completed) AS completed_onboarding,
       AVG(onboarding_step)::numeric(10,2) AS avg_onboarding_step
FROM business_configurations;

-- Business types usage
SELECT category, usage_count, array_length(keywords, 1) AS keyword_count
FROM business_type_mappings
ORDER BY usage_count DESC;
```

---

## 📚 Related Documentation

- **Finance Domain**: `sql/domain/finance/FINANCE.README.md`
- **Master Setup Finance**: `MASTER_SETUP_FINANCE.md`
- **Quick Reference**: `QUICK_REFERENCE.md`
- **Deployment Checklist**: `DEPLOYMENT_CHECKLIST.md`

---

## 🏷️ Version History

- **v1.0** (2025-01-XX): Initial CORE domain release
  - 3 entities: user_profiles, business_configurations, business_type_mappings
  - 12 SQL files (schema, logic, policies, index)
  - 20 functions, 5 triggers, 3 views
  - 19 RLS policies
  - 39 indexes, 38 constraints
  - 5 seeded business categories with 200+ keywords

---

## ✅ Success Criteria

After deployment, you should be able to:

- ✅ Create user account and auto-generate profile
- ✅ Super admin can approve user accounts
- ✅ User can complete 7-step onboarding
- ✅ Business type auto-detected from description
- ✅ Business config initialized with default values
- ✅ RLS enforces user isolation (users see only their data)
- ✅ Super admins can access all data
- ✅ Business health score calculated correctly
- ✅ Recommended features retrieved per category

---

**End of CORE Domain README**
