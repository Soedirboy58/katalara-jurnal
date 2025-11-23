'use client';

import React, { useState, useRef } from 'react';
import { uploadImage, deleteImage, compressImage } from '@/lib/uploadImage';
import { showToast } from '@/components/ui/Toast';
import dynamic from 'next/dynamic';

const ImageCropper = dynamic(() => import('@/components/ui/ImageCropper'), { ssr: false });

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageUploaded: (url: string) => void;
  folder: 'products' | 'logos' | 'qris';
  userId: string;
  label: string;
  aspectRatio?: 'square' | 'wide' | 'auto';
  maxSizeMB?: number;
  enableCrop?: boolean;
}

export default function ImageUpload({
  currentImageUrl,
  onImageUploaded,
  folder,
  userId,
  label,
  aspectRatio = 'auto',
  maxSizeMB = 5,
  enableCrop = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(currentImageUrl);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('File harus berupa gambar (JPG, PNG, dll)', 'error');
      return;
    }

    // Validate file size
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      showToast(`Ukuran file maksimal ${maxSizeMB}MB`, 'error');
      return;
    }

    // If crop enabled, show cropper first
    if (enableCrop && (folder === 'logos' || folder === 'products')) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
      return;
    }

    // Otherwise, upload directly
    await uploadImageFile(file);
  };

  const uploadImageFile = async (file: File | Blob) => {
    setUploading(true);

    try {
      // Convert Blob to File if needed
      const fileToUpload = file instanceof File ? file : new File([file], 'image.jpg', { type: 'image/jpeg' });
      
      // Compress image for mobile photos
      console.log('🖼️ Compressing image...', { fileSize: fileToUpload.size });
      const compressedFile = await compressImage(fileToUpload, 1024);
      console.log('✅ Image compressed:', { newSize: compressedFile.size });
      
      // Show preview immediately
      const previewUrl = URL.createObjectURL(compressedFile);
      setPreview(previewUrl);

      // Upload to Supabase
      console.log('☁️ Uploading to Supabase...', { folder, userId });
      const result = await uploadImage(compressedFile, folder, userId);
      console.log('📤 Upload result:', result);

      if (result.success && result.url) {
        onImageUploaded(result.url);
        setPreview(result.url);
        showToast('Foto berhasil diupload!', 'success');
      } else {
        console.error('❌ Upload failed:', result.error);
        showToast(result.error || 'Gagal upload foto', 'error');
        setPreview(currentImageUrl);
      }
    } catch (error: any) {
      console.error('💥 Upload error:', error);
      const errorMsg = error?.message || error?.toString() || 'Error tidak diketahui';
      showToast(errorMsg, 'error');
      setPreview(currentImageUrl);
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setShowCropper(false);
    setSelectedImage(null);
    await uploadImageFile(croppedBlob);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = async () => {
    if (!preview) return;

    if (!confirm('Hapus foto ini?')) return;

    setUploading(true);

    try {
      // Delete from Supabase if it's a storage URL
      if (preview.includes('supabase')) {
        await deleteImage(preview);
      }

      setPreview(undefined);
      onImageUploaded('');
      showToast('Foto berhasil dihapus', 'success');
    } catch (error) {
      console.error('Delete error:', error);
      showToast('Gagal menghapus foto', 'error');
    } finally {
      setUploading(false);
    }
  };

  const getAspectClass = () => {
    switch (aspectRatio) {
      case 'square':
        return 'aspect-square';
      case 'wide':
        return 'aspect-video';
      default:
        return 'aspect-auto';
    }
  };

  return (
    <div>
      <label className="block font-medium text-gray-900 mb-2">{label}</label>
      
      {preview ? (
        <div className="relative group">
          <div className={`w-full ${getAspectClass()} bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200`}>
            <img
              src={preview}
              alt={label}
              className="w-full h-full object-cover"
            />
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}
          </div>
          
          {!uploading && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                📷 Ganti Foto
              </button>
              <button
                onClick={handleRemoveImage}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
              >
                🗑️ Hapus
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {uploading ? (
            <div className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600 font-medium">Uploading...</span>
              <span className="text-xs text-gray-500">Mohon tunggu...</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                {/* Camera Button */}
                <button
                  type="button"
                  onClick={() => {
                    // Set capture mode before click
                    if (fileInputRef.current) {
                      fileInputRef.current.setAttribute('capture', 'environment');
                      fileInputRef.current.click();
                    }
                  }}
                  className="h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all flex flex-col items-center justify-center gap-2"
                >
                  <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm font-semibold text-gray-700">📷 Ambil Foto</span>
                  <span className="text-xs text-gray-500">Dari Kamera</span>
                </button>

                {/* Gallery Button */}
                <button
                  type="button"
                  onClick={() => {
                    // Remove capture mode for gallery
                    if (fileInputRef.current) {
                      fileInputRef.current.removeAttribute('capture');
                      fileInputRef.current.click();
                    }
                  }}
                  className="h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all flex flex-col items-center justify-center gap-2"
                >
                  <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-semibold text-gray-700">🖼️ Pilih Foto</span>
                  <span className="text-xs text-gray-500">Dari Galeri</span>
                </button>
              </div>
              <p className="text-xs text-gray-400 text-center">
                Max {maxSizeMB}MB • JPG, PNG, WebP
              </p>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <p className="text-xs text-gray-500 mt-2">
        💡 Foto akan otomatis dikompres untuk menghemat storage
        {enableCrop && ' • Anda bisa crop gambar sebelum upload'}
      </p>

      {/* Image Cropper Modal */}
      {showCropper && selectedImage && (
        <ImageCropper
          imageSrc={selectedImage}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={folder === 'logos' ? 1 : folder === 'products' ? 1 : 16 / 9}
          circularCrop={folder === 'logos'}
        />
      )}
    </div>
  );
}
