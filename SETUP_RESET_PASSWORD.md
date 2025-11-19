# 🔑 Setup Environment Variables di Vercel

## Masalah: Reset Password Link Expired

Jika link reset password langsung expired, kemungkinan **NEXT_PUBLIC_SITE_URL** belum di-set di Vercel.

## ✅ Solusi: Tambahkan Environment Variable

### 1. Buka Vercel Dashboard

Klik link: https://vercel.com/katalaras-projects/supabase-migration/settings/environment-variables

### 2. Tambahkan Variable Baru

Klik **Add New** dan masukkan:

| Key | Value | Environment |
|-----|-------|-------------|
| `NEXT_PUBLIC_SITE_URL` | `https://supabase-migration-gamma.vercel.app` | Production |

### 3. Redeploy

Setelah tambah environment variable, **wajib redeploy**:

```bash
cd katalara-nextjs
vercel --prod
```

Atau dari Vercel Dashboard:
1. Pergi ke **Deployments** tab
2. Klik tombol **⋮** (three dots) pada deployment terakhir
3. Pilih **Redeploy**

## 🧪 Testing Reset Password

Setelah redeploy:

1. Buka: https://supabase-migration-gamma.vercel.app/forgot-password
2. Masukkan email Anda
3. Cek inbox email
4. Klik link reset password
5. Seharusnya muncul form **"Masukkan password baru Anda"** ✅

## 🎨 Perubahan Tampilan

✅ **Background Brand Image** - Kedua halaman (forgot-password & reset-password) sekarang menggunakan brand image yang sama dengan register/login
✅ **Overlay Gelap** - Ditambahkan overlay 40% opacity untuk readability
✅ **Backdrop Blur** - Card form menggunakan glass morphism effect
✅ **Professional Look** - Consistent dengan branding Katalara

## 📝 Environment Variables Lengkap

File `.env.local` (untuk development):

```env
NEXT_PUBLIC_SUPABASE_URL=https://usradkbchlkcfoabxvbo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
NEXT_PUBLIC_APP_NAME=Katalara Platform
NEXT_PUBLIC_APP_VERSION=2.0.0
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Vercel (untuk production):

```env
NEXT_PUBLIC_SUPABASE_URL=https://usradkbchlkcfoabxvbo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
NEXT_PUBLIC_APP_NAME=Katalara Platform
NEXT_PUBLIC_APP_VERSION=2.0.0
NEXT_PUBLIC_SITE_URL=https://supabase-migration-gamma.vercel.app
```

## 🔍 Debugging

Jika masih expired setelah setup:

1. **Cek environment variable di Vercel**:
   - Pastikan `NEXT_PUBLIC_SITE_URL` sudah tersimpan
   - Pastikan sudah redeploy setelah tambah variable

2. **Cek Supabase Email Template**:
   - Buka Supabase Dashboard → Authentication → Email Templates
   - Pastikan template "Reset Password" menggunakan `{{ .ConfirmationURL }}`

3. **Cek Console Browser**:
   - Buka DevTools → Console
   - Lihat apakah ada error saat klik link reset password

## 🎯 Root Cause

**Sebelum fix**:
```typescript
redirectTo: `${window.location.origin}/reset-password`
```
- `window.location.origin` tidak tersedia saat server-side
- Supabase membuat link dengan origin yang salah
- Link langsung expired karena mismatch

**Setelah fix**:
```typescript
const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL 
  ? `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`
  : `${window.location.origin}/reset-password`
```
- Menggunakan environment variable yang di-set di Vercel
- Fallback ke `window.location.origin` untuk development
- Link reset password valid dan berfungsi ✅

---

**Status**: ✅ Fixed (perlu redeploy setelah set environment variable)
