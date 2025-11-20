# 📧 Email Templates - Quick Reference Card

## 🚀 5-Minute Setup Guide

### Step 1: Buka Supabase Dashboard
```
URL: https://supabase.com/dashboard
→ Pilih Project: Katalara
→ Menu: Authentication
→ Tab: Email Templates
```

### Step 2: Setup Confirm Signup
```
1. Klik tab: "Confirm signup"
2. Delete semua isi lama
3. Copy file: email-templates/confirm-signup.html
4. Paste ke editor
5. Klik Save (pojok kanan atas)
```

### Step 3: Setup Reset Password
```
1. Klik tab: "Reset password"
2. Delete semua isi lama
3. Copy file: email-templates/reset-password.html
4. Paste ke editor
5. Klik Save
```

### Step 4: (Optional) Setup Magic Link
```
1. Klik tab: "Magic Link"
2. Delete semua isi lama
3. Copy file: email-templates/magic-link.html
4. Paste ke editor
5. Klik Save
```

---

## 📁 File Locations

| Template | File Path | Supabase Tab |
|----------|-----------|--------------|
| ✅ Confirm Signup | `email-templates/confirm-signup.html` | Confirm signup |
| ✅ Reset Password | `email-templates/reset-password.html` | Reset password |
| ✅ Magic Link | `email-templates/magic-link.html` | Magic Link |

---

## 🎨 Template Overview

### 1️⃣ Confirm Signup Email
- **Purpose**: Verify new user email
- **Button**: "Verifikasi email Anda"
- **Color**: 🟣 Purple gradient
- **Icon**: 📄✓ Document + Checkmark
- **Expiry**: 24 hours

### 2️⃣ Reset Password Email
- **Purpose**: Password recovery
- **Button**: "Reset Password Saya"
- **Color**: 🟠 Orange gradient
- **Icon**: 🔒🔑 Lock + Key
- **Expiry**: 1 hour
- **Special**: ⚠️ Security warning box

### 3️⃣ Magic Link Email
- **Purpose**: Passwordless login
- **Button**: "🚀 Login Sekarang"
- **Color**: 🟣 Purple gradient
- **Icon**: ✨🪄 Wand + Stars
- **Expiry**: 15 minutes
- **Special**: ℹ️ Info box tentang magic link

---

## 🧪 Testing Steps

### Test dari Supabase:
```
1. Di Supabase Email Templates
2. Scroll ke bawah
3. Klik "Send test email"
4. Masukkan email Anda
5. Cek inbox
```

### Test Real Flow:
```
Confirm Signup:
→ Register account baru
→ Check email inbox
→ Click verification button
→ Should redirect to login

Reset Password:
→ Click "Lupa Password?"
→ Enter email
→ Check email inbox
→ Click reset button
→ Enter new password

Magic Link:
→ Click "Login dengan Magic Link"
→ Enter email
→ Check email inbox
→ Click login button
→ Should auto-login
```

---

## 🎯 Design Features

### Common Elements:
- ✅ Modern card layout (600px width)
- ✅ Hero SVG icons
- ✅ Gradient CTA buttons
- ✅ Alternative text link fallback
- ✅ Security/info notes
- ✅ Mobile responsive
- ✅ Email client compatible

### Color System:
```css
Background:    #F4F5F7 (Light gray)
Card:          #FFFFFF (White)
Primary Text:  #172B4D (Dark blue-gray)
Secondary:     #42526E (Medium gray)
Border:        #DFE1E6 (Light border)
```

### Button Colors:
```css
Confirm:  linear-gradient(135deg, #667eea → #764ba2)
Reset:    linear-gradient(135deg, #FF9800 → #F57C00)
Magic:    linear-gradient(135deg, #9C27B0 → #7B1FA2)
```

---

## ⚙️ Supabase Variables

### Available in all templates:
```
{{ .Email }}       → user@email.com
{{ .TokenHash }}   → abc123xyz...
{{ .SiteURL }}     → https://your-site.com
```

### Auto-constructed URLs:
```
Confirm:
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup&next=/login

Reset:
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/dashboard/reset-password

Magic:
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=magiclink
```

---

## 📱 Email Client Support

| Client | Gradient | SVG Icons | Layout | Overall |
|--------|----------|-----------|--------|---------|
| Gmail Web | ✅ | ✅ | ✅ | ⭐⭐⭐⭐⭐ |
| Gmail Mobile | ✅ | ✅ | ✅ | ⭐⭐⭐⭐⭐ |
| Outlook Web | ✅ | ✅ | ✅ | ⭐⭐⭐⭐⭐ |
| Apple Mail | ✅ | ✅ | ✅ | ⭐⭐⭐⭐⭐ |
| Outlook Desktop | ⚠️ Fallback | ❌ Hide | ✅ | ⭐⭐⭐⭐ |
| Yahoo Mail | ✅ | ✅ | ✅ | ⭐⭐⭐⭐ |

