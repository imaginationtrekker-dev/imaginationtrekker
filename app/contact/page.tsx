"use client";

import { useState, FormEvent, useEffect } from "react";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import FloatingButtons from "@/app/components/FloatingButtons";
import { MapPin, Phone, Mail, MessageCircle, Send, Clock, Loader2, CheckCircle2, XCircle } from "lucide-react";
import "./contact.css";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error";
}

export default function ContactPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    whatsapp: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({
      id: Date.now().toString(),
      message,
      type,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit enquiry");
      }

      // Show success toast
      showToast(result.message || "Thank you! We'll get back to you within 24 hours.", "success");
      
      // Reset form
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        whatsapp: "",
        message: "",
      });
    } catch (error: any) {
      console.error("Error submitting form:", error);
      // Show error toast
      showToast(error.message || "Failed to submit enquiry. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleWhatsAppClick = () => {
    const whatsappNumber = "917817849247";
    const message = encodeURIComponent("Hello! I'm interested in your trekking packages.");
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank");
  };

  return (
    <main className="contact-page">
      <Header />
      
      {/* Hero Section */}
      <section className="contact-hero">
        <div className="contact-hero-overlay"></div>
        <div className="contact-hero-content">
          <h1 className="contact-hero-title">Get in Touch</h1>
          <p className="contact-hero-subtitle">
            Have questions about our trekking packages? We're here to help you plan your perfect adventure.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section">
        <div className="contact-container">
          <div className="contact-grid">
            {/* Contact Form */}
            <div className="contact-form-wrapper">
              <div className="contact-form-header">
                <h2 className="contact-form-title">Send us a Message</h2>
                <p className="contact-form-subtitle">
                  Fill out the form below and we'll get back to you within 24 hours
                </p>
              </div>

              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="contact-form-group">
                  <label className="contact-form-label">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="contact-form-input"
                  />
                </div>

                <div className="contact-form-group">
                  <label className="contact-form-label">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="contact-form-input"
                  />
                </div>

                <div className="contact-form-row">
                  <div className="contact-form-group">
                    <label className="contact-form-label">
                      <Phone size={18} />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChange={handleChange}
                      className="contact-form-input"
                    />
                  </div>

                  <div className="contact-form-group">
                    <label className="contact-form-label">
                      <MessageCircle size={18} />
                      WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      name="whatsapp"
                      placeholder="Enter your WhatsApp number"
                      value={formData.whatsapp}
                      onChange={handleChange}
                      className="contact-form-input"
                    />
                  </div>
                </div>

                <div className="contact-form-group">
                  <label className="contact-form-label">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    Message *
                  </label>
                  <textarea
                    name="message"
                    placeholder="Tell us about your inquiry..."
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="contact-form-textarea"
                  />
                </div>

                <button 
                  type="submit" 
                  className="contact-form-submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="contact-submit-spinner" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Send Message
                      <Send size={18} />
                    </>
                  )}
                </button>

                <p className="contact-form-privacy">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  Your information is secure and will not be shared
                </p>
              </form>
            </div>

            {/* Contact Information */}
            <div className="contact-info-wrapper">
              <div className="contact-info-header">
                <h2 className="contact-info-title">Contact Information</h2>
                <p className="contact-info-subtitle">
                  Reach out to us through any of these channels
                </p>
              </div>

              <div className="contact-info-cards">
                <div className="contact-info-card">
                  <div className="contact-info-icon phone">
                    <Phone size={24} />
                  </div>
                  <h3 className="contact-info-card-title">Phone</h3>
                  <a href="tel:+917817849247" className="contact-info-link">
                    +91 78178 49247
                  </a>
                  <p className="contact-info-description">Call us for immediate assistance</p>
                </div>

                <div className="contact-info-card">
                  <div className="contact-info-icon email">
                    <Mail size={24} />
                  </div>
                  <h3 className="contact-info-card-title">Email</h3>
                  <a href="mailto:info@imaginationtrekker.com" className="contact-info-link">
                    info@imaginationtrekker.com
                  </a>
                  <p className="contact-info-description">Send us an email anytime</p>
                </div>

                <div className="contact-info-card">
                  <div className="contact-info-icon whatsapp">
                    <MessageCircle size={24} />
                  </div>
                  <h3 className="contact-info-card-title">WhatsApp</h3>
                  <button 
                    onClick={handleWhatsAppClick}
                    className="contact-info-link-button"
                  >
                    Chat with us on WhatsApp
                  </button>
                  <p className="contact-info-description">Quick response guaranteed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <FloatingButtons />

      {/* Toast Notification */}
      {toast && (
        <div className={`contact-toast contact-toast-${toast.type}`}>
          <div className="contact-toast-content">
            {toast.type === "success" ? (
              <CheckCircle2 size={20} />
            ) : (
              <XCircle size={20} />
            )}
            <span>{toast.message}</span>
          </div>
          <button
            className="contact-toast-close"
            onClick={() => setToast(null)}
            aria-label="Close toast"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      )}
    </main>
  );
}
