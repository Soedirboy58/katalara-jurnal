# PRODUCT MULTIPLE IMAGES UPGRADE

## 🎯 TUJUAN
Upgrade modal "Tambah Produk Baru" untuk mendukung **multiple images** (min 1, max 5) dengan integrasi Supabase Storage dan metadata di tabel `product_images`.

---

## 🔧 FILES YANG DIUBAH

### 1. **`src/components/products/ProductModal.tsx`** (Major Refactor)

#### **A. State Management Changes**

**Before:**
```typescript
const [imageFile, setImageFile] = useState<File | null>(null)
const [imagePreview, setImagePreview] = useState<string>('')
```

**After:**
```typescript
interface ImagePreview {
  file: File
  preview: string
  isPrimary: boolean
}

const [images, setImages] = useState<ImagePreview[]>([])
const [errorMessage, setErrorMessage] = useState<string | null>(null)
```

#### **B. Image Upload Handler**

**Features:**
- ✅ Multiple file selection (max 5)
- ✅ File size validation (max 5MB per file)
- ✅ Auto-set first image as primary
- ✅ Preview generation for each image
- ✅ User-friendly error messages

```typescript
const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(e.target.files || [])
  
  // Validation
  if (images.length + files.length > 5) {
    setErrorMessage('Maksimal 5 gambar. Hapus gambar lain terlebih dahulu.')
    return
  }

  if (files.some(file => file.size > 5 * 1024 * 1024)) {
    setErrorMessage('Beberapa file melebihi 5MB. Pilih file yang lebih kecil.')
    return
  }

  // Create previews
  files.forEach(file => {
    const reader = new FileReader()
    reader.onloadend = () => {
      setImages(prev => [...prev, {
        file,
        preview: reader.result as string,
        isPrimary: prev.length === 0 // First = primary
      }])
    }
    reader.readAsDataURL(file)
  })
}
```

#### **C. Image Management Functions**

```typescript
// Remove image from array
const handleRemoveImage = (index: number) => {
  setImages(prev => {
    const newImages = prev.filter((_, i) => i !== index)
    // If removed was primary, make first one primary
    if (prev[index].isPrimary && newImages.length > 0) {
      newImages[0].isPrimary = true
    }
    return newImages
  })
}

// Set image as primary (main product image)
const handleSetPrimary = (index: number) => {
  setImages(prev => 
    prev.map((img, i) => ({
      ...img,
      isPrimary: i === index
    }))
  )
}
```

#### **D. Submit Flow (New Multi-Step Process)**

**STEP 1: Validate Images**
```typescript
if (images.length === 0) {
  setErrorMessage('Minimal 1 gambar produk wajib diupload')
  return
}
```

**STEP 2: Insert Product**
```typescript
const { data: insertedProduct } = await supabase
  .from('products')
  .insert(productData)
  .select('id')
  .single()

const productId = insertedProduct.id
```

**STEP 3: Upload Images to Storage**
```typescript
for (let i = 0; i < images.length; i++) {
  const imageData = images[i]
  const fileName = `products/${user.id}/${productId}/${Date.now()}_${i}.${ext}`
  
  await supabase.storage
    .from('product-images')
    .upload(fileName, imageData.file)
  
  const { data: urlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(fileName)
  
  uploadedImages.push({
    url: urlData.publicUrl,
    isPrimary: imageData.isPrimary,
    sortOrder: i
  })
}
```

**STEP 4: Insert Image Metadata**
```typescript
const imageRecords = uploadedImages.map(img => ({
  product_id: productId,
  image_url: img.url,
  is_primary: img.isPrimary,
  sort_order: img.sortOrder,
  created_at: new Date().toISOString()
}))

await supabase
  .from('product_images')
  .insert(imageRecords)
```

#### **E. UI Changes**

**Preview Grid (5 columns):**
```tsx
<div className="grid grid-cols-5 gap-3">
  {images.map((img, index) => (
    <div className={`relative group ${img.isPrimary ? 'border-blue-500 ring-2' : 'border-gray-300'}`}>
      <img src={img.preview} />
      
      {/* Primary Badge */}
      {img.isPrimary && <div className="badge">Utama</div>}
      
      {/* Hover Actions */}
      <div className="group-hover:opacity-100">
        {!img.isPrimary && <button onClick={() => handleSetPrimary(index)}>Utama</button>}
        <button onClick={() => handleRemoveImage(index)}>Hapus</button>
      </div>
    </div>
  ))}
</div>
```

**Upload Button:**
```tsx
<input 
  type="file" 
  multiple 
  accept="image/*"
  disabled={images.length >= 5}
/>
<label>
  {images.length === 0 ? 'Upload Gambar' : `Tambah Gambar (${images.length}/5)`}
</label>
```

**Error Display:**
```tsx
{errorMessage && (
  <div className="bg-red-50 border border-red-200 p-3">
    <p className="text-red-700">{errorMessage}</p>
  </div>
)}
```

---

### 2. **`sql/create_product_images_table.sql`** (NEW FILE)

