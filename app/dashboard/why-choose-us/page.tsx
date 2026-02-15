'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase-browser';
import Image from 'next/image';
import { Upload, Plus, Trash2 } from 'lucide-react';

interface WhyChooseUsItem {
  icon: string;
  title: string;
  description: string;
}

interface HomeWhyChooseUs {
  id: string;
  image_url: string | null;
  items: WhyChooseUsItem[];
}

const ICON_OPTIONS = [
  { value: 'itinerary', label: 'Document / Itinerary' },
  { value: 'support', label: 'Phone / Support' },
  { value: 'expertise', label: 'Pencil / Expertise' },
  { value: 'safety', label: 'Shield / Safety' },
];

export default function WhyChooseUsDashboard() {
  const supabase = createClient();
  const [data, setData] = useState<HomeWhyChooseUs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    image_url: '',
    items: [] as WhyChooseUsItem[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('You must be logged in to view this page.');
      }

      const { data: fetchedData, error } = await supabase
        .from('home_why_choose_us')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (fetchedData) {
        setData(fetchedData);
        setFormData({
          image_url: fetchedData.image_url || '',
          items: Array.isArray(fetchedData.items) ? fetchedData.items : [],
        });
      } else {
        setFormData({
          image_url: '',
          items: [],
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      console.error('Error loading:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    const response = await fetch('/api/upload-cloudinary', {
      method: 'POST',
      body: uploadFormData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload image');
    }

    const { url } = await response.json();
    return url;
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const url = await handleImageUpload(file);
      setFormData((prev) => ({ ...prev, image_url: url }));
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { icon: 'itinerary', title: '', description: '' }],
    });
  };

  const updateItem = (index: number, field: keyof WhyChooseUsItem, value: string) => {
    const updated = [...formData.items];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, items: updated });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('You must be logged in to perform this action.');
      }

      const dataToSave = {
        image_url: formData.image_url || null,
        items: formData.items,
      };

      if (data) {
        const { error } = await supabase
          .from('home_why_choose_us')
          .update(dataToSave)
          .eq('id', data.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('home_why_choose_us')
          .insert([dataToSave]);

        if (error) throw error;
      }

      await loadData();
      alert('Why Choose Us section saved successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to save');
      console.error('Error saving:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard_page">
        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard_page">
      <div className="heading_block">
        <div>
          <h3>Why Choose Us (Home Page)</h3>
          <p>Manage the Why Choose Us section on the home page - image and feature items</p>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '16px',
          margin: '16px 24px',
          background: '#fee',
          border: '1px solid #fcc',
          borderRadius: '6px',
          color: '#c00',
          fontWeight: 500,
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ padding: '0 24px 24px 24px' }}>
        {/* Section Image */}
        <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
            Section Image (Right Side)
          </label>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '1rem' }}>
            Upload an image to display on the right side of the Why Choose Us section.
          </p>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div
              onClick={() => imageInputRef.current?.click()}
              style={{
                width: 200,
                height: 260,
                border: '2px dashed #d1d5db',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                background: formData.image_url ? 'transparent' : '#f9fafb',
                overflow: 'hidden',
                position: 'relative' as const,
              }}
            >
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />
              {formData.image_url ? (
                <>
                  <Image
                    src={formData.image_url}
                    alt="Section preview"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '0'; }}
                  >
                    <Upload size={24} color="white" />
                  </div>
                </>
              ) : (
                <>
                  <Upload size={32} color="#9ca3af" style={{ marginBottom: '8px' }} />
                  <span style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center' }}>
                    {uploadingImage ? 'Uploading...' : 'Click to upload'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Feature Items */}
        <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <label style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Feature Items (Left Side)</label>
            <button
              type="button"
              onClick={addItem}
              style={{
                padding: '8px 16px',
                background: '#0d5a6f',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
              }}
            >
              <Plus size={16} />
              Add Item
            </button>
          </div>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '1rem' }}>
            Each item has a heading, description, and icon. Icons: itinerary, support, expertise, safety.
          </p>
          {formData.items.map((item, index) => (
            <div key={index} style={{ marginBottom: '1rem', padding: '1rem', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Item {index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  style={{
                    padding: '4px 8px',
                    background: '#fee',
                    color: '#c00',
                    border: '1px solid #fcc',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500, color: '#374151' }}>Icon</label>
                <select
                  value={item.icon}
                  onChange={(e) => updateItem(index, 'icon', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px',
                    color: '#1f2937',
                    background: '#fff',
                  }}
                >
                  {ICON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500, color: '#374151' }}>Heading</label>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => updateItem(index, 'title', e.target.value)}
                  placeholder="e.g. Personalized Itineraries"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px',
                    color: '#1f2937',
                    background: '#fff',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500, color: '#374151' }}>Description</label>
                <textarea
                  value={item.description}
                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                  placeholder="Enter description"
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    color: '#1f2937',
                    background: '#fff',
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            padding: '12px 24px',
            background: saving ? '#9ca3af' : '#0d5a6f',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
