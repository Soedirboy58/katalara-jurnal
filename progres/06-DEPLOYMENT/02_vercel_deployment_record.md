# Vercel Deployment Record (katalara-nextjs)

**Date:** 14 Januari 2026  
**Status:** ✅ Active / Referensi utama untuk deploy  

Dokumen ini menyimpan **data deploy yang benar** (project Vercel, repo/branch GitHub yang di-track, URL production) agar AI agent berikutnya tidak perlu menebak-nebak saat deploy.

---

## 1) Fakta Deploy (Sumber Kebenaran)

### Vercel
- **Vercel Team/Workspace:** `katalaras-projects`
- **Vercel Project:** `katalara-nextjs`
- **Production URL (tercatat di log deploy):**
  - `https://katalara-nextjs-kmt2bynkr-katalaras-projects.vercel.app`
- **Inspect URL (contoh dari log deploy):**
  - `https://vercel.com/katalaras-projects/katalara-nextjs/2L7vtS89YPaB`

### GitHub (Auto Deploy)
- **Repo yang di-track Vercel:** `Soedirboy58/katalara-jurnal`
- **Branch:** `main`

Catatan penting:
- Di workspace ini, repo Git berada di folder: `katalara-nextjs/`.
- Umumnya remote Git yang benar untuk auto-deploy Vercel adalah: `jurnal` (URL: `https://github.com/Soedirboy58/katalara-jurnal.git`).
- Jika push ke remote lain (mis. `origin` yang menunjuk repo berbeda), Vercel **tidak** akan menampilkan commit terbaru.

---

## 2) Konfigurasi Vercel untuk Monorepo (Root di subfolder)

Repo workspace ini memiliki folder top-level, sedangkan aplikasi Next.js berada di `katalara-nextjs/`.

File konfigurasi deploy ada di root workspace:
- `vercel.json`

Isi penting (ringkas):
- Build command: `cd katalara-nextjs && npm run build`
- Install command: `cd katalara-nextjs && npm install`
- Output directory: `katalara-nextjs/.next`

---

## 3) Cara Deploy (Disarankan)

### Opsi A — Auto Deploy (Recommended)
1. Pastikan perubahan sudah committed.
2. Push ke repo/branch yang di-track Vercel:
   - `git push jurnal main`

Hasil:
- Vercel otomatis membuat deployment baru.

### Opsi B — Manual Deploy via Vercel CLI
1. Pastikan sudah login & project sudah ter-link:
   - `vercel login`
   - `vercel link`
2. Deploy production:
   - `vercel deploy --prod --yes`

---

## 4) Quick Deploy Script

Script:
- `katalara-nextjs/deploy.ps1`

Perilaku script:
- Jika remote `jurnal` ada, script akan push ke `jurnal main` untuk memicu auto-deploy.
- Jika tidak ada `jurnal`, script fallback push ke `origin main`.

Contoh:
- `./deploy.ps1 "feat: deploy update"`
- Override remote (jika perlu): `./deploy.ps1 "feat: deploy update" -Remote jurnal`

---

## 5) Checklist Verifikasi Setelah Deploy

- Buka dashboard Vercel → Deployments:
  - Pastikan deployment terbaru memakai commit yang baru dipush ke `Soedirboy58/katalara-jurnal`.
- Smoke test aplikasi:
  - Login
  - Dashboard KPI tampil dan tidak error 401/403
  - Input sales/income bisa membuat transaksi
  - Cetak Dokumen (PDF) preview tidak blank

---

## 6) Troubleshooting Cepat

### Problem: “Commit terbaru tidak muncul di Vercel”
Biasanya penyebabnya:
- Push ke repo/remote yang salah (mis. `origin` bukan `jurnal`).

Solusi:
- Cek remote:
  - `git remote -v`
- Pastikan push ke `jurnal main`.

### Problem: “Build di Vercel gagal”
- Jalankan `npm run build` lokal dulu di `katalara-nextjs/`.
- Pastikan env vars Supabase sudah di-set di Vercel.

---

## 7) Referensi

- Log deploy historis: `katalara-nextjs/deploy-log.txt`
- Checklist deploy: `katalara-nextjs/DEPLOYMENT_CHECKLIST.md`
