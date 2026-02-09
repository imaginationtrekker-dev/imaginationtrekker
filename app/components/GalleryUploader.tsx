'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

interface GalleryUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
}

export function GalleryUploader({ images, onImagesChange }: GalleryUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    try {
      setUploading(true);

      const newImages: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!file.type.startsWith('image/')) {
          continue;
        }

        if (file.size > 10 * 1024 * 1024) {
          continue;
        }

        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        const uploadResponse = await fetch('/api/upload-cloudinary', {
          method: 'POST',
          body: uploadFormData,
        });

        if (uploadResponse.ok) {
          const { url } = await uploadResponse.json();
          if (url) {
            newImages.push(url);
          }
        }
      }

      onImagesChange([...images, ...newImages]);
    } catch (err: any) {
      console.error('Error uploading images:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageUrl: string, index: number) => {
    try {
      // Extract public_id from Cloudinary URL
      // Cloudinary URLs format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}.{ext}
      const urlMatch = imageUrl.match(/\/upload\/[^/]+\/(.+)$/);
      if (urlMatch) {
        const publicIdWithExt = urlMatch[1];
        const publicId = publicIdWithExt.split('.')[0]; // Remove extension

        // Delete from Cloudinary
        const deleteResponse = await fetch('/api/delete-cloudinary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicId }),
        });

        if (!deleteResponse.ok) {
          console.error('Failed to delete from Cloudinary');
        }
      }

      // Remove from local array
      onImagesChange(images.filter((_, i) => i !== index));
    } catch (err: any) {
      console.error('Error deleting image:', err);
      // Still remove from local array even if Cloudinary delete fails
      onImagesChange(images.filter((_, i) => i !== index));
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  return (
    <div>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        style={{
          border: dragActive ? '2px dashed #0d5a6f' : '2px dashed #d1d5db',
          borderRadius: '8px',
          padding: '24px',
          textAlign: 'center',
          background: dragActive ? '#f0f9ff' : '#f9fafb',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          style={{ display: 'none' }}
        />
        {uploading ? (
          <div>Uploading...</div>
        ) : (
          <div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
              Click or drag images here to upload
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>Max 10MB per image</div>
          </div>
        )}
      </div>

      {images.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px', marginTop: '16px' }}>
          {images.map((imageUrl, index) => (
            <div
              key={index}
              style={{
                position: 'relative',
                aspectRatio: '1',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid #e5e7eb',
              }}
            >
              <Image
                src={imageUrl}
                alt={`Gallery image ${index + 1}`}
                fill
                style={{ objectFit: 'cover' }}
                sizes="150px"
              />
              <button
                type="button"
                onClick={() => handleDelete(imageUrl, index)}
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  background: 'rgba(220, 38, 38, 0.9)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: 'bold',
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
