"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Search, MessageCircle, Calendar, Trash2, RefreshCw } from "lucide-react";
import "../dashboard.css";

interface ModalEnquiry {
  id: string;
  full_name: string;
  whatsapp: string;
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

export default function ModalEnquiriesPage() {
  const supabase = createClient();
  const [enquiries, setEnquiries] = useState<ModalEnquiry[]>([]);
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

      const response = await fetch(`/api/modal-enquiries?${params.toString()}`);

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
        .from("modal_enquiries")
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
            <h3>Modal Enquiries</h3>
            <p>View and manage modal popup form submissions</p>
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
              placeholder="Search by name, WhatsApp, or message..."
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
            <div style={{ padding: "0 24px 24px 24px" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: "8px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)" }}>
                  <thead>
                    <tr style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, fontSize: "14px", color: "#374151" }}>Full Name</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, fontSize: "14px", color: "#374151" }}>WhatsApp</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, fontSize: "14px", color: "#374151" }}>Message</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, fontSize: "14px", color: "#374151" }}>Date</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, fontSize: "14px", color: "#374151" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enquiries.map((enquiry) => (
                      <tr key={enquiry.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <td style={{ padding: "12px 16px", fontSize: "14px", color: "#1f2937", fontWeight: 500 }}>
                          {enquiry.full_name}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: "14px", color: "#1f2937" }}>
                          {enquiry.whatsapp}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: "14px", color: "#1f2937", maxWidth: "400px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {enquiry.message}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: "14px", color: "#6b7280" }}>
                          {formatDate(enquiry.created_at)}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <button
                            onClick={() => handleDelete(enquiry.id)}
                            disabled={deletingId === enquiry.id}
                            style={{ padding: "6px 12px", background: deletingId === enquiry.id ? "#f3f4f6" : "#fee2e2", border: deletingId === enquiry.id ? "1px solid #d1d5db" : "1px solid #fcc", borderRadius: "4px", cursor: deletingId === enquiry.id ? "not-allowed" : "pointer", fontSize: "12px", color: deletingId === enquiry.id ? "#9ca3af" : "#dc2626", fontWeight: 500 }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
