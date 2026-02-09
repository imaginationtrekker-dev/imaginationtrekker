"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import ContactModal from "@/app/components/ContactModal";
import { gsap } from "gsap";
import { FileText, MapPin, CheckCircle, XCircle, Navigation, HelpCircle, Calendar, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import { stripHtmlTags } from "@/lib/utils";
import "./package-details.css";
import "../../home/style.css";

interface PackageData {
  id: string;
  package_name: string;
  slug: string;
  package_description: string | null;
  gallery_images: string[] | null;
  thumbnail_image_url: string | null;
  package_duration: string | null;
  difficulty: string | null;
  altitude: string | null;
  itinerary: any[] | null;
  inclusions: string | null;
  exclusions: string | null;
  how_to_reach: string | null;
  cancellation_policy: string | null;
  refund_policy: string | null;
  faqs: any[] | null;
  booking_dates: string[] | null;
  why_choose_us: any[] | null;
  price: number | null;
  discounted_price: number | null;
}

interface PackageDetailsProps {
  packageData: PackageData;
}

// Helper function to parse HTML content into list items
function parseContentToList(html: string): string[] {
  if (!html) return [];
  
  // Extract list items from <ul> or <ol> using regex
  const liMatches = html.match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
  if (liMatches && liMatches.length > 0) {
    return liMatches.map(match => {
      const content = match.replace(/<li[^>]*>|<\/li>/gi, '').trim();
      return content;
    }).filter(item => item);
  }
  
  // Extract paragraphs
  const pMatches = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi);
  if (pMatches && pMatches.length > 0) {
    return pMatches.map(match => {
      const content = match.replace(/<p[^>]*>|<\/p>/gi, '').trim();
      return content;
    }).filter(item => item);
  }
  
  // Split by <br> tags
  const brSplit = html.split(/<br\s*\/?>/i);
  if (brSplit.length > 1) {
    return brSplit.map(item => item.trim().replace(/<[^>]*>/g, '')).filter(item => item);
  }
  
  // If no structure found, clean HTML and return as one item
  const cleaned = html.replace(/<[^>]*>/g, '').trim();
  return cleaned ? [cleaned] : [];
}

