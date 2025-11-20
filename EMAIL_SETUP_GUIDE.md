# 📧 Email Template Setup Guide - Katalara

## ✅ Setup Confirm Signup Email di Supabase

### 1️⃣ Buka Supabase Dashboard
1. Login ke [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project **Katalara**
3. Navigasi ke: **Authentication** → **Email Templates**

### 2️⃣ Edit Confirm Signup Template
1. Klik tab **"Confirm signup"**
2. Anda akan melihat template default Supabase
3. **Delete semua isi template lama**
4. Copy-paste seluruh code dari file: `email-templates/confirm-signup.html`
5. Klik **Save** di pojok kanan atas

### 3️⃣ Preview & Test

#### Preview di Supabase:
- Scroll ke bawah, klik **"Send test email"**
- Masukkan email testing Anda
- Cek inbox Anda

#### Test Real Registration:
1. Buka website: https://supabase-migration-adsit7alb-katalaras-projects.vercel.app
2. Register dengan email baru
3. Cek inbox → Anda akan menerima email dengan desain baru!

---

## 🎨 Fitur Desain Email Baru

### Visual Design:
- ✅ **Modern card layout** dengan shadow & border-radius
- ✅ **Hero illustration** (SVG icon dengan checkmark)
- ✅ **Gradient button** (purple gradient seperti Jira)
- ✅ **Clean typography** (System fonts untuk konsistensi)
- ✅ **Responsive design** (600px width, mobile-friendly)
- ✅ **Professional footer** dengan security note

### Content Structure:
```
┌─────────────────────────────────────┐
│   [Hero Icon - Document + Check]    │
│                                     │
│  Langkah terakhir sebelum memulai!  │
├─────────────────────────────────────┤
│  Hi user@email.com,                 │
│                                     │
│  Klik tombol di bawah untuk         │
│  verifikasi email Anda.             │
│                                     │
│   [Verifikasi email Anda] ←Button   │
│                                     │
│  ─────────────────────────          │
│                                     │
│  Atau salin link ini:               │
│  [https://katalara.com/...]         │
├─────────────────────────────────────┤
│  Catatan keamanan:                  │
│  Link akan expired dalam 24 jam     │
│                                     │
│  © 2025 Katalara                    │
└─────────────────────────────────────┘
```

### Color Palette:
- **Background**: `#F4F5F7` (Light gray)
- **Card**: `#FFFFFF` (White)
- **Primary Text**: `#172B4D` (Dark blue-gray)
- **Secondary Text**: `#42526E` (Medium gray)
- **Tertiary Text**: `#6B778C` (Light gray)
- **Button**: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)` (Purple gradient)
- **Accent**: `#2196F3` (Blue), `#4CAF50` (Green)

---

## 🔧 Customization Options

### 1. Ganti Button Color:
```html
<!-- Original (Purple gradient) -->
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

<!-- Alternative (Blue solid) -->
background: #2196F3;

<!-- Alternative (Green solid) -->
background: #4CAF50;
```

### 2. Ganti Hero Icon:
- File SVG ada di dalam template (line ~50-60)
- Ganti dengan logo Katalara actual jika ada
- Atau gunakan external image:
```html
<img src="https://your-cdn.com/katalara-logo.png" width="120" height="120" alt="Katalara">
```

### 3. Ganti Wording:
- **Heading**: Line ~70 - `Langkah terakhir sebelum memulai!`
- **Body**: Line ~80-90 - Pesan utama
- **Button text**: Line ~100 - `Verifikasi email Anda`
- **Footer**: Line ~135-145 - Security note & copyright

---

## 📱 Email Client Compatibility

✅ **Tested & Working:**
- Gmail (Web, iOS, Android)
- Outlook (Web, Desktop)
- Apple Mail (macOS, iOS)
- Yahoo Mail
- ProtonMail

⚠️ **Known Issues:**
- Beberapa old email clients tidak support gradient button
  - Fallback: Solid color akan ditampilkan
- SVG illustration mungkin tidak muncul di Outlook Desktop
  - Fallback: Email tetap readable tanpa icon

---

## 🚀 Next Steps

### Setup Email Templates Lainnya:

1. **Reset Password Email**
   - Path: Authentication → Email Templates → **"Reset password"**
   - Desain serupa dengan confirm signup
   - Button text: "Reset Password Saya"

2. **Magic Link Email**
   - Path: Authentication → Email Templates → **"Magic Link"**
   - Untuk passwordless login (future feature)

3. **Invite User Email**
   - Path: Authentication → Email Templates → **"Invite user"**
   - Untuk team collaboration (future feature)

---

## 📊 Monitoring & Analytics

### Track Email Delivery:
1. Supabase Dashboard → **Logs** → **Auth Logs**
2. Filter by: `email.sent`
3. Check delivery status, open rate (if tracking enabled)

### Common Issues:

**Email tidak terkirim?**
- Check spam folder
- Verify Supabase Email Settings (Authentication → Settings)
- Check rate limits (Supabase free tier: 30 emails/hour)

**Link expired?**
- Default expiry: 24 hours
- User harus request ulang verification email
- Settings di: Authentication → Settings → **"Email auth"**

---

## 💡 Pro Tips

1. **Enable Email Tracking**:
   - Add UTM parameters untuk analytics
   - Track button clicks di Google Analytics

2. **Custom SMTP (Optional)**:
   - Supabase default uses internal SMTP
   - Untuk branding, gunakan SendGrid/Mailgun
   - Settings di: Authentication → Settings → **"SMTP Settings"**

3. **A/B Testing**:
   - Test different button colors
   - Test different copy (formal vs casual)
   - Monitor conversion rate

---

## 🎯 Quick Copy-Paste Checklist

- [ ] Buka Supabase Dashboard
- [ ] Authentication → Email Templates
- [ ] Tab "Confirm signup"
- [ ] Delete isi lama
- [ ] Copy dari `email-templates/confirm-signup.html`
- [ ] Paste ke editor
- [ ] Save
- [ ] Send test email
- [ ] Check inbox
- [ ] ✅ Done!

---

**Need help?** Refer to [Supabase Email Templates Docs](https://supabase.com/docs/guides/auth/auth-email-templates)

