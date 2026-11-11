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
  const [activeRole, setActiveRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recommending, setRecommending] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [, setAnalyzingGap] = useState(false);
  const [error, setError] = useState("");
  const [aiProvider, setAiProvider] = useState(null);
  const [aiSummary, setAiSummary] = useState("");
  const [fallbackNotice, setFallbackNotice] = useState(null);

  // Objective 3: Detailed Skill Gap Analysis State
  const [skillGapAnalysis, setSkillGapAnalysis] = useState(null);
  const [gapActiveTab, setGapActiveTab] = useState("missing"); // "missing" | "improving" | "meeting" | "roadmap"
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load roles and latest recommendations on mount
  useEffect(() => {
    let isCurrent = true;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        // 1. Fetch available career roles
        const rolesRes = await api.getCareerRoles();
        const roleCatalog = rolesRes.data || [];

        // 2. Fetch latest active recommendations from DB
        let recs = [];
        try {
          const recRes = await api.getLatestRecommendations();
          if (recRes.success && recRes.data && recRes.data.length > 0) {
            recs = recRes.data;
          }
        } catch {
          // If no previous recommendations, proceed
        }

        // Map roles with recommendations if available
        const mapped = roleCatalog.map((role) => {
          const matchingRec = recs.find((r) => r.role_id === role.id || r.role_title === role.title);
          const minSal = Math.round((role.avg_salary_min || 0) / 100000);
          const maxSal = Math.round((role.avg_salary_max || 0) / 100000);

          return {
            ...role,
            domain: role.category || "Technology",
            icon: role.category?.includes("AI") ? "🤖" : role.category?.includes("Cloud") || role.category?.includes("Infrastructure") ? "☁️" : role.category?.includes("Design") ? "🎨" : "🌐",
            matchScore: matchingRec ? Math.round(Number(matchingRec.match_score)) : 0,
            reasoning: matchingRec?.reasoning || null,
            salary: minSal || maxSal ? `₹${minSal} - ${maxSal} LPA` : "₹8 - 20 LPA",
            growth: role.growth_rate || "High Demand",
            requiredSkills: role.required_skills || [],
            userHas: matchingRec?.matched_skills || [],
            missing: matchingRec?.missing_skills || role.required_skills || [],
          };
        });

        // Sort: roles with higher matchScore on top
        mapped.sort((a, b) => b.matchScore - a.matchScore);

        if (isCurrent) {
          setRoles(mapped);
          if (mapped.length > 0) {
            setActiveRole(mapped[0]);
            triggerSkillGapAnalysis(mapped[0].id);
          }
        }
      } catch (err) {
        if (isCurrent) setError(err.message || "Could not load career catalog.");
      } finally {
        if (isCurrent) setLoading(false);
      }
    }

    loadData();
    return () => { isCurrent = false; };
  }, []);

  // Perform Skill Gap Analysis for a specific role (Objective 3)
  async function triggerSkillGapAnalysis(roleId) {
    if (!roleId) return;
    setAnalyzingGap(true);
    try {
      const res = await api.analyzeSkillGaps({ roleId });
      if (res.success && res.data) {
        setSkillGapAnalysis(res.data);
      }
      try {
        const histRes = await api.getSkillGapHistory(roleId);
        if (histRes.success) {
          setAnalysisHistory(histRes.data || []);
        }
      } catch {}
    } catch (err) {
      console.warn("Could not load skill gap analysis:", err.message);
    } finally {
      setAnalyzingGap(false);
    }
  }

  // Handle active role selection
  function handleSelectRole(role) {
    setActiveRole(role);
    triggerSkillGapAnalysis(role.id);
  }

  // Run fresh AI Career Recommendations
  async function runAIRecommendations() {
    setRecommending(true);
    setError("");
    try {
      const res = await api.getRecommendations();
      if (res.success && res.data) {
        setAiProvider(res.provider || "AI Engine");
        setAiSummary(res.data.summary || "");
        setFallbackNotice(res.fallbackNotice || null);

        const aiRoles = res.data.recommendedRoles || [];

        // Update local roles with AI results
        setRoles((prevRoles) => {
          const updated = prevRoles.map((role) => {
            const aiMatch = aiRoles.find(
              (r) => r.slug === role.slug || r.roleTitle?.toLowerCase() === role.title?.toLowerCase()
            );

            if (aiMatch) {
              return {
                ...role,
                matchScore: aiMatch.suitabilityScore,
                reasoning: aiMatch.reasoning,
                userHas: (aiMatch.matchingSkills || []).map((s) => s.name || s),
                missing: (aiMatch.missingSkills || []).map((s) => s.name || s),
                salary: aiMatch.salaryRange || role.salary,
                growth: aiMatch.marketOutlook || role.growth,
              };
            }
            return role;
          });

          updated.sort((a, b) => b.matchScore - a.matchScore);
          if (updated.length > 0) {
            setActiveRole(updated[0]);
            triggerSkillGapAnalysis(updated[0].id);
          }
          return updated;
        });
      }
    } catch (err) {
      setError(err.message || "Failed to generate AI recommendations. Please check profile details.");
    } finally {
      setRecommending(false);
    }
  }

  // Generate learning roadmap for active role
  async function generateRoadmap() {
    if (!activeRole?.id) return;
    setGenerating(true);
    setError("");
    try {
      await api.analyzeSkillGaps({ roleId: activeRole.id });
      await api.generateRoadmap({ roleId: activeRole.id, roleTitle: activeRole.title });
      router.push("/dashboard/roadmap");
    } catch (err) {
      setError(err.message || "Could not generate a learning roadmap.");
    } finally {
      setGenerating(false);
    }
  }

  const domains = ["All", ...new Set(roles.map((r) => r.domain))];
  const filtered = roles.filter((role) => {
    const matchesDomain = selectedDomain === "All" || role.domain === selectedDomain;
    const matchesSearch =
      role.title.toLowerCase().includes(search.toLowerCase()) ||
      (role.description || "").toLowerCase().includes(search.toLowerCase());
    return matchesDomain && matchesSearch;
  });

  return (
    <div className={styles.dashboard}>
      <DashboardSidebar />

      <main className={styles.mainContent}>
        <header className={styles.topBar}>
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>Career Paths & Skill Gap Analysis 🧭</h1>
            <p className={styles.pageSubtitle}>
              Deterministic competency evaluation, proficiency gap diagnosis, and AI action roadmaps
            </p>
          </div>
          <div>
            <button
              onClick={runAIRecommendations}
              disabled={recommending}
              className="btn btn-primary"
            >
              <span>{recommending ? "⏳" : "⚡"}</span>
              <span>{recommending ? "Analyzing Profile with AI…" : "Run AI Recommendation"}</span>
            </button>
          </div>
        </header>

        {/* AI Provider Banner if generated */}
        {aiProvider && (
          <div
            className={styles.calloutBanner}
            style={{
              background: fallbackNotice ? "var(--warning-50)" : "var(--primary-50)",
              border: fallbackNotice ? "1px solid var(--warning-200)" : "1px solid var(--primary-200)",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
              <span style={{ fontSize: "1.75rem", lineHeight: 1 }}>🤖</span>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--primary-900)" }}>
                    AI Provider: {aiProvider}
                  </span>
                  <span className="badge badge-primary">Active</span>
                </div>
                {aiSummary && (
                  <p style={{ margin: "4px 0 0 0", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                    {aiSummary}
                  </p>
                )}
                {fallbackNotice && (
                  <p style={{ margin: "4px 0 0 0", fontSize: "0.8125rem", color: "var(--warning-600)", fontWeight: 500 }}>
                    ⚠️ {fallbackNotice}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Search & Domain Filter Bar */}
        <div className={styles.filterBar}>
          <input
            type="text"
            placeholder="Search career roles or skills…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ flex: 1, minWidth: "240px", maxWidth: "420px" }}
          />
          <div className={styles.pillsScroll}>
            {domains.map((dom) => {
              const isSelected = selectedDomain === dom;
              return (
                <button
                  key={dom}
                  onClick={() => setSelectedDomain(dom)}
                  className={`btn btn-sm ${isSelected ? "btn-primary" : "btn-outline"}`}
                  style={{ borderRadius: "var(--radius-full)" }}
                >
                  {dom}
                </button>
              );
            })}
          </div>
        </div>

        {/* Responsive Layout: Roles List + Deep-Dive Skill Gap Diagnosis */}
        <div className={styles.careersLayout}>
          {/* Roles List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {loading && (
              <div className="card" style={{ padding: "32px", textAlign: "center" }}>
                <span className="spinner" style={{ color: "var(--primary-600)", marginBottom: "8px" }} />
                <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>Loading career catalog and recommendations…</p>
              </div>
            )}
            {error && (
              <div style={{ padding: "14px 18px", borderRadius: "var(--radius-md)", background: "var(--danger-50)", border: "1px solid var(--danger-200)", color: "var(--danger-600)", fontSize: "0.875rem" }}>
                ⚠️ {error}
              </div>
            )}
            {!loading && !filtered.length && (
              <div className="card" style={{ padding: "32px", textAlign: "center", color: "var(--text-secondary)" }}>
                No career roles match your search or domain filter.
              </div>
            )}

            {filtered.map((role) => {
              const isSelected = activeRole?.id === role.id;
              const hasScore = role.matchScore > 0;

              return (
                <div
                  key={role.id}
                  onClick={() => handleSelectRole(role)}
                  className="card"
                  style={{
                    padding: "20px",
                    cursor: "pointer",
                    border: isSelected ? "2px solid var(--primary-600)" : "1px solid var(--border-color)",
                    boxShadow: isSelected ? "0 8px 24px rgba(99, 102, 241, 0.16)" : "var(--shadow-card)",
                    background: isSelected ? "var(--surface-primary)" : "var(--surface-primary)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", gap: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "2rem", lineHeight: 1 }}>{role.icon}</span>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "1.0625rem", color: "var(--text-primary)", fontWeight: 700 }}>
                          {role.title}
                        </h3>
                        <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                          {role.domain}
                        </span>
                      </div>
                    </div>
                    <div>
                      {hasScore ? (
                        <span
                          className={`badge ${
                            role.matchScore >= 80 ? "badge-success" : role.matchScore >= 50 ? "badge-primary" : "badge-danger"
                          }`}
                          style={{ fontSize: "0.8125rem", padding: "4px 10px" }}
                        >
                          {role.matchScore}% Match
                        </span>
                      ) : (
                        <span className="badge badge-neutral">Select to Analyze</span>
                      )}
                    </div>
                  </div>

                  <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: "0 0 14px 0", lineHeight: "1.5" }}>
                    {role.description}
                  </p>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid var(--border-light)", fontSize: "0.875rem", flexWrap: "wrap", gap: "8px" }}>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>💰 {role.salary}</span>
                    <span style={{ color: "var(--success-600)", fontWeight: 600 }}>📈 {role.growth}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Role Skill Gap Analysis Panel */}
          {activeRole && (
            <div className={`card ${styles.stickyPanel}`} style={{ padding: "24px" }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", gap: "12px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "2.25rem", lineHeight: 1 }}>{activeRole.icon}</span>
                  <div>
                    <h2 style={{ margin: 0, fontSize: "1.25rem", color: "var(--text-primary)", fontWeight: 700 }}>
                      {activeRole.title}
                    </h2>
                    <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                      AI-Powered Skill Gap Diagnosis
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="btn btn-outline btn-sm"
                >
                  {showHistory ? "Hide History" : `History (${analysisHistory.length})`}
                </button>
              </div>

              {/* Progress History Drawer if opened */}
              {showHistory && (
                <div style={{ marginBottom: "20px", padding: "14px", borderRadius: "var(--radius-md)", background: "var(--surface-secondary)", border: "1px solid var(--border-light)" }}>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "0.875rem", color: "var(--text-primary)", fontWeight: 600 }}>
                    📊 Historical Improvement Snapshots:
                  </h4>
                  {analysisHistory.length === 0 ? (
                    <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                      No prior evaluations recorded for this role yet.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {analysisHistory.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "8px 12px",
                            borderRadius: "var(--radius-sm)",
                            background: "var(--surface-primary)",
                            border: "1px solid var(--border-light)",
                            fontSize: "0.8125rem",
                          }}
                        >
                          <span style={{ color: "var(--text-secondary)" }}>
                            {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            <span style={{ fontWeight: 700, color: "var(--success-600)" }}>
                              {item.overall_match_percentage}% Match
                            </span>
                            <span style={{ color: "var(--danger-500)", fontWeight: 600 }}>
                              {item.overall_gap_percentage}% Gap
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Deterministic Match & Gap Meters */}
              {skillGapAnalysis && (
                <div style={{ marginBottom: "20px", padding: "16px", borderRadius: "var(--radius-lg)", background: "var(--surface-secondary)", border: "1px solid var(--border-light)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "12px" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--success-700)" }}>
                          Skill Match
                        </span>
                        <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--success-700)" }}>
                          {skillGapAnalysis.metrics.overallMatchPercentage}%
                        </span>
                      </div>
                      <div style={{ width: "100%", height: "8px", background: "var(--neutral-200)", borderRadius: "4px", overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${skillGapAnalysis.metrics.overallMatchPercentage}%`,
                            height: "100%",
                            background: "var(--success-500)",
                            borderRadius: "4px",
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--danger-600)" }}>
                          Skill Gap
                        </span>
                        <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--danger-600)" }}>
                          {skillGapAnalysis.metrics.overallGapPercentage}%
                        </span>
                      </div>
                      <div style={{ width: "100%", height: "8px", background: "var(--neutral-200)", borderRadius: "4px", overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${skillGapAnalysis.metrics.overallGapPercentage}%`,
                            height: "100%",
                            background: "var(--danger-500)",
                            borderRadius: "4px",
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* AI Executive Summary */}
                  {skillGapAnalysis.insights?.executiveSummary && (
                    <div style={{ paddingTop: "10px", borderTop: "1px solid var(--border-light)" }}>
                      <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                        💡 {skillGapAnalysis.insights.executiveSummary}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Categorization Tabs */}
              <div
                style={{
                  display: "flex",
                  gap: "6px",
                  padding: "4px",
                  background: "var(--surface-tertiary)",
                  borderRadius: "var(--radius-md)",
                  marginBottom: "18px",
                  overflowX: "auto",
                }}
              >
                <button
                  onClick={() => setGapActiveTab("missing")}
                  style={{
                    flex: 1,
                    minWidth: "90px",
                    padding: "8px 10px",
                    borderRadius: "var(--radius-sm)",
                    border: "none",
                    background: gapActiveTab === "missing" ? "var(--surface-primary)" : "transparent",
                    color: gapActiveTab === "missing" ? "var(--danger-600)" : "var(--text-secondary)",
                    fontWeight: 600,
                    fontSize: "0.8125rem",
                    cursor: "pointer",
                    boxShadow: gapActiveTab === "missing" ? "var(--shadow-xs)" : "none",
                  }}
                >
                  ⚠️ Missing ({skillGapAnalysis?.metrics.missingCount || 0})
                </button>

                <button
                  onClick={() => setGapActiveTab("improving")}
                  style={{
                    flex: 1,
                    minWidth: "90px",
                    padding: "8px 10px",
                    borderRadius: "var(--radius-sm)",
                    border: "none",
                    background: gapActiveTab === "improving" ? "var(--surface-primary)" : "transparent",
                    color: gapActiveTab === "improving" ? "var(--warning-600)" : "var(--text-secondary)",
                    fontWeight: 600,
                    fontSize: "0.8125rem",
                    cursor: "pointer",
                    boxShadow: gapActiveTab === "improving" ? "var(--shadow-xs)" : "none",
                  }}
                >
                  📈 Improve ({skillGapAnalysis?.metrics.improvingCount || 0})
                </button>

                <button
                  onClick={() => setGapActiveTab("meeting")}
                  style={{
                    flex: 1,
                    minWidth: "90px",
                    padding: "8px 10px",
                    borderRadius: "var(--radius-sm)",
                    border: "none",
                    background: gapActiveTab === "meeting" ? "var(--surface-primary)" : "transparent",
                    color: gapActiveTab === "meeting" ? "var(--success-700)" : "var(--text-secondary)",
                    fontWeight: 600,
                    fontSize: "0.8125rem",
                    cursor: "pointer",
                    boxShadow: gapActiveTab === "meeting" ? "var(--shadow-xs)" : "none",
                  }}
                >
                  ✅ Ready ({skillGapAnalysis?.metrics.meetingCount || 0})
                </button>

                <button
                  onClick={() => setGapActiveTab("roadmap")}
                  style={{
                    flex: 1,
                    minWidth: "90px",
                    padding: "8px 10px",
                    borderRadius: "var(--radius-sm)",
                    border: "none",
                    background: gapActiveTab === "roadmap" ? "var(--surface-primary)" : "transparent",
                    color: gapActiveTab === "roadmap" ? "var(--primary-700)" : "var(--text-secondary)",
                    fontWeight: 600,
                    fontSize: "0.8125rem",
                    cursor: "pointer",
                    boxShadow: gapActiveTab === "roadmap" ? "var(--shadow-xs)" : "none",
                  }}
                >
                  🗺️ Roadmap
                </button>
              </div>

              {/* Tab 1: Completely Missing Skills */}
              {gapActiveTab === "missing" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                  {skillGapAnalysis?.missingSkills.length === 0 ? (
                    <p style={{ fontSize: "0.875rem", color: "var(--success-700)", padding: "12px", background: "var(--success-50)", borderRadius: "var(--radius-md)" }}>
                      🎉 Outstanding! You have no missing core skills for this role.
                    </p>
                  ) : (
                    skillGapAnalysis?.missingSkills.map((s, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: "12px 14px",
                          borderRadius: "var(--radius-md)",
                          background: "var(--danger-50)",
                          border: "1px solid var(--danger-100)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px", flexWrap: "wrap", gap: "6px" }}>
                          <span style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--danger-600)" }}>
                            {s.name}
                          </span>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <span className="badge badge-danger">
                              {s.priority?.toUpperCase()} PRIORITY
                            </span>
                            <span className="badge badge-neutral">
                              Req: {s.requiredLevelLabel}
                            </span>
                          </div>
                        </div>

                        <p style={{ margin: "4px 0", fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                          {s.industrySignificance}
                        </p>

                        <div style={{ marginTop: "6px", fontSize: "0.75rem", color: "var(--success-700)", fontWeight: 600 }}>
                          🎯 Action: {s.recommendedAction}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 2: Skills Requiring Improvement */}
              {gapActiveTab === "improving" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                  {skillGapAnalysis?.improvingSkills.length === 0 ? (
                    <p style={{ fontSize: "0.875rem", color: "var(--success-700)", padding: "12px", background: "var(--success-50)", borderRadius: "var(--radius-md)" }}>
                      All your existing skills already meet or exceed the required level!
                    </p>
                  ) : (
                    skillGapAnalysis?.improvingSkills.map((s, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: "12px 14px",
                          borderRadius: "var(--radius-md)",
                          background: "var(--warning-50)",
                          border: "1px solid var(--warning-100)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px", flexWrap: "wrap", gap: "6px" }}>
                          <span style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--warning-600)" }}>
                            {s.name}
                          </span>
                          <span className="badge badge-warning">
                            {s.currentLevelLabel} ➔ {s.requiredLevelLabel}
                          </span>
                        </div>

                        <p style={{ margin: "4px 0", fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                          {s.industrySignificance}
                        </p>

                        <div style={{ marginTop: "6px", fontSize: "0.75rem", color: "var(--warning-600)", fontWeight: 600 }}>
                          🚀 Upgrade Step: {s.recommendedAction}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 3: Skills Meeting or Exceeding Requirements */}
              {gapActiveTab === "meeting" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                  {skillGapAnalysis?.meetingSkills.length === 0 ? (
                    <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", padding: "12px" }}>
                      No verified matching skills yet. Add your current skills in your Profile.
                    </p>
                  ) : (
                    skillGapAnalysis?.meetingSkills.map((s, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "10px 14px",
                          borderRadius: "var(--radius-md)",
                          background: "var(--success-50)",
                          border: "1px solid var(--success-100)",
                          flexWrap: "wrap",
                          gap: "8px",
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--success-700)" }}>
                            ✅ {s.name}
                          </span>
                          <span style={{ display: "block", fontSize: "0.75rem", color: "var(--success-600)" }}>
                            Your Level: {s.currentLevelLabel} (Required: {s.requiredLevelLabel})
                          </span>
                        </div>
                        <span className="badge badge-success">
                          {s.status === "exceeding" ? "Exceeds Target" : "Meets Target"}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 4: AI Phased Action Roadmap */}
              {gapActiveTab === "roadmap" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                  {skillGapAnalysis?.insights?.phasedRoadmap ? (
                    <>
                      <div style={{ padding: "12px", borderRadius: "var(--radius-md)", background: "var(--surface-secondary)", border: "1px solid var(--border-light)" }}>
                        <h5 style={{ margin: "0 0 4px 0", fontSize: "0.8125rem", color: "var(--primary-600)", fontWeight: 700 }}>
                          Phase 1: Immediate Foundations (Weeks 1-4)
                        </h5>
                        <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                          {skillGapAnalysis.insights.phasedRoadmap.immediate}
                        </p>
                      </div>

                      <div style={{ padding: "12px", borderRadius: "var(--radius-md)", background: "var(--surface-secondary)", border: "1px solid var(--border-light)" }}>
                        <h5 style={{ margin: "0 0 4px 0", fontSize: "0.8125rem", color: "var(--info-500)", fontWeight: 700 }}>
                          Phase 2: Tooling & Integration (Weeks 5-8)
                        </h5>
                        <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                          {skillGapAnalysis.insights.phasedRoadmap.intermediate}
                        </p>
                      </div>

                      <div style={{ padding: "12px", borderRadius: "var(--radius-md)", background: "var(--surface-secondary)", border: "1px solid var(--border-light)" }}>
                        <h5 style={{ margin: "0 0 4px 0", fontSize: "0.8125rem", color: "var(--success-600)", fontWeight: 700 }}>
                          Phase 3: Production Capstone (Weeks 9-12)
                        </h5>
                        <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                          {skillGapAnalysis.insights.phasedRoadmap.capstone}
                        </p>
                      </div>
                    </>
                  ) : (
                    <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Roadmap unavailable for this role.</p>
                  )}
                </div>
              )}

              {/* Generate Learning Roadmap CTA */}
              <button
                type="button"
                onClick={generateRoadmap}
                disabled={generating || !activeRole.id}
                className="btn btn-primary btn-lg"
                style={{ width: "100%" }}
              >
                {generating ? "Generating Personalized Roadmap…" : "Generate AI Learning Roadmap →"}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
