# 🚀 DEPLOYMENT STANDARD - KATALARA PLATFORM

## ⚠️ **CRITICAL: READ THIS BEFORE DEPLOYING**

This document defines the **ONLY CORRECT WAY** to deploy Katalara Platform to Vercel.

---

## 📁 **PROJECT STRUCTURE**

```
c:\Users\user\Downloads\Platform\new\
├── .vercel/                          ← Vercel project configuration (ROOT)
│   └── project.json                  ← Links to "supabase-migration" project
├── vercel.json                       ← ROOT deployment config
├── katalara-nextjs/                  ← Next.js application folder
│   ├── .vercel/                      ⚠️ WRONG! Don't use this
│   ├── vercel.json                   ⚠️ Subfolder config (not for deploy)
│   ├── src/                          ← Source code
│   ├── package.json
│   └── next.config.ts
└── supabase-migration/               ← Database migration files
```

---

## ✅ **CORRECT DEPLOYMENT METHOD**

### **Step 1: Navigate to ROOT folder**
```powershell
cd "c:\Users\user\Downloads\Platform\new"
```

**⚠️ IMPORTANT:** Always deploy from `new/` (ROOT), **NEVER** from `new/katalara-nextjs/`

### **Step 2: Deploy to production**
```powershell
vercel --prod
```

**That's it!** No additional flags, no project linking, no setup needed.

---

## ❌ **WRONG DEPLOYMENT METHODS**

### **DON'T DO THIS:**
```powershell
# ❌ WRONG: Deploy from subfolder
cd "c:\Users\user\Downloads\Platform\new\katalara-nextjs"
vercel --prod
# Result: Path error "katalara-nextjs\katalara-nextjs not found"

# ❌ WRONG: Create new project
cd "c:\Users\user\Downloads\Platform\new\katalara-nextjs"
vercel --prod --yes
# Result: Creates new project without env vars

# ❌ WRONG: Link to wrong project
vercel link
# Result: Path confusion and broken deployment
```

---

## 🔧 **VERCEL CONFIGURATION FILES**

### **ROOT vercel.json** (c:\Users\user\Downloads\Platform\new\vercel.json)
```json
{
  "buildCommand": "cd katalara-nextjs && npm run build",
  "outputDirectory": "katalara-nextjs/.next",
  "framework": "nextjs",
  "installCommand": "cd katalara-nextjs && npm install"
}
```

**Purpose:** Tells Vercel to enter `katalara-nextjs/` subfolder for build

### **Subfolder vercel.json** (katalara-nextjs/vercel.json)
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": ".next"
}
```

**Purpose:** Local development configuration only (not used for deployment)

---

## 🎯 **VERCEL PROJECT DETAILS**

### **Project Information:**
- **Project Name:** `supabase-migration`
- **Organization:** `Katalara's projects` (`team_fKxk8LIA2jrFlSB3xz80m0u7`)
- **Project ID:** `prj_w74otQQCRP4q9FmgKp6nQ5rcDmgK`
- **GitHub Repo:** `https://github.com/Soedirboy58/katalara-umkm`
- **Production URL:** `https://supabase-migration-*.vercel.app`

### **Environment Variables (Already Configured):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://usradkbchlkcfoabxvbo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

✅ These are **already set** in Vercel dashboard, no need to reconfigure.

---

## 📊 **DEPLOYMENT WORKFLOW**

### **Standard Workflow:**
```mermaid
graph LR
    A[Make Changes] --> B[Test Locally]
    B --> C[cd ROOT folder]
    C --> D[vercel --prod]
    D --> E[✅ Deployed]
```

### **Complete Example:**
```powershell
# 1. Make code changes
# 2. Test locally
cd "c:\Users\user\Downloads\Platform\new\katalara-nextjs"
npm run build  # Check for TypeScript errors
npm run dev    # Test locally

# 3. Deploy from ROOT
cd "c:\Users\user\Downloads\Platform\new"
vercel --prod

# 4. Verify deployment
# Check production URL in terminal output
```

---

## 🔍 **TROUBLESHOOTING**

### **Problem 1: "Path katalara-nextjs\katalara-nextjs not found"**
**Cause:** You're deploying from wrong directory

**Solution:**
```powershell
cd "c:\Users\user\Downloads\Platform\new"  # Go to ROOT
vercel --prod
```

---

### **Problem 2: "Environment variables missing"**
**Cause:** You created a new Vercel project instead of using existing one

**Solution:**
```powershell
# Remove wrong project link
cd "c:\Users\user\Downloads\Platform\new\katalara-nextjs"
Remove-Item -Recurse -Force .vercel

# Deploy from ROOT (will use correct project)
cd "c:\Users\user\Downloads\Platform\new"
vercel --prod
```

