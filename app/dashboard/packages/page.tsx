'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { createClient } from '@/lib/supabase-browser';
import Image from 'next/image';
import { GalleryUploader } from '@/app/components/GalleryUploader';
import { DatePicker } from '@/app/components/DatePicker';
import { RichTextEditor } from '@/app/components/RichTextEditor';
import { FileText, FileUp, Images, PenTool, Settings } from 'lucide-react';

interface Package {
  id: string;
  package_name: string;
  slug: string;
  package_description?: string;
  gallery_images: string[];
  thumbnail_image_url?: string;
  document_url?: string;
  document_cloudinary_public_id?: string;
  package_duration?: string;
  difficulty?: string;
  altitude?: string;
  departure_and_return_location?: string;
  departure_time?: string;
  trek_length?: string;
  base_camp?: string;
  itinerary: Array<{ heading: string; description: string }>;
  inclusions?: string;
  exclusions?: string;
  how_to_reach?: string;
  cancellation_policy?: string;
  refund_policy?: string;
  safety_for_trek?: string;
  faqs: Array<{ question: string; answer: string }>;
  booking_dates: string[];
  why_choose_us: Array<{ heading: string; description: string }>;
  price?: number;
  discounted_price?: number;
  created_at?: string;
  updated_at?: string;
}

