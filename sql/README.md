# 📚 Katalara SQL Database Documentation

**Version:** 1.0  
**Last Updated:** November 24, 2025  
**Database:** PostgreSQL (Supabase)

---

## 📁 Directory Structure

```
sql/
├── 00-core/           # Core database schema (run first)
├── 01-features/       # Feature-specific tables
├── 02-migrations/     # Incremental updates
├── 03-seed-data/      # Demo & test data
├── 04-maintenance/    # Admin tools & scripts
├── 05-archived/       # Deprecated files (reference only)
├── DATABASE_ORGANIZATION_PLAN.md
├── DEMO_DATA_README.md
├── QUICK_START.md
├── TESTING_CHECKLIST.md
└── README.md          # This file
```

---

## 🚀 Quick Start

### For New Database Setup:

```sql
-- 1. Core Schema (Run in order)
\i 00-core/00-complete-schema.sql
\i 00-core/01-users-auth.sql
\i 00-core/02-business-config.sql
\i 00-core/05-storage.sql

-- 2. Feature Tables
\i 01-features/expenses.sql
\i 01-features/income.sql
\i 01-features/customers.sql
\i 01-features/lapak-online.sql
\i 01-features/financing.sql

-- 3. Migrations (if needed)
\i 02-migrations/2025-11-01-product-type.sql
\i 02-migrations/2025-11-05-service-products.sql
... (other migrations)

-- 4. Seed Data (optional - for testing)
\i 03-seed-data/demo-data-complete.sql
```

### Via Supabase Dashboard:
1. Go to SQL Editor
2. Create new query
3. Copy-paste content from files in order above
4. Execute

---

## 📖 Folder Details

### `00-core/` - Core Database Schema
**Purpose:** Essential tables & structure  
**Run First:** Yes, in numerical order  
**Files:**
- `00-complete-schema.sql` - Main database structure
- `01-users-auth.sql` - User authentication & profiles
- `02-business-config.sql` - Business settings
- `05-storage.sql` - File storage configuration

**Dependencies:** None (foundational)

---

### `01-features/` - Feature Tables
**Purpose:** Specific business features  
**Run After:** Core schema  
**Files:**
- `expenses.sql` - Expense tracking
- `income.sql` - Income transactions
- `customers.sql` - Customer management
- `lapak-online.sql` - E-commerce storefront
- `financing.sql` - Loans & investments
- `expenses-base.sql` - Base expense structure

**Dependencies:** Requires `00-core/` completed

---

### `02-migrations/` - Database Migrations
**Purpose:** Incremental schema updates  
**Run After:** Core + Features  
**Naming:** `YYYY-MM-DD-description.sql`

**Files:**
- `2025-11-01-product-type.sql` - Add product type field
- `2025-11-05-service-products.sql` - Service product support
- `2025-11-08-product-units.sql` - Product unit system
- `2025-11-10-multi-items.sql` - Multi-item transactions
- `2025-11-15-product-images.sql` - Product image fields

**Dependencies:** Check migration date & prerequisite tables

---

### `03-seed-data/` - Demo & Test Data
**Purpose:** Sample data for development/testing  
**Run After:** All schema completed  
**⚠️ Warning:** Do NOT run in production!

**Files:**
- `demo-data-complete.sql` - Full demo dataset
- `test-user-aris.sql` - Test user with sample data
- `update-timestamps.sql` - Update dates to current year

**Use Case:** Local development, demo presentations, testing

---

### `04-maintenance/` - Admin Tools
**Purpose:** Database maintenance & debugging  
**Run When:** As needed for troubleshooting

**Files:**
- `cleanup-scripts.sql` - Clean orphaned data
- `reset-onboarding.sql` - Reset user onboarding
- `verify-integrity.sql` - Check data integrity
- `debug-product-images.sql` - Debug image issues
- `check-user-config.sql` - Verify user configurations
- `delete_user_profile.sql` - ⚠️ Use with caution!

**Warning:** Some scripts modify/delete data. Review before running!

---

### `05-archived/` - Deprecated Files
**Purpose:** Historical reference only  
**Run:** Never (archived for reference)

**Contains:**
- Old fix scripts (already applied)
- Experimental features (not implemented)
- Superseded migrations
- One-time patches

**Why Keep?** Git history reference, understand past decisions

---

## 🔄 Migration Workflow

### Adding New Feature:

1. **Create Migration File:**
```bash
cd sql/02-migrations/
touch 2025-12-01-new-feature.sql
```

