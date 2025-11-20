# 📧 Email Templates - Katalara Platform

## 🎨 Desain Modern Email Suite

Template email dengan desain profesional seperti Jira, Atlassian, dan modern SaaS platforms.

---

## 📁 File Structure

```
email-templates/
├── confirm-signup.html      ✅ Sign up verification email
├── reset-password.html      ✅ Password reset email
└── magic-link.html          ✅ Passwordless login email
```

---

## 🚀 Quick Setup (5 Menit)

### 1. Confirm Signup Email
```
1. Buka: Supabase Dashboard → Authentication → Email Templates
2. Klik tab: "Confirm signup"
3. Delete isi lama
4. Copy-paste dari: email-templates/confirm-signup.html
5. Save
```

### 2. Reset Password Email
```
1. Klik tab: "Reset password"
2. Delete isi lama
3. Copy-paste dari: email-templates/reset-password.html
4. Save
```

### 3. Magic Link Email (Optional)
```
1. Klik tab: "Magic Link"
2. Delete isi lama
3. Copy-paste dari: email-templates/magic-link.html
4. Save
```

---

## 🎨 Design Features

### Visual Elements:
- ✅ **Hero SVG Icons**: Unique icon untuk setiap email type
  - Confirm: Document with checkmark (Blue/Green)
  - Reset: Lock with key (Orange)
  - Magic Link: Wand with stars (Purple)

- ✅ **Gradient Buttons**: Modern gradient CTA buttons
  - Purple gradient (Confirm)
  - Orange gradient (Reset)
  - Purple gradient (Magic Link)

- ✅ **Card Layout**: Clean white card with shadow
- ✅ **Responsive**: Mobile-friendly 600px width
- ✅ **Typography**: System fonts untuk konsistensi cross-platform

### Color Schemes:

#### Confirm Signup (Blue/Purple):
```css
Background: #F4F5F7 (Light gray)
Card: #FFFFFF
Button: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
Icon: #2196F3 (Blue), #4CAF50 (Green)
```

#### Reset Password (Orange):
```css
Background: #F4F5F7
Card: #FFFFFF
Button: linear-gradient(135deg, #FF9800 0%, #F57C00 100%)
Icon: #FF9800 (Orange)
Alert Box: #FFF3E0 (Light orange bg)
```

#### Magic Link (Purple):
```css
Background: #F4F5F7
Card: #FFFFFF
Button: linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)
Icon: #9C27B0 (Purple)
Info Box: #F3E5F5 (Light purple bg)
```

---

## 📝 Template Content

### 1. Confirm Signup Email

**Subject**: Verifikasi Email - Katalara

**Content**:
- Greeting dengan email user
- Hero heading: "Langkah terakhir sebelum memulai!"
- Clear CTA button
- Alternative link fallback
- Security note di footer

**Use Cases**:
- User register account baru
- Verify email ownership
- Enable account access

---

### 2. Reset Password Email

**Subject**: Reset Password - Katalara

**Content**:
- Greeting dengan email user
- Heading: "Reset password Anda"
- Security warning box (orange)
- Clear CTA button
- Link expiry: 1 hour
- "Didn't request?" message

**Use Cases**:
- User forgot password
- User request password change
- Security: Reset compromised password

**Security Features**:
- ⚠️ Warning box dengan highlight warna
- Expire time explicitly stated (1 hour)
- Clear instruction untuk ignore jika tidak request

---

### 3. Magic Link Email

**Subject**: Login Link - Katalara

**Content**:
- Greeting dengan email user
- Heading: "Login tanpa password ✨"
- Info box tentang magic link
- Clear CTA button
- Link expiry: 15 minutes
- "Didn't request?" message

**Use Cases**:
- Passwordless login
- Quick access tanpa remember password
- Enhanced UX untuk mobile users

**Info Box Content**:
- Explains what magic link is
- Shows expiry time (15 min)
- Single-use link notice

---

## 🔧 Customization Guide

### Change Button Color:

#### Original (Gradient):
```html
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

#### Alternative 1 (Solid Blue):
```html
background: #2196F3;
box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
```

#### Alternative 2 (Brand Color):
```html
background: #YOUR_BRAND_COLOR;
box-shadow: 0 4px 12px rgba(YOUR_R, YOUR_G, YOUR_B, 0.3);
```

### Replace Hero Icon dengan Logo:

**Remove SVG**, add image:
```html
<img src="https://your-cdn.com/katalara-logo.png" 
     width="120" 
     height="120" 
     alt="Katalara"
     style="display: block; margin: 0 auto;">
