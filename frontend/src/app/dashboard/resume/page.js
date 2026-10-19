"use client";
import { useState } from "react";
import styles from "../dashboard.module.css";
import DashboardSidebar from "@/components/DashboardSidebar/DashboardSidebar";
import { api } from "@/lib/api";



export default function ResumePage() {
  const [targetRole, setTargetRole] = useState("full stack developer");
  const [resumeText, setResumeText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState({ atsScore: 0, keywordsScore: 0, verbsScore: 0, impactScore: 0, formattingScore: 0, matchedKeywords: [], missingKeywords: [], feedback: null });
  const [error, setError] = useState("");
  const [inputBullet, setInputBullet] = useState("Responsible for building React frontend components.");
  const [enhancedBullet, setEnhancedBullet] = useState("");

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError("");
    try {
      const response = await api.analyzeResume({ resumeText, targetRole });
      const data = response.data;
      setResults({ atsScore: data.atsScore, keywordsScore: data.breakdown.keywordsScore, verbsScore: data.breakdown.verbsScore, impactScore: data.breakdown.impactScore, formattingScore: data.breakdown.formattingScore, matchedKeywords: data.matchedKeywords, missingKeywords: data.missingKeywords, feedback: data.feedback });
    } catch (analysisError) {
      setError(analysisError.message || "Could not analyze this resume.");
    } finally { setAnalyzing(false); }
  };

  const handleEnhanceBullet = async () => {
    if (!inputBullet.trim()) return;
    setError("");
    try {
      const response = await api.enhanceBullet(inputBullet);
      setEnhancedBullet(response.data.enhancedBullet || response.data.enhanced || "");
    } catch (enhanceError) { setError(enhanceError.message || "Could not enhance this bullet."); }
  };
  return (
    <div className={styles.dashboard}>
      <DashboardSidebar />

      <main className={styles.mainContent}>
        <header className={styles.topBar}>
          <div>
            <h1 className={styles.pageTitle}>AI Resume ATS Scanner 📄</h1>
            <p className={styles.pageSubtitle}>Analyze and optimize your resume against top tech company applicant tracking systems</p>
          </div>
        </header>

        {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "28px" }}>
          {/* Left Column: Input and Target Role */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ padding: "24px", borderRadius: "16px", background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <label style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)" }}>
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
                    fontWeight: 500,
                    outline: "none"
                  }}
                >
                  <option value="full stack developer">Full Stack Developer</option>
                  <option value="ai / ml engineer">AI / Machine Learning Engineer</option>
                  <option value="software engineer">Software Engineer</option>
                  <option value="cloud & devops engineer">Cloud & DevOps Engineer</option>
                  <option value="data scientist">Data Scientist</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)" }}>
                  Paste Resume Content
                </label>
              </div>

              <textarea
                rows={14}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
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
                  outline: "none"
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
                  cursor: analyzing ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 14px rgba(99, 102, 241, 0.3)",
                  transition: "all 0.2s ease"
                }}
              >
                {analyzing ? "Running ATS Engine..." : "Analyze ATS Score & Keywords →"}
              </button>
            </div>

            {/* Google XYZ Formula Bullet Enhancer */}
            <div style={{ padding: "24px", borderRadius: "16px", background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
              <h3 style={{ margin: "0 0 8px 0", fontSize: "1.125rem", color: "var(--text-primary)" }}>
                ⚡ Bullet Point Impact Enhancer (Google XYZ Formula)
              </h3>
              <p style={{ margin: "0 0 16px 0", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                Formula: &ldquo;Accomplished [X] as measured by [Y], by doing [Z]&rdquo;
              </p>

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
                  marginBottom: "12px"
                }}
              />

              <button
                onClick={handleEnhanceBullet}
                style={{
                  padding: "10px 18px",
                  borderRadius: "10px",
                  border: "none",
                  background: "var(--primary-600)",
                  color: "#ffffff",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Enhance Bullet Point
              </button>

              {enhancedBullet && (
                <div style={{ marginTop: "16px", padding: "16px", borderRadius: "10px", background: "#d1fae5", border: "1px solid #a7f3d0" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#065f46", textTransform: "uppercase" }}>
                    ATS Optimized Version
                  </span>
                  <p style={{ margin: "6px 0 0 0", fontSize: "0.875rem", color: "#065f46", fontWeight: 600, lineHeight: "1.5" }}>
                    {enhancedBullet}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live ATS Score & Feedback */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Score Card */}
            <div style={{ padding: "28px", borderRadius: "20px", background: "var(--bg-card)", border: "1px solid var(--border-color)", textAlign: "center" }}>
              <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
                Overall ATS Compatibility
              </span>
              <div style={{
                margin: "16px auto",
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #e0e7ff, #c7d2fe)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                border: "4px solid var(--primary-600)"
              }}>
                <span style={{ fontSize: "2.25rem", fontWeight: 800, color: "var(--primary-700)" }}>{results.atsScore}</span>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--primary-900)" }}>/ 100</span>
              </div>
              <span style={{
                display: "inline-block",
                padding: "4px 14px",
                borderRadius: "20px",
                fontSize: "0.875rem",
                fontWeight: 700,
                background: results.atsScore >= 80 ? "#d1fae5" : "#fef3c7",
                color: results.atsScore >= 80 ? "#065f46" : "#92400e"
              }}>
                {results.atsScore >= 80 ? "Top 10% ATS Candidate" : "Competitive — Needs Keyword Polish"}
              </span>

              {/* Sub-scores */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "24px", textAlign: "left" }}>
                <div style={{ padding: "12px", borderRadius: "10px", background: "var(--bg-card-hover)" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Target Keywords</span>
                  <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)" }}>{results.keywordsScore}%</div>
                </div>
                <div style={{ padding: "12px", borderRadius: "10px", background: "var(--bg-card-hover)" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Action Verbs</span>
                  <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)" }}>{results.verbsScore}%</div>
                </div>
                <div style={{ padding: "12px", borderRadius: "10px", background: "var(--bg-card-hover)" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Measurable Metrics</span>
                  <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)" }}>{results.impactScore}%</div>
                </div>
                <div style={{ padding: "12px", borderRadius: "10px", background: "var(--bg-card-hover)" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Section Structure</span>
                  <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)" }}>{results.formattingScore}%</div>
                </div>
              </div>
            </div>

            {/* Keyword Audit */}
            <div style={{ padding: "24px", borderRadius: "16px", background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "0.9375rem", color: "#065f46" }}>
                ✅ Found ATS Keywords ({results.matchedKeywords.length})
              </h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "20px" }}>
                {results.matchedKeywords.map((kw) => (
                  <span key={kw} style={{ padding: "4px 10px", borderRadius: "6px", background: "#d1fae5", color: "#065f46", fontSize: "0.8125rem", fontWeight: 600 }}>
                    {kw}
                  </span>
                ))}
              </div>

              <h4 style={{ margin: "0 0 12px 0", fontSize: "0.9375rem", color: "#991b1b" }}>
                ⚠️ Missing Keywords for {targetRole} ({results.missingKeywords.length})
              </h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {results.missingKeywords.map((kw) => (
                  <span key={kw} style={{ padding: "4px 10px", borderRadius: "6px", background: "#fee2e2", color: "#991b1b", fontSize: "0.8125rem", fontWeight: 600 }}>
                    + {kw}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
