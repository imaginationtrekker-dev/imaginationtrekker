"use client";

import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";

interface Testimonial {
  id?: string;
  name: string;
  quote: string;
  review: string;
  location: string;
  rating: number;
}

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardsToShow = 3;
  const maxIndex = Math.max(0, testimonials.length - cardsToShow);

  // Fetch testimonials from API
  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/testimonials');
        
        if (!response.ok) {
          throw new Error("Failed to fetch testimonials");
        }

        const result = await response.json();
        if (result.testimonials && result.testimonials.length > 0) {
          // Map database fields to component interface
          const mappedTestimonials = result.testimonials.map((t: any) => ({
            id: t.id,
            name: t.name || 'Anonymous',
            quote: t.title || t.quote || '',
            review: t.description || t.review || t.testimonial_text || t.message || '',
            location: t.location || '',
            rating: t.rating || 5.0,
          }));
          setTestimonials(mappedTestimonials);
        } else {
          // Fallback to empty array if no testimonials
          setTestimonials([]);
        }
      } catch (err) {
        console.error("Error loading testimonials:", err);
        setTestimonials([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  // GSAP slider animation
  useEffect(() => {
    if (!trackRef.current || !trackRef.current.children[0] || testimonials.length === 0) return;

    const firstCard = trackRef.current.children[0] as HTMLElement;
    const cardWidth = firstCard.getBoundingClientRect().width;
    const gap = 32; // 2rem = 32px
    const translateX = -(currentIndex * (cardWidth + gap));

    gsap.to(trackRef.current, {
      x: translateX,
      duration: 0.6,
      ease: "power2.out",
    });
  }, [currentIndex, testimonials.length]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (loading) {
    return (
      <section className="testimonials-section">
        <div className="testimonials-container">
          <div className="testimonials-header">
            <span className="testimonials-tag">Testimonial</span>
            <h2 className="testimonials-title">Real Stories from Happy Travelers</h2>
          </div>
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <p>Loading testimonials...</p>
          </div>
        </div>
      </section>
    );
  }

  if (testimonials.length === 0) {
    return (
      <section className="testimonials-section">
        <div className="testimonials-container">
          <div className="testimonials-header">
            <span className="testimonials-tag">Testimonial</span>
            <h2 className="testimonials-title">Real Stories from Happy Travelers</h2>
          </div>
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <p>No testimonials available at the moment.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="testimonials-section">
      <div className="testimonials-container">
        <div className="testimonials-header">
          <span className="testimonials-tag">Testimonial</span>
          <h2 className="testimonials-title">Real Stories from Happy Travelers</h2>
        </div>

        <div className="testimonials-slider-wrapper">
          <button
            className="testimonials-nav-btn testimonials-nav-prev"
            onClick={goToPrev}
            aria-label="Previous testimonial"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'scaleX(-1)' }}>
              <path fillRule="evenodd" clipRule="evenodd" d="M21 12C21 12.5523 20.5523 13 20 13H4C3.44772 13 3 12.5523 3 12C3 11.4477 3.44772 11 4 11H20C20.5523 11 21 11.4477 21 12Z" fill="currentColor"></path>
              <path d="M18.9721 12C18.8788 11.8452 18.6832 11.5671 18.4693 11.3251C18.0436 10.8432 17.4568 10.2928 16.8443 9.76105C16.2368 9.23357 15.6263 8.74365 15.166 8.38437C14.9363 8.20515 14.54 7.90576 14.4068 7.80521C13.9622 7.47768 13.8672 6.85173 14.1947 6.40706C14.5222 5.96236 15.1482 5.86736 15.5929 6.19487L15.5966 6.19767C15.741 6.30672 16.1597 6.62291 16.3964 6.80767C16.8735 7.18002 17.5131 7.69303 18.1555 8.25084C18.793 8.80434 19.4563 9.4216 19.9681 10.0008C20.2229 10.2892 20.4614 10.5918 20.6415 10.8906C20.8051 11.162 20.9999 11.5568 20.9999 12C20.9999 12.4431 20.8051 12.838 20.6415 13.1094C20.4614 13.4082 20.2229 13.7108 19.9681 13.9992C19.4563 14.5784 18.793 15.1957 18.1555 15.7492C17.5131 16.307 16.8735 16.82 16.3964 17.1923C16.1597 17.3771 15.7413 17.6931 15.5969 17.8021L15.5929 17.8051C15.1482 18.1326 14.5222 18.0376 14.1947 17.5929C13.8672 17.1483 13.9622 16.5223 14.4068 16.1948C14.54 16.0942 14.9363 15.7948 15.166 15.6156C15.6263 15.2564 16.2368 14.7664 16.8443 14.2389C17.4568 13.7072 18.0436 13.1568 18.4693 12.6749C18.6832 12.4329 18.8788 12.1548 18.9721 12Z" fill="currentColor"></path>
            </svg>
          </button>

          <div className="testimonials-slider">
            <div className="testimonials-track" ref={trackRef}>
              {testimonials.map((testimonial, index) => (
                <div key={index} className="testimonial-card">
                  <div className="testimonial-header">
                    <div className="testimonial-avatar">
                      <span className="testimonial-initials">
                        {testimonial.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </span>
                    </div>
                    <div className="testimonial-header-info">
                      <h3 className="testimonial-name">{testimonial.name}</h3>
                      <div className="testimonial-rating-stars">
                        {Array.from({ length: 5 }).map((_, i) => {
                          const isFilled = i < Math.floor(testimonial.rating);
                          const isHalf = i < testimonial.rating && i >= Math.floor(testimonial.rating);
                          return (
                            <svg
                              key={i}
                              className={`star ${isFilled ? "filled" : isHalf ? "half" : ""}`}
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              {isHalf ? (
                                <>
                                  <defs>
                                    <linearGradient id={`half-star-${index}-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                      <stop offset="50%" stopColor="#FFD700" />
                                      <stop offset="50%" stopColor="#E5E7EB" />
                                    </linearGradient>
                                  </defs>
                                  <path
                                    d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                                    fill={`url(#half-star-${index}-${i})`}
                                    stroke="#FFD700"
                                    strokeWidth="1"
                                  />
                                </>
                              ) : (
                                <path
                                  d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                                  fill={isFilled ? "#FFD700" : "#E5E7EB"}
                                  stroke={isFilled ? "#FFD700" : "#D1D5DB"}
                                  strokeWidth="1"
                                />
                              )}
                            </svg>
                          );
                        })}
                        <span className="testimonial-rating-number">{testimonial.rating}</span>
                      </div>
                    </div>
                  </div>
                  
                  <h4 className="testimonial-quote">{testimonial.quote}</h4>
                  
                  <p className="testimonial-review">{testimonial.review}</p>
                  
                  <div className="testimonial-footer">
                    <p className="testimonial-location">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      {testimonial.location}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            className="testimonials-nav-btn testimonials-nav-next"
            onClick={goToNext}
            aria-label="Next testimonial"
          >
         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M21 12C21 12.5523 20.5523 13 20 13H4C3.44772 13 3 12.5523 3 12C3 11.4477 3.44772 11 4 11H20C20.5523 11 21 11.4477 21 12Z" fill="currentColor"></path><path d="M18.9721 12C18.8788 11.8452 18.6832 11.5671 18.4693 11.3251C18.0436 10.8432 17.4568 10.2928 16.8443 9.76105C16.2368 9.23357 15.6263 8.74365 15.166 8.38437C14.9363 8.20515 14.54 7.90576 14.4068 7.80521C13.9622 7.47768 13.8672 6.85173 14.1947 6.40706C14.5222 5.96236 15.1482 5.86736 15.5929 6.19487L15.5966 6.19767C15.741 6.30672 16.1597 6.62291 16.3964 6.80767C16.8735 7.18002 17.5131 7.69303 18.1555 8.25084C18.793 8.80434 19.4563 9.4216 19.9681 10.0008C20.2229 10.2892 20.4614 10.5918 20.6415 10.8906C20.8051 11.162 20.9999 11.5568 20.9999 12C20.9999 12.4431 20.8051 12.838 20.6415 13.1094C20.4614 13.4082 20.2229 13.7108 19.9681 13.9992C19.4563 14.5784 18.793 15.1957 18.1555 15.7492C17.5131 16.307 16.8735 16.82 16.3964 17.1923C16.1597 17.3771 15.7413 17.6931 15.5969 17.8021L15.5929 17.8051C15.1482 18.1326 14.5222 18.0376 14.1947 17.5929C13.8672 17.1483 13.9622 16.5223 14.4068 16.1948C14.54 16.0942 14.9363 15.7948 15.166 15.6156C15.6263 15.2564 16.2368 14.7664 16.8443 14.2389C17.4568 13.7072 18.0436 13.1568 18.4693 12.6749C18.6832 12.4329 18.8788 12.1548 18.9721 12Z" fill="currentColor"></path></svg>
          </button>
        </div>

        {/* Dots indicator */}
        <div className="testimonials-dots">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              className={`testimonials-dot ${index === currentIndex ? "active" : ""}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