export default function PackageDetails({ packageData }: PackageDetailsProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [expandedItinerary, setExpandedItinerary] = useState<number | null>(
    packageData.itinerary && Array.isArray(packageData.itinerary) && packageData.itinerary.length > 0 ? 0 : null
  );
  const [activeSection, setActiveSection] = useState<string>("");
  const [navScrollPosition, setNavScrollPosition] = useState(0);
  const [isDatesExpanded, setIsDatesExpanded] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const navTrackRef = useRef<HTMLDivElement>(null);
  const navItemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const galleryImages = packageData.gallery_images || [];
  const displayImages = galleryImages.length > 0 ? galleryImages : packageData.thumbnail_image_url ? [packageData.thumbnail_image_url] : [];
  
  const sliderRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  // GSAP Slider Animation
  useEffect(() => {
    if (!sliderRef.current || displayImages.length <= 1) return;

    const slides = slideRefs.current.filter(Boolean) as HTMLElement[];
    if (slides.length === 0) return;

    const slideWidth = sliderRef.current.getBoundingClientRect().width;
    const translateX = -selectedImageIndex * slideWidth;

    gsap.to(sliderRef.current, {
      x: translateX,
      duration: 0.8,
      ease: "power2.out",
    });

    // Animate slide entrance
    slides.forEach((slide, index) => {
      if (index === selectedImageIndex) {
        gsap.fromTo(
          slide,
          { opacity: 0, scale: 1.1 },
          { opacity: 1, scale: 1, duration: 0.6, ease: "power2.out" }
        );
      }
    });
  }, [selectedImageIndex, displayImages.length]);

  const goToNext = () => {
    setSelectedImageIndex((prev) => (prev >= displayImages.length - 1 ? 0 : prev + 1));
  };

  const goToPrev = () => {
    setSelectedImageIndex((prev) => (prev <= 0 ? displayImages.length - 1 : prev - 1));
  };

  const handleWhatsAppClick = () => {
    const whatsappNumber = "919876543210";
    const message = encodeURIComponent(
      `Hello! I'm interested in the ${packageData.package_name} package.`
    );
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank");
  };

  const handleCallClick = () => {
    window.location.href = "tel:+919876543210";
  };

  // Get available sections with icons
  const sections = [
    { id: "description", label: "Description", icon: FileText, condition: !!packageData.package_description },
    { id: "itinerary", label: "Itinerary", icon: MapPin, condition: !!packageData.itinerary && Array.isArray(packageData.itinerary) && packageData.itinerary.length > 0 },
    { id: "inclusions", label: "Inclusions", icon: CheckCircle, condition: !!packageData.inclusions },
    { id: "exclusions", label: "Exclusions", icon: XCircle, condition: !!packageData.exclusions },
    { id: "how-to-reach", label: "How to Reach", icon: Navigation, condition: !!packageData.how_to_reach },
    { id: "faqs", label: "FAQs", icon: HelpCircle, condition: !!packageData.faqs && Array.isArray(packageData.faqs) && packageData.faqs.length > 0 },
  ].filter(section => section.condition);

  // Scroll to section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
      setActiveSection(sectionId);
    }
  };

  // Detect active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i].id);
        if (section) {
          const sectionTop = section.offsetTop;
          if (scrollPosition >= sectionTop) {
            setActiveSection(sections[i].id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Check on mount

    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

  // GSAP slider for mobile navigation
  useEffect(() => {
    if (!navTrackRef.current || typeof window === "undefined") return;
    
    const isMobile = window.innerWidth < 768;
    if (!isMobile) return;

    const activeIndex = sections.findIndex(s => s.id === activeSection);
    if (activeIndex === -1) return;

    const activeItem = navItemRefs.current[activeIndex];
    if (!activeItem) return;

    const track = navTrackRef.current;
    const trackWidth = track.getBoundingClientRect().width;
    const itemWidth = activeItem.getBoundingClientRect().width;
    const itemLeft = activeItem.offsetLeft;
    const itemCenter = itemLeft + itemWidth / 2;
    const scrollX = itemCenter - trackWidth / 2;

    gsap.to(track, {
      scrollLeft: scrollX,
      duration: 0.5,
      ease: "power2.out",
    });
  }, [activeSection, sections]);

  return (
    <>
      {/* Gallery Section with GSAP Slider */}
      {displayImages.length > 0 && (
        <section className="package-gallery-section">
          <div className="package-gallery-container">
            <div className="package-slider-wrapper">
              <div className="package-slider-track" ref={sliderRef}>
                {displayImages.map((img, index) => (
                  <div
                    key={index}
                    ref={(el) => { slideRefs.current[index] = el; }}
                    className="package-slide"
                  >
                    <div className="package-main-image">
                      <Image
                        src={img}
                        alt={`${packageData.package_name} - Image ${index + 1}`}
                        fill
                        className="package-gallery-main-img"
                        priority={index === 0}
                        onClick={() => setIsLightboxOpen(true)}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Navigation Buttons */}
              {displayImages.length > 1 && (
                <>
                  <button
                    className="package-slider-btn package-slider-btn-prev"
                    onClick={goToPrev}
                    aria-label="Previous image"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'scaleX(-1)' }}>
                      <path fillRule="evenodd" clipRule="evenodd" d="M21 12C21 12.5523 20.5523 13 20 13H4C3.44772 13 3 12.5523 3 12C3 11.4477 3.44772 11 4 11H20C20.5523 11 21 11.4477 21 12Z" fill="currentColor"></path>
                      <path d="M18.9721 12C18.8788 11.8452 18.6832 11.5671 18.4693 11.3251C18.0436 10.8432 17.4568 10.2928 16.8443 9.76105C16.2368 9.23357 15.6263 8.74365 15.166 8.38437C14.9363 8.20515 14.54 7.90576 14.4068 7.80521C13.9622 7.47768 13.8672 6.85173 14.1947 6.40706C14.5222 5.96236 15.1482 5.86736 15.5929 6.19487L15.5966 6.19767C15.741 6.30672 16.1597 6.62291 16.3964 6.80767C16.8735 7.18002 17.5131 7.69303 18.1555 8.25084C18.793 8.80434 19.4563 9.4216 19.9681 10.0008C20.2229 10.2892 20.4614 10.5918 20.6415 10.8906C20.8051 11.162 20.9999 11.5568 20.9999 12C20.9999 12.4431 20.8051 12.838 20.6415 13.1094C20.4614 13.4082 20.2229 13.7108 19.9681 13.9992C19.4563 14.5784 18.793 15.1957 18.1555 15.7492C17.5131 16.307 16.8735 16.82 16.3964 17.1923C16.1597 17.3771 15.7413 17.6931 15.5969 17.8021L15.5929 17.8051C15.1482 18.1326 14.5222 18.0376 14.1947 17.5929C13.8672 17.1483 13.9622 16.5223 14.4068 16.1948C14.54 16.0942 14.9363 15.7948 15.166 15.6156C15.6263 15.2564 16.2368 14.7664 16.8443 14.2389C17.4568 13.7072 18.0436 13.1568 18.4693 12.6749C18.6832 12.4329 18.8788 12.1548 18.9721 12Z" fill="currentColor"></path>
                    </svg>
                  </button>
                  <button
                    className="package-slider-btn package-slider-btn-next"
                    onClick={goToNext}
                    aria-label="Next image"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" clipRule="evenodd" d="M21 12C21 12.5523 20.5523 13 20 13H4C3.44772 13 3 12.5523 3 12C3 11.4477 3.44772 11 4 11H20C20.5523 11 21 11.4477 21 12Z" fill="currentColor"></path>
                      <path d="M18.9721 12C18.8788 11.8452 18.6832 11.5671 18.4693 11.3251C18.0436 10.8432 17.4568 10.2928 16.8443 9.76105C16.2368 9.23357 15.6263 8.74365 15.166 8.38437C14.9363 8.20515 14.54 7.90576 14.4068 7.80521C13.9622 7.47768 13.8672 6.85173 14.1947 6.40706C14.5222 5.96236 15.1482 5.86736 15.5929 6.19487L15.5966 6.19767C15.741 6.30672 16.1597 6.62291 16.3964 6.80767C16.8735 7.18002 17.5131 7.69303 18.1555 8.25084C18.793 8.80434 19.4563 9.4216 19.9681 10.0008C20.2229 10.2892 20.4614 10.5918 20.6415 10.8906C20.8051 11.162 20.9999 11.5568 20.9999 12C20.9999 12.4431 20.8051 12.838 20.6415 13.1094C20.4614 13.4082 20.2229 13.7108 19.9681 13.9992C19.4563 14.5784 18.793 15.1957 18.1555 15.7492C17.5131 16.307 16.8735 16.82 16.3964 17.1923C16.1597 17.3771 15.7413 17.6931 15.5969 17.8021L15.5929 17.8051C15.1482 18.1326 14.5222 18.0376 14.1947 17.5929C13.8672 17.1483 13.9622 16.5223 14.4068 16.1948C14.54 16.0942 14.9363 15.7948 15.166 15.6156C15.6263 15.2564 16.2368 14.7664 16.8443 14.2389C17.4568 13.7072 18.0436 13.1568 18.4693 12.6749C18.6832 12.4329 18.8788 12.1548 18.9721 12Z" fill="currentColor"></path>
                    </svg>
                  </button>
                  
                  {/* Slider Dots */}
                  <div className="package-slider-dots">
                    {displayImages.map((_, index) => (
                      <button
                        key={index}
                        className={`package-slider-dot ${selectedImageIndex === index ? "active" : ""}`}
                        onClick={() => setSelectedImageIndex(index)}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Section Navigation Bar - Glassmorphism Fixed Bottom */}
      {sections.length > 0 && (
        <nav className="package-section-nav" ref={navRef}>
          <div className="package-nav-container">
            <div className="package-nav-track" ref={navTrackRef}>
              {sections.map((section, index) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    ref={(el) => { navItemRefs.current[index] = el; }}
                    className={`package-nav-item ${activeSection === section.id ? "active" : ""}`}
                    onClick={() => scrollToSection(section.id)}
                  >
                    <Icon size={18} />
                    <span>{section.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      )}

      {/* Main Content Section */}
      <section className="package-content-section">
        <div className="package-content-container">
          <div className="package-content-layout">
            {/* Left Content */}
            <div className="package-content-left">
              {/* Package Header */}
              <div className="package-header">
                <nav className="package-breadcrumbs">
                  <Link href="/" className="package-breadcrumb-link">
                    Home
                  </Link>
                  <span className="package-breadcrumb-separator">/</span>
                  <Link href="/packages" className="package-breadcrumb-link">
                    Packages
                  </Link>
                  <span className="package-breadcrumb-separator">/</span>
                  <span className="package-breadcrumb-current">
                    {packageData.package_name}
                  </span>
                </nav>
                <h1 className="package-title">{packageData.package_name}</h1>
                <div className="package-meta">
                  {packageData.package_duration && (
                    <div className="package-meta-item">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>{packageData.package_duration}</span>
                    </div>
                  )}
                  {packageData.difficulty && (
                    <div className="package-meta-item">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                        <path d="M2 17l10 5 10-5" />
                        <path d="M2 12l10 5 10-5" />
                      </svg>
                      <span>{packageData.difficulty}</span>
                    </div>
                  )}
                  {packageData.altitude && (
                    <div className="package-meta-item">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span>{packageData.altitude}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {packageData.package_description && (
                <div id="description" className="package-section">
                  <h2 className="package-section-title">Description</h2>
                  <div
                    className="package-description"
                    dangerouslySetInnerHTML={{
                      __html: packageData.package_description.replace(
                        /\n/g,
                        "<br />"
                      ),
                    }}
                  />
                </div>
              )}

              {/* Itinerary with Steps Style - Collapsible */}
              {packageData.itinerary &&
                Array.isArray(packageData.itinerary) &&
                packageData.itinerary.length > 0 && (
                  <div id="itinerary" className="package-section">
                    <h2 className="package-section-title">Itinerary</h2>
                    <div className="package-itinerary-steps">
                      <div className="package-steps-row">
                        <div className="package-steps">
                          {packageData.itinerary.map((item, index) => (
                            <div key={index} className="package-step-item">
                              <div className="package-step-line-item-dot">
                                <span></span>
                              </div>
                              <button
                                className="package-step-header"
                                onClick={() => {
                                  // If clicking the currently open item, only close it if there are other items
                                  if (expandedItinerary === index) {
                                    // Don't allow closing if it's the only open item
                                    const itineraryLength = packageData.itinerary?.length || 0;
                                    if (itineraryLength > 1) {
                                      // Find the next available index to open
                                      const nextIndex = (index + 1) % itineraryLength;
                                      setExpandedItinerary(nextIndex);
                                    }
                                    // If it's the only item, keep it open (do nothing)
                                  } else {
                                    // Open the clicked item
                                    setExpandedItinerary(index);
                                  }
                                }}
                              >
                                <div className="package-step-header-content">
                
                                  {item.heading && (
                                    <p className="package-step-title">
                                      {item.heading.split(' ').map((word: string, i: number, arr: string[]) => 
                                        i === arr.length - 1 ? (
                                          <span key={i}> {word}</span>
                                        ) : (
                                          <span key={i}>{word} </span>
                                        )
                                      )}
                                    </p>
                                  )}
                                </div>
                                <div className="package-step-icon-wrapper">
                                  <svg
                                    className={`package-step-icon ${expandedItinerary === index ? "rotated" : ""}`}
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <polyline points="6 9 12 15 18 9" />
                                  </svg>
                                </div>
                              </button>
                              <div
                                className={`package-step-description-wrapper ${expandedItinerary === index ? "open" : ""}`}
                              >
                                {item.description && (
                                  <div
                                    className="package-step-description"
                                    dangerouslySetInnerHTML={{
                                      __html: item.description.replace(
                                        /\n/g,
                                        "<br />"
                                      ),
                                    }}
                                  />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {/* Inclusions */}
              {packageData.inclusions && (
                <div id="inclusions" className="package-section">
                  <h2 className="package-section-title">Inclusions</h2>
                  <div className="package-inclusions">
                    {parseContentToList(packageData.inclusions).map((item, index) => (
                      <div key={index} className="package-list-item">
                        <div className="package-list-icon">
                         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ><path fill-rule="evenodd" clip-rule="evenodd" d="M21 12C21 12.5523 20.5523 13 20 13H4C3.44772 13 3 12.5523 3 12C3 11.4477 3.44772 11 4 11H20C20.5523 11 21 11.4477 21 12Z" fill="currentColor"></path><path d="M18.9721 12C18.8788 11.8452 18.6832 11.5671 18.4693 11.3251C18.0436 10.8432 17.4568 10.2928 16.8443 9.76105C16.2368 9.23357 15.6263 8.74365 15.166 8.38437C14.9363 8.20515 14.54 7.90576 14.4068 7.80521C13.9622 7.47768 13.8672 6.85173 14.1947 6.40706C14.5222 5.96236 15.1482 5.86736 15.5929 6.19487L15.5966 6.19767C15.741 6.30672 16.1597 6.62291 16.3964 6.80767C16.8735 7.18002 17.5131 7.69303 18.1555 8.25084C18.793 8.80434 19.4563 9.4216 19.9681 10.0008C20.2229 10.2892 20.4614 10.5918 20.6415 10.8906C20.8051 11.162 20.9999 11.5568 20.9999 12C20.9999 12.4431 20.8051 12.838 20.6415 13.1094C20.4614 13.4082 20.2229 13.7108 19.9681 13.9992C19.4563 14.5784 18.793 15.1957 18.1555 15.7492C17.5131 16.307 16.8735 16.82 16.3964 17.1923C16.1597 17.3771 15.7413 17.6931 15.5969 17.8021L15.5929 17.8051C15.1482 18.1326 14.5222 18.0376 14.1947 17.5929C13.8672 17.1483 13.9622 16.5223 14.4068 16.1948C14.54 16.0942 14.9363 15.7948 15.166 15.6156C15.6263 15.2564 16.2368 14.7664 16.8443 14.2389C17.4568 13.7072 18.0436 13.1568 18.4693 12.6749C18.6832 12.4329 18.8788 12.1548 18.9721 12Z" fill="currentColor"></path></svg>
                        </div>
                        <div className="package-list-text" dangerouslySetInnerHTML={{ __html: item }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Exclusions */}
              {packageData.exclusions && (
                <div id="exclusions" className="package-section">
                  <h2 className="package-section-title">Exclusions</h2>
                  <div className="package-exclusions">
                    {parseContentToList(packageData.exclusions).map((item, index) => (
                      <div key={index} className="package-list-item">
                        <div className="package-list-icon">
                       <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ><path fill-rule="evenodd" clip-rule="evenodd" d="M21 12C21 12.5523 20.5523 13 20 13H4C3.44772 13 3 12.5523 3 12C3 11.4477 3.44772 11 4 11H20C20.5523 11 21 11.4477 21 12Z" fill="currentColor"></path><path d="M18.9721 12C18.8788 11.8452 18.6832 11.5671 18.4693 11.3251C18.0436 10.8432 17.4568 10.2928 16.8443 9.76105C16.2368 9.23357 15.6263 8.74365 15.166 8.38437C14.9363 8.20515 14.54 7.90576 14.4068 7.80521C13.9622 7.47768 13.8672 6.85173 14.1947 6.40706C14.5222 5.96236 15.1482 5.86736 15.5929 6.19487L15.5966 6.19767C15.741 6.30672 16.1597 6.62291 16.3964 6.80767C16.8735 7.18002 17.5131 7.69303 18.1555 8.25084C18.793 8.80434 19.4563 9.4216 19.9681 10.0008C20.2229 10.2892 20.4614 10.5918 20.6415 10.8906C20.8051 11.162 20.9999 11.5568 20.9999 12C20.9999 12.4431 20.8051 12.838 20.6415 13.1094C20.4614 13.4082 20.2229 13.7108 19.9681 13.9992C19.4563 14.5784 18.793 15.1957 18.1555 15.7492C17.5131 16.307 16.8735 16.82 16.3964 17.1923C16.1597 17.3771 15.7413 17.6931 15.5969 17.8021L15.5929 17.8051C15.1482 18.1326 14.5222 18.0376 14.1947 17.5929C13.8672 17.1483 13.9622 16.5223 14.4068 16.1948C14.54 16.0942 14.9363 15.7948 15.166 15.6156C15.6263 15.2564 16.2368 14.7664 16.8443 14.2389C17.4568 13.7072 18.0436 13.1568 18.4693 12.6749C18.6832 12.4329 18.8788 12.1548 18.9721 12Z" fill="currentColor"></path></svg>
                        </div>
                        <div className="package-list-text" dangerouslySetInnerHTML={{ __html: item }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* How to Reach */}
              {packageData.how_to_reach && (
                <div id="how-to-reach" className="package-section">
                  <h2 className="package-section-title">How to Reach</h2>
                  <div className="package-exclusions">
                    {parseContentToList(packageData.how_to_reach).map((item, index) => (
                      <div key={index} className="package-list-item">
                        <div className="package-list-icon">
                         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ><path fill-rule="evenodd" clip-rule="evenodd" d="M21 12C21 12.5523 20.5523 13 20 13H4C3.44772 13 3 12.5523 3 12C3 11.4477 3.44772 11 4 11H20C20.5523 11 21 11.4477 21 12Z" fill="currentColor"></path><path d="M18.9721 12C18.8788 11.8452 18.6832 11.5671 18.4693 11.3251C18.0436 10.8432 17.4568 10.2928 16.8443 9.76105C16.2368 9.23357 15.6263 8.74365 15.166 8.38437C14.9363 8.20515 14.54 7.90576 14.4068 7.80521C13.9622 7.47768 13.8672 6.85173 14.1947 6.40706C14.5222 5.96236 15.1482 5.86736 15.5929 6.19487L15.5966 6.19767C15.741 6.30672 16.1597 6.62291 16.3964 6.80767C16.8735 7.18002 17.5131 7.69303 18.1555 8.25084C18.793 8.80434 19.4563 9.4216 19.9681 10.0008C20.2229 10.2892 20.4614 10.5918 20.6415 10.8906C20.8051 11.162 20.9999 11.5568 20.9999 12C20.9999 12.4431 20.8051 12.838 20.6415 13.1094C20.4614 13.4082 20.2229 13.7108 19.9681 13.9992C19.4563 14.5784 18.793 15.1957 18.1555 15.7492C17.5131 16.307 16.8735 16.82 16.3964 17.1923C16.1597 17.3771 15.7413 17.6931 15.5969 17.8021L15.5929 17.8051C15.1482 18.1326 14.5222 18.0376 14.1947 17.5929C13.8672 17.1483 13.9622 16.5223 14.4068 16.1948C14.54 16.0942 14.9363 15.7948 15.166 15.6156C15.6263 15.2564 16.2368 14.7664 16.8443 14.2389C17.4568 13.7072 18.0436 13.1568 18.4693 12.6749C18.6832 12.4329 18.8788 12.1548 18.9721 12Z" fill="currentColor"></path></svg>
                        </div>
                        <div className="package-list-text" dangerouslySetInnerHTML={{ __html: item }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FAQs */}
              {packageData.faqs &&
                Array.isArray(packageData.faqs) &&
                packageData.faqs.length > 0 && (
                  <div id="faqs" className="package-section">
                    <h2 className="package-section-title">Frequently Asked Questions</h2>
                    <div className="package-faqs">
                      {packageData.faqs.map((faq, index) => (
                        <div key={index} className="package-faq-item">
                          <button
                            className="package-faq-question"
                            onClick={() =>
                              setExpandedFaq(expandedFaq === index ? null : index)
                            }
                          >
                            <span>{faq.question || faq.title}</span>
                            <div className="package-faq-icon-wrapper">
                              <svg
                                className={`package-faq-icon ${expandedFaq === index ? "rotated" : ""}`}
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            </div>
                          </button>
                          <div
                            className={`package-faq-answer ${expandedFaq === index ? "open" : ""}`}
                          >
                            <div className="package-faq-answer-content">
                              {faq.answer || faq.description}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Cancellation Policy and Refund Policy */}
              {(packageData.cancellation_policy || packageData.refund_policy) && (
                <div id="policies" className="package-section">
                  <div className="package-policies-section">
                    <h2 className="package-section-title">Policies</h2>
                    <div className="package-policies-grid">
                      {packageData.cancellation_policy && (
                        <div className="package-policy-box">
                          <h4 className="package-policy-title">Cancellation Policy</h4>
                          <div 
                            className="package-policy-content"
                            dangerouslySetInnerHTML={{ __html: packageData.cancellation_policy }}
                          />
                        </div>
                      )}
                      {packageData.refund_policy && (
                        <div className="package-policy-box">
                          <h4 className="package-policy-title">Refund Policy</h4>
                          <div 
                            className="package-policy-content"
                            dangerouslySetInnerHTML={{ __html: packageData.refund_policy }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Sticky Form - Premium Design */}
            <div className="package-content-right">
              <div className="package-contact-form-wrapper">
                {/* Premium Price Section */}
                <div className="package-premium-header">
                  <div className="package-price-hero">
                    {packageData.discounted_price ? (
                      <>
                        <div className="package-price-main">
                          <span className="package-price-original-striked">
                            ₹{packageData.price?.toLocaleString()}
                          </span>
                          <span className="package-price-currency">₹</span>
                          <span className="package-price-amount">
                            {packageData.discounted_price.toLocaleString()}
                          </span>
                          <span className="package-price-onwards">/onwards</span>
                        </div>
                      </>
                    ) : packageData.price ? (
                      <div className="package-price-main">
                        <span className="package-price-currency">₹</span>
                        <span className="package-price-amount">
                          {packageData.price.toLocaleString()}
                        </span>
                        <span className="package-price-onwards">/onwards</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="package-action-buttons">

                  <button
                    type="button"
                    className="package-download-btn"
                    onClick={() => {
                      // TODO: Implement PDF download
                      alert("PDF download feature coming soon!");
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    <span>Download PDF</span>
                  </button>
                </div>

                {/* Package Details Section */}
                <div className="package-details-section">
                  <h4 className="package-details-title">Package Details</h4>
                  <div className="package-details-list">
                    <div className="package-detail-row">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      <span>Pickup & Drop: Dehradun Railway Station</span>
                    </div>
                  </div>
                </div>

                {/* Booking Dates - Collapsible */}
                {packageData.booking_dates && packageData.booking_dates.length > 0 && (
                  <div className="package-booking-dates-section">
                    <button
                      type="button"
                      className="package-booking-dates-header"
                      onClick={() => setIsDatesExpanded(!isDatesExpanded)}
                    >
                      <div className="package-booking-dates-header-content">
                        <Calendar size={18} />
                        <span>Available Dates</span>
                      </div>
                      <ChevronDown 
                        size={18} 
                        className={`package-booking-dates-chevron ${isDatesExpanded ? "expanded" : ""}`}
                      />
                    </button>
                    <div className={`package-booking-dates-content ${isDatesExpanded ? "open" : ""}`}>
                      <div className="package-booking-dates-list">
                        {packageData.booking_dates.map((date, index) => {
                          const dateObj = new Date(date);
                          const formattedDate = dateObj.toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          });
                          return (
                            <div key={index} className="package-booking-date-item">
                              <Calendar size={16} />
                              <span>{formattedDate}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Contact Information */}
                <div className="package-contact-section">
                  <h4 className="package-contact-title">Need Help? Talk to our Mountain Expert</h4>
                  <a href="tel:+917060754265" className="package-call-now-btn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    <span>Call Now</span>
                  </a>
                </div>

                {/* Social Media */}
                <div className="package-social-section">
                  <h4 className="package-social-title">BE UPDATED FOR THRILLING EXPERIENCES!</h4>
                  <p className="package-social-subtitle">Follow Us On</p>
                  <div className="package-social-links">
                    <a href="#" className="package-social-link" aria-label="Facebook">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                      </svg>
                    </a>
                    <a 
                      href="https://www.instagram.com/imagination_trekker/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="package-social-link" 
                      aria-label="Instagram"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {isLightboxOpen && displayImages.length > 0 && (
        <div
          className="package-lightbox-overlay"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            className="package-lightbox-close"
            onClick={() => setIsLightboxOpen(false)}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          
          {displayImages.length > 1 && (
            <>
              <button
                className="package-lightbox-nav package-lightbox-nav-prev"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex((prev) => (prev <= 0 ? displayImages.length - 1 : prev - 1));
                }}
                aria-label="Previous image"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'scaleX(-1)' }}>
                  <path fillRule="evenodd" clipRule="evenodd" d="M21 12C21 12.5523 20.5523 13 20 13H4C3.44772 13 3 12.5523 3 12C3 11.4477 3.44772 11 4 11H20C20.5523 11 21 11.4477 21 12Z" fill="currentColor"></path>
                  <path d="M18.9721 12C18.8788 11.8452 18.6832 11.5671 18.4693 11.3251C18.0436 10.8432 17.4568 10.2928 16.8443 9.76105C16.2368 9.23357 15.6263 8.74365 15.166 8.38437C14.9363 8.20515 14.54 7.90576 14.4068 7.80521C13.9622 7.47768 13.8672 6.85173 14.1947 6.40706C14.5222 5.96236 15.1482 5.86736 15.5929 6.19487L15.5966 6.19767C15.741 6.30672 16.1597 6.62291 16.3964 6.80767C16.8735 7.18002 17.5131 7.69303 18.1555 8.25084C18.793 8.80434 19.4563 9.4216 19.9681 10.0008C20.2229 10.2892 20.4614 10.5918 20.6415 10.8906C20.8051 11.162 20.9999 11.5568 20.9999 12C20.9999 12.4431 20.8051 12.838 20.6415 13.1094C20.4614 13.4082 20.2229 13.7108 19.9681 13.9992C19.4563 14.5784 18.793 15.1957 18.1555 15.7492C17.5131 16.307 16.8735 16.82 16.3964 17.1923C16.1597 17.3771 15.7413 17.6931 15.5969 17.8021L15.5929 17.8051C15.1482 18.1326 14.5222 18.0376 14.1947 17.5929C13.8672 17.1483 13.9622 16.5223 14.4068 16.1948C14.54 16.0942 14.9363 15.7948 15.166 15.6156C15.6263 15.2564 16.2368 14.7664 16.8443 14.2389C17.4568 13.7072 18.0436 13.1568 18.4693 12.6749C18.6832 12.4329 18.8788 12.1548 18.9721 12Z" fill="currentColor"></path>
                </svg>
              </button>
              <button
                className="package-lightbox-nav package-lightbox-nav-next"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex((prev) => (prev >= displayImages.length - 1 ? 0 : prev + 1));
                }}
                aria-label="Next image"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M21 12C21 12.5523 20.5523 13 20 13H4C3.44772 13 3 12.5523 3 12C3 11.4477 3.44772 11 4 11H20C20.5523 11 21 11.4477 21 12Z" fill="currentColor"></path>
                  <path d="M18.9721 12C18.8788 11.8452 18.6832 11.5671 18.4693 11.3251C18.0436 10.8432 17.4568 10.2928 16.8443 9.76105C16.2368 9.23357 15.6263 8.74365 15.166 8.38437C14.9363 8.20515 14.54 7.90576 14.4068 7.80521C13.9622 7.47768 13.8672 6.85173 14.1947 6.40706C14.5222 5.96236 15.1482 5.86736 15.5929 6.19487L15.5966 6.19767C15.741 6.30672 16.1597 6.62291 16.3964 6.80767C16.8735 7.18002 17.5131 7.69303 18.1555 8.25084C18.793 8.80434 19.4563 9.4216 19.9681 10.0008C20.2229 10.2892 20.4614 10.5918 20.6415 10.8906C20.8051 11.162 20.9999 11.5568 20.9999 12C20.9999 12.4431 20.8051 12.838 20.6415 13.1094C20.4614 13.4082 20.2229 13.7108 19.9681 13.9992C19.4563 14.5784 18.793 15.1957 18.1555 15.7492C17.5131 16.307 16.8735 16.82 16.3964 17.1923C16.1597 17.3771 15.7413 17.6931 15.5969 17.8021L15.5929 17.8051C15.1482 18.1326 14.5222 18.0376 14.1947 17.5929C13.8672 17.1483 13.9622 16.5223 14.4068 16.1948C14.54 16.0942 14.9363 15.7948 15.166 15.6156C15.6263 15.2564 16.2368 14.7664 16.8443 14.2389C17.4568 13.7072 18.0436 13.1568 18.4693 12.6749C18.6832 12.4329 18.8788 12.1548 18.9721 12Z" fill="currentColor"></path>
                </svg>
              </button>
            </>
          )}
          
          <div className="package-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <Image
              src={displayImages[selectedImageIndex]}
              alt={packageData.package_name}
              width={1200}
              height={800}
              className="package-lightbox-image"
              style={{ width: 'auto', height: 'auto', maxWidth: '90vw', maxHeight: '90vh' }}
            />
          </div>
        </div>
      )}

      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />

      {/* Recent Packages Slider */}
      <RecentPackagesSlider currentPackageId={packageData.id} />
    </>
  );
}

// Recent Packages Slider Component
interface RecentPackage {
  id: string;
  package_name: string;
  slug: string;
  package_description?: string;
  thumbnail_image_url?: string;
  package_duration?: string;
  difficulty?: string;
  price?: number;
  discounted_price?: number;
}

function RecentPackagesSlider({ currentPackageId }: { currentPackageId: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [packages, setPackages] = useState<RecentPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [cardsToShow, setCardsToShow] = useState(3);
  const trackRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
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

  // Fetch recent packages (excluding current package)
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        const supabase = createClient();
        const { data, error } = await supabase
          .from("packages")
          .select("*")
          .neq("id", currentPackageId)
          .order("created_at", { ascending: false })
          .limit(12);

        if (error) {
          console.error("Error fetching recent packages:", error);
          return;
        }

        if (data) {
          setPackages(data as RecentPackage[]);
        }
      } catch (err) {
        console.error("Error loading recent packages:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [currentPackageId]);

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

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  if (loading || packages.length === 0) {
    return null;
  }

  return (
    <section className="recent-packages-section">
      <div className="recent-packages-container">
        <div className="recent-packages-header">
          <h2 className="recent-packages-title">Recent Packages</h2>
          <p className="recent-packages-subtitle">Explore more amazing adventures</p>
        </div>

        <div className="recent-packages-slider-wrapper">
          {packages.length > cardsToShow && (
            <>
              <button
                className="recent-packages-nav recent-packages-nav-prev"
                onClick={prevSlide}
                aria-label="Previous packages"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'scaleX(-1)' }}>
                  <path fillRule="evenodd" clipRule="evenodd" d="M21 12C21 12.5523 20.5523 13 20 13H4C3.44772 13 3 12.5523 3 12C3 11.4477 3.44772 11 4 11H20C20.5523 11 21 11.4477 21 12Z" fill="currentColor"></path>
                  <path d="M18.9721 12C18.8788 11.8452 18.6832 11.5671 18.4693 11.3251C18.0436 10.8432 17.4568 10.2928 16.8443 9.76105C16.2368 9.23357 15.6263 8.74365 15.166 8.38437C14.9363 8.20515 14.54 7.90576 14.4068 7.80521C13.9622 7.47768 13.8672 6.85173 14.1947 6.40706C14.5222 5.96236 15.1482 5.86736 15.5929 6.19487L15.5966 6.19767C15.741 6.30672 16.1597 6.62291 16.3964 6.80767C16.8735 7.18002 17.5131 7.69303 18.1555 8.25084C18.793 8.80434 19.4563 9.4216 19.9681 10.0008C20.2229 10.2892 20.4614 10.5918 20.6415 10.8906C20.8051 11.162 20.9999 11.5568 20.9999 12C20.9999 12.4431 20.8051 12.838 20.6415 13.1094C20.4614 13.4082 20.2229 13.7108 19.9681 13.9992C19.4563 14.5784 18.793 15.1957 18.1555 15.7492C17.5131 16.307 16.8735 16.82 16.3964 17.1923C16.1597 17.3771 15.7413 17.6931 15.5969 17.8021L15.5929 17.8051C15.1482 18.1326 14.5222 18.0376 14.1947 17.5929C13.8672 17.1483 13.9622 16.5223 14.4068 16.1948C14.54 16.0942 14.9363 15.7948 15.166 15.6156C15.6263 15.2564 16.2368 14.7664 16.8443 14.2389C17.4568 13.7072 18.0436 13.1568 18.4693 12.6749C18.6832 12.4329 18.8788 12.1548 18.9721 12Z" fill="currentColor"></path>
                </svg>
              </button>
              <button
                className="recent-packages-nav recent-packages-nav-next"
                onClick={nextSlide}
                aria-label="Next packages"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M21 12C21 12.5523 20.5523 13 20 13H4C3.44772 13 3 12.5523 3 12C3 11.4477 3.44772 11 4 11H20C20.5523 11 21 11.4477 21 12Z" fill="currentColor"></path>
                  <path d="M18.9721 12C18.8788 11.8452 18.6832 11.5671 18.4693 11.3251C18.0436 10.8432 17.4568 10.2928 16.8443 9.76105C16.2368 9.23357 15.6263 8.74365 15.166 8.38437C14.9363 8.20515 14.54 7.90576 14.4068 7.80521C13.9622 7.47768 13.8672 6.85173 14.1947 6.40706C14.5222 5.96236 15.1482 5.86736 15.5929 6.19487L15.5966 6.19767C15.741 6.30672 16.1597 6.62291 16.3964 6.80767C16.8735 7.18002 17.5131 7.69303 18.1555 8.25084C18.793 8.80434 19.4563 9.4216 19.9681 10.0008C20.2229 10.2892 20.4614 10.5918 20.6415 10.8906C20.8051 11.162 20.9999 11.5568 20.9999 12C20.9999 12.4431 20.8051 12.838 20.6415 13.1094C20.4614 13.4082 20.2229 13.7108 19.9681 13.9992C19.4563 14.5784 18.793 15.1957 18.1555 15.7492C17.5131 16.307 16.8735 16.82 16.3964 17.1923C16.1597 17.3771 15.7413 17.6931 15.5969 17.8021L15.5929 17.8051C15.1482 18.1326 14.5222 18.0376 14.1947 17.5929C13.8672 17.1483 13.9622 16.5223 14.4068 16.1948C14.54 16.0942 14.9363 15.7948 15.166 15.6156C15.6263 15.2564 16.2368 14.7664 16.8443 14.2389C17.4568 13.7072 18.0436 13.1568 18.4693 12.6749C18.6832 12.4329 18.8788 12.1548 18.9721 12Z" fill="currentColor"></path>
                </svg>
              </button>
            </>
          )}

          <div className="recent-packages-track" ref={trackRef}>
            {packages.map((pkg) => (
              <Link key={pkg.id} href={`/packages/${pkg.slug}`} className="recent-package-card">
                <div className="recent-package-image-wrapper">
                  <Image
                    src={pkg.thumbnail_image_url || "/images/placeholder.jpg"}
                    alt={pkg.package_name}
                    fill
                    className="recent-package-image"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="recent-package-content">
                  <h3 className="recent-package-title">{pkg.package_name}</h3>
                  <p className="recent-package-description">
                    {stripHtmlTags(pkg.package_description) || "Experience an amazing adventure with our carefully crafted package."}
                  </p>
                  <div className="recent-package-details">
                    {pkg.difficulty && (
                      <div className="recent-package-detail-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2">
                          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                        </svg>
                        <span>{pkg.difficulty}</span>
                      </div>
                    )}
                    {pkg.package_duration && (
                      <div className="recent-package-detail-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span>{pkg.package_duration}</span>
                      </div>
                    )}
                  </div>
                  <div className="recent-package-footer">
                    <div className="recent-package-price">
                      {pkg.discounted_price && pkg.discounted_price < (pkg.price || 0) ? (
                        <>
                          <span className="recent-package-price-original">₹{pkg.price?.toLocaleString()}</span>
                          <span className="recent-package-price-current">₹{pkg.discounted_price.toLocaleString()}</span>
                        </>
                      ) : (
                        <span className="recent-package-price-current">₹{pkg.price?.toLocaleString() || "N/A"}</span>
                      )}
                    </div>
                    <button
                      ref={(el) => {
                        buttonRefs.current.push(el);
                      }}
                      className="recent-package-book-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        window.location.href = `/packages/${pkg.slug}`;
                      }}
                    >
                      <div className="recent-package-book-btn-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </div>
                      <span className="recent-package-book-btn-text">View Details</span>
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
