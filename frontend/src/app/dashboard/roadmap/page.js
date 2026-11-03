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

    const nextStatus = currentStatus === "completed" ? "pending" : currentStatus === "in_progress" ? "completed" : "in_progress";

    try {
      const res = await api.updateStepStatus(roadmap.id, stepId, nextStatus);
      if (res.success && res.data) {
        // If skill was upgraded, show celebration toast
        if (res.data.skillUpdated) {
          setSkillNotice(`🎉 Skill Verified: ${res.data.skillUpdated.skillName} upgraded to ${res.data.skillUpdated.newLevel.toUpperCase()}!`);
        }

        // Refresh roadmap details
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
          <div>
            <h1 className={styles.pageTitle}>Personalized Learning Roadmap 📚</h1>
            <p className={styles.pageSubtitle}>
              Milestone-driven technical pathway to bridge skill gaps for <strong>{roadmap?.target_role || roadmap?.role_title || "your career goal"}</strong>
            </p>
          </div>

          {roadmapsList.length > 1 && (
            <div>
              <select
                value={roadmap?.id || ""}
                onChange={(e) => handleSelectRoadmap(e.target.value)}
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
          <div style={{ padding: "14px 18px", borderRadius: "12px", background: "#fee2e2", color: "#991b1b", marginBottom: "20px" }}>
            {error}
          </div>
        )}

        {skillNotice && (
          <div style={{ padding: "14px 18px", borderRadius: "12px", background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", marginBottom: "20px", fontWeight: 600 }}>
            {skillNotice}
          </div>
        )}

        {loading && <p>Loading your personalized roadmap…</p>}

        {!loading && !roadmap && (
          <div style={{ padding: "32px", borderRadius: "16px", background: "var(--bg-card)", textAlign: "center", border: "1px solid var(--border-color)" }}>
            <h3>No learning roadmap generated yet!</h3>
            <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>
              Explore career paths and perform a Skill Gap Analysis to generate your personalized learning plan.
            </p>
            <Link
              href="/dashboard/careers"
              style={{
                display: "inline-block",
                padding: "12px 24px",
                borderRadius: "10px",
                background: "var(--primary-600)",
                color: "#ffffff",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Explore Career Paths →
            </Link>
          </div>
        )}

        {roadmap && (
          <>
            {/* Overview Pathway Banner */}
            <div
              style={{
                padding: "26px",
                borderRadius: "18px",
                background: roadmap.status === "paused"
                  ? "linear-gradient(135deg, #64748b, #475569)"
                  : "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                color: "#ffffff",
                marginBottom: "28px",
                boxShadow: "0 8px 24px rgba(79, 70, 229, 0.22)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", background: "rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: "6px" }}>
                      Pathway: {roadmap.target_role || "Professional"}
                    </span>
                    <span style={{ fontSize: "0.75rem", background: "rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: "6px" }}>
                      v{roadmap.version || 1}
                    </span>
                    <span style={{ fontSize: "0.75rem", background: roadmap.status === "active" ? "#10b981" : "#f59e0b", padding: "2px 8px", borderRadius: "6px", fontWeight: 700 }}>
                      {roadmap.status?.toUpperCase()}
                    </span>
                  </div>
                  <h2 style={{ margin: "0 0 6px 0", fontSize: "1.5rem" }}>{roadmap.title}</h2>
                  <p style={{ margin: 0, fontSize: "0.875rem", opacity: 0.9, maxWidth: "700px", lineHeight: "1.5" }}>
                    {roadmap.description}
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px" }}>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "2rem", fontWeight: 800 }}>{overallPercent}%</span>
                    <span style={{ display: "block", fontSize: "0.8125rem", opacity: 0.9 }}>
                      {completedStepsCount} of {allSteps.length} Activities Completed
                    </span>
                  </div>

                  <button
                    onClick={toggleRoadmapState}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "8px",
                      border: "none",
                      background: "rgba(255,255,255,0.2)",
                      color: "#ffffff",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    {roadmap.status === "paused" ? "▶ Resume Pathway" : "⏸ Pause Pathway"}
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ width: "100%", height: "10px", background: "rgba(255, 255, 255, 0.25)", borderRadius: "6px", overflow: "hidden" }}>
                <div style={{ width: `${overallPercent}%`, height: "100%", background: "#ffffff", borderRadius: "6px", transition: "width 0.4s ease" }} />
              </div>

              {/* Metrics Strip */}
              <div style={{ display: "flex", gap: "24px", marginTop: "18px", fontSize: "0.875rem", flexWrap: "wrap" }}>
                <span>⏱️ Total Effort: <strong>{totalHours} Hours</strong></span>
                <span>📅 Estimated Duration: <strong>{roadmap.estimated_duration_weeks || 10} Weeks</strong></span>
                <span>🎯 <strong>{milestones.length} Strategic Phases</strong></span>
                <span>⭐ Verified Authentic Resources</span>
              </div>
            </div>

            {/* Filter by Activity Type */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "24px", overflowX: "auto", paddingBottom: "4px" }}>
              {["all", "course", "project", "tutorial", "practice", "documentation"].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "20px",
                    border: filterType === type ? "1px solid var(--primary-600)" : "1px solid var(--border-color)",
                    background: filterType === type ? "var(--primary-600)" : "var(--bg-card)",
                    color: filterType === type ? "#ffffff" : "var(--text-secondary)",
                    fontWeight: filterType === type ? 600 : 500,
                    fontSize: "0.8125rem",
                    cursor: "pointer",
                    textTransform: "capitalize",
                    transition: "all 0.2s ease",
                  }}
                >
                  {type === "all" ? "All Activities" : type}
                </button>
              ))}
            </div>

            {/* Milestones and Activities Accordion/List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
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
                    style={{
                      borderRadius: "18px",
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-color)",
                      padding: "24px",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    {/* Milestone Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--primary-600)" }}>
                            PHASE {milestone.milestoneIndex}
                          </span>
                          <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                            · {milestone.durationWeeks || 3} Weeks
                          </span>
                        </div>
                        <h3 style={{ margin: 0, fontSize: "1.25rem", color: "var(--text-primary)" }}>
                          {milestone.title}
                        </h3>
                        {milestone.description && (
                          <p style={{ margin: "4px 0 0 0", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                            {milestone.description}
                          </p>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "0.875rem", fontWeight: 700, color: mPercent === 100 ? "#10b981" : "var(--primary-600)" }}>
                          {mPercent}% Complete
                        </span>
                        <div style={{ width: "90px", height: "8px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
                          <div style={{ width: `${mPercent}%`, height: "100%", background: mPercent === 100 ? "#10b981" : "var(--primary-600)", borderRadius: "4px" }} />
                        </div>
                      </div>
                    </div>

                    {/* Step Cards within Milestone */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      {milestoneFilteredSteps.map((step) => {
                        const isCompleted = step.status === "completed";
                        const isInProgress = step.status === "in_progress";
                        const type = step.activity_type || step.resource_type || "course";

                        return (
                          <div
                            key={step.id}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "54px 1fr auto",
                              gap: "20px",
                              padding: "20px",
                              borderRadius: "14px",
                              background: isCompleted ? "#f0fdf4" : isInProgress ? "#f5f3ff" : "#f8fafc",
                              border: isInProgress ? "2px solid #8b5cf6" : isCompleted ? "1px solid #bbf7d0" : "1px solid #e2e8f0",
                              alignItems: "center",
                            }}
                          >
                            {/* Step Order Circle */}
                            <div
                              style={{
                                width: "48px",
                                height: "48px",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: isCompleted ? "#d1fae5" : isInProgress ? "#ede9fe" : "#ffffff",
                                color: isCompleted ? "#065f46" : isInProgress ? "#6d28d9" : "#64748b",
                                fontSize: "1.125rem",
                                fontWeight: 700,
                                border: isCompleted ? "none" : "1px solid #cbd5e1",
                              }}
                            >
                              {isCompleted ? "✓" : step.step_order}
                            </div>

                            {/* Activity Info */}
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                                <span
                                  style={{
                                    padding: "2px 8px",
                                    borderRadius: "6px",
                                    fontSize: "0.75rem",
                                    fontWeight: 700,
                                    textTransform: "uppercase",
                                    background: type === "project" ? "#fce7f3" : type === "practice" ? "#fef3c7" : "#e0e7ff",
                                    color: type === "project" ? "#9d174d" : type === "practice" ? "#92400e" : "#3730a3",
                                  }}
                                >
                                  {type}
                                </span>

                                <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                                  via <strong>{step.platform || "Self-guided"}</strong> · ⏱️ {step.estimated_hrs || 15} hrs
                                </span>

                                {step.is_free !== false && (
                                  <span style={{ padding: "2px 6px", borderRadius: "4px", fontSize: "0.6875rem", background: "#dcfce7", color: "#166534", fontWeight: 600 }}>
                                    Free
                                  </span>
                                )}

                                {step.priority === "critical" && (
                                  <span style={{ padding: "2px 6px", borderRadius: "4px", fontSize: "0.6875rem", background: "#fee2e2", color: "#991b1b", fontWeight: 700 }}>
                                    High Priority Gap
                                  </span>
                                )}
                              </div>

                              <h4 style={{ margin: "0 0 6px 0", fontSize: "1.0625rem", color: "var(--text-primary)" }}>
                                {step.title}
                              </h4>

                              <p style={{ margin: "0 0 8px 0", fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                                {step.description}
                              </p>

                              {/* Expected Outcome */}
                              {step.expected_outcomes && (
                                <p style={{ margin: 0, fontSize: "0.8125rem", color: "#047857", fontWeight: 600 }}>
                                  🎯 Outcome: {step.expected_outcomes}
                                </p>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
                              <button
                                onClick={() => toggleStep(step.id, step.status)}
                                disabled={updating}
                                style={{
                                  padding: "8px 18px",
                                  borderRadius: "10px",
                                  border: "none",
                                  background: isCompleted ? "#d1fae5" : isInProgress ? "#8b5cf6" : "var(--primary-600)",
                                  color: isCompleted ? "#065f46" : "#ffffff",
                                  fontSize: "0.875rem",
                                  fontWeight: 600,
                                  cursor: updating ? "wait" : "pointer",
                                  transition: "all 0.2s ease",
                                }}
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
                                  textDecoration: "none",
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
