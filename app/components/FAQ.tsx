"use client";

import { useState, useEffect } from "react";

interface FAQItem {
  id?: string;
  question: string;
  answer: string;
  display_order?: number;
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [faqData, setFaqData] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/faqs');
        
        if (!response.ok) {
          throw new Error('Failed to fetch FAQs');
        }

        const data = await response.json();
        if (data.faqs && Array.isArray(data.faqs)) {
          setFaqData(data.faqs);
        } else {
          setFaqData([]);
        }
      } catch (err) {
        console.error('Error fetching FAQs:', err);
        setError('Failed to load FAQs');
        // Fallback to empty array on error
        setFaqData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFAQs();
  }, []);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Split FAQ items into two columns
  const leftColumnItems = faqData.slice(0, Math.ceil(faqData.length / 2));
  const rightColumnItems = faqData.slice(Math.ceil(faqData.length / 2));

  // Show loading state
  if (loading) {
    return (
      <section className="faq-section">
        <div className="faq-container">
          <div className="faq-header">
            <span className="faq-subtitle">Frequently Asked Questions</span>
            <h2 className="faq-title">Everything you need to know before your adventure</h2>
          </div>
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            Loading FAQs...
          </div>
        </div>
      </section>
    );
  }

  // Show error state or empty state
  if (error || faqData.length === 0) {
    return (
      <section className="faq-section">
        <div className="faq-container">
          <div className="faq-header">
            <span className="faq-subtitle">Frequently Asked Questions</span>
            <h2 className="faq-title">Everything you need to know before your adventure</h2>
          </div>
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            {error || 'No FAQs available at the moment.'}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="faq-section">
      <div className="faq-container">
        <div className="faq-header">
          <span className="faq-subtitle">Frequently Asked Questions</span>
          <h2 className="faq-title">Everything you need to know before your adventure</h2>
        </div>

        <div className="faq-grid">
          <div className="faq-column">
            {leftColumnItems.map((faq, index) => (
              <div
                key={faq.id || index}
                className={`faq-item ${openIndex === index ? "active" : ""}`}
              >
                <button
                  className="faq-question"
                  onClick={() => toggleFAQ(index)}
                  aria-expanded={openIndex === index}
                >
                  <span>{faq.question}</span>
                  <div className="faq-icon-wrapper">
                    <svg
                      className={`faq-icon ${openIndex === index ? "rotated" : ""}`}
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                </button>
                <div className="faq-divider"></div>
                <div
                  className={`faq-answer ${openIndex === index ? "open" : ""}`}
                >
                  <div className="faq-answer-content">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="faq-column">
            {rightColumnItems.map((faq, index) => {
              const actualIndex = index + leftColumnItems.length;
              return (
                <div
                  key={faq.id || actualIndex}
                  className={`faq-item ${openIndex === actualIndex ? "active" : ""}`}
                >
                  <button
                    className="faq-question"
                    onClick={() => toggleFAQ(actualIndex)}
                    aria-expanded={openIndex === actualIndex}
                  >
                    <span>{faq.question}</span>
                    <div className="faq-icon-wrapper">
                      <svg
                        className={`faq-icon ${openIndex === actualIndex ? "rotated" : ""}`}
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                  </button>
                  <div className="faq-divider"></div>
                  <div
                    className={`faq-answer ${openIndex === actualIndex ? "open" : ""}`}
                  >
                    <div className="faq-answer-content">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
