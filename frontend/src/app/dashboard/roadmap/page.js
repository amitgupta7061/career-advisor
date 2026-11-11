"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import styles from "../dashboard.module.css";
import DashboardSidebar from "@/components/DashboardSidebar/DashboardSidebar";

export default function RoadmapPage() {
  const [roadmap, setRoadmap] = useState(null);
  const [roadmapsList, setRoadmapsList] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [skillNotice, setSkillNotice] = useState(null);

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        setLoading(true);
        setError("");
        const response = await api.getUserRoadmaps();
        const list = response.data || [];
        setRoadmapsList(list);

        const currentActive = list.find((r) => r.status === "active") || list[0];
        if (!currentActive) return;

        const detail = await api.getRoadmapDetail(currentActive.id);
        if (!active) return;
        setRoadmap(detail.data);
        setMilestones(detail.data.milestones || []);
      } catch (err) {
        if (active) setError(err.message || "Could not load roadmap.");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => { active = false; };
  }, []);

  // Switch between roadmaps if student has multiple career roadmaps
  async function handleSelectRoadmap(id) {
    try {
      setLoading(true);
      const detail = await api.getRoadmapDetail(id);
      setRoadmap(detail.data);
      setMilestones(detail.data.milestones || []);
    } catch (err) {
      setError(err.message || "Failed to load selected roadmap.");
    } finally {
      setLoading(false);
    }
  }

  // Toggle step completion status
  async function toggleStep(stepId, currentStatus) {
    if (!roadmap) return;
    setUpdating(true);
    setSkillNotice(null);

    const nextStatus =
      currentStatus === "completed"
        ? "pending"
        : currentStatus === "in_progress"
        ? "completed"
        : "in_progress";

    try {
      const res = await api.updateStepStatus(roadmap.id, stepId, nextStatus);
      if (res.success && res.data) {
        if (res.data.skillUpdated) {
          setSkillNotice(
            `🎉 Skill Verified: ${res.data.skillUpdated.skillName} upgraded to ${String(res.data.skillUpdated.newLevel).toUpperCase()}!`
          );
        }

        const updated = await api.getRoadmapDetail(roadmap.id);
        setRoadmap(updated.data);
        setMilestones(updated.data.milestones || []);
      }
    } catch (err) {
      setError(err.message || "Could not update milestone status.");
    } finally {
      setUpdating(false);
    }
  }

  // Toggle pause/resume roadmap state
  async function toggleRoadmapState() {
    if (!roadmap) return;
    const nextState = roadmap.status === "paused" ? "active" : "paused";
    try {
      const res = await api.setRoadmapStatus(roadmap.id, nextState);
      if (res.success) {
        setRoadmap((prev) => ({ ...prev, status: nextState }));
      }
    } catch (err) {
      setError(err.message || "Could not update roadmap state.");
    }
  }

  const allSteps = milestones.flatMap((m) => m.steps || []);
  const totalHours = allSteps.reduce((acc, s) => acc + (Number(s.estimated_hrs) || 0), 0);
  const completedStepsCount = allSteps.filter((s) => s.status === "completed").length;
  const overallPercent = allSteps.length > 0 ? Math.round((completedStepsCount / allSteps.length) * 100) : 0;

  return (
    <div className={styles.dashboard}>
      <DashboardSidebar />

      <main className={styles.mainContent}>
        <header className={styles.topBar}>
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>Personalized Learning Roadmap 📚</h1>
            <p className={styles.pageSubtitle}>
              Milestone-driven technical pathway to bridge skill gaps for{" "}
              <strong>{roadmap?.target_role || roadmap?.role_title || "your target career"}</strong>
            </p>
          </div>

          {roadmapsList.length > 1 && (
            <div className={styles.topBarActions}>
              <select
                value={roadmap?.id || ""}
                onChange={(e) => handleSelectRoadmap(e.target.value)}
                className="input-field"
                style={{ width: "auto" }}
              >
                {roadmapsList.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.target_role || r.title} (v{r.version || 1}) - {r.status}
                  </option>
                ))}
              </select>
            </div>
          )}
        </header>

        {error && (
          <div style={{ padding: "14px 18px", borderRadius: "var(--radius-md)", background: "var(--danger-50)", color: "var(--danger-600)", border: "1px solid var(--danger-200)", marginBottom: "20px", fontSize: "0.875rem" }}>
            ⚠️ {error}
          </div>
        )}

        {skillNotice && (
          <div style={{ padding: "14px 18px", borderRadius: "var(--radius-md)", background: "var(--success-50)", border: "1px solid var(--success-200)", color: "var(--success-700)", marginBottom: "20px", fontWeight: 600, fontSize: "0.875rem" }}>
            {skillNotice}
          </div>
        )}

        {loading && (
          <div className="card" style={{ padding: "32px", textAlign: "center", marginBottom: "24px" }}>
            <span className="spinner" style={{ color: "var(--primary-600)", marginBottom: "8px" }} />
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>Loading your personalized roadmap…</p>
          </div>
        )}

        {!loading && !roadmap && (
          <div className="card" style={{ padding: "40px 24px", textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🗺️</div>
            <h3 style={{ fontSize: "1.25rem", color: "var(--text-primary)", fontWeight: 700, marginBottom: "8px" }}>
              No Learning Roadmap Generated Yet
            </h3>
            <p style={{ color: "var(--text-secondary)", marginBottom: "20px", maxWidth: "420px", margin: "0 auto 20px auto", fontSize: "0.9375rem" }}>
              Explore career paths and run a Skill Gap Analysis to generate your tailored milestone pathway.
            </p>
            <Link href="/dashboard/careers" className="btn btn-primary">
              Explore Career Paths →
            </Link>
          </div>
        )}

        {roadmap && (
          <>
            {/* Overview Pathway Hero Banner */}
            <div
              style={{
                padding: "28px 32px",
                borderRadius: "var(--radius-xl)",
                background:
                  roadmap.status === "paused"
                    ? "linear-gradient(135deg, #475569, #334155)"
                    : "linear-gradient(135deg, var(--primary-700) 0%, var(--primary-600) 100%)",
                color: "#ffffff",
                marginBottom: "28px",
                boxShadow: "0 8px 24px rgba(79, 70, 229, 0.22)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "16px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", background: "rgba(255,255,255,0.2)", padding: "3px 10px", borderRadius: "var(--radius-full)", fontWeight: 600 }}>
                      Pathway: {roadmap.target_role || "Professional"}
                    </span>
                    <span style={{ fontSize: "0.75rem", background: "rgba(255,255,255,0.2)", padding: "3px 10px", borderRadius: "var(--radius-full)" }}>
                      v{roadmap.version || 1}
                    </span>
                    <span style={{ fontSize: "0.75rem", background: roadmap.status === "active" ? "var(--success-500)" : "var(--warning-500)", padding: "3px 10px", borderRadius: "var(--radius-full)", fontWeight: 700 }}>
                      {String(roadmap.status).toUpperCase()}
                    </span>
                  </div>
                  <h2 style={{ margin: "4px 0 6px 0", fontSize: "1.5rem", fontWeight: 800 }}>{roadmap.title}</h2>
                  <p style={{ margin: 0, fontSize: "0.875rem", opacity: 0.9, maxWidth: "680px", lineHeight: "1.5" }}>
                    {roadmap.description}
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px" }}>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "2.25rem", fontWeight: 800, lineHeight: 1 }}>{overallPercent}%</span>
                    <span style={{ display: "block", fontSize: "0.75rem", opacity: 0.85, marginTop: "2px" }}>
                      {completedStepsCount} of {allSteps.length} Activities Completed
                    </span>
                  </div>

                  <button
                    onClick={toggleRoadmapState}
                    className="btn btn-sm"
                    style={{
                      background: "rgba(255,255,255,0.2)",
                      color: "#ffffff",
                      border: "none",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    {roadmap.status === "paused" ? "▶ Resume Pathway" : "⏸ Pause Pathway"}
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ width: "100%", height: "10px", background: "rgba(255, 255, 255, 0.25)", borderRadius: "6px", overflow: "hidden" }}>
                <div
                  style={{
                    width: `${overallPercent}%`,
                    height: "100%",
                    background: "#ffffff",
                    borderRadius: "6px",
                    transition: "width 0.4s ease",
                  }}
                />
              </div>

              {/* Metrics Strip */}
              <div style={{ display: "flex", gap: "24px", marginTop: "16px", fontSize: "0.875rem", flexWrap: "wrap", opacity: 0.95 }}>
                <span>⏱️ Total Effort: <strong>{totalHours} Hours</strong></span>
                <span>📅 Estimated Duration: <strong>{roadmap.estimated_duration_weeks || 10} Weeks</strong></span>
                <span>🎯 <strong>{milestones.length} Strategic Phases</strong></span>
                <span>⭐ Verified Authentic Resources</span>
              </div>
            </div>

            {/* Filter by Activity Type */}
            <div className={styles.pillsScroll} style={{ marginBottom: "24px" }}>
              {["all", "course", "project", "tutorial", "practice", "documentation"].map((type) => {
                const isType = filterType === type;
                return (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`btn btn-sm ${isType ? "btn-primary" : "btn-outline"}`}
                    style={{ borderRadius: "var(--radius-full)", textTransform: "capitalize" }}
                  >
                    {type === "all" ? "All Activities" : type}
                  </button>
                );
              })}
            </div>

            {/* Milestones and Activities Accordion/List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {milestones.map((milestone) => {
                const milestoneFilteredSteps = (milestone.steps || []).filter(
                  (s) => filterType === "all" || (s.activity_type || s.resource_type) === filterType
                );

                if (milestoneFilteredSteps.length === 0 && filterType !== "all") return null;

                const mCompleted = (milestone.steps || []).filter((s) => s.status === "completed").length;
                const mTotal = (milestone.steps || []).length;
                const mPercent = mTotal > 0 ? Math.round((mCompleted / mTotal) * 100) : 0;

                return (
                  <div
                    key={milestone.milestoneIndex}
                    className="card"
                    style={{ padding: "24px" }}
                  >
                    {/* Milestone Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "12px", borderBottom: "1px solid var(--border-light)", paddingBottom: "16px" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--primary-600)", textTransform: "uppercase" }}>
                            PHASE {milestone.milestoneIndex}
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                            · {milestone.durationWeeks || 3} Weeks
                          </span>
                        </div>
                        <h3 style={{ margin: 0, fontSize: "1.1875rem", color: "var(--text-primary)", fontWeight: 700 }}>
                          {milestone.title}
                        </h3>
                        {milestone.description && (
                          <p style={{ margin: "4px 0 0 0", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                            {milestone.description}
                          </p>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "0.875rem", fontWeight: 700, color: mPercent === 100 ? "var(--success-600)" : "var(--primary-600)" }}>
                          {mPercent}% Complete
                        </span>
                        <div style={{ width: "90px", height: "8px", background: "var(--neutral-200)", borderRadius: "4px", overflow: "hidden" }}>
                          <div
                            style={{
                              width: `${mPercent}%`,
                              height: "100%",
                              background: mPercent === 100 ? "var(--success-500)" : "var(--primary-600)",
                              borderRadius: "4px",
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Step Cards within Milestone */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                      {milestoneFilteredSteps.map((step) => {
                        const isCompleted = step.status === "completed";
                        const isInProgress = step.status === "in_progress";
                        const type = step.activity_type || step.resource_type || "course";

                        return (
                          <div
                            key={step.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "16px",
                              padding: "18px",
                              borderRadius: "var(--radius-lg)",
                              background: isCompleted ? "var(--success-50)" : isInProgress ? "var(--primary-50)" : "var(--surface-secondary)",
                              border: isInProgress ? "2px solid var(--primary-500)" : isCompleted ? "1px solid var(--success-200)" : "1px solid var(--border-light)",
                              flexWrap: "wrap",
                              transition: "all var(--transition-fast)",
                            }}
                          >
                            {/* Step Order Circle */}
                            <div
                              style={{
                                width: "42px",
                                height: "42px",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: isCompleted ? "var(--success-200)" : isInProgress ? "var(--primary-200)" : "var(--surface-primary)",
                                color: isCompleted ? "var(--success-700)" : isInProgress ? "var(--primary-700)" : "var(--text-secondary)",
                                fontSize: "1rem",
                                fontWeight: 700,
                                border: isCompleted ? "none" : "1px solid var(--border-light)",
                                flexShrink: 0,
                              }}
                            >
                              {isCompleted ? "✓" : step.step_order}
                            </div>

                            {/* Activity Info */}
                            <div style={{ flex: 1, minWidth: "240px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                                <span className={`badge ${type === "project" ? "badge-danger" : type === "practice" ? "badge-warning" : "badge-primary"}`}>
                                  {type}
                                </span>

                                <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                                  via <strong>{step.platform || "Self-guided"}</strong> · ⏱️ {step.estimated_hrs || 15} hrs
                                </span>

                                {step.is_free !== false && (
                                  <span className="badge badge-success">Free</span>
                                )}

                                {step.priority === "critical" && (
                                  <span className="badge badge-danger">High Priority Gap</span>
                                )}
                              </div>

                              <h4 style={{ margin: "0 0 6px 0", fontSize: "1rem", color: "var(--text-primary)", fontWeight: 700 }}>
                                {step.title}
                              </h4>

                              <p style={{ margin: "0 0 8px 0", fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                                {step.description}
                              </p>

                              {step.expected_outcomes && (
                                <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--success-700)", fontWeight: 600 }}>
                                  🎯 Outcome: {step.expected_outcomes}
                                </p>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end", flexShrink: 0 }}>
                              <button
                                onClick={() => toggleStep(step.id, step.status)}
                                disabled={updating}
                                className={`btn btn-sm ${isCompleted ? "btn-outline" : "btn-primary"}`}
                              >
                                {isCompleted ? "Completed ✓" : isInProgress ? "Mark Completed" : "Start Activity"}
                              </button>

                              <a
                                href={step.resource_url || step.course_url || "https://developer.mozilla.org"}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  fontSize: "0.8125rem",
                                  color: "var(--primary-600)",
                                  fontWeight: 600,
                                }}
                              >
                                Open Resource ↗
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
