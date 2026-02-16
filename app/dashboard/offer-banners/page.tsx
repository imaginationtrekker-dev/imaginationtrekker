'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import Image from 'next/image';

interface OfferBanner {
  id: string;
  image_url: string;
  alt_title: string | null;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function OfferBannersPage() {
  const supabase = createClient();
  const [banners, setBanners] = useState<OfferBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<OfferBanner | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    image_url: '',
    alt_title: '',
    link_url: '',
    sort_order: 0,
    is_active: true,
  });

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('You must be logged in to view offer banners.');
      }

      const { data, error } = await supabase
        .from('offer_banners')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setBanners(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load offer banners');
      console.error('Error loading offer banners:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true);
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const uploadResponse = await fetch('/api/upload-cloudinary', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      const { url } = await uploadResponse.json();
      setFormData(prev => ({ ...prev, image_url: url }));
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);

      if (!formData.image_url) {
        setError('Please upload an image before saving.');
        return;
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('You must be logged in to perform this action.');
      }

      if (editingBanner) {
        const { error } = await supabase
          .from('offer_banners')
          .update(formData)
          .eq('id', editingBanner.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('offer_banners')
          .insert([formData]);

        if (error) throw error;
      }

      setIsModalOpen(false);
      setEditingBanner(null);
      resetForm();
      await loadBanners();
    } catch (err: any) {
      setError(err.message || 'Failed to save offer banner');
      console.error('Error saving offer banner:', err);
    }
  };

  const handleEdit = (banner: OfferBanner) => {
    setEditingBanner(banner);
    setFormData({
      image_url: banner.image_url,
      alt_title: banner.alt_title || '',
      link_url: banner.link_url || '',
      sort_order: banner.sort_order,
      is_active: banner.is_active,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this offer banner?')) return;

    try {
      setError(null);
      const { error } = await supabase
        .from('offer_banners')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadBanners();
    } catch (err: any) {
      setError(err.message || 'Failed to delete offer banner');
      console.error('Error deleting offer banner:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      image_url: '',
      alt_title: '',
      link_url: '',
      sort_order: 0,
      is_active: true,
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBanner(null);
    resetForm();
  };

  return (
    <div className='dashboard_page'>
      <div className='heading_block'>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3>Offer Banners</h3>
            <p>Manage promotional banners displayed in marquee on home page.</p>
          </div>
          <button
            className='btn btn_primary'
            onClick={() => setIsModalOpen(true)}
            style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
          >
            + Add Banner
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '16px', margin: '16px 24px', background: '#fee', color: '#c00', borderRadius: '6px', fontWeight: 500, border: '1px solid #fcc' }}>
          <strong>Error:</strong> {error}
          <button 
            onClick={loadBanners}
            style={{ marginLeft: '12px', padding: '4px 12px', background: '#fff', border: '1px solid #c00', borderRadius: '4px', cursor: 'pointer', color: '#c00', fontSize: '12px' }}
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Loading offer banners...</div>
      ) : banners.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
          No offer banners found. Click "Add Banner" to create one.
        </div>
      ) : (
        <div style={{ padding: '0 24px 24px 24px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#374151' }}>Image</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#374151' }}>Alt Title</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#374151' }}>Link</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#374151' }}>Sort Order</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#374151' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#374151' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {banners.map((banner) => (
                  <tr key={banner.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px 16px' }}>
                      {banner.image_url ? (
                        <div style={{ width: '120px', height: '64px', position: 'relative', borderRadius: '4px', overflow: 'hidden', background: '#f3f4f6' }}>
                          <Image
                            src={banner.image_url}
                            alt={banner.alt_title || 'Banner'}
                            fill
                            style={{ objectFit: 'cover' }}
                            sizes="120px"
                          />
                        </div>
                      ) : (
                        <span style={{ fontSize: '14px', color: '#9ca3af' }}>No image</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#1f2937' }}>{banner.alt_title || '-'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {banner.link_url ? (
                        <a href={banner.link_url} target='_blank' rel='noopener noreferrer' style={{ color: '#0d5a6f' }}>{banner.link_url}</a>
                      ) : '-'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#1f2937' }}>{banner.sort_order}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: banner.is_active ? '#d1fae5' : '#fee2e2',
                        color: banner.is_active ? '#065f46' : '#991b1b',
                      }}>
                        {banner.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleEdit(banner)}
                          style={{ padding: '6px 12px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: '#374151', fontWeight: 500 }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(banner.id)}
                          style={{ padding: '6px 12px', background: '#fee', border: '1px solid #fcc', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: '#dc2626', fontWeight: 500 }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
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
                {editingBanner ? 'Edit Offer Banner' : 'Add New Offer Banner'}
              </h3>
              <button
                onClick={handleCloseModal}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                  Image *
                </label>
                <div style={{ marginBottom: '12px' }}>
                  <input
                    type='file'
                    accept='image/*'
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(file);
                      }
                    }}
                    style={{ display: 'none' }}
                    id="offer-banner-image-upload"
                    disabled={uploadingImage}
                  />
                  <label
                    htmlFor="offer-banner-image-upload"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 20px',
                      background: uploadingImage ? '#f3f4f6' : '#0d5a6f',
                      color: uploadingImage ? '#6b7280' : '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: uploadingImage ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: 500,
                      transition: 'background 0.2s',
                    }}
                  >
                    {uploadingImage ? 'Uploading...' : 'Upload Image'}
                  </label>
                </div>
                {formData.image_url && (
                  <div style={{ marginTop: '12px', position: 'relative', width: '100%', maxWidth: '500px', height: '300px', borderRadius: '8px', overflow: 'hidden', border: '2px solid #e5e7eb', background: '#f3f4f6' }}>
                    <Image
                      src={formData.image_url}
                      alt={formData.alt_title || 'Banner preview'}
                      fill
                      style={{ objectFit: 'contain' }}
                      sizes="500px"
                    />
                    <button
                      type='button'
                      onClick={() => setFormData({ ...formData, image_url: '' })}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(220, 38, 38, 0.9)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        cursor: 'pointer',
                        fontSize: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
                {!formData.image_url && (
                  <p style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
                    Please upload an image. The image will be uploaded to Cloudinary and the URL will be saved automatically.
                  </p>
                )}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                  Alt Title / Tag
                </label>
                <input
                  type='text'
                  value={formData.alt_title}
                  onChange={(e) => setFormData({ ...formData, alt_title: e.target.value })}
                  placeholder="Enter alt text or title tag"
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', color: '#1f2937' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                  Link URL (optional)
                </label>
                <input
                  type='url'
                  value={formData.link_url}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  placeholder="https://example.com"
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', color: '#1f2937' }}
                />
                <p style={{ marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>The banner will link to this URL when clicked</p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                  Sort Order
                </label>
                <input
                  type='number'
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', color: '#1f2937' }}
                />
                <p style={{ marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>Lower numbers appear first</p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, color: '#374151', cursor: 'pointer' }}>
                  <input
                    type='checkbox'
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  Active (visible on home page)
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type='button'
                  onClick={handleCloseModal}
                  style={{ padding: '10px 20px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 500, color: '#374151' }}
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='btn btn_primary'
                  style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}
                >
                  {editingBanner ? 'Update Banner' : 'Create Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
