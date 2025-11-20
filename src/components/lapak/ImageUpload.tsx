'use client';

import React, { useState, useRef } from 'react';
import { uploadImage, deleteImage, compressImage } from '@/lib/uploadImage';

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageUploaded: (url: string) => void;
  folder: 'products' | 'logos' | 'qris';
  userId: string;
  label: string;
  aspectRatio?: 'square' | 'wide' | 'auto';
  maxSizeMB?: number;
}

export default function ImageUpload({
  currentImageUrl,
  onImageUploaded,
  folder,
  userId,
  label,
  aspectRatio = 'auto',
  maxSizeMB = 5,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(currentImageUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('❌ File harus berupa gambar (JPG, PNG, dll)');
      return;
    }

    // Validate file size
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      alert(`❌ Ukuran file maksimal ${maxSizeMB}MB`);
      return;
    }

    setUploading(true);

    try {
      // Compress image for mobile photos
      const compressedFile = await compressImage(file, 1024);
      
      // Show preview immediately
      const previewUrl = URL.createObjectURL(compressedFile);
      setPreview(previewUrl);

      // Upload to Supabase
      const result = await uploadImage(compressedFile, folder, userId);

      if (result.success && result.url) {
        onImageUploaded(result.url);
        setPreview(result.url);
        alert('✅ Foto berhasil diupload!');
      } else {
        alert(`❌ ${result.error || 'Gagal upload foto'}`);
        setPreview(currentImageUrl);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('❌ Terjadi kesalahan saat upload');
      setPreview(currentImageUrl);
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
      alert('✅ Foto berhasil dihapus');
    } catch (error) {
      console.error('Delete error:', error);
      alert('❌ Gagal menghapus foto');
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
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all flex flex-col items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600">Uploading...</span>
            </>
          ) : (
            <>
              <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">Ambil/Upload Foto</p>
                <p className="text-xs text-gray-500 mt-1">
                  Klik untuk foto dari kamera atau pilih dari galeri
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Max {maxSizeMB}MB • JPG, PNG, WebP
                </p>
              </div>
            </>
          )}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <p className="text-xs text-gray-500 mt-2">
        💡 Foto akan otomatis dikompres untuk menghemat storage
      </p>
    </div>
  );
}
