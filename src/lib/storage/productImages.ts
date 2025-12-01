/**
 * PRODUCT IMAGES STORAGE HELPER
 * 
 * Purpose: Centralized helper for uploading product images to Supabase Storage
 * Domain: INVENTORY
 * 
 * Bucket Configuration:
 * - Bucket name: "products" (must exist in Supabase Storage)
 * - Path structure: products/{user_id}/{product_id}/{timestamp}_{index}.{ext}
 * - Public access: Required (for displaying images)
 * 
 * Setup Instructions:
 * 1. Create bucket in Supabase Dashboard:
 *    - Storage → New Bucket
 *    - Name: "products"
 *    - Public: Yes
 *    - File size limit: 5 MB
 *    - Allowed MIME types: image/jpeg, image/png, image/webp
 * 
 * 2. Set RLS Policy (optional, for user isolation):
 *    - Users can only upload to their own folder: products/{user_id}/*
 */

import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Bucket name for product images
 * IMPORTANT: This bucket must exist in Supabase Storage
 * 
 * ⚠️ UPDATE SESUAI BUCKET DI SUPABASE ANDA:
 * - Jika bucket name "products" → pakai 'products'
 * - Jika bucket name "Assets" → pakai 'Assets'
 * - Jika bucket name "lapak-images" → pakai 'lapak-images'
 */
export const PRODUCT_IMAGE_BUCKET = 'products' // ⚠️ GANTI SESUAI BUCKET ANDA

/**
 * Maximum file size (5 MB)
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024

/**
 * Allowed image MIME types
 */
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

/**
 * Upload result interface
 */
export interface UploadProductImageResult {
  success: boolean
  path?: string
  publicUrl?: string
  error?: string
}

/**
 * Validate image file before upload
 * @param file - File to validate
 * @returns Error message if invalid, null if valid
 */
export function validateImageFile(file: File): string | null {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return `File terlalu besar. Maksimal ${MAX_FILE_SIZE / 1024 / 1024} MB`
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return 'Format file tidak didukung. Gunakan JPG, PNG, atau WebP'
  }

  return null
}

/**
 * Upload product image to Supabase Storage
 * 
 * @param supabase - Supabase client instance
 * @param userId - User ID (for folder organization)
 * @param productId - Product ID (for folder organization)
 * @param file - Image file to upload
 * @param index - Image index (for multiple images)
 * @returns Upload result with path and public URL
 * 
 * @example
 * const result = await uploadProductImage(supabase, userId, productId, file, 0)
 * if (result.success) {
 *   console.log('Uploaded to:', result.publicUrl)
 * } else {
 *   console.error('Upload failed:', result.error)
 * }
 */
export async function uploadProductImage(
  supabase: SupabaseClient,
  userId: string,
  productId: string,
  file: File,
  index: number = 0
): Promise<UploadProductImageResult> {
  try {
    // Validate file
    const validationError = validateImageFile(file)
    if (validationError) {
      return {
        success: false,
        error: validationError
      }
    }

    // Build file path: {user_id}/products/{product_id}/{timestamp}_{index}.{ext}
    // Sesuai dengan struktur lapak-images di SUPPORTING domain
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const timestamp = Date.now()
    const fileName = `${timestamp}_${index}.${fileExt}`
    const filePath = `${userId}/products/${productId}/${fileName}`

    console.log(`📁 Uploading to bucket "${PRODUCT_IMAGE_BUCKET}":`, filePath)

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(PRODUCT_IMAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('❌ Upload error:', uploadError)
      
      // User-friendly error messages
      if (uploadError.message.includes('Bucket not found')) {
        return {
          success: false,
          error: `Storage bucket "${PRODUCT_IMAGE_BUCKET}" tidak ditemukan. Hubungi administrator.`
        }
      }
      
      if (uploadError.message.includes('already exists')) {
        return {
          success: false,
          error: 'File dengan nama sama sudah ada. Coba lagi.'
        }
      }

      return {
        success: false,
        error: `Gagal upload: ${uploadError.message}`
      }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(PRODUCT_IMAGE_BUCKET)
      .getPublicUrl(filePath)

    console.log('✅ Upload success:', urlData.publicUrl)

    return {
      success: true,
      path: filePath,
      publicUrl: urlData.publicUrl
    }
  } catch (error: any) {
    console.error('❌ Unexpected error during upload:', error)
    return {
      success: false,
      error: error.message || 'Terjadi kesalahan saat upload gambar'
    }
  }
}

/**
 * Delete product image from Supabase Storage
 * 
 * @param supabase - Supabase client instance
 * @param filePath - File path to delete (from upload result)
 * @returns Success status
 */
export async function deleteProductImage(
  supabase: SupabaseClient,
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(PRODUCT_IMAGE_BUCKET)
      .remove([filePath])

    if (error) {
      console.error('❌ Delete error:', error)
      return {
        success: false,
        error: error.message
      }
    }

    console.log('✅ Image deleted:', filePath)
    return { success: true }
  } catch (error: any) {
    console.error('❌ Unexpected error during delete:', error)
    return {
      success: false,
      error: error.message || 'Gagal menghapus gambar'
    }
  }
}

/**
 * Get bucket configuration info (for debugging)
 */
export function getBucketInfo() {
  return {
    bucketName: PRODUCT_IMAGE_BUCKET,
    maxFileSize: MAX_FILE_SIZE,
    maxFileSizeMB: MAX_FILE_SIZE / 1024 / 1024,
    allowedTypes: ALLOWED_MIME_TYPES,
    pathStructure: '{user_id}/{product_id}/{timestamp}_{index}.{ext}'
  }
}