interface ArrayItem {
  heading: string;
  description: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

export default function PackagesPage() {
  const supabase = createClient();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [pdfDeliveryBlocked, setPdfDeliveryBlocked] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    package_name: '',
    slug: '',
    package_description: '',
    gallery_images: [] as string[],
    thumbnail_image_url: '',
    document_url: '',
    document_cloudinary_public_id: '',
    package_duration: '',
    difficulty: '',
    altitude: '',
    departure_and_return_location: '',
    departure_time: '',
    trek_length: '',
    base_camp: '',
    itinerary: [] as ArrayItem[],
    inclusions: '',
    exclusions: '',
    how_to_reach: '',
    cancellation_policy: '',
    refund_policy: '',
    safety_for_trek: '',
    faqs: [] as FAQItem[],
    booking_dates: [] as Date[],
    why_choose_us: [] as ArrayItem[],
    price: undefined as number | undefined,
    discounted_price: undefined as number | undefined,
  });

  const [activeTab, setActiveTab] = useState<'basic' | 'details' | 'content' | 'media'>('basic');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadPackages();
  }, []);

  // Auto-generate slug from package name
  useEffect(() => {
    if (formData.package_name) {
      const slug = formData.package_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.package_name]);

  const loadPackages = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('You must be logged in to view packages.');
      }

      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.message.includes('relation') || error.message.includes('does not exist')) {
          throw new Error('Packages table does not exist. Please run the packages_table.sql script in Supabase.');
        }
        throw error;
      }

      // Convert booking_dates from strings to Date objects
      const packagesWithDates = (data || []).map(pkg => ({
        ...pkg,
        booking_dates: (pkg.booking_dates || []).map((date: string) => new Date(date)),
      }));

      setPackages(packagesWithDates as Package[]);
    } catch (err: any) {
      setError(err.message || 'Failed to load packages');
      console.error('Error loading packages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleThumbnailUpload = async (file: File) => {
    try {
      setUploadingThumbnail(true);
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const uploadResponse = await fetch('/api/upload-cloudinary', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload thumbnail');
      }

      const { url } = await uploadResponse.json();
      setFormData(prev => ({ ...prev, thumbnail_image_url: url }));
    } catch (err: any) {
      setError(err.message || 'Failed to upload thumbnail');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleDocumentUpload = async (file: File) => {
    try {
      setUploadingDocument(true);
      setError(null);
      setPdfDeliveryBlocked(false);
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const uploadResponse = await fetch('/api/upload-cloudinary-pdf', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        const errData = await uploadResponse.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to upload PDF');
      }

      const { url, publicId, deliveryBlocked } = await uploadResponse.json();
      setFormData(prev => ({
        ...prev,
        document_url: url,
        document_cloudinary_public_id: publicId,
      }));
      if (deliveryBlocked) {
        setPdfDeliveryBlocked(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload PDF');
    } finally {
      setUploadingDocument(false);
    }
  };

  const deleteDocumentFromCloudinary = async (publicId: string) => {
    try {
      await fetch('/api/delete-cloudinary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId, resourceType: 'raw' }),
      });
    } catch (e) {
      console.error('Failed to delete PDF from Cloudinary:', e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('You must be logged in to perform this action.');
      }

      // Convert booking_dates from Date objects to ISO strings
      const bookingDatesStrings = formData.booking_dates.map(date => date.toISOString().split('T')[0]);

      // Ensure slug is always generated from package name
      const slug = formData.package_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Validate price is provided and is a valid number
      if (formData.price === undefined || formData.price === null || formData.price <= 0) {
        throw new Error('Please enter a valid price.');
      }

      // When editing: if replacing PDF, delete old one from Cloudinary for optimal space
      if (editingPackage?.document_cloudinary_public_id) {
        const oldPublicId = editingPackage.document_cloudinary_public_id;
        const newPublicId = formData.document_cloudinary_public_id;
        if (oldPublicId && (!newPublicId || oldPublicId !== newPublicId)) {
          await deleteDocumentFromCloudinary(oldPublicId);
        }
      }

      const packageData = {
        ...formData,
        slug: slug || formData.slug,
        booking_dates: bookingDatesStrings,
        price: formData.price || null,
        discounted_price: formData.discounted_price || null,
        document_url: formData.document_url || null,
        document_cloudinary_public_id: formData.document_cloudinary_public_id || null,
      };

      if (editingPackage) {
        const { error } = await supabase
          .from('packages')
          .update(packageData)
          .eq('id', editingPackage.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('packages')
          .insert([packageData]);

        if (error) {
          if (error.message.includes('relation') || error.message.includes('does not exist')) {
            throw new Error('Packages table does not exist. Please run the packages_table.sql script in Supabase.');
          }
          throw error;
        }
      }

      setIsModalOpen(false);
      setEditingPackage(null);
      resetForm();
      await loadPackages();
    } catch (err: any) {
      setError(err.message || 'Failed to save package');
      console.error('Error saving package:', err);
    }
  };

  const resetForm = () => {
    setPdfDeliveryBlocked(false);
    setFormData({
      package_name: '',
      slug: '',
      package_description: '',
      gallery_images: [],
      thumbnail_image_url: '',
      document_url: '',
      document_cloudinary_public_id: '',
      package_duration: '',
      difficulty: '',
      altitude: '',
      departure_and_return_location: '',
      departure_time: '',
      trek_length: '',
      base_camp: '',
      itinerary: [],
      inclusions: '',
      exclusions: '',
      how_to_reach: '',
      cancellation_policy: '',
      refund_policy: '',
      safety_for_trek: '',
      faqs: [],
      booking_dates: [],
      why_choose_us: [],
      price: undefined,
      discounted_price: undefined,
    });
    setActiveTab('basic');
  };

  const handleEdit = (pkg: Package) => {
    setEditingPackage(pkg);
    setFormData({
      package_name: pkg.package_name,
      slug: pkg.slug,
      package_description: pkg.package_description || '',
      gallery_images: pkg.gallery_images || [],
      thumbnail_image_url: pkg.thumbnail_image_url || '',
      document_url: pkg.document_url || '',
      document_cloudinary_public_id: pkg.document_cloudinary_public_id || '',
      package_duration: pkg.package_duration || '',
      difficulty: pkg.difficulty || '',
      altitude: pkg.altitude || '',
      departure_and_return_location: pkg.departure_and_return_location || '',
      departure_time: pkg.departure_time || '',
      trek_length: pkg.trek_length || '',
      base_camp: pkg.base_camp || '',
      itinerary: pkg.itinerary || [],
      inclusions: pkg.inclusions || '',
      exclusions: pkg.exclusions || '',
      how_to_reach: pkg.how_to_reach || '',
      cancellation_policy: pkg.cancellation_policy || '',
      refund_policy: pkg.refund_policy || '',
      safety_for_trek: pkg.safety_for_trek || '',
      faqs: pkg.faqs || [],
      booking_dates: pkg.booking_dates.map((d: any) => typeof d === 'string' ? new Date(d) : d) || [],
      why_choose_us: pkg.why_choose_us || [],
      price: pkg.price || undefined,
      discounted_price: pkg.discounted_price || undefined,
    });
    setActiveTab('basic');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, pkg?: Package) => {
    if (!confirm('Are you sure you want to delete this package?')) return;

    try {
      setError(null);
      // Delete PDF from Cloudinary before deleting package for optimal space
      if (pkg?.document_cloudinary_public_id) {
        await deleteDocumentFromCloudinary(pkg.document_cloudinary_public_id);
      }
      const { error } = await supabase
        .from('packages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadPackages();
    } catch (err: any) {
      setError(err.message || 'Failed to delete package');
      console.error('Error deleting package:', err);
    }
  };

  const addArrayItem = (type: 'itinerary' | 'why_choose_us') => {
    setFormData(prev => ({
      ...prev,
      [type]: [...prev[type], { heading: '', description: '' }],
    }));
  };

  const updateArrayItem = (type: 'itinerary' | 'why_choose_us', index: number, field: 'heading' | 'description', value: string) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].map((item, i) => i === index ? { ...item, [field]: value } : item),
    }));
  };

  const removeArrayItem = (type: 'itinerary' | 'why_choose_us', index: number) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));
  };

  const addFAQ = () => {
    setFormData(prev => ({
      ...prev,
      faqs: [...prev.faqs, { question: '', answer: '' }],
    }));
  };

  const updateFAQ = (index: number, field: 'question' | 'answer', value: string) => {
    setFormData(prev => ({
      ...prev,
      faqs: prev.faqs.map((item, i) => i === index ? { ...item, [field]: value } : item),
    }));
  };

  const removeFAQ = (index: number) => {
    setFormData(prev => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className='dashboard_page'>
      <div className='heading_block'>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3>Packages</h3>
            <p>Manage travel packages and itineraries.</p>
          </div>
          <button
            className='btn btn_primary'
            onClick={() => setIsModalOpen(true)}
            style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
          >
            + Add Package
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '16px', margin: '16px 24px', background: '#fee', color: '#c00', borderRadius: '6px', fontWeight: 500 }}>
          <strong>Error:</strong> {error}
          <button 
            onClick={loadPackages}
            style={{ marginLeft: '12px', padding: '4px 12px', background: '#fff', border: '1px solid #c00', borderRadius: '4px', cursor: 'pointer', color: '#c00', fontSize: '12px' }}
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Loading packages...</div>
      ) : packages.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
          No packages found. Click "Add Package" to create one.
        </div>
      ) : (
        <div style={{ padding: '0 24px 24px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                style={{
                  background: '#fff',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                }}
              >
                {pkg.thumbnail_image_url && (
                  <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#f3f4f6' }}>
                    <Image
                      src={pkg.thumbnail_image_url}
                      alt={pkg.package_name}
                      fill
                      style={{ objectFit: 'cover' }}
                      sizes="300px"
                    />
                  </div>
                )}
                <div style={{ padding: '16px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600, color: '#1f2937' }}>
                    {pkg.package_name}
                  </h4>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>
                    {pkg.package_duration && <div>Duration: {pkg.package_duration}</div>}
                    {pkg.difficulty && <div>Difficulty: {pkg.difficulty}</div>}
                    {pkg.price && (
                      <div style={{ marginTop: '4px' }}>
                        {pkg.discounted_price && pkg.discounted_price < pkg.price ? (
                          <>
                            <span style={{ fontWeight: 600, color: '#dc2626', textDecoration: 'line-through', marginRight: '8px' }}>₹{pkg.price}</span>
                            <span style={{ fontWeight: 700, color: '#0d5a6f', fontSize: '16px' }}>₹{pkg.discounted_price}</span>
                          </>
                        ) : (
                          <span style={{ fontWeight: 600, color: '#0d5a6f' }}>₹{pkg.price}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleEdit(pkg)}
                      style={{ flex: 1, padding: '8px 12px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: '#374151', fontWeight: 500 }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(pkg.id, pkg)}
                      style={{ flex: 1, padding: '8px 12px', background: '#fee', border: '1px solid #fcc', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: '#dc2626', fontWeight: 500 }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && mounted && typeof window !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            overflowY: 'auto',
            padding: '20px',
            margin: 0,
            width: '100vw',
            height: '100vh',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '12px',
              width: '95%',
              maxWidth: '1000px',
              minWidth: '320px',
              maxHeight: '95vh',
              overflow: 'hidden',
              margin: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '24px',
              borderBottom: '1px solid #e5e7eb',
              background: 'linear-gradient(135deg, #0d5a6f 0%, #0a4a5a 100%)',
            }}>
              <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', margin: 0 }}>
                {editingPackage ? 'Edit Package' : 'Create New Package'}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingPackage(null);
                  resetForm();
                }}
                style={{ 
                  background: 'rgba(255, 255, 255, 0.2)', 
                  border: 'none', 
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  fontSize: '20px', 
                  cursor: 'pointer', 
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
              >
                ×
              </button>
            </div>

            {/* Tabs */}
            <div style={{ 
              display: 'flex', 
              borderBottom: '2px solid #e5e7eb',
              background: '#f9fafb',
              padding: '0 24px',
            }}>
              {[
                { id: 'basic', label: 'Basic Info', icon: FileText },
                { id: 'media', label: 'Media', icon: Images },
                { id: 'content', label: 'Content', icon: PenTool },
                { id: 'details', label: 'Details', icon: Settings },
              ].map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type='button'
                    onClick={() => setActiveTab(tab.id as any)}
                    style={{
                      padding: '16px 24px',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: activeTab === tab.id ? '3px solid #0d5a6f' : '3px solid transparent',
                      color: activeTab === tab.id ? '#0d5a6f' : '#6b7280',
                      fontWeight: activeTab === tab.id ? 600 : 500,
                      cursor: 'pointer',
                      fontSize: '14px',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <IconComponent size={18} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Modal Content */}
            <div style={{ 
              overflowY: 'auto', 
              flex: 1,
              padding: '24px',
            }}>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Tab Content */}
              {activeTab === 'basic' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Package Name */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                      Package Name *
                    </label>
                    <input
                      type='text'
                      required
                      value={formData.package_name}
                      onChange={(e) => setFormData({ ...formData, package_name: e.target.value })}
                      style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', color: '#1f2937', background: '#fff', transition: 'border-color 0.2s' }}
                      onFocus={(e) => e.target.style.borderColor = '#0d5a6f'}
                      onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    />
                  </div>

                  {/* Slug */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                      Slug (auto-generated)
                    </label>
                    <input
                      type='text'
                      value={formData.slug}
                      readOnly
                      style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', color: '#6b7280', background: '#f9fafb', cursor: 'not-allowed' }}
                    />
                  </div>

                  {/* Prices */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', padding: '20px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                        Normal Price (₹) *
                      </label>
                      <input
                        type='number'
                        required
                        min={0}
                        step={0.01}
                        inputMode="decimal"
                        value={formData.price !== undefined && formData.price !== 0 ? formData.price : ''}
                        onChange={(e) => {
                          const value = e.target.value.trim();
                          if (value === '' || value === '-') {
                            setFormData({ ...formData, price: undefined });
                          } else {
                            const numValue = parseFloat(value);
                            if (!isNaN(numValue) && numValue >= 0) {
                              setFormData({ ...formData, price: numValue });
                            }
                          }
                        }}
                        onKeyPress={(e) => {
                          // Only allow numbers, decimal point, and minus sign
                          const char = String.fromCharCode(e.which);
                          if (!/[0-9.]/.test(char)) {
                            e.preventDefault();
                          }
                        }}
                        style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', color: '#1f2937', background: '#fff' }}
                        placeholder="Enter price"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                        Discounted Price (₹)
                      </label>
                      <input
                        type='number'
                        min={0}
                        step={0.01}
                        inputMode="decimal"
                        value={formData.discounted_price !== undefined && formData.discounted_price !== 0 ? formData.discounted_price : ''}
                        onChange={(e) => {
                          const value = e.target.value.trim();
                          if (value === '' || value === '-') {
                            setFormData({ ...formData, discounted_price: undefined });
                          } else {
                            const numValue = parseFloat(value);
                            if (!isNaN(numValue) && numValue >= 0) {
                              setFormData({ ...formData, discounted_price: numValue });
                            }
                          }
                        }}
                        onKeyPress={(e) => {
                          // Only allow numbers and decimal point
                          const char = String.fromCharCode(e.which);
                          if (!/[0-9.]/.test(char)) {
                            e.preventDefault();
                          }
                        }}
                        style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', color: '#1f2937', background: '#fff' }}
                        placeholder="Enter discounted price"
                      />
                    </div>
                  </div>

                  {/* Package Duration, Difficulty, Altitude */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                        Duration
                      </label>
                      <input
                        type='text'
                        value={formData.package_duration}
                        onChange={(e) => setFormData({ ...formData, package_duration: e.target.value })}
                        style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', color: '#1f2937', background: '#fff' }}
                        placeholder="e.g., 5 Days"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                        Difficulty
                      </label>
                      <input
                        type='text'
                        value={formData.difficulty}
                        onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                        style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', color: '#1f2937', background: '#fff' }}
                        placeholder="e.g., Moderate"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                        Altitude
                      </label>
                      <input
                        type='text'
                        value={formData.altitude}
                        onChange={(e) => setFormData({ ...formData, altitude: e.target.value })}
                        style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', color: '#1f2937', background: '#fff' }}
                        placeholder="e.g., 12,000 ft"
                      />
                    </div>
                  </div>

                  {/* Departure and Return Location */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                      Departure and Return Location
                    </label>
                    <input
                      type='text'
                      value={formData.departure_and_return_location}
                      onChange={(e) => setFormData({ ...formData, departure_and_return_location: e.target.value })}
                      style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', color: '#1f2937', background: '#fff' }}
                      placeholder="e.g., Mumbai / Dehradun"
                    />
                  </div>

                  {/* Departure Time, Trek Length, Base Camp */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                        Departure Time
                      </label>
                      <input
                        type='text'
                        value={formData.departure_time}
                        onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
                        style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', color: '#1f2937', background: '#fff' }}
                        placeholder="e.g., 6:00 AM"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                        Trek Length
                      </label>
                      <input
                        type='text'
                        value={formData.trek_length}
                        onChange={(e) => setFormData({ ...formData, trek_length: e.target.value })}
                        style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', color: '#1f2937', background: '#fff' }}
                        placeholder="e.g., 16 km"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                        Base Camp
                      </label>
                      <input
                        type='text'
                        value={formData.base_camp}
                        onChange={(e) => setFormData({ ...formData, base_camp: e.target.value })}
                        style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', color: '#1f2937', background: '#fff' }}
                        placeholder="e.g., Gaurikund"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'media' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Thumbnail Image */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                      Thumbnail Image
                    </label>
                    <input
                      ref={thumbnailInputRef}
                      type='file'
                      accept='image/*'
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleThumbnailUpload(e.target.files[0]);
                        }
                      }}
                      style={{ display: 'none' }}
                    />
                    <button
                      type='button'
                      onClick={() => thumbnailInputRef.current?.click()}
                      disabled={uploadingThumbnail}
                      style={{ 
                        padding: '12px 24px', 
                        border: '2px dashed #0d5a6f', 
                        borderRadius: '8px', 
                        cursor: uploadingThumbnail ? 'not-allowed' : 'pointer', 
                        background: uploadingThumbnail ? '#f3f4f6' : '#fff', 
                        color: '#0d5a6f', 
                        fontWeight: 600,
                        fontSize: '14px',
                        marginBottom: '12px',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => !uploadingThumbnail && (e.currentTarget.style.background = '#f0f9ff')}
                      onMouseLeave={(e) => !uploadingThumbnail && (e.currentTarget.style.background = '#fff')}
                    >
                      {uploadingThumbnail ? 'Uploading...' : '📷 Upload Thumbnail'}
                    </button>
                    {formData.thumbnail_image_url && (
                      <div style={{ marginTop: '12px', position: 'relative', width: '300px', height: '200px', borderRadius: '8px', overflow: 'hidden', border: '2px solid #e5e7eb' }}>
                        <Image
                          src={formData.thumbnail_image_url}
                          alt='Thumbnail'
                          fill
                          style={{ objectFit: 'cover' }}
                          sizes="300px"
                        />
                        <button
                          type='button'
                          onClick={() => setFormData({ ...formData, thumbnail_image_url: '' })}
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            background: 'rgba(220, 38, 38, 0.9)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '28px',
                            height: '28px',
                            cursor: 'pointer',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Package Gallery */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                      Package Gallery Images
                    </label>
                    <GalleryUploader
                      images={formData.gallery_images}
                      onImagesChange={(images) => setFormData({ ...formData, gallery_images: images })}
                    />
                  </div>

                  {/* PDF Document (Brochure/Itinerary) */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                      Package PDF Document
                    </label>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
                      Upload a PDF brochure or itinerary (max 50 MB). The document will be stored in Cloudinary and the URL saved in the database.
                    </p>
                    <input
                      ref={pdfInputRef}
                      type='file'
                      accept='application/pdf'
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 50 * 1024 * 1024) {
                            setError('PDF must be less than 50 MB');
                            return;
                          }
                          handleDocumentUpload(file);
                          e.target.value = '';
                        }
                      }}
                      style={{ display: 'none' }}
                    />
                    <button
                      type='button'
                      onClick={() => pdfInputRef.current?.click()}
                      disabled={uploadingDocument}
                      style={{
                        padding: '12px 24px',
                        border: '2px dashed #0d5a6f',
                        borderRadius: '8px',
                        cursor: uploadingDocument ? 'not-allowed' : 'pointer',
                        background: uploadingDocument ? '#f3f4f6' : '#fff',
                        color: '#0d5a6f',
                        fontWeight: 600,
                        fontSize: '14px',
                        marginBottom: '12px',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                      onMouseEnter={(e) => !uploadingDocument && (e.currentTarget.style.background = '#f0f9ff')}
                      onMouseLeave={(e) => !uploadingDocument && (e.currentTarget.style.background = '#fff')}
                    >
                      <FileUp size={18} />
                      {uploadingDocument ? 'Uploading PDF...' : 'Upload PDF Document'}
                    </button>
                    {formData.document_url && (
                      <div style={{ marginTop: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', background: '#f9fafb' }}>
                        <div style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FileText size={16} />
                            PDF Uploaded Successfully
                          </span>
                          <button
                            type='button'
                            onClick={() => {
                              if (!editingPackage && formData.document_cloudinary_public_id) {
                                deleteDocumentFromCloudinary(formData.document_cloudinary_public_id);
                              }
                              setFormData({ ...formData, document_url: '', document_cloudinary_public_id: '' });
                              setPdfDeliveryBlocked(false);
                            }}
                            style={{
                              padding: '4px 12px',
                              background: '#fee',
                              color: '#dc2626',
                              border: '1px solid #fcc',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 600,
                            }}
                          >
                            Remove PDF
                          </button>
                        </div>

                        {pdfDeliveryBlocked && (
                          <div style={{
                            margin: '12px 12px 0',
                            padding: '12px 16px',
                            background: '#fef3c7',
                            border: '1px solid #fbbf24',
                            borderRadius: '8px',
                            fontSize: '13px',
                            color: '#92400e',
                            lineHeight: 1.5,
                          }}>
                            <strong style={{ display: 'block', marginBottom: '4px' }}>⚠ PDF delivery is blocked by Cloudinary</strong>
                            The PDF uploaded successfully but cannot be viewed or downloaded publicly. To fix this:
                            <ol style={{ margin: '8px 0 0', paddingLeft: '20px' }}>
                              <li>Go to <a href='https://console.cloudinary.com/settings/security' target='_blank' rel='noopener noreferrer' style={{ color: '#0d5a6f', fontWeight: 600 }}>Cloudinary Settings → Security</a></li>
                              <li>Enable &quot;Allow delivery of PDF and ZIP files&quot;</li>
                              <li>Save, then re-upload the PDF</li>
                            </ol>
                          </div>
                        )}

                        <div style={{ padding: '12px' }}>
                          <div style={{
                            padding: '16px',
                            background: '#fff',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                              <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '8px',
                                background: '#0d5a6f',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}>
                                <FileText size={20} />
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {formData.document_cloudinary_public_id || 'PDF Document'}
                                </p>
                                <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {formData.document_url}
                                </p>
                              </div>
                            </div>
                            <a
                              href={formData.document_url}
                              target='_blank'
                              rel='noopener noreferrer'
                              style={{
                                padding: '6px 16px',
                                background: '#0d5a6f',
                                color: '#fff',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 600,
                                textDecoration: 'none',
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                              }}
                            >
                              Open PDF ↗
                            </a>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'content' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Package Description */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                      Package Description
                    </label>
                    <RichTextEditor
                      value={formData.package_description}
                      onChange={(value) => setFormData({ ...formData, package_description: value })}
                      placeholder="Enter package description..."
                    />
                  </div>

                  {/* Inclusions */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                      Inclusions
                    </label>
                    <RichTextEditor
                      value={formData.inclusions}
                      onChange={(value) => setFormData({ ...formData, inclusions: value })}
                      placeholder="Enter inclusions..."
                      hideToolbar={true}
                      autoBulletList={true}
                    />
                  </div>

                  {/* Exclusions */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                      Exclusions
                    </label>
                    <RichTextEditor
                      value={formData.exclusions}
                      onChange={(value) => setFormData({ ...formData, exclusions: value })}
                      placeholder="Enter exclusions..."
                      hideToolbar={true}
                      autoBulletList={true}
                    />
                  </div>

                  {/* How to Reach */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                      How to Reach
                    </label>
                    <RichTextEditor
                      value={formData.how_to_reach}
                      onChange={(value) => setFormData({ ...formData, how_to_reach: value })}
                      placeholder="Enter how to reach information..."
                      hideToolbar={true}
                      autoBulletList={true}
                    />
                  </div>

                  {/* Safety for the Trek */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                      Safety for the Trek
                    </label>
                    <RichTextEditor
                      value={formData.safety_for_trek}
                      onChange={(value) => setFormData({ ...formData, safety_for_trek: value })}
                      placeholder="Enter safety information for the trek..."
                    />
                  </div>

                  {/* Cancellation Policy and Refund Policy in Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {/* Cancellation Policy */}
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                        Cancellation Policy
                      </label>
                      <RichTextEditor
                        value={formData.cancellation_policy}
                        onChange={(value) => setFormData({ ...formData, cancellation_policy: value })}
                        placeholder="Enter cancellation policy..."
                      />
                    </div>

                    {/* Refund Policy */}
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                        Refund Policy
                      </label>
                      <RichTextEditor
                        value={formData.refund_policy}
                        onChange={(value) => setFormData({ ...formData, refund_policy: value })}
                        placeholder="Enter refund policy..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'details' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Itinerary */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <label style={{ fontSize: '16px', fontWeight: 600, color: '#374151' }}>Itinerary</label>
                      <button
                        type='button'
                        onClick={() => addArrayItem('itinerary')}
                        style={{ padding: '8px 16px', background: '#0d5a6f', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                      >
                        + Add Item
                      </button>
                    </div>
                    {formData.itinerary.map((item, index) => (
                      <div key={index} style={{ marginBottom: '16px', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280', background: '#fff', padding: '4px 12px', borderRadius: '12px' }}>Item {index + 1}</span>
                          <button
                            type='button'
                            onClick={() => removeArrayItem('itinerary', index)}
                            style={{ background: '#fee', color: '#dc2626', border: '1px solid #fcc', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                          >
                            Remove
                          </button>
                        </div>
                        <input
                          type='text'
                          value={item.heading}
                          onChange={(e) => updateArrayItem('itinerary', index, 'heading', e.target.value)}
                          placeholder="Heading"
                          style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', marginBottom: '10px', background: '#fff', color: '#1f2937' }}
                        />
                        <textarea
                          value={item.description}
                          onChange={(e) => updateArrayItem('itinerary', index, 'description', e.target.value)}
                          placeholder="Description"
                          rows={3}
                          style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', background: '#fff', color: '#1f2937' }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* FAQs */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <label style={{ fontSize: '16px', fontWeight: 600, color: '#374151' }}>FAQs</label>
                      <button
                        type='button'
                        onClick={addFAQ}
                        style={{ padding: '8px 16px', background: '#0d5a6f', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                      >
                        + Add FAQ
                      </button>
                    </div>
                    {formData.faqs.map((faq, index) => (
                      <div key={index} style={{ marginBottom: '16px', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280', background: '#fff', padding: '4px 12px', borderRadius: '12px' }}>FAQ {index + 1}</span>
                          <button
                            type='button'
                            onClick={() => removeFAQ(index)}
                            style={{ background: '#fee', color: '#dc2626', border: '1px solid #fcc', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                          >
                            Remove
                          </button>
                        </div>
                        <input
                          type='text'
                          value={faq.question}
                          onChange={(e) => updateFAQ(index, 'question', e.target.value)}
                          placeholder="Question"
                          style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', marginBottom: '10px', background: '#fff', color: '#1f2937' }}
                        />
                        <textarea
                          value={faq.answer}
                          onChange={(e) => updateFAQ(index, 'answer', e.target.value)}
                          placeholder="Answer"
                          rows={3}
                          style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', background: '#fff', color: '#1f2937' }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Booking Dates */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                      Booking Dates
                    </label>
                    <DatePicker
                      selectedDates={formData.booking_dates}
                      onChange={(dates) => setFormData({ ...formData, booking_dates: dates })}
                    />
                  </div>

                  {/* Why Choose Us */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <label style={{ fontSize: '16px', fontWeight: 600, color: '#374151' }}>Why Choose Us</label>
                      <button
                        type='button'
                        onClick={() => addArrayItem('why_choose_us')}
                        style={{ padding: '8px 16px', background: '#0d5a6f', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                      >
                        + Add Item
                      </button>
                    </div>
                    {formData.why_choose_us.map((item, index) => (
                      <div key={index} style={{ marginBottom: '16px', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280', background: '#fff', padding: '4px 12px', borderRadius: '12px' }}>Item {index + 1}</span>
                          <button
                            type='button'
                            onClick={() => removeArrayItem('why_choose_us', index)}
                            style={{ background: '#fee', color: '#dc2626', border: '1px solid #fcc', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                          >
                            Remove
                          </button>
                        </div>
                        <input
                          type='text'
                          value={item.heading}
                          onChange={(e) => updateArrayItem('why_choose_us', index, 'heading', e.target.value)}
                          placeholder="Heading"
                          style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', marginBottom: '10px', background: '#fff', color: '#1f2937' }}
                        />
                        <textarea
                          value={item.description}
                          onChange={(e) => updateArrayItem('why_choose_us', index, 'description', e.target.value)}
                          placeholder="Description"
                          rows={3}
                          style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', background: '#fff', color: '#1f2937' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Form Actions - Fixed at bottom */}
              <div style={{ 
                display: 'flex', 
                gap: '12px', 
                justifyContent: 'flex-end', 
                marginTop: '24px', 
                paddingTop: '24px', 
                borderTop: '2px solid #e5e7eb',
                position: 'sticky',
                bottom: 0,
                background: '#fff',
                zIndex: 10,
              }}>
                <button
                  type='button'
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingPackage(null);
                    resetForm();
                  }}
                  style={{ padding: '12px 24px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', color: '#374151', fontWeight: 600, fontSize: '14px' }}
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='btn btn_primary'
                  style={{ padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}
                >
                  {editingPackage ? 'Update Package' : 'Create Package'}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
