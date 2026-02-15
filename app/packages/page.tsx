"use client";

import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";
import Image from "next/image";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { stripHtmlTags } from "@/lib/utils";
import { useSearchFilters } from "@/lib/store";
import "./page.css";
import "./cards.css";

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
  calculated_duration?: number;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

type SortOption = "title-asc" | "title-desc" | "date-asc" | "date-desc";

// Custom Dropdown Component
interface CustomDropdownProps {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  placeholder?: string;
}

function CustomDropdown({
  value,
  options,
  onChange,
  placeholder = "Select...",
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        if (
          menuRef.current &&
          !menuRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Calculate position for portal
      if (dropdownRef.current) {
        const rect = dropdownRef.current.getBoundingClientRect();
        setMenuPosition({
          top: rect.bottom + window.scrollY + 6,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  const dropdownMenu =
    isOpen && typeof window !== "undefined"
      ? createPortal(
          <div
            ref={menuRef}
            className="custom-dropdown-menu"
            style={{
              position: "absolute",
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
              width: `${menuPosition.width}px`,
              background: "#ffffff",
              backgroundColor: "#ffffff",
              opacity: 1,
              zIndex: 99999,
            }}
          >
            <div
              className="custom-dropdown-list"
              style={{
                background: "#ffffff",
                backgroundColor: "#ffffff",
                opacity: 1,
              }}
            >
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`custom-dropdown-item ${value === option.value ? "selected" : ""}`}
                  style={{
                    background: value === option.value ? "#e0f2fe" : "#ffffff",
                    backgroundColor:
                      value === option.value ? "#e0f2fe" : "#ffffff",
                    opacity: 1,
                  }}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div className="custom-dropdown" ref={dropdownRef}>
        <button
          type="button"
          className="custom-dropdown-button"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="custom-dropdown-selected">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <svg
            className={`custom-dropdown-chevron ${isOpen ? "open" : ""}`}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>
      {dropdownMenu}
    </>
  );
}

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

export default function PackagesPage() {
  // Get filters from Zustand store
  const {
    searchQuery: storeSearchQuery,
    minPrice,
    maxPrice,
    setSearchQuery: setStoreSearchQuery,
    setPriceRange,
  } = useSearchFilters();

  const [searchQuery, setSearchQuery] = useState(storeSearchQuery);
  const [activeSearchQuery, setActiveSearchQuery] = useState(storeSearchQuery);
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [packages, setPackages] = useState<Package[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [duration, setDuration] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Initialize from store on mount
  useEffect(() => {
    setSearchQuery(storeSearchQuery);
    setActiveSearchQuery(storeSearchQuery);
  }, [storeSearchQuery]);

  // Fetch packages from API
  const fetchPackages = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        pageNumber: currentPage.toString(),
        ...(activeSearchQuery && { searchQuery: activeSearchQuery }),
        sortBy,
        ...(minPrice > 0 && { minPrice: minPrice.toString() }),
        ...(maxPrice < 100000 && { maxPrice: maxPrice.toString() }),
        ...(duration && { duration: duration }),
        ...(difficulty && { difficulty }),
      });

      const response = await fetch(`/api/packages?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch packages");
      }

      const data = await response.json();
      setPackages(data.packages || []);
      setPagination(data.pagination || null);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    activeSearchQuery,
    sortBy,
    minPrice,
    maxPrice,
    duration,
    difficulty,
  ]);

  // Initial load
  useEffect(() => {
    fetchPackages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update API when page changes (for pagination)
  useEffect(() => {
    if (currentPage > 1) {
      fetchPackages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // Handle search button click - applies all filters
  const handleSearch = () => {
    // Update store with current search query
    setStoreSearchQuery(searchQuery);
    setActiveSearchQuery(searchQuery);
    setCurrentPage(1);

    // Trigger fetch with updated values
    setTimeout(() => {
      fetchPackages();
    }, 0);
  };

  // Handle reset button click
  const handleReset = () => {
    setSearchQuery("");
    setActiveSearchQuery("");
    setSortBy("date-desc");
    setPriceRange(0, 100000);
    setStoreSearchQuery("");
    setDuration("");
    setDifficulty("");
    setCurrentPage(1);

    // Trigger fetch after reset
    setTimeout(() => {
      fetchPackages();
    }, 0);
  };

  // Handle Enter key in search input
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) return "Contact Us";
    return `₹${price.toLocaleString()}`;
  };

  const sortOptions = [
    { value: "title-asc", label: "Title (A-Z)" },
    { value: "title-desc", label: "Title (Z-A)" },
    { value: "date-desc", label: "Date Added (Newest)" },
    { value: "date-asc", label: "Date Added (Oldest)" },
  ];

  const difficultyOptions = [
    { value: "", label: "All Difficulties" },
    { value: "Easy", label: "Easy" },
    { value: "Moderate", label: "Moderate" },
    { value: "Difficult", label: "Difficult" },
  ];

  const durationOptions = [
    { value: "", label: "All Durations" },
    { value: "1-3", label: "1-3 Days" },
    { value: "4-7", label: "4-7 Days" },
    { value: "8-14", label: "8-14 Days" },
    { value: "15-21", label: "15-21 Days" },
    { value: "22-30", label: "22-30 Days" },
    { value: "30+", label: "30+ Days" },
  ];

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="relative">
      <Header />

      {/* Banner Section */}
      <section className="packages-page-banner">
        <div className="packages-banner-background">
          <Image
            src="/images/banner-bg.jpg"
            alt="Packages banner"
            fill
            priority
            className="packages-banner-image"
          />
          <div className="packages-banner-overlay"></div>
        </div>
        <div className="packages-banner-content">
          <h1 className="packages-banner-title">Our Packages</h1>
          <nav className="breadcrumbs">
            <Link href="/" className="breadcrumb-link">
              Home
            </Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Packages</span>
          </nav>
        </div>
      </section>

      {/* Packages Section with Sidebar */}
      <section className="packages-page-section">
        <div className="packages-page-layout">
          {/* Left Sidebar - Filters */}
          <aside className="packages-sidebar">
            <div className="packages-filters-sidebar">
              <h3 className="filters-title">Filters</h3>

              {/* Search */}
              <div className="filter-group">
                <label className="filter-label">Search</label>
                <div className="search-input-wrapper">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="search-icon"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                  <input
                    type="text"
                    placeholder="Search packages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleSearchKeyPress}
                    className="search-input"
                  />
                </div>
              </div>

              {/* Sort By */}
              <div className="filter-group">
                <label className="filter-label">Sort By</label>
                <CustomDropdown
                  value={sortBy}
                  options={sortOptions}
                  onChange={(value) => {
                    setSortBy(value as SortOption);
                  }}
                  placeholder="Select sort option"
                />
              </div>

              {/* Difficulty */}
              <div className="filter-group">
                <label className="filter-label">Difficulty</label>
                <CustomDropdown
                  value={difficulty}
                  options={difficultyOptions}
                  onChange={(value) => {
                    setDifficulty(value);
                  }}
                  placeholder="All Difficulties"
                />
              </div>

              {/* Price Range */}
              <div className="filter-group">
                <label className="filter-label">Price Range</label>
                <PriceRangeSlider
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                  onPriceChange={(min, max) => {
                    setPriceRange(min, max);
                  }}
                />
              </div>

              {/* Duration */}
              <div className="filter-group">
                <label className="filter-label">Duration</label>
                <CustomDropdown
                  value={duration}
                  options={durationOptions}
                  onChange={(value) => {
                    setDuration(value);
                  }}
                  placeholder="All Durations"
                />
              </div>

              {/* Search Button - Full Width */}
              <button
                type="button"
                className="apply-filters-btn"
                onClick={handleSearch}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
                Apply Filters
              </button>

              {/* Reset Button - Full Width */}
              <button
                type="button"
                className="reset-filters-btn"
                onClick={handleReset}
              >
                Reset Filters
              </button>
            </div>
          </aside>

          {/* Right Content - Packages Grid */}
          <div className="packages-content">
            {/* Results Count */}
            {pagination && (
              <div className="packages-results">
                <p className="results-count">
                  Showing {(currentPage - 1) * pagination.itemsPerPage + 1}-
                  {Math.min(
                    currentPage * pagination.itemsPerPage,
                    pagination.totalItems,
                  )}{" "}
                  of {pagination.totalItems} packages
                </p>
              </div>
            )}

            {/* Packages Grid */}
            {loading ? (
              <div className="packages-loading-container">
                <div className="packages-loader">
                  <div className="loader-spinner"></div>
                  <p className="loader-text">Loading packages...</p>
                </div>
              </div>
            ) : packages.length === 0 ? (
              <div className="no-results">
                <p>No packages found matching your criteria.</p>
              </div>
            ) : (
              <div className="packages-grid">
                {packages.map((pkg) => (
                  <Link
                    key={pkg.id}
                    href={`/packages/${pkg.slug}`}
                    className="package-card-link"
                  >
                    <div className="package-card">
                      <div className="package-card-image">
                        <Image
                          src={
                            pkg.thumbnail_image_url ||
                            "/images/package-image.webp"
                          }
                          alt={pkg.package_name}
                          fill
                          className="package-image"
                        />
                      </div>
                      <div className="package-card-content">
                        <h3 className="package-card-title">
                          {pkg.package_name}
                        </h3>
                        <p className="package-card-description">
                          {stripHtmlTags(pkg.package_description) ||
                            "Experience an amazing adventure with our carefully crafted package."}
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
                            <span className="package-price-label">
                              Start From
                            </span>
                            <span className="package-price-amount">
                              {pkg.discounted_price
                                ? formatPrice(pkg.discounted_price)
                                : formatPrice(pkg.price)}
                            </span>
                          </div>
                          <button type="button" className="package-book-btn">
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
                            <span className="package-book-btn-text">
                              View Details
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                  Previous
                </button>
                <div className="pagination-numbers">
                  {(() => {
                    const pages: (number | string)[] = [];
                    const total = pagination.totalPages;
                    const current = currentPage;

                    if (total <= 7) {
                      for (let i = 1; i <= total; i++) {
                        pages.push(i);
                      }
                    } else {
                      pages.push(1);
                      if (current > 3) {
                        pages.push("...");
                      }
                      const start = Math.max(2, current - 1);
                      const end = Math.min(total - 1, current + 1);
                      for (let i = start; i <= end; i++) {
                        pages.push(i);
                      }
                      if (current < total - 2) {
                        pages.push("...");
                      }
                      pages.push(total);
                    }

                    return pages.map((page, index) => {
                      if (page === "...") {
                        return (
                          <span
                            key={`ellipsis-${index}`}
                            className="pagination-ellipsis"
                          >
                            ...
                          </span>
                        );
                      }
                      return (
                        <button
                          key={page}
                          className={`pagination-number ${page === currentPage ? "active" : ""}`}
                          onClick={() => goToPage(page as number)}
                        >
                          {page}
                        </button>
                      );
                    });
                  })()}
                </div>
                <button
                  className="pagination-btn"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                >
                  Next
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Mobile Filters Button - Fixed at Bottom */}
      <button
        className="mobile-filters-button"
        onClick={() => setIsMobileFiltersOpen(true)}
        aria-label="Open filters"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12 5H2" />
          <path d="M6 12h12" />
          <path d="M9 19h6" />
          <path d="M16 5h6" />
          <path d="M19 8V2" />
        </svg>
        <span>Filters</span>
      </button>

      {/* Mobile Filters Overlay */}
      {isMobileFiltersOpen && (
        <div
          className="mobile-filters-overlay"
          onClick={() => setIsMobileFiltersOpen(false)}
        ></div>
      )}

      {/* Mobile Filters Bottom Sheet */}
      <div
        className={`mobile-filters-panel ${isMobileFiltersOpen ? "open" : ""}`}
      >
        <div className="mobile-filters-panel-header">
          <h3 className="mobile-filters-panel-title">Filters</h3>
          <button
            className="mobile-filters-close-btn"
            onClick={() => setIsMobileFiltersOpen(false)}
            aria-label="Close filters"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="mobile-filters-panel-content">
          {/* Search */}
          <div className="filter-group">
            <label className="filter-label">Search</label>
            <div className="search-input-wrapper">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="search-icon"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input
                type="text"
                placeholder="Search packages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="search-input"
              />
            </div>
          </div>

          {/* Sort By and Duration in One Row (Mobile Only) */}
          <div className="mobile-filters-row">
            <div className="filter-group mobile-filter-half">
              <label className="filter-label">Sort By</label>
              <CustomDropdown
                value={sortBy}
                options={sortOptions}
                onChange={(value) => {
                  setSortBy(value as SortOption);
                }}
                placeholder="Select sort option"
              />
            </div>
            <div className="filter-group mobile-filter-half">
              <label className="filter-label">Duration</label>
              <CustomDropdown
                value={duration}
                options={durationOptions}
                onChange={(value) => {
                  setDuration(value);
                }}
                placeholder="All Durations"
              />
            </div>
          </div>

          {/* Difficulty */}
          <div className="filter-group">
            <label className="filter-label">Difficulty</label>
            <CustomDropdown
              value={difficulty}
              options={difficultyOptions}
              onChange={(value) => {
                setDifficulty(value);
              }}
              placeholder="All Difficulties"
            />
          </div>

          {/* Price Range */}
          <div className="filter-group">
            <label className="filter-label">Price Range</label>
            <PriceRangeSlider
              minPrice={minPrice}
              maxPrice={maxPrice}
              onPriceChange={(min, max) => {
                setPriceRange(min, max);
              }}
            />
          </div>

          {/* Apply Filters and Reset Buttons in One Row (Mobile Only) */}
          <div className="mobile-filters-buttons-row">
            <button
              type="button"
              className="apply-filters-btn mobile-filter-btn-half"
              onClick={() => {
                handleSearch();
                setIsMobileFiltersOpen(false);
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              Apply Filters
            </button>
            <button
              type="button"
              className="reset-filters-btn mobile-filter-btn-half"
              onClick={() => {
                handleReset();
                setIsMobileFiltersOpen(false);
              }}
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      <Footer />
      <FloatingButtons />
    </main>
  );
}
