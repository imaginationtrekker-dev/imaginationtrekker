"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap } from "gsap";
import { useRouter } from "next/navigation";
import { useSearchFilters } from "@/lib/store";
import { SearchIcon } from "lucide-react";

// Price Range Slider Component
function PriceRangeSlider({
  minPrice,
  maxPrice,
  onPriceChange,
}: {
  minPrice: number;
  maxPrice: number;
  onPriceChange: (min: number, max: number) => void;
}) {
  const [localMin, setLocalMin] = useState(minPrice);
  const [localMax, setLocalMax] = useState(maxPrice);
  const maxRange = 100000;

  useEffect(() => {
    setLocalMin(minPrice);
    setLocalMax(maxPrice);
  }, [minPrice, maxPrice]);

  const handleMinSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    const newMin = Math.min(value, localMax);
    setLocalMin(newMin);
    onPriceChange(newMin, localMax);
  };

  const handleMaxSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || maxRange;
    const newMax = Math.max(value, localMin);
    setLocalMax(newMax);
    onPriceChange(localMin, newMax);
  };

  const handleMinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    const newMin = Math.min(Math.max(0, value), localMax);
    setLocalMin(newMin);
    onPriceChange(newMin, localMax);
  };

  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || maxRange;
    const newMax = Math.max(Math.min(maxRange, value), localMin);
    setLocalMax(newMax);
    onPriceChange(localMin, newMax);
  };

  const minPercent = (localMin / maxRange) * 100;
  const maxPercent = (localMax / maxRange) * 100;

  return (
    <div className="price-range-slider">
      <div className="price-range-inputs">
        <input
          type="number"
          min={0}
          max={maxRange}
          value={localMin}
          onChange={handleMinInputChange}
          className="price-input"
        />
        <span className="price-separator">-</span>
        <input
          type="number"
          min={0}
          max={maxRange}
          value={localMax}
          onChange={handleMaxInputChange}
          className="price-input"
        />
      </div>
      <div
        className="slider-container"
        style={
          {
            "--slider-min-percent": `${minPercent}%`,
            "--slider-max-percent": `${maxPercent}%`,
          } as React.CSSProperties
        }
      >
        <input
          type="range"
          min={0}
          max={maxRange}
          step={500}
          value={localMin}
          onChange={handleMinSliderChange}
          className="slider slider-min"
        />
        <input
          type="range"
          min={0}
          max={maxRange}
          step={500}
          value={localMax}
          onChange={handleMaxSliderChange}
          className="slider slider-max"
        />
      </div>
    </div>
  );
}

