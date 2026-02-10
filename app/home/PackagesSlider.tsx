"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { gsap } from "gsap";
import { stripHtmlTags } from "@/lib/utils";

interface Package {
  id: string;
  package_name: string;
  slug: string;
  package_description?: string;
  thumbnail_image_url?: string;
  package_duration?: string;
  difficulty?: string;
  altitude?: string;
  price?: number;
  discounted_price?: number;
}

export default function PackagesSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [cardsToShow, setCardsToShow] = useState(3);
  const trackRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const maxIndex = Math.max(0, packages.length - cardsToShow);

  // Handle responsive cards to show
  useEffect(() => {
    const updateCardsToShow = () => {
      if (window.innerWidth <= 768) {
        setCardsToShow(1);
      } else if (window.innerWidth <= 1024) {
        setCardsToShow(2);
      } else {
        setCardsToShow(3);
      }
    };

    updateCardsToShow();
    window.addEventListener("resize", updateCardsToShow);
    return () => window.removeEventListener("resize", updateCardsToShow);
  }, []);

  // Fetch packages from API
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/packages?pageNumber=1');
        
        if (!response.ok) {
          throw new Error("Failed to fetch packages");
        }

        const result = await response.json();
        if (result.packages) {
          // Limit to 12 packages for homepage
          setPackages((result.packages as Package[]).slice(0, 12));
        }
      } catch (err) {
        console.error("Error loading packages:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  // GSAP slider animation
  useEffect(() => {
    if (!trackRef.current || !trackRef.current.children[0] || packages.length === 0) return;

    const firstCard = trackRef.current.children[0] as HTMLElement;
    const cardWidth = firstCard.getBoundingClientRect().width;
    const gap = 24; // 1.5rem = 24px
    const translateX = -(currentIndex * (cardWidth + gap));

    gsap.to(trackRef.current, {
      x: translateX,
      duration: 0.6,
      ease: "power2.out",
    });
  }, [currentIndex, packages]);

  // Drag functionality for mouse and touch
  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider || packages.length === 0) return;

    let dragStartX = 0;
    let dragStartIndex = 0;
    let isDraggingState = false;
    let hasMovedSignificantly = false;

    const handleStart = (e: MouseEvent | TouchEvent) => {
      // Don't start drag if clicking on a link or button
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      const button = target.closest('button');
      
      if (link || button) {
        // Allow the link/button to handle the click normally
        return;
      }
      
      isDraggingState = true;
      hasMovedSignificantly = false;
      setIsDragging(true);
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      dragStartX = clientX;
      dragStartIndex = currentIndex;
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingState) return;
      
      // Check if we're over a link or button - if so, cancel drag
      const target = e.target as HTMLElement;
      if (target.closest('a') || target.closest('button')) {
        isDraggingState = false;
        setIsDragging(false);
        hasMovedSignificantly = false;
        return;
      }
      
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const diff = dragStartX - clientX;
      const moveThreshold = 10; // Threshold to consider it a drag (not a click)
      const slideThreshold = 50; // Minimum drag distance to trigger slide change

      // Only prevent default if we've moved significantly (to allow clicks to work)
      if (Math.abs(diff) > moveThreshold) {
        hasMovedSignificantly = true;
        e.preventDefault();
      }

      if (Math.abs(diff) > slideThreshold) {
        if (diff > 0 && dragStartIndex < maxIndex) {
          setCurrentIndex(dragStartIndex + 1);
          isDraggingState = false;
          setIsDragging(false);
          hasMovedSignificantly = false;
        } else if (diff < 0 && dragStartIndex > 0) {
          setCurrentIndex(dragStartIndex - 1);
          isDraggingState = false;
          setIsDragging(false);
          hasMovedSignificantly = false;
        }
      }
    };

    const handleEnd = (e: MouseEvent | TouchEvent) => {
      // Check if we're ending on a link or button - if so, allow navigation
      const target = e.target as HTMLElement;
      if (target.closest('a') || target.closest('button')) {
        // Don't prevent default - let the link/button handle the click
        isDraggingState = false;
        setIsDragging(false);
        hasMovedSignificantly = false;
        return;
      }
      
      // If we didn't move significantly, it was a click - allow it to proceed
      if (isDraggingState && !hasMovedSignificantly) {
        // Don't prevent default - let the click event fire
        isDraggingState = false;
        setIsDragging(false);
        return;
      }
      
      // If we dragged, prevent any click events
      if (hasMovedSignificantly) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      isDraggingState = false;
      setIsDragging(false);
      hasMovedSignificantly = false;
    };

    // Mouse events
    slider.addEventListener('mousedown', handleStart);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);

    // Touch events
    slider.addEventListener('touchstart', handleStart, { passive: false });
    slider.addEventListener('touchmove', handleMove, { passive: false });
    slider.addEventListener('touchend', handleEnd);

    return () => {
      slider.removeEventListener('mousedown', handleStart);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      slider.removeEventListener('touchstart', handleStart);
      slider.removeEventListener('touchmove', handleMove);
      slider.removeEventListener('touchend', handleEnd);
    };
  }, [currentIndex, maxIndex, packages.length]);

  // Setup GSAP hover animations for book buttons
  useEffect(() => {
    buttonRefs.current.forEach((button) => {
      if (!button) return;

      const icon = button.querySelector(".package-book-btn-icon");
      const text = button.querySelector(".package-book-btn-text");

      const handleMouseEnter = () => {
        if (icon && text) {
          gsap.to(icon, {
            scale: 1.15,
            rotation: 360,
            duration: 0.5,
            ease: "back.out(1.7)",
          });
          gsap.to(text, {
            x: 6,
            duration: 0.4,
            ease: "power2.out",
          });
          gsap.to(button, {
            scale: 1.05,
            duration: 0.4,
            ease: "power2.out",
          });
        }
      };

      const handleMouseLeave = () => {
        if (icon && text) {
          gsap.to(icon, {
            scale: 1,
            rotation: 0,
            duration: 0.4,
            ease: "power2.out",
          });
          gsap.to(text, {
            x: 0,
            duration: 0.4,
            ease: "power2.out",
          });
          gsap.to(button, {
            scale: 1,
            duration: 0.4,
            ease: "power2.out",
          });
        }
      };

      button.addEventListener("mouseenter", handleMouseEnter);
      button.addEventListener("mouseleave", handleMouseLeave);

      return () => {
        button.removeEventListener("mouseenter", handleMouseEnter);
        button.removeEventListener("mouseleave", handleMouseLeave);
      };
    });
  }, [packages]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const formatPrice = (price?: number) => {
    if (!price) return "Contact Us";
    return `₹${price.toLocaleString()}`;
  };

  if (loading) {
    return (
      <section className="packages-section">
        <div className="packages-container">
          <div className="packages-header">
            <div className="packages-header-left">
              <span className="packages-tag">Packages</span>
              <h2 className="packages-title">
                TOURS FOR EVERY TYPE OF TRAVELER
              </h2>
            </div>
          </div>
          <div style={{ textAlign: "center", padding: "4rem 0" }}>
            <p>Loading packages...</p>
          </div>
        </div>
      </section>
    );
  }

  if (packages.length === 0) {
    return (
      <section className="packages-section">
        <div className="packages-container">
          <div className="packages-header">
            <div className="packages-header-left">
              <span className="packages-tag">Packages</span>
              <h2 className="packages-title">
                TOURS FOR EVERY TYPE OF TRAVELER
              </h2>
            </div>
          </div>
          <div style={{ textAlign: "center", padding: "4rem 0" }}>
            <p>No packages available at the moment.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="packages-section">
      <div className="packages-container">
        {/* Header */}
        <div className="packages-header">
          <div className="packages-header-left">
            <span className="packages-tag">Packages</span>
            <h2 className="packages-title">
              TOURS FOR EVERY TYPE OF <span className="packages-title-highlight">TRAVELER</span>
            </h2>
          </div>
        </div>

        {/* Packages Slider */}
        <div className="packages-slider-wrapper">
          <div 
            className="packages-slider"
            ref={sliderRef}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            <div className="packages-track" ref={trackRef}>
              {packages.map((pkg, index) => (
                <div key={pkg.id} className="package-card">
                  <Link href={`/packages/${pkg.slug}`} className="package-card-image-link">
                    <div className="package-card-image">
                      <Image
                        src={pkg.thumbnail_image_url || "/images/package-image.webp"}
                        alt={pkg.package_name}
                        fill
                        className="package-image"
                      />
                    </div>
                  </Link>
                  <div className="package-card-content">
                    <h3 className="package-card-title">{pkg.package_name}</h3>
                    <p className="package-card-description">
                      {stripHtmlTags(pkg.package_description) || "Experience an amazing adventure with our carefully crafted package."}
                    </p>
                    <div className="package-details-bar">
                      {pkg.difficulty && (
                        <div className="package-detail-item">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#166534"
                            strokeWidth="2"
                          >
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                          </svg>
                          <span>{pkg.difficulty}</span>
                        </div>
                      )}
                      {pkg.package_duration && (
                        <div className="package-detail-item">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#166534"
                            strokeWidth="2"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          <span>{pkg.package_duration}</span>
                        </div>
                      )}
                    </div>
                    <div className="package-card-footer">
                      <div className="package-price">
                        <span className="package-price-label">Start From</span>
                        <span className="package-price-amount">
                          {pkg.discounted_price ? formatPrice(pkg.discounted_price) : formatPrice(pkg.price)}
                        </span>
                      </div>
                      <Link href={`/packages/${pkg.slug}`}>
                        <button
                          className="package-book-btn"
                          ref={(el) => {
                            buttonRefs.current[index] = el;
                          }}
                        >
                          <div className="package-book-btn-icon">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </div>
                          <span className="package-book-btn-text">View Details</span>
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation Dots */}
        <div className="packages-dots testimonials-dots">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              className={`testimonials-dot ${index === currentIndex ? "active" : ""}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>



        {/* Explore All Package Button - Bottom Middle */}
        <div className="packages-footer">
          <Link href="/packages">
            <button className="explore-all-btn">
              Explore All Package
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M21 12C21 12.5523 20.5523 13 20 13H4C3.44772 13 3 12.5523 3 12C3 11.4477 3.44772 11 4 11H20C20.5523 11 21 11.4477 21 12Z" fill="currentColor"></path>
                <path d="M18.9721 12C18.8788 11.8452 18.6832 11.5671 18.4693 11.3251C18.0436 10.8432 17.4568 10.2928 16.8443 9.76105C16.2368 9.23357 15.6263 8.74365 15.166 8.38437C14.9363 8.20515 14.54 7.90576 14.4068 7.80521C13.9622 7.47768 13.8672 6.85173 14.1947 6.40706C14.5222 5.96236 15.1482 5.86736 15.5929 6.19487L15.5966 6.19767C15.741 6.30672 16.1597 6.62291 16.3964 6.80767C16.8735 7.18002 17.5131 7.69303 18.1555 8.25084C18.793 8.80434 19.4563 9.4216 19.9681 10.0008C20.2229 10.2892 20.4614 10.5918 20.6415 10.8906C20.8051 11.162 20.9999 11.5568 20.9999 12C20.9999 12.4431 20.8051 12.838 20.6415 13.1094C20.4614 13.4082 20.2229 13.7108 19.9681 13.9992C19.4563 14.5784 18.793 15.1957 18.1555 15.7492C17.5131 16.307 16.8735 16.82 16.3964 17.1923C16.1597 17.3771 15.7413 17.6931 15.5969 17.8021L15.5929 17.8051C15.1482 18.1326 14.5222 18.0376 14.1947 17.5929C13.8672 17.1483 13.9622 16.5223 14.4068 16.1948C14.54 16.0942 14.9363 15.7948 15.166 15.6156C15.6263 15.2564 16.2368 14.7664 16.8443 14.2389C17.4568 13.7072 18.0436 13.1568 18.4693 12.6749C18.6832 12.4329 18.8788 12.1548 18.9721 12Z" fill="currentColor"></path>
              </svg>
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
