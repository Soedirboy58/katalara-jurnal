# Sinkronisasi Produk: Products ↔ Lapak Online

## Overview
Fitur sinkronisasi memungkinkan pengguna untuk menambahkan produk dari menu **Products** (manajemen inventori) ke **Lapak Online** (toko online) tanpa perlu input ulang.

## Arsitektur Database

### Dua Tabel Terpisah
1. **`products`** - Tabel inventori untuk manajemen stok internal
2. **`storefront_products`** - Tabel produk khusus untuk toko online (Lapak)

### Mengapa Terpisah?
- Products: Fokus pada inventori, harga beli/jual, stok, margin
- Storefront Products: Fokus pada display online, kategori produk/jasa, harga promo, visibilitas

## Cara Kerja Sinkronisasi

### 1. Menambahkan Produk ke Lapak
**Dari menu Products:**
- Klik tombol **🛒** (shopping bag icon) pada produk yang ingin ditambahkan ke Lapak
- Tombol berwarna **ungu** = belum di Lapak
- Sistem akan:
  - Copy data produk (nama, harga jual, stok, kategori)
  - Buat produk baru di tabel `storefront_products`
  - Set status `is_visible = true` (tampil di toko online)
  - Set `product_type = 'barang'` (default)

### 2. Indikator Produk Tersinkronisasi
**Badge "🛒 Lapak":**
- Muncul di sebelah nama produk (table & card view)
- Warna ungu/purple
- Menandakan produk sudah ada di Lapak Online

**Tombol Sync:**
- **Ungu** + label "+ Lapak" = Belum di Lapak
- **Hijau** + label "Lapak" = Sudah di Lapak
- Klik tombol hijau untuk menghapus dari Lapak

### 3. Update Otomatis?
**TIDAK OTOMATIS** - Sinkronisasi bersifat one-time copy:
- Perubahan harga/stok di Products **tidak** otomatis update ke Lapak
- User harus klik tombol sync lagi untuk update
- Atau edit langsung di menu Lapak

## API Endpoints

### POST `/api/lapak/sync-product`
Menambahkan/update produk ke Lapak Online
```typescript
// Request
{ productId: string }

// Response
{
  message: "Produk berhasil ditambahkan ke Lapak Online",
  productId: string,
  action: "created" | "updated"
}
```

### DELETE `/api/lapak/sync-product?productName={name}`
Menghapus produk dari Lapak Online (tidak menghapus dari Products)

### GET `/api/lapak/sync-product?productName={name}`
Cek status sinkronisasi produk
```typescript
{
  synced: boolean,
  storefrontProductId?: string,
  isVisible?: boolean,
  isFeatured?: boolean
}
```

## Komponen yang Dimodifikasi

### 1. ProductTableAdvanced.tsx
- Tambah state `syncedProducts` dan `syncingProducts`
- Tambah `useEffect` untuk cek status sync saat load
- Tambah tombol sync di kolom aksi (desktop & mobile view)
- Tambah badge "🛒 Lapak" di nama produk

### 2. ProductCardView.tsx
- Sama seperti table view
- Grid button berubah dari 3 kolom → 4 kolom (tambah button Lapak)
- Button Lapak menunjukkan status: "+ Lapak" (ungu) atau "Lapak" (hijau)

### 3. API Route: sync-product/route.ts
- Handler POST: Create/update product di storefront_products
- Handler DELETE: Remove product dari storefront_products
- Handler GET: Check sync status

## Workflow Pengguna

### Skenario 1: Tambah Produk Baru ke Lapak
1. User menambah produk di menu **Products**
2. Produk tersimpan di tabel `products`
3. User klik tombol **🛒** ungu (+ Lapak)
4. Produk otomatis ditambahkan ke tabel `storefront_products`
5. Tombol berubah jadi hijau dengan label "Lapak"
6. Badge "🛒 Lapak" muncul di nama produk
7. Produk langsung tampil di Lapak Online

### Skenario 2: Update Harga di Products
1. User edit harga di menu **Products**
2. Harga berubah di tabel `products` saja
3. Harga di Lapak **tidak berubah** otomatis
4. User harus:
   - **Opsi A:** Edit manual di menu Lapak
   - **Opsi B:** Klik tombol sync lagi (akan update)

### Skenario 3: Hapus dari Lapak
1. User klik tombol hijau "Lapak" di Products
2. Produk dihapus dari `storefront_products`
3. Produk **tetap ada** di tabel `products` (inventori)
4. Tombol berubah jadi ungu "ّ+ Lapak"
5. Badge "🛒 Lapak" hilang

## Error Handling

### Belum Punya Lapak
```
Error: "Buat Lapak Online terlebih dahulu di menu Lapak"
```
→ User harus setup Lapak Online dulu sebelum bisa sync produk

### Produk Sudah Ada
Sistem akan **update** produk yang sudah ada (match by `name`)

## Catatan Pengembangan Selanjutnya

### Improvement Ideas:
1. **Auto-sync toggle:** Opsi untuk sync otomatis saat update harga/stok
2. **Bulk sync:** Tombol untuk sync multiple produk sekaligus
3. **Sync history:** Log perubahan sinkronisasi
4. **Two-way sync:** Update dari Lapak juga update Products
5. **Mapping field:** User bisa pilih field mana yang di-sync

### Pertimbangan:
- Auto-sync bisa membuat kompleksitas tinggi (conflict resolution)
- One-time copy lebih predictable untuk user UMKM
- User punya kontrol penuh: produk mana yang ditampilkan di Lapak

## Testing Checklist

- [x] Build TypeScript sukses
- [ ] Test sync produk baru ke Lapak
- [ ] Test update produk yang sudah di Lapak
- [ ] Test unsync (hapus dari Lapak)
- [ ] Test badge indicator tampil dengan benar
- [ ] Test mobile responsive
- [ ] Test error handling (belum punya Lapak)
- [ ] Test performance dengan banyak produk

## Deploy Notes
Setelah fitur ini di-deploy:
- User akan melihat tombol baru 🛒 di setiap produk
- Badge "🛒 Lapak" otomatis muncul untuk produk yang sudah tersinkronisasi
- Tidak ada perubahan breaking - fitur backward compatible
