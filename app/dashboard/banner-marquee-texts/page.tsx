'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';

interface BannerMarqueeText {
  id: string;
  text: string;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function BannerMarqueeTextsPage() {
  const supabase = createClient();
  const [texts, setTexts] = useState<BannerMarqueeText[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingText, setEditingText] = useState<BannerMarqueeText | null>(null);
  const [formData, setFormData] = useState({
    text: '',
    link_url: '',
    sort_order: 0,
    is_active: true,
  });

  useEffect(() => {
    loadTexts();
  }, []);

  const loadTexts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('You must be logged in to view banner marquee texts.');
      }

      const { data, error } = await supabase
        .from('banner_marquee_texts')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setTexts(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load banner marquee texts');
      console.error('Error loading banner marquee texts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);

      if (!formData.text.trim()) {
        setError('Please enter text before saving.');
        return;
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('You must be logged in to perform this action.');
      }

      const submitData = {
        ...formData,
        link_url: formData.link_url.trim() || null,
      };

      if (editingText) {
        const { error } = await supabase
          .from('banner_marquee_texts')
          .update(submitData)
          .eq('id', editingText.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('banner_marquee_texts')
          .insert([submitData]);

        if (error) throw error;
      }

      setIsModalOpen(false);
      setEditingText(null);
      resetForm();
      await loadTexts();
    } catch (err: any) {
      setError(err.message || 'Failed to save banner marquee text');
      console.error('Error saving banner marquee text:', err);
    }
  };

  const handleEdit = (text: BannerMarqueeText) => {
    setEditingText(text);
    setFormData({
      text: text.text,
      link_url: text.link_url || '',
      sort_order: text.sort_order,
      is_active: text.is_active,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this text item?')) return;

    try {
      setError(null);
      const { error } = await supabase
        .from('banner_marquee_texts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadTexts();
    } catch (err: any) {
      setError(err.message || 'Failed to delete banner marquee text');
      console.error('Error deleting banner marquee text:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      text: '',
      link_url: '',
      sort_order: 0,
      is_active: true,
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingText(null);
    resetForm();
  };

  return (
    <div className='dashboard_page'>
      <div className='heading_block'>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3>Banner Marquee Texts</h3>
            <p>Manage text items displayed in the banner marquee with optional links.</p>
          </div>
          <button
            className='btn btn_primary'
            onClick={() => setIsModalOpen(true)}
            style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
          >
            + Add Text
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '16px', margin: '16px 24px', background: '#fee', color: '#c00', borderRadius: '6px', fontWeight: 500, border: '1px solid #fcc' }}>
          <strong>Error:</strong> {error}
          <button 
            onClick={loadTexts}
            style={{ marginLeft: '12px', padding: '4px 12px', background: '#fff', border: '1px solid #c00', borderRadius: '4px', cursor: 'pointer', color: '#c00', fontSize: '12px' }}
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Loading banner marquee texts...</div>
      ) : texts.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
          No banner marquee texts found. Click "Add Text" to create one.
        </div>
      ) : (
        <div style={{ padding: '0 24px 24px 24px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#374151' }}>Text</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#374151' }}>Link URL</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#374151' }}>Sort Order</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#374151' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#374151' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {texts.map((text) => (
                  <tr key={text.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#1f2937', fontWeight: 500 }}>{text.text}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#1f2937' }}>
                      {text.link_url ? (
                        <a href={text.link_url} target="_blank" rel="noopener noreferrer" style={{ color: '#0d5a6f', textDecoration: 'underline' }}>
                          {text.link_url}
                        </a>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#1f2937' }}>{text.sort_order}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: text.is_active ? '#d1fae5' : '#fee2e2',
                        color: text.is_active ? '#065f46' : '#991b1b',
                      }}>
                        {text.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleEdit(text)}
                          style={{ padding: '6px 12px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: '#374151', fontWeight: 500 }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(text.id)}
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
                {editingText ? 'Edit Banner Marquee Text' : 'Add New Banner Marquee Text'}
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
                  Text *
                </label>
                <input
                  type='text'
                  required
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  placeholder="Enter text to display (e.g., KEDARNATH, BADRINATH)"
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', color: '#1f2937' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                  Link URL (Optional)
                </label>
                <input
                  type='url'
                  value={formData.link_url}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  placeholder="https://example.com or /packages/kedarnath"
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', color: '#1f2937' }}
                />
                <p style={{ marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>Leave empty if no link needed</p>
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
                  Active (visible in banner marquee)
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
                  {editingText ? 'Update Text' : 'Create Text'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
