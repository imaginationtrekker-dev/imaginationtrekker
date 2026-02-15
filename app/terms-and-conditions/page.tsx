"use client";

import { useState, useEffect } from "react";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import FloatingButtons from "@/app/components/FloatingButtons";
import { createClient } from "@/lib/supabase-browser";
import "@/app/policy.css";

interface TermsAndConditions {
  id: string;
  main_title: string;
  subtitle?: string;
  main_content: string;
  created_at?: string;
  updated_at?: string;
}

export default function TermsAndConditionsPage() {
  const [terms, setTerms] = useState<TermsAndConditions | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadTerms();
  }, []);

  const loadTerms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('terms_and_conditions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading terms and conditions:', error);
      } else if (data) {
        setTerms(data);
      }
    } catch (err) {
      console.error('Error loading terms and conditions:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative">
      <Header />
      <section className="policy-page-section">
        <div className="policy-page-container">
          {loading ? (
            <div className="policy-loading">
              <div className="loading-spinner"></div>
              <p>Loading terms and conditions...</p>
            </div>
          ) : terms ? (
            <div className="policy-content">
              <h1 className="policy-main-title">{terms.main_title}</h1>
              {terms.subtitle && (
                <p className="policy-subtitle">{terms.subtitle}</p>
              )}
              <div 
                className="policy-main-content"
                dangerouslySetInnerHTML={{ __html: terms.main_content }}
              />
              {terms.updated_at && (
                <p className="policy-updated">
                  Last updated: {new Date(terms.updated_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              )}
            </div>
          ) : (
            <div className="policy-empty">
              <h1 className="policy-main-title">Terms and Conditions</h1>
              <p>Terms and conditions content is not available at the moment. Please check back later.</p>
            </div>
          )}
        </div>
      </section>
      <Footer />
      <FloatingButtons />
    </main>
  );
}
