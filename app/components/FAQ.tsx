"use client";

import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "Booking Related Queries ?",
    answer: "Book online by selecting your trek, filling the form, and paying via UPI, bank transfer, or card. Advance payment secures your spot. You can add friends if spots are available, switch dates with a small fee, and rent gear or offload backpacks (₹1,500-2,000/day) by contacting us in advance.",
  },
  {
    question: "How to Pick Your Perfect Trek",
    answer: "Match the trek to your fitness level—start with easy 2-4 day treks if you're new. Choose popular paths for safety, avoid monsoons (June-Sep), and opt for spring (Mar-May) or post-monsoon (Sep-Nov). Contact our expert at +91 7817849247 for personalized recommendations.",
  },
  {
    question: "What is your cancellation policy?",
    answer: "30+ days before: 90% refund. 15-29 days: 50% refund or 100% voucher. 0-14 days: 100% voucher (no cash refund). Refunds processed in 7-10 days. If we cancel, full refund or free reschedule. Vouchers valid for 1 year and transferable.",
  },
  {
    question: "Trek Amenities at a Glance",
    answer: "Fresh vegetarian meals (breakfast, lunch, dinner, snacks). Premium gear: waterproof tents, -10°C sleeping bags, safety kit. Eco-friendly dry pit toilets at campsites. Boiled/UV-treated water available. Notify us 7 days ahead for dietary requirements.",
  },
  {
    question: "Your Safety, Our Priority",
    answer: "Certified guides with 10+ years experience, 1:8 trekker ratio. Built-in acclimatization with pulse oximeters. Full medical kit including oxygen cans and GAMOW bags. 24/7 backup with satellite phones. Family-friendly treks available (kids 8+ with guardian).",
  },
  {
    question: "Quick Trek Queries Answered",
    answer: "Essential items: trekking boots, thermals, down jacket, rain gear, headlamp, first-aid kit, reusable water bottle. Solo travelers welcome in small groups (6-12). Age: min 10 years, no max if fit. Insurance recommended (₹500-1k). Local Dehradun team handles all logistics.",
  },
  {
    question: "Trek Logistics Made Simple",
    answer: "Pickup: 5-7 AM from Dehradun. Drop: 5-8 PM. Secure storage available (₹100-150). No laptops on trail. Porters (₹1,200/day) or mules (₹1,800/day) available for 10-15kg. Private/shared rides can be arranged (₹1,500-3,000).",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Split FAQ items into two columns
  const leftColumnItems = faqData.slice(0, Math.ceil(faqData.length / 2));
  const rightColumnItems = faqData.slice(Math.ceil(faqData.length / 2));

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
                key={index}
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
                  key={actualIndex}
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
