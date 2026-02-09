"use client";

import { useState, FormEvent } from "react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Toast {
  id: string;
  message: string;
  type: "success" | "error";
}

export default function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    whatsapp: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/modal-enquiries", {
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
      setToast({
        id: Date.now().toString(),
        message: result.message || "Thank you! We'll get back to you within 24 hours.",
        type: "success",
      });

      // Reset form
      setFormData({ fullName: "", whatsapp: "", message: "" });

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
        setToast(null);
      }, 2000);
    } catch (error: any) {
      console.error("Error submitting form:", error);
      // Show error toast
      setToast({
        id: Date.now().toString(),
        message: error.message || "Failed to submit enquiry. Please try again.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="contact-modal-overlay" onClick={onClose}>
      <div className="contact-modal" onClick={(e) => e.stopPropagation()}>
        {/* Left Blue Panel */}
        <div className="contact-modal-left">
          <div className="contact-modal-logo">
            <div className="contact-logo-icon">
              <img src="/images/logo-old.png" alt="Imagination Trekker" className="contact-logo-img" />
            </div>
          </div>
          <h2 className="contact-modal-heading">Find Your Dream Adventure</h2>
          <p className="contact-modal-subtitle">
            Get personalized trek recommendations from our expert team
          </p>
          <ul className="contact-benefits-list">
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Personalized Itineraries</span>
            </li>
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>24/7 On-Trip Support</span>
            </li>
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Expertise and Experiences</span>
            </li>
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Safety First Approach</span>
            </li>
          </ul>
        </div>

        {/* Right White Panel */}
        <div className="contact-modal-right">
          <button className="contact-modal-close" onClick={onClose} aria-label="Close modal">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <h2 className="contact-form-title">Get in Touch</h2>
          <p className="contact-form-subtitle">
            Fill the form below and we'll get back to you within 24 hours
          </p>

          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="contact-form-group">
              <label className="contact-form-label">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Full Name
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
                    fill="currentColor"
                  />
                </svg>
                WhatsApp Number
              </label>
              <input
                type="tel"
                name="whatsapp"
                placeholder="Enter your WhatsApp number"
                value={formData.whatsapp}
                onChange={handleChange}
                required
                className="contact-form-input"
              />
            </div>

            <div className="contact-form-group">
              <label className="contact-form-label">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                Message
              </label>
              <textarea
                name="message"
                placeholder="Tell us about your inquiry..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                rows={5}
                className="contact-form-input"
                style={{ resize: "vertical" }}
              />
            </div>

            <button type="submit" className="contact-form-submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="contact-submit-spinner" />
                  Submitting...
                </>
              ) : (
                <>
                  Send Enquiry
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
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

          {/* Toast Notification */}
          {toast && (
            <div className={`contact-toast contact-toast-${toast.type}`} style={{ position: "absolute", bottom: "1rem", right: "1rem", left: "1rem" }}>
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
        </div>
      </div>
    </div>
  );
}
