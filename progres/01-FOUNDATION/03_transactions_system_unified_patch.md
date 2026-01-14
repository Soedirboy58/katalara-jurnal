# 03. Transactions System Unified Patch

**Date:** 14 Januari 2026 (update)  
**Status:** ✅ Applied in Supabase  

---

## Tujuan
Patch ini dibuat untuk memastikan modul “transactions” tetap berjalan walau schema database existing berbeda-beda, khususnya terkait kolom kepemilikan:
- Sebagian deployment memakai `user_id`
- Sebagian deployment memakai `owner_id`

Patch melakukan normalisasi agar query PostgREST dan API Next.js tidak pecah.

---

## Scope Patch
File utama: `sql/patches/patch_transactions_system_unified.sql`

Mencakup:
- Ensures tables exist: `customers`, `products`, `transactions`, `transaction_items`, `payments`, `stock_movements`
- Menjamin **dua kolom ownership** (`user_id` dan `owner_id`) ada dan ter-backfill
- Membuat/Update RPC:
  - `generate_invoice_number(user_id)`
  - `adjust_stock(product_id, quantity_change, notes)`
- Menambah index penting untuk performa
- Menetapkan RLS policies berbasis `COALESCE(user_id, owner_id)`

---

## Update Sesi Ini: RLS untuk Payments
Sebelumnya, RLS untuk `payments` belum ada sehingga operasi (select/insert/update/delete) berpotensi 403 atau tidak konsisten.

Solusi:
- `payments_*` policies dibuat dengan model inheritance:
  - User boleh akses baris payment jika `payments.transaction_id` mengarah ke transaction miliknya.

---

## Cara Verifikasi Cepat
1. Login user A
2. Buat transaksi + items
3. Buat payment untuk transaksi tersebut
4. Pastikan user B tidak bisa melihat data user A

---

## Catatan
Jika setelah apply patch masih muncul error 401/403 saat akses tabel tertentu, biasanya penyebabnya:
- Schema cache PostgREST belum reload
- Privilege untuk role `authenticated` belum di-grant pada tabel baru