---

### **Problem 3: "Project not found"**
**Cause:** `.vercel/project.json` is missing or corrupted

**Solution:**
```powershell
# Check if .vercel folder exists in ROOT
Test-Path "c:\Users\user\Downloads\Platform\new\.vercel\project.json"

# If false, create new link
cd "c:\Users\user\Downloads\Platform\new"
vercel link
# Select: Katalara's projects → supabase-migration

# Then deploy
vercel --prod
```

---

## 📝 **PRE-DEPLOYMENT CHECKLIST**

Before running `vercel --prod`, verify:

- [ ] Current directory is `c:\Users\user\Downloads\Platform\new` (ROOT)
- [ ] `npm run build` succeeds in `katalara-nextjs/` folder
- [ ] No TypeScript errors in build output
- [ ] `.vercel/project.json` exists in ROOT folder
- [ ] Git changes are committed (optional, but recommended)

---

## 🎯 **DEPLOYMENT HISTORY**

### **Successful Deployments:**

| Date | Changes | Working Dir | Result |
|------|---------|-------------|--------|
| 2025-11-23 | EXPENSE 6 issues fixed | `new/` (ROOT) | ✅ Success |
| 2025-11-24 | Customer Modal integration | `new/` (ROOT) | ✅ Success |

### **Failed Deployments (Lessons Learned):**

| Date | Error | Cause | Fix |
|------|-------|-------|-----|
| 2025-11-24 | Path not found | Deploy from `katalara-nextjs/` | Deploy from ROOT |
| 2025-11-24 | Missing env vars | Created new project | Use existing project |

---

## 💡 **WHY THIS METHOD?**

### **Reason 1: Monorepo Structure**
Platform has multiple folders (katalara-nextjs, supabase-migration). Vercel project is configured for monorepo deployment.

### **Reason 2: Environment Variables**
Existing project has all env vars configured. Creating new project requires manual setup.

### **Reason 3: Git Integration**
GitHub repo is linked to `supabase-migration` project, not a subfolder.

### **Reason 4: Consistency**
Using same method every time prevents confusion and errors.

---

## 🚨 **CRITICAL RULES**

### **RULE #1: Always Deploy from ROOT**
```powershell
✅ CORRECT: cd "c:\Users\user\Downloads\Platform\new"
❌ WRONG:   cd "c:\Users\user\Downloads\Platform\new\katalara-nextjs"
```

### **RULE #2: Never Create New Vercel Project**
✅ Use existing `supabase-migration` project
❌ Don't create `katalara-nextjs` project

### **RULE #3: Don't Touch .vercel/ Folder**
✅ Leave `.vercel/` in ROOT folder untouched
❌ Don't delete, modify, or create new `.vercel/` folders

### **RULE #4: Deploy Command is Simple**
```powershell
✅ CORRECT: vercel --prod
❌ WRONG:   vercel --prod --yes
❌ WRONG:   vercel deploy --prod
❌ WRONG:   vercel --prod --scope=...
```

---

## 📞 **QUICK REFERENCE**

### **Deploy in 2 Commands:**
```powershell
cd "c:\Users\user\Downloads\Platform\new"
vercel --prod
```

### **Check Current Project:**
```powershell
cd "c:\Users\user\Downloads\Platform\new"
cat .vercel\project.json
# Should show: "projectName": "supabase-migration"
```

### **View Deployment Logs:**
```powershell
vercel logs
```

### **List All Deployments:**
```powershell
vercel list
```

---

## 🎓 **FOR AI AGENTS**

If you're an AI agent reading this in a new chat session:

1. **Always deploy from:** `c:\Users\user\Downloads\Platform\new` (ROOT folder)
2. **Never deploy from:** `c:\Users\user\Downloads\Platform\new\katalara-nextjs`
3. **Vercel project name:** `supabase-migration` (already has env vars)
4. **Deploy command:** `cd "c:\Users\user\Downloads\Platform\new" ; vercel --prod`
5. **No setup needed:** Project is already linked, env vars already set

**If deployment fails, check:**
- Are you in ROOT folder? (Use `pwd` to verify)
- Does `.vercel/project.json` exist in ROOT?
- Did you accidentally create new project? (Check `vercel list`)

---

## 📅 **CHANGELOG**

### **v1.0.0 - 2025-11-25**
- Initial deployment standard documentation
- Defined ROOT folder deployment as official method
- Documented common errors and solutions
- Created quick reference for AI agents

---

**Status:** ✅ **OFFICIAL DEPLOYMENT STANDARD**
**Last Updated:** 2025-11-25
**Author:** GitHub Copilot + Human Verification
**Verified Working:** ✅ YES (Multiple successful deployments)
