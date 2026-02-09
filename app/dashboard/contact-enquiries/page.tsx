"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Search, Mail, Phone, MessageCircle, Calendar, Trash2, RefreshCw } from "lucide-react";
import "../dashboard.css";

interface ContactEnquiry {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  message: string;
  created_at: string;
  updated_at: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export default function ContactEnquiriesPage() {
  const supabase = createClient();
  const [enquiries, setEnquiries] = useState<ContactEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadEnquiries();
  }, [currentPage, pageSize, searchQuery]);

  const loadEnquiries = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
      });

      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }

      const response = await fetch(`/api/contact?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load enquiries");
      }

      const result = await response.json();
      setEnquiries(result.data || []);
      setPagination(result.pagination);
    } catch (err: any) {
      setError(err.message || "Failed to load enquiries");
      console.error("Error loading enquiries:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this enquiry?")) {
      return;
    }

    try {
      setDeletingId(id);
      const { error } = await supabase
        .from("contact_enquiries")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Reload enquiries
      await loadEnquiries();
    } catch (err: any) {
      alert(err.message || "Failed to delete enquiry");
      console.error("Error deleting enquiry:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadEnquiries();
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="dashboard_page" style={{ margin: "24px" }}>
      {/* Header */}
      <div className="heading_block">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h3>Contact Enquiries</h3>
            <p>View and manage contact form submissions</p>
          </div>
          <button
            onClick={loadEnquiries}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.5rem",
              background: "#0d5a6f",
              color: "#fff",
              border: "none",
              borderRadius: "0.5rem",
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "var(--font-jakarta)",
              fontWeight: 600,
              opacity: loading ? 0.7 : 1,
            }}
          >
            <RefreshCw size={18} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            Refresh
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "24px" }}>
        {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "2rem",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ flex: 1, minWidth: "300px", position: "relative" }}>
          <Search
            size={20}
            style={{
              position: "absolute",
              left: "1rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#9ca3af",
            }}
          />
          <input
            type="text"
            placeholder="Search by name, email, phone, or message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            style={{
              width: "100%",
              padding: "0.75rem 1rem 0.75rem 3rem",
              border: "1.5px solid #e5e7eb",
              borderRadius: "0.75rem",
              fontSize: "1rem",
              fontFamily: "var(--font-jakarta)",
              color: "#1f2937",
            }}
          />
        </div>
        <button
          onClick={handleSearch}
          style={{
            padding: "0.75rem 1.5rem",
            background: "#0d5a6f",
            color: "#fff",
            border: "none",
            borderRadius: "0.75rem",
            cursor: "pointer",
            fontFamily: "var(--font-jakarta)",
            fontWeight: 600,
          }}
        >
          Search
        </button>
        <select
          value={pageSize}
          onChange={(e) => handlePageSizeChange(Number(e.target.value))}
          style={{
            padding: "0.75rem 1rem",
            border: "1.5px solid #e5e7eb",
            borderRadius: "0.75rem",
            fontSize: "1rem",
            fontFamily: "var(--font-jakarta)",
            color: "#1f2937",
            cursor: "pointer",
          }}
        >
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            padding: "1rem",
            background: "#fee2e2",
            border: "1px solid #fecaca",
            borderRadius: "0.5rem",
            color: "#991b1b",
            marginBottom: "1.5rem",
            fontFamily: "var(--font-jakarta)",
          }}
        >
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            color: "#6b7280",
            fontFamily: "var(--font-jakarta)",
          }}
        >
          Loading enquiries...
        </div>
      )}

      {/* Enquiries List */}
      {!loading && enquiries.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            background: "#f9fafb",
            borderRadius: "1rem",
            color: "#6b7280",
            fontFamily: "var(--font-jakarta)",
          }}
        >
          {searchQuery ? "No enquiries found matching your search." : "No enquiries yet."}
        </div>
      )}

      {!loading && enquiries.length > 0 && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", textAlign: "left" }}>
            {enquiries.map((enquiry) => (
              <div
                key={enquiry.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "1rem",
                  padding: "1.5rem",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "1rem",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        fontSize: "1.25rem",
                        fontWeight: 600,
                        color: "#1f2937",
                        margin: "0 0 0.5rem 0",
                        fontFamily: "var(--font-fraunces), 'Fraunces', serif",
                      }}
                    >
                      {enquiry.full_name}
                    </h3>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "1rem",
                        marginBottom: "1rem",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Mail size={16} color="#6b7280" />
                        <a
                          href={`mailto:${enquiry.email}`}
                          style={{
                            color: "#0d5a6f",
                            textDecoration: "none",
                            fontFamily: "var(--font-jakarta)",
                          }}
                        >
                          {enquiry.email}
                        </a>
                      </div>
                      {enquiry.phone && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <Phone size={16} color="#6b7280" />
                          <a
                            href={`tel:${enquiry.phone}`}
                            style={{
                              color: "#0d5a6f",
                              textDecoration: "none",
                              fontFamily: "var(--font-jakarta)",
                            }}
                          >
                            {enquiry.phone}
                          </a>
                        </div>
                      )}
                      {enquiry.whatsapp && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <MessageCircle size={16} color="#6b7280" />
                          <span style={{ color: "#4b5563", fontFamily: "var(--font-jakarta)" }}>
                            {enquiry.whatsapp}
                          </span>
                        </div>
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Calendar size={16} color="#6b7280" />
                        <span style={{ color: "#6b7280", fontFamily: "var(--font-jakarta)", fontSize: "0.875rem" }}>
                          {formatDate(enquiry.created_at)}
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        background: "#f9fafb",
                        padding: "1rem",
                        borderRadius: "0.5rem",
                        marginTop: "1rem",
                      }}
                    >
                      <p
                        style={{
                          color: "#4b5563",
                          margin: 0,
                          lineHeight: 1.6,
                          fontFamily: "var(--font-jakarta)",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {enquiry.message}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(enquiry.id)}
                    disabled={deletingId === enquiry.id}
                    style={{
                      padding: "0.5rem",
                      background: deletingId === enquiry.id ? "#f3f4f6" : "#fee2e2",
                      color: deletingId === enquiry.id ? "#9ca3af" : "#dc2626",
                      border: "none",
                      borderRadius: "0.5rem",
                      cursor: deletingId === enquiry.id ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s",
                    }}
                    title="Delete enquiry"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "1rem",
                marginTop: "2rem",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.hasPreviousPage || loading}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: pagination.hasPreviousPage ? "#0d5a6f" : "#e5e7eb",
                  color: pagination.hasPreviousPage ? "#fff" : "#9ca3af",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: pagination.hasPreviousPage ? "pointer" : "not-allowed",
                  fontFamily: "var(--font-jakarta)",
                  fontWeight: 600,
                }}
              >
                Previous
              </button>
              <span
                style={{
                  color: "#4b5563",
                  fontFamily: "var(--font-jakarta)",
                  fontWeight: 500,
                }}
              >
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={!pagination.hasNextPage || loading}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: pagination.hasNextPage ? "#0d5a6f" : "#e5e7eb",
                  color: pagination.hasNextPage ? "#fff" : "#9ca3af",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: pagination.hasNextPage ? "pointer" : "not-allowed",
                  fontFamily: "var(--font-jakarta)",
                  fontWeight: 600,
                }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}