```

### Change Wording:

File: `confirm-signup.html`
- Line ~70: Main heading
- Line ~80-90: Body text
- Line ~100: Button text

File: `reset-password.html`
- Line ~70: Main heading
- Line ~80-95: Body text
- Line ~105: Button text

File: `magic-link.html`
- Line ~70: Main heading
- Line ~80-95: Body text
- Line ~105: Button text

---

## 📱 Email Client Compatibility

### ✅ Fully Supported:
- **Gmail** (Web, iOS, Android)
- **Outlook** (Web, Desktop 2019+)
- **Apple Mail** (macOS, iOS)
- **Yahoo Mail**
- **ProtonMail**
- **Thunderbird**

### ⚠️ Partial Support:
- **Outlook Desktop** (2010-2016): SVG icons tidak muncul, tapi email tetap readable
- **Old mobile clients**: Gradient button jadi solid color (graceful degradation)

### 🔧 Fallback Handling:
- SVG tidak support → Email tetap baca tanpa icon
- Gradient tidak support → Solid color fallback
- Custom fonts tidak load → System font fallback

---

## 🧪 Testing Checklist

### Pre-Deploy Testing:
- [ ] Copy template ke Supabase
- [ ] Send test email (Supabase UI)
- [ ] Check inbox di Gmail
- [ ] Check inbox di Outlook
- [ ] Check di mobile (iOS/Android)
- [ ] Verify link works
- [ ] Check responsive layout

### Post-Deploy Testing:
- [ ] Register new account → Check confirm email
- [ ] Request password reset → Check reset email
- [ ] Request magic link → Check magic link email
- [ ] Test on different devices
- [ ] Check spam folder (should be inbox)

---

## 📊 Monitoring

### Track Email Stats:

1. **Supabase Dashboard**:
   - Go to: **Logs** → **Auth Logs**
   - Filter: `email.sent`, `email.delivered`, `email.bounced`

2. **Success Metrics**:
   - Delivery rate: >95%
   - Open rate: ~50-70% (if tracking enabled)
   - Click rate: ~30-50%

### Common Issues & Solutions:

**Email masuk spam?**
```
Solution:
1. Setup SPF/DKIM records (Custom SMTP)
2. Use verified domain
3. Avoid spam trigger words
```

**Link expired?**
```
Solution:
1. User must request new verification
2. Check expiry settings (Supabase → Auth → Settings)
3. Default: 24h (confirm), 1h (reset), 15m (magic link)
```

**Email tidak terkirim?**
```
Solution:
1. Check Supabase rate limits (30/hour free tier)
2. Verify SMTP settings
3. Check auth logs for errors
```

---

## 🎯 Variables Reference

### Supabase Email Variables:

```
{{ .Email }}            → User's email address
{{ .TokenHash }}        → Verification token
{{ .SiteURL }}          → Your website URL
{{ .ConfirmationURL }}  → Auto-generated confirm URL
{{ .Token }}            → Raw token (use TokenHash instead)
```

### Custom Variables (Future):

```
{{ .UserName }}         → User's display name
{{ .BusinessName }}     → Business name
{{ .ExpiryTime }}       → Link expiry time
```

---

## 🚀 Next Steps

### Phase 1: ✅ Basic Setup (Done)
- [x] Confirm Signup template
- [x] Reset Password template
- [x] Magic Link template

### Phase 2: 🔄 Enhanced Features
- [ ] Custom SMTP (SendGrid/Mailgun)
- [ ] Email tracking (open/click rates)
- [ ] A/B testing different designs
- [ ] Multi-language support

### Phase 3: 🎯 Advanced
- [ ] Invite User template
- [ ] Receipt/Invoice emails
- [ ] Weekly digest emails
- [ ] Notification emails

---

## 📚 Resources

- [Supabase Email Docs](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Email Template Best Practices](https://www.campaignmonitor.com/blog/email-marketing/email-template-best-practices/)
- [HTML Email Guide](https://www.caniemail.com/)

---

## 💡 Pro Tips

1. **Keep it Simple**: Less is more untuk email templates
2. **Test Everywhere**: Different email clients render differently
3. **Mobile First**: 60%+ users baca email di mobile
4. **Clear CTA**: Button harus jelas dan mudah di-click
5. **Security First**: Always warn about phishing/security

---

**Need help?** Check `EMAIL_SETUP_GUIDE.md` untuk detailed setup instructions.

