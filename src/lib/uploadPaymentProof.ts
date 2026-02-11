import { createClient } from '@/lib/supabase/client';

const DEFAULT_BUCKET = 'lapak-payments';

const getBucketCandidates = () => {
  const envBucket = process.env.NEXT_PUBLIC_LAPAK_PAYMENT_PROOF_BUCKET;
  return [envBucket, DEFAULT_BUCKET, 'lapak-images'].filter(Boolean) as string[];
};

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export async function uploadPaymentProof(
  file: File,
  storefrontSlug: string,
  orderCode: string
): Promise<UploadResult> {
  try {
    const supabase = createClient();

    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'File harus berupa gambar (JPG, PNG, WebP)' };
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return { success: false, error: 'Ukuran file maksimal 5MB' };
    }

    const fileExt = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const safeSlug = storefrontSlug || 'storefront';
    const safeOrder = orderCode || 'order';
    const fileName = `payment-proofs/${safeSlug}/${safeOrder}_${timestamp}_${random}.${fileExt}`;

    const bucketCandidates = getBucketCandidates();
    let lastError: string | undefined;

    for (const bucketName of bucketCandidates) {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (error) {
        lastError = error.message;
        const message = (error.message || '').toLowerCase();
        if (message.includes('row-level security')) {
          return { success: false, error: 'Akses ditolak. Bucket belum dikonfigurasi untuk upload publik.' };
        }
        continue;
      }

      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);

      return { success: true, url: urlData.publicUrl };
    }

    return {
      success: false,
      error: `Bucket storage belum tersedia (${bucketCandidates.join(', ')}).${lastError ? ` (${lastError})` : ''}`,
    };
  } catch (error: any) {
    const errorMsg = error?.message || error?.toString() || 'Unknown error';
    return { success: false, error: `Error: ${errorMsg}` };
  }
}
