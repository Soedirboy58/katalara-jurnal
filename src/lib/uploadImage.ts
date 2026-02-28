import { createClient } from '@/lib/supabase/client';

const DEFAULT_BUCKET = 'lapak-images';

const getBucketCandidates = (folder: 'products' | 'logos' | 'qris') => {
  const envLogo = process.env.NEXT_PUBLIC_LAPAK_LOGO_BUCKET;
  const envQris = process.env.NEXT_PUBLIC_LAPAK_QRIS_BUCKET;
  const envProducts = process.env.NEXT_PUBLIC_LAPAK_PRODUCTS_BUCKET;

  const unique = (items: Array<string | undefined>) => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const item of items) {
      const value = String(item || '').trim();
      if (!value || seen.has(value)) continue;
      seen.add(value);
      result.push(value);
    }
    return result;
  }

  if (folder === 'logos') {
    return unique([envLogo, 'Logo Bisnis', DEFAULT_BUCKET]);
  }

  if (folder === 'qris') {
    return unique([envQris, 'QRIS DB', DEFAULT_BUCKET]);
  }

  return unique([envProducts, 'products', DEFAULT_BUCKET]);
};

const isBucketNotFound = (message?: string) => {
  const m = (message || '').toLowerCase();
  return (m.includes('bucket') && (m.includes('not found') || m.includes('does not exist')))
    || m.includes('bucket not found');
};

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload image file to Supabase Storage
 * Automatically handles compression and resizing for mobile photos
 */
export async function uploadImage(
  file: File,
  folder: 'products' | 'logos' | 'qris',
  userId: string
): Promise<UploadResult> {
  try {
    console.log('🔧 uploadImage called:', { fileName: file.name, fileSize: file.size, folder, userId });
    const supabase = createClient();

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('❌ Invalid file type:', file.type);
      return { success: false, error: 'File harus berupa gambar (JPG, PNG, WebP)' };
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      console.error('❌ File too large:', file.size);
      return { success: false, error: 'Ukuran file maksimal 5MB' };
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const fileName = `${userId}/${folder}/${timestamp}_${random}.${fileExt}`;
    console.log('📁 Generated fileName:', fileName);

    // Upload to Supabase Storage
    const bucketCandidates = getBucketCandidates(folder);
    let lastError: string | undefined;

    for (const bucketName of bucketCandidates) {
      console.log('☁️ Uploading to bucket:', bucketName);
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        if (isBucketNotFound(error.message)) {
          console.warn('⚠️ Bucket tidak ditemukan, coba bucket berikutnya:', bucketName);
        } else {
          console.error('❌ Supabase upload error:', error);
        }
        lastError = error.message;

        const message = (error.message || '').toLowerCase();
        if (message.includes('row-level security')) {
          return { success: false, error: 'Akses ditolak. Pastikan Anda sudah login dan bucket sudah dikonfigurasi.' };
        }

        if (isBucketNotFound(error.message)) {
          continue;
        }

        if (message.includes('duplicate')) {
          return { success: false, error: 'File dengan nama sama sudah ada. Coba lagi.' };
        }

        return { success: false, error: `Gagal upload: ${error.message}` };
      }

      console.log('✅ Upload success:', data);

      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);

      console.log('🔗 Public URL:', urlData.publicUrl);

      return {
        success: true,
        url: urlData.publicUrl,
      };
    }

    return {
      success: false,
      error: `Bucket storage belum dibuat. Pastikan bucket tersedia (${bucketCandidates.join(', ')}).${lastError ? ` (${lastError})` : ''}`,
    };
  } catch (error: any) {
    console.error('💥 Upload exception:', error);
    const errorMsg = error?.message || error?.toString() || 'Unknown error';
    return { success: false, error: `Error: ${errorMsg}` };
  }
}

/**
 * Delete image from Supabase Storage
 */
export async function deleteImage(imageUrl: string): Promise<boolean> {
  try {
    const supabase = createClient();

    // Extract path from URL
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/);
    
    if (!pathMatch) {
      console.error('Invalid image URL format');
      return false;
    }

    const bucketName = decodeURIComponent(pathMatch[1]);
    const filePath = pathMatch[2];

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete exception:', error);
    return false;
  }
}

/**
 * Compress image before upload (for mobile photos)
 */
export async function compressImage(file: File, maxWidth: number = 1024): Promise<File> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.8
        );
      };
    };
  });
}
