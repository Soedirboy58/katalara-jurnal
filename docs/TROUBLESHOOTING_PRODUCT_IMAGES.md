# 🔧 Troubleshooting: Gambar Produk Hilang

## Masalah yang Dilaporkan
1. ✅ Upload gambar berhasil (simpan sukses)
2. ❌ Gambar tidak muncul di list produk
3. ❌ Saat dicek lagi, gambar hilang

## 🔍 Root Cause Analysis

Ada **3 kemungkinan penyebab**:

### 1. Kolom `image_url` Belum Ada di Database ⚠️
**Cek**: Eksekusi query debug di Supabase SQL Editor
```sql
-- File: sql/debug_product_images.sql

-- Cek apakah kolom image_url exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'image_url';
```

**Expected Output**:
```
column_name | data_type
------------+----------
image_url   | text
```

**Jika kosong**: Eksekusi migration dulu!
```sql
-- File: sql/03_add_product_image_column.sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;
```

---

### 2. RLS Policy Belum Disetup 🔒
**Cek**: Query policies di SQL Editor
```sql
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' 
AND (policyname LIKE '%product%' OR policyname LIKE '%lapak%');
```

**Expected**: Should see 3+ policies for lapak-images bucket

**Jika kosong**: Eksekusi RLS policies!
```sql
-- File: sql/04_setup_product_images_storage.sql
-- Copy semua isi file dan Run
```

---

### 3. Image_url Tidak Tersimpan ke Database 💾
**Cek**: Query products table
```sql
SELECT id, name, image_url, created_at
FROM products
WHERE image_url IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

**Possible Results**:
- ✅ Shows URL like `https://...supabase.co/storage/v1/object/public/lapak-images/products/...`
- ❌ Empty result → Image URL not saved
- ⚠️ Shows base64 string (data:image/...) → Bug in upload logic (FIXED in latest deploy)

---

## 🛠️ Fix yang Sudah Dilakukan

### Fix 1: Upload Logic (ProductModal.tsx)
**Problem**: `imageUrl` diinisialisasi dengan `imagePreview` (base64), jadi kalau tidak upload baru, base64 tersimpan ke database instead of actual Storage URL.

**Solution**:
```typescript
// BEFORE (❌ Wrong)
let imageUrl = imagePreview // Base64 string!

// AFTER (✅ Fixed)
let imageUrl: string | undefined = undefined

if (imageFile) {
  // Upload new image, get Storage URL
  imageUrl = urlData.publicUrl
} else if (product && (product as any).image_url) {
  // Keep existing Storage URL when editing
  imageUrl = (product as any).image_url
}
```

### Fix 2: Comprehensive Logging
Added console logs with emojis untuk easy debugging:
- 🖼️ Uploading new image
- 📁 File path
- ✅ Upload success
- 🔗 Public URL
- 🗑️ Deleting old image
- 💾 Saving product data
- ❌ Errors

### Fix 3: Image Load Error Handling
```typescript
<img 
  src={imageUrl}
  onError={() => {
    console.error('🖼️ Image load error:', imageUrl)
    // Fallback to 📦 icon
  }}
  onLoad={() => console.log('✅ Image loaded')}
/>
```

---

## ✅ Testing Steps (Do This Now!)

### Step 1: Verify Database Schema
```sql
-- Should return 1 row with image_url column
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'image_url';
```

### Step 2: Verify RLS Policies
```sql
-- Should return 3 policies for products in lapak-images
SELECT policyname FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%product%lapak%';
```

### Step 3: Test Upload New Product
1. Open: https://supabase-migration-cyf9ixmb8-katalaras-projects.vercel.app
2. Login → Products → Tambah Produk
3. Fill form + upload image
4. **Open Browser Console** (F12)
5. Click Simpan
6. **Check Console Logs**:
   ```
   🖼️ Uploading new image...
   📁 File path: products/{user_id}/{timestamp}.jpg
   ✅ Upload success: { path: '...' }
   🔗 Public URL: https://...supabase.co/storage/v1/object/public/lapak-images/products/...
   💾 Saving product data: { name: '...', image_url: 'https://...' }
   ✅ Product created successfully
   ```

### Step 4: Verify in Database
```sql
-- Check latest product
SELECT id, name, image_url 
FROM products 
ORDER BY created_at DESC 
LIMIT 1;
```

**Expected**: `image_url` should be full URL (not base64, not null)

### Step 5: Verify in Storage
1. Supabase Dashboard → Storage → lapak-images
2. Navigate to `products/{your_user_id}/`
3. Should see uploaded image file
4. Click file → Should open image in new tab

