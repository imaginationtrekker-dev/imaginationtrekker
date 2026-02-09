"use client";

import Image from "next/image";

export default function Footer() {
  return (
    <footer className="footer-section">

      {/* Footer Content */}
      <div className="footer-content">
        {/* Header Section - Logo and Social Media */}
        <div className="footer-header">
          <div className="footer-logo">
            <Image
              src="/images/logo-old.png"
              alt="Travlo Logo"
              width={200}
              height={80}
              priority
            />
          </div>
          <div className="footer-social">
            <a 
              href="https://www.instagram.com/imagination_trekker/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="social-icon" 
              aria-label="Instagram"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.266.07 1.646.07 4.85 0 3.204-.012 3.584-.07 4.85-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.646.07-4.85.07-3.204 0-3.584-.012-4.85-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.266-.07-1.646-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.646-.069 4.85-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="currentColor"/>
              </svg>
            </a>
            <a 
              href="https://www.facebook.com/people/Imagination-Trekker/61586751645068/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="social-icon" 
              aria-label="Facebook"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="currentColor"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="footer-divider"></div>

        {/* Main Content - Four Columns */}
        <div className="footer-main">
          {/* Address Column */}
          <div className="footer-column">
            <h3 className="footer-column-title">Address</h3>
            <div className="footer-column-content">
              <p>123 Main Street</p>
              <p>New York, NY 10001</p>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="footer-column">
            <h3 className="footer-column-title">Quick Links</h3>
            <div className="footer-column-content">
              <a href="/" className="footer-link">Home</a>
              <a href="/packages" className="footer-link">Packages</a>
              <a href="/gallery" className="footer-link">Gallery</a>
              <a href="/contact" className="footer-link">Contact</a>
            </div>
          </div>

          {/* Contact Column */}
          <div className="footer-column">
            <h3 className="footer-column-title">Contact</h3>
            <div className="footer-column-content">
              <a href="mailto:travlo@gmail.com" className="footer-link">
                travlo@gmail.com
              </a>
              <a href="tel:+1500321852789" className="footer-link">
                +1 500 321 852 789
              </a>
            </div>
          </div>

          {/* Utility Pages Column */}
          <div className="footer-column">
            <h3 className="footer-column-title">Utility Pages</h3>
            <div className="footer-column-content">
              <a href="/privacy-policy" className="footer-link">Privacy Policy</a>
              <a href="/terms-and-conditions" className="footer-link">Terms & Conditions</a>
              <a href="/cancellation-policy" className="footer-link">Cancellation Policy</a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="footer-divider"></div>

        {/* Copyright Section */}
        <div className="footer-copyright">
          <p>Copyright © Travlo I Designed by Brandbes - Powered by Webflow</p>
        </div>
      </div>
    </footer>
  );
}
