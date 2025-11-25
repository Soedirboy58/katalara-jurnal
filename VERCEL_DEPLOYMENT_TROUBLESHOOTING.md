# 🚨 Vercel Deployment Troubleshooting Guide

## Masalah yang Pernah Terjadi & Solusinya

### ❌ Error: "Root Directory does not exist"

**Gejala:**
- Build gagal dengan pesan: `The specified Root Directory "katalara-nextjs" does not exist`
- Commit muncul di Vercel tapi langsung error
- Build log hanya 5 baris

**Penyebab:**
- Vercel Project Settings → Root Directory salah diisi dengan nama folder
- Seharusnya **KOSONG** atau `.` (titik)
- Terjadi karena nama folder lokal `katalara-nextjs` sama dengan nama project, membuat bingung

**Solusi:**
1. Buka Vercel Dashboard → Project Settings
2. Scroll ke **Build & Development Settings**
3. **Root Directory** → Pastikan **KOSONG** atau isi dengan `.`
4. Save → Redeploy

**Pencegahan:**
- ✅ **Selalu cek Root Directory setting saat setup project baru**
- ✅ **Default kosong = benar** untuk project standard
- ✅ **Hanya isi jika project memang ada di subfolder** (misal: monorepo)

---

### ❌ Deploy Berhasil tapi Commit Tidak Muncul

**Gejala:**
- `vercel --prod` sukses tapi tidak tampil commit hash
- Vercel Dashboard tidak show commit message

**Penyebab:**
- Deploy via CLI langsung dari folder lokal
- Bukan dari GitHub commit

**Solusi:**
- **SELALU push ke GitHub dulu**, baru biarkan Vercel auto-deploy
- Atau buat commit kosong untuk trigger: `git commit --allow-empty -m "trigger deploy"`

**Pencegahan:**
- ✅ **Workflow yang benar:**
  1. Buat perubahan code
  2. `git add .`
  3. `git commit -m "message"`
  4. `git push origin main`
  5. **Tunggu Vercel auto-deploy** (1-2 menit)
- ❌ **Jangan pakai `vercel --prod` kecuali emergency**

---

### ❌ Repository Username Confusion (Soedirboy58 vs deltasc58)

**Gejala:**
- Deploy muncul dengan username berbeda-beda
- Bingung repository mana yang benar

**Klarifikasi:**
- **deltasc58** = Email/akun Vercel Anda
- **Soedirboy58** = Username GitHub Anda
- **Ini NORMAL dan BENAR** - bukan masalah!

**Pencegahan:**
- ✅ Jangan khawatir kalau muncul Soedirboy58 - ini GitHub username Anda
- ✅ Yang penting project ID nya sama: `katalaras-projects`

---

### ❌ Build Exit Code 1 tapi Tidak Ada Error Message

**Gejala:**
- `npm run build` exit code 1
- Tapi tidak ada error di output
- Semua pages ter-generate

**Penyebab:**
- Next.js warnings dianggap error di production mode
- Atau TypeScript strict mode issues yang silent

**Solusi:**
- **ABAIKAN jika Vercel build sukses!**
- Build lokal dan Vercel bisa beda hasil

**Pencegahan:**
- ✅ Fokus ke Vercel build log, bukan lokal
- ✅ Kalau Vercel sukses = production siap

---

## ✅ Checklist Pre-Deployment

Sebelum deploy fitur baru, pastikan:

- [ ] Code sudah di-commit dan push ke GitHub
- [ ] `npm run build` lokal tidak ada error TypeScript critical
- [ ] Vercel Project Settings → Root Directory = **KOSONG**
- [ ] Vercel terhubung ke repository GitHub yang benar
- [ ] Environment variables lengkap di Vercel
- [ ] Database migration (kalau ada) sudah dijalankan

---

## 🎯 Workflow Deployment Standard

```bash
# 1. Buat perubahan
# ... edit code ...

# 2. Test lokal (optional)
npm run dev

# 3. Commit & Push
git add .
git commit -m "feat: deskripsi fitur"
git push origin main

# 4. TUNGGU Vercel auto-deploy (1-2 menit)
# Cek di Vercel Dashboard → Deployments

# 5. Kalau error, cek Build Logs di Vercel
# JANGAN langsung deploy ulang via CLI!

# 6. Fix error → commit → push → tunggu lagi
```

---

## 🔧 Vercel Settings yang Harus Benar

### Build & Development Settings
```
Framework Preset: Next.js
Build Command: npm run build (atau kosong)
Output Directory: .next (atau kosong)
Install Command: npm install (atau kosong)
Development Command: npm run dev (atau kosong)
Root Directory: (KOSONG) ← PENTING!
```

### Environment Variables
Pastikan ada:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Dan variable lain yang dibutuhkan

---

## 📞 Quick Fix Commands

**Trigger deployment baru:**
```bash
git commit --allow-empty -m "trigger: Force new deployment"
git push origin main
```

**Reset Vercel config lokal:**
```bash
Remove-Item -Path ".vercel" -Recurse -Force
vercel logout
vercel login
vercel link
```

**Clean build lokal:**
```bash
Remove-Item -Path ".next" -Recurse -Force
npm run build
```

---

## 🎓 Pelajaran dari Issue Ini

1. **Root Directory setting sangat krusial** - salah sedikit langsung error
2. **Vercel CLI vs GitHub deploy berbeda** - prefer GitHub auto-deploy
3. **Build lokal vs Vercel bisa beda** - Vercel lebih strict
4. **Username GitHub ≠ Email Vercel** - ini normal
5. **Error message "does not exist"** = 90% masalah path/directory

---

**Dibuat:** 26 November 2025  
**Last Updated:** Setelah fix Root Directory issue  
**Status:** ✅ Resolved - Production running  

---

## 🚀 Status Deployment Saat Ini

- ✅ Build berhasil
- ✅ Root Directory: KOSONG (benar)
- ✅ Commit muncul dengan jelas
- ✅ Production URL: https://katalara-nextjs-xxx.vercel.app
- ⏳ **NEXT STEP: Jalankan SQL Migration di Supabase!**
