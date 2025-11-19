# 🏗️ Katalara Platform - Architecture Blueprint

## 📋 Flow Overview

```
┌─────────────────────────────────────────────────────────────┐
│  1. LANDING PAGE (Public)                                   │
│     - Hero section dengan value proposition                 │
│     - Carousel fitur/testimoni                              │
│     - CTA: "Daftar Sekarang" atau "Masuk"                  │
└─────────────────────────────────────────────────────────────┘
                    ↓                    ↓
        [REGISTER FLOW]          [LOGIN FLOW]
                    ↓                    ↓
┌─────────────────────────────┐  ┌─────────────────────────────┐
│  2. REGISTRATION            │  │  3. LOGIN                   │
│     Step 1: Email/Password  │  │     - Email/Password        │
│     Step 2: Business Data   │  │     - Role detection        │
│       • Nama lengkap        │  │     - Redirect by role      │
│       • Alamat              │  └─────────────────────────────┘
│       • No. Telp            │                 ↓
│       • Kategori Bisnis     │    ┌───────────┴───────────┐
│     Step 3: Email verify    │    ↓                       ↓
└─────────────────────────────┘  SUPER ADMIN            USER
                    ↓              DASHBOARD          DASHBOARD
┌─────────────────────────────────────────────────────────────┐
│  4. ROLE-BASED DASHBOARDS                                   │
│                                                              │
│  ┌──────────────────────┐    ┌──────────────────────────┐ │
│  │  SUPER ADMIN POV     │    │  USER (UMKM) POV         │ │
│  ├──────────────────────┤    ├──────────────────────────┤ │
│  │  • User Management   │    │  • Products              │ │
│  │  • Analytics All     │    │  • Sales                 │ │
│  │  • UMKM Monitoring   │    │  • Expenses              │ │
│  │  • System Settings   │    │  • Reports               │ │
│  │  • Approve/Reject    │    │  • Inventory             │ │
│  └──────────────────────┘    └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│  5. DASHBOARD LAYOUT (All Roles)                            │
│     ┌───────────────────────────────────────────────────┐  │
│     │  TOP BAR: [Toggle] [Breadcrumb] [Avatar] [QA]    │  │
│     ├────────┬──────────────────────────────────────────┤  │
│     │        │  Main Content Area                       │  │
│     │ SIDE   │  - Dynamic pages based on role           │  │
│     │ BAR    │  - Products, Sales, etc.                 │  │
│     │ (hide/ │                                           │  │
│     │ show)  │                                           │  │
│     │        │                                           │  │
│     └────────┴──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema Updates

### 1. **users** table (Supabase Auth extended)
```sql
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
-- Roles: 'super_admin' | 'user'
```

### 2. **user_profiles** table (new)
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  business_category TEXT NOT NULL,
  business_name TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE, -- Super admin approval
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. **business_categories** table (reference)
```sql
CREATE TABLE business_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data
INSERT INTO business_categories (name) VALUES
  ('Fashion & Pakaian'),
  ('Makanan & Minuman'),
  ('Kecantikan & Kesehatan'),
  ('Elektronik'),
  ('Kerajinan Tangan'),
  ('Jasa'),
  ('Lainnya');
