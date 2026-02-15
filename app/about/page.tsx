'use client';

import { useState, useEffect } from 'react';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import Image from 'next/image';
import Link from 'next/link';
import './style.css';

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

interface GalleryImage {
  id: string;
  image_url: string;
  cloudinary_public_id: string;
  display_order: number;
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

export default function AboutPage() {
  const [aboutPage, setAboutPage] = useState<AboutPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appreciationGallery, setAppreciationGallery] = useState<GalleryImage[]>([]);
  const [recognitionGallery, setRecognitionGallery] = useState<GalleryImage[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [storyExpanded, setStoryExpanded] = useState(false);
  const [appreciationExpanded, setAppreciationExpanded] = useState(false);
  const [recognitionExpanded, setRecognitionExpanded] = useState(false);

  useEffect(() => {
    const fetchAboutPage = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/about-page');
        
        if (!response.ok) {
          throw new Error('Failed to fetch about page');
        }

        const data = await response.json();
        setAboutPage(data.aboutPage);
      } catch (err: any) {
        console.error('Error fetching about page:', err);
        setError(err.message || 'Failed to load about page');
      } finally {
        setLoading(false);
      }
    };

    const fetchGalleries = async () => {
      try {
        // Fetch appreciation letter gallery
        const appreciationResponse = await fetch('/api/about-page-gallery?section_type=appreciation_letter');
        if (appreciationResponse.ok) {
          const appreciationData = await appreciationResponse.json();
          setAppreciationGallery(appreciationData || []);
        }

        // Fetch recognition & association letter gallery
        const recognitionResponse = await fetch('/api/about-page-gallery?section_type=recognition_association_letter');
        if (recognitionResponse.ok) {
          const recognitionData = await recognitionResponse.json();
          setRecognitionGallery(recognitionData || []);
        }
      } catch (err) {
        console.error('Error fetching galleries:', err);
      }
    };

    fetchAboutPage();
    fetchGalleries();
  }, []);

  if (loading) {
    return (
      <>
        <Header />
        <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <p>Loading...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !aboutPage) {
    return (
      <>
        <Header />
        <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <p>{error || 'About page content not available.'}</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="about-page">
        {/* Banner Section (match Packages banner) */}
        <section className="about-page-banner">
          <div className="about-banner-background">
            <Image
              src="/images/banner-bg.jpg"
              alt="About us banner"
              fill
              priority
              className="about-banner-image"
            />
            <div className="about-banner-overlay"></div>
          </div>
          <div className="about-banner-content about-container">
            <h1 className="about-banner-title">About Us</h1>
            <nav className="about-breadcrumbs" aria-label="Breadcrumb">
              <Link href="/" className="about-breadcrumb-link">Home</Link>
              <span className="about-breadcrumb-separator">/</span>
              <span className="about-breadcrumb-current">About Us</span>
            </nav>
          </div>
        </section>

        {/* Our Story / About Description */}
        {aboutPage.about_description && (
          <section className="about-story-section">
            <div className="about-container">
              <h2 className="story-title">Our Story</h2>
              <div className={`about-story-layout ${aboutPage.our_story_image_url ? '' : 'no-image'}`}>
                {aboutPage.our_story_image_url ? (
                  <div className="about-story-image">
                    <Image
                      src={aboutPage.our_story_image_url}
                      alt="Our story"
                      fill
                      className="about-story-image-el"
                      sizes="(max-width: 768px) 92vw, 520px"
                    />
                  </div>
                ) : null}

                <div className="about-story-text">
                  <div
                    className={`story-content ${storyExpanded ? 'expanded' : 'collapsed'}`}
                    dangerouslySetInnerHTML={{ __html: aboutPage.about_description.replace(/\n/g, '<br />') }}
                  />
                  <button
                    type="button"
                    className="story-toggle-btn"
                    onClick={() => setStoryExpanded(!storyExpanded)}
                  >
                    {storyExpanded ? 'View less' : 'View more'}
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Mission & Vision */}
        {(aboutPage.our_mission || aboutPage.our_vision) && (
          <section className="mission-vision-section">
            <div className="about-container">
              <div className="mission-vision-grid">
                {aboutPage.our_mission && (
                  <div className="mission-vision-item">
                    <h2 className="mission-vision-title">Our Mission</h2>
                    <div className="mission-vision-separator"></div>
                    <div 
                      className="mission-vision-content"
                      dangerouslySetInnerHTML={{ __html: aboutPage.our_mission.replace(/\n/g, '<br />') }}
                    />
                  </div>
                )}
                {aboutPage.our_vision && (
                  <div className="mission-vision-item">
                    <h2 className="mission-vision-title">Our Vision</h2>
                    <div className="mission-vision-separator"></div>
                    <div 
                      className="mission-vision-content"
                      dangerouslySetInnerHTML={{ __html: aboutPage.our_vision.replace(/\n/g, '<br />') }}
                    />
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Why Choose Us */}
        {aboutPage.why_choose_us && aboutPage.why_choose_us.length > 0 && (
          <section className="why-choose-us-section">
            <div className="about-container">
              <h2 className="section-title">Why Choose Us</h2>
              <div className="why-choose-us-grid">
                {aboutPage.why_choose_us.map((item, index) => (
                  <div key={index} className="why-choose-us-card">
                    {item.icon && (
                      <div className="why-choose-us-icon">
                        {item.icon.startsWith('http') ? (
                          <Image
                            src={item.icon}
                            alt={item.title}
                            width={64}
                            height={64}
                            className="why-choose-us-icon-image"
                          />
                        ) : (
                          <span className="why-choose-us-emoji">{item.icon}</span>
                        )}
                      </div>
                    )}
                    <h3 className="why-choose-us-title">{item.title}</h3>
                    <p className="why-choose-us-description">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Appreciation Letter */}
        {(aboutPage.appreciation_letter || appreciationGallery.length > 0) && (
          <section className="appreciation-section">
            <div className="about-container">
              <h2 className="appreciation-section-title">Our Appreciation Letter</h2>
              {aboutPage.appreciation_letter && (
                <div className="appreciation-block">
                  <div 
                    className={`appreciation-content appreciation-text ${appreciationExpanded ? 'expanded' : ''}`}
                    dangerouslySetInnerHTML={{ __html: aboutPage.appreciation_letter }}
                  />
                  <button
                    type="button"
                    className="appreciation-toggle-btn"
                    onClick={() => setAppreciationExpanded(!appreciationExpanded)}
                  >
                    {appreciationExpanded ? 'Show less' : 'Show more'}
                  </button>
                </div>
              )}
              {appreciationGallery.length > 0 && (
                <div className="appreciation-gallery-grid">
                  {appreciationGallery.map((image) => (
                    <div
                      key={image.id}
                      className="gallery-item"
                      onClick={() => setPreviewImage(image.image_url)}
                    >
                      <Image
                        src={image.image_url}
                        alt={`Appreciation letter ${image.display_order}`}
                        fill
                        className="gallery-image"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Recognition & Association Letter */}
        {(aboutPage.recognition_association_letter || recognitionGallery.length > 0) && (
          <section className="appreciation-section recognition-section">
            <div className="about-container">
              <h2 className="appreciation-section-title">Our Recognition & Association Letter</h2>
              {aboutPage.recognition_association_letter && (
                <div className="appreciation-block">
                  <div 
                    className={`appreciation-content appreciation-text ${recognitionExpanded ? 'expanded' : ''}`}
                    dangerouslySetInnerHTML={{ __html: aboutPage.recognition_association_letter }}
                  />
                  <button
                    type="button"
                    className="appreciation-toggle-btn"
                    onClick={() => setRecognitionExpanded(!recognitionExpanded)}
                  >
                    {recognitionExpanded ? 'Show less' : 'Show more'}
                  </button>
                </div>
              )}
              {recognitionGallery.length > 0 && (
                <div className="appreciation-gallery-grid">
                  {recognitionGallery.map((image) => (
                    <div
                      key={image.id}
                      className="gallery-item"
                      onClick={() => setPreviewImage(image.image_url)}
                    >
                      <Image
                        src={image.image_url}
                        alt={`Recognition letter ${image.display_order}`}
                        fill
                        className="gallery-image"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Team Members */}
        {aboutPage.team_members && aboutPage.team_members.length > 0 && (
          <section className="team-section">
            <div className="about-container">
              <div className="team-header">
                <h2 className="section-title">Meet The Team</h2>
                <p className="team-description-text">
                  Our team is a blend of seasoned travelers, cultural insiders, and meticulous planners.
                </p>
              </div>

              <div className="team-cards-grid">
                {aboutPage.team_members.map((member, index) => (
                  <div key={index} className="team-card">
                    <div className="team-card-photo">
                      {member.image_url ? (
                        <Image
                          src={member.image_url}
                          alt={member.name}
                          fill
                          className="team-image"
                          sizes="(max-width: 768px) 100vw, 280px"
                        />
                      ) : (
                        <div className="team-image-placeholder">
                          <span className="team-initials">
                            {member.name ? member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="team-card-details">
                      <h3 className="team-name">{member.name}</h3>
                      {member.position && (
                        <p className="team-position">{member.position}</p>
                      )}
                      {member.description && (
                        <p className="team-description">{member.description}</p>
                      )}
                      <div className="team-social-icons">
                        {member.facebook_url && (
                          <a href={member.facebook_url} target="_blank" rel="noopener noreferrer" className="team-social-icon" aria-label="Facebook">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                          </a>
                        )}
                        {member.linkedin_url && (
                          <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer" className="team-social-icon" aria-label="LinkedIn">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                          </a>
                        )}
                        {member.instagram_url && (
                          <a href={member.instagram_url} target="_blank" rel="noopener noreferrer" className="team-social-icon" aria-label="Instagram">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Preview Modal */}
        {previewImage && (
          <div
            className="gallery-preview-modal"
            onClick={() => setPreviewImage(null)}
          >
            <button
              className="gallery-preview-close"
              onClick={() => setPreviewImage(null)}
            >
              ×
            </button>
            <div className="gallery-preview-content" onClick={(e) => e.stopPropagation()}>
              <Image
                src={previewImage}
                alt="Preview"
                width={1200}
                height={800}
                className="gallery-preview-image"
              />
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
