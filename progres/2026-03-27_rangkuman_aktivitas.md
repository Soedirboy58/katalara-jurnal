# Rangkuman Aktivitas - 27 Maret 2026

## Ringkasan
- Perbaikan halaman Settings untuk pemisahan tab profil bisnis vs pengaturan operasional, termasuk state yang sempat hilang (`unitCatalog`, `unitPrefs`, `defaultTemplateId`).
- Penambahan dukungan `business_signature_title` untuk dokumen invoice dan purchase order.
- Perbaikan alur cetak dokumen agar tanda tangan tidak tampil dengan latar hitam dan jabatan penandatangan muncul konsisten.
- Perbaikan layout purchase order: header tabel tidak dobel dan jarak isi deskripsi item tidak bertabrakan dengan header.
- Perbaikan input numerik pada form Income dan Expense:
  - Expense mendukung unit custom dan fallback satuan seperti `kg`.
  - Income memisahkan formatter `jumlah` dan `harga` agar kuantitas mendukung koma desimal, sedangkan harga tetap memakai format nominal rupiah.
- Deploy produksi dilakukan beberapa kali sampai perilaku input numerik dan dokumen cetak stabil.

## Perubahan Utama
1. **Settings & konfigurasi bisnis**
   - Tab Settings dibenahi agar field profil bisnis dan field konfigurasi operasional tidak saling tertukar.
   - Error runtime akibat state yang belum dideklarasikan diperbaiki.
   - Disiapkan migration untuk `business_signature_title`.

2. **Dokumen invoice dan purchase order**
   - Data `signatureTitle` diteruskan dari profil bisnis ke generator PDF.
   - Tanda tangan dibersihkan agar tidak menghasilkan blok hitam pada preview/print tertentu.
   - Layout tabel PO dirapikan untuk menghilangkan header ganda dan overlap teks.

3. **Input Expense**
   - Dropdown satuan memanfaatkan `unit_catalog` dan `business_unit_preferences`.
   - Ditambahkan fallback daftar satuan default dan opsi `Custom...`.
   - Input qty/harga mendukung format angka yang lebih fleksibel.

4. **Input Income / Item Penjualan**
   - Formatter quantity dipisah dari formatter price.
   - Quantity sekarang ditangani sebagai angka desimal dengan koma.
   - Price tetap diperlakukan sebagai nominal rupiah dengan separator ribuan.

## Status
- **Build lokal:** `npm run build` ✅
- **Deploy production:** ✅ berhasil via `./deploy.ps1`
- **Catatan lint:** `npm run lint` sempat gagal karena konfigurasi ESLint circular reference, bukan karena perubahan fitur sesi ini.

## Deploy Terkait Sesi Ini
- `https://katalara-nextjs-hzdon8omu-katalaras-projects.vercel.app`
- `https://katalara-nextjs-kw8si4w11-katalaras-projects.vercel.app`
- `https://katalara-nextjs-h67mu7jaw-katalaras-projects.vercel.app`

## Catatan Lanjutan
- Jika ada kelanjutan pada issue input angka, fokus utama ada di `src/modules/finance/components/incomes/LineItemsBuilder.tsx`.
- Jika ada kelanjutan pada issue satuan expense, fokus utama ada di `src/components/expenses/ExpenseItemsTable.tsx`.
- Jika ada kelanjutan pada issue dokumen, cek alur dari settings/profile ke komponen print dan PDF generator.