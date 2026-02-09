"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const gliderRef = useRef<HTMLDivElement>(null);
  const activeLinkRef = useRef<HTMLElement | null>(null);

  const navItems = [
    { label: "Home", href: "/", hasDropdown: false },
    { label: "Packages", href: "/packages", hasDropdown: false },
    { label: "Gallery", href: "/gallery", hasDropdown: false },
    { label: "Contact", href: "/contact", hasDropdown: false },
  ];

  // GSAP glider animation
  useEffect(() => {
    if (!navRef.current || !gliderRef.current) return;

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      const activeLink = navRef.current?.querySelector(`.nav-link[href="${pathname}"]`) as HTMLElement;
      if (!activeLink) {
        // If no exact match, try to find partial match (e.g., /packages/[slug])
        const allLinks = navRef.current?.querySelectorAll(".nav-link");
        let found = false;
        allLinks?.forEach((link) => {
          const href = link.getAttribute("href");
          if (href && href !== "/" && pathname.startsWith(href)) {
            activeLinkRef.current = link as HTMLElement;
            found = true;
          }
        });
        if (!found && allLinks && allLinks.length > 0) {
          // Default to Home if no match
          activeLinkRef.current = allLinks[0] as HTMLElement;
        }
      } else {
        activeLinkRef.current = activeLink;
      }

      if (activeLinkRef.current && gliderRef.current && navRef.current) {
        // Get the offsetLeft relative to the nav container (accounts for padding)
        const offsetLeft = activeLinkRef.current.offsetLeft;
        const offsetWidth = activeLinkRef.current.offsetWidth;
        
        // Check if glider needs initial positioning
        const gliderStyle = getComputedStyle(gliderRef.current);
        const currentLeft = parseFloat(gliderStyle.left);
        const isInitial = currentLeft === 8 || (currentLeft === 0 && gliderStyle.opacity === '0');
        
        if (isInitial) {
          // Set initial position without animation
          gsap.set(gliderRef.current, {
            left: `${offsetLeft}px`,
            width: `${offsetWidth}px`,
            opacity: 1,
          });
        } else {
          // Animate smoothly
          gsap.to(gliderRef.current, {
            left: `${offsetLeft}px`,
            width: `${offsetWidth}px`,
            duration: 0.5,
            ease: "power2.out",
            overwrite: "auto",
          });
        }
      }
    });
  }, [pathname]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-content">
          {/* Logo */}
          <Link href="/" className="header-logo" onClick={closeMobileMenu}>
            <Image
              src="/images/logo.png"
              alt="Travlo Logo"
              width={200}
              height={80}
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="header-nav" ref={navRef}>
            <div className="nav-glider" ref={gliderRef}></div>
            {navItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className={`nav-link ${pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)) ? "active" : ""}`}
              >
                {item.label}
                {item.hasDropdown && (
                  <svg
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                )}
              </Link>
            ))}
          </nav>

          {/* Desktop Contact Button */}
          <Link href="/contact" className="contact-btn desktop-contact-btn">
            Contact Us
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fillRule="evenodd" clipRule="evenodd" d="M21 12C21 12.5523 20.5523 13 20 13H4C3.44772 13 3 12.5523 3 12C3 11.4477 3.44772 11 4 11H20C20.5523 11 21 11.4477 21 12Z" fill="currentColor"></path>
<path d="M18.9721 12C18.8788 11.8452 18.6832 11.5671 18.4693 11.3251C18.0436 10.8432 17.4568 10.2928 16.8443 9.76105C16.2368 9.23357 15.6263 8.74365 15.166 8.38437C14.9363 8.20515 14.54 7.90576 14.4068 7.80521C13.9622 7.47768 13.8672 6.85173 14.1947 6.40706C14.5222 5.96236 15.1482 5.86736 15.5929 6.19487L15.5966 6.19767C15.741 6.30672 16.1597 6.62291 16.3964 6.80767C16.8735 7.18002 17.5131 7.69303 18.1555 8.25084C18.793 8.80434 19.4563 9.4216 19.9681 10.0008C20.2229 10.2892 20.4614 10.5918 20.6415 10.8906C20.8051 11.162 20.9999 11.5568 20.9999 12C20.9999 12.4431 20.8051 12.838 20.6415 13.1094C20.4614 13.4082 20.2229 13.7108 19.9681 13.9992C19.4563 14.5784 18.793 15.1957 18.1555 15.7492C17.5131 16.307 16.8735 16.82 16.3964 17.1923C16.1597 17.3771 15.7413 17.6931 15.5969 17.8021L15.5929 17.8051C15.1482 18.1326 14.5222 18.0376 14.1947 17.5929C13.8672 17.1483 13.9622 16.5223 14.4068 16.1948C14.54 16.0942 14.9363 15.7948 15.166 15.6156C15.6263 15.2564 16.2368 14.7664 16.8443 14.2389C17.4568 13.7072 18.0436 13.1568 18.4693 12.6749C18.6832 12.4329 18.8788 12.1548 18.9721 12Z" fill="currentColor"></path>
</svg>
          </Link>

          {/* Mobile Hamburger Button */}
          <button 
            className={`mobile-menu-toggle ${isMobileMenuOpen ? "active" : ""}`}
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>

      {/* Mobile Full-Screen Menu */}
      <div className={`mobile-menu-overlay ${isMobileMenuOpen ? "open" : ""}`} onClick={closeMobileMenu}>
        <div className="mobile-menu-content" onClick={(e) => e.stopPropagation()}>
          {/* Close Button */}
          <button 
            className="mobile-menu-close"
            onClick={closeMobileMenu}
            aria-label="Close menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <nav className="mobile-nav">
            {navItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className={`mobile-nav-link ${pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)) ? "active" : ""}`}
                onClick={closeMobileMenu}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
