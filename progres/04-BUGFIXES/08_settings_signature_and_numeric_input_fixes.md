# Settings, Signature, and Numeric Input Fixes

**Date:** 27 Maret 2026  
**Status:** ✅ Complete  
**Priority:** High  
**Category:** Settings / Documents / Finance Input

---

## Problem Statement

Sesi ini menangani beberapa issue lintas modul yang saling berkaitan:

1. Halaman Settings mengalami error saat save dan beberapa state belum terdefinisi.
2. Purchase Order dan Invoice belum mendukung jabatan penandatangan secara konsisten.
3. Preview dokumen menampilkan artefak tanda tangan berlatar gelap.
4. Layout PO menampilkan header ganda dan isi item terlalu dekat dengan header.
5. Form input Expense dan Income memiliki perilaku input angka/satuan yang belum sesuai kebutuhan operasional pengguna.

---

## Solution Summary

### 1. Settings stabilization
- Menambahkan state yang hilang di halaman settings.
- Menormalkan pemisahan data profil bisnis vs preferensi operasional.
- Menyiapkan migration `sql/02-migrations/add_business_signature_title.sql`.

### 2. Signature title for documents
- Menambahkan `business_signature_title` ke konfigurasi bisnis.
- Meneruskan data tersebut ke preview transaksi, modal print, generator PDF, dan template invoice.

### 3. Signature image cleanup
- Menyesuaikan pemrosesan gambar tanda tangan agar hasil preview/print tidak menampilkan blok hitam pada beberapa file gambar.

### 4. Purchase order print layout fix
- Menghapus render header tabel yang terduplikasi.
- Menambah jarak konten agar deskripsi item tidak bertabrakan dengan header.

### 5. Numeric input and unit improvements
- Expense:
  - Menambahkan opsi satuan custom.
  - Menyediakan fallback satuan default bila `unit_catalog` kosong/tidak lengkap.
- Income:
  - Memisahkan formatter `jumlah` dan `harga`.
  - Quantity mendukung koma desimal.
  - Price tetap menjadi format nominal rupiah.

---

## Files Touched in This Session

- `src/app/dashboard/settings/page.tsx`
- `sql/02-migrations/add_business_signature_title.sql`
- `src/lib/pdf-generator.ts`
- `src/components/pdf/InvoiceTemplate.tsx`
- `src/components/PrintDocumentModal.tsx`
- `src/components/transactions/PreviewTransactionModal.tsx`
- `src/modules/finance/components/expenses/ExpensePrintModal.tsx`
- `src/components/expenses/ExpenseItemsTable.tsx`
- `src/modules/finance/components/incomes/LineItemsBuilder.tsx`
- `src/app/dashboard/input-expenses/page.tsx`

---

## Validation

- `npm run build` ✅
- Deploy produksi via `./deploy.ps1` ✅

Deploy URLs selama sesi:
- `https://katalara-nextjs-hzdon8omu-katalaras-projects.vercel.app`
- `https://katalara-nextjs-kw8si4w11-katalaras-projects.vercel.app`
- `https://katalara-nextjs-h67mu7jaw-katalaras-projects.vercel.app`

---

## Follow-up Notes

- Untuk issue settings yang kembali muncul, cek apakah schema Supabase production sudah menjalankan migration terbaru dan sudah reload PostgREST schema cache.
- Untuk issue quantity/price di Income, jangan gabungkan lagi formatter quantity dan price karena requirement format keduanya berbeda.
- Untuk issue satuan Expense, prioritas sumber data tetap `unit_catalog` + `business_unit_preferences`, dengan fallback lokal hanya untuk ketahanan UI.