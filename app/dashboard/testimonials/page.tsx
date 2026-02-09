'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';

interface Testimonial {
  id: string;
  name: string;
  title: string;
  description: string;
  location: string;
  rating: number;
  created_at?: string;
  updated_at?: string;
}

export default function TestimonialsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    description: '',
    location: '',
    rating: 5,
  });

  useEffect(() => {
    loadTestimonials();
  }, []);

  const loadTestimonials = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check session first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Session check:', { session: !!session, error: sessionError });
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error('Authentication error. Please refresh the page.');
      }
      
      if (!session) {
        console.error('No session found');
        throw new Error('You must be logged in to view testimonials.');
      }

      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Testimonials query result:', { data, error, count: data?.length });

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }
      
      setTestimonials(data || []);
      console.log('Testimonials loaded:', data?.length || 0);
    } catch (err: any) {
      console.error('Error loading testimonials:', err);
      setError(err.message || 'Failed to load testimonials');
      setTestimonials([]);
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

      if (editingTestimonial) {
        // Update existing testimonial
        const { error } = await supabase
          .from('testimonials')
          .update(formData)
          .eq('id', editingTestimonial.id);

        if (error) throw error;
      } else {
        // Create new testimonial
        const { error } = await supabase
          .from('testimonials')
          .insert([formData]);

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
      }

      setIsModalOpen(false);
      setEditingTestimonial(null);
      setFormData({
        name: '',
        title: '',
        description: '',
        location: '',
        rating: 5,
      });
      await loadTestimonials();
    } catch (err: any) {
      setError(err.message || 'Failed to save testimonial');
      console.error('Error saving testimonial:', err);
    }
  };

  const handleEdit = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    setFormData({
      name: testimonial.name,
      title: testimonial.title,
      description: testimonial.description,
      location: testimonial.location,
      rating: testimonial.rating,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return;

    try {
      setError(null);
      const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadTestimonials();
    } catch (err: any) {
      setError(err.message || 'Failed to delete testimonial');
      console.error('Error deleting testimonial:', err);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTestimonial(null);
    setFormData({
      name: '',
      title: '',
      description: '',
      location: '',
      rating: 5,
    });
  };

  return (
    <div className='dashboard_page'>
      <div className='heading_block'>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3>Testimonials</h3>
            <p>Manage customer testimonials and reviews.</p>
          </div>
          <button
            className='btn btn_primary'
            onClick={() => setIsModalOpen(true)}
            style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
          >
            + Add Testimonial
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '16px', margin: '16px 24px', background: '#fee', color: '#c00', borderRadius: '6px', fontWeight: 500, border: '1px solid #fcc' }}>
          <strong>Error:</strong> {error}
          <button 
            onClick={loadTestimonials}
            style={{ marginLeft: '12px', padding: '4px 12px', background: '#fff', border: '1px solid #c00', borderRadius: '4px', cursor: 'pointer', color: '#c00', fontSize: '12px' }}
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Loading testimonials...</div>
      ) : testimonials.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
          No testimonials found. Click "Add Testimonial" to create one.
        </div>
      ) : (
        <div style={{ padding: '0 24px 24px 24px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#374151' }}>Name</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#374151' }}>Title</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#374151' }}>Description</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#374151' }}>Location</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#374151' }}>Rating</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '14px', color: '#374151' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {testimonials.map((testimonial) => (
                  <tr key={testimonial.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#1f2937' }}>{testimonial.name}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#1f2937' }}>{testimonial.title}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#1f2937', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {testimonial.description}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#1f2937' }}>{testimonial.location}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#1f2937' }}>
                      <span style={{ color: '#f59e0b', fontWeight: 600 }}>★</span> {testimonial.rating}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleEdit(testimonial)}
                          style={{ padding: '6px 12px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: '#374151', fontWeight: 500 }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(testimonial.id)}
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
                {editingTestimonial ? 'Edit Testimonial' : 'Add New Testimonial'}
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
                  Name *
                </label>
                <input
                  type='text'
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', color: '#1f2937', background: '#fff' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                  Title *
                </label>
                <input
                  type='text'
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', color: '#1f2937', background: '#fff' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                  Description *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', color: '#1f2937', background: '#fff' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                  Location *
                </label>
                <input
                  type='text'
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', color: '#1f2937', background: '#fff' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                  Rating * (0.0 - 5.0)
                </label>
                <input
                  type='number'
                  required
                  min={0}
                  max={5}
                  step={0.1}
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 0 })}
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
                  {editingTestimonial ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
