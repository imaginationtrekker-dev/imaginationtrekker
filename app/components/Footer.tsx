"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Mail, Phone, ChevronRight } from "lucide-react";

interface Package {
  id: string;
  package_name: string;
  slug: string;
}

export default function Footer() {
  const [packages, setPackages] = useState<Package[]>([]);

  useEffect(() => {
    fetch("/api/packages?pageNumber=1")
      .then((res) => res.json())
      .then((data) => {
        if (data.packages) {
          setPackages(data.packages.slice(0, 5));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="footer-section">
      <div className="footer-bg-pattern" aria-hidden="true" />
      <div className="footer-content">
        {/* CTA / Newsletter */}
        <div className="footer-cta">
          <h2 className="footer-cta-title">
            Your next Himalayan adventure starts here
          </h2>
          <p className="footer-cta-subtitle">
            Explore handpicked treks, curated itineraries, and unforgettable
            experiences across the Himalayas.
          </p>
          <div className="footer-cta-actions">
            <Link
              href="/packages"
              className="footer-cta-button footer-cta-button-link"
            >
              View Packages
            </Link>
          </div>
        </div>

        {/* Top Section - Logo, Tagline, Social */}
        <div className="footer-top">
          <div className="footer-brand">
            <Link href="/" className="footer-logo">
              <Image
                src="/images/logo-old.png"
                alt="Imagination Trekker"
                width={160}
                height={64}
                priority
              />
            </Link>
            <p className="footer-tagline">
              Embark on a journey of a lifetime with Imagination Trekker—your
              trusted companion for expert-led Himalayan expeditions, customized
              itineraries, and awe-inspiring experiences. We’re passionate about
              connecting adventurers with the magic, culture, and breathtaking
              beauty of the Himalayas, crafting memories you’ll treasure
              forever.
            </p>
            <div className="footer-social">
              <a
                href="https://www.instagram.com/imagination_trekker/"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
                aria-label="Instagram"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.266.07 1.646.07 4.85 0 3.204-.012 3.584-.07 4.85-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.646.07-4.85.07-3.204 0-3.584-.012-4.85-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.266-.07-1.646-.07-4.849 0-3.259.014-3.668.072-4.948.2-4.358 2.618-6.78 6.98-6.98 1.281-.057 1.689-.072 4.948-.072zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162z"
                    fill="currentColor"
                  />
                </svg>
              </a>
              <a
                href="https://www.facebook.com/people/Imagination-Trekker/61586751645068/"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
                aria-label="Facebook"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                    fill="currentColor"
                  />
                </svg>
              </a>
            </div>
          </div>

          {/* Main Grid - Packages + Links */}
          <div className="footer-main">
            {/* Latest Packages Column */}
            <div className="footer-column footer-column-packages">
              <h3 className="footer-column-title">Packages</h3>
              <div className="footer-column-content">
                {packages.length > 0 ? (
                  <ul className="footer-packages-list">
                    {packages.map((pkg) => (
                      <li key={pkg.id}>
                        <Link
                          href={`/packages/${pkg.slug}`}
                          className="footer-package-link"
                        >
                          <ChevronRight
                            className="footer-link-chevron"
                            size={14}
                          />
                          {pkg.package_name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="footer-placeholder">Loading packages...</p>
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div className="footer-column">
              <h3 className="footer-column-title">Explore</h3>
              <div className="footer-column-content">
                <Link href="/" className="footer-nav-link">
                  <ChevronRight className="footer-link-chevron" size={14} />
                  Home
                </Link>
                <Link href="/packages" className="footer-nav-link">
                  <ChevronRight className="footer-link-chevron" size={14} />
                  All Packages
                </Link>
                <Link href="/gallery" className="footer-nav-link">
                  <ChevronRight className="footer-link-chevron" size={14} />
                  Gallery
                </Link>
                <Link href="/about" className="footer-nav-link">
                  <ChevronRight className="footer-link-chevron" size={14} />
                  About Us
                </Link>
                <Link href="/contact" className="footer-nav-link">
                  <ChevronRight className="footer-link-chevron" size={14} />
                  Contact
                </Link>
              </div>
            </div>

            {/* Contact & Legal */}
            <div className="footer-column">
              <h3 className="footer-column-title">Contact</h3>
              <div className="footer-column-content">
                <a
                  href="mailto:imaginationtrekker@gmail.com"
                  className="footer-contact-link"
                >
                  <Mail size={16} />
                  imaginationtrekker@gmail.com
                </a>
                <a href="tel:+917817849247" className="footer-contact-link">
                  <Phone size={16} />
                  +91 78178 49247
                </a>
                <div className="footer-address">
                  <MapPin size={16} />
                  <span>
                    Badonwala Baisak, Arkedia Grant Premnagar, Dehradun,
                    Uttarakhand 248007
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <div className="footer-bottom-row">
            <div className="footer-legal-inline" aria-label="Legal links">
              <Link href="/privacy-policy" className="footer-legal-link">
                Privacy Policy
              </Link>
              <span className="footer-legal-sep" aria-hidden="true">
                •
              </span>
              <Link href="/terms-and-conditions" className="footer-legal-link">
                Terms & Conditions
              </Link>
              <span className="footer-legal-sep" aria-hidden="true">
                •
              </span>
              <Link href="/cancellation-policy" className="footer-legal-link">
                Cancellation Policy
              </Link>
            </div>

            <div className="footer-copyright">
              <p>
                © {new Date().getFullYear()} Imagination Trekker. All rights
                reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
