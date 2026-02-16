'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import Image from 'next/image';

interface Recognition {
  id: string;
  image_url: string;
  cloudinary_public_id: string | null;
  title: string;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
}

export default function RecognitionsPage() {
  const supabase = createClient();
  const [items, setItems] = useState<Recognition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Recognition | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    image_url: '',
    cloudinary_public_id: '',
    title: '',
    link_url: '',
    sort_order: 0,
    is_active: true,
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('You must be logged in.');
      }

      const { data, error } = await supabase
        .from('recognitions')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load recognitions');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true);
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const res = await fetch('/api/upload-cloudinary', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!res.ok) throw new Error('Failed to upload image');

      const { url, publicId } = await res.json();
      setFormData(prev => ({ ...prev, image_url: url, cloudinary_public_id: publicId || '' }));
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
        setError('Please upload an image.');
        return;
      }
      if (!formData.title.trim()) {
        setError('Please enter a title.');
        return;
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) throw new Error('You must be logged in.');

      const payload = {
        image_url: formData.image_url,
        cloudinary_public_id: formData.cloudinary_public_id || null,
        title: formData.title.trim(),
        link_url: formData.link_url.trim() || null,
        sort_order: formData.sort_order,
        is_active: formData.is_active,
      };

      if (editingItem) {
        const { error } = await supabase.from('recognitions').update(payload).eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('recognitions').insert([payload]);
        if (error) throw error;
      }

      handleCloseModal();
      await loadItems();
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    }
  };

  const handleEdit = (item: Recognition) => {
    setEditingItem(item);
    setFormData({
      image_url: item.image_url,
      cloudinary_public_id: item.cloudinary_public_id || '',
      title: item.title,
      link_url: item.link_url || '',
      sort_order: item.sort_order,
      is_active: item.is_active,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, cloudinaryPublicId: string | null) => {
    if (!confirm('Are you sure you want to delete this recognition?')) return;
    try {
      setError(null);

      if (cloudinaryPublicId) {
        try {
          await fetch('/api/delete-cloudinary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicId: cloudinaryPublicId }),
          });
        } catch {
          // Continue even if Cloudinary delete fails
        }
      }

      const { error } = await supabase.from('recognitions').delete().eq('id', id);
      if (error) throw error;
      await loadItems();
    } catch (err: any) {
      setError(err.message || 'Failed to delete');
    }
  };

  const resetForm = () => {
    setFormData({ image_url: '', cloudinary_public_id: '', title: '', link_url: '', sort_order: 0, is_active: true });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    resetForm();
  };

  return (
    <div className='dashboard_page'>
      <div className='heading_block'>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3>Recognitions</h3>
            <p>Manage recognition logos displayed on the home page.</p>
          </div>
          <button
            className='btn btn_primary'
            onClick={() => setIsModalOpen(true)}
            style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
          >
            + Add Recognition
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '16px', margin: '16px 24px', background: '#fee', color: '#c00', borderRadius: '6px', fontWeight: 500, border: '1px solid #fcc' }}>
          <strong>Error:</strong> {error}
          <button onClick={loadItems} style={{ marginLeft: '12px', padding: '4px 12px', background: '#fff', border: '1px solid #c00', borderRadius: '4px', cursor: 'pointer', color: '#c00', fontSize: '12px' }}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Loading...</div>
      ) : items.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
          No recognitions found. Click &quot;Add Recognition&quot; to create one.
        </div>
      ) : (
        <div style={{ padding: '0 24px 24px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#374151' }}>Image</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#374151' }}>Title</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#374151' }}>Link</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#374151' }}>Order</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#374151' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#374151' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ width: '80px', height: '50px', position: 'relative', borderRadius: '4px', overflow: 'hidden', background: '#f3f4f6' }}>
                        <Image src={item.image_url} alt={item.title} fill style={{ objectFit: 'contain' }} sizes="80px" />
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#1f2937', fontWeight: 500 }}>{item.title}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.link_url ? (
                        <a href={item.link_url} target='_blank' rel='noopener noreferrer' style={{ color: '#0d5a6f' }}>{item.link_url}</a>
                      ) : '-'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#1f2937' }}>{item.sort_order}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
                        background: item.is_active ? '#d1fae5' : '#fee2e2',
                        color: item.is_active ? '#065f46' : '#991b1b',
                      }}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleEdit(item)} style={{ padding: '6px 12px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: '#374151', fontWeight: 500 }}>
                          Edit
                        </button>
                        <button onClick={() => handleDelete(item.id, item.cloudinary_public_id)} style={{ padding: '6px 12px', background: '#fee', border: '1px solid #fcc', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: '#dc2626', fontWeight: 500 }}>
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '8px', padding: '24px', width: '90%', maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#1f2937', margin: 0 }}>
                {editingItem ? 'Edit Recognition' : 'Add Recognition'}
              </h3>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Image Upload */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>Image *</label>
                <input
                  type='file'
                  accept='image/*'
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }}
                  style={{ display: 'none' }}
                  id='recognition-image-upload'
                  disabled={uploadingImage}
                />
                <label
                  htmlFor='recognition-image-upload'
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
                    background: uploadingImage ? '#f3f4f6' : '#0d5a6f',
                    color: uploadingImage ? '#6b7280' : '#fff',
                    border: 'none', borderRadius: '6px', cursor: uploadingImage ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 500,
                  }}
                >
                  {uploadingImage ? 'Uploading...' : 'Upload Image'}
                </label>
                {formData.image_url && (
                  <div style={{ marginTop: '12px', position: 'relative', width: '160px', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '2px solid #e5e7eb', background: '#f3f4f6' }}>
                    <Image src={formData.image_url} alt='Preview' fill style={{ objectFit: 'contain' }} sizes='160px' />
                    <button
                      type='button'
                      onClick={() => setFormData({ ...formData, image_url: '', cloudinary_public_id: '' })}
                      style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(220,38,38,0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >×</button>
                  </div>
                )}
              </div>

              {/* Title */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>Title *</label>
                <input
                  type='text'
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder='e.g. Startup India, ATOAI, Business Standard'
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', color: '#1f2937', boxSizing: 'border-box' }}
                />
              </div>

              {/* Link URL */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>Link URL (optional)</label>
                <input
                  type='url'
                  value={formData.link_url}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  placeholder='https://example.com'
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', color: '#1f2937', boxSizing: 'border-box' }}
                />
              </div>

              {/* Sort Order */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>Sort Order</label>
                <input
                  type='number'
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', color: '#1f2937', boxSizing: 'border-box' }}
                />
                <p style={{ marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>Lower numbers appear first</p>
              </div>

              {/* Active */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, color: '#374151', cursor: 'pointer' }}>
                  <input type='checkbox' checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                  Active (visible on home page)
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type='button' onClick={handleCloseModal} style={{ padding: '10px 20px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                  Cancel
                </button>
                <button type='submit' className='btn btn_primary' style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
