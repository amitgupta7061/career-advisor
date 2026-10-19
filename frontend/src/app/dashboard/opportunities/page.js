"use client";
import { useState } from "react";
import styles from "../dashboard.module.css";
import DashboardSidebar from "@/components/DashboardSidebar/DashboardSidebar";

const INITIAL_OPPORTUNITIES = [
  {
    id: 1,
    title: "Software Development Engineer Intern",
    company: "Flipkart",
    type: "internship",
    location: "Bengaluru, Karnataka",
    isRemote: false,
    stipend: "₹65,000 / month",
    skills: ["Java", "Data Structures", "Algorithms", "SQL", "Git"],
    matchScore: 92,
    deadline: "Dec 31, 2026",
    applyUrl: "https://flipkartcareers.com",
    bookmarked: false,
    applied: false,
  },
  {
    id: 2,
    title: "Frontend Engineer (React / Next.js)",
    company: "Swiggy",
    type: "job",
    location: "Bengaluru, Karnataka",
    isRemote: true,
    stipend: "14 - 18 LPA",
    skills: ["JavaScript", "React", "TypeScript", "HTML5", "CSS3"],
    matchScore: 88,
    deadline: "Nov 30, 2026",
    applyUrl: "https://careers.swiggy.com",
    bookmarked: true,
    applied: false,
  },
  {
    id: 3,
    title: "AI / ML Research Intern",
    company: "Microsoft Research India",
    type: "internship",
    location: "Bengaluru, Karnataka",
    isRemote: false,
    stipend: "₹80,000 / month",
    skills: ["Python", "PyTorch", "Machine Learning", "Mathematics"],
    matchScore: 95,
    deadline: "Dec 15, 2026",
    applyUrl: "https://careers.microsoft.com",
    bookmarked: false,
    applied: true,
  },
  {
    id: 4,
    title: "Smart India Hackathon 2026",
    company: "Ministry of Education & AICTE",
    type: "hackathon",
    location: "Pan-India",
    isRemote: true,
    stipend: "₹1,00,000 Prize",
    skills: ["Full Stack", "Problem Solving", "AI/ML", "Teamwork"],
    matchScore: 85,
    deadline: "Oct 31, 2026",
    applyUrl: "https://sih.gov.in",
    bookmarked: false,
    applied: false,
  },
  {
    id: 5,
    title: "Associate Cloud & DevOps Engineer",
    company: "Zomato",
    type: "job",
    location: "Gurugram, Haryana",
    isRemote: false,
    stipend: "12 - 16 LPA",
    skills: ["AWS", "Docker", "Kubernetes", "Linux", "CI/CD"],
    matchScore: 78,
    deadline: "Nov 25, 2026",
    applyUrl: "https://zomato.com/careers",
    bookmarked: false,
    applied: false,
  },
  {
    id: 6,
    title: "National Merit STEM Scholarship 2026",
    company: "Tata Trusts Foundation",
    type: "scholarship",
    location: "Pan-India",
    isRemote: true,
    stipend: "₹50,000 / year",
    skills: ["Computer Science", "Engineering", "Merit"],
    matchScore: 90,
    deadline: "Nov 15, 2026",
    applyUrl: "https://tatatrusts.org",
    bookmarked: false,
    applied: false,
  },
];

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState(INITIAL_OPPORTUNITIES);
  const [activeTab, setActiveTab] = useState("all");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [search, setSearch] = useState("");

  const toggleBookmark = (id) => {
    setOpportunities((prev) =>
      prev.map((o) => (o.id === id ? { ...o, bookmarked: !o.bookmarked } : o))
    );
  };

  const markApplied = (id) => {
    setOpportunities((prev) =>
      prev.map((o) => (o.id === id ? { ...o, applied: true } : o))
    );
  };

  const filtered = opportunities.filter((o) => {
    const matchesTab = activeTab === "all" || o.type === activeTab;
    const matchesRemote = !remoteOnly || o.isRemote;
    const matchesSearch =
      o.title.toLowerCase().includes(search.toLowerCase()) ||
      o.company.toLowerCase().includes(search.toLowerCase()) ||
      o.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    return matchesTab && matchesRemote && matchesSearch;
  });

  return (
    <div className={styles.dashboard}>
      <DashboardSidebar />

      <main className={styles.mainContent}>
        <header className={styles.topBar}>
          <div>
            <h1 className={styles.pageTitle}>Opportunities & Internships 💼</h1>
            <p className={styles.pageSubtitle}>Curated jobs, tech internships, hackathons, and scholarships matched with your profile</p>
          </div>
        </header>

        {/* Filters and Controls */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Search by role, company, or skill (e.g. React, Python)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: "1",
              minWidth: "280px",
              padding: "12px 16px",
              borderRadius: "12px",
              border: "1px solid var(--border-color)",
              background: "var(--bg-card)",
              color: "var(--text-primary)",
              fontSize: "0.9375rem",
              outline: "none"
            }}
          />

          <div style={{ display: "flex", gap: "8px" }}>
            {[
              { id: "all", label: "All Opportunities" },
              { id: "internship", label: "Internships" },
              { id: "job", label: "Full-Time Jobs" },
              { id: "hackathon", label: "Hackathons" },
              { id: "scholarship", label: "Scholarships" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "20px",
                  border: activeTab === tab.id ? "1px solid var(--primary-600)" : "1px solid var(--border-color)",
                  background: activeTab === tab.id ? "var(--primary-600)" : "var(--bg-card)",
                  color: activeTab === tab.id ? "#ffffff" : "var(--text-secondary)",
                  fontWeight: activeTab === tab.id ? 600 : 500,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.875rem", color: "var(--text-secondary)", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={remoteOnly}
              onChange={(e) => setRemoteOnly(e.target.checked)}
              style={{ width: "16px", height: "16px", accentColor: "var(--primary-600)" }}
            />
            Remote Only 🌐
          </label>
        </div>

        {/* Opportunities List */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "20px" }}>
          {filtered.map((item) => (
            <div
              key={item.id}
              style={{
                padding: "24px",
                borderRadius: "16px",
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                boxShadow: "var(--shadow-sm)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transition: "all 0.2s ease"
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div>
                    <span style={{
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      background: item.type === "internship" ? "#e0e7ff" : item.type === "hackathon" ? "#fef3c7" : item.type === "scholarship" ? "#fce7f3" : "#d1fae5",
                      color: item.type === "internship" ? "#3730a3" : item.type === "hackathon" ? "#92400e" : item.type === "scholarship" ? "#9d174d" : "#065f46",
                      marginBottom: "6px"
                    }}>
                      {item.type}
                    </span>
                    <h3 style={{ margin: "2px 0", fontSize: "1.125rem", color: "var(--text-primary)" }}>{item.title}</h3>
                    <span style={{ fontSize: "0.875rem", color: "var(--text-muted)", fontWeight: 500 }}>{item.company}</span>
                  </div>
                  <button
                    onClick={() => toggleBookmark(item.id)}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "1.25rem",
                      cursor: "pointer",
                      padding: "4px"
                    }}
                    title={item.bookmarked ? "Remove Bookmark" : "Save Opportunity"}
                  >
                    {item.bookmarked ? "★" : "☆"}
                  </button>
                </div>

                <div style={{ display: "flex", gap: "12px", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "16px" }}>
                  <span>📍 {item.location} {item.isRemote && "(Remote)"}</span>
                  <span>⏳ Deadline: {item.deadline}</span>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "10px" }}>
                    {item.stipend}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {item.skills.map((s) => (
                      <span key={s} style={{ padding: "3px 8px", borderRadius: "6px", background: "var(--bg-card-hover)", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "16px", borderTop: "1px solid var(--border-color)" }}>
                <span style={{
                  padding: "4px 8px",
                  borderRadius: "12px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  background: item.matchScore >= 90 ? "#d1fae5" : "#e0e7ff",
                  color: item.matchScore >= 90 ? "#065f46" : "#3730a3"
                }}>
                  🎯 {item.matchScore}% Skill Match
                </span>

                <div style={{ display: "flex", gap: "8px" }}>
                  {item.applied ? (
                    <span style={{ padding: "8px 14px", borderRadius: "10px", background: "#d1fae5", color: "#065f46", fontSize: "0.8125rem", fontWeight: 700 }}>
                      Applied ✓
                    </span>
                  ) : (
                    <button
                      onClick={() => markApplied(item.id)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "10px",
                        border: "none",
                        background: "var(--primary-600)",
                        color: "#ffffff",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                    >
                      Track Application
                    </button>
                  )}
                  <a
                    href={item.applyUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: "8px 12px",
                      borderRadius: "10px",
                      border: "1px solid var(--border-color)",
                      background: "var(--bg-card)",
                      color: "var(--text-primary)",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      textDecoration: "none"
                    }}
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
