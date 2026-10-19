"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import styles from "../dashboard.module.css";
import DashboardSidebar from "@/components/DashboardSidebar/DashboardSidebar";

export default function CareersPage() {
  const router = useRouter();
  const [roles, setRoles] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState("All");
  const [search, setSearch] = useState("");
  const [activeRole, setActiveRole] = useState({ id: null, title: "", icon: "🧭", matchScore: 0, salary: "", growth: "", requiredSkills: [], userHas: [], missing: [] });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrent = true;
    async function loadRoles() {
      try {
        const response = await api.getCareerRoles();
        const roleData = response.data || [];
        let recommendations = [];
        try {
          const recommendationResponse = await api.getRecommendations({});
          recommendations = recommendationResponse.data?.recommendations || [];
        } catch {
          // Role browsing remains available before a student has added profile skills.
        }
        const mappedRoles = roleData.map((role) => {
          const recommendation = recommendations.find((item) => item.roleId === role.id);
          const minSalary = Math.round((role.avg_salary_min || 0) / 100000);
          const maxSalary = Math.round((role.avg_salary_max || 0) / 100000);
          return {
            ...role,
            domain: role.category || "Other",
            icon: role.category?.includes("AI") ? "🤖" : role.category?.includes("Infrastructure") ? "☁️" : role.category?.includes("Design") ? "🎨" : "🌐",
            matchScore: recommendation?.matchScore || 0,
            salary: minSalary || maxSalary ? `₹${minSalary} - ${maxSalary} LPA` : "Salary not listed",
            growth: role.growth_rate || "Not listed",
            requiredSkills: role.required_skills || [],
            userHas: recommendation?.matchedSkills || [],
            missing: recommendation?.missingSkills || role.required_skills || [],
          };
        });
        if (isCurrent) {
          setRoles(mappedRoles);
          if (mappedRoles.length) setActiveRole(mappedRoles[0]);
        }
      } catch (loadError) {
        if (isCurrent) setError(loadError.message || "Could not load career roles.");
      } finally {
        if (isCurrent) setLoading(false);
      }
    }
    loadRoles();
    return () => { isCurrent = false; };
  }, []);

  const domains = ["All", ...new Set(roles.map((role) => role.domain))];
  const filtered = roles.filter((role) => {
    const matchesDomain = selectedDomain === "All" || role.domain === selectedDomain;
    const matchesSearch = role.title.toLowerCase().includes(search.toLowerCase()) || (role.description || "").toLowerCase().includes(search.toLowerCase());
    return matchesDomain && matchesSearch;
  });

  async function generateRoadmap() {
    if (!activeRole.id) return;
    setGenerating(true);
    setError("");
    try {
      await api.analyzeSkillGaps({ roleId: activeRole.id });
      await api.generateRoadmap({ roleId: activeRole.id, roleTitle: activeRole.title });
      router.push("/dashboard/roadmap");
    } catch (generationError) {
      setError(generationError.message || "Could not generate a learning roadmap.");
    } finally {
      setGenerating(false);
    }
  }
  return (
    <div className={styles.dashboard}>
      <DashboardSidebar />

      <main className={styles.mainContent}>
        <header className={styles.topBar}>
          <div>
            <h1 className={styles.pageTitle}>Career Paths & Skill Gap Analysis 🧭</h1>
            <p className={styles.pageSubtitle}>Explore high-growth career roles tailored to your current skills and interests</p>
          </div>
        </header>

        {/* Filter Bar */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Search roles or technologies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: "1",
              minWidth: "260px",
              padding: "12px 16px",
              borderRadius: "12px",
              border: "1px solid var(--border-color)",
              background: "var(--bg-card)",
              color: "var(--text-primary)",
              fontSize: "0.9375rem",
              outline: "none"
            }}
          />
          <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
            {domains.map((dom) => (
              <button
                key={dom}
                onClick={() => setSelectedDomain(dom)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "20px",
                  border: selectedDomain === dom ? "1px solid var(--primary-600)" : "1px solid var(--border-color)",
                  background: selectedDomain === dom ? "var(--primary-600)" : "var(--bg-card)",
                  color: selectedDomain === dom ? "#ffffff" : "var(--text-secondary)",
                  fontWeight: selectedDomain === dom ? 600 : 500,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                {dom}
              </button>
            ))}
          </div>
        </div>

        {/* Two Column Layout: Roles list & Selected Role Deep-Dive */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px" }}>
          {/* Roles List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {loading && <p>Loading career roles…</p>}
            {error && <p role="alert">{error}</p>}
            {!loading && !filtered.length && <p>No career roles match your search.</p>}
            {filtered.map((role) => {
              const isSelected = activeRole.id === role.id;
              return (
                <div
                  key={role.id}
                  onClick={() => setActiveRole(role)}
                  style={{
                    padding: "20px",
                    borderRadius: "16px",
                    background: "var(--bg-card)",
                    border: isSelected ? "2px solid var(--primary-600)" : "1px solid var(--border-color)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: isSelected ? "0 8px 24px rgba(99, 102, 241, 0.15)" : "var(--shadow-sm)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "2rem" }}>{role.icon}</span>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "1.125rem", color: "var(--text-primary)" }}>{role.title}</h3>
                        <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{role.domain}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "4px 10px",
                        borderRadius: "20px",
                        fontSize: "0.8125rem",
                        fontWeight: 700,
                        background: role.matchScore >= 85 ? "#d1fae5" : "#e0e7ff",
                        color: role.matchScore >= 85 ? "#065f46" : "#3730a3"
                      }}>
                        {role.matchScore}% Match
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: "0 0 16px 0", lineHeight: "1.5" }}>
                    {role.description}
                  </p>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid var(--border-color)", fontSize: "0.875rem" }}>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>💰 {role.salary}</span>
                    <span style={{ color: "#10b981", fontWeight: 600 }}>📈 {role.growth}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Role Skill Gap Detail */}
          <div style={{
            position: "sticky",
            top: "24px",
            alignSelf: "start",
            padding: "28px",
            borderRadius: "20px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-md)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
              <span style={{ fontSize: "2.5rem" }}>{activeRole.icon}</span>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.375rem", color: "var(--text-primary)" }}>{activeRole.title}</h2>
                <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Detailed Skill Gap Breakdown</span>
              </div>
            </div>

            <div style={{ marginBottom: "24px", padding: "16px", borderRadius: "12px", background: "var(--primary-50)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--primary-900)" }}>Your Match Score</span>
                <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--primary-700)" }}>{activeRole.matchScore}%</span>
              </div>
              <div style={{ width: "100%", height: "8px", background: "#e0e7ff", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: `${activeRole.matchScore}%`, height: "100%", background: "var(--primary-600)", borderRadius: "4px" }} />
              </div>
            </div>

            <h4 style={{ margin: "0 0 10px 0", fontSize: "0.9375rem", color: "#065f46" }}>
              ✅ Skills You Already Have ({activeRole.userHas.length})
            </h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
              {activeRole.userHas.map((s) => (
                <span key={s} style={{ padding: "6px 12px", borderRadius: "8px", background: "#d1fae5", color: "#065f46", fontSize: "0.8125rem", fontWeight: 600 }}>
                  {s}
                </span>
              ))}
            </div>

            <h4 style={{ margin: "0 0 10px 0", fontSize: "0.9375rem", color: "#991b1b" }}>
              ⚠️ Missing Skills To Bridge ({activeRole.missing.length})
            </h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "28px" }}>
              {activeRole.missing.map((s) => (
                <span key={s} style={{ padding: "6px 12px", borderRadius: "8px", background: "#fee2e2", color: "#991b1b", fontSize: "0.8125rem", fontWeight: 600 }}>
                  {s} (Gap)
                </span>
              ))}
            </div>

            <button
              type="button"
              onClick={generateRoadmap}
              disabled={generating || !activeRole.id}
              style={{
                display: "block",
                width: "100%",
                textAlign: "center",
                padding: "14px 20px",
                borderRadius: "12px",
                border: "none",
                background: "linear-gradient(135deg, var(--primary-600), var(--primary-700))",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "0.9375rem",
                cursor: generating ? "wait" : "pointer",
                boxShadow: "0 4px 14px rgba(99, 102, 241, 0.35)",
                transition: "all 0.2s ease"
              }}
            >
              {generating ? "Generating roadmap…" : "Generate AI Learning Roadmap →"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
