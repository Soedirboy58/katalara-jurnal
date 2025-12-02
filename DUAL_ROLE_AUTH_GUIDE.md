# 🔐 DUAL-ROLE AUTHENTICATION FLOW - QUICK GUIDE

## 📋 Overview

Katalara sekarang mendukung **2 role pengguna**:
1. **UMKM** (Pelanggan) - Pemilik bisnis
2. **Ranger** - Mahasiswa/Freelancer

---

## 🎯 User Flow

### **New User Registration**

```
1. Landing Page (/)
   ↓
2. Click "Daftar"
   ↓
3. Role Selection (/register-role)
   ├─ [Button] Saya Pelaku UMKM → /register?role=umkm
   └─ [Button] Saya Katalara Ranger → /register?role=ranger
   ↓
4. Register Form (/register)
   - Email
   - Password
   - Confirm Password
   - [Role badge displayed]
   ↓
5. Email Verification
   - User receives email
   - Click verification link
   ↓
6. Login (/login)
   - Enter email & password
   ↓
7. Dashboard Redirect (automatic based on role)
   ├─ UMKM → /dashboard (Finance, Products, etc.)
   └─ Ranger → /dashboard/rangers (Jobs, Portfolio, Earnings)
```

---

## 🆕 New Pages Created

### 1. `/register-role` - Role Selection Page
**File:** `src/app/register-role/page.tsx`

**Features:**
- ✅ Beautiful dual-card layout
- ✅ UMKM card (blue theme)
- ✅ Ranger card (purple theme)
- ✅ Feature comparison
- ✅ Responsive design

**When User Clicks:**
- UMKM card → Redirects to `/register?role=umkm`
- Ranger card → Redirects to `/register?role=ranger`

---

### 2. `/register` - Updated Registration Form
**File:** `src/app/register/page.tsx`

**Changes:**
- ✅ Reads `?role=` parameter from URL
- ✅ Shows role badge (UMKM or Ranger)
- ✅ Stores role in auth metadata
- ✅ "Ganti role" link back to selection page

**Code Snippet:**
```tsx
const searchParams = useSearchParams()
const [selectedRole, setSelectedRole] = useState<'umkm' | 'ranger'>('umkm')

useEffect(() => {
  const roleParam = searchParams?.get('role')
  if (roleParam === 'ranger' || roleParam === 'umkm') {
    setSelectedRole(roleParam)
  }
}, [searchParams])

// In signup:
await supabase.auth.signUp({
  email: formData.email,
  password: formData.password,
  options: {
    data: {
      role: selectedRole // Saved to auth.users metadata
    }
  }
})
```

---

### 3. `/login` - Updated Login Page
**File:** `src/app/login/page.tsx`

**Changes:**
- ✅ Info banner explaining universal login
- ✅ Updated "Daftar" button → redirects to `/register-role`
- ✅ Login logic checks role and redirects accordingly

**Redirect Logic:**
```tsx
if (profile.role === 'super_admin') {
  router.push('/admin/dashboard')
} else if (profile.role === 'ranger') {
  router.push('/dashboard/rangers')
} else {
  router.push('/dashboard') // UMKM
}
```

---

## 🗄️ Database Requirements

### User Profile Schema

Pastikan tabel `user_profiles` punya kolom:

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  role VARCHAR(50), -- 'umkm', 'ranger', 'mentor', 'investor', 'super_admin'
  full_name VARCHAR(255),
  business_name VARCHAR(255), -- For UMKM
  phone VARCHAR(20),
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Enum Type (from Rangers SQL)

```sql
CREATE TYPE user_role AS ENUM (
  'pelanggan',  -- UMKM (legacy name)
  'ranger',
  'mentor',
  'investor',
  'superuser'
);
```

**Note:** `'pelanggan'` dan `'umkm'` diperlakukan sama (UMKM user).

---

## 🎨 Visual Design

### Role Selection Page

```
┌────────────────────────────────────────────────────┐
│                    Katalara                         │
│         Teman Setia Pertumbuhan Bisnis Anda        │
│              Pilih peran Anda untuk memulai        │
│                                                     │
│  ┌──────────────────┐    ┌──────────────────┐     │
│  │   🏢 UMKM        │    │   👥 RANGER      │     │
│  │                  │    │                  │     │
│  │ Kelola keuangan  │    │ Penghasilan      │     │
│  │ Inventory        │    │ fleksibel        │     │
│  │ Katalog digital  │    │ Portfolio        │     │
│  │ Panggil Ranger   │    │ Rating           │     │
│  │                  │    │                  │     │
│  │ [Daftar UMKM →]  │    │ [Daftar Ranger →]│     │
│  └──────────────────┘    └──────────────────┘     │
│                                                     │
│  Sudah punya akun? Login di sini                   │
└────────────────────────────────────────────────────┘
```

### Register Page with Role Badge

