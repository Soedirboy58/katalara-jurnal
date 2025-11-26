# 🚀 Deployment Checklist - Production Deployment

## ✅ Pre-Deployment (Completed)

### Frontend Features
- [x] Created UserMenu component with full features
- [x] Created Profile page with form validation
- [x] Created Activity Log page with filters
- [x] Created General Settings page
- [x] Integrated UserMenu into Sidebar
- [x] Fixed TypeScript errors
- [x] **Build successful** (npm run build ✅)
- [x] Created database migration files
- [x] Created documentation

### Finance Domain (v1.0) - 🔒 Frozen & Stable
- [x] Created 6 entities: Expenses, Suppliers, Customers, Incomes, Loans, Investments
- [x] Implemented modular SQL architecture (24 files)
- [x] Added 45+ functions, 27+ triggers, 128+ indexes
- [x] Secured with 36 RLS policies
- [x] Created comprehensive smoke tests (`finance.debug.sql`)
- [x] Tagged as `finance-domain-v1.0`
- [x] Created Master Setup documentation

## 📋 Deployment Steps

### Step 1: Finance Domain Migration (Required First!)

**⚠️ CRITICAL: Run Smoke Tests Before Production**

```bash
# Run mandatory smoke tests in dev/staging first
psql -h your-staging-db -U postgres -d your-db -f sql/domain/finance/finance.debug.sql

# Expected output: All 9 sections pass without errors
# ✅ Health Check
# ✅ Revenue Summary
# ✅ Piutang Aging
# ✅ Customer Analytics
# ✅ Supplier Analytics
# ✅ Expense Analytics
# ✅ Profit Analysis
# ✅ Performance Validation
# ✅ Data Integrity
```

**Deploy Finance Domain (if smoke tests pass):**

```bash
# Phase 1: Schema (in order - respects foreign keys)
psql -f sql/domain/finance/suppliers.schema.sql
psql -f sql/domain/finance/customers.schema.sql
psql -f sql/domain/finance/expenses.schema.sql
psql -f sql/domain/finance/incomes.schema.sql
psql -f sql/domain/finance/loans.schema.sql
psql -f sql/domain/finance/investments.schema.sql

# Phase 2: Logic (functions & triggers)
psql -f sql/domain/finance/suppliers.logic.sql
psql -f sql/domain/finance/customers.logic.sql
psql -f sql/domain/finance/expenses.logic.sql
psql -f sql/domain/finance/incomes.logic.sql
psql -f sql/domain/finance/loans.logic.sql
psql -f sql/domain/finance/investments.logic.sql

# Phase 3: Security (RLS policies)
psql -f sql/domain/finance/suppliers.policies.sql
psql -f sql/domain/finance/customers.policies.sql
psql -f sql/domain/finance/expenses.policies.sql
psql -f sql/domain/finance/incomes.policies.sql
psql -f sql/domain/finance/loans.policies.sql
psql -f sql/domain/finance/investments.policies.sql

# Phase 4: Performance (indexes & constraints)
psql -f sql/domain/finance/suppliers.index.sql
psql -f sql/domain/finance/customers.index.sql
psql -f sql/domain/finance/expenses.index.sql
psql -f sql/domain/finance/incomes.index.sql
psql -f sql/domain/finance/loans.index.sql
psql -f sql/domain/finance/investments.index.sql

# Verify deployment
psql -f sql/domain/finance/finance.debug.sql
```

**Supabase Alternative:**
1. Login to Supabase Dashboard → SQL Editor
2. Run each file content in order (copy-paste)
3. Verify: No errors in execution log
4. Run smoke tests last

### Step 2: User Menu Migration (Required Second!)

**Option A: Supabase SQL Editor (Recommended)**
1. Login to Supabase Dashboard
2. Navigate to SQL Editor
3. Create new query
4. Copy-paste content from: `sql/create_activity_logs_table.sql`
5. Click "Run"
6. Create another new query
7. Copy-paste content from: `sql/add_settings_to_business_config.sql`
8. Click "Run"

**Option B: Using Supabase CLI**
```bash
supabase db push
```

**Verify Migration Success:**
```sql
-- Should return table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'activity_logs';

-- Should return new columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'business_configurations'
  AND column_name IN ('theme', 'language', 'currency');
```