#### **Database Schema**
```sql
CREATE TABLE public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **Indexes for Performance**
```sql
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_primary ON product_images(product_id, is_primary) WHERE is_primary = TRUE;
CREATE INDEX idx_product_images_sort ON product_images(product_id, sort_order);
```

#### **Row Level Security (RLS)**
4 policies created:
- `SELECT`: Users can view images for their own products
- `INSERT`: Users can add images to their own products
- `UPDATE`: Users can update their own product images
- `DELETE`: Users can delete their own product images

All policies check ownership via `products.user_id = auth.uid()`.

---

## 📊 FLOW DIAGRAM: "Simpan Produk" (Frontend)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER ACTION: Klik "Simpan Produk"                       │
└───────────────┬─────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. VALIDATION                                               │
│    ✓ Check: images.length >= 1                             │
│    ✓ Check: All required fields filled                     │
└───────────────┬─────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. INSERT PRODUCT                                           │
│    → Supabase: INSERT INTO products                         │
│    → Get productId from response                            │
└───────────────┬─────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. UPLOAD IMAGES (Loop untuk setiap file)                  │
│    For each image in images[]:                              │
│      → Generate filename: products/{userId}/{productId}/... │
│      → Upload to Storage: product-images bucket             │
│      → Get public URL                                       │
│      → Store in uploadedImages[] array                      │
└───────────────┬─────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. INSERT IMAGE METADATA                                    │
│    → Supabase: INSERT INTO product_images (batch)           │
│    → Fields: product_id, image_url, is_primary, sort_order │
└───────────────┬─────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. SUCCESS                                                  │
│    → onSuccess() callback                                   │
│    → Close modal                                            │
│    → Show toast notification (if available)                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 UI/UX IMPROVEMENTS

### **Before:**
- ❌ Single image upload only
- ❌ No preview grid
- ❌ No primary image selection
- ❌ Uses `alert()` for errors

### **After:**
- ✅ Multiple images (min 1, max 5)
- ✅ Grid preview with thumbnails
- ✅ Click to set primary image
- ✅ Hover actions (set primary, delete)
- ✅ Inline error messages (no alert)
- ✅ Image count indicator (0/5, 1/5, etc.)
- ✅ Visual primary badge (blue ring + "Utama" label)
- ✅ File size validation (max 5MB each)
- ✅ Upload button disabled when limit reached

---

## 🧪 TESTING CHECKLIST

### **Database Setup:**
```bash
# 1. Run SQL migration
psql -U postgres -d your_db -f sql/create_product_images_table.sql

# 2. Create Storage bucket in Supabase Dashboard
#    Name: product-images
#    Public: YES

# 3. Add Storage policies (see SQL file comments)
```

### **Frontend Testing:**

1. **Upload Single Image:**
   - ✅ Upload 1 image
   - ✅ Image marked as primary automatically
   - ✅ Preview displayed
   - ✅ Can remove and re-upload

2. **Upload Multiple Images:**
   - ✅ Upload 2-5 images
   - ✅ First image is primary by default
   - ✅ All images show in grid
   - ✅ Can change primary by clicking "Utama"

3. **Validation Tests:**
   - ✅ Try submit without images → Error: "Minimal 1 gambar"
   - ✅ Try upload >5 images → Error: "Maksimal 5 gambar"
   - ✅ Try upload >5MB file → Error: "File melebihi 5MB"

4. **Primary Image Logic:**
   - ✅ Set image #2 as primary
   - ✅ Blue ring appears on image #2
   - ✅ "Utama" badge shown
   - ✅ Remove primary image → First remaining becomes primary

5. **Database Verification:**
```sql
-- Check product created
SELECT * FROM products ORDER BY created_at DESC LIMIT 1;

-- Check images saved
SELECT * FROM product_images WHERE product_id = '<product_id>';

-- Should see:
-- - Multiple rows (1-5)
-- - One row with is_primary = TRUE
-- - sort_order values: 0, 1, 2, 3, 4
```

6. **Storage Verification:**
```
Supabase Dashboard > Storage > product-images
└── products/
    └── {user_id}/
        └── {product_id}/
            ├── 1234567890_0.jpg  (primary)
            ├── 1234567891_1.png
            └── 1234567892_2.jpg
```

---

## ⚠️ IMPORTANT NOTES

### **Storage Bucket Configuration:**
Must create bucket `product-images` in Supabase with:
- **Public**: YES (untuk public URL access)
- **File size limit**: 5MB per file
- **Allowed MIME types**: image/jpeg, image/png, image/webp

### **RLS Policies:**
Table `product_images` protected by RLS. Users can only:
- View images for products they own
- Upload images to products they own
- Delete images from products they own

### **Cascade Delete:**
If product is deleted, all associated images in `product_images` table are automatically deleted (ON DELETE CASCADE).

### **Storage Cleanup:**
Consider implementing background job to delete orphaned files from Storage if database records are deleted.

---

## 📋 DEPLOYMENT STEPS

1. **Database Migration:**
   ```bash
   # Run in Supabase SQL Editor
   sql/create_product_images_table.sql
   ```

2. **Create Storage Bucket:**
   - Go to: Supabase Dashboard > Storage
   - Click: "New Bucket"
   - Name: `product-images`
   - Public: ✅ YES
   - Click: "Create bucket"

3. **Add Storage Policies:**
   ```sql
   -- See comments in create_product_images_table.sql
   -- Copy storage policies and run in SQL Editor
   ```

4. **Deploy Frontend:**
   ```bash
   git add src/components/products/ProductModal.tsx
   git commit -m "feat: Add multiple images support to product modal"
   git push
   ```

5. **Test:**
   - Create new product with 3 images
   - Set image #2 as primary
   - Verify all images saved correctly
   - Check Storage bucket has files

---

## 🚀 FUTURE ENHANCEMENTS

- [ ] Add image reordering (drag & drop)
- [ ] Add image cropping/editing
- [ ] Add image compression before upload
- [ ] Show upload progress bar
- [ ] Support video thumbnails
- [ ] Bulk image upload from folder
- [ ] Image optimization (WebP conversion)
- [ ] Lazy loading for image grid

---

**Status:** ✅ COMPLETED  
**Date:** 2025-11-27  
**Testing Required:** Database migration + Storage bucket setup  
**Breaking Changes:** None (additive only)
