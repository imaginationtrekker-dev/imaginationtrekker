"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

interface OfferBanner {
  id: string;
  image_url: string;
  alt_title: string | null;
  link_url: string | null;
  sort_order: number;
}

export default function ImageMarquee() {
  const marqueeRef = useRef<HTMLDivElement>(null);
  const [banners, setBanners] = useState<OfferBanner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBanners = async () => {
      try {
        const response = await fetch("/api/offer-banners");
        if (!response.ok) {
          const errorData = await response.json();

          throw new Error(errorData.error || "Failed to fetch offer banners");
        }
        const result = await response.json();

        setBanners(result.banners || []);
      } catch (err) {
        setBanners([]);
      } finally {
        setLoading(false);
      }
    };

    loadBanners();
  }, []);

  useEffect(() => {
    if (!marqueeRef.current || banners.length === 0) return;

    const marquee = marqueeRef.current;
    const marqueeContent = marquee.querySelector(".image-marquee-content");

    if (!marqueeContent) return;

    // Clear any existing clones
    const existingClones = marquee.querySelectorAll(".image-marquee-clone");
    existingClones.forEach((clone) => clone.remove());

    // Clone the content for seamless loop
    const clone = marqueeContent.cloneNode(true) as HTMLElement;
    clone.classList.add("image-marquee-clone");
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
        duration: 30,
        ease: "none",
      },
    );

    return () => {
      tl.kill();
    };
  }, [banners]);

  if (loading) {
    return (
      <section className="image-marquee-section">
        <div className="image-marquee-container">
          <div
            style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}
          >
            Loading banners...
          </div>
        </div>
      </section>
    );
  }

  if (banners.length === 0) {
    // Don't render anything if no banners - this is expected behavior
    return null;
  }

  // Repeat banners multiple times for seamless infinite loop
  const repeatedBanners = [...banners, ...banners, ...banners];

  return (
    <section className="image-marquee-section">
      <div className="image-marquee-container">
        <div ref={marqueeRef} className="image-marquee-wrapper">
          <div className="image-marquee-content">
            {repeatedBanners.map((banner, index) => {
              const bannerContent = (
                <Image
                  src={banner.image_url}
                  alt={banner.alt_title || `Offer banner ${index + 1}`}
                  width={400}
                  height={300}
                  className="image-marquee-img"
                  unoptimized
                />
              );
              return banner.link_url ? (
                <a
                  key={`${banner.id}-${index}`}
                  href={banner.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="image-marquee-item"
                  style={{ display: 'block' }}
                >
                  {bannerContent}
                </a>
              ) : (
                <div key={`${banner.id}-${index}`} className="image-marquee-item">
                  {bannerContent}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
