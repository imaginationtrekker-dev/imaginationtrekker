"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";

interface ServiceItem {
  title: string;
  description?: string;
  icon: "itinerary" | "support" | "expertise" | "safety";
}

const services: ServiceItem[] = [
  {
    title: "Personalized Itineraries",
    description: "Every Char Dham journey is unique. We craft custom itineraries tailored to your fitness level, spiritual goals, and time constraints. Whether you're seeking a challenging trek to Kedarnath or a serene pilgrimage to Badrinath, our expert team designs routes that match your pace and preferences.",
    icon: "itinerary",
  },
  {
    title: "24/7 On-Trip Support",
    description: "Travel with complete peace of mind knowing that our dedicated support team is available around the clock, wherever you are. Whether you need assistance with an itinerary change, help with a local recommendation, or a solution to an unexpected issue, we're just a call away throughout your entire journey.",
    icon: "support",
  },
  {
    title: "Expertise and Experiences",
    description: "From flights and accommodations to excursions and dining experiences, our expert team handles every detail with precision. We ensure that each component of your trip is meticulously organized, so you can focus on what really matters—enjoying your journey through the sacred Himalayas.",
    icon: "expertise",
  },
  {
    title: "Safety First Approach",
    description: "Your safety is our top priority. We provide certified guides, comprehensive medical support, and emergency protocols for all high-altitude treks. With years of experience navigating the challenging terrain of the Char Dham circuit, we ensure every trekker returns home safely with unforgettable memories.",
    icon: "safety",
  },
];

const getIcon = (iconType: string) => {
  switch (iconType) {
    case "itinerary":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      );
    case "support":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
        </svg>
      );
    case "expertise":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 20h9"></path>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
        </svg>
      );
    case "safety":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          <path d="M9 12l2 2 4-4"></path>
        </svg>
      );
    default:
      return null;
  }
};

export default function WhyChooseUs() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Initialize all content as closed
  useEffect(() => {
    contentRefs.current.forEach((content) => {
      if (!content) return;
      gsap.set(content, { height: 0, opacity: 0 });
    });
  }, []);

  // GSAP animations for accordion and opacity
  useEffect(() => {
    // Animate item opacity
    itemRefs.current.forEach((item, index) => {
      if (!item) return;
      const isActive = openIndex === index;
      const hasOpenItem = openIndex !== null;
      
      if (hasOpenItem) {
        gsap.to(item, {
          opacity: isActive ? 1 : 0.4,
          duration: 0.4,
          ease: "power2.out",
        });
      } else {
        gsap.to(item, {
          opacity: 1,
          duration: 0.4,
          ease: "power2.out",
        });
      }
    });

    // Animate content height
    contentRefs.current.forEach((content, index) => {
      if (!content) return;

      const isOpen = openIndex === index;

      if (isOpen) {
        // Get the natural height without causing visible layout shift
        const startHeight = content.offsetHeight || 0;
        
        // Measure height by temporarily expanding, but do it synchronously to minimize shift
        const wasHidden = content.style.display === 'none' || content.style.visibility === 'hidden';
        const originalHeight = content.style.height;
        const originalOverflow = content.style.overflow;
        
        // Temporarily set to measure
        content.style.height = 'auto';
        content.style.overflow = 'hidden';
        content.style.position = 'absolute';
        content.style.visibility = 'hidden';
        content.style.display = 'block';
        
        const targetHeight = content.scrollHeight;
        
        // Immediately restore
        content.style.height = originalHeight || '0';
        content.style.overflow = originalOverflow || 'hidden';
        content.style.position = '';
        content.style.visibility = '';
        if (wasHidden) content.style.display = 'none';
        
        // Animate smoothly
        gsap.set(content, { height: startHeight, opacity: 0 });
        gsap.to(content, {
          height: targetHeight,
          opacity: 1,
          duration: 0.5,
          ease: "power2.out",
        });
      } else {
        const currentHeight = content.offsetHeight;
        if (currentHeight > 0) {
          gsap.to(content, {
            height: 0,
            opacity: 0,
            duration: 0.4,
            ease: "power2.in",
          });
        } else {
          gsap.set(content, { height: 0, opacity: 0 });
        }
      }
    });
  }, [openIndex]);

  // Initial animation on mount
  useEffect(() => {
    itemRefs.current.forEach((item, index) => {
      if (!item) return;

      gsap.from(item, {
        opacity: 0,
        x: -30,
        duration: 0.6,
        delay: index * 0.1,
        ease: "power2.out",
        onComplete: () => {
          gsap.set(item, { opacity: 1 });
        },
      });
    });
  }, []);

  return (
    <section className="why-choose-us-section">
      {/* Background Shape */}
      <div className="why-choose-us-bg">
        <Image
          src="/images/why-choose--us-bg-shape.png"
          alt="Background shape"
          fill
          priority
          className="why-choose-us-bg-image"
        />
      </div>

      <div className="why-choose-us-container">
        <div className="why-choose-us-content">
          {/* Left Side - Services List */}
          <div className="why-choose-us-left">
            <ul className="why-choose-us-list">
              {services.map((service, index) => (
                <li
                  key={index}
                  ref={(el) => {
                    itemRefs.current[index] = el;
                  }}
                  className={`why-choose-us-item ${openIndex === index ? "active" : openIndex !== null ? "inactive" : ""}`}
                >
                  <button
                    className="why-choose-us-item-header"
                    onClick={() => toggleItem(index)}
                    aria-expanded={openIndex === index}
                  >
                    <div className="why-choose-us-icon">
                      <div className="why-choose-us-icon-circle">
                        {getIcon(service.icon)}
                      </div>
                    </div>
                    <span className={`why-choose-us-text ${openIndex === index ? "active" : ""}`}>
                      {service.title}
                    </span>
                  </button>

                  <div
                    ref={(el) => {
                      contentRefs.current[index] = el;
                    }}
                    className="why-choose-us-item-content"
                  >
                    <p className="why-choose-us-description">{service.description}</p>
                  </div>

                  {index < services.length - 1 && (
                    <div className="why-choose-us-separator"></div>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Right Side - Placeholder Image */}
          <div className="why-choose-us-right">
            <div className="why-choose-us-image">
              <Image
                src="https://res.cloudinary.com/dtqlkcby9/image/upload/v1770645447/gallery_1770645442271_r1vywp4ljz.jpg"
                alt="Char Dham travel experience"
                width={600}
                height={800}
                className="why-choose-us-image-img"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
