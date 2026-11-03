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
  const [analyzingGap, setAnalyzingGap] = useState(false);
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
          // If no previous recommendations, that's fine
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
      // Load past history for this role
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
          <div>
            <h1 className={styles.pageTitle}>Career Paths & Skill Gap Analysis 🧭</h1>
            <p className={styles.pageSubtitle}>
              Deterministic competency evaluation, proficiency gap diagnosis, and AI action roadmaps
            </p>
          </div>
          <div>
            <button
              onClick={runAIRecommendations}
              disabled={recommending}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 22px",
                borderRadius: "12px",
                border: "none",
                background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "0.9375rem",
                cursor: recommending ? "wait" : "pointer",
                boxShadow: "0 4px 14px rgba(99, 102, 241, 0.35)",
                transition: "all 0.2s ease",
              }}
            >
              <span>{recommending ? "⏳" : "⚡"}</span>
              <span>{recommending ? "Analyzing Profile with AI..." : "Run AI Career Recommendation"}</span>
            </button>
          </div>
        </header>

        {/* AI Provider Banner if generated */}
        {aiProvider && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 20px",
              borderRadius: "14px",
              background: fallbackNotice ? "#fffbeb" : "#eff6ff",
              border: fallbackNotice ? "1px solid #fef3c7" : "1px solid #bfdbfe",
              marginBottom: "24px",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "1.75rem" }}>🤖</span>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#1e3a8a" }}>
                    Provider: {aiProvider}
                  </span>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: "12px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      background: "#dbeafe",
                      color: "#1d4ed8",
                    }}
                  >
                    Active
                  </span>
                </div>
                {aiSummary && (
                  <p style={{ margin: "4px 0 0 0", fontSize: "0.875rem", color: "#334155" }}>
                    {aiSummary}
                  </p>
                )}
                {fallbackNotice && (
                  <p style={{ margin: "4px 0 0 0", fontSize: "0.8125rem", color: "#b45309" }}>
                    ⚠️ {fallbackNotice}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Search & Domain Filter Bar */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Search career roles or skills..."
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
              outline: "none",
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
                  transition: "all 0.2s ease",
                }}
              >
                {dom}
              </button>
            ))}
          </div>
        </div>

        {/* Two-Column Grid: Roles List + Deep-Dive Skill Gap Diagnosis */}
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.3fr", gap: "24px" }}>
          {/* Roles List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {loading && <p>Loading career paths and catalog...</p>}
            {error && (
              <div
                style={{
                  padding: "16px",
                  borderRadius: "12px",
                  background: "#fee2e2",
                  color: "#991b1b",
                  fontSize: "0.875rem",
                }}
              >
                {error}
              </div>
            )}
            {!loading && !filtered.length && <p>No career roles match your criteria.</p>}

            {filtered.map((role) => {
              const isSelected = activeRole?.id === role.id;
              const hasScore = role.matchScore > 0;

              return (
                <div
                  key={role.id}
                  onClick={() => handleSelectRole(role)}
                  style={{
                    padding: "20px",
                    borderRadius: "16px",
                    background: "var(--bg-card)",
                    border: isSelected ? "2px solid var(--primary-600)" : "1px solid var(--border-color)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: isSelected ? "0 8px 24px rgba(99, 102, 241, 0.15)" : "var(--shadow-sm)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "12px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "2rem" }}>{role.icon}</span>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "1.125rem", color: "var(--text-primary)" }}>{role.title}</h3>
                        <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{role.domain}</span>
                      </div>
                    </div>
                    <div>
                      {hasScore ? (
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 12px",
                            borderRadius: "20px",
                            fontSize: "0.8125rem",
                            fontWeight: 700,
                            background: role.matchScore >= 80 ? "#d1fae5" : role.matchScore >= 50 ? "#e0e7ff" : "#fee2e2",
                            color: role.matchScore >= 80 ? "#065f46" : role.matchScore >= 50 ? "#3730a3" : "#991b1b",
                          }}
                        >
                          {role.matchScore}% Match
                        </span>
                      ) : (
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 10px",
                            borderRadius: "20px",
                            fontSize: "0.75rem",
                            background: "var(--bg-secondary)",
                            color: "var(--text-muted)",
                          }}
                        >
                          Select to Analyze
                        </span>
                      )}
                    </div>
                  </div>

                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--text-secondary)",
                      margin: "0 0 14px 0",
                      lineHeight: "1.5",
                    }}
                  >
                    {role.description}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingTop: "12px",
                      borderTop: "1px solid var(--border-color)",
                      fontSize: "0.875rem",
                    }}
                  >
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>💰 {role.salary}</span>
                    <span style={{ color: "#10b981", fontWeight: 600 }}>📈 {role.growth}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Role Skill Gap Analysis Panel */}
          {activeRole && (
            <div
              style={{
                position: "sticky",
                top: "24px",
                alignSelf: "start",
                padding: "24px",
                borderRadius: "20px",
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                boxShadow: "var(--shadow-md)",
                maxHeight: "calc(100vh - 48px)",
                overflowY: "auto",
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "2.25rem" }}>{activeRole.icon}</span>
                  <div>
                    <h2 style={{ margin: 0, fontSize: "1.25rem", color: "var(--text-primary)" }}>
                      {activeRole.title}
                    </h2>
                    <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                      AI-Powered Skill Gap Diagnosis
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setShowHistory(!showHistory)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    background: showHistory ? "var(--primary-50)" : "transparent",
                    color: "var(--primary-600)",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {showHistory ? "Hide History" : `History (${analysisHistory.length})`}
                </button>
              </div>

              {/* Progress History Drawer if opened */}
              {showHistory && (
                <div
                  style={{
                    marginBottom: "20px",
                    padding: "16px",
                    borderRadius: "12px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "0.875rem", color: "#334155" }}>
                    📊 Historical Improvement Snapshots:
                  </h4>
                  {analysisHistory.length === 0 ? (
                    <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--text-muted)" }}>
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
                            borderRadius: "8px",
                            background: "#ffffff",
                            border: "1px solid #f1f5f9",
                            fontSize: "0.8125rem",
                          }}
                        >
                          <span style={{ color: "#64748b" }}>
                            {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            <span style={{ fontWeight: 700, color: "#10b981" }}>
                              {item.overall_match_percentage}% Match
                            </span>
                            <span style={{ color: "#ef4444" }}>
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
                <div
                  style={{
                    marginBottom: "20px",
                    padding: "16px",
                    borderRadius: "14px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "12px" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#065f46" }}>
                          Skill Match
                        </span>
                        <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#065f46" }}>
                          {skillGapAnalysis.metrics.overallMatchPercentage}%
                        </span>
                      </div>
                      <div style={{ width: "100%", height: "8px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${skillGapAnalysis.metrics.overallMatchPercentage}%`,
                            height: "100%",
                            background: "#10b981",
                            borderRadius: "4px",
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#991b1b" }}>
                          Skill Gap
                        </span>
                        <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#991b1b" }}>
                          {skillGapAnalysis.metrics.overallGapPercentage}%
                        </span>
                      </div>
                      <div style={{ width: "100%", height: "8px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${skillGapAnalysis.metrics.overallGapPercentage}%`,
                            height: "100%",
                            background: "#ef4444",
                            borderRadius: "4px",
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* AI Executive Summary */}
                  {skillGapAnalysis.insights?.executiveSummary && (
                    <div style={{ paddingTop: "10px", borderTop: "1px solid #e2e8f0" }}>
                      <p style={{ margin: 0, fontSize: "0.8125rem", color: "#475569", lineHeight: "1.5" }}>
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
                  background: "#f1f5f9",
                  borderRadius: "12px",
                  marginBottom: "18px",
                }}
              >
                <button
                  onClick={() => setGapActiveTab("missing")}
                  style={{
                    flex: 1,
                    padding: "8px 10px",
                    borderRadius: "8px",
                    border: "none",
                    background: gapActiveTab === "missing" ? "#ffffff" : "transparent",
                    color: gapActiveTab === "missing" ? "#991b1b" : "#64748b",
                    fontWeight: 600,
                    fontSize: "0.8125rem",
                    cursor: "pointer",
                    boxShadow: gapActiveTab === "missing" ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
                  }}
                >
                  ⚠️ Missing ({skillGapAnalysis?.metrics.missingCount || 0})
                </button>

                <button
                  onClick={() => setGapActiveTab("improving")}
                  style={{
                    flex: 1,
                    padding: "8px 10px",
                    borderRadius: "8px",
                    border: "none",
                    background: gapActiveTab === "improving" ? "#ffffff" : "transparent",
                    color: gapActiveTab === "improving" ? "#b45309" : "#64748b",
                    fontWeight: 600,
                    fontSize: "0.8125rem",
                    cursor: "pointer",
                    boxShadow: gapActiveTab === "improving" ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
                  }}
                >
                  📈 Improve ({skillGapAnalysis?.metrics.improvingCount || 0})
                </button>

                <button
                  onClick={() => setGapActiveTab("meeting")}
                  style={{
                    flex: 1,
                    padding: "8px 10px",
                    borderRadius: "8px",
                    border: "none",
                    background: gapActiveTab === "meeting" ? "#ffffff" : "transparent",
                    color: gapActiveTab === "meeting" ? "#065f46" : "#64748b",
                    fontWeight: 600,
                    fontSize: "0.8125rem",
                    cursor: "pointer",
                    boxShadow: gapActiveTab === "meeting" ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
                  }}
                >
                  ✅ Ready ({skillGapAnalysis?.metrics.meetingCount || 0})
                </button>

                <button
                  onClick={() => setGapActiveTab("roadmap")}
                  style={{
                    flex: 1,
                    padding: "8px 10px",
                    borderRadius: "8px",
                    border: "none",
                    background: gapActiveTab === "roadmap" ? "#ffffff" : "transparent",
                    color: gapActiveTab === "roadmap" ? "#4f46e5" : "#64748b",
                    fontWeight: 600,
                    fontSize: "0.8125rem",
                    cursor: "pointer",
                    boxShadow: gapActiveTab === "roadmap" ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
                  }}
                >
                  🗺️ Roadmap
                </button>
              </div>

              {/* Tab 1: Completely Missing Skills */}
              {gapActiveTab === "missing" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                  {skillGapAnalysis?.missingSkills.length === 0 ? (
                    <p style={{ fontSize: "0.875rem", color: "#065f46" }}>
                      🎉 Outstanding! You have no missing core skills for this role.
                    </p>
                  ) : (
                    skillGapAnalysis?.missingSkills.map((s, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: "12px 14px",
                          borderRadius: "10px",
                          background: "#fff5f5",
                          border: "1px solid #fed7d7",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                          <span style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#991b1b" }}>
                            {s.name}
                          </span>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <span
                              style={{
                                padding: "2px 8px",
                                borderRadius: "10px",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                background: s.priority === "critical" ? "#ef4444" : "#f97316",
                                color: "#ffffff",
                              }}
                            >
                              {s.priority?.toUpperCase()} PRIORITY
                            </span>
                            <span
                              style={{
                                padding: "2px 8px",
                                borderRadius: "10px",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                background: "#fee2e2",
                                color: "#991b1b",
                              }}
                            >
                              Req: {s.requiredLevelLabel}
                            </span>
                          </div>
                        </div>

                        <p style={{ margin: "4px 0", fontSize: "0.8125rem", color: "#4a5568", lineHeight: "1.4" }}>
                          {s.industrySignificance}
                        </p>

                        <div style={{ marginTop: "6px", fontSize: "0.75rem", color: "#047857", fontWeight: 600 }}>
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
                    <p style={{ fontSize: "0.875rem", color: "#065f46" }}>
                      All your existing skills already meet or exceed the required level!
                    </p>
                  ) : (
                    skillGapAnalysis?.improvingSkills.map((s, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: "12px 14px",
                          borderRadius: "10px",
                          background: "#fffbeb",
                          border: "1px solid #fef3c7",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                          <span style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#92400e" }}>
                            {s.name}
                          </span>
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: "10px",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              background: "#fef3c7",
                              color: "#92400e",
                            }}
                          >
                            Current: {s.currentLevelLabel} ➔ Target: {s.requiredLevelLabel}
                          </span>
                        </div>

                        <p style={{ margin: "4px 0", fontSize: "0.8125rem", color: "#4a5568", lineHeight: "1.4" }}>
                          {s.industrySignificance}
                        </p>

                        <div style={{ marginTop: "6px", fontSize: "0.75rem", color: "#b45309", fontWeight: 600 }}>
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
                    <p style={{ fontSize: "0.875rem", color: "#64748b" }}>
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
                          borderRadius: "10px",
                          background: "#f0fdf4",
                          border: "1px solid #bbf7d0",
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#065f46" }}>
                            ✅ {s.name}
                          </span>
                          <span style={{ display: "block", fontSize: "0.75rem", color: "#166534" }}>
                            Your Level: {s.currentLevelLabel} (Required: {s.requiredLevelLabel})
                          </span>
                        </div>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: "10px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            background: s.status === "exceeding" ? "#dcfce7" : "#e0e7ff",
                            color: s.status === "exceeding" ? "#15803d" : "#3730a3",
                          }}
                        >
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
                      <div style={{ padding: "12px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <h5 style={{ margin: "0 0 4px 0", fontSize: "0.8125rem", color: "#6366f1" }}>
                          Phase 1: Immediate Foundations (Weeks 1-4)
                        </h5>
                        <p style={{ margin: 0, fontSize: "0.8125rem", color: "#334155" }}>
                          {skillGapAnalysis.insights.phasedRoadmap.immediate}
                        </p>
                      </div>

                      <div style={{ padding: "12px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <h5 style={{ margin: "0 0 4px 0", fontSize: "0.8125rem", color: "#0ea5e9" }}>
                          Phase 2: Tooling & Integration (Weeks 5-8)
                        </h5>
                        <p style={{ margin: 0, fontSize: "0.8125rem", color: "#334155" }}>
                          {skillGapAnalysis.insights.phasedRoadmap.intermediate}
                        </p>
                      </div>

                      <div style={{ padding: "12px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <h5 style={{ margin: "0 0 4px 0", fontSize: "0.8125rem", color: "#10b981" }}>
                          Phase 3: Production Capstone (Weeks 9-12)
                        </h5>
                        <p style={{ margin: 0, fontSize: "0.8125rem", color: "#334155" }}>
                          {skillGapAnalysis.insights.phasedRoadmap.capstone}
                        </p>
                      </div>
                    </>
                  ) : (
                    <p style={{ fontSize: "0.8125rem", color: "#64748b" }}>Roadmap unavailable for this role.</p>
                  )}
                </div>
              )}

              {/* Generate Learning Roadmap CTA */}
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
                  transition: "all 0.2s ease",
                }}
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