```

---

## 📁 File Structure

```
katalara-nextjs/
├── src/
│   ├── app/
│   │   ├── (public)/                    # Public routes (no auth)
│   │   │   ├── page.tsx                 # Landing page
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       ├── page.tsx             # Step 1: Email/Password
│   │   │       ├── business-info/
│   │   │       │   └── page.tsx         # Step 2: Business data
│   │   │       └── verify-email/
│   │   │           └── page.tsx         # Step 3: Verification
│   │   │
│   │   ├── (super-admin)/               # Super admin routes
│   │   │   ├── layout.tsx               # Super admin dashboard layout
│   │   │   ├── admin/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── users/               # User management
│   │   │   │   ├── approvals/           # Pending approvals
│   │   │   │   ├── analytics/
│   │   │   │   └── settings/
│   │   │
│   │   └── (user)/                      # User (UMKM) routes
│   │       ├── layout.tsx               # User dashboard layout
│   │       └── dashboard/
│   │           ├── page.tsx             # Dashboard home
│   │           ├── products/
│   │           ├── sales/
│   │           ├── expenses/
│   │           ├── reports/
│   │           └── inventory/
│   │
│   ├── components/
│   │   ├── landing/
│   │   │   ├── Hero.tsx
│   │   │   ├── Carousel.tsx
│   │   │   ├── Features.tsx
│   │   │   └── CTA.tsx
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx              # Collapsible sidebar
│   │   │   ├── TopBar.tsx               # Avatar + Quick Actions
│   │   │   ├── UserAvatar.tsx
│   │   │   └── QuickActions.tsx
│   │   ├── auth/
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── BusinessInfoForm.tsx
│   │   │   └── LoginForm.tsx
│   │   └── admin/
│   │       ├── UserTable.tsx
│   │       ├── ApprovalCard.tsx
│   │       └── AnalyticsChart.tsx
│   │
│   ├── hooks/
│   │   ├── useAuth.ts                   # Enhanced with role
│   │   ├── useProfile.ts                # User profile CRUD
│   │   ├── useSidebar.ts                # Sidebar state
│   │   └── useAdminUsers.ts             # Super admin user management
│   │
│   ├── types/
│   │   └── index.ts
│   │       - User type with role
│   │       - UserProfile type
│   │       - BusinessCategory type
│   │
│   └── middleware.ts                    # Role-based route protection
│
└── sql/
    └── 09_user_profiles_roles.sql       # New schema
```

---

## 🎨 Layout Components

### 1. **Sidebar** (Collapsible)
```tsx
Features:
- Toggle button (hide/unhide)
- Logo di top
- Menu items by role:
  * Super Admin: Users, Analytics, Approvals, Settings
  * User: Dashboard, Products, Sales, Expenses, Reports
- Active state indication
- Responsive (auto-collapse di mobile)
```

### 2. **TopBar**
```tsx
Components:
- Left: [☰ Toggle] [Breadcrumb]
- Right: [🔔 Notifications] [Avatar Dropdown] [⚡ Quick Actions]

Quick Actions:
- User: + Produk, + Penjualan, + Pengeluaran
- Admin: + User, View Pending
```

### 3. **Avatar Dropdown**
```tsx
Items:
- Profile name + role badge
- Edit Profile
- Settings
- Logout
```

---

## 🔐 Role-Based Access Control (RBAC)

### Middleware Protection
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const { user, role } = await getUser()
  
  // Super admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (role !== 'super_admin') return redirect('/dashboard')
  }
  
  // User routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!user) return redirect('/login')
    if (role === 'super_admin') return redirect('/admin/dashboard')
  }
}
```

### RLS Policies
```sql
-- Users can only see their own data
CREATE POLICY "Users see own data" ON products
  FOR SELECT USING (owner_id = auth.uid());

-- Super admins see all data
CREATE POLICY "Super admins see all" ON products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'super_admin'
    )
  );
```

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Current)
- [x] Landing page structure
- [x] Auth pages (login/register)
- [x] Database schema
- [x] Role detection

### Phase 2: Layouts
- [ ] Sidebar component
- [ ] TopBar with avatar + quick actions
- [ ] Dashboard layouts (user + admin)

### Phase 3: Super Admin
- [ ] User management table
- [ ] Approval workflow
- [ ] Analytics dashboard

### Phase 4: User Features
- [ ] Existing Products module integration
- [ ] Sales module
- [ ] Expenses module
- [ ] Reports

---

## 📝 Key Features

### Landing Page
- **Hero**: "Platform Manajemen UMKM Modern"
- **Carousel**: Fitur unggulan (Products, Sales, Reports, Analytics)
- **Testimonials**: Success stories UMKM
- **Pricing**: Gratis untuk UMKM
- **CTA**: Prominent "Mulai Gratis" button

### Registration Flow
1. **Email/Password** → Supabase Auth
2. **Business Info Form**:
   - Nama lengkap (required)
   - Alamat (required)
   - No. Telp (required, format validation)
   - Kategori Bisnis (dropdown, required)
   - Nama Bisnis (optional)
3. **Email Verification** → Supabase sends email
4. **Admin Approval** → Super admin reviews & approves

### Dashboard Features
- **Sidebar**: Collapsible, persisted state in localStorage
- **TopBar**: Breadcrumb navigation, avatar with dropdown
- **Quick Actions**: Floating action button or dropdown
- **Responsive**: Mobile-first design

---

**Next Step:** Mau saya mulai implement dari mana?
1. Landing page + auth flow?
2. Database schema + SQL migration?
3. Dashboard layout components?
