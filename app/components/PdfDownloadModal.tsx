"use client";

import { useState, FormEvent } from "react";
import { Loader2, CheckCircle2, XCircle, FileText } from "lucide-react";
import "./PdfDownloadModal.css";

interface PdfDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  packageName: string;
}

export default function PdfDownloadModal({
  isOpen,
  onClose,
  pdfUrl,
  packageName,
}: PdfDownloadModalProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    whatsapp: "",
    email: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setToast(null);

    try {
      const response = await fetch("/api/send-pdf-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          whatsapp: formData.whatsapp.trim(),
          email: formData.email.trim(),
          pdfUrl,
          packageName,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send PDF link");
      }

      setToast({
        message: result.message || "PDF link has been sent to your email!",
        type: "success",
      });
      setFormData({ fullName: "", whatsapp: "", email: "" });

      setTimeout(() => {
        onClose();
        setToast(null);
      }, 2500);
    } catch (error: unknown) {
      setToast({
        message: error instanceof Error ? error.message : "Failed to send. Please try again.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (!isOpen) return null;

  return (
    <div className="pdf-modal-overlay" onClick={onClose}>
      <div className="pdf-modal" onClick={(e) => e.stopPropagation()}>
        <button
          className="pdf-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="pdf-modal-accent" />

        <div className="pdf-modal-header">
          <div className="pdf-modal-icon">
            <FileText size={26} strokeWidth={1.5} />
          </div>
          <h3 className="pdf-modal-title">Get Your PDF Document</h3>
          <p className="pdf-modal-subtitle">
            Enter your details and we&apos;ll send the <strong>{packageName}</strong> brochure to your email.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="pdf-modal-form">
          <div className="pdf-modal-field">
            <label htmlFor="pdf-fullName" className="pdf-modal-label">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Full Name <span className="required">*</span>
            </label>
            <input
              id="pdf-fullName"
              type="text"
              name="fullName"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="pdf-modal-field">
            <label htmlFor="pdf-whatsapp" className="pdf-modal-label">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              WhatsApp Number <span className="required">*</span>
            </label>
            <input
              id="pdf-whatsapp"
              type="tel"
              name="whatsapp"
              placeholder="Enter your WhatsApp number"
              value={formData.whatsapp}
              onChange={handleChange}
              required
            />
          </div>

          <div className="pdf-modal-field">
            <label htmlFor="pdf-email" className="pdf-modal-label">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              Email <span className="required">*</span>
            </label>
            <input
              id="pdf-email"
              type="email"
              name="email"
              placeholder="Enter your email address"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="pdf-modal-submit"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={20} className="pdf-modal-spinner" />
                Sending...
              </>
            ) : (
              <>
                Send PDF to My Email
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </>
            )}
          </button>

          <p className="pdf-modal-privacy">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Your information is secure and will not be shared
          </p>
        </form>

        {toast && (
          <div className={`pdf-modal-toast pdf-modal-toast--${toast.type}`}>
            {toast.type === "success" ? (
              <CheckCircle2 size={20} strokeWidth={2.5} />
            ) : (
              <XCircle size={20} strokeWidth={2.5} />
            )}
            <span>{toast.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