### Step 3: Deploy to Vercel

```bash
cd katalara-nextjs
vercel --prod
```

**Expected Output:**
```
✓ Production deployment complete
🔗 https://your-app.vercel.app
```

### Step 4: Post-Deployment Testing

#### Finance Domain Tests (MANDATORY)
- [ ] Run smoke tests in production: `finance.debug.sql`
- [ ] All 9 sections pass without errors
- [ ] Query performance < 100ms (sample data)
- [ ] RLS policies working (test with 2+ users)
- [ ] Functions callable from frontend
- [ ] Triggers executing correctly
- [ ] No foreign key violations
- [ ] Index usage verified

#### Test 1: User Menu Dropdown
- [ ] Login to dashboard
- [ ] Click avatar in sidebar
- [ ] Menu opens with smooth animation
- [ ] All menu items visible
- [ ] Click outside closes menu
- [ ] Press Escape closes menu

#### Test 2: Profile Page
- [ ] Click "Profile" in user menu
- [ ] Page loads without errors
- [ ] Existing data loads automatically
- [ ] Update full name and save
- [ ] Toast notification appears
- [ ] Data persists after refresh

#### Test 3: Activity Log Page
- [ ] Click "Activity Log" in user menu
- [ ] Page loads without errors
- [ ] Activity from profile update appears
- [ ] Filter by action type works
- [ ] Filter by date range works
- [ ] Timeline displays correctly
- [ ] Icons and colors correct

#### Test 4: General Settings Page
- [ ] Click "General Settings" in user menu
- [ ] Page loads without errors
- [ ] All toggles work smoothly
- [ ] Threshold inputs accept numbers
- [ ] Save button works
- [ ] Settings persist after refresh
- [ ] Reset to Default works
- [ ] Activity logged after save

#### Test 5: Mobile Responsiveness
- [ ] Open DevTools → Device mode
- [ ] Test on iPhone SE (375px)
- [ ] Test on iPad (768px)
- [ ] User menu displays correctly
- [ ] All pages are responsive
- [ ] Forms usable on mobile
- [ ] Touch interactions work

## 🔍 Error Checking

### Check Browser Console
```javascript
// Should see no errors
// Look for:
// ✓ No 404 errors
// ✓ No TypeScript errors
// ✓ No Supabase connection errors
// ✓ No RLS policy errors
```

### Check Supabase Logs
1. Go to Supabase Dashboard
2. Navigate to Logs → Database
3. Look for errors around:
   - INSERT into activity_logs
   - SELECT from activity_logs
   - UPDATE business_configurations

### Check Vercel Logs
```bash
vercel logs
```

Look for:
- Build errors (should be none)
- Runtime errors
- API route errors

## 🐛 Common Issues & Fixes

### Finance Domain Issues

#### Issue: "table does not exist" (expenses/incomes/etc)
**Fix:** Deploy schema files in correct order (see Step 1)

#### Issue: "function does not exist" (get_revenue_summary)
**Fix:** Deploy logic files: `entity.logic.sql`

#### Issue: "permission denied" on finance tables
**Fix:** Deploy RLS policies: `entity.policies.sql`

#### Issue: "foreign key constraint violation"
**Fix:** 
- Check deployment order (suppliers before expenses, customers before incomes)
- Verify referenced record exists
- Check owner_id matches

#### Issue: Smoke tests fail
**Fix:**
- Review error messages in `finance.debug.sql` output
- Check if all files deployed successfully
- Verify data exists in tables
- Re-run failed section individually

#### Issue: Poor query performance
**Fix:** Deploy index files: `entity.index.sql`

### User Menu Issues

#### Issue: "activity_logs table does not exist"
**Fix:** Run database migrations (Step 2)

#### Issue: "column does not exist" in business_configurations
**Fix:** Run `sql/add_settings_to_business_config.sql`

#### Issue: "permission denied for table activity_logs"
**Fix:** Check RLS policies are created correctly

#### Issue: User menu not appearing
**Fix:** 
- Check user is logged in
- Clear browser cache
- Check console for errors

#### Issue: Settings not saving
**Fix:**
- Verify business_configurations migration ran
- Check Supabase connection
- Verify RLS policies

## 📊 Success Metrics

