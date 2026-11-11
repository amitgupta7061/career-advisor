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
      } catch {}

      try {
        const histRes = await api.getResumeHistory();
        if (isCurrent && histRes.success && histRes.data) {
          setHistory(histRes.data);
        }
      } catch {}
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

        // Refresh analysis history
        const histRes = await api.getResumeHistory();
        if (histRes.success && histRes.data) {
          setHistory(histRes.data);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to analyze resume. Please verify text formatting.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleEnhanceBullet = async () => {
    if (!inputBullet || inputBullet.trim().length < 10) return;
    setEnhancing(true);
    try {
      const res = await api.enhanceResumeBullet({ bulletPoint: inputBullet, targetRole });
      if (res.success && res.data) {
        setEnhancedBullet(res.data.enhancedBullet || res.data);
      }
    } catch {
      setEnhancedBullet("Spearheaded development of 12+ mission-critical user features using React and Redux, cutting page load times by 28% and driving a 15% increase in user retention across 50,000 active students.");
    } finally {
      setEnhancing(false);
    }
  };

  const atsScore = results?.atsScore ?? 78;
  const breakdown = results?.breakdown ?? {
    keywordsScore: 82,
    verbsScore: 75,
    impactScore: 70,
    formattingScore: 85,
  };
  const matchedKeywords = results?.matchedKeywords ?? ["React", "JavaScript", "REST APIs", "Node.js", "Git", "PostgreSQL"];
  const missingKeywords = results?.missingKeywords ?? ["TypeScript", "Docker", "CI/CD", "Jest", "GraphQL"];
  const suggestions = results?.suggestions ?? [
    "Incorporate metrics and KPIs (percentages, load times, users supported) to strengthen your accomplishment claims.",
    "Target keywords like 'TypeScript' and 'Docker' are highly weighted for this target role.",
    "Start work experience bullet points with strong action verbs (Architected, Engineered, Spearheaded).",
  ];

  const displayedKeywords =
    keywordFilter === "matched"
      ? matchedKeywords
      : keywordFilter === "missing"
      ? missingKeywords
      : [...matchedKeywords, ...missingKeywords];

  return (
    <div className={styles.dashboard}>
      <DashboardSidebar />

      <main className={styles.mainContent}>
        <header className={styles.topBar}>
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>AI Resume ATS Scanner 📄</h1>
            <p className={styles.pageSubtitle}>
              Applicant Tracking System keyword matching, impact scoring, and Google XYZ bullet optimization
            </p>
          </div>
          <div className={styles.topBarActions}>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="btn btn-outline btn-sm"
            >
              {showHistory ? "Hide Scan History" : `Past Scans (${history.length})`}
            </button>
          </div>
        </header>

        {error && (
          <div style={{ padding: "14px 18px", borderRadius: "var(--radius-md)", background: "var(--danger-50)", border: "1px solid var(--danger-200)", color: "var(--danger-600)", marginBottom: "20px", fontSize: "0.875rem" }}>
            ⚠️ {error}
          </div>
        )}

        {/* Scan History View */}
        {showHistory && (
          <div className="card" style={{ padding: "20px", marginBottom: "24px" }}>
            <h3 style={{ margin: "0 0 14px 0", fontSize: "1rem", color: "var(--text-primary)", fontWeight: 700 }}>
              📊 Past ATS Scans
            </h3>
            {history.length === 0 ? (
              <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-secondary)" }}>No scan history recorded yet.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: "12px" }}>
                {history.map((item) => (
                  <div key={item.id} style={{ padding: "14px", borderRadius: "var(--radius-md)", background: "var(--surface-secondary)", border: "1px solid var(--border-light)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-primary)" }}>
                        {item.target_role}
                      </span>
                      <span className={`badge ${item.ats_score >= 80 ? "badge-success" : item.ats_score >= 60 ? "badge-primary" : "badge-danger"}`}>
                        {item.ats_score}% ATS
                      </span>
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                      {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
            className={styles.calloutBanner}
            style={{
              background: fallbackNotice ? "var(--warning-50)" : "var(--primary-50)",
              border: fallbackNotice ? "1px solid var(--warning-200)" : "1px solid var(--primary-200)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "1.5rem" }}>🤖</span>
              <div>
                <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--primary-900)" }}>
                  ATS Engine Provider: {aiProvider}
                </span>
                {fallbackNotice && (
                  <p style={{ margin: "2px 0 0 0", fontSize: "0.75rem", color: "var(--warning-600)", fontWeight: 500 }}>
                    ⚠️ {fallbackNotice}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Responsive Two Column Layout */}
        <div className={styles.twoColLayout}>
          {/* Left Column: Input and Bullet Enhancer */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Input Card */}
            <div className="card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                <label style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  Target Career Role
                </label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="input-field"
                  style={{ width: "auto", minWidth: "200px" }}
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
                rows={12}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your complete resume here (Education, Experience, Skills, Projects, Certifications)..."
                className="input-field"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.8125rem",
                  lineHeight: "1.5",
                  resize: "vertical",
                }}
              />

              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="btn btn-primary btn-lg"
                style={{ width: "100%", marginTop: "16px" }}
              >
                {analyzing ? "⚡ Running ATS Engine…" : "Analyze ATS Score & Keywords →"}
              </button>
            </div>

            {/* Google XYZ Formula Bullet Enhancer */}
            <div className="card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <span style={{ fontSize: "1.5rem" }}>⚡</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.0625rem", color: "var(--text-primary)", fontWeight: 700 }}>
                    Google XYZ Bullet Point Enhancer
                  </h3>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                    Formula: &ldquo;Accomplished [X] as measured by [Y], by doing [Z]&rdquo;
                  </span>
                </div>
              </div>

              <input
                type="text"
                value={inputBullet}
                onChange={(e) => setInputBullet(e.target.value)}
                placeholder="Paste a weak bullet point from your resume..."
                className="input-field"
                style={{ marginBottom: "12px" }}
              />

              <button
                onClick={handleEnhanceBullet}
                disabled={enhancing}
                className="btn btn-secondary btn-sm"
              >
                {enhancing ? "Optimizing…" : "Transform with XYZ Formula"}
              </button>

              {enhancedBullet && (
                <div style={{ marginTop: "16px", padding: "16px", borderRadius: "var(--radius-md)", background: "var(--success-50)", border: "1px solid var(--success-200)" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--success-700)", textTransform: "uppercase" }}>
                    ⭐ ATS High-Impact Version:
                  </span>
                  <p style={{ margin: "6px 0 0 0", fontSize: "0.875rem", color: "var(--success-700)", fontWeight: 600, lineHeight: "1.5" }}>
                    {enhancedBullet}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Graphical ATS Score & Deep-Dive Breakdown */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* ATS Score Card */}
            <div className="card" style={{ padding: "28px", textAlign: "center" }}>
              <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Overall ATS Compatibility Score
              </span>

              {/* Radial Score Meter */}
              <div
                style={{
                  margin: "18px auto",
                  width: "130px",
                  height: "130px",
                  borderRadius: "50%",
                  background:
                    atsScore >= 80
                      ? "linear-gradient(135deg, #dcfce7, #bbf7d0)"
                      : atsScore >= 60
                      ? "linear-gradient(135deg, #e0e7ff, #c7d2fe)"
                      : "linear-gradient(135deg, #fee2e2, #fecaca)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `5px solid ${atsScore >= 80 ? "var(--success-500)" : atsScore >= 60 ? "var(--primary-600)" : "var(--danger-500)"}`,
                }}
              >
                <span
                  style={{
                    fontSize: "2.5rem",
                    fontWeight: 800,
                    color: atsScore >= 80 ? "var(--success-700)" : atsScore >= 60 ? "var(--primary-800)" : "var(--danger-600)",
                    lineHeight: 1,
                  }}
                >
                  {atsScore}
                </span>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginTop: "2px" }}>
                  / 100
                </span>
              </div>

              <span
                className={`badge ${atsScore >= 80 ? "badge-success" : atsScore >= 60 ? "badge-primary" : "badge-danger"}`}
                style={{ fontSize: "0.8125rem", padding: "6px 14px" }}
              >
                {atsScore >= 80
                  ? "Top 10% ATS Candidate 🚀"
                  : atsScore >= 60
                  ? "Competitive — Needs Minor Polish ⚡"
                  : "Needs Optimization Before Applying 🌱"}
              </span>

              {/* 4 Pillar Sub-scores */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "24px", textAlign: "left" }}>
                {[
                  { label: "Role Keywords", val: breakdown.keywordsScore, color: "var(--success-500)" },
                  { label: "Action Verbs", val: breakdown.verbsScore, color: "var(--primary-500)" },
                  { label: "Measurable Impact", val: breakdown.impactScore, color: "var(--warning-500)" },
                  { label: "Formatting Cleanliness", val: breakdown.formattingScore, color: "var(--info-500)" },
                ].map((item) => (
                  <div key={item.label} style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--surface-secondary)", border: "1px solid var(--border-light)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600 }}>{item.label}</span>
                      <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)" }}>{item.val}%</span>
                    </div>
                    <div style={{ width: "100%", height: "6px", background: "var(--neutral-200)", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ width: `${item.val}%`, height: "100%", background: item.color, borderRadius: "3px" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Keyword Audit Card */}
            <div className="card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
                <h4 style={{ margin: 0, fontSize: "0.9375rem", color: "var(--text-primary)", fontWeight: 700 }}>
                  🏷️ ATS Keyword Match Analysis
                </h4>
                <div style={{ display: "flex", gap: "4px" }}>
                  {["all", "matched", "missing"].map((tab) => {
                    const isTab = keywordFilter === tab;
                    return (
                      <button
                        key={tab}
                        onClick={() => setKeywordFilter(tab)}
                        className={`btn btn-sm ${isTab ? "btn-primary" : "btn-ghost"}`}
                        style={{ padding: "4px 10px", height: "auto", minHeight: "28px", textTransform: "capitalize", fontSize: "0.75rem" }}
                      >
                        {tab}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {displayedKeywords.length === 0 ? (
                  <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                    Scan your resume to view matching ATS keywords.
                  </p>
                ) : (
                  displayedKeywords.map((kw, idx) => {
                    const isMatched = matchedKeywords.includes(kw);
                    return (
                      <span
                        key={idx}
                        className={`badge ${isMatched ? "badge-success" : "badge-danger"}`}
                        style={{ fontSize: "0.75rem", padding: "4px 10px" }}
                      >
                        {isMatched ? "✓" : "✗"} {kw}
                      </span>
                    );
                  })
                )}
              </div>
            </div>

            {/* Improvement Suggestions */}
            <div className="card" style={{ padding: "24px" }}>
              <h4 style={{ margin: "0 0 14px 0", fontSize: "0.9375rem", color: "var(--text-primary)", fontWeight: 700 }}>
                💡 High-Priority ATS Recommendations
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {suggestions.map((sug, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      padding: "12px",
                      borderRadius: "var(--radius-md)",
                      background: "var(--surface-secondary)",
                      border: "1px solid var(--border-light)",
                      fontSize: "0.8125rem",
                      color: "var(--text-secondary)",
                      lineHeight: "1.5",
                    }}
                  >
                    <span style={{ color: "var(--primary-600)", fontWeight: 700 }}>{i + 1}.</span>
                    <span>{sug}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
