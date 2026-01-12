# Supabase Schema Alignment (Migration → Next.js)

Kamu tidak “gagal karena AI/Next.js-nya jelek”—ini murni problem **dua Supabase project berbeda** atau **schema drift**.

- Aplikasi **supabase-migration** banyak yang jalan karena ia masih memakai tabel lama seperti `income`, `expenses`, dll.
- Aplikasi **Next.js** input pendapatan memakai flow baru `transactions` + `transaction_items` + RPC `generate_invoice_number` + `adjust_stock`.
- Kalau Supabase project yang dipakai Next.js belum punya schema ini (atau nama kolom beda: `owner_id` vs `user_id`), hasilnya adalah error flip-flop seperti yang kamu lihat.

## Target

Bikin schema Supabase project Next.js menjadi **kompatibel** tanpa sinkronisasi kecil-kecil berulang.

Strategi yang paling stabil:
- Pastikan tabel `transactions` dkk ada.
- Pastikan **dua kolom kepemilikan** tersedia (`user_id` dan `owner_id`) agar query PostgREST tidak pecah walaupun ada bagian app yang menyebut salah satu.

## One-time fix (recommended)

Jalankan SQL patch ini di Supabase project yang dipakai Next.js:

- File: `katalara-nextjs/sql/patches/patch_transactions_system_unified.sql`

Langkah:
1. Buka Supabase Dashboard → SQL Editor
2. Paste isi file patch di atas
3. Run
4. Restart Next.js dev server
5. Test: Input Pendapatan → list transaksi + simpan

## Catatan

Patch ini sengaja dibuat “compatibility-first”:
- Kalau tabel sudah ada tapi kolomnya beda, patch akan menambah kolom yang hilang dan backfill.
- RLS policies dibuat berdasarkan `COALESCE(user_id, owner_id)`.

Kalau kamu ingin schema super-rapih, setelah semuanya stabil baru kita rapikan lagi (migrasi final ke hanya `user_id` misalnya).
