"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import ContactModal from "@/app/components/ContactModal";
import PdfDownloadModal from "@/app/components/PdfDownloadModal";
import { gsap } from "gsap";
import {
  FileText,
  MapPin,
  CheckCircle,
  XCircle,
  Navigation,
  HelpCircle,
  Calendar,
  ChevronDown,
  Shield,
  Star,
  Mountain,
} from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import { stripHtmlTags } from "@/lib/utils";
import "./package-details.css";

interface PackageData {
  id: string;
  package_name: string;
  slug: string;
  package_description: string | null;
  gallery_images: string[] | null;
  thumbnail_image_url: string | null;
  document_url: string | null;
  package_duration: string | null;
  difficulty: string | null;
  altitude: string | null;
  departure_and_return_location: string | null;
  departure_time: string | null;
  trek_length: string | null;
  base_camp: string | null;
  itinerary: any[] | null;
  inclusions: string | null;
  exclusions: string | null;
  how_to_reach: string | null;
  cancellation_policy: string | null;
  refund_policy: string | null;
  safety_for_trek: string | null;
  faqs: any[] | null;
  booking_dates: string[] | null;
  why_choose_us: any[] | string | null;
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
    return liMatches
      .map((match) => {
        const content = match.replace(/<li[^>]*>|<\/li>/gi, "").trim();
        return content;
      })
      .filter((item) => item);
  }

  // Extract paragraphs
  const pMatches = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi);
  if (pMatches && pMatches.length > 0) {
    return pMatches
      .map((match) => {
        const content = match.replace(/<p[^>]*>|<\/p>/gi, "").trim();
        return content;
      })
      .filter((item) => item);
  }

  // Split by <br> tags
  const brSplit = html.split(/<br\s*\/?>/i);
  if (brSplit.length > 1) {
    return brSplit
      .map((item) => item.trim().replace(/<[^>]*>/g, ""))
      .filter((item) => item);
  }

  // If no structure found, clean HTML and return as one item
  const cleaned = html.replace(/<[^>]*>/g, "").trim();
  return cleaned ? [cleaned] : [];
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getWhyChooseUsItemHtml(item: any): string {
  if (!item) return "";
  if (typeof item === "string") return item;

  const title = item.title || item.heading || item.name || "";
  const description = item.description || item.desc || item.text || "";

  if (title && description) {
    const safeDesc = escapeHtml(String(description)).replace(/\n/g, "<br />");
    return `<strong>${escapeHtml(String(title))}</strong><br />${safeDesc}`;
  }

  if (title) return `<strong>${escapeHtml(String(title))}</strong>`;
  if (description)
    return escapeHtml(String(description)).replace(/\n/g, "<br />");

  return "";
}

function normalizeWhyChooseUs(input: any): any[] {
  if (!input) return [];
  if (Array.isArray(input)) return input;

  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && Array.isArray(parsed.items)) return parsed.items;
    } catch {
      return [];
    }
  }

  if (
    typeof input === "object" &&
    input &&
    Array.isArray((input as any).items)
  ) {
    return (input as any).items;
  }

  return [];
}

