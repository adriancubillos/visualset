'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { logger } from '@/utils/logger';

interface ImageUploadProps {
  label: string;
  currentImageUrl?: string | null;
  onImageUploaded: (url: string) => void;
  onImageRemoved?: () => void;
  entityType?: 'project' | 'item'; // Type of entity (project or item)
  entityName?: string; // Name of the entity for filename
  projectName?: string; // Project name for folder organization
  onLoadingChange?: (isLoading: boolean) => void; // Callback when upload/delete state changes
}

export default function ImageUpload({
  label,
  currentImageUrl,
  onImageUploaded,
  onImageRemoved,
  entityType,
  entityName,
  projectName,
  onLoadingChange,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notify parent when loading state changes
  const updateLoadingState = (isUploading: boolean, isDeleting: boolean) => {
    const isLoading = isUploading || isDeleting;
    if (onLoadingChange) {
      onLoadingChange(isLoading);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    updateLoadingState(true, deleting);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Vercel Blob
      const params = new URLSearchParams({
        filename: file.name,
      });
      
      // Add entity information if provided
      if (entityType) params.append('entityType', entityType);
      if (entityName) params.append('entityName', entityName);
      if (projectName) params.append('projectName', projectName);
      
      const response = await fetch(
        `/api/upload?${params.toString()}`,
        {
          method: 'POST',
          body: file,
        }
      );

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const blob = await response.json();
      onImageUploaded(blob.url);
      toast.success('Image uploaded successfully');
    } catch (error) {
      logger.error('Error uploading image', error);
      toast.error('Failed to upload image');
      setPreviewUrl(currentImageUrl || null);
    } finally {
      setUploading(false);
      updateLoadingState(false, deleting);
    }
  };

  const handleRemove = async () => {
    setDeleting(true);
    updateLoadingState(uploading, true);
    
    // If there's a current image URL (from server), delete it from Vercel Blob
    if (currentImageUrl) {
      try {
        const response = await fetch(
          `/api/upload/delete?url=${encodeURIComponent(currentImageUrl)}`,
          {
            method: 'DELETE',
          }
        );

        if (!response.ok) {
          logger.apiError('Delete image', `/api/upload/delete`, 'Failed to delete from storage');
          toast.error('Failed to delete image from storage');
        } else {
          toast.success('Image removed from storage');
        }
      } catch (error) {
        logger.error('Error deleting image', error);
        toast.error('Error deleting image');
      }
    }

    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onImageRemoved) {
      onImageRemoved();
    }
    
    setDeleting(false);
    updateLoadingState(uploading, false);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      {previewUrl ? (
        <div className="relative inline-block">
          <div className="relative w-48 h-48 border-2 border-gray-300 rounded-lg overflow-hidden">
            <Image
              src={previewUrl}
              alt="Preview"
              fill
              className="object-cover"
            />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={deleting || uploading}
            className={`absolute -top-2 -right-2 rounded-full p-1 transition-colors ${
              deleting || uploading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
            title={deleting ? 'Deleting...' : 'Remove image'}>
            {deleting ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
          <label className="cursor-pointer flex flex-col items-center">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="mt-2 text-sm text-gray-500">Click to upload</span>
            <span className="mt-1 text-xs text-gray-400">PNG, JPG up to 5MB</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
      )}

      {uploading && (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Uploading...
        </div>
      )}
    </div>
  );
}
