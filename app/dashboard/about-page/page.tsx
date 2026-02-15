'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { RichTextEditor } from '@/app/components/RichTextEditor';
import { ImageGallery } from '@/app/components/ImageGallery';
import Image from 'next/image';
import { Upload, X, Plus, Trash2 } from 'lucide-react';

interface WhyChooseUsItem {
  icon: string;
  title: string;
  description: string;
}

interface TeamMember {
  image_url: string;
  name: string;
  description: string;
  position: string;
  facebook_url?: string;
  linkedin_url?: string;
  instagram_url?: string;
}

interface AboutPage {
  id: string;
  about_description: string | null;
  our_story_image_url?: string | null;
  our_mission: string | null;
  our_vision: string | null;
  why_choose_us: WhyChooseUsItem[];
  appreciation_letter: string | null;
  recognition_association_letter: string | null;
  team_members: TeamMember[];
}

export default function AboutPageDashboard() {
  const supabase = createClient();
  const [aboutPage, setAboutPage] = useState<AboutPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    about_description: '',
    our_story_image_url: '',
    our_mission: '',
    our_vision: '',
    why_choose_us: [] as WhyChooseUsItem[],
    appreciation_letter: '',
    recognition_association_letter: '',
    team_members: [] as TeamMember[],
  });

  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const teamImageInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  const storyImageInputRef = useRef<HTMLInputElement | null>(null);
  const whyIconInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  useEffect(() => {
    loadAboutPage();
  }, []);

  const loadAboutPage = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('You must be logged in to view this page.');
      }

      const { data, error } = await supabase
        .from('about_page')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setAboutPage(data);
        setFormData({
          about_description: data.about_description || '',
          our_story_image_url: data.our_story_image_url || '',
          our_mission: data.our_mission || '',
          our_vision: data.our_vision || '',
          why_choose_us: Array.isArray(data.why_choose_us) ? data.why_choose_us : [],
          appreciation_letter: data.appreciation_letter || '',
          recognition_association_letter: data.recognition_association_letter || '',
          team_members: Array.isArray(data.team_members) ? data.team_members : [],
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load about page');
      console.error('Error loading about page:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File, type: 'team', index?: number): Promise<string> => {
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    const uploadResponse = await fetch('/api/upload-cloudinary', {
      method: 'POST',
      body: uploadFormData,
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      throw new Error(errorData.error || 'Failed to upload image');
    }

    const { url } = await uploadResponse.json();
    return url;
  };

  const handleStoryImageUpload = async (file: File) => {
    try {
      setUploadingImage('story');
      const imageUrl = await handleImageUpload(file, 'team');
      setFormData((prev) => ({ ...prev, our_story_image_url: imageUrl }));
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploadingImage(null);
    }
  };

  const handleWhyChooseUsIconUpload = async (index: number, file: File) => {
    try {
      setUploadingImage(`why-icon-${index}`);
      const imageUrl = await handleImageUpload(file, 'team');
      updateWhyChooseUsItem(index, 'icon', imageUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to upload icon');
    } finally {
      setUploadingImage(null);
    }
  };

  const handleTeamImageUpload = async (index: number, file: File) => {
    try {
      setUploadingImage(`team-${index}`);
      const imageUrl = await handleImageUpload(file, 'team', index);
      
      // Use functional update to avoid race conditions when uploading multiple images
      setFormData((prev) => {
        const updatedMembers = [...prev.team_members];
        if (!updatedMembers[index]) return prev;
        updatedMembers[index] = { ...updatedMembers[index], image_url: imageUrl };
        return { ...prev, team_members: updatedMembers };
      });
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploadingImage(null);
    }
  };

  const addWhyChooseUsItem = () => {
    setFormData({
      ...formData,
      why_choose_us: [...formData.why_choose_us, { icon: '', title: '', description: '' }],
    });
  };

  const updateWhyChooseUsItem = (index: number, field: keyof WhyChooseUsItem, value: string) => {
    const updated = [...formData.why_choose_us];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, why_choose_us: updated });
  };

  const removeWhyChooseUsItem = (index: number) => {
    setFormData({
      ...formData,
      why_choose_us: formData.why_choose_us.filter((_, i) => i !== index),
    });
  };

  const addTeamMember = () => {
    setFormData({
      ...formData,
      team_members: [...formData.team_members, { image_url: '', name: '', description: '', position: '', facebook_url: '', linkedin_url: '', instagram_url: '' }],
    });
  };

  const updateTeamMember = (index: number, field: keyof TeamMember, value: string) => {
    const updated = [...formData.team_members];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, team_members: updated });
  };

  const removeTeamMember = (index: number) => {
    setFormData({
      ...formData,
      team_members: formData.team_members.filter((_, i) => i !== index),
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
        about_description: formData.about_description,
        our_story_image_url: formData.our_story_image_url || null,
        our_mission: formData.our_mission,
        our_vision: formData.our_vision,
        why_choose_us: formData.why_choose_us,
        appreciation_letter: formData.appreciation_letter,
        recognition_association_letter: formData.recognition_association_letter,
        team_members: formData.team_members,
      };

      if (aboutPage) {
        // Update existing
        const { error } = await supabase
          .from('about_page')
          .update(dataToSave)
          .eq('id', aboutPage.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('about_page')
          .insert([dataToSave]);

        if (error) throw error;
      }

      await loadAboutPage();
      alert('About page saved successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to save about page');
      console.error('Error saving about page:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className='dashboard_page'>
        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className='dashboard_page'>
      <div className='heading_block'>
        <div>
          <h3>About Page Management</h3>
          <p>Manage the content for your About/FAQ page</p>
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
          fontWeight: 500
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ padding: '0 24px 24px 24px' }}>
        {/* Our Story Image */}
        <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
            Our Story Image
          </label>

          {formData.our_story_image_url ? (
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <Image
                  src={formData.our_story_image_url}
                  alt="Our Story"
                  width={180}
                  height={120}
                  style={{ objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, our_story_image_url: '' }))}
                  style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '-10px',
                    background: '#fee',
                    color: '#c00',
                    border: '1px solid #fcc',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                  aria-label="Remove image"
                  title="Remove"
                >
                  <X size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  ref={storyImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    handleStoryImageUpload(file);
                    e.target.value = '';
                  }}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => storyImageInputRef.current?.click()}
                  style={{
                    padding: '10px 16px',
                    background: '#0d5a6f',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                  }}
                  disabled={uploadingImage === 'story'}
                >
                  <Upload size={16} />
                  {uploadingImage === 'story' ? 'Uploading...' : 'Change Image'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <input
                ref={storyImageInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  handleStoryImageUpload(file);
                  e.target.value = '';
                }}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => storyImageInputRef.current?.click()}
                style={{
                  padding: '10px 16px',
                  background: '#0d5a6f',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                }}
                disabled={uploadingImage === 'story'}
              >
                <Upload size={16} />
                {uploadingImage === 'story' ? 'Uploading...' : 'Upload Image'}
              </button>
              <p style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
                Shows on the left side of the “Our Story” section on the About page.
              </p>
            </div>
          )}
        </div>

        {/* About Description */}
        <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
            About Description
          </label>
          <textarea
            value={formData.about_description}
            onChange={(e) => setFormData({ ...formData, about_description: e.target.value })}
            placeholder="Enter about description..."
            rows={6}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Our Mission */}
        <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
            Our Mission
          </label>
          <textarea
            value={formData.our_mission}
            onChange={(e) => setFormData({ ...formData, our_mission: e.target.value })}
            placeholder="Enter our mission..."
            rows={6}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'vertical',
              color: '#1f2937',
              background: '#fff',
            }}
          />
        </div>

        {/* Our Vision */}
        <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
            Our Vision
          </label>
          <textarea
            value={formData.our_vision}
            onChange={(e) => setFormData({ ...formData, our_vision: e.target.value })}
            placeholder="Enter our vision..."
            rows={6}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'vertical',
              color: '#1f2937',
              background: '#fff',
            }}
          />
        </div>

        {/* Why Choose Us */}
        <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <label style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Why Choose Us</label>
            <button
              type="button"
              onClick={addWhyChooseUsItem}
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
          {formData.why_choose_us.map((item, index) => (
            <div key={index} style={{ marginBottom: '1rem', padding: '1rem', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Item {index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeWhyChooseUsItem(index)}
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
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500, color: '#374151' }}>Icon (emoji or uploaded image)</label>

                {item.icon && item.icon.startsWith('http') ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <Image
                        src={item.icon}
                        alt={item.title || `Why choose us icon ${index + 1}`}
                        width={56}
                        height={56}
                        style={{ objectFit: 'cover', borderRadius: '10px', border: '1px solid #e5e7eb', background: '#fff' }}
                      />
                      <button
                        type="button"
                        onClick={() => updateWhyChooseUsItem(index, 'icon', '')}
                        style={{
                          position: 'absolute',
                          top: '-10px',
                          right: '-10px',
                          background: '#fee',
                          color: '#c00',
                          border: '1px solid #fcc',
                          borderRadius: '50%',
                          width: '26px',
                          height: '26px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                        aria-label="Remove icon"
                        title="Remove"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input
                        ref={(el) => { whyIconInputRefs.current[index] = el; }}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          handleWhyChooseUsIconUpload(index, file);
                          e.target.value = '';
                        }}
                        style={{ display: 'none' }}
                      />
                      <button
                        type="button"
                        onClick={() => whyIconInputRefs.current[index]?.click()}
                        style={{
                          padding: '10px 16px',
                          background: '#0d5a6f',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '14px',
                        }}
                        disabled={uploadingImage === `why-icon-${index}`}
                      >
                        <Upload size={16} />
                        {uploadingImage === `why-icon-${index}` ? 'Uploading...' : 'Change Icon'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <input
                      ref={(el) => { whyIconInputRefs.current[index] = el; }}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        handleWhyChooseUsIconUpload(index, file);
                        e.target.value = '';
                      }}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => whyIconInputRefs.current[index]?.click()}
                      style={{
                        padding: '10px 16px',
                        background: '#0d5a6f',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                      }}
                      disabled={uploadingImage === `why-icon-${index}`}
                    >
                      <Upload size={16} />
                      {uploadingImage === `why-icon-${index}` ? 'Uploading...' : 'Upload Icon'}
                    </button>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>or type an emoji below</span>
                  </div>
                )}

                <input
                  type="text"
                  value={item.icon}
                  onChange={(e) => updateWhyChooseUsItem(index, 'icon', e.target.value)}
                  placeholder="Example: 🏔️ or paste an image URL"
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
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500, color: '#374151' }}>Title</label>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => updateWhyChooseUsItem(index, 'title', e.target.value)}
                  placeholder="Enter title"
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
                  onChange={(e) => updateWhyChooseUsItem(index, 'description', e.target.value)}
                  placeholder="Enter description"
                  rows={3}
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

        {/* Appreciation Letter */}
        <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
            Our Appreciation Letter
          </label>
          <RichTextEditor
            value={formData.appreciation_letter}
            onChange={(value) => setFormData({ ...formData, appreciation_letter: value })}
            placeholder="Enter appreciation letter content..."
            enableImageUpload={true}
          />
        </div>

        {/* Recognition & Association Letter */}
        <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
            Recognition & Association Letter
          </label>
          <RichTextEditor
            value={formData.recognition_association_letter}
            onChange={(value) => setFormData({ ...formData, recognition_association_letter: value })}
            placeholder="Enter recognition & association letter content..."
            enableImageUpload={true}
          />
        </div>

        {/* Appreciation Letter Gallery */}
        <ImageGallery 
          sectionType="appreciation_letter" 
          sectionTitle="Our Appreciation Letter"
        />

        {/* Recognition & Association Letter Gallery */}
        <ImageGallery 
          sectionType="recognition_association_letter" 
          sectionTitle="Recognition & Association Letter"
        />

        {/* Team Members */}
        <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <label style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Our Team</label>
            <button
              type="button"
              onClick={addTeamMember}
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
              Add Member
            </button>
          </div>
          {formData.team_members.map((member, index) => (
            <div key={index} style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Member {index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeTeamMember(index)}
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
              
              {/* Image Upload */}
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500, color: '#374151' }}>Image</label>
                {member.image_url ? (
                  <div style={{ position: 'relative', display: 'inline-block', marginBottom: '8px' }}>
                    <Image
                      src={member.image_url}
                      alt={member.name || 'Team member'}
                      width={100}
                      height={100}
                      style={{ objectFit: 'cover', borderRadius: '6px' }}
                    />
                    <button
                      type="button"
                      onClick={() => updateTeamMember(index, 'image_url', '')}
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        background: '#fee',
                        color: '#c00',
                        border: '1px solid #fcc',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : null}
                <input
                  ref={(el) => { teamImageInputRefs.current[index] = el; }}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleTeamImageUpload(index, file);
                      e.target.value = ''; // Reset so same file can be re-selected
                    }
                  }}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => teamImageInputRefs.current[index]?.click()}
                  disabled={uploadingImage === `team-${index}`}
                  style={{
                    padding: '8px 16px',
                    background: uploadingImage === `team-${index}` ? '#9ca3af' : '#0d5a6f',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: uploadingImage === `team-${index}` ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                  }}
                >
                  <Upload size={16} />
                  {uploadingImage === `team-${index}` ? 'Uploading...' : member.image_url ? 'Change Image' : 'Upload Image'}
                </button>
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500, color: '#374151' }}>Name</label>
                <input
                  type="text"
                  value={member.name}
                  onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                  placeholder="Enter name"
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
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500, color: '#374151' }}>Position</label>
                <input
                  type="text"
                  value={member.position}
                  onChange={(e) => updateTeamMember(index, 'position', e.target.value)}
                  placeholder="Enter position"
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
                  value={member.description}
                  onChange={(e) => updateTeamMember(index, 'description', e.target.value)}
                  placeholder="Enter description"
                  rows={3}
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500, color: '#374151' }}>Facebook URL</label>
                  <input
                    type="url"
                    value={member.facebook_url || ''}
                    onChange={(e) => updateTeamMember(index, 'facebook_url', e.target.value)}
                    placeholder="https://facebook.com/..."
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
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500, color: '#374151' }}>LinkedIn URL</label>
                  <input
                    type="url"
                    value={member.linkedin_url || ''}
                    onChange={(e) => updateTeamMember(index, 'linkedin_url', e.target.value)}
                    placeholder="https://linkedin.com/in/..."
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
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500, color: '#374151' }}>Instagram URL</label>
                  <input
                    type="url"
                    value={member.instagram_url || ''}
                    onChange={(e) => updateTeamMember(index, 'instagram_url', e.target.value)}
                    placeholder="https://instagram.com/..."
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
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
          <button
            type="submit"
            disabled={saving}
            className='btn btn_primary'
            style={{
              padding: '12px 24px',
              borderRadius: '6px',
              border: 'none',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 600,
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Save About Page'}
          </button>
        </div>
      </form>
    </div>
  );
}
