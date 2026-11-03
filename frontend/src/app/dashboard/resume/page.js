"use client";
import { useEffect, useState } from "react";
import styles from "../dashboard.module.css";
import DashboardSidebar from "@/components/DashboardSidebar/DashboardSidebar";
import { api } from "@/lib/api";

export default function ResumePage() {
  const [targetRole, setTargetRole] = useState("Full Stack Developer");
  const [targetRolesList, setTargetRolesList] = useState([]);
  const [resumeText, setResumeText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [aiProvider, setAiProvider] = useState(null);
  const [fallbackNotice, setFallbackNotice] = useState(null);
  const [error, setError] = useState("");
  const [inputBullet, setInputBullet] = useState("Responsible for building React frontend components.");
  const [enhancedBullet, setEnhancedBullet] = useState("");
  const [enhancing, setEnhancing] = useState(false);
  const [keywordFilter, setKeywordFilter] = useState("all"); // "all" | "matched" | "missing"
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load target roles and past analysis history on mount
  useEffect(() => {
    let isCurrent = true;
    async function loadInitial() {
      try {
        const rolesRes = await api.getTargetRoles();
        if (isCurrent && rolesRes.success && rolesRes.data) {
          setTargetRolesList(rolesRes.data);
          if (rolesRes.data.length > 0) {
            setTargetRole(rolesRes.data[0].name || rolesRes.data[0]);
          }
        }
      } catch (e) {}

      try {
        const histRes = await api.getResumeHistory();
        if (isCurrent && histRes.success && histRes.data) {
          setHistory(histRes.data);
        }
      } catch (e) {}
    }
    loadInitial();
    return () => { isCurrent = false; };
  }, []);

  const handleAnalyze = async () => {
    if (!resumeText || resumeText.trim().length < 30) {
      setError("Please paste your resume text (at least 30 characters).");
      return;
    }
    setAnalyzing(true);
    setError("");
    try {
      const response = await api.analyzeResume({ resumeText, targetRole });
      if (response.success && response.data) {
        setResults(response.data);
        setAiProvider(response.providerUsed || "AI Resume Engine");
        setFallbackNotice(response.fallbackNotice || null);

        // Refresh history
        try {
          const histRes = await api.getResumeHistory();
          if (histRes.success) setHistory(histRes.data || []);
        } catch (e) {}
      }
    } catch (analysisError) {
      setError(analysisError.message || "Could not analyze resume. Please check input text.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleEnhanceBullet = async () => {
    if (!inputBullet.trim()) return;
    setEnhancing(true);
    setError("");
    try {
      const response = await api.enhanceBullet(inputBullet);
      setEnhancedBullet(response.data.enhanced || response.data.enhancedBullet || "");
    } catch (enhanceError) {
      setError(enhanceError.message || "Could not enhance bullet point.");
    } finally {
      setEnhancing(false);
    }
  };

  const matchedKws = results?.matchedKeywords || [];
  const missingKws = results?.missingKeywords || [];
  const displayedKeywords =
    keywordFilter === "matched"
      ? matchedKws.map((k) => ({ name: k, type: "matched" }))
      : keywordFilter === "missing"
      ? missingKws.map((k) => ({ name: k, type: "missing" }))
      : [
          ...matchedKws.map((k) => ({ name: k, type: "matched" })),
          ...missingKws.map((k) => ({ name: k, type: "missing" })),
        ];

  const atsScore = results?.atsScore || 0;
  const breakdown = results?.breakdown || { keywordsScore: 0, verbsScore: 0, impactScore: 0, formattingScore: 0 };

  return (
    <div className={styles.dashboard}>
      <DashboardSidebar />

      <main className={styles.mainContent}>
        <header className={styles.topBar}>
          <div>
            <h1 className={styles.pageTitle}>AI Resume ATS Scanner & Optimizer 📄</h1>
            <p className={styles.pageSubtitle}>
              Applicant Tracking System (ATS) compatibility audit, keyword matching, and Google XYZ impact optimization
            </p>
          </div>
          <div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              style={{
                padding: "10px 18px",
                borderRadius: "12px",
                border: "1px solid var(--border-color)",
                background: showHistory ? "var(--primary-50)" : "var(--bg-card)",
                color: "var(--primary-600)",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              {showHistory ? "Hide Scan History" : `Past Scans (${history.length})`}
            </button>
          </div>
        </header>

        {error && (
          <div style={{ padding: "14px 18px", borderRadius: "12px", background: "#fee2e2", color: "#991b1b", marginBottom: "20px" }}>
            {error}
          </div>
        )}

        {/* Scan History Drawer */}
        {showHistory && (
          <div style={{ padding: "20px", borderRadius: "16px", background: "var(--bg-card)", border: "1px solid var(--border-color)", marginBottom: "24px" }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "1.0625rem", color: "var(--text-primary)" }}>
              📊 Past Resume Evaluation History
            </h3>
            {history.length === 0 ? (
              <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.875rem" }}>No past evaluations recorded yet.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px" }}>
                {history.map((item) => (
                  <div key={item.id} style={{ padding: "14px", borderRadius: "12px", background: "var(--bg-card-hover)", border: "1px solid var(--border-color)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-primary)" }}>
                        {item.target_role}
                      </span>
                      <span style={{ fontWeight: 800, fontSize: "1.125rem", color: item.ats_score >= 80 ? "#10b981" : item.ats_score >= 60 ? "#6366f1" : "#ef4444" }}>
                        {item.ats_score}% ATS
                      </span>
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI Provider Badge */}
        {aiProvider && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 18px",
              borderRadius: "12px",
              background: fallbackNotice ? "#fffbeb" : "#eff6ff",
              border: fallbackNotice ? "1px solid #fef3c7" : "1px solid #bfdbfe",
              marginBottom: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "1.5rem" }}>🤖</span>
              <div>
                <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "#1e3a8a" }}>
                  Engine: {aiProvider}
                </span>
                {fallbackNotice && (
                  <p style={{ margin: "2px 0 0 0", fontSize: "0.75rem", color: "#b45309" }}>
                    ⚠️ {fallbackNotice}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "28px" }}>
          {/* Left Column: Input and Bullet Enhancer */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Input Card */}
            <div style={{ padding: "24px", borderRadius: "18px", background: "var(--bg-card)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                <label style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  Target Career Role
                </label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "10px",
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-card)",
                    color: "var(--text-primary)",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    outline: "none",
                  }}
                >
                  {targetRolesList.length > 0 ? (
                    targetRolesList.map((r) => (
                      <option key={r.id || r.name} value={r.name}>
                        {r.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Full Stack Developer">Full Stack Developer</option>
                      <option value="AI / ML Engineer">AI / Machine Learning Engineer</option>
                      <option value="Software Engineer">Software Engineer</option>
                      <option value="Cloud & DevOps Engineer">Cloud & DevOps Engineer</option>
                      <option value="Data Scientist">Data Scientist</option>
                    </>
                  )}
                </select>
              </div>

              <div style={{ marginBottom: "8px" }}>
                <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                  Paste Resume Content (Text / Markdown)
                </label>
              </div>

              <textarea
                rows={13}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your complete resume here (Education, Experience, Skills, Projects, Certifications)..."
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-card-hover)",
                  color: "var(--text-primary)",
                  fontSize: "0.875rem",
                  fontFamily: "monospace",
                  lineHeight: "1.5",
                  resize: "vertical",
                  outline: "none",
                }}
              />

              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                style={{
                  width: "100%",
                  marginTop: "16px",
                  padding: "14px",
                  borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(135deg, var(--primary-600), var(--primary-700))",
                  color: "#ffffff",
                  fontSize: "1rem",
                  fontWeight: 600,
                  cursor: analyzing ? "wait" : "pointer",
                  boxShadow: "0 4px 14px rgba(99, 102, 241, 0.3)",
                  transition: "all 0.2s ease",
                }}
              >
                {analyzing ? "⚡ Running Multi-Provider ATS Engine..." : "Analyze ATS Score & Keywords →"}
              </button>
            </div>

            {/* Google XYZ Formula Bullet Enhancer */}
            <div style={{ padding: "24px", borderRadius: "18px", background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <span style={{ fontSize: "1.5rem" }}>⚡</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.0625rem", color: "var(--text-primary)" }}>
                    Google XYZ Bullet Point Enhancer
                  </h3>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Formula: &ldquo;Accomplished [X] as measured by [Y], by doing [Z]&rdquo;
                  </span>
                </div>
              </div>

              <input
                type="text"
                value={inputBullet}
                onChange={(e) => setInputBullet(e.target.value)}
                placeholder="Paste a weak bullet point from your resume..."
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-card-hover)",
                  color: "var(--text-primary)",
                  fontSize: "0.875rem",
                  outline: "none",
                  marginBottom: "12px",
                }}
              />

              <button
                onClick={handleEnhanceBullet}
                disabled={enhancing}
                style={{
                  padding: "10px 20px",
                  borderRadius: "10px",
                  border: "none",
                  background: "var(--primary-600)",
                  color: "#ffffff",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: enhancing ? "wait" : "pointer",
                }}
              >
                {enhancing ? "Optimizing..." : "Transform with XYZ Formula"}
              </button>

              {enhancedBullet && (
                <div style={{ marginTop: "16px", padding: "16px", borderRadius: "12px", background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#166534", textTransform: "uppercase" }}>
                    ⭐ ATS High-Impact Version:
                  </span>
                  <p style={{ margin: "6px 0 0 0", fontSize: "0.875rem", color: "#166534", fontWeight: 600, lineHeight: "1.5" }}>
                    {enhancedBullet}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Graphical ATS Score & Deep-Dive Breakdown */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* ATS Score Card */}
            <div style={{ padding: "28px", borderRadius: "20px", background: "var(--bg-card)", border: "1px solid var(--border-color)", textAlign: "center", boxShadow: "var(--shadow-sm)" }}>
              <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Overall ATS Compatibility Score
              </span>

              {/* Radial Score Meter */}
              <div
                style={{
                  margin: "18px auto",
                  width: "130px",
                  height: "130px",
                  borderRadius: "50%",
                  background: atsScore >= 80 ? "linear-gradient(135deg, #dcfce7, #bbf7d0)" : atsScore >= 60 ? "linear-gradient(135deg, #e0e7ff, #c7d2fe)" : "linear-gradient(135deg, #fee2e2, #fecaca)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `5px solid ${atsScore >= 80 ? "#10b981" : atsScore >= 60 ? "var(--primary-600)" : "#ef4444"}`,
                }}
              >
                <span style={{ fontSize: "2.5rem", fontWeight: 800, color: atsScore >= 80 ? "#15803d" : atsScore >= 60 ? "var(--primary-700)" : "#991b1b" }}>
                  {atsScore}
                </span>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)" }}>/ 100</span>
              </div>

              <span
                style={{
                  display: "inline-block",
                  padding: "4px 14px",
                  borderRadius: "20px",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  background: atsScore >= 80 ? "#dcfce7" : atsScore >= 60 ? "#e0e7ff" : "#fee2e2",
                  color: atsScore >= 80 ? "#166534" : atsScore >= 60 ? "#3730a3" : "#991b1b",
                }}
              >
                {atsScore >= 80 ? "Top 10% ATS Candidate 🚀" : atsScore >= 60 ? "Competitive — Needs Minor Polish ⚡" : "Needs Optimization Before Applying 🌱"}
              </span>

              {/* 4 Pillar Sub-scores */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "24px", textAlign: "left" }}>
                {[
                  { label: "Target Role Keywords", val: breakdown.keywordsScore, color: "#10b981" },
                  { label: "Action Verbs Strength", val: breakdown.verbsScore, color: "#6366f1" },
                  { label: "Measurable Impact %", val: breakdown.impactScore, color: "#f59e0b" },
                  { label: "Section Formatting", val: breakdown.formattingScore, color: "#0ea5e9" },
                ].map((item) => (
                  <div key={item.label} style={{ padding: "12px 14px", borderRadius: "12px", background: "var(--bg-card-hover)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>{item.label}</span>
                      <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)" }}>{item.val}%</span>
                    </div>
                    <div style={{ width: "100%", height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ width: `${item.val}%`, height: "100%", background: item.color, borderRadius: "3px" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Keyword Audit Card */}
            <div style={{ padding: "24px", borderRadius: "18px", background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <h4 style={{ margin: 0, fontSize: "0.9375rem", color: "var(--text-primary)" }}>
                  🏷️ ATS Keyword Match Analysis
                </h4>
                <div style={{ display: "flex", gap: "4px" }}>
                  {["all", "matched", "missing"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setKeywordFilter(tab)}
                      style={{
                        padding: "4px 8px",
                        borderRadius: "6px",
                        border: "none",
                        background: keywordFilter === tab ? "var(--primary-600)" : "transparent",
                        color: keywordFilter === tab ? "#ffffff" : "var(--text-secondary)",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        textTransform: "capitalize",
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {displayedKeywords.length === 0 ? (
                  <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                    Scan your resume to view matching ATS keywords.
                  </p>
                ) : (
                  displayedKeywords.map((kw, i) => (
                    <span
                      key={i}
                      style={{
                        padding: "5px 10px",
                        borderRadius: "8px",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        background: kw.type === "matched" ? "#dcfce7" : "#fee2e2",
                        color: kw.type === "matched" ? "#166534" : "#991b1b",
                        border: kw.type === "matched" ? "1px solid #bbf7d0" : "1px solid #fecaca",
                      }}
                    >
                      {kw.type === "matched" ? `✓ ${kw.name}` : `+ ${kw.name}`}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* AI Actionable Critique */}
            {results?.feedback && (
              <div style={{ padding: "24px", borderRadius: "18px", background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "0.9375rem", color: "var(--text-primary)" }}>
                  💡 Recruiter Insights & Recommendations
                </h4>

                {results.feedback.summary && (
                  <p style={{ margin: "0 0 14px 0", fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                    {results.feedback.summary}
                  </p>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {(results.feedback.strengths || []).map((s, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "0.8125rem", color: "#166534" }}>
                      <span>✅</span>
                      <span>{s}</span>
                    </div>
                  ))}
                  {(results.feedback.improvements || []).map((imp, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "0.8125rem", color: "#991b1b" }}>
                      <span>⚠️</span>
                      <span>{imp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