export default function Banner() {
  const router = useRouter();
  const { searchQuery, minPrice, maxPrice, setSearchQuery, setPriceRange } =
    useSearchFilters();
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const budgetDropdownRef = useRef<HTMLDivElement>(null);
  const budgetMenuRef = useRef<HTMLDivElement>(null);
  const [budgetMenuPosition, setBudgetMenuPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  // Sync local state with store
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const bannerRef = useRef<HTMLElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const heroGirlRef = useRef<HTMLDivElement>(null);
  const [marqueeTexts, setMarqueeTexts] = useState<
    Array<{ text: string; link_url: string | null }>
  >([]);

  useEffect(() => {
    const loadMarqueeTexts = async () => {
      try {
        const response = await fetch("/api/banner-marquee-texts");
        if (!response.ok) {
          return;
        }
        const result = await response.json();
        setMarqueeTexts(result.texts || []);
      } catch (err) {}
    };

    loadMarqueeTexts();
  }, []);

  useEffect(() => {
    if (!marqueeRef.current || marqueeTexts.length === 0) return;

    const marquee = marqueeRef.current;
    const marqueeContent = marquee.querySelector(".marquee-content");

    if (!marqueeContent) return;

    // Clear any existing clones
    const existingClones = marquee.querySelectorAll(".marquee-clone");
    existingClones.forEach((clone) => clone.remove());

    // Clone the content for seamless loop
    const clone = marqueeContent.cloneNode(true) as HTMLElement;
    clone.classList.add("marquee-clone");
    marquee.appendChild(clone);

    // Get the width of the content
    const contentWidth = marqueeContent.getBoundingClientRect().width;

    // Create the animation
    const tl = gsap.timeline({ repeat: -1, ease: "none" });

    tl.fromTo(
      marquee,
      { x: 0 },
      {
        x: -contentWidth,
        duration: 100,
        ease: "none",
      },
    );

    return () => {
      tl.kill();
    };
  }, [marqueeTexts]);

  // Close budget dropdown when clicking outside and calculate position
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        budgetDropdownRef.current &&
        !budgetDropdownRef.current.contains(event.target as Node)
      ) {
        if (
          budgetMenuRef.current &&
          !budgetMenuRef.current.contains(event.target as Node)
        ) {
          setIsBudgetOpen(false);
        }
      }
    };

    if (isBudgetOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Calculate position for portal
      if (budgetDropdownRef.current) {
        const rect = budgetDropdownRef.current.getBoundingClientRect();
        setBudgetMenuPosition({
          top: rect.bottom + window.scrollY + 12,
          left: rect.left + window.scrollX,
          width: Math.min(rect.width, 400),
        });
      }
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isBudgetOpen]);

  const handleSearch = () => {
    // Update store with current search query
    setSearchQuery(localSearchQuery.trim());
    // Navigate to packages page
    router.push("/packages");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <section ref={bannerRef} className="banner-section">
      {/* Background Image */}
      <div ref={backgroundRef} className="banner-background">
        <Image
          src="/images/banner-bg.jpg"
          alt="Mountain landscape background"
          fill
          priority
        />
        {/* Overlay for better text readability */}
        <div className="banner-overlay"></div>
      </div>

      {/* Bottom Text - Marquee Animation with Char Dham Yatra - Behind the girl */}
      {marqueeTexts.length > 0 && (
        <div className="marquee-container">
          <div ref={marqueeRef} className="marquee-wrapper">
            <div className="marquee-content">
              {/* Repeat texts multiple times for seamless infinite loop */}
              {[...marqueeTexts, ...marqueeTexts, ...marqueeTexts].map(
                (item, index) => {
                  const textElement = (
                    <span
                      key={`${item.text}-${index}`}
                      className={`marquee-text ${
                        index % 2 === 0 ? "white" : "green"
                      }`}
                    >
                      {item.text}
                    </span>
                  );
                  return item.link_url ? (
                    <a
                      href={item.link_url}
                      key={`${item.text}-${index}`}
                      style={{
                        textDecoration: "none",
                        display: "inline-block",
                      }}
                    >
                      {textElement}
                    </a>
                  ) : (
                    textElement
                  );
                },
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hero Girl Image */}
      <div ref={heroGirlRef} className="hero-girl-container">
        <div className="hero-girl-wrapper">
          <Image
            src="/images/banner-girl.png"
            alt="Person on mountain peak"
            fill
            priority
          />
        </div>
      </div>

      {/* Content Overlay */}
      <div ref={contentRef} className="banner-content">
        <h1 className="banner-title">
          Explore Uttarakhand's Treks & Pilgrimages
        </h1>
        <p className="banner-description">
          Experience the sacred Char Dham and mesmerizing treks in Uttarakhand
          with our curated journeys.
        </p>

        {/* CTA Buttons */}
        {/* <div className="cta-buttons">
     
          <button className="call-now-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ><path d="M13 2a9 9 0 0 1 9 9"/><path d="M13 6a5 5 0 0 1 5 5"/><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/></svg>
            +91 78178 49247
          </button>

     
          <button className="view-packages-btn">
            <span className="view-packages-text">View Packages</span>
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M21 12C21 12.5523 20.5523 13 20 13H4C3.44772 13 3 12.5523 3 12C3 11.4477 3.44772 11 4 11H20C20.5523 11 21 11.4477 21 12Z" fill="currentColor"></path>
<path d="M18.9721 12C18.8788 11.8452 18.6832 11.5671 18.4693 11.3251C18.0436 10.8432 17.4568 10.2928 16.8443 9.76105C16.2368 9.23357 15.6263 8.74365 15.166 8.38437C14.9363 8.20515 14.54 7.90576 14.4068 7.80521C13.9622 7.47768 13.8672 6.85173 14.1947 6.40706C14.5222 5.96236 15.1482 5.86736 15.5929 6.19487L15.5966 6.19767C15.741 6.30672 16.1597 6.62291 16.3964 6.80767C16.8735 7.18002 17.5131 7.69303 18.1555 8.25084C18.793 8.80434 19.4563 9.4216 19.9681 10.0008C20.2229 10.2892 20.4614 10.5918 20.6415 10.8906C20.8051 11.162 20.9999 11.5568 20.9999 12C20.9999 12.4431 20.8051 12.838 20.6415 13.1094C20.4614 13.4082 20.2229 13.7108 19.9681 13.9992C19.4563 14.5784 18.793 15.1957 18.1555 15.7492C17.5131 16.307 16.8735 16.82 16.3964 17.1923C16.1597 17.3771 15.7413 17.6931 15.5969 17.8021L15.5929 17.8051C15.1482 18.1326 14.5222 18.0376 14.1947 17.5929C13.8672 17.1483 13.9622 16.5223 14.4068 16.1948C14.54 16.0942 14.9363 15.7948 15.166 15.6156C15.6263 15.2564 16.2368 14.7664 16.8443 14.2389C17.4568 13.7072 18.0436 13.1568 18.4693 12.6749C18.6832 12.4329 18.8788 12.1548 18.9721 12Z" fill="currentColor"></path>
</svg>
          </button>
        </div> */}

        {/* Search Bar */}
        <div className="banner-search-bar">
          <div className="search-bar-container">
            <div className="search-location-field">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search packages..."
                className="search-location-input"
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
            <div className="search-divider"></div>
            <div
              className="search-budget-field"
              ref={budgetDropdownRef}
              onClick={() => setIsBudgetOpen(!isBudgetOpen)}
            >
              <span className="budget-label">
                {minPrice === 0 && maxPrice === 100000
                  ? "Budget Range"
                  : `₹${minPrice.toLocaleString()} - ₹${maxPrice.toLocaleString()}`}
              </span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`budget-chevron ${isBudgetOpen ? "open" : ""}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
              {isBudgetOpen &&
                typeof window !== "undefined" &&
                createPortal(
                  <div
                    ref={budgetMenuRef}
                    className="banner-budget-dropdown"
                    style={{
                      position: "absolute",
                      top: `${budgetMenuPosition.top}px`,
                      left: `${budgetMenuPosition.left}px`,
                      width: `${budgetMenuPosition.width}px`,
                      background: "#ffffff",
                      backgroundColor: "#ffffff",
                      opacity: 1,
                      zIndex: 99999,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <PriceRangeSlider
                      minPrice={minPrice}
                      maxPrice={maxPrice}
                      onPriceChange={(min, max) => {
                        setPriceRange(min, max);
                      }}
                    />
                  </div>,
                  document.body,
                )}
            </div>
            <button className="search-button" onClick={handleSearch}>
              <SearchIcon />
            </button>
          </div>
        </div>
      </div>

      {/* Banner Line Image - Bottom Decorative Element */}
      <div className="banner-line">
        <Image
          src="/images/banner-line.png"
          alt="Banner decorative line"
          width={1920}
          height={200}
          priority
        />
      </div>

      <div className="home-section-bg"></div>
    </section>
  );
}
