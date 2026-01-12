# 05. Income Category Item Filtering (Produk vs Jasa)

## Ringkasan
Di versi legacy, pilihan kategori pendapatan membatasi item yang bisa dipilih:
- **Penjualan Produk** → hanya menampilkan **produk/barang**
- **Pendapatan Jasa** → hanya menampilkan **jasa/layanan**

Di Katalara Next.js sebelumnya, dropdown item di Input Income masih menampilkan semua item.

## Masalah
- User memilih kategori **Pendapatan Jasa**, tetapi dropdown masih menampilkan item produk.
- User memilih kategori **Penjualan Produk**, tetapi dropdown juga menampilkan jasa.

## Akar Masalah
- Komponen `LineItemsBuilder` hanya melakukan filter berbasis teks pencarian, belum ada filter berbasis kategori.
- Data produk belum punya UI yang eksplisit untuk menandai item sebagai **Produk** vs **Jasa**.

## Solusi
1. **Tambahkan field “Jenis Item” (Produk/Jasa) di modal produk**
   - Disimpan ke kolom `products.product_type` (nilai: `physical` | `service`).
   - Untuk item **Jasa**, `track_inventory` otomatis **false** dan checkbox inventory dinonaktifkan.
   - **Backward-compatible**: jika schema Supabase belum punya kolom `product_type`, insert/update otomatis retry tanpa field tersebut.

2. **Filter dropdown item berdasarkan kategori income**
   - `service_income` → tampilkan hanya `product_type=service` (fallback: `track_inventory=false`).
   - `product_sales`, `retail_sales`, `wholesale_sales` → tampilkan hanya `product_type=physical` (fallback: `track_inventory!=false`).

## File yang Diubah
- `src/components/products/ProductModal.tsx`
  - Tambah field `product_type` (Produk/Jasa)
  - Auto-disable inventory tracking untuk jasa
  - Insert/update kompatibel untuk schema lama (retry bila `product_type` belum ada)

- `src/modules/finance/components/incomes/LineItemsBuilder.tsx`
  - Filter item dropdown berdasarkan kategori income

- `src/types/database.ts`
  - Tambah field opsional `product_type` pada tipe `products`

## Catatan Migrasi DB
Agar pemisahan produk/jasa konsisten, pastikan Supabase schema memiliki kolom:
- `products.product_type` (nullable, default `physical` disarankan)

Jika kolom belum tersedia, aplikasi tetap berjalan (fallback pakai `track_inventory`).

## Cara Verifikasi Cepat
1. Buka **Input Pendapatan**
2. Pilih kategori:
   - **Penjualan Produk** → dropdown hanya item produk
   - **Pendapatan Jasa** → dropdown hanya item jasa
3. Tambah item baru lewat **+ Baru**:
   - Pilih **Jasa (Layanan)** → checkbox inventory tidak bisa dicentang
