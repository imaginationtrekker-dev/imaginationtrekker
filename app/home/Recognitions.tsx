"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

interface Recognition {
  id: string;
  image_url: string;
  title: string;
  link_url: string | null;
  sort_order: number;
}

export default function Recognitions() {
  const marqueeRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<Recognition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/recognitions");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setItems(data.recognitions || []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!marqueeRef.current || items.length <= 5) return;

    const marquee = marqueeRef.current;
    const content = marquee.querySelector(".recognitions-marquee-content");
    if (!content) return;

    const existingClones = marquee.querySelectorAll(".recognitions-marquee-clone");
    existingClones.forEach((c) => c.remove());

    const clone = content.cloneNode(true) as HTMLElement;
    clone.classList.add("recognitions-marquee-clone");
    marquee.appendChild(clone);

    const contentWidth = content.getBoundingClientRect().width;

    const tl = gsap.timeline({ repeat: -1, ease: "none" });
    tl.fromTo(marquee, { x: 0 }, { x: -contentWidth, duration: 40, ease: "none" });

    return () => { tl.kill(); };
  }, [items]);

  if (loading) return null;
  if (items.length === 0) return null;

  const isMarquee = items.length > 5;
  const displayItems = isMarquee ? [...items, ...items, ...items] : items;

  return (
    <section className="recognitions-section">
      <div className="recognitions-container">
        <h2 className="recognitions-title">Our Recognitions</h2>

        {isMarquee ? (
          <div className="recognitions-marquee-wrapper">
            <div ref={marqueeRef} className="recognitions-marquee-track">
              <div className="recognitions-marquee-content">
                {displayItems.map((item, i) => (
                  <RecognitionItem key={`${item.id}-${i}`} item={item} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="recognitions-grid">
            {displayItems.map((item) => (
              <RecognitionItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function RecognitionItem({ item }: { item: Recognition }) {
  const content = (
    <div className="recognition-item">
      <div className="recognition-logo">
        <Image
          src={item.image_url}
          alt={item.title}
          width={140}
          height={60}
          style={{ objectFit: "contain", width: "auto", height: "100%", maxWidth: "140px" }}
          unoptimized
        />
      </div>
      <span className="recognition-label">{item.title}</span>
    </div>
  );

  if (item.link_url) {
    return (
      <a href={item.link_url} target="_blank" rel="noopener noreferrer" className="recognition-link">
        {content}
      </a>
    );
  }

  return content;
}
