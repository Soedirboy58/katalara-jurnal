# 🔐 ADMIN PANEL SETUP GUIDE

## ✅ Implementasi Complete

### **Fitur yang Sudah Dibuat:**
1. ✅ Admin SQL views & functions
2. ✅ Login role detection (super_admin vs user)
3. ✅ Admin middleware (route protection)
4. ✅ Admin dashboard UI
5. ✅ User management (approve, suspend, activate)
6. ✅ Platform statistics & analytics

---

## 📋 Setup Instructions

### **Step 1: Run SQL Migration**
Jalankan file SQL di Supabase SQL Editor:

```bash
File: sql/02-migrations/admin-panel-setup.sql
```

Ini akan membuat:
- `admin_user_analytics` view
- `admin_platform_stats` view
- `approve_user()` function
- `suspend_user()` function
- `activate_user()` function

### **Step 2: Create First Super Admin**

**Option A: Via Supabase Dashboard**
1. Buka Supabase Dashboard → Authentication → Users
2. Klik "Add User" 
3. Input:
   - Email: `admin@katalara.com` (atau email Anda)
   - Password: (set password yang kuat)
   - Auto Confirm: ✅ Yes

**Option B: Via SQL**
```sql
-- Insert admin user
INSERT INTO auth.users (
  email, 
  encrypted_password, 
  email_confirmed_at,
  raw_user_meta_data
)
VALUES (
  'admin@katalara.com',
  crypt('your-secure-password', gen_salt('bf')),
  NOW(),
  '{"role": "super_admin"}'::jsonb
);
```

### **Step 3: Set Role to Super Admin**
```sql
-- Update profile role
UPDATE user_profiles 
SET 
  role = 'super_admin',
  is_approved = true,
  is_verified = true,
  is_active = true,
  full_name = 'Admin Katalara',
  phone = '081234567890',
  business_name = 'Katalara Admin'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'admin@katalara.com'
);
```

### **Step 4: Test Login**
1. Buka: `https://your-domain.com/login`
2. Login dengan:
   - Email: `admin@katalara.com`
   - Password: (password yang Anda set)
3. Setelah login, otomatis redirect ke: `/admin/dashboard`

---

## 🎯 Flow Login

### **User Biasa:**
```
/login → Input credentials → Check role = 'user'
  → Redirect to /dashboard (user interface)
```

### **Super Admin:**
```
/login → Input credentials → Check role = 'super_admin'
  → Redirect to /admin/dashboard (admin panel)
```

### **Security Protection:**
```
❌ User coba akses /admin → Middleware detect → Redirect to /dashboard
❌ Not logged in → Middleware detect → Redirect to /login
```

---

## 🔧 Admin Panel Features

### **1. Dashboard Overview**
- Total users (active/inactive/pending)
- Platform statistics (30 days)
- Transaction volume
- Revenue analytics
- Feature adoption rates

### **2. User Management**
- **Search**: By email, name, business name
- **Filter**: All, Active, Pending, Inactive
- **Actions**:
  - ✅ Approve pending users
  - 🚫 Suspend active users
  - ✅ Activate suspended users
  - 👁️ View detailed analytics

### **3. User Analytics (Per User)**
- Transaction counts (income/expense)
- Total revenue & expenses
- Product, customer, supplier counts
- Activity status (Very Active, Active, Idle, Dormant)
- Days since registration
- Last activity date

---

## 🛡️ Security Features

1. **Middleware Protection**: `/admin/*` routes protected
2. **Role-Based Access**: Only `super_admin` can access
3. **RLS Policies**: Database-level security
4. **Function Security**: `SECURITY DEFINER` for admin functions
5. **Session Validation**: Auto-logout on expired session

---

## 📊 Available Admin Views

### **admin_user_analytics**
Comprehensive user data with business metrics:
```sql
SELECT * FROM admin_user_analytics 
WHERE activity_status = 'Very Active'
ORDER BY total_revenue DESC;
```

### **admin_platform_stats**
Platform-wide statistics:
```sql
SELECT * FROM admin_platform_stats;
```

---

## 🚀 Next Steps (Future Enhancements)

### **Phase 2: Advanced Features**
- [ ] Bulk user operations (approve/suspend multiple)
- [ ] Export user data to CSV/Excel
- [ ] Email notifications (welcome, approval, suspension)
- [ ] Activity audit log
- [ ] Custom admin notes per user

### **Phase 3: Analytics**
- [ ] Revenue trend charts
- [ ] User growth graph
- [ ] Feature adoption funnel
- [ ] Cohort analysis
- [ ] Custom date range filters

### **Phase 4: Security**
- [ ] 2FA for admin login
- [ ] IP whitelist
- [ ] Login attempt tracking
- [ ] Email alert on admin login
- [ ] Session management (force logout all sessions)

---

## ⚠️ Important Notes

1. **First Admin**: Buat super admin pertama secara manual via SQL
2. **Password**: Gunakan password yang KUAT untuk admin account
3. **Email**: Jangan gunakan email yang sama dengan user biasa
4. **Backup**: Backup database sebelum run migration
5. **Testing**: Test approve/suspend di staging dulu sebelum production

---

## 🐛 Troubleshooting

### **"Access Denied" saat login admin**
```sql
-- Check role user
SELECT user_id, email, role, is_active, is_approved 
FROM user_profiles up
JOIN auth.users u ON u.id = up.user_id
WHERE u.email = 'admin@katalara.com';

-- Fix: Set role super_admin
UPDATE user_profiles 
SET role = 'super_admin' 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@katalara.com');
```

### **View not found error**
```sql
-- Re-run migration
-- File: sql/02-migrations/admin-panel-setup.sql
```

### **Function not found**
```sql
-- Check if functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN ('approve_user', 'suspend_user', 'activate_user');

-- If missing, re-run migration
```

---

## 📞 Support

Jika ada issue:
1. Check console logs (F12 → Console)
2. Check Supabase logs (Dashboard → Logs)
3. Verify SQL migration berhasil
4. Verify middleware.ts active (bukan .disabled)

---

**Version**: 1.0  
**Last Updated**: 2025-11-24  
**Status**: ✅ Production Ready
