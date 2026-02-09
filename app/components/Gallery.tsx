"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "gsap";

interface GalleryImage {
  id: string;
  image_url: string;
  title?: string;
  alt_text?: string;
  display_order: number;
}

export default function Gallery() {
  const [allImages, setAllImages] = useState<GalleryImage[]>([]);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const galleryGridRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lightboxImageRef = useRef<HTMLDivElement>(null);
  const marqueeLeftRef = useRef<HTMLDivElement>(null);
  const marqueeRightRef = useRef<HTMLDivElement>(null);
  const maxDisplayImages = 20;

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/gallery');
      
      if (!response.ok) {
        throw new Error("Failed to fetch gallery images");
      }

      const result = await response.json();
      const data = result.images || [];
      setAllImages(data);
      // Show only first 20 images
      setImages(data.slice(0, maxDisplayImages));
    } catch (err: any) {
      console.error("Error loading gallery images:", err);
      setAllImages([]);
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  // GSAP marquee animations for two rows
  useEffect(() => {
    if (loading || images.length === 0) return;

    // Use requestAnimationFrame and setTimeout to ensure DOM is fully rendered
    const initMarquee = () => {
      // Left direction marquee
      if (marqueeLeftRef.current) {
        const marquee = marqueeLeftRef.current;
        const marqueeContent = marquee.querySelector(".gallery-marquee-content") as HTMLElement;

        if (marqueeContent && marqueeContent.children.length > 0) {
          // Clear any existing clones
          const existingClones = marquee.querySelectorAll(".gallery-marquee-content:not(:first-child)");
          existingClones.forEach(clone => clone.remove());

          // Clone the content for seamless loop
          const clone = marqueeContent.cloneNode(true) as HTMLElement;
          marquee.appendChild(clone);

          // Get the width of the content
          const contentWidth = marqueeContent.getBoundingClientRect().width;

          // Kill any existing animations
          gsap.killTweensOf(marquee);

          // Reset position
          gsap.set(marquee, { x: 0 });

          // Create the infinite animation (left direction - negative x)
          gsap.to(marquee, {
            x: -contentWidth,
            duration: 100,
            ease: "none",
            repeat: -1,
          });
        }
      }

      // Right direction marquee
      if (marqueeRightRef.current) {
        const marquee = marqueeRightRef.current;
        const marqueeContent = marquee.querySelector(".gallery-marquee-content") as HTMLElement;

        if (marqueeContent && marqueeContent.children.length > 0) {
          // Clear any existing clones
          const existingClones = marquee.querySelectorAll(".gallery-marquee-content:not(:first-child)");
          existingClones.forEach(clone => clone.remove());

          // Clone the content for seamless loop
          const clone = marqueeContent.cloneNode(true) as HTMLElement;
          marquee.appendChild(clone);

          // Get the width of the content
          const contentWidth = marqueeContent.getBoundingClientRect().width;

          // Kill any existing animations
          gsap.killTweensOf(marquee);

          // Start from negative position for seamless right scroll
          gsap.set(marquee, { x: -contentWidth });

          // Create the infinite animation (right direction - positive x)
          gsap.to(marquee, {
            x: 0,
            duration: 100,
            ease: "none",
            repeat: -1,
          });
        }
      }
    };

    // Use requestAnimationFrame to ensure layout is complete
    requestAnimationFrame(() => {
      setTimeout(initMarquee, 200);
    });

    return () => {
      if (marqueeLeftRef.current) gsap.killTweensOf(marqueeLeftRef.current);
      if (marqueeRightRef.current) gsap.killTweensOf(marqueeRightRef.current);
    };
  }, [loading, images]);

  // GSAP hover animations for marquee items
  useEffect(() => {
    if (loading || images.length === 0) return;

    const leftItems = marqueeLeftRef.current?.querySelectorAll(".gallery-marquee-item") || [];
    const rightItems = marqueeRightRef.current?.querySelectorAll(".gallery-marquee-item") || [];
    const allItems = [...Array.from(leftItems), ...Array.from(rightItems)] as HTMLElement[];
    
    allItems.forEach((item) => {
      const image = item.querySelector(".gallery-image") as HTMLElement;
      const overlay = item.querySelector(".gallery-overlay") as HTMLElement;

      if (!image || !overlay) return;

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
  }, [loading, images]);

  const openLightbox = (imageId: string) => {
    // Find the actual index in allImages array
    const actualIndex = allImages.findIndex(img => img.id === imageId);
    setSelectedImageIndex(actualIndex >= 0 ? actualIndex : 0);
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

  if (loading) {
    return (
      <section className="gallery-section">
        <div className="gallery-container">
          <div className="gallery-header">
            <span className="gallery-tag">Gallery</span>
            <h2 className="gallery-title">Our Adventure Moments</h2>
            <p className="gallery-subtitle">
              Capturing the beauty of our journeys through the Himalayas
            </p>
          </div>
          <div className="gallery-loading">
            <div className="loading-spinner"></div>
            <p>Loading gallery...</p>
          </div>
        </div>
      </section>
    );
  }

  if (images.length === 0) {
    return (
      <section className="gallery-section">
        <div className="gallery-container">
          <div className="gallery-header">
            <span className="gallery-tag">Gallery</span>
            <h2 className="gallery-title">Our Adventure Moments</h2>
            <p className="gallery-subtitle">
              Capturing the beauty of our journeys through the Himalayas
            </p>
          </div>
          <div className="gallery-empty">
            <p>No images available yet.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="gallery-section">
        <div className="gallery-container">
          <div className="gallery-header">
            <span className="gallery-tag">Gallery</span>
            <h2 className="gallery-title">Our Adventure Moments</h2>
            <p className="gallery-subtitle">
              Capturing the beauty of our journeys through the Himalayas
            </p>
          </div>

        </div>

        {/* Full Width Marquee Container */}
        <div className="gallery-marquee-container">
          {/* Left direction row */}
          <div ref={marqueeLeftRef} className="gallery-marquee-wrapper gallery-marquee-left">
            <div className="gallery-marquee-content">
              {images.map((image, index) => (
                <div
                  key={`left-${image.id}`}
                  className="gallery-marquee-item"
                  onClick={() => openLightbox(image.id)}
                >
                  <div className="gallery-image-wrapper">
                    <Image
                      src={image.image_url}
                      alt={image.alt_text || image.title || `Gallery image ${index + 1}`}
                      width={400}
                      height={300}
                      className="gallery-image"
                      loading="lazy"
                      unoptimized
                    />
                    <div className="gallery-overlay">
                      <svg
                        width="32"
                        height="32"
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right direction row */}
          <div ref={marqueeRightRef} className="gallery-marquee-wrapper gallery-marquee-right">
            <div className="gallery-marquee-content">
              {images.map((image, index) => (
                <div
                  key={`right-${image.id}`}
                  className="gallery-marquee-item"
                  onClick={() => openLightbox(image.id)}
                >
                  <div className="gallery-image-wrapper">
                    <Image
                      src={image.image_url}
                      alt={image.alt_text || image.title || `Gallery image ${index + 1}`}
                      width={400}
                      height={300}
                      className="gallery-image"
                      loading="lazy"
                      unoptimized
                    />
                    <div className="gallery-overlay">
                      <svg
                        width="32"
                        height="32"
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="gallery-container">

          {allImages.length > maxDisplayImages && (
            <div className="gallery-show-more">
              <Link href="/gallery" className="gallery-show-more-btn">
                <span>Show More</span>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M21 12C21 12.5523 20.5523 13 20 13H4C3.44772 13 3 12.5523 3 12C3 11.4477 3.44772 11 4 11H20C20.5523 11 21 11.4477 21 12Z" fill="currentColor"></path><path d="M18.9721 12C18.8788 11.8452 18.6832 11.5671 18.4693 11.3251C18.0436 10.8432 17.4568 10.2928 16.8443 9.76105C16.2368 9.23357 15.6263 8.74365 15.166 8.38437C14.9363 8.20515 14.54 7.90576 14.4068 7.80521C13.9622 7.47768 13.8672 6.85173 14.1947 6.40706C14.5222 5.96236 15.1482 5.86736 15.5929 6.19487L15.5966 6.19767C15.741 6.30672 16.1597 6.62291 16.3964 6.80767C16.8735 7.18002 17.5131 7.69303 18.1555 8.25084C18.793 8.80434 19.4563 9.4216 19.9681 10.0008C20.2229 10.2892 20.4614 10.5918 20.6415 10.8906C20.8051 11.162 20.9999 11.5568 20.9999 12C20.9999 12.4431 20.8051 12.838 20.6415 13.1094C20.4614 13.4082 20.2229 13.7108 19.9681 13.9992C19.4563 14.5784 18.793 15.1957 18.1555 15.7492C17.5131 16.307 16.8735 16.82 16.3964 17.1923C16.1597 17.3771 15.7413 17.6931 15.5969 17.8021L15.5929 17.8051C15.1482 18.1326 14.5222 18.0376 14.1947 17.5929C13.8672 17.1483 13.9622 16.5223 14.4068 16.1948C14.54 16.0942 14.9363 15.7948 15.166 15.6156C15.6263 15.2564 16.2368 14.7664 16.8443 14.2389C17.4568 13.7072 18.0436 13.1568 18.4693 12.6749C18.6832 12.4329 18.8788 12.1548 18.9721 12Z" fill="currentColor"></path></svg>
              </Link>
            </div>
          )}
        </div>
      </section>

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
    </>
  );
}
