'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Upload, X, Trash2, Edit2, Loader2 } from 'lucide-react';

interface GalleryImage {
  id: string;
  image_url: string;
  cloudinary_public_id: string;
  display_order: number;
}

interface ImageGalleryProps {
  sectionType: 'appreciation_letter' | 'recognition_association_letter';
  sectionTitle: string;
}

export function ImageGallery({ sectionType, sectionTitle }: ImageGalleryProps) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    loadImages();
  }, [sectionType]);

  const loadImages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/about-page-gallery?section_type=${sectionType}`);
      
      if (!response.ok) {
        throw new Error('Failed to load images');
      }

      const data = await response.json();
      setImages(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load images');
      console.error('Error loading images:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/upload-cloudinary', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const { url, publicId } = await uploadResponse.json();

      // Save to database
      const saveResponse = await fetch('/api/about-page-gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_type: sectionType,
          image_url: url,
          cloudinary_public_id: publicId,
        }),
      });

      if (!saveResponse.ok) {
        // If DB save fails, delete from Cloudinary
        await fetch('/api/delete-cloudinary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicId }),
        });
        throw new Error('Failed to save image');
      }

      await loadImages();
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
      console.error('Error uploading image:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (id: string, cloudinaryPublicId: string) => {
    if (!confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(id);
      setError(null);

      // Delete from database
      const deleteResponse = await fetch(`/api/about-page-gallery?id=${id}`, {
        method: 'DELETE',
      });

      if (!deleteResponse.ok) {
        throw new Error('Failed to delete image');
      }

      // Delete from Cloudinary
      try {
        await fetch('/api/delete-cloudinary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicId: cloudinaryPublicId }),
        });
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError);
        // Continue even if Cloudinary deletion fails
      }

      await loadImages();
    } catch (err: any) {
      setError(err.message || 'Failed to delete image');
      console.error('Error deleting image:', err);
    } finally {
      setDeleting(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  if (loading) {
    return (
      <div className="dashboard_section">
        <div className="heading_block">
          <h2 style={{ color: '#1f2937', fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
            {sectionTitle} Gallery
          </h2>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
          Loading images...
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard_section">
      <div className="heading_block">
        <h2 style={{ color: '#1f2937', fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
          {sectionTitle} Gallery
        </h2>
      </div>

      {error && (
        <div style={{
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '0.5rem',
          color: '#991b1b',
          fontSize: '0.875rem',
        }}>
          {error}
        </div>
      )}

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{
          border: '2px dashed #d1d5db',
          borderRadius: '0.5rem',
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: '#f9fafb',
          marginBottom: '1.5rem',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onClick={() => fileInputRef.current?.click()}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#3b82f6';
          e.currentTarget.style.backgroundColor = '#eff6ff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#d1d5db';
          e.currentTarget.style.backgroundColor = '#f9fafb';
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={uploading}
        />
        {uploading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <Loader2 style={{ width: '2rem', height: '2rem', color: '#3b82f6', animation: 'spin 1s linear infinite' }} />
            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Uploading...</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <Upload style={{ width: '2rem', height: '2rem', color: '#6b7280' }} />
            <span style={{ color: '#374151', fontSize: '0.875rem', fontWeight: '500' }}>
              Click to upload or drag and drop
            </span>
            <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
              PNG, JPG, GIF up to 10MB
            </span>
          </div>
        )}
      </div>

      {/* Images Grid */}
      {images.length === 0 ? (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          color: '#9ca3af',
          fontSize: '0.875rem',
          backgroundColor: '#f9fafb',
          borderRadius: '0.5rem',
        }}>
          No images uploaded yet. Upload images to get started.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '1rem',
        }}>
          {images.map((image) => (
            <div
              key={image.id}
              style={{
                position: 'relative',
                backgroundColor: '#fff',
                borderRadius: '0.5rem',
                overflow: 'hidden',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  paddingBottom: '75%', // 4:3 aspect ratio
                  backgroundColor: '#f3f4f6',
                  cursor: 'pointer',
                }}
                onClick={() => setPreviewImage(image.image_url)}
              >
                <Image
                  src={image.image_url}
                  alt={`Gallery image ${image.display_order}`}
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              <div style={{
                position: 'absolute',
                top: '0.5rem',
                right: '0.5rem',
                display: 'flex',
                gap: '0.5rem',
              }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(image.id, image.cloudinary_public_id);
                  }}
                  disabled={deleting === image.id}
                  style={{
                    padding: '0.375rem',
                    backgroundColor: 'rgba(239, 68, 68, 0.9)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: deleting === image.id ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (deleting !== image.id) {
                      e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.9)';
                  }}
                >
                  {deleting === image.id ? (
                    <Loader2 style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <Trash2 style={{ width: '1rem', height: '1rem' }} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewImage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
          }}
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              padding: '0.5rem',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X style={{ width: '1.5rem', height: '1.5rem' }} />
          </button>
          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              width: 'auto',
              height: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={previewImage}
              alt="Preview"
              width={1200}
              height={800}
              style={{
                maxWidth: '100%',
                maxHeight: '90vh',
                objectFit: 'contain',
                borderRadius: '0.5rem',
              }}
            />
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
