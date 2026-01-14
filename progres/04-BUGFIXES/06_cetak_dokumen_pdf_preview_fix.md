# 06. Fix Cetak Dokumen (PDF Preview Struk/Invoice)

**Date:** 14 Januari 2026  
**Status:** ✅ Implemented  
**Category:** Bug Fix + Feature Hardening  

---

## Ringkasan
Fitur “Cetak Dokumen” (Struk 80mm & Invoice A4) sebelumnya gagal preview PDF di beberapa environment karena error versi `pdf.js`:

> “The API version X does not match the Worker version Y”

Perbaikan dilakukan dengan menghilangkan ketergantungan preview terhadap `pdf.js worker` dan menggantinya dengan generator PDF yang stabil.

---

## Masalah
- Preview PDF blank / tidak tampil.
- Tombol Download dan Kirim WA tidak reliable karena alur generate/preview bergantung pada renderer yang error.

---

## Akar Masalah
Implementasi preview sebelumnya menggunakan PDF viewer berbasis `pdf.js worker`. Ketika versi API `pdfjs-dist` dan worker yang ter-load tidak match, preview gagal.

---

## Solusi
### 1) Generator PDF yang stabil
- Menggunakan `@react-pdf/renderer` untuk membangun dokumen PDF.
- PDF dibuat sebagai `Blob` via `pdf(...).toBlob()`.

### 2) Preview tanpa pdf.js
- Preview dilakukan menggunakan native PDF viewer browser:
  - Buat `blob:` URL
  - Render di `<iframe src={blobUrl} />`

### 3) Download & WhatsApp flow
- Download: trigger `a[download]` dari `Blob`.
- WhatsApp:
  1. Generate PDF blob
  2. Upload ke endpoint `/api/upload-pdf`
  3. Dapat URL (signed 24h jika tersedia)
  4. Buka `https://wa.me/...` dengan pesan + link

---

## File yang Ditambah/Diubah
- `src/modules/finance/components/incomes/IncomePrintModal.tsx` (refactor: delegasi ke modal baru)
- `src/components/PrintDocumentModal.tsx` (modal unified preview/download/WA)
- `src/components/pdf/StrukTemplate.tsx` (template struk 80mm)
- `src/components/pdf/InvoiceTemplate.tsx` (template invoice A4)
- `src/lib/pdf-generator.ts` (normalize data + generate blob + filename)
- `src/lib/whatsapp.ts` (normalize nomor + build WA url)
- `src/app/api/upload-pdf/route.ts` (upload PDF ke Supabase Storage)

---

## Catatan Operasional
Agar WhatsApp upload stabil di production:
- Pastikan bucket Supabase Storage `invoices` tersedia.
- Rekomendasi: set env `SUPABASE_SERVICE_ROLE_KEY` di server agar upload + signed URL tidak tergantung kebijakan RLS bucket.

---

## Cara Verifikasi Cepat
1. Buka transaksi/income → klik “Cetak Dokumen”
2. Coba:
   - Preview Struk 80mm (harus tampil)
   - Preview Invoice A4 (harus tampil)
   - Download (nama file sesuai)
   - Kirim WA (tab WA terbuka dengan link PDF)