export default function PackageDetails({ packageData }: PackageDetailsProps) {
  const whyChooseUsItems = normalizeWhyChooseUs(packageData.why_choose_us);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [expandedItinerary, setExpandedItinerary] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<string>("");
  const [navScrollPosition, setNavScrollPosition] = useState(0);
  const [isDatesExpanded, setIsDatesExpanded] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isSafetyExpanded, setIsSafetyExpanded] = useState(false);
  const [showDescriptionMore, setShowDescriptionMore] = useState(false);
  const [showSafetyMore, setShowSafetyMore] = useState(false);
  const [safetyCollapsedHeight, setSafetyCollapsedHeight] =
    useState<number>(200);
  const [itineraryDescriptionExpanded, setItineraryDescriptionExpanded] =
    useState<Record<number, boolean>>({});
  const [showItineraryMore, setShowItineraryMore] = useState<
    Record<number, boolean>
  >({});
  const navRef = useRef<HTMLElement | null>(null);
  const galleryRef = useRef<HTMLElement | null>(null);
  const navTrackRef = useRef<HTMLDivElement>(null);
  const navItemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [isNavSticky, setIsNavSticky] = useState(false);
  const isNavStickyRef = useRef(false);
  const [navHeight, setNavHeight] = useState(56);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const safetyRef = useRef<HTMLDivElement>(null);
  const itineraryDescriptionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const sidebarContainerRef = useRef<HTMLDivElement>(null);

  const galleryImages = packageData.gallery_images || [];
  const displayImages =
    galleryImages.length > 0
      ? galleryImages
      : packageData.thumbnail_image_url
        ? [packageData.thumbnail_image_url]
        : [];

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
          { opacity: 1, scale: 1, duration: 0.6, ease: "power2.out" },
        );
      }
    });
  }, [selectedImageIndex, displayImages.length]);

  const goToNext = () => {
    setSelectedImageIndex((prev) =>
      prev >= displayImages.length - 1 ? 0 : prev + 1,
    );
  };

  const goToPrev = () => {
    setSelectedImageIndex((prev) =>
      prev <= 0 ? displayImages.length - 1 : prev - 1,
    );
  };

  const handleWhatsAppClick = () => {
    const whatsappNumber = "917817849247";
    const message = encodeURIComponent(
      `Hello! I'm interested in the ${packageData.package_name} package.`,
    );
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank");
  };

  const handleCallClick = () => {
    window.location.href = "tel:+917817849247";
  };

  // Get available sections with icons
  const sections = [
    {
      id: "description",
      label: "Description",
      icon: FileText,
      condition: !!packageData.package_description,
    },
    {
      id: "itinerary",
      label: "Itinerary",
      icon: MapPin,
      condition:
        !!packageData.itinerary &&
        Array.isArray(packageData.itinerary) &&
        packageData.itinerary.length > 0,
    },
    {
      id: "inclusions",
      label: "Inclusions",
      icon: CheckCircle,
      condition: !!packageData.inclusions,
    },
    {
      id: "exclusions",
      label: "Exclusions",
      icon: XCircle,
      condition: !!packageData.exclusions,
    },
    {
      id: "how-to-reach",
      label: "How to Reach",
      icon: Navigation,
      condition: !!packageData.how_to_reach,
    },
    {
      id: "safety-for-trek",
      label: "Safety",
      icon: Shield,
      condition: !!packageData.safety_for_trek,
    },
    {
      id: "why-choose-us",
      label: "Why Choose Us",
      icon: Star,
      condition: whyChooseUsItems.length > 0,
    },
    {
      id: "faqs",
      label: "FAQs",
      icon: HelpCircle,
      condition:
        !!packageData.faqs &&
        Array.isArray(packageData.faqs) &&
        packageData.faqs.length > 0,
    },
  ].filter((section) => section.condition);

  // Sticky nav: only stick after scrolling past thumbnail image
  useEffect(() => {
    const gallery = galleryRef.current;
    const nav = navRef.current;
    if (!gallery || !nav || sections.length === 0) return;

    let rafId: number | null = null;

    const updateSticky = () => {
      const NAV_TOP = 0;
      nav.style.setProperty("--package-section-nav-top", `${NAV_TOP}px`);

      const galleryRect = gallery.getBoundingClientRect();
      const galleryBottom = galleryRect.bottom;
      // Stick when gallery bottom has scrolled past the sticky position
      const shouldStick = galleryBottom <= NAV_TOP;

      if (isNavStickyRef.current !== shouldStick) {
        isNavStickyRef.current = shouldStick;
        setIsNavSticky(shouldStick);
      }
      if (nav.offsetHeight > 0) setNavHeight(nav.offsetHeight);
    };

    const handleScroll = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateSticky);
    };

    const handleResize = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateSticky);
    };

    updateSticky();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [sections.length, displayImages.length]);

  // Scroll to section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerEl = document.querySelector(".header") as HTMLElement | null;
      const headerH = headerEl?.offsetHeight ?? 0;
      const navH = navRef.current?.offsetHeight ?? 0;
      const headerOffset = headerH + navH + 16;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - headerOffset;

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
      const headerEl = document.querySelector(".header") as HTMLElement | null;
      const headerH = headerEl?.offsetHeight ?? 0;
      const navH = navRef.current?.offsetHeight ?? 0;
      const scrollPosition = window.scrollY + headerH + navH + 24;

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

    const activeIndex = sections.findIndex((s) => s.id === activeSection);
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

  // Check if description content exceeds max height
  useEffect(() => {
    if (!descriptionRef.current) return;

    const checkHeight = () => {
      const element = descriptionRef.current;
      if (!element) return;

      const LINES_COLLAPSED = 6;
      const lineHeight =
        parseFloat(getComputedStyle(element).lineHeight) || 28.8; // 1.8 * 16px
      const collapsedHeight = lineHeight * LINES_COLLAPSED;

      // Temporarily remove constraints to measure full height
      element.classList.remove("collapsed");
      element.style.maxHeight = "none";
      const fullHeight = element.scrollHeight;

      if (fullHeight > collapsedHeight) {
        setShowDescriptionMore(true);
        if (!isDescriptionExpanded) {
          element.classList.add("collapsed");
        }
      } else {
        setShowDescriptionMore(false);
        element.classList.remove("collapsed");
      }
    };

    const t = setTimeout(checkHeight, 100);
    window.addEventListener("resize", checkHeight);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", checkHeight);
    };
  }, [packageData.package_description, isDescriptionExpanded]);

  // Check if safety content exceeds 200px and apply initial state
  useEffect(() => {
    if (!safetyRef.current) return;

    const checkHeight = () => {
      const element = safetyRef.current;
      if (!element) return;

      // Remove all constraints to measure full height
      element.style.maxHeight = "none";
      element.style.overflow = "visible";
      element.style.display = "flex";

      // Force reflow
      void element.offsetHeight;

      // Get the full height of the container
      const fullHeight = element.scrollHeight;

      // Set collapsed height to 200px
      const COLLAPSED_HEIGHT = 200;
      setSafetyCollapsedHeight(COLLAPSED_HEIGHT);

      // Check if full height exceeds 200px
      if (fullHeight > COLLAPSED_HEIGHT) {
        setShowSafetyMore(true);
        // Apply collapsed state initially if not expanded
        if (!isSafetyExpanded) {
          element.style.maxHeight = `${COLLAPSED_HEIGHT}px`;
          element.style.overflow = "hidden";
          element.classList.add("collapsed");
          element.classList.remove("expanded");
        }
      } else {
        setShowSafetyMore(false);
        element.style.maxHeight = "none";
        element.style.overflow = "visible";
        element.classList.remove("collapsed", "expanded");
      }
    };

    const t = setTimeout(checkHeight, 500);
    window.addEventListener("resize", checkHeight);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", checkHeight);
    };
  }, [packageData.safety_for_trek, isSafetyExpanded]);

  // Apply collapsed/expanded state when isSafetyExpanded changes
  useEffect(() => {
    if (!safetyRef.current || !showSafetyMore) return;

    const element = safetyRef.current;
    const COLLAPSED_HEIGHT = 200;

    if (isSafetyExpanded) {
      // Expanded: measure full height and animate to it
      element.style.maxHeight = "none";
      element.style.overflow = "visible";
      void element.offsetHeight; // Force reflow
      const fullHeight = element.scrollHeight;

      // Set to current height first, then animate to full height
      const currentHeight = element.offsetHeight;
      element.style.maxHeight = `${currentHeight}px`;
      void element.offsetHeight; // Force reflow

      // Animate to full height
      element.style.maxHeight = `${fullHeight}px`;
      element.classList.remove("collapsed");
      element.classList.add("expanded");

      // After animation completes, remove constraint
      setTimeout(() => {
        if (element && isSafetyExpanded) {
          element.style.maxHeight = "none";
        }
      }, 700);
    } else {
      // Collapsed: animate to 200px
      element.style.maxHeight = `${COLLAPSED_HEIGHT}px`;
      element.style.overflow = "hidden";
      element.classList.add("collapsed");
      element.classList.remove("expanded");
    }
  }, [isSafetyExpanded, showSafetyMore]);

  // Handle description expand/collapse
  const toggleDescription = () => {
    setIsDescriptionExpanded(!isDescriptionExpanded);
  };

  // Handle safety expand/collapse
  const toggleSafety = () => {
    setIsSafetyExpanded(!isSafetyExpanded);
  };

  // Handle itinerary description expand/collapse
  const toggleItineraryDescription = (index: number) => {
    setItineraryDescriptionExpanded((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Make sidebar sticky on desktop using JavaScript
  useEffect(() => {
    if (!sidebarRef.current || !sidebarContainerRef.current) return;

    const sidebar = sidebarRef.current;
    const container = sidebarContainerRef.current;
    const nav = navRef.current;
    const NAV_SIDEBAR_GAP = 20;
    let rafId: number | null = null;

    const updateSidebarPosition = () => {
      if (window.innerWidth <= 1024) {
        sidebar.style.position = "";
        sidebar.style.top = "";
        sidebar.style.width = "";
        sidebar.style.left = "";
        sidebar.style.right = "";
        return;
      }

      const navHeight = nav?.offsetHeight ?? 56;
      const SIDEBAR_TOP = navHeight + NAV_SIDEBAR_GAP;

      const containerRect = container.getBoundingClientRect();
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const containerTop = scrollTop + containerRect.top;
      const containerBottom = scrollTop + containerRect.bottom;
      const sidebarHeight = sidebar.offsetHeight;
      const sidebarWidth = sidebar.offsetWidth;

      // Calculate sticky boundaries
      const stickyStart = containerTop - SIDEBAR_TOP;
      const stickyEnd = containerBottom - sidebarHeight - SIDEBAR_TOP;

      if (scrollTop >= stickyStart && scrollTop <= stickyEnd) {
        // Fixed position - sidebar sticks below nav bar
        const containerRight = containerRect.right;
        sidebar.style.position = "fixed";
        sidebar.style.top = `${SIDEBAR_TOP}px`;
        sidebar.style.right = `${window.innerWidth - containerRight}px`;
        sidebar.style.width = `${sidebarWidth}px`;
      } else if (scrollTop < stickyStart) {
        // Normal flow - before sticky zone
        sidebar.style.position = "";
        sidebar.style.top = "";
        sidebar.style.width = "";
        sidebar.style.left = "";
        sidebar.style.right = "";
      } else {
        // Bottom of container - absolute position
        sidebar.style.position = "absolute";
        sidebar.style.top = `${containerRect.height - sidebarHeight}px`;
        sidebar.style.right = "0";
        sidebar.style.width = `${sidebarWidth}px`;
      }
    };

    const handleScroll = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateSidebarPosition);
    };

    const handleResize = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateSidebarPosition);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    // Initial update with delay to ensure layout is complete
    const timeoutId = setTimeout(() => {
      updateSidebarPosition();
    }, 300);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [packageData]);

  // Check itinerary description heights
  useEffect(() => {
    if (!packageData.itinerary || !Array.isArray(packageData.itinerary)) return;

    const checkHeights = () => {
      const newShowMore: Record<number, boolean> = {};

      itineraryDescriptionRefs.current.forEach((ref, index) => {
        if (!ref) return;

        // Remove constraints to measure full height
        ref.style.maxHeight = "none";
        ref.style.overflow = "visible";
        void ref.offsetHeight; // Force reflow

        const fullHeight = ref.scrollHeight;
        const ITINERARY_COLLAPSED_HEIGHT = 2000;

        if (fullHeight > ITINERARY_COLLAPSED_HEIGHT) {
          newShowMore[index] = true;

          // Apply collapsed state if not expanded
          if (!itineraryDescriptionExpanded[index]) {
            ref.style.maxHeight = `${ITINERARY_COLLAPSED_HEIGHT}px`;
            ref.style.overflow = "hidden";
          }
        } else {
          newShowMore[index] = false;
          ref.style.maxHeight = "none";
          ref.style.overflow = "visible";
        }
      });

      setShowItineraryMore(newShowMore);
    };

    const t = setTimeout(checkHeights, 500);
    window.addEventListener("resize", checkHeights);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", checkHeights);
    };
  }, [packageData.itinerary, itineraryDescriptionExpanded]);

  // Apply itinerary description expanded/collapsed state
  useEffect(() => {
    itineraryDescriptionRefs.current.forEach((ref, index) => {
      if (!ref) return;

      const ITINERARY_COLLAPSED_HEIGHT = 2000;

      if (itineraryDescriptionExpanded[index]) {
        // Expanded: measure full height and animate to it
        ref.style.maxHeight = "none";
        ref.style.overflow = "visible";
        void ref.offsetHeight; // Force reflow
        const fullHeight = ref.scrollHeight;
        ref.style.maxHeight = `${fullHeight}px`;

        setTimeout(() => {
          if (ref && itineraryDescriptionExpanded[index]) {
            ref.style.maxHeight = "none";
          }
        }, 700);
      } else {
        // Collapsed: set to 2000px
        if (showItineraryMore[index]) {
          ref.style.maxHeight = `${ITINERARY_COLLAPSED_HEIGHT}px`;
          ref.style.overflow = "hidden";
        }
      }
    });
  }, [itineraryDescriptionExpanded, showItineraryMore]);

  return (
    <>
      {/* Gallery Section with GSAP Slider */}
      {displayImages.length > 0 && (
        <section className="package-gallery-section" ref={galleryRef}>
          <div className="package-gallery-container">
            <div className="package-slider-wrapper">
              <div className="package-slider-track" ref={sliderRef}>
                {displayImages.map((img, index) => (
                  <div
                    key={index}
                    ref={(el) => {
                      slideRefs.current[index] = el;
                    }}
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
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ transform: "scaleX(-1)" }}
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M21 12C21 12.5523 20.5523 13 20 13H4C3.44772 13 3 12.5523 3 12C3 11.4477 3.44772 11 4 11H20C20.5523 11 21 11.4477 21 12Z"
                        fill="currentColor"
                      ></path>
                      <path
                        d="M18.9721 12C18.8788 11.8452 18.6832 11.5671 18.4693 11.3251C18.0436 10.8432 17.4568 10.2928 16.8443 9.76105C16.2368 9.23357 15.6263 8.74365 15.166 8.38437C14.9363 8.20515 14.54 7.90576 14.4068 7.80521C13.9622 7.47768 13.8672 6.85173 14.1947 6.40706C14.5222 5.96236 15.1482 5.86736 15.5929 6.19487L15.5966 6.19767C15.741 6.30672 16.1597 6.62291 16.3964 6.80767C16.8735 7.18002 17.5131 7.69303 18.1555 8.25084C18.793 8.80434 19.4563 9.4216 19.9681 10.0008C20.2229 10.2892 20.4614 10.5918 20.6415 10.8906C20.8051 11.162 20.9999 11.5568 20.9999 12C20.9999 12.4431 20.8051 12.838 20.6415 13.1094C20.4614 13.4082 20.2229 13.7108 19.9681 13.9992C19.4563 14.5784 18.793 15.1957 18.1555 15.7492C17.5131 16.307 16.8735 16.82 16.3964 17.1923C16.1597 17.3771 15.7413 17.6931 15.5969 17.8021L15.5929 17.8051C15.1482 18.1326 14.5222 18.0376 14.1947 17.5929C13.8672 17.1483 13.9622 16.5223 14.4068 16.1948C14.54 16.0942 14.9363 15.7948 15.166 15.6156C15.6263 15.2564 16.2368 14.7664 16.8443 14.2389C17.4568 13.7072 18.0436 13.1568 18.4693 12.6749C18.6832 12.4329 18.8788 12.1548 18.9721 12Z"
                        fill="currentColor"
                      ></path>
                    </svg>
                  </button>
                  <button
                    className="package-slider-btn package-slider-btn-next"
                    onClick={goToNext}
                    aria-label="Next image"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M21 12C21 12.5523 20.5523 13 20 13H4C3.44772 13 3 12.5523 3 12C3 11.4477 3.44772 11 4 11H20C20.5523 11 21 11.4477 21 12Z"
                        fill="currentColor"
                      ></path>
                      <path
                        d="M18.9721 12C18.8788 11.8452 18.6832 11.5671 18.4693 11.3251C18.0436 10.8432 17.4568 10.2928 16.8443 9.76105C16.2368 9.23357 15.6263 8.74365 15.166 8.38437C14.9363 8.20515 14.54 7.90576 14.4068 7.80521C13.9622 7.47768 13.8672 6.85173 14.1947 6.40706C14.5222 5.96236 15.1482 5.86736 15.5929 6.19487L15.5966 6.19767C15.741 6.30672 16.1597 6.62291 16.3964 6.80767C16.8735 7.18002 17.5131 7.69303 18.1555 8.25084C18.793 8.80434 19.4563 9.4216 19.9681 10.0008C20.2229 10.2892 20.4614 10.5918 20.6415 10.8906C20.8051 11.162 20.9999 11.5568 20.9999 12C20.9999 12.4431 20.8051 12.838 20.6415 13.1094C20.4614 13.4082 20.2229 13.7108 19.9681 13.9992C19.4563 14.5784 18.793 15.1957 18.1555 15.7492C17.5131 16.307 16.8735 16.82 16.3964 17.1923C16.1597 17.3771 15.7413 17.6931 15.5969 17.8021L15.5929 17.8051C15.1482 18.1326 14.5222 18.0376 14.1947 17.5929C13.8672 17.1483 13.9622 16.5223 14.4068 16.1948C14.54 16.0942 14.9363 15.7948 15.166 15.6156C15.6263 15.2564 16.2368 14.7664 16.8443 14.2389C17.4568 13.7072 18.0436 13.1568 18.4693 12.6749C18.6832 12.4329 18.8788 12.1548 18.9721 12Z"
                        fill="currentColor"
                      ></path>
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

      {/* Section Navigation Bar - Sticky only after scrolling past thumbnail */}
      {sections.length > 0 && (
        <div className="package-section-nav-wrapper">
          {isNavSticky && (
            <div
              className="package-section-nav-spacer"
              aria-hidden="true"
              style={{ height: navHeight }}
            />
          )}
          <nav
            className={`package-section-nav ${isNavSticky ? "is-sticky" : ""}`}
            ref={navRef}
          >
            <div className="package-nav-container">
            <div className="package-nav-track" ref={navTrackRef}>
              {sections.map((section, index) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    ref={(el) => {
                      navItemRefs.current[index] = el;
                    }}
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
        </div>
      )}

      {/* Main Content Section */}
      <section className="package-content-section">
        <div className="package-content-container">
          <div className="package-content-layout" ref={sidebarContainerRef}>
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
                  {packageData.departure_and_return_location && (
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
                      <span>{packageData.departure_and_return_location}</span>
                    </div>
                  )}
                  {packageData.trek_length && (
                    <div className="package-meta-item">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M3 12h18M12 3v18"></path>
                      </svg>
                      <span>{packageData.trek_length}</span>
                    </div>
                  )}
                  {packageData.base_camp && (
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
                      <span>{packageData.base_camp}</span>
                    </div>
                  )}
                  {packageData.departure_time && (
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
                      <span>{packageData.departure_time}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {packageData.package_description && (
                <div id="description" className="package-section">
                  <h2 className="package-section-title">
                    <FileText
                      size={24}
                      className="package-section-title-icon"
                    />
                    Description
                  </h2>
                  <div className="package-description-wrapper">
                    <div
                      ref={descriptionRef}
                      className={`package-description package-description-animated ${isDescriptionExpanded ? "expanded" : "collapsed"}`}
                      dangerouslySetInnerHTML={{
                        __html: packageData.package_description.replace(
                          /\n/g,
                          "<br />",
                        ),
                      }}
                    />
                    {showDescriptionMore && (
                      <div className="package-show-more-container">
                        <button
                          className="package-show-more-btn"
                          onClick={toggleDescription}
                          aria-label={
                            isDescriptionExpanded ? "Show less" : "Show more"
                          }
                        >
                          <span>
                            {isDescriptionExpanded ? "Show Less" : "Show More"}
                          </span>
                          <svg
                            className={`package-show-more-icon ${isDescriptionExpanded ? "expanded" : ""}`}
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Itinerary with Steps Style - Collapsible */}
              {packageData.itinerary &&
                Array.isArray(packageData.itinerary) &&
                packageData.itinerary.length > 0 && (
                  <div id="itinerary" className="package-section">
                    <h2 className="package-section-title">
                      <MapPin
                        size={24}
                        className="package-section-title-icon"
                      />
                      Itinerary
                    </h2>
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
                                  if (expandedItinerary === index) {
                                    // Close the open item - don't open another
                                    setExpandedItinerary(null);
                                  } else {
                                    // Open the clicked item
                                    setExpandedItinerary(index);
                                  }
                                }}
                              >
                                <div className="package-step-header-content">
                                  {item.heading && (
                                    <p className="package-step-title">
                                      {item.heading
                                        .split(" ")
                                        .map(
                                          (
                                            word: string,
                                            i: number,
                                            arr: string[],
                                          ) =>
                                            i === arr.length - 1 ? (
                                              <span key={i}> {word}</span>
                                            ) : (
                                              <span key={i}>{word} </span>
                                            ),
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
                                  <>
                                    <div
                                      ref={(el) => {
                                        itineraryDescriptionRefs.current[
                                          index
                                        ] = el;
                                      }}
                                      className="package-step-description package-step-description-animated"
                                      style={{
                                        maxHeight:
                                          showItineraryMore[index] &&
                                          !itineraryDescriptionExpanded[index]
                                            ? "2000px"
                                            : "none",
                                        overflow:
                                          showItineraryMore[index] &&
                                          !itineraryDescriptionExpanded[index]
                                            ? "hidden"
                                            : "visible",
                                      }}
                                      dangerouslySetInnerHTML={{
                                        __html: item.description.replace(
                                          /\n/g,
                                          "<br />",
                                        ),
                                      }}
                                    />
                                    {expandedItinerary === index &&
                                      showItineraryMore[index] && (
                                        <div className="package-show-more-container">
                                          <button
                                            className="package-show-more-btn package-show-more-btn-itinerary"
                                            onClick={() =>
                                              toggleItineraryDescription(index)
                                            }
                                            aria-label={
                                              itineraryDescriptionExpanded[
                                                index
                                              ]
                                                ? "Show less"
                                                : "Show more"
                                            }
                                          >
                                            <span>
                                              {itineraryDescriptionExpanded[
                                                index
                                              ]
                                                ? "Show Less"
                                                : "Show More"}
                                            </span>
                                            <svg
                                              className={`package-show-more-icon ${itineraryDescriptionExpanded[index] ? "expanded" : ""}`}
                                              width="16"
                                              height="16"
                                              viewBox="0 0 24 24"
                                              fill="none"
                                              stroke="currentColor"
                                              strokeWidth="2"
                                            >
                                              <polyline points="6 9 12 15 18 9" />
                                            </svg>
                                          </button>
                                        </div>
                                      )}
                                  </>
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
                  <h2 className="package-section-title">
                    <CheckCircle
                      size={24}
                      className="package-section-title-icon"
                    />
                    Inclusions
                  </h2>
                  <div className="package-inclusions">
                    {parseContentToList(packageData.inclusions).map(
                      (item, index) => (
                        <div key={index} className="package-list-item">
                          <div className="package-list-icon">
                            <svg
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                fill-rule="evenodd"
                                clip-rule="evenodd"
                                d="M21 12C21 12.5523 20.5523 13 20 13H4C3.44772 13 3 12.5523 3 12C3 11.4477 3.44772 11 4 11H20C20.5523 11 21 11.4477 21 12Z"
                                fill="currentColor"
                              ></path>
                              <path
                                d="M18.9721 12C18.8788 11.8452 18.6832 11.5671 18.4693 11.3251C18.0436 10.8432 17.4568 10.2928 16.8443 9.76105C16.2368 9.23357 15.6263 8.74365 15.166 8.38437C14.9363 8.20515 14.54 7.90576 14.4068 7.80521C13.9622 7.47768 13.8672 6.85173 14.1947 6.40706C14.5222 5.96236 15.1482 5.86736 15.5929 6.19487L15.5966 6.19767C15.741 6.30672 16.1597 6.62291 16.3964 6.80767C16.8735 7.18002 17.5131 7.69303 18.1555 8.25084C18.793 8.80434 19.4563 9.4216 19.9681 10.0008C20.2229 10.2892 20.4614 10.5918 20.6415 10.8906C20.8051 11.162 20.9999 11.5568 20.9999 12C20.9999 12.4431 20.8051 12.838 20.6415 13.1094C20.4614 13.4082 20.2229 13.7108 19.9681 13.9992C19.4563 14.5784 18.793 15.1957 18.1555 15.7492C17.5131 16.307 16.8735 16.82 16.3964 17.1923C16.1597 17.3771 15.7413 17.6931 15.5969 17.8021L15.5929 17.8051C15.1482 18.1326 14.5222 18.0376 14.1947 17.5929C13.8672 17.1483 13.9622 16.5223 14.4068 16.1948C14.54 16.0942 14.9363 15.7948 15.166 15.6156C15.6263 15.2564 16.2368 14.7664 16.8443 14.2389C17.4568 13.7072 18.0436 13.1568 18.4693 12.6749C18.6832 12.4329 18.8788 12.1548 18.9721 12Z"
                                fill="currentColor"
                              ></path>
                            </svg>
                          </div>
                          <div
                            className="package-list-text"
                            dangerouslySetInnerHTML={{ __html: item }}
                          />
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

              {/* Exclusions */}
              {packageData.exclusions && (
                <div id="exclusions" className="package-section">
                  <h2 className="package-section-title">
                    <XCircle size={24} className="package-section-title-icon" />
                    Exclusions
                  </h2>
                  <div className="package-exclusions">
                    {parseContentToList(packageData.exclusions).map(
                      (item, index) => (
                        <div key={index} className="package-list-item">
                          <div className="package-list-icon">
                            <svg
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                fill-rule="evenodd"
                                clip-rule="evenodd"
                                d="M21 12C21 12.5523 20.5523 13 20 13H4C3.44772 13 3 12.5523 3 12C3 11.4477 3.44772 11 4 11H20C20.5523 11 21 11.4477 21 12Z"
                                fill="currentColor"
                              ></path>
                              <path
                                d="M18.9721 12C18.8788 11.8452 18.6832 11.5671 18.4693 11.3251C18.0436 10.8432 17.4568 10.2928 16.8443 9.76105C16.2368 9.23357 15.6263 8.74365 15.166 8.38437C14.9363 8.20515 14.54 7.90576 14.4068 7.80521C13.9622 7.47768 13.8672 6.85173 14.1947 6.40706C14.5222 5.96236 15.1482 5.86736 15.5929 6.19487L15.5966 6.19767C15.741 6.30672 16.1597 6.62291 16.3964 6.80767C16.8735 7.18002 17.5131 7.69303 18.1555 8.25084C18.793 8.80434 19.4563 9.4216 19.9681 10.0008C20.2229 10.2892 20.4614 10.5918 20.6415 10.8906C20.8051 11.162 20.9999 11.5568 20.9999 12C20.9999 12.4431 20.8051 12.838 20.6415 13.1094C20.4614 13.4082 20.2229 13.7108 19.9681 13.9992C19.4563 14.5784 18.793 15.1957 18.1555 15.7492C17.5131 16.307 16.8735 16.82 16.3964 17.1923C16.1597 17.3771 15.7413 17.6931 15.5969 17.8021L15.5929 17.8051C15.1482 18.1326 14.5222 18.0376 14.1947 17.5929C13.8672 17.1483 13.9622 16.5223 14.4068 16.1948C14.54 16.0942 14.9363 15.7948 15.166 15.6156C15.6263 15.2564 16.2368 14.7664 16.8443 14.2389C17.4568 13.7072 18.0436 13.1568 18.4693 12.6749C18.6832 12.4329 18.8788 12.1548 18.9721 12Z"
                                fill="currentColor"
                              ></path>
                            </svg>
                          </div>
                          <div
                            className="package-list-text"
                            dangerouslySetInnerHTML={{ __html: item }}
                          />
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

              {/* How to Reach */}
              {packageData.how_to_reach && (
                <div id="how-to-reach" className="package-section">
                  <h2 className="package-section-title">
                    <Navigation
                      size={24}
                      className="package-section-title-icon"
                    />
                    How to Reach
                  </h2>
                  <div className="package-exclusions">
                    {parseContentToList(packageData.how_to_reach).map(
                      (item, index) => (
                        <div key={index} className="package-list-item">
                          <div className="package-list-icon">
                            <svg
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                fill-rule="evenodd"
                                clip-rule="evenodd"
                                d="M21 12C21 12.5523 20.5523 13 20 13H4C3.44772 13 3 12.5523 3 12C3 11.4477 3.44772 11 4 11H20C20.5523 11 21 11.4477 21 12Z"
                                fill="currentColor"
                              ></path>
                              <path
                                d="M18.9721 12C18.8788 11.8452 18.6832 11.5671 18.4693 11.3251C18.0436 10.8432 17.4568 10.2928 16.8443 9.76105C16.2368 9.23357 15.6263 8.74365 15.166 8.38437C14.9363 8.20515 14.54 7.90576 14.4068 7.80521C13.9622 7.47768 13.8672 6.85173 14.1947 6.40706C14.5222 5.96236 15.1482 5.86736 15.5929 6.19487L15.5966 6.19767C15.741 6.30672 16.1597 6.62291 16.3964 6.80767C16.8735 7.18002 17.5131 7.69303 18.1555 8.25084C18.793 8.80434 19.4563 9.4216 19.9681 10.0008C20.2229 10.2892 20.4614 10.5918 20.6415 10.8906C20.8051 11.162 20.9999 11.5568 20.9999 12C20.9999 12.4431 20.8051 12.838 20.6415 13.1094C20.4614 13.4082 20.2229 13.7108 19.9681 13.9992C19.4563 14.5784 18.793 15.1957 18.1555 15.7492C17.5131 16.307 16.8735 16.82 16.3964 17.1923C16.1597 17.3771 15.7413 17.6931 15.5969 17.8021L15.5929 17.8051C15.1482 18.1326 14.5222 18.0376 14.1947 17.5929C13.8672 17.1483 13.9622 16.5223 14.4068 16.1948C14.54 16.0942 14.9363 15.7948 15.166 15.6156C15.6263 15.2564 16.2368 14.7664 16.8443 14.2389C17.4568 13.7072 18.0436 13.1568 18.4693 12.6749C18.6832 12.4329 18.8788 12.1548 18.9721 12Z"
                                fill="currentColor"
                              ></path>
                            </svg>
                          </div>
                          <div
                            className="package-list-text"
                            dangerouslySetInnerHTML={{ __html: item }}
                          />
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

              {/* Safety for the Trek */}
              {packageData.safety_for_trek && (
                <div id="safety-for-trek" className="package-section">
                  <h2 className="package-section-title">
                    <Shield size={24} className="package-section-title-icon" />
                    Safety for the Trek
                  </h2>
                  <div className="package-safety-wrapper">
                    <div
                      ref={safetyRef}
                      className="package-exclusions package-safety-animated collapsed"
                      style={{
                        maxHeight: "200px",
                        overflow: "hidden",
                      }}
                    >
                      {parseContentToList(packageData.safety_for_trek).map(
                        (item, index) => (
                          <div key={index} className="package-list-item">
                            <div
                              className="package-list-text"
                              dangerouslySetInnerHTML={{ __html: item }}
                            />
                          </div>
                        ),
                      )}
                    </div>
                    {showSafetyMore && (
                      <div className="package-show-more-container">
                        <button
                          className="package-show-more-btn package-show-more-btn-safety"
                          onClick={toggleSafety}
                          aria-label={
                            isSafetyExpanded ? "Show less" : "Show more"
                          }
                        >
                          <span>
                            {isSafetyExpanded ? "Show Less" : "Show More"}
                          </span>
                          <svg
                            className={`package-show-more-icon package-show-more-icon-safety ${isSafetyExpanded ? "expanded" : ""}`}
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Why Choose Us */}
              {whyChooseUsItems.length > 0 && (
                <div id="why-choose-us" className="package-section">
                  <h2 className="package-section-title">
                    <Star size={24} className="package-section-title-icon" />
                    Why Choose Us
                  </h2>
                  <div className="package-inclusions">
                    {whyChooseUsItems
                      .map((item) => getWhyChooseUsItemHtml(item))
                      .filter(Boolean)
                      .map((html, index) => (
                        <div key={index} className="package-list-item">
                          <div className="package-list-icon">
                            <svg
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                fill-rule="evenodd"
                                clip-rule="evenodd"
                                d="M21 12C21 12.5523 20.5523 13 20 13H4C3.44772 13 3 12.5523 3 12C3 11.4477 3.44772 11 4 11H20C20.5523 11 21 11.4477 21 12Z"
                                fill="currentColor"
                              ></path>
                              <path
                                d="M18.9721 12C18.8788 11.8452 18.6832 11.5671 18.4693 11.3251C18.0436 10.8432 17.4568 10.2928 16.8443 9.76105C16.2368 9.23357 15.6263 8.74365 15.166 8.38437C14.9363 8.20515 14.54 7.90576 14.4068 7.80521C13.9622 7.47768 13.8672 6.85173 14.1947 6.40706C14.5222 5.96236 15.1482 5.86736 15.5929 6.19487L15.5966 6.19767C15.741 6.30672 16.1597 6.62291 16.3964 6.80767C16.8735 7.18002 17.5131 7.69303 18.1555 8.25084C18.793 8.80434 19.4563 9.4216 19.9681 10.0008C20.2229 10.2892 20.4614 10.5918 20.6415 10.8906C20.8051 11.162 20.9999 11.5568 20.9999 12C20.9999 12.4431 20.8051 12.838 20.6415 13.1094C20.4614 13.4082 20.2229 13.7108 19.9681 13.9992C19.4563 14.5784 18.793 15.1957 18.1555 15.7492C17.5131 16.307 16.8735 16.82 16.3964 17.1923C16.1597 17.3771 15.7413 17.6931 15.5969 17.8021L15.5929 17.8051C15.1482 18.1326 14.5222 18.0376 14.1947 17.5929C13.8672 17.1483 13.9622 16.5223 14.4068 16.1948C14.54 16.0942 14.9363 15.7948 15.166 15.6156C15.6263 15.2564 16.2368 14.7664 16.8443 14.2389C17.4568 13.7072 18.0436 13.1568 18.4693 12.6749C18.6832 12.4329 18.8788 12.1548 18.9721 12Z"
                                fill="currentColor"
                              ></path>
                            </svg>
                          </div>
                          <div
                            className="package-list-text"
                            dangerouslySetInnerHTML={{ __html: html }}
                          />
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
                    <h2 className="package-section-title">
                      <HelpCircle
                        size={24}
                        className="package-section-title-icon"
                      />
                      Frequently Asked Questions
                    </h2>
                    <div className="package-faqs">
                      {packageData.faqs.map((faq, index) => (
                        <div key={index} className="package-faq-item">
                          <button
                            className="package-faq-question"
                            onClick={() =>
                              setExpandedFaq(
                                expandedFaq === index ? null : index,
                              )
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
              {(packageData.cancellation_policy ||
                packageData.refund_policy) && (
                <div id="policies" className="package-section">
                  <div className="package-policies-section">
                    <h2 className="package-section-title">
                      <FileText
                        size={24}
                        className="package-section-title-icon"
                      />
                      Policies
                    </h2>
                    <div className="package-policies-grid">
                      {packageData.cancellation_policy && (
                        <div className="package-policy-box">
                          <h4 className="package-policy-title">
                            Cancellation Policy
                          </h4>
                          <div
                            className="package-policy-content"
                            dangerouslySetInnerHTML={{
                              __html: packageData.cancellation_policy,
                            }}
                          />
                        </div>
                      )}
                      {packageData.refund_policy && (
                        <div className="package-policy-box">
                          <h4 className="package-policy-title">
                            Refund Policy
                          </h4>
                          <div
                            className="package-policy-content"
                            dangerouslySetInnerHTML={{
                              __html: packageData.refund_policy,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Sticky Form - Premium Design */}
            <div className="package-content-right" ref={sidebarRef}>
              {/* Mobile Only: Breadcrumbs, Title, and Meta */}
              <div className="package-mobile-header">
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
                  {packageData.departure_and_return_location && (
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
                      <span>{packageData.departure_and_return_location}</span>
                    </div>
                  )}
                  {packageData.trek_length && (
                    <div className="package-meta-item">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M3 12h18M12 3v18"></path>
                      </svg>
                      <span>{packageData.trek_length}</span>
                    </div>
                  )}
                  {packageData.base_camp && (
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
                      <span>{packageData.base_camp}</span>
                    </div>
                  )}
                  {packageData.departure_time && (
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
                      <span>{packageData.departure_time}</span>
                    </div>
                  )}
                </div>
              </div>

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
                          <span className="package-price-onwards">
                            /onwards
                          </span>
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
                {packageData.document_url && (
                  <div className="package-action-buttons">
                    <button
                      type="button"
                      className="package-download-btn"
                      onClick={() => setIsPdfModalOpen(true)}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      <span>Download PDF</span>
                    </button>
                  </div>
                )}

                {/* Package Details Section */}
                <div className="package-details-section">
                  <h4 className="package-details-title">Package Details</h4>
                  <div className="package-details-list">
                    {packageData.package_duration && (
                      <div className="package-detail-row">
                        <Calendar size={18} strokeWidth={2} />
                        <span className="package-detail-text">
                          <span className="package-detail-label">
                            Duration:
                          </span>{" "}
                          <span className="package-detail-value">
                            {packageData.package_duration}
                          </span>
                        </span>
                      </div>
                    )}
                    {packageData.difficulty && (
                      <div className="package-detail-row">
                        <Star size={18} strokeWidth={2} />
                        <span className="package-detail-text">
                          <span className="package-detail-label">
                            Difficulty:
                          </span>{" "}
                          <span className="package-detail-value">
                            {packageData.difficulty}
                          </span>
                        </span>
                      </div>
                    )}
                    {packageData.altitude && (
                      <div className="package-detail-row">
                        <Mountain size={18} strokeWidth={2} />
                        <span className="package-detail-text">
                          <span className="package-detail-label">
                            Altitude:
                          </span>{" "}
                          <span className="package-detail-value">
                            {packageData.altitude}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Booking Dates - Collapsible */}
                {/* {packageData.booking_dates &&
                  packageData.booking_dates.length > 0 && (
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
                      <div
                        className={`package-booking-dates-content ${isDatesExpanded ? "open" : ""}`}
                      >
                        <div className="package-booking-dates-list">
                          {packageData.booking_dates.map((date, index) => {
                            const dateObj = new Date(date);
                            const formattedDate = dateObj.toLocaleDateString(
                              "en-US",
                              {
                                weekday: "short",
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            );
                            return (
                              <div
                                key={index}
                                className="package-booking-date-item"
                              >
                                <Calendar size={16} />
                                <span>{formattedDate}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )} */}

                {/* Contact Information */}
                <div className="package-contact-section">
                  <h4 className="package-contact-title">
                    Need Help? Talk to our Mountain Expert
                  </h4>
                  <a href="tel:+917817849247" className="package-call-now-btn">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    <span>Call Now</span>
                  </a>
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
                  setSelectedImageIndex((prev) =>
                    prev <= 0 ? displayImages.length - 1 : prev - 1,
                  );
                }}
                aria-label="Previous image"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ transform: "scaleX(-1)" }}
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M21 12C21 12.5523 20.5523 13 20 13H4C3.44772 13 3 12.5523 3 12C3 11.4477 3.44772 11 4 11H20C20.5523 11 21 11.4477 21 12Z"
                    fill="currentColor"
                  ></path>
                  <path
                    d="M18.9721 12C18.8788 11.8452 18.6832 11.5671 18.4693 11.3251C18.0436 10.8432 17.4568 10.2928 16.8443 9.76105C16.2368 9.23357 15.6263 8.74365 15.166 8.38437C14.9363 8.20515 14.54 7.90576 14.4068 7.80521C13.9622 7.47768 13.8672 6.85173 14.1947 6.40706C14.5222 5.96236 15.1482 5.86736 15.5929 6.19487L15.5966 6.19767C15.741 6.30672 16.1597 6.62291 16.3964 6.80767C16.8735 7.18002 17.5131 7.69303 18.1555 8.25084C18.793 8.80434 19.4563 9.4216 19.9681 10.0008C20.2229 10.2892 20.4614 10.5918 20.6415 10.8906C20.8051 11.162 20.9999 11.5568 20.9999 12C20.9999 12.4431 20.8051 12.838 20.6415 13.1094C20.4614 13.4082 20.2229 13.7108 19.9681 13.9992C19.4563 14.5784 18.793 15.1957 18.1555 15.7492C17.5131 16.307 16.8735 16.82 16.3964 17.1923C16.1597 17.3771 15.7413 17.6931 15.5969 17.8021L15.5929 17.8051C15.1482 18.1326 14.5222 18.0376 14.1947 17.5929C13.8672 17.1483 13.9622 16.5223 14.4068 16.1948C14.54 16.0942 14.9363 15.7948 15.166 15.6156C15.6263 15.2564 16.2368 14.7664 16.8443 14.2389C17.4568 13.7072 18.0436 13.1568 18.4693 12.6749C18.6832 12.4329 18.8788 12.1548 18.9721 12Z"
                    fill="currentColor"
                  ></path>
                </svg>
              </button>
              <button
                className="package-lightbox-nav package-lightbox-nav-next"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex((prev) =>
                    prev >= displayImages.length - 1 ? 0 : prev + 1,
                  );
                }}
                aria-label="Next image"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M21 12C21 12.5523 20.5523 13 20 13H4C3.44772 13 3 12.5523 3 12C3 11.4477 3.44772 11 4 11H20C20.5523 11 21 11.4477 21 12Z"
                    fill="currentColor"
                  ></path>
                  <path
                    d="M18.9721 12C18.8788 11.8452 18.6832 11.5671 18.4693 11.3251C18.0436 10.8432 17.4568 10.2928 16.8443 9.76105C16.2368 9.23357 15.6263 8.74365 15.166 8.38437C14.9363 8.20515 14.54 7.90576 14.4068 7.80521C13.9622 7.47768 13.8672 6.85173 14.1947 6.40706C14.5222 5.96236 15.1482 5.86736 15.5929 6.19487L15.5966 6.19767C15.741 6.30672 16.1597 6.62291 16.3964 6.80767C16.8735 7.18002 17.5131 7.69303 18.1555 8.25084C18.793 8.80434 19.4563 9.4216 19.9681 10.0008C20.2229 10.2892 20.4614 10.5918 20.6415 10.8906C20.8051 11.162 20.9999 11.5568 20.9999 12C20.9999 12.4431 20.8051 12.838 20.6415 13.1094C20.4614 13.4082 20.2229 13.7108 19.9681 13.9992C19.4563 14.5784 18.793 15.1957 18.1555 15.7492C17.5131 16.307 16.8735 16.82 16.3964 17.1923C16.1597 17.3771 15.7413 17.6931 15.5969 17.8021L15.5929 17.8051C15.1482 18.1326 14.5222 18.0376 14.1947 17.5929C13.8672 17.1483 13.9622 16.5223 14.4068 16.1948C14.54 16.0942 14.9363 15.7948 15.166 15.6156C15.6263 15.2564 16.2368 14.7664 16.8443 14.2389C17.4568 13.7072 18.0436 13.1568 18.4693 12.6749C18.6832 12.4329 18.8788 12.1548 18.9721 12Z"
                    fill="currentColor"
                  ></path>
                </svg>
              </button>
            </>
          )}

          <div
            className="package-lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={displayImages[selectedImageIndex]}
              alt={packageData.package_name}
              width={1200}
              height={800}
              className="package-lightbox-image"
              style={{
                width: "auto",
                height: "auto",
                maxWidth: "90vw",
                maxHeight: "90vh",
              }}
            />
          </div>
        </div>
      )}

      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />

      {packageData.document_url && (
        <PdfDownloadModal
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
          pdfUrl={packageData.document_url}
          packageName={packageData.package_name}
        />
      )}

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

function RecentPackagesSlider({
  currentPackageId,
}: {
  currentPackageId: string;
}) {
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
          return;
        }

        if (data) {
          setPackages(data as RecentPackage[]);
        }
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [currentPackageId]);

  // GSAP slider animation
  useEffect(() => {
    if (
      !trackRef.current ||
      !trackRef.current.children[0] ||
      packages.length === 0
    )
      return;

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

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (loading || packages.length === 0) {
    return null;
  }

  return (
    <section className="recent-packages-section">
      <div className="recent-packages-container">
        <div className="recent-packages-header">
          <h2 className="recent-packages-title">Recent Packages</h2>
          <p className="recent-packages-subtitle">
            Explore more amazing adventures
          </p>
        </div>

        <div className="recent-packages-slider-wrapper">
          {packages.length > cardsToShow && (
            <>
              <button
                className="recent-packages-nav recent-packages-nav-prev"
                onClick={prevSlide}
                aria-label="Previous packages"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ transform: "scaleX(-1)" }}
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M21 12C21 12.5523 20.5523 13 20 13H4C3.44772 13 3 12.5523 3 12C3 11.4477 3.44772 11 4 11H20C20.5523 11 21 11.4477 21 12Z"
                    fill="currentColor"
                  ></path>
                  <path
                    d="M18.9721 12C18.8788 11.8452 18.6832 11.5671 18.4693 11.3251C18.0436 10.8432 17.4568 10.2928 16.8443 9.76105C16.2368 9.23357 15.6263 8.74365 15.166 8.38437C14.9363 8.20515 14.54 7.90576 14.4068 7.80521C13.9622 7.47768 13.8672 6.85173 14.1947 6.40706C14.5222 5.96236 15.1482 5.86736 15.5929 6.19487L15.5966 6.19767C15.741 6.30672 16.1597 6.62291 16.3964 6.80767C16.8735 7.18002 17.5131 7.69303 18.1555 8.25084C18.793 8.80434 19.4563 9.4216 19.9681 10.0008C20.2229 10.2892 20.4614 10.5918 20.6415 10.8906C20.8051 11.162 20.9999 11.5568 20.9999 12C20.9999 12.4431 20.8051 12.838 20.6415 13.1094C20.4614 13.4082 20.2229 13.7108 19.9681 13.9992C19.4563 14.5784 18.793 15.1957 18.1555 15.7492C17.5131 16.307 16.8735 16.82 16.3964 17.1923C16.1597 17.3771 15.7413 17.6931 15.5969 17.8021L15.5929 17.8051C15.1482 18.1326 14.5222 18.0376 14.1947 17.5929C13.8672 17.1483 13.9622 16.5223 14.4068 16.1948C14.54 16.0942 14.9363 15.7948 15.166 15.6156C15.6263 15.2564 16.2368 14.7664 16.8443 14.2389C17.4568 13.7072 18.0436 13.1568 18.4693 12.6749C18.6832 12.4329 18.8788 12.1548 18.9721 12Z"
                    fill="currentColor"
                  ></path>
                </svg>
              </button>
              <button
                className="recent-packages-nav recent-packages-nav-next"
                onClick={nextSlide}
                aria-label="Next packages"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M21 12C21 12.5523 20.5523 13 20 13H4C3.44772 13 3 12.5523 3 12C3 11.4477 3.44772 11 4 11H20C20.5523 11 21 11.4477 21 12Z"
                    fill="currentColor"
                  ></path>
                  <path
                    d="M18.9721 12C18.8788 11.8452 18.6832 11.5671 18.4693 11.3251C18.0436 10.8432 17.4568 10.2928 16.8443 9.76105C16.2368 9.23357 15.6263 8.74365 15.166 8.38437C14.9363 8.20515 14.54 7.90576 14.4068 7.80521C13.9622 7.47768 13.8672 6.85173 14.1947 6.40706C14.5222 5.96236 15.1482 5.86736 15.5929 6.19487L15.5966 6.19767C15.741 6.30672 16.1597 6.62291 16.3964 6.80767C16.8735 7.18002 17.5131 7.69303 18.1555 8.25084C18.793 8.80434 19.4563 9.4216 19.9681 10.0008C20.2229 10.2892 20.4614 10.5918 20.6415 10.8906C20.8051 11.162 20.9999 11.5568 20.9999 12C20.9999 12.4431 20.8051 12.838 20.6415 13.1094C20.4614 13.4082 20.2229 13.7108 19.9681 13.9992C19.4563 14.5784 18.793 15.1957 18.1555 15.7492C17.5131 16.307 16.8735 16.82 16.3964 17.1923C16.1597 17.3771 15.7413 17.6931 15.5969 17.8021L15.5929 17.8051C15.1482 18.1326 14.5222 18.0376 14.1947 17.5929C13.8672 17.1483 13.9622 16.5223 14.4068 16.1948C14.54 16.0942 14.9363 15.7948 15.166 15.6156C15.6263 15.2564 16.2368 14.7664 16.8443 14.2389C17.4568 13.7072 18.0436 13.1568 18.4693 12.6749C18.6832 12.4329 18.8788 12.1548 18.9721 12Z"
                    fill="currentColor"
                  ></path>
                </svg>
              </button>
            </>
          )}

          <div className="recent-packages-track" ref={trackRef}>
            {packages.map((pkg) => (
              <Link
                key={pkg.id}
                href={`/packages/${pkg.slug}`}
                className="recent-package-card"
              >
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
                    {stripHtmlTags(pkg.package_description) ||
                      "Experience an amazing adventure with our carefully crafted package."}
                  </p>
                  <div className="recent-package-details">
                    {pkg.difficulty && (
                      <div className="recent-package-detail-item">
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
                      <div className="recent-package-detail-item">
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
                  <div className="recent-package-footer">
                    <div className="recent-package-price">
                      {pkg.discounted_price &&
                      pkg.discounted_price < (pkg.price || 0) ? (
                        <>
                          <span className="recent-package-price-original">
                            ₹{pkg.price?.toLocaleString()}
                          </span>
                          <span className="recent-package-price-current">
                            ₹{pkg.discounted_price.toLocaleString()}
                          </span>
                        </>
                      ) : (
                        <span className="recent-package-price-current">
                          ₹{pkg.price?.toLocaleString() || "N/A"}
                        </span>
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
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </div>
                      <span className="recent-package-book-btn-text">
                        View Details
                      </span>
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Navigation Dots */}
          {packages.length > cardsToShow && (
            <div className="recent-packages-dots">
              {Array.from({ length: maxIndex + 1 }).map((_, index) => (
                <button
                  key={index}
                  className={`recent-packages-dot ${index === currentIndex ? "active" : ""}`}
                  onClick={() => goToSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