**Legend**: ✅ Full support | ⚠️ Partial | ❌ Not supported (graceful fallback)

---

## 🔧 Quick Customization

### Change Button Color:
**File**: Any template HTML
**Find**: `background: linear-gradient(...)`
**Replace with**:
```html
<!-- Solid blue -->
background: #2196F3;

<!-- Solid green -->
background: #4CAF50;

<!-- Your brand color -->
background: #YOUR_COLOR;
```

### Change Button Text:
**Confirm**: Line ~100 → `Verifikasi email Anda`
**Reset**: Line ~105 → `Reset Password Saya`
**Magic**: Line ~105 → `🚀 Login Sekarang`

### Replace Icon with Logo:
**Find**: `<svg ...>...</svg>` (lines ~50-65)
**Replace with**:
```html
<img src="https://your-cdn.com/logo.png" 
     width="120" 
     height="120" 
     alt="Katalara">
```

---

## 🐛 Troubleshooting

### Email tidak terkirim?
```
✓ Check spam folder
✓ Verify Supabase SMTP settings
✓ Check rate limits (30/hour free tier)
✓ Check auth logs: Supabase → Logs
```

### Link expired?
```
✓ User must request new verification
✓ Check expiry settings:
  - Supabase → Auth → Settings
  - Confirm: 24h default
  - Reset: 1h default
  - Magic: 15m default
```

### Email masuk spam?
```
✓ Use custom domain (future)
✓ Setup SPF/DKIM records
✓ Use custom SMTP (SendGrid)
✓ Avoid spam words in content
```

### SVG tidak muncul?
```
✓ Normal behavior di Outlook Desktop
✓ Email tetap readable tanpa icon
✓ Consider replacing dengan PNG logo
```

---

## 📊 Success Metrics

### Expected Performance:
- **Delivery Rate**: >95%
- **Open Rate**: 50-70%
- **Click Rate**: 30-50%
- **Spam Rate**: <5%

### Monitor di:
```
Supabase Dashboard
→ Logs
→ Auth Logs
→ Filter: email.sent, email.delivered
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `EMAIL_SETUP_GUIDE.md` | Detailed setup steps |
| `EMAIL_TEMPLATES_README.md` | Complete documentation |
| `EMAIL_TEMPLATES_PREVIEW.md` | Visual previews |
| `EMAIL_TEMPLATES_QUICKREF.md` | This file! |

---

## ✅ Deployment Checklist

- [ ] Buka Supabase Dashboard
- [ ] Setup Confirm Signup template
- [ ] Setup Reset Password template
- [ ] (Optional) Setup Magic Link template
- [ ] Send test emails
- [ ] Check Gmail inbox
- [ ] Check Outlook inbox
- [ ] Check mobile display
- [ ] Test verification links work
- [ ] Test on real registration flow
- [ ] Monitor delivery in logs
- [ ] ✅ Production ready!

---

## 🎯 Quick Commands

### View template in browser:
```bash
# Open local file
start email-templates/confirm-signup.html
```

### Check Supabase logs:
```bash
# Or via Dashboard
Supabase → Logs → Auth Logs → Filter: email
```

### Test send via CLI (if using custom SMTP):
```bash
# Supabase CLI
supabase functions invoke send-email --data '{"to":"test@example.com"}'
```

---

## 💡 Pro Tips

1. **Test in Private Mode**: Avoid cached styles
2. **Use Real Email**: Test with actual email services
3. **Check Mobile First**: 60%+ users read on mobile
4. **Monitor Spam Rate**: Keep <5%
5. **A/B Test Colors**: Try different button colors
6. **Keep it Simple**: Don't over-design
7. **Clear CTA**: Button text harus jelas
8. **Security First**: Always show expiry & security notes

---

## 🚀 Next Steps After Setup

1. **Monitor Performance**:
   - Track delivery rate
   - Monitor open/click rates
   - Check spam complaints

2. **Gather Feedback**:
   - Ask users about email clarity
   - Check if links work on all devices
   - Verify spam folder issues

3. **Iterate Design**:
   - A/B test button colors
   - Try different copy
   - Optimize for mobile

4. **Scale Up** (Future):
   - Custom SMTP provider
   - Email tracking analytics
   - Multi-language support
   - Personalized content

---

**Need help?** Check other documentation files or Supabase docs!

**Ready?** Copy templates ke Supabase dan test! 🚀

