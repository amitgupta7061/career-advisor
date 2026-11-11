"use client";
import { useEffect, useState } from "react";
import styles from "../dashboard.module.css";
import DashboardSidebar from "@/components/DashboardSidebar/DashboardSidebar";
import { api } from "@/lib/api";

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrent = true;
    async function loadOpportunities() {
      const results = await Promise.allSettled([
        api.getOpportunities(),
        api.getMatchingOpportunities(),
        api.getBookmarks(),
        api.getUserApplications(),
      ]);
      if (!isCurrent) return;
      const opportunityResult = results[0];
      if (opportunityResult.status === "rejected") {
        setError(opportunityResult.reason.message || "Could not load opportunities.");
        setLoading(false);
        return;
      }
      const matchItems = results[1].status === "fulfilled" ? results[1].value.data || [] : [];
      const bookmarkItems = results[2].status === "fulfilled" ? results[2].value.data || [] : [];
      const applicationItems = results[3].status === "fulfilled" ? results[3].value.data || [] : [];
      const matchById = new Map(matchItems.map((item) => [item.id, item.matchScore]));
      const bookmarkedIds = new Set(bookmarkItems.map((item) => item.id));
      const appliedIds = new Set(applicationItems.map((item) => item.opportunity_id));
      const mapped = (opportunityResult.value.data || []).map((item) => ({
        id: item.id,
        title: item.title,
        company: item.company,
        type: item.opportunity_type,
        location: item.location,
        isRemote: item.is_remote,
        stipend: item.stipend_or_ctc || "Compensation not listed",
        skills: item.required_skills || [],
        matchScore: matchById.get(item.id) || 0,
        deadline: item.deadline ? new Date(item.deadline).toLocaleDateString() : "Not listed",
        applyUrl: item.apply_url,
        bookmarked: bookmarkedIds.has(item.id),
        applied: appliedIds.has(item.id),
      }));
      setOpportunities(mapped);
      setLoading(false);
    }
    loadOpportunities();
    return () => { isCurrent = false; };
  }, []);

  async function toggleBookmark(id) {
    const item = opportunities.find((opportunity) => opportunity.id === id);
    if (!item) return;
    setError("");
    try {
      if (item.bookmarked) await api.unbookmarkOpportunity(id);
      else await api.bookmarkOpportunity(id);
      setOpportunities((prev) =>
        prev.map((opportunity) =>
          opportunity.id === id ? { ...opportunity, bookmarked: !item.bookmarked } : opportunity
        )
      );
    } catch (actionError) {
      setError(actionError.message || "Could not update bookmark.");
    }
  }

  async function markApplied(id) {
    setError("");
    try {
      await api.applyOpportunity(id);
      setOpportunities((prev) =>
        prev.map((opportunity) =>
          opportunity.id === id ? { ...opportunity, applied: true } : opportunity
        )
      );
    } catch (actionError) {
      setError(actionError.message || "Could not track this application.");
    }
  }

  const filtered = opportunities.filter((opportunity) => {
    const matchesTab = activeTab === "all" || opportunity.type === activeTab;
    const matchesRemote = !remoteOnly || opportunity.isRemote;
    const query = search.toLowerCase();
    const matchesSearch =
      opportunity.title.toLowerCase().includes(query) ||
      opportunity.company.toLowerCase().includes(query) ||
      opportunity.skills.some((skill) => skill.toLowerCase().includes(query));
    return matchesTab && matchesRemote && matchesSearch;
  });

  return (
    <div className={styles.dashboard}>
      <DashboardSidebar />

      <main className={styles.mainContent}>
        <header className={styles.topBar}>
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>Opportunities & Internships 💼</h1>
            <p className={styles.pageSubtitle}>
              Curated jobs, tech internships, hackathons, and scholarships matched with your profile
            </p>
          </div>
        </header>

        {/* Filters and Controls */}
        <div className={styles.filterBar}>
          <input
            type="text"
            placeholder="Search by role, company, or skill (e.g. React, Python)…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ flex: 1, minWidth: "260px", maxWidth: "440px" }}
          />

          <div className={styles.pillsScroll}>
            {[
              { id: "all", label: "All Opportunities" },
              { id: "internship", label: "Internships" },
              { id: "job", label: "Full-Time Jobs" },
              { id: "hackathon", label: "Hackathons" },
              { id: "scholarship", label: "Scholarships" },
            ].map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`btn btn-sm ${isSelected ? "btn-primary" : "btn-outline"}`}
                  style={{ borderRadius: "var(--radius-full)" }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.875rem", color: "var(--text-secondary)", cursor: "pointer", userSelect: "none" }}>
            <input
              type="checkbox"
              checked={remoteOnly}
              onChange={(e) => setRemoteOnly(e.target.checked)}
              style={{ width: "16px", height: "16px", accentColor: "var(--primary-600)" }}
            />
            <span>Remote Only 🌐</span>
          </label>
        </div>

        {error && (
          <div style={{ padding: "14px 18px", borderRadius: "var(--radius-md)", background: "var(--danger-50)", color: "var(--danger-600)", border: "1px solid var(--danger-200)", marginBottom: "20px", fontSize: "0.875rem" }}>
            ⚠️ {error}
          </div>
        )}

        {loading && (
          <div className="card" style={{ padding: "32px", textAlign: "center" }}>
            <span className="spinner" style={{ color: "var(--primary-600)", marginBottom: "8px" }} />
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>Loading personalized opportunities…</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="card" style={{ padding: "40px 20px", textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🔍</div>
            <h3 style={{ fontSize: "1.125rem", color: "var(--text-primary)", fontWeight: 700, marginBottom: "6px" }}>
              No Opportunities Match Your Filter
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", maxWidth: "360px", margin: "0 auto" }}>
              Try adjusting your search query, selecting &ldquo;All Opportunities&rdquo;, or unchecking remote-only.
            </p>
          </div>
        )}

        {/* Opportunities Responsive Grid */}
        <div className={styles.cardsGrid}>
          {filtered.map((item) => (
            <div
              key={item.id}
              className="card"
              style={{
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "16px",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", gap: "10px" }}>
                  <div>
                    <span
                      className={`badge ${
                        item.type === "internship"
                          ? "badge-primary"
                          : item.type === "hackathon"
                          ? "badge-warning"
                          : item.type === "scholarship"
                          ? "badge-danger"
                          : "badge-success"
                      }`}
                      style={{ marginBottom: "8px" }}
                    >
                      {item.type}
                    </span>
                    <h3 style={{ margin: "2px 0", fontSize: "1.0625rem", color: "var(--text-primary)", fontWeight: 700 }}>
                      {item.title}
                    </h3>
                    <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                      {item.company}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleBookmark(item.id)}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "1.375rem",
                      cursor: "pointer",
                      padding: "4px",
                      color: item.bookmarked ? "var(--warning-500)" : "var(--neutral-400)",
                      lineHeight: 1,
                    }}
                    title={item.bookmarked ? "Remove Bookmark" : "Save Opportunity"}
                    aria-label={item.bookmarked ? "Remove Bookmark" : "Save Opportunity"}
                  >
                    {item.bookmarked ? "★" : "☆"}
                  </button>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "14px" }}>
                  <span>📍 {item.location} {item.isRemote && "(Remote)"}</span>
                  <span>⏳ Deadline: {item.deadline}</span>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "10px" }}>
                    💰 {item.stipend}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {item.skills.map((s) => (
                      <span key={s} className="badge badge-neutral" style={{ fontSize: "0.75rem" }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "14px", borderTop: "1px solid var(--border-light)", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  {item.matchScore > 0 ? (
                    <span className="badge badge-primary">
                      {item.matchScore}% Match
                    </span>
                  ) : (
                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Open Application</span>
                  )}
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <button
                    onClick={() => markApplied(item.id)}
                    disabled={item.applied}
                    className={`btn btn-sm ${item.applied ? "btn-outline" : "btn-secondary"}`}
                  >
                    {item.applied ? "Applied ✓" : "Track as Applied"}
                  </button>

                  <a
                    href={item.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm"
                  >
                    Apply ↗
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