### Step 6: Check Product List Display
1. Go to Products page
2. Find your newly created product
3. **Open Console** (F12)
4. Should see: `✅ Image loaded: {product_name}`
5. Image should display in card (not 📦 icon)

---

## 🐛 If Still Not Working

### Scenario A: Console shows "Upload success" but image not in Storage
**Cause**: RLS policy blocking INSERT  
**Fix**: 
```sql
-- Verify user can upload to products/{user_id}/
SELECT * FROM storage.objects 
WHERE bucket_id = 'lapak-images' 
AND name LIKE 'products/%';

-- If empty, check policy:
CREATE POLICY "Users can upload product images to lapak-images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lapak-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'products'
  AND (storage.foldername(name))[2] = auth.uid()::text
);
```

### Scenario B: Image in Storage but image_url is NULL in database
**Cause**: Column not added or RLS blocking UPDATE  
**Fix**:
```sql
-- Add column
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Check RLS policies for products table
SELECT * FROM pg_policies WHERE tablename = 'products';
```

### Scenario C: image_url saved but image won't load (403 error)
**Cause**: Bucket not public or RLS blocking SELECT  
**Fix**:
1. Dashboard → Storage → lapak-images → Settings
2. Set **Public bucket: YES**
3. Or add policy:
```sql
CREATE POLICY "Public can read lapak-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'lapak-images');
```

### Scenario D: Image shows in console but not rendering
**Cause**: CORS or image URL format issue  
**Debug**:
```javascript
// In browser console
fetch('https://YOUR_SUPABASE_URL/storage/v1/object/public/lapak-images/products/...')
  .then(r => console.log('Status:', r.status))
  .catch(e => console.error('Fetch error:', e))
```

---

## 📊 Expected File Structure

After successful upload, your Storage should look like:

```
lapak-images/
├── products/
│   └── a1b2c3d4-user-id-5678/
│       ├── 1732345678901.jpg  ← Product 1 image
│       ├── 1732345789012.png  ← Product 2 image
│       └── 1732345890123.webp ← Product 3 image
└── (other lapak marketplace files)
```

Database should have:
```sql
id | name | image_url
---|------|----------
xxx| AC Cassette | https://...supabase.co/storage/v1/object/public/lapak-images/products/a1b2.../1732345678901.jpg
```

---

## 🎯 Quick Diagnostic Command

Run this all-in-one diagnostic query:

```sql
-- Comprehensive diagnostic
SELECT 
  'Column exists' as check_type,
  COUNT(*) as result
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'image_url'

UNION ALL

SELECT 
  'Products with images' as check_type,
  COUNT(*) as result
FROM products 
WHERE image_url IS NOT NULL

UNION ALL

SELECT 
  'RLS policies' as check_type,
  COUNT(*) as result
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%product%'

UNION ALL

SELECT 
  'Files in storage' as check_type,
  COUNT(*) as result
FROM storage.objects 
WHERE bucket_id = 'lapak-images' 
AND name LIKE 'products/%';
```

**Expected Output**:
```
check_type              | result
-----------------------|-------
Column exists          | 1
Products with images   | 3
RLS policies           | 3
Files in storage       | 3
```

**If any result is 0**: That's your issue!

---

## 🚀 Latest Deployment

**URL**: https://supabase-migration-cyf9ixmb8-katalaras-projects.vercel.app  
**Date**: November 23, 2025  
**Changes**:
- ✅ Fixed imageUrl initialization bug
- ✅ Added comprehensive console logging
- ✅ Added image load error handling
- ✅ Proper URL preservation when editing without image change

---

## 📝 Manual Steps Checklist

Before testing, ensure these are done:

- [ ] Execute `sql/03_add_product_image_column.sql` in Supabase
- [ ] Execute `sql/04_setup_product_images_storage.sql` in Supabase
- [ ] Verify bucket `lapak-images` is **Public**
- [ ] Clear browser cache (Ctrl+Shift+Del)
- [ ] Test with latest deployment URL
- [ ] Check browser console for logs

---

## 💡 Pro Tips

1. **Always check Console first** - All upload steps logged with emojis
2. **Verify Storage first** - File must exist before fixing display
3. **Check URL format** - Should start with `https://` not `data:image/`
4. **Test with small images** - Under 1MB for faster debugging
5. **Use Incognito** - Avoid cache issues during testing

---

## 📞 Need Help?

If issue persists, provide:
1. Screenshot of Browser Console logs
2. Screenshot of Supabase Storage (products folder)
3. Result of diagnostic query above
4. Screenshot of product in list (showing 📦 or broken image)
