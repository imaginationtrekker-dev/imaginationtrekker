"use client";

import { useState, useEffect } from "react";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import FloatingButtons from "@/app/components/FloatingButtons";
import { createClient } from "@/lib/supabase-browser";
import "@/app/policy.css";

interface CancellationPolicy {
  id: string;
  main_title: string;
  subtitle?: string;
  main_content: string;
  created_at?: string;
  updated_at?: string;
}

export default function CancellationPolicyPage() {
  const [policy, setPolicy] = useState<CancellationPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadPolicy();
  }, []);

  const loadPolicy = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cancellation_policy')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading cancellation policy:', error);
      } else if (data) {
        setPolicy(data);
      }
    } catch (err) {
      console.error('Error loading cancellation policy:', err);
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
              <p>Loading cancellation policy...</p>
            </div>
          ) : policy ? (
            <div className="policy-content">
              <h1 className="policy-main-title">{policy.main_title}</h1>
              {policy.subtitle && (
                <p className="policy-subtitle">{policy.subtitle}</p>
              )}
              <div 
                className="policy-main-content"
                dangerouslySetInnerHTML={{ __html: policy.main_content }}
              />
              {policy.updated_at && (
                <p className="policy-updated">
                  Last updated: {new Date(policy.updated_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              )}
            </div>
          ) : (
            <div className="policy-empty">
              <h1 className="policy-main-title">Cancellation Policy</h1>
              <p>Cancellation policy content is not available at the moment. Please check back later.</p>
            </div>
          )}
        </div>
      </section>
      <Footer />
      <FloatingButtons />
    </main>
  );
}
