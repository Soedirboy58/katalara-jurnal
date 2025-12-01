# 🖼️ Supabase Storage Setup - Product Images

## Overview
Product images disimpan di **Supabase Storage** dengan bucket name: **`products`**

## Setup Instructions

### 1. Create Storage Bucket

1. Buka **Supabase Dashboard** → Project Anda
2. Navigate ke: **Storage** (sidebar kiri)
3. Klik **New Bucket**
4. Isi form:
   - **Name**: `products`
   - **Public bucket**: ✅ YES (centang checkbox)
   - **File size limit**: `5242880` (5 MB)
   - **Allowed MIME types**: 
     ```
     image/jpeg
     image/jpg
     image/png
     image/webp
     ```

5. Klik **Save**

### 2. Verify Bucket Settings

Setelah bucket dibuat, pastikan:

- ✅ **Name**: `products`
- ✅ **Public**: Yes (agar gambar bisa diakses publik)
- ✅ **File size limit**: 5 MB
- ✅ **MIME types**: image/jpeg, image/jpg, image/png, image/webp

### 3. Set RLS Policies (Optional, untuk keamanan)

Untuk mencegah user upload ke folder user lain:

```sql
-- Policy: Users can only upload to their own folder
CREATE POLICY "Users can upload to their folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'products' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Anyone can view public images
CREATE POLICY "Public images are viewable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'products');

-- Policy: Users can delete their own images
CREATE POLICY "Users can delete their images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'products'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

## File Structure

Gambar disimpan dengan struktur:

```
products/
├── {user_id}/
│   ├── {product_id}/
│   │   ├── {timestamp}_0.jpg  (first image)
│   │   ├── {timestamp}_1.png  (second image)
│   │   └── ...
```

### Contoh path:
```
products/550e8400-e29b-41d4-a716-446655440000/7c3f...4a2b/1731234567890_0.jpg
          └── user_id                              └── product_id  └── timestamp_index.ext
```

## Code Integration

### Helper Module: `src/lib/storage/productImages.ts`

```typescript
import { uploadProductImage, PRODUCT_IMAGE_BUCKET } from '@/lib/storage/productImages'

// Upload image
const result = await uploadProductImage(
  supabase,
  userId,
  productId,
  file,
  0 // index
)

if (result.success) {
  console.log('Public URL:', result.publicUrl)
  // Update products table with image_url
}
```

### Key Functions:

1. **`uploadProductImage()`**
   - Upload file ke bucket
   - Auto-validate file size & MIME type
   - Return public URL

2. **`deleteProductImage()`**
   - Hapus file dari bucket
   - Cleanup ketika produk dihapus

3. **`validateImageFile()`**
   - Validate file sebelum upload
   - Max 5 MB, hanya JPG/PNG/WebP

## Error Handling

### Common Errors:

| Error | Penyebab | Solusi |
|-------|----------|---------|
| `Bucket not found` | Bucket `products` belum dibuat | Buat bucket di Supabase Dashboard |
| `File too large` | File > 5 MB | Compress image sebelum upload |
| `Invalid MIME type` | Format bukan JPG/PNG/WebP | Convert ke format yang didukung |
| `Already exists` | File sudah ada (duplicate timestamp) | Retry, timestamp akan berbeda |

### Graceful Degradation:

Jika upload gambar gagal:
- ✅ Produk tetap tersimpan ke database
- ⚠️ User diberi warning: "Produk berhasil disimpan, tetapi gambar gagal diupload"
- 🔄 User bisa upload ulang via Edit Product

## Testing

### Manual Test:

1. Buka aplikasi
2. Tambah produk baru
3. Upload 1-3 gambar
4. Klik **Simpan Produk**
5. Verify:
   - ✅ Produk muncul di list
   - ✅ Gambar primary tampil di card
   - ✅ Gambar bisa diklik & dibuka di browser

### Check di Supabase:

1. **Storage** → Bucket `products`
2. Browse folder: `{user_id}/{product_id}/`
3. Verify file ada & bisa di-preview

### Check Database:

```sql
-- Verify image_url tersimpan
SELECT id, name, image_url 
FROM products 
WHERE image_url IS NOT NULL;

-- Verify product_images records
SELECT product_id, image_url, is_primary, sort_order
FROM product_images
ORDER BY product_id, sort_order;
```

## Migration dari Bucket Lain

Jika sebelumnya menggunakan bucket name berbeda (contoh: `Assets`, `product-images`):

### Option 1: Rename Bucket (Recommended)

```sql
-- Di Supabase SQL Editor
UPDATE storage.buckets 
SET name = 'products' 
WHERE name = 'Assets'; -- atau 'product-images'
```

### Option 2: Migrate Files

```typescript
// Script untuk migrate files
async function migrateFiles() {
  const { data: files } = await supabase.storage
    .from('Assets')
    .list()
  
  for (const file of files) {
    // Download from old bucket
    const { data: fileData } = await supabase.storage
      .from('Assets')
      .download(file.name)
    
    // Upload to new bucket
    await supabase.storage
      .from('products')
      .upload(file.name, fileData)
    
    // Delete from old bucket
    await supabase.storage
      .from('Assets')
      .remove([file.name])
  }
}
```

### Option 3: Keep Old Bucket, Update Code

Edit `src/lib/storage/productImages.ts`:

```typescript
// Change bucket name constant
export const PRODUCT_IMAGE_BUCKET = 'Assets' // or your bucket name
```

## Troubleshooting

### 1. Bucket not found

**Symptom:**
```
Error: Bucket not found
```

**Fix:**
- Verify bucket name: `products` (case-sensitive)
- Check Supabase Dashboard → Storage
- Recreate bucket if missing

### 2. Upload permission denied

**Symptom:**
```
Error: new row violates row-level security policy
```

**Fix:**
- Set bucket to **Public**
- Or create RLS policy (see section 3 above)

### 3. Image not displaying

**Symptom:**
- Upload success, but image tidak muncul

**Fix:**
- Verify `image_url` field in database
- Check public URL accessible di browser
- Verify bucket **Public** setting

## Best Practices

1. **Always use helper functions**
   - Don't call `.storage.from()` directly
   - Use `uploadProductImage()` for consistency

2. **Validate before upload**
   - Check file size client-side
   - Check MIME type client-side
   - Use `validateImageFile()` helper

3. **Handle errors gracefully**
   - Don't block product creation
   - Show user-friendly messages
   - Allow retry via Edit Product

4. **Optimize images**
   - Compress large images before upload
   - Use WebP for better compression
   - Max recommended: 1-2 MB per image

5. **Cleanup unused images**
   - Delete images when product deleted
   - Use `deleteProductImage()` helper
   - Prevent storage bloat

## Support

Jika masih ada masalah:
1. Check Supabase Dashboard → Logs
2. Check browser console (F12)
3. Verify environment variables (.env.local)
4. Contact support dengan error message lengkap
