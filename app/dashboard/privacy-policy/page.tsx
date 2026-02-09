'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { RichTextEditor } from '@/app/components/RichTextEditor';

interface PrivacyPolicy {
  id: string;
  main_title: string;
  subtitle?: string;
  main_content: string;
  created_at?: string;
  updated_at?: string;
}

export default function PrivacyPolicyPage() {
  const supabase = createClient();
  const [policies, setPolicies] = useState<PrivacyPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<PrivacyPolicy | null>(null);
  const [formData, setFormData] = useState({
    main_title: '',
    subtitle: '',
    main_content: '',
  });

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('You must be logged in to view privacy policies. Please refresh the page.');
      }

      const { data, error } = await supabase
        .from('privacy_policy')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase query error:', error);
        if (error.message.includes('relation') || error.message.includes('does not exist')) {
          throw new Error('Privacy Policy table does not exist. Please run the privacy_policy_table.sql script in Supabase.');
        }
        throw error;
      }
      setPolicies(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load privacy policies');
      console.error('Error loading privacy policies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('You must be logged in to perform this action. Please refresh the page and try again.');
      }

      if (editingPolicy) {
        const { error } = await supabase
          .from('privacy_policy')
          .update(formData)
          .eq('id', editingPolicy.id);

        if (error) {
          console.error('Update error:', error);
          if (error.message.includes('relation') || error.message.includes('does not exist')) {
            throw new Error('Privacy Policy table does not exist. Please run the privacy_policy_table.sql script in Supabase.');
          }
          throw error;
        }
      } else {
        const { error } = await supabase
          .from('privacy_policy')
          .insert([formData]);

        if (error) {
          console.error('Insert error:', error);
          if (error.message.includes('relation') || error.message.includes('does not exist')) {
            throw new Error('Privacy Policy table does not exist. Please run the privacy_policy_table.sql script in Supabase.');
          }
          if (error.message.includes('row-level security') || error.message.includes('RLS')) {
            throw new Error('Permission denied. Please check your RLS policies in Supabase.');
          }
          throw error;
        }
      }

      setIsModalOpen(false);
      setEditingPolicy(null);
      setFormData({
        main_title: '',
        subtitle: '',
        main_content: '',
      });
      await loadPolicies();
    } catch (err: any) {
      setError(err.message || 'Failed to save privacy policy');
      console.error('Error saving privacy policy:', err);
    }
  };

  const handleEdit = (policy: PrivacyPolicy) => {
    setEditingPolicy(policy);
    setFormData({
      main_title: policy.main_title,
      subtitle: policy.subtitle || '',
      main_content: policy.main_content,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this privacy policy?')) return;

    try {
      setError(null);
      const { error } = await supabase
        .from('privacy_policy')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadPolicies();
    } catch (err: any) {
      setError(err.message || 'Failed to delete privacy policy');
      console.error('Error deleting privacy policy:', err);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPolicy(null);
    setFormData({
      main_title: '',
      subtitle: '',
      main_content: '',
    });
  };

  return (
    <div className='dashboard_page'>
      <div className='heading_block'>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3>Privacy Policy</h3>
            <p>Manage privacy policy content for your website.</p>
          </div>
          <button
            className='btn btn_primary'
            onClick={() => setIsModalOpen(true)}
            style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
          >
            + Add Privacy Policy
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '16px', margin: '16px 24px', background: '#fee', color: '#c00', borderRadius: '6px', fontWeight: 500, border: '1px solid #fcc' }}>
          <strong>Error:</strong> {error}
          <button 
            onClick={loadPolicies}
            style={{ marginLeft: '12px', padding: '4px 12px', background: '#fff', border: '1px solid #c00', borderRadius: '4px', cursor: 'pointer', color: '#c00', fontSize: '12px' }}
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Loading privacy policies...</div>
      ) : policies.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
          No privacy policies found. Click "Add Privacy Policy" to create one.
        </div>
      ) : (
        <div style={{ padding: '0 24px 24px 24px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#374151' }}>Main Title</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#374151' }}>Subtitle</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#374151' }}>Content Preview</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#374151' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {policies.map((policy) => (
                  <tr key={policy.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#1f2937', fontWeight: 500 }}>{policy.main_title}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#1f2937' }}>{policy.subtitle || '-'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#1f2937', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {policy.main_content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleEdit(policy)}
                          style={{ padding: '6px 12px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: '#374151', fontWeight: 500 }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(policy.id)}
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
          onClick={handleCloseModal}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '8px',
              padding: '24px',
              width: '90%',
              maxWidth: '900px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#1f2937', margin: 0 }}>
                {editingPolicy ? 'Edit Privacy Policy' : 'Add New Privacy Policy'}
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
                  Main Title *
                </label>
                <input
                  type='text'
                  required
                  value={formData.main_title}
                  onChange={(e) => setFormData({ ...formData, main_title: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', color: '#1f2937', background: '#fff' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                  Subtitle / Description
                </label>
                <input
                  type='text'
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', color: '#1f2937', background: '#fff' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                  Main Content *
                </label>
                <div style={{ border: '1px solid #d1d5db', borderRadius: '6px', overflow: 'hidden' }}>
                  <RichTextEditor
                    value={formData.main_content}
                    onChange={(value) => setFormData({ ...formData, main_content: value })}
                    placeholder="Enter privacy policy content..."
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type='button'
                  onClick={handleCloseModal}
                  style={{ padding: '10px 20px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', color: '#374151', fontWeight: 500 }}
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='btn btn_primary'
                  style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                >
                  {editingPolicy ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
