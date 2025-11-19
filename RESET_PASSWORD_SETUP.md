# Setup Reset Password Flow

## 🔧 Konfigurasi di Supabase Dashboard

### 1. Setup Email Templates
1. Buka **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Pilih template **"Reset Password"**
3. Pastikan **"Confirm signup" URL** sudah benar:
   ```
   {{ .SiteURL }}/reset-password?token={{ .Token }}&type=recovery
   ```

### 2. Setup Redirect URLs
1. Buka **Authentication** → **URL Configuration**
2. Tambahkan ke **"Redirect URLs"**:
   ```
   http://localhost:3000/reset-password
   https://your-domain.com/reset-password
   ```

### 3. Site URL Configuration
1. Pastikan **Site URL** sudah benar:
   - Development: `http://localhost:3000`
   - Production: `https://your-domain.com`

## 📝 Alur Reset Password

### User Flow:
1. **Lupa Password**
   - User klik "Lupa password?" di halaman login
   - Redirect ke `/forgot-password`

2. **Request Reset Link**
   - User input email
   - Sistem kirim email dengan link reset
   - Email berisi link: `http://localhost:3000/reset-password?token=xxx&type=recovery`

3. **Reset Password**
   - User klik link di email
   - Redirect ke `/reset-password`
   - System auto-verify token
   - User input password baru
   - Success → redirect ke `/login`

4. **Login dengan Password Baru**
   - User login menggunakan password yang baru

## 🧪 Testing

### Test dengan User Existing:
```sql
-- Di Supabase SQL Editor, generate reset link manual:
SELECT auth.admin_generate_link('recovery', 'delta.sc58@gmail.com');
```

Copy link yang dihasilkan dan buka di browser.

### Test Full Flow:
1. Buka `http://localhost:3000/login`
2. Klik "Lupa password?"
3. Input email: `delta.sc58@gmail.com`
4. Cek email (atau cek Supabase Logs)
5. Klik link reset password
6. Input password baru
7. Login dengan password baru

## ⚡ Quick Fix untuk User Existing

Jika mau langsung test tanpa reset password, buat user baru:

```sql
-- Buat user test dengan password yang Anda tahu
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test@katalara.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"role": "user"}'::jsonb,
  NOW(),
  NOW()
);
```

Login dengan:
- Email: `test@katalara.com`
- Password: `password123`

## 📋 Checklist

- [ ] Email templates dikonfigurasi di Supabase
- [ ] Redirect URLs ditambahkan
- [ ] Site URL sudah benar
- [ ] Test forgot password flow
- [ ] Test reset password flow
- [ ] Test login dengan password baru

## 🐛 Troubleshooting

**Email tidak terkirim?**
- Cek Supabase → Authentication → Logs
- Pastikan SMTP sudah dikonfigurasi (atau gunakan Supabase default)

**Link tidak valid?**
- Cek apakah redirect URL sudah ditambahkan
- Pastikan token belum expired (valid 1 jam)

**"Invalid login credentials"?**
- User mungkin belum confirm email
- Password salah
- Gunakan reset password flow
