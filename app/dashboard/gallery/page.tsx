'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase-browser';
import Image from 'next/image';

interface GalleryImage {
  id: string;
  image_url: string;
  image_path?: string; // Optional, used to store Cloudinary public_id
  title?: string;
  alt_text?: string;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export default function GalleryPage() {
  const supabase = createClient();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    alt_text: '',
  });

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
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

    try {
      setUploading(true);
      setError(null);

      const file = files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file.');
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Image size must be less than 10MB.');
      }

      // Upload to Cloudinary via API route (no auth needed for upload)
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const uploadResponse = await fetch('/api/upload-cloudinary', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Failed to upload image to Cloudinary');
      }

      const { url: cloudinaryUrl, publicId } = await uploadResponse.json();

      if (!cloudinaryUrl) {
        throw new Error('Failed to get image URL from Cloudinary');
      }

      // Verify user again right before database insert
      const { data: { user: verifyUser }, error: verifyError } = await supabase.auth.getUser();
      if (verifyError || !verifyUser) {
        // If session expired, delete uploaded image from Cloudinary
        if (publicId) {
          await fetch('/api/delete-cloudinary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicId }),
          });
        }
        throw new Error('Session expired. Please refresh the page and try again.');
      }

      // Save to database
      console.log('Inserting into database with data:', {
        image_url: cloudinaryUrl,
        image_path: publicId, // Store Cloudinary public_id for deletion
        title: formData.title || null,
        alt_text: formData.alt_text || file.name,
        display_order: images.length,
      });

      const { data: dbData, error: dbError } = await supabase
        .from('gallery')
        .insert([
          {
            image_url: cloudinaryUrl,
            image_path: publicId, // Store Cloudinary public_id
            title: formData.title || null,
            alt_text: formData.alt_text || file.name,
            display_order: images.length,
          },
        ])
        .select()
        .single();

      if (dbError) {
        console.error('Database insert error:', dbError);
        // If DB insert fails, delete the uploaded file from Cloudinary
        if (publicId) {
          await fetch('/api/delete-cloudinary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicId }),
          });
        }
        throw new Error(dbError.message || 'Failed to save image to database. Please check your permissions.');
      }

      setPreviewImage(null);
      setFormData({ title: '', alt_text: '' });
      await loadImages();
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
      console.error('Error uploading image:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleReplaceImage = async (imageId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      setError(null);

      const image = images.find((img) => img.id === imageId);
      if (!image) throw new Error('Image not found');

      const file = files[0];
      
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file.');
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Image size must be less than 10MB.');
      }

      // Delete old image from Cloudinary if public_id exists
      if (image.image_path) {
        await fetch('/api/delete-cloudinary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicId: image.image_path }),
        });
      }

      // Upload new image to Cloudinary
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const uploadResponse = await fetch('/api/upload-cloudinary', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Failed to upload image to Cloudinary');
      }

      const { url: cloudinaryUrl, publicId } = await uploadResponse.json();

      if (!cloudinaryUrl) {
        throw new Error('Failed to get image URL from Cloudinary');
      }

      // Update database
      const { error: updateError } = await supabase
        .from('gallery')
        .update({
          image_url: cloudinaryUrl,
          image_path: publicId, // Store Cloudinary public_id
        })
        .eq('id', imageId);

      if (updateError) {
        // If DB update fails, delete the uploaded file from Cloudinary
        if (publicId) {
          await fetch('/api/delete-cloudinary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicId }),
          });
        }
        throw updateError;
      }

      await loadImages();
      setIsModalOpen(false);
      setEditingImage(null);
    } catch (err: any) {
      setError(err.message || 'Failed to replace image');
      console.error('Error replacing image:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this image? This action cannot be undone.')) return;

    try {
      setError(null);
      const image = images.find((img) => img.id === id);
      if (!image) throw new Error('Image not found');

      // Delete from Cloudinary if public_id exists
      if (image.image_path) {
        const deleteResponse = await fetch('/api/delete-cloudinary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicId: image.image_path }),
        });

        if (!deleteResponse.ok) {
          console.error('Error deleting from Cloudinary');
          // Continue to delete from DB even if Cloudinary delete fails
        }
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('gallery')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      await loadImages();
    } catch (err: any) {
      setError(err.message || 'Failed to delete image');
      console.error('Error deleting image:', err);
    }
  };

  const handleEdit = (image: GalleryImage) => {
    setEditingImage(image);
    setFormData({
      title: image.title || '',
      alt_text: image.alt_text || '',
    });
    setIsModalOpen(true);
  };

  const handleUpdateMetadata = async () => {
    if (!editingImage) return;

    try {
      setError(null);
      const { error } = await supabase
        .from('gallery')
        .update({
          title: formData.title || null,
          alt_text: formData.alt_text || null,
        })
        .eq('id', editingImage.id);

      if (error) throw error;

      setIsModalOpen(false);
      setEditingImage(null);
      setFormData({ title: '', alt_text: '' });
      await loadImages();
    } catch (err: any) {
      setError(err.message || 'Failed to update image');
      console.error('Error updating image:', err);
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
      const file = e.dataTransfer.files[0];
      if (editingImage) {
        handleReplaceImage(editingImage.id, e.dataTransfer.files);
      } else {
        handlePreview(file);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (editingImage) {
        handleReplaceImage(editingImage.id, e.target.files);
      } else {
        handlePreview(file);
      }
    }
  };

  const handlePreview = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className='dashboard_page'>
      <div className='heading_block'>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3>Gallery</h3>
            <p>Manage your image gallery. Upload, edit, and organize images.</p>
          </div>
          <button
            className='btn btn_primary'
            onClick={() => {
              setEditingImage(null);
              setFormData({ title: '', alt_text: '' });
              setPreviewImage(null);
              setIsModalOpen(true);
            }}
            style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
          >
            + Upload Image
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '16px', margin: '16px 24px', background: '#fee', color: '#c00', borderRadius: '6px', fontWeight: 500 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Loading gallery...</div>
      ) : images.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
          No images found. Click "Upload Image" to add your first image.
        </div>
      ) : (
        <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
          {images.map((image) => (
            <div
              key={image.id}
              style={{
                position: 'relative',
                background: '#fff',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div style={{ position: 'relative', width: '100%', paddingTop: '75%', background: '#f3f4f6' }}>
                <Image
                  src={image.image_url}
                  alt={image.alt_text || image.title || 'Gallery image'}
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
                />
              </div>
              <div style={{ padding: '12px' }}>
                {image.title && (
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>
                    {image.title}
                  </h4>
                )}
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button
                    onClick={() => handleEdit(image)}
                    style={{
                      flex: 1,
                      padding: '6px 12px',
                      background: '#f3f4f6',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: '#374151',
                      fontWeight: 500,
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(image.id)}
                    style={{
                      flex: 1,
                      padding: '6px 12px',
                      background: '#fee',
                      border: '1px solid #fcc',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: '#dc2626',
                      fontWeight: 500,
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload/Edit Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '8px',
              padding: '24px',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#1f2937', margin: 0 }}>
                {editingImage ? 'Edit Image' : 'Upload New Image'}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingImage(null);
                  setPreviewImage(null);
                  setSelectedFile(null);
                  setFormData({ title: '', alt_text: '' });
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }}
              >
                ×
              </button>
            </div>

            {editingImage && (
              <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: '400px', margin: '0 auto', paddingTop: '60%', background: '#f3f4f6', borderRadius: '8px', overflow: 'hidden' }}>
                  <Image
                    src={editingImage.image_url}
                    alt={editingImage.alt_text || editingImage.title || 'Current image'}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <p style={{ marginTop: '12px', fontSize: '14px', color: '#6b7280' }}>
                  Replace image by selecting a new file below
                </p>
              </div>
            )}

            {/* Image Upload Area */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragActive ? '#0d5a6f' : '#d1d5db'}`,
                borderRadius: '8px',
                padding: '40px',
                textAlign: 'center',
                background: dragActive ? '#f0f9ff' : '#f9fafb',
                transition: 'all 0.2s',
                marginBottom: '20px',
                cursor: 'pointer',
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type='file'
                accept='image/*'
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    setSelectedFile(file);
                    handlePreview(file);
                  }
                }}
                style={{ display: 'none' }}
              />
              {previewImage ? (
                <div>
                  <div style={{ position: 'relative', width: '100%', maxWidth: '300px', margin: '0 auto', paddingTop: '60%', background: '#f3f4f6', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
                    <Image
                      src={previewImage}
                      alt='Preview'
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                  <p style={{ color: '#6b7280', fontSize: '14px' }}>Click to change image</p>
                </div>
              ) : (
                <div>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    width='48'
                    height='48'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='#9ca3af'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    style={{ margin: '0 auto 16px' }}
                  >
                    <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'></path>
                    <polyline points='17 8 12 3 7 8'></polyline>
                    <line x1='12' x2='12' y1='3' y2='15'></line>
                  </svg>
                  <p style={{ color: '#374151', fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>
                    {dragActive ? 'Drop image here' : 'Click to upload or drag and drop'}
                  </p>
                  <p style={{ color: '#6b7280', fontSize: '14px' }}>
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              )}
            </div>

            {/* Metadata Form */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                Title (optional)
              </label>
              <input
                  type='text'
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', color: '#1f2937', background: '#fff' }}
                  placeholder='Enter image title'
                />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                Alt Text (optional)
              </label>
              <input
                type='text'
                value={formData.alt_text}
                onChange={(e) => setFormData({ ...formData, alt_text: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', color: '#1f2937', background: '#fff' }}
                placeholder='Enter alt text for accessibility'
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type='button'
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingImage(null);
                  setPreviewImage(null);
                  setSelectedFile(null);
                  setFormData({ title: '', alt_text: '' });
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                style={{ padding: '10px 20px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', color: '#374151', fontWeight: 500 }}
              >
                Cancel
              </button>
              {editingImage ? (
                <button
                  type='button'
                  onClick={handleUpdateMetadata}
                  className='btn btn_primary'
                  style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                  disabled={uploading}
                >
                  {uploading ? 'Updating...' : 'Update Metadata'}
                </button>
              ) : (
                <button
                  type='button'
                  onClick={async () => {
                    if (selectedFile) {
                      // Create a FileList-like object
                      const dataTransfer = new DataTransfer();
                      dataTransfer.items.add(selectedFile);
                      await handleFileSelect(dataTransfer.files);
                    } else if (fileInputRef.current?.files?.[0]) {
                      await handleFileSelect(fileInputRef.current.files);
                    }
                  }}
                  className='btn btn_primary'
                  style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                  disabled={uploading || !previewImage}
                >
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