2. **Write Migration:**
```sql
-- 02-migrations/2025-12-01-new-feature.sql
-- Description: Add new feature X
-- Dependencies: 01-features/customers.sql

-- Check if already applied
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' 
    AND column_name = 'new_field'
  ) THEN
    ALTER TABLE customers ADD COLUMN new_field TEXT;
  END IF;
END $$;
```

3. **Test Locally:**
```bash
# Use Supabase local dev
supabase db reset
supabase db push
```

4. **Apply to Production:**
- Go to Supabase Dashboard → SQL Editor
- Run migration
- Verify no errors

5. **Commit to Git:**
```bash
git add sql/02-migrations/2025-12-01-new-feature.sql
git commit -m "feat: Add new feature X to database"
git push
```

---

## 🔒 Row Level Security (RLS)

**Status:** ✅ Enabled on all tables

### Key Policies:
```sql
-- Users can only see their own data
CREATE POLICY "users_own_data" ON expenses
  FOR ALL USING (user_id = auth.uid());

-- Business owners access their business data
CREATE POLICY "business_data_access" ON products
  FOR ALL USING (
    user_id IN (
      SELECT user_id FROM business_configurations 
      WHERE id = products.business_id
    )
  );
```

**Verify RLS:**
```bash
cd sql/04-maintenance/
psql < verify-integrity.sql
```

---

## 📊 Database Schema Overview

### Core Tables:
- `user_profiles` - User accounts & settings
- `business_configurations` - Business settings
- `products` - Product inventory
- `sales` - Sales transactions

### Transaction Tables:
- `incomes` - Income records (all types)
- `expenses` - Expense tracking
- `customers` - Customer database
- `suppliers` - Supplier information

### Feature Tables:
- `lapak_settings` - Online store configuration
- `lapak_products` - Storefront products
- `loans` - Loan tracking
- `investments` - Investment records
- `investors` - Investor profiles

### Storage:
- Bucket: `lapak-images` (public)
- RLS: Enabled per user

---

## 🧪 Testing

### Run Test Suite:
```bash
cd sql/
# Check file from TESTING_CHECKLIST.md
```

### Verify Schema:
```sql
-- Count tables
SELECT count(*) FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check RLS
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public';

-- Verify indexes
SELECT tablename, indexname FROM pg_indexes 
WHERE schemaname = 'public';
```

---

## 🔧 Common Tasks

### Reset Demo Data:
```bash
cd sql/03-seed-data/
psql < demo-data-complete.sql
```

### Backup Database:
```bash
# Via Supabase Dashboard
Settings → Database → Backup & Restore → Create backup

# Or via CLI
pg_dump -h <host> -U postgres -d <database> > backup.sql
```

### Restore from Backup:
```bash
psql -h <host> -U postgres -d <database> < backup.sql
```

---

## 📞 Troubleshooting

### Error: "relation does not exist"
**Solution:** Run core schema first
```bash
cd sql/00-core/
# Run all files in order
```

### Error: "duplicate key value violates unique constraint"
**Solution:** Check seed data conflicts
```bash
cd sql/04-maintenance/
psql < cleanup-scripts.sql
```

### Error: "permission denied for table"
**Solution:** Check RLS policies
```bash
cd sql/04-maintenance/
psql < verify-integrity.sql
```

---

## 📚 Additional Resources

- **Setup Guide:** `/sql/QUICK_START.md`
- **Demo Data:** `/sql/DEMO_DATA_README.md`
- **Testing:** `/sql/TESTING_CHECKLIST.md`
- **Organization:** `/sql/DATABASE_ORGANIZATION_PLAN.md`

---

## 🤝 Contributing

### Before Modifying Database:
1. ✅ Create migration file (don't edit core schema directly)
2. ✅ Test locally first
3. ✅ Document changes
4. ✅ Update this README if needed
5. ✅ Commit with clear message

### Migration Naming Convention:
```
YYYY-MM-DD-short-description.sql

Examples:
2025-11-24-add-tax-field.sql
2025-12-01-create-reports-table.sql
```

---

## ⚠️ Important Notes

1. **Never run seed data in production!**
2. **Always backup before major changes**
3. **Test migrations locally first**
4. **Review archived files before deleting**
5. **RLS policies protect user data - don't disable!**

---

## 📈 Database Health

**Status:** ✅ Organized & Maintained  
**Total Files:** ~55 files (organized into 6 categories)  
**Last Cleanup:** November 24, 2025  
**Schema Version:** 1.0

---

**Maintained by:** Katalara Development Team  
**Questions?** Check `/sql/QUICK_START.md` or contact support
