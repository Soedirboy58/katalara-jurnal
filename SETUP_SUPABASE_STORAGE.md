# SETUP SUPABASE STORAGE - LAPAK IMAGES

## Langkah-Langkah Setup Storage di Supabase Dashboard

### 1. Buat Storage Bucket

1. Buka **Supabase Dashboard** → Pilih project Anda
2. Klik **Storage** di menu sidebar
3. Klik tombol **New Bucket**
4. Isi form:
   - **Name**: `lapak-images`
   - **Public**: ✅ **CHECKLIST** (bucket harus public agar gambar bisa diakses)
   - **File size limit**: 5 MB (opsional, untuk limit ukuran file)
   - **Allowed MIME types**: `image/*` (opsional, hanya izinkan gambar)
5. Klik **Create Bucket**

### 2. Setup Storage Policies (RLS)

Setelah bucket dibuat, klik bucket `lapak-images` → tab **Policies**

#### Policy 1: Public Read Access (Semua orang bisa lihat gambar)

```sql
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'lapak-images');
```

**Atau via UI:**
- Operation: SELECT
- Policy name: `Public can view images`
- Target roles: `public`
- USING expression: `bucket_id = 'lapak-images'`

#### Policy 2: Authenticated Users Can Upload (Hanya user login bisa upload)

```sql
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'lapak-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Atau via UI:**
- Operation: INSERT
- Policy name: `Authenticated users can upload images`
- Target roles: `authenticated`
- WITH CHECK expression: `bucket_id = 'lapak-images' AND auth.uid()::text = (storage.foldername(name))[1]`

> **Penjelasan**: Policy ini memastikan user hanya bisa upload ke folder mereka sendiri (`user_id/products/...`)

#### Policy 3: Users Can Update Their Own Images

```sql
CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'lapak-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'lapak-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Policy 4: Users Can Delete Their Own Images

```sql
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'lapak-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 3. Verifikasi Setup

Test dengan upload gambar:

1. Login ke aplikasi
2. Buka **Dashboard → Lapak Online → Pengaturan Toko**
3. Coba upload **Logo Bisnis** (ambil foto dari kamera atau pilih dari galeri)
4. Cek di **Supabase Dashboard → Storage → lapak-images**
5. Seharusnya ada folder dengan struktur:
   ```
   lapak-images/
   └── <user_id>/
       ├── logos/
       │   └── <timestamp>_<random>.jpg
       ├── products/
       │   └── <timestamp>_<random>.jpg
       └── qris/
           └── <timestamp>_<random>.jpg
   ```

### 4. Troubleshooting

#### Error: "new row violates row-level security policy"
- **Penyebab**: Policy INSERT belum dikonfigurasi dengan benar
- **Solusi**: Pastikan policy INSERT ada dan `WITH CHECK` mengizinkan upload ke folder user sendiri

#### Error: "Failed to upload image"
- **Penyebab**: Bucket tidak public atau policy SELECT tidak ada
- **Solusi**: Set bucket ke public dan tambahkan policy SELECT

#### Gambar tidak muncul di website
- **Penyebab**: Bucket tidak public
- **Solusi**: Edit bucket settings → centang "Public bucket"

#### User bisa lihat/hapus gambar user lain
- **Penyebab**: Policy terlalu permissive
- **Solusi**: Pastikan semua policy (UPDATE, DELETE) menggunakan kondisi `auth.uid()::text = (storage.foldername(name))[1]`

---

## Quick Copy-Paste All Policies

Jalankan SQL ini di **SQL Editor** setelah bucket dibuat:

```sql
-- Public can view all images in lapak-images bucket
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'lapak-images');

-- Authenticated users can upload to their own folder
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'lapak-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own images
CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'lapak-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'lapak-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own images
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'lapak-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## File Structure di Storage

Setelah user upload gambar, struktur folder akan seperti ini:

```
lapak-images/
├── user-uuid-1/
│   ├── logos/
│   │   └── 1731900000000_abc123.jpg (Logo bisnis)
│   ├── products/
│   │   ├── 1731900100000_def456.jpg (Foto produk 1)
│   │   ├── 1731900200000_ghi789.jpg (Foto produk 2)
│   │   └── ...
│   └── qris/
│       └── 1731900300000_jkl012.jpg (QRIS code)
├── user-uuid-2/
│   ├── logos/
│   ├── products/
│   └── qris/
└── ...
```

Setiap user punya folder sendiri berdasarkan `user_id` dari Supabase Auth.

---

## Cara Cek Public URL

Public URL format:
```
https://<project-id>.supabase.co/storage/v1/object/public/lapak-images/<user_id>/<folder>/<filename>
```

Contoh:
```
https://abcdefghijklmnop.supabase.co/storage/v1/object/public/lapak-images/550e8400-e29b-41d4-a716-446655440000/products/1731900000000_abc123.jpg
```

URL ini yang disimpan di database (kolom `image_url`, `logo_url`, `qris_image_url`).

---

## Done! 🎉

Setelah setup ini selesai, user bisa langsung:
- 📷 **Ambil foto produk** dari kamera HP
- 🖼️ **Upload dari galeri**
- 🗑️ **Hapus & ganti foto** dengan mudah

Tidak perlu lagi input URL manual atau upload ke layanan eksternal!
