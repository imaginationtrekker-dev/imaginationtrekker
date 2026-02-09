"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase-browser";
import { gsap } from "gsap";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";
import "../home/style.css";
import "./gallery.css";

interface GalleryImage {
  id: string;
  image_url: string;
  title?: string;
  alt_text?: string;
  display_order: number;
}

export default function GalleryPage() {
  const [allImages, setAllImages] = useState<GalleryImage[]>([]);
  const [displayedImages, setDisplayedImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const imagesPerPage = 12;
  const galleryGridRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lightboxImageRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    loadAllImages();
  }, []);

  useEffect(() => {
    // Update displayed images when allImages or currentPage changes
    const endIndex = currentPage * imagesPerPage;
    setDisplayedImages(allImages.slice(0, endIndex));
  }, [allImages, currentPage]);

  const loadAllImages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("gallery")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAllImages(data || []);
      // Initially show first page
      setDisplayedImages((data || []).slice(0, imagesPerPage));
    } catch (err: any) {
      console.error("Error loading gallery images:", err);
      setAllImages([]);
      setDisplayedImages([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreImages = () => {
    setLoadingMore(true);
    // Simulate a small delay for better UX
    setTimeout(() => {
      setCurrentPage((prev) => prev + 1);
      setLoadingMore(false);
    }, 300);
  };

  const hasMoreImages = displayedImages.length < allImages.length;

  // GSAP animations for gallery items on load
  useEffect(() => {
    if (loading || displayedImages.length === 0 || !galleryGridRef.current) return;

    const items = itemRefs.current.filter(Boolean) as HTMLElement[];
    if (items.length === 0) return;

    // Get only newly added items (items that weren't animated before)
    const startIndex = displayedImages.length - imagesPerPage;
    const newItems = items.slice(Math.max(0, startIndex));

    if (newItems.length === 0) return;

    // Set initial state for new items
    gsap.set(newItems, {
      opacity: 0,
      y: 50,
      scale: 0.9,
    });

    // Animate new items with stagger
    gsap.to(newItems, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.8,
      stagger: 0.1,
      ease: "power3.out",
    });
  }, [loading, displayedImages.length]);

  // GSAP hover animations
  useEffect(() => {
    const items = itemRefs.current.filter(Boolean) as HTMLElement[];
    
    items.forEach((item) => {
      const image = item.querySelector(".gallery-page-image") as HTMLElement;
      const overlay = item.querySelector(".gallery-page-overlay") as HTMLElement;

      const handleMouseEnter = () => {
        gsap.to(image, {
          scale: 1.1,
          duration: 0.5,
          ease: "power2.out",
        });
        gsap.to(overlay, {
          opacity: 1,
          duration: 0.3,
          ease: "power2.out",
        });
        gsap.to(item, {
          y: -8,
          duration: 0.4,
          ease: "power2.out",
        });
      };

      const handleMouseLeave = () => {
        gsap.to(image, {
          scale: 1,
          duration: 0.4,
          ease: "power2.out",
        });
        gsap.to(overlay, {
          opacity: 0,
          duration: 0.3,
          ease: "power2.out",
        });
        gsap.to(item, {
          y: 0,
          duration: 0.4,
          ease: "power2.out",
        });
      };

      item.addEventListener("mouseenter", handleMouseEnter);
      item.addEventListener("mouseleave", handleMouseLeave);

      return () => {
        item.removeEventListener("mouseenter", handleMouseEnter);
        item.removeEventListener("mouseleave", handleMouseLeave);
      };
    });
  }, [displayedImages]);

  const openLightbox = (index: number) => {
    // Find the actual index in allImages array
    const imageId = displayedImages[index].id;
    const actualIndex = allImages.findIndex(img => img.id === imageId);
    setSelectedImageIndex(actualIndex >= 0 ? actualIndex : index);
    setLightboxOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = "unset";
  };

  const goToNext = () => {
    setSelectedImageIndex((prev) => (prev >= allImages.length - 1 ? 0 : prev + 1));
  };

  const goToPrev = () => {
    setSelectedImageIndex((prev) => (prev <= 0 ? allImages.length - 1 : prev - 1));
  };

  // GSAP animation for lightbox image change
  useEffect(() => {
    if (!lightboxOpen || !lightboxImageRef.current) return;

    gsap.fromTo(
      lightboxImageRef.current,
      { opacity: 0, scale: 0.9 },
      { opacity: 1, scale: 1, duration: 0.4, ease: "power2.out" }
    );
  }, [selectedImageIndex, lightboxOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeLightbox();
      } else if (e.key === "ArrowRight") {
        setSelectedImageIndex((prev) => (prev >= allImages.length - 1 ? 0 : prev + 1));
      } else if (e.key === "ArrowLeft") {
        setSelectedImageIndex((prev) => (prev <= 0 ? allImages.length - 1 : prev - 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, allImages.length]);

  return (
    <>
      <Header />
      <main className="gallery-page-main">
        <section className="gallery-page-section">
          <div className="gallery-page-container">
            <div className="gallery-page-header">
              <span className="gallery-page-tag">Gallery</span>
              <h1 className="gallery-page-title">Our Adventure Moments</h1>
              <p className="gallery-page-subtitle">
                Capturing the beauty of our journeys through the Himalayas
              </p>
            </div>

            {loading ? (
              <div className="gallery-page-loading">
                <div className="loading-spinner"></div>
                <p>Loading gallery...</p>
              </div>
            ) : displayedImages.length === 0 ? (
              <div className="gallery-page-empty">
                <p>No images available yet.</p>
              </div>
            ) : (
              <>
                <div className="gallery-page-grid" ref={galleryGridRef}>
                  {displayedImages.map((image, index) => (
                    <div
                      key={image.id}
                      ref={(el) => {
                        itemRefs.current[index] = el;
                      }}
                      className="gallery-page-item"
                      onClick={() => openLightbox(index)}
                    >
                      <div className="gallery-page-image-wrapper">
                        <Image
                          src={image.image_url}
                          alt={image.alt_text || image.title || `Gallery image ${index + 1}`}
                          width={800}
                          height={600}
                          className="gallery-page-image"
                          loading="lazy"
                          unoptimized
                        />
                        <div className="gallery-page-overlay">
                          <svg
                            width="48"
                            height="48"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                          </svg>
                          {image.title && (
                            <p className="gallery-page-item-title">{image.title}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {hasMoreImages && (
                  <div className="gallery-page-load-more">
                    <button
                      className="show-more-btn"
                      onClick={loadMoreImages}
                      disabled={loadingMore}
                    >
                      {loadingMore ? (
                        <>
                          <div className="loading-spinner-small"></div>
                          <span>Loading...</span>
                        </>
                      ) : (
                        <>
                          <span>Show More</span>
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="6 9 12 15 18 9"></polyline>
                          </svg>
                        </>
                      )}
                    </button>
                    <p className="gallery-page-count">
                      Showing {displayedImages.length} of {allImages.length} images
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      {/* Lightbox Modal with Slider */}
      {lightboxOpen && allImages.length > 0 && (
        <div
          className="lightbox-overlay"
          onClick={closeLightbox}
          tabIndex={0}
        >
          <button
            className="lightbox-close"
            onClick={closeLightbox}
            aria-label="Close lightbox"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          {allImages.length > 1 && (
            <>
              <button
                className="lightbox-nav lightbox-prev"
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrev();
                }}
                aria-label="Previous image"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <button
                className="lightbox-nav lightbox-next"
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                aria-label="Next image"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </>
          )}

          <div
            className="lightbox-content"
            onClick={(e) => e.stopPropagation()}
            ref={lightboxImageRef}
          >
            <Image
              src={allImages[selectedImageIndex].image_url}
              alt={allImages[selectedImageIndex].alt_text || allImages[selectedImageIndex].title || `Gallery image ${selectedImageIndex + 1}`}
              width={1200}
              height={800}
              className="lightbox-image"
              priority
              unoptimized
            />
            {allImages.length > 1 && (
              <div className="lightbox-counter">
                {selectedImageIndex + 1} / {allImages.length}
              </div>
            )}
            {allImages[selectedImageIndex].title && (
              <div className="lightbox-title">
                {allImages[selectedImageIndex].title}
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
      <FloatingButtons />
    </>
  );
}
