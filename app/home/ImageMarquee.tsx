"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export default function ImageMarquee() {
  const marqueeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!marqueeRef.current) return;

    const marquee = marqueeRef.current;
    const marqueeContent = marquee.querySelector(".image-marquee-content");

    if (!marqueeContent) return;

    // Clone the content for seamless loop
    const clone = marqueeContent.cloneNode(true) as HTMLElement;
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
      }
    );

    return () => {
      tl.kill();
    };
  }, []);

  const images = [
    "/images/graphics-slider-image-1.png",
    "/images/graphics-slider-image-2.png",
    // "/images/graphics-slider-image-3.jpg",
  ];

  // Repeat images multiple times for seamless infinite loop
  const repeatedImages = [...images, ...images, ...images];

  return (
    <section className="image-marquee-section">
      <div className="image-marquee-container">
        <div ref={marqueeRef} className="image-marquee-wrapper">
          <div className="image-marquee-content">
            {repeatedImages.map((src, index) => (
              <div key={index} className="image-marquee-item">
                <Image
                  src={src}
                  alt={`Graphics slider image ${(index % 3) + 1}`}
                  width={400}
                  height={300}
                  className="image-marquee-img"
                  unoptimized
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
