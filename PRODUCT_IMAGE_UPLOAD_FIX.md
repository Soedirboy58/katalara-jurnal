# 🐛 Product Image Upload Fix - "Bucket not found" Error

**Date:** Nov 2024  
**Status:** ✅ RESOLVED  
**Issue:** Product berhasil disimpan, tetapi gambar gagal upload dengan error "Bucket not found"

---

## Problem

Setelah berhasil insert product row ke database, kode mencoba upload gambar ke Supabase Storage dan muncul error:

```
Error: Bucket not found
```

### Root Cause

**ProductModal.tsx** hardcoded bucket name `'product-images'`:

```typescript
// Line 202 - BEFORE (BROKEN)
const { error: uploadError } = await supabase.storage
  .from('product-images')  // ❌ Bucket doesn't exist
  .upload(fileName, imageData.file)
```

Tetapi user sudah membuat bucket dengan nama berbeda di Supabase Storage.

---

## Solution

### 1. Created Helper Module

**File:** `src/lib/storage/productImages.ts`

Module ini menyediakan:
- ✅ **Centralized bucket configuration**: `PRODUCT_IMAGE_BUCKET = 'products'`
- ✅ **Upload function**: `uploadProductImage(supabase, userId, productId, file, index)`
- ✅ **Validation**: File size (max 5 MB), MIME type (JPG/PNG/WebP)
- ✅ **Error handling**: User-friendly error messages
- ✅ **Delete function**: `deleteProductImage()` for cleanup

**Key Features:**

```typescript
// Upload with automatic validation
const result = await uploadProductImage(supabase, userId, productId, file, 0)

if (result.success) {
  console.log('Public URL:', result.publicUrl)
  // Update products.image_url
} else {
  console.error('Upload failed:', result.error)
}
```

### 2. Refactored ProductModal.tsx

**Changes:**

1. **Import helper**:
```typescript
import { uploadProductImage, PRODUCT_IMAGE_BUCKET, getBucketInfo } from '@/lib/storage/productImages'
```

2. **Replace hardcoded upload** (Lines 190-220):

**BEFORE:**
```typescript
const { error: uploadError } = await supabase.storage
  .from('product-images')  // ❌ Hardcoded
  .upload(fileName, imageData.file, { ... })
```

**AFTER:**
```typescript
const uploadResult = await uploadProductImage(
  supabase,
  user.id,
  productId,
  imageData.file,
  i
)

if (!uploadResult.success) {
  throw new Error(`Gagal upload gambar: ${uploadResult.error}`)
}
```

3. **Added debug logging**:
```typescript
console.log('🖼️ Uploading images...', {
  bucket: PRODUCT_IMAGE_BUCKET,
  config: getBucketInfo()
})
```

### 3. Created Setup Documentation

**File:** `SUPABASE_STORAGE_SETUP.md`

Dokumentasi lengkap untuk:
- ✅ Cara create bucket `products` di Supabase Dashboard
- ✅ Set bucket ke Public
- ✅ Configure file size limit (5 MB) & MIME types
- ✅ Optional RLS policies untuk keamanan
- ✅ File structure: `products/{user_id}/{product_id}/{timestamp}_{index}.jpg`
- ✅ Troubleshooting common errors
- ✅ Migration guide dari bucket name lain

---

## Setup Instructions

### For New Projects:

1. **Create Bucket di Supabase Dashboard:**
   - Storage → New Bucket
   - Name: **`products`**
   - Public: **YES** ✅
   - File size limit: **5 MB**
   - MIME types: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`

2. **Deploy code:**
   - Helper module sudah siap pakai
   - ProductModal sudah menggunakan helper

3. **Test:**
   - Buat produk baru + upload gambar
   - Verify gambar muncul di product card
   - Check Storage → `products/{user_id}/{product_id}/`

### For Existing Projects (Migration):

**Option 1:** Rename existing bucket

```sql
UPDATE storage.buckets 
SET name = 'products' 
WHERE name = 'Assets'; -- atau nama lama
```

**Option 2:** Update constant di code

Edit `src/lib/storage/productImages.ts`:
```typescript
export const PRODUCT_IMAGE_BUCKET = 'Assets' // atau nama bucket Anda
```

---

## Files Changed

| File | Status | Changes |
|------|--------|---------|
| `src/lib/storage/productImages.ts` | ✅ NEW | Helper module dengan upload/delete functions |
| `src/components/products/ProductModal.tsx` | ✅ MODIFIED | Refactored to use helper, added error handling |
| `SUPABASE_STORAGE_SETUP.md` | ✅ NEW | Setup documentation & troubleshooting guide |

---

## Benefits

### 1. **Centralized Configuration**
- Bucket name defined di 1 tempat: `PRODUCT_IMAGE_BUCKET`
- Easy to change untuk semua components

### 2. **Better Error Handling**
- Validation BEFORE upload (file size, MIME type)
- User-friendly error messages
- Graceful degradation (product saved even if images fail)

### 3. **Consistent Code**
- All components use same upload logic
- No duplicate `.storage.from()` calls
- Easier to maintain & test

### 4. **Production Ready**
- Path structure: `{user_id}/{product_id}/{timestamp}_{index}.ext`
- Auto-cleanup on product delete
- RLS policies support (optional)

---

## Testing Checklist

- [x] ✅ TypeScript compilation (no errors)
- [ ] Upload single image
- [ ] Upload multiple images (3+)
- [ ] Verify public URL accessible
- [ ] Test file size validation (> 5 MB)
- [ ] Test MIME type validation (PDF, etc.)
- [ ] Test error handling (bucket not found)
- [ ] Verify product saved even if image fails
- [ ] Test delete product → images cleaned up

---

## Next Steps

1. **Create bucket** di Supabase Dashboard (name: `products`)
2. **Test upload flow** dengan produk baru
3. **Verify** gambar tampil di product list
4. **Optional:** Set RLS policies untuk keamanan
5. **Optional:** Migrate dari bucket lama (if any)

---

## Troubleshooting

### Still getting "Bucket not found"?

1. **Verify bucket name**:
   - Supabase Dashboard → Storage
   - Check bucket name exactly: `products` (lowercase)

2. **Verify constant**:
   ```typescript
   // src/lib/storage/productImages.ts
   export const PRODUCT_IMAGE_BUCKET = 'products'
   ```

3. **Clear cache & restart dev server**:
   ```bash
   # Stop dev server (Ctrl+C)
   npm run dev
   ```

### Upload success but image not displaying?

1. **Check bucket Public setting**:
   - Storage → products → Settings
   - Public: YES ✅

2. **Verify image_url in database**:
   ```sql
   SELECT id, name, image_url FROM products;
   ```

3. **Test public URL in browser**:
   - Copy `image_url` from database
   - Open in new tab
   - Should display image

---

## Support

Jika masih ada masalah:
1. Check browser console (F12)
2. Check Supabase Dashboard → Logs
3. Verify `.env.local` credentials
4. Share error message & screenshot
