# Deployment Guide - Complete

**Date:** Januari 2026  
**Status:** ✅ Complete  
**Target:** Production (Vercel + Supabase)  

---

## 🚀 Deployment Overview

### Architecture

```
┌─────────────────────────────────────────────────────┐
│                    User Browser                      │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│              Vercel Edge Network                     │
│  - Static Assets (CDN)                              │
│  - Next.js SSR/SSG                                  │
│  - API Routes                                       │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│                  Supabase                            │
│  - PostgreSQL Database                              │
│  - Authentication                                   │
│  - Storage (Product Images)                         │
│  - RLS Policies                                     │
└─────────────────────────────────────────────────────┘
```

---

## 📋 Pre-Deployment Checklist

### 1. Supabase Setup

- [ ] Supabase project created
- [ ] Database schema applied (`patch_transactions_system_unified.sql`)
- [ ] RLS policies enabled and tested
- [ ] Storage buckets created:
  - `products-images` (public)
  - `documents` (private)
- [ ] API keys noted:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

### 2. Code Preparation

- [ ] All tests passing (`npm run build`)
- [ ] No TypeScript errors
- [ ] Environment variables documented
- [ ] Git repository clean
- [ ] README.md updated with latest changes

### 3. Vercel Setup

- [ ] Vercel account connected to GitHub
- [ ] Project imported
- [ ] Environment variables set
- [ ] Build settings configured:
  - Framework: Next.js
  - Build Command: `npm run build`
  - Output Directory: (auto-detected)
  - Install Command: `npm install`

---

## 🔧 Step-by-Step Deployment

### Step 1: Supabase Database Setup

#### 1.1 Create Supabase Project

```bash
# Via Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Name: katalara-production
4. Region: Southeast Asia (Singapore) - closest to Indonesian users
5. Password: [Generate secure password]
```

#### 1.2 Apply Database Schema

```bash
# Option A: Via Supabase SQL Editor
1. Open Supabase Dashboard → SQL Editor
2. Paste content from: sql/patches/patch_transactions_system_unified.sql
3. Click "Run"
4. Wait for completion (~30 seconds)
5. Verify tables created: products, transactions, customers, etc.

# Option B: Via Supabase CLI
supabase db push

# Or via psql
psql -h db.xxx.supabase.co -U postgres -d postgres -f sql/patches/patch_transactions_system_unified.sql
```

#### 1.3 Verify RLS Policies

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Should show: rowsecurity = true for all tables

-- Test policy (as authenticated user)
SELECT * FROM products;  -- Should only show user's products
```

#### 1.4 Setup Storage Buckets

```sql
-- Via Supabase Dashboard → Storage → Create Bucket