After deployment, verify:
- [ ] 0 build errors
- [ ] 0 TypeScript errors
- [ ] 0 runtime errors in production
- [ ] All 3 new pages accessible
- [ ] User menu functional
- [ ] Activity logging working
- [ ] Settings persisting

## 🎯 Performance Checks

- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 3s
- [ ] Lighthouse Performance > 90
- [ ] No memory leaks
- [ ] Smooth animations (60fps)

## 🔒 Security Checks

- [ ] RLS policies active on activity_logs
- [ ] Users can only see own data
- [ ] Auth required for all pages
- [ ] No sensitive data in client
- [ ] HTTPS enabled

## 📱 User Acceptance Testing

### Scenario 1: New User
1. Register new account
2. Login to dashboard
3. Click avatar → Profile
4. Fill in profile info
5. Save and verify
6. Check Activity Log for entry
7. Open Settings
8. Change theme to Dark
9. Save and verify theme applied

### Scenario 2: Existing User
1. Login with existing account
2. Open Profile page
3. Verify existing data loads
4. Update business name
5. Check Activity Log shows update
6. Open Settings
7. Enable expense alerts
8. Set threshold to 500000
9. Save and verify

### Scenario 3: Activity Tracking
1. Create new income entry
2. Check Activity Log
3. Create new expense entry
4. Check Activity Log again
5. Delete an entry
6. Verify all actions logged
7. Test filters (Income, Expense)
8. Test date ranges

## ✅ Sign-Off Checklist

### Finance Domain v1.0
- [ ] Schema migrations successful (6 entities)
- [ ] Logic migrations successful (45+ functions)
- [ ] RLS policies active (36 policies)
- [ ] Indexes created (128+ indexes)
- [ ] Smoke tests pass (`finance.debug.sql`)
- [ ] Performance benchmarks met (< 100ms)
- [ ] Documentation reviewed (`MASTER_SETUP_FINANCE.md`)
- [ ] Git tag created: `finance-domain-v1.0`
- [ ] Status: 🔒 Frozen & Stable

### User Menu Feature
- [ ] Database migrations successful
- [ ] Activity logs table created
- [ ] Settings columns added
- [ ] RLS policies active

### General
- [ ] Vercel deployment successful
- [ ] All tests passed
- [ ] No errors in console
- [ ] Mobile responsive
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Documentation complete
- [ ] User guide ready
- [ ] Ready for production use

## 🎉 Post-Deployment

### Announce to Users
```
🎉 Major Platform Update!

💰 Finance Domain (v1.0) - Production Ready
- Modular SQL architecture for better performance
- 6 interconnected entities: Expenses, Suppliers, Customers, Incomes, Loans, Investments
- Enhanced data integrity and security
- Comprehensive analytics and reporting
- All existing data preserved (backward-compatible)

✨ User Menu & Settings
- Click your avatar for quick access to profile and settings

👤 Profile Page
- Update your personal and business information

📋 Activity Log
- Track all your actions in the system

⚙️ General Settings
- Customize theme, language, and notifications
- Set up alerts for expenses and low stock

Check out the new features and let us know what you think!
```

### Monitor for 24 Hours
- [ ] Check error rates (Finance domain queries)
- [ ] Monitor query performance (< 100ms target)
- [ ] Verify smoke tests pass in production
- [ ] Check RLS working correctly
- [ ] Monitor user engagement
- [ ] Gather user feedback
- [ ] Fix any issues quickly

### Weekly Maintenance (Finance Domain)
- [ ] Run `finance.debug.sql` smoke tests
- [ ] Check index usage statistics
- [ ] Monitor dead tuples (run VACUUM if > 20%)
- [ ] Review slow query log
- [ ] Verify data integrity constraints

---

**Deployment Date:** _________________  
**Deployed By:** _________________  
**Finance Domain Version:** v1.0 (Frozen & Stable)  
**Git Tag:** finance-domain-v1.0  
**Status:** ☐ Pending ☐ In Progress ☐ Complete  
**Notes:** _________________________________

**References:**
- Finance Domain Setup: `sql/domain/finance/MASTER_SETUP_FINANCE.md`
- Smoke Tests: `sql/domain/finance/finance.debug.sql`
- Entity Documentation: `sql/domain/finance/README.md`
