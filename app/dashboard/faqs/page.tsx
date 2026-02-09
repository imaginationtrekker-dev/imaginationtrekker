'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export default function FAQsPage() {
  const supabase = createClient();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    display_order: 0,
  });

  useEffect(() => {
    loadFAQs();
  }, []);

  const loadFAQs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check session first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('You must be logged in to view FAQs. Please refresh the page.');
      }

      const { data, error } = await supabase
        .from('home_faq')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase query error:', error);
        if (error.message.includes('relation') || error.message.includes('does not exist')) {
          throw new Error('FAQ table does not exist. Please run the home_faq_table.sql script in Supabase.');
        }
        throw error;
      }
      setFaqs(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load FAQs');
      console.error('Error loading FAQs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);

      // Check if user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('You must be logged in to perform this action. Please refresh the page and try again.');
      }

      if (editingFAQ) {
        // Update existing FAQ
        const { error } = await supabase
          .from('home_faq')
          .update(formData)
          .eq('id', editingFAQ.id);

        if (error) {
          console.error('Update error:', error);
          if (error.message.includes('relation') || error.message.includes('does not exist')) {
            throw new Error('FAQ table does not exist. Please run the home_faq_table.sql script in Supabase.');
          }
          throw error;
        }
      } else {
        // Create new FAQ
        const { error } = await supabase
          .from('home_faq')
          .insert([formData]);

        if (error) {
          console.error('Insert error:', error);
          if (error.message.includes('relation') || error.message.includes('does not exist')) {
            throw new Error('FAQ table does not exist. Please run the home_faq_table.sql script in Supabase.');
          }
          if (error.message.includes('row-level security') || error.message.includes('RLS')) {
            throw new Error('Permission denied. Please check your RLS policies in Supabase.');
          }
          throw error;
        }
      }

      setIsModalOpen(false);
      setEditingFAQ(null);
      setFormData({
        question: '',
        answer: '',
        display_order: 0,
      });
      await loadFAQs();
    } catch (err: any) {
      setError(err.message || 'Failed to save FAQ');
      console.error('Error saving FAQ:', err);
    }
  };

  const handleEdit = (faq: FAQ) => {
    setEditingFAQ(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      display_order: faq.display_order,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;

    try {
      setError(null);
      const { error } = await supabase
        .from('home_faq')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadFAQs();
    } catch (err: any) {
      setError(err.message || 'Failed to delete FAQ');
      console.error('Error deleting FAQ:', err);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingFAQ(null);
    setFormData({
      question: '',
      answer: '',
      display_order: 0,
    });
  };

  return (
    <div className='dashboard_page'>
      <div className='heading_block'>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3>FAQs</h3>
            <p>Manage frequently asked questions for the homepage.</p>
          </div>
          <button
            className='btn btn_primary'
            onClick={() => setIsModalOpen(true)}
            style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
          >
            + Add FAQ
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '16px', margin: '16px 24px', background: '#fee', color: '#c00', borderRadius: '6px', fontWeight: 500, border: '1px solid #fcc' }}>
          <strong>Error:</strong> {error}
          <button 
            onClick={loadFAQs}
            style={{ marginLeft: '12px', padding: '4px 12px', background: '#fff', border: '1px solid #c00', borderRadius: '4px', cursor: 'pointer', color: '#c00', fontSize: '12px' }}
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Loading FAQs...</div>
      ) : faqs.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
          No FAQs found. Click "Add FAQ" to create one.
        </div>
      ) : (
        <div style={{ padding: '0 24px 24px 24px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#374151' }}>Question</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#374151' }}>Answer</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#374151' }}>Order</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#374151' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {faqs.map((faq) => (
                  <tr key={faq.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#1f2937', fontWeight: 500 }}>{faq.question}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#1f2937', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {faq.answer}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#1f2937' }}>{faq.display_order}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleEdit(faq)}
                          style={{ padding: '6px 12px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: '#374151', fontWeight: 500 }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(faq.id)}
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
                {editingFAQ ? 'Edit FAQ' : 'Add New FAQ'}
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
                  Question *
                </label>
                <input
                  type='text'
                  required
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', color: '#1f2937', background: '#fff' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                  Answer *
                </label>
                <textarea
                  required
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  rows={6}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', color: '#1f2937', background: '#fff' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                  Display Order
                </label>
                <input
                  type='number'
                  min={0}
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', color: '#1f2937', background: '#fff' }}
                />
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
                  {editingFAQ ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