1. Bucket: products-images
   - Public: Yes
   - Allowed file types: image/*
   - Max file size: 5MB

2. Bucket: documents
   - Public: No
   - Allowed file types: application/pdf
   - Max file size: 10MB
```

**Bucket Policies:**

```sql
-- products-images (public read)
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'products-images');

CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'products-images' AND 
  auth.role() = 'authenticated'
);

-- documents (private, user-only)
CREATE POLICY "Users can read own documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' AND 
  owner = auth.uid()
);
```

---

### Step 2: Vercel Deployment

#### 2.1 Connect Repository

```bash
# Via Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import Git Repository
4. Select: katalara-nextjs repository
5. Framework Preset: Next.js (auto-detected)
```

#### 2.2 Configure Build Settings

```yaml
# Vercel Dashboard → Project Settings → Build & Development Settings

Framework: Next.js
Build Command: npm run build
Output Directory: (leave blank - auto-detected)
Install Command: npm install
Root Directory: katalara-nextjs  # If repo has multiple projects
```

#### 2.3 Set Environment Variables

```bash
# Vercel Dashboard → Project Settings → Environment Variables

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Optional: Analytics, Monitoring
NEXT_PUBLIC_VERCEL_ENV=production
```

**Important:** 
- `NEXT_PUBLIC_*` variables are exposed to browser
- Service role key is server-only (never expose to browser)

#### 2.4 Deploy

```bash
# Option A: Via Vercel Dashboard
Click "Deploy" button

# Option B: Via Vercel CLI
npm i -g vercel
vercel --prod

# Option C: Git Push (Auto-deploy)
git push origin main  # If auto-deploy enabled
```

**Build Process:**
```
▲ Vercel
Building...
  ✓ Compiled successfully
  ✓ Generating static pages
  ✓ Finalizing page optimization
  ✓ Deployment Ready
```

**Deployment URL:**
```
Production: https://katalara.vercel.app
Preview: https://katalara-git-branch.vercel.app
```

---

### Step 3: Post-Deployment Verification

#### 3.1 Health Check

```bash
# Check deployment status
curl https://katalara.vercel.app
# Should return 200 OK

# Check API routes
curl https://katalara.vercel.app/api/health
# Should return: {"status": "ok"}
```

#### 3.2 Functional Tests

**Manual Testing Checklist:**

- [ ] **Landing Page**
  - Loads without errors
  - Login button visible
  - Responsive on mobile

- [ ] **Authentication**
  - Sign up works
  - Login works
  - Session persists
  - Logout works

- [ ] **Products**
  - Can create product
  - Can upload image
  - Stock display accurate
  - Edit/delete works

- [ ] **Transactions (Income)**
  - Can create sales transaction
  - Invoice generated correctly
  - Stock deducts
  - Invoice displays properly

- [ ] **Transactions (Expense)**
  - Can create purchase
  - Stock increases
  - Calculations correct

- [ ] **Dashboard**
  - KPIs load
  - Charts display
  - Data accurate

#### 3.3 Performance Tests

```bash
# Lighthouse CI
npm install -g @lhci/cli
lhci autorun --upload.target=temporary-public-storage

# Or via Chrome DevTools
# Open https://katalara.vercel.app
# F12 → Lighthouse → Generate Report
```

**Target Scores:**
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 95
- SEO: > 90

#### 3.4 Database Verification

```sql
-- Connect to production database
psql -h db.xxx.supabase.co -U postgres -d postgres

-- Check tables exist
\dt

-- Check data integrity
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM transactions;

-- Check indexes
\di

-- Check RLS policies
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

---

## 🔄 Continuous Deployment

### Git Workflow

```bash
# Development branch
git checkout -b feature/new-feature
# Make changes
git commit -am "Add new feature"
git push origin feature/new-feature

# Vercel auto-deploys preview:
# https://katalara-git-feature-new-feature.vercel.app

# Merge to main (after testing)
git checkout main
git merge feature/new-feature
git push origin main

# Vercel auto-deploys production:
# https://katalara.vercel.app
```

### Deployment Triggers

**Auto-Deploy On:**
- Push to `main` branch → Production
- Push to any branch → Preview deployment
- Pull request opened → Preview deployment

**Manual Deploy:**
```bash
vercel --prod  # Force production deploy
```

---

## 🐛 Rollback Strategy

### Quick Rollback (Vercel)

```bash
# Via Vercel Dashboard
1. Go to Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"

# Via CLI
vercel rollback
```

### Database Rollback

```bash
# Supabase provides point-in-time recovery
# Via Supabase Dashboard → Database → Backups

1. Select backup point
2. Click "Restore"
3. Confirm

# Note: This restores entire database, not just schema
```

---

## 📊 Monitoring & Logging

### Vercel Analytics

```bash
# Vercel Dashboard → Analytics

Metrics tracked:
- Page views
- Unique visitors
- Top pages
- Performance (Web Vitals)
- Geography
```

### Supabase Monitoring

```bash
# Supabase Dashboard → Database → Reports

Metrics:
- Query performance
- Connection pool
- Database size
- RLS overhead
```

### Error Tracking

**Vercel Logs:**
```bash
# Via Vercel Dashboard → Logs
# Or via CLI
vercel logs [deployment-url]
```

**Supabase Logs:**
```bash
# Via Supabase Dashboard → Database → Logs
# Filter by:
- Error level
- Time range
- Query type
```

---

## 🔐 Security Hardening

### Environment Security

```bash
# Never commit .env files
echo ".env.local" >> .gitignore
echo ".env.production" >> .gitignore

# Use Vercel's secure environment variables
# They're encrypted at rest
```

### API Security

```typescript
// All API routes check authentication
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'

export async function GET(request: Request) {
  const supabase = createServerSupabaseClient({ req: request })
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  // ... rest of API logic
}
```

### Database Security

```sql
-- RLS forces all queries to be user-scoped
-- Even if API is compromised, users can't access each other's data

-- Example: A hacker gets access to Supabase client
-- But queries still filtered by RLS:
SELECT * FROM products  -- Only returns hacker's products, not all users'
```

---

## 🚨 Incident Response

### Common Issues

#### Issue 1: Build Fails

**Symptoms:** Deployment fails with TypeScript errors

**Solution:**
```bash
# Test build locally first
npm run build

# Check for:
- TypeScript errors
- Missing dependencies
- Environment variables

# Fix and redeploy
git commit -am "Fix build errors"
git push
```

#### Issue 2: Database Connection Error

**Symptoms:** API routes return 500, logs show "connection refused"

**Solution:**
```bash
# Check Supabase status
https://status.supabase.com

# Verify environment variables
vercel env ls

# Test connection manually
psql -h db.xxx.supabase.co -U postgres -d postgres
```

#### Issue 3: Stock Showing 0

**Symptoms:** Products page shows stock = 0 for all products

**Solution:**
```sql
-- Run stock sync query
UPDATE public.products 
SET stock = COALESCE(stock_quantity, stock, 0)
WHERE stock IS NULL OR stock != stock_quantity;
```

**See:** [Stock Field Sync Fix](../../04-BUGFIXES/04_stock_field_synchronization.md)

---

## 📈 Scaling Considerations

### Supabase Limits (Free Tier)

- Database: 500 MB
- Storage: 1 GB
- Bandwidth: 2 GB/month
- API Requests: 50,000/month

**Upgrade Trigger:** 
- Approaching 80% of any limit
- Response time > 500ms consistently
- User count > 1,000 active

### Vercel Limits (Hobby)

- Bandwidth: 100 GB/month
- Build Minutes: 6,000/month
- Serverless Function Execution: 100 GB-Hours

**Upgrade Trigger:**
- Bandwidth > 80 GB/month
- Build time > 10 minutes

### Performance Optimization

**Database:**
```sql
-- Add composite indexes for common queries
CREATE INDEX idx_transactions_user_date 
ON transactions(user_id, transaction_date DESC);

-- Vacuum regularly (auto in Supabase)
VACUUM ANALYZE products;
```

**Next.js:**
```typescript
// Use static generation where possible
export const dynamic = 'force-static'

// Lazy load heavy components
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <Spinner />
})
```

---

## 🔗 Custom Domain Setup

### Step 1: Add Domain to Vercel

```bash
# Vercel Dashboard → Project Settings → Domains
1. Click "Add"
2. Enter: katalara.id
3. Choose: Assign to Production
```

### Step 2: Configure DNS

```bash
# At your domain registrar (e.g., Cloudflare, Namecheap)

Add CNAME record:
Name: @ (or www)
Target: cname.vercel-dns.com
TTL: Auto
```

### Step 3: SSL Certificate

```bash
# Vercel auto-provisions Let's Encrypt SSL
# Usually takes 1-5 minutes
# Check status: Vercel Dashboard → Domains
```

---

## 📋 Deployment Timeline

**Estimated Time:** 2-3 hours (first time)

| Task | Duration |
|------|----------|
| Supabase project setup | 10 min |
| Database schema application | 15 min |
| RLS policy verification | 10 min |
| Storage bucket setup | 10 min |
| Vercel project creation | 5 min |
| Environment variables | 10 min |
| First deployment | 5 min |
| Post-deployment tests | 30 min |
| Performance optimization | 30 min |
| Custom domain (optional) | 15 min |

**Subsequent Deployments:** < 5 minutes (auto via Git push)

---

## 🎓 Key Learnings

1. **Always test build locally** before deploying (`npm run build`)
2. **Use preview deployments** for testing features (deploy branch, not main)
3. **Monitor logs immediately** after deployment (first 5-10 min)
4. **Keep service role key secure** - never log or expose it
5. **RLS is your safety net** - even if API is compromised, data is protected

---

## 🔗 Related Documentation

- [Database Schema](./02_database_schema_setup.md)
- [Authentication System](./03_authentication_system.md)
- [Platform README](../../README.md)

---

## 📞 Support Resources

**Vercel:**
- Docs: https://vercel.com/docs
- Status: https://www.vercel-status.com
- Support: support@vercel.com

**Supabase:**
- Docs: https://supabase.com/docs
- Status: https://status.supabase.com
- Discord: https://discord.supabase.com

---

**Deployment Status:** ✅ Production Ready  
**Platform:** Vercel + Supabase  
**Region:** Singapore (closest to Indonesia)  
**Last Deploy:** Auto on `git push`