```
┌────────────────────────────────────┐
│  ┌────────────────────┐            │
│  │ 🏢 Daftar sebagai  │            │
│  │    UMKM            │            │
│  └────────────────────┘            │
│                                    │
│   Daftar Akun Baru                 │
│   Langkah 1 dari 2                 │
│   [Ganti role]                     │
│                                    │
│   Email: ___________               │
│   Password: ________               │
│   Confirm: _________               │
│                                    │
│   [Lanjut ke Data Bisnis →]        │
└────────────────────────────────────┘
```

---

## 🔧 Implementation Checklist

### ✅ Completed

- [x] Create `/register-role` page (dual-card selection)
- [x] Update `/register` to read role parameter
- [x] Update `/login` redirect logic by role
- [x] Add role badge in register form
- [x] Store role in auth metadata
- [x] Create Rangers dashboard page (`/dashboard/rangers`)

### ⏳ Next Steps (When Activating)

- [ ] Create Ranger onboarding flow (after email verification)
  - Ranger-specific form: university, skills, location, KTM upload
- [ ] Create UMKM onboarding flow (existing `/register/business-info`)
- [ ] Update `user_profiles` creation trigger to handle role
- [ ] Create `ranger_profiles` record for Ranger users
- [ ] Add middleware to enforce role-based access

---

## 🚀 Testing Scenarios

### Test 1: UMKM Registration
1. Navigate to `/register-role`
2. Click "Saya Pelaku UMKM"
3. Fill email + password
4. Check URL contains `?role=umkm`
5. Submit form
6. Verify email sent
7. Click verification link
8. Login
9. Should redirect to `/dashboard`

### Test 2: Ranger Registration
1. Navigate to `/register-role`
2. Click "Saya Katalara Ranger"
3. Fill email + password
4. Check URL contains `?role=ranger`
5. Badge shows "Daftar sebagai Ranger"
6. Submit form
7. Verify email sent
8. Click verification link
9. Login
10. Should redirect to `/dashboard/rangers`

### Test 3: Role Switching
1. Start at `/register?role=umkm`
2. Click "Ganti role"
3. Should go back to `/register-role`
4. Select Ranger
5. URL updates to `?role=ranger`
6. Badge updates to purple

---

## 📝 Code Locations

| Feature | File Path |
|---------|-----------|
| Role Selection Page | `src/app/register-role/page.tsx` |
| Register Form | `src/app/register/page.tsx` |
| Login Page | `src/app/login/page.tsx` |
| Rangers Dashboard | `src/app/dashboard/rangers/page.tsx` |
| UMKM Dashboard | `src/app/dashboard/page.tsx` |
| Rangers Types | `src/types/rangers.ts` |

---

## 🎓 User Education

### In-App Messages

**Login Page Banner:**
> "**Login universal:** Gunakan email yang sama untuk akses sebagai UMKM atau Ranger. Sistem akan otomatis mengenali role Anda."

**Role Selection Page Footer:**
> "**100% Gratis untuk Memulai** - Tidak ada biaya pendaftaran. UMKM bisa langsung pakai semua fitur dasar. Rangers mulai dapat penghasilan dari job pertama!"

---

## 🔐 Security Notes

1. **Role Verification:**
   - Role disimpan di `auth.users.raw_user_meta_data.role`
   - Role JUGA disimpan di `user_profiles.role` (source of truth)
   - Always check DB role, not metadata (metadata bisa dimanipulasi)

2. **Access Control:**
   ```tsx
   // Middleware example
   if (path.startsWith('/dashboard/rangers')) {
     const profile = await getUserProfile(userId)
     if (profile.role !== 'ranger') {
       return redirect('/dashboard')
     }
   }
   ```

3. **Row Level Security:**
   - Rangers hanya bisa lihat `service_requests` di area mereka
   - UMKM hanya bisa lihat own business data
   - See `sql/05_rangers_ecosystem.sql` for RLS policies

---

## 💡 Tips for Developers

### How to Check Current User Role

```tsx
// Client-side
const { data: profile } = await supabase
  .from('user_profiles')
  .select('role')
  .eq('user_id', userId)
  .single()

if (profile.role === 'ranger') {
  // Show Rangers UI
} else {
  // Show UMKM UI
}
```

### How to Redirect After Login

```tsx
// In login handler
const profile = await getUserProfile(userId)

const redirectMap = {
  'super_admin': '/admin/dashboard',
  'ranger': '/dashboard/rangers',
  'umkm': '/dashboard',
  'pelanggan': '/dashboard', // Legacy
}

router.push(redirectMap[profile.role] || '/dashboard')
```

---

## 🎉 Success Criteria

✅ User dapat memilih role sebelum register
✅ Register form menampilkan role yang dipilih
✅ Login otomatis redirect sesuai role
✅ Rangers masuk ke Rangers dashboard
✅ UMKM masuk ke UMKM dashboard
✅ Tidak ada confusion antara 2 role

---

**Document Version:** 1.0  
**Last Updated:** 2025-12-02  
**Status:** ✅ Foundation Complete, Ready for Backend Integration
