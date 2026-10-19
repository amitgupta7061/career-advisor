"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import styles from "../dashboard.module.css";
import DashboardSidebar from "@/components/DashboardSidebar/DashboardSidebar";

export default function RoadmapPage() {
  const [roadmap, setRoadmap] = useState(null);
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadRoadmap() {
      try {
        const response = await api.getUserRoadmaps();
        const latest = (response.data || [])[0];
        if (!latest) return;
        const detail = await api.getRoadmapDetail(latest.id);
        if (!active) return;
        setRoadmap(detail.data);
        setSteps((detail.data.steps || []).map((step) => ({ ...step, stepOrder: step.step_order, type: step.resource_type, platform: step.platform || "Self-guided", courseUrl: step.course_url, durationHrs: Number(step.estimated_hrs || 0) })));
      } catch (loadError) { if (active) setError(loadError.message || "Could not load your roadmap."); }
      finally { if (active) setLoading(false); }
    }
    loadRoadmap();
    return () => { active = false; };
  }, []);

  async function toggleStep(id) {
    const step = steps.find((item) => item.id === id);
    if (!step || !roadmap) return;
    const nextStatus = step.status === "completed" ? "pending" : step.status === "in_progress" ? "completed" : "in_progress";
    try {
      await api.updateStepStatus(roadmap.id, step.id, nextStatus);
      setSteps((previous) => previous.map((item) => item.id === id ? { ...item, status: nextStatus } : item));
    } catch (updateError) { setError(updateError.message || "Could not update this milestone."); }
  }
  const completedCount = steps.filter((s) => s.status === "completed").length;
  const progressPercent = steps.length ? Math.round((completedCount / steps.length) * 100) : 0;
  const totalHours = steps.reduce((acc, curr) => acc + curr.durationHrs, 0);

  return (
    <div className={styles.dashboard}>
      <DashboardSidebar />

      <main className={styles.mainContent}>
        <header className={styles.topBar}>
          <div>
            <h1 className={styles.pageTitle}>Personalized Learning Roadmap 📚</h1>
            <p className={styles.pageSubtitle}>Curated milestone path to bridge your skill gaps for <strong>{roadmap?.role_title || roadmap?.title || "your career goal"}</strong></p>
          </div>
        </header>

        {error && <p role="alert">{error}</p>}{loading && <p>Loading your roadmap…</p>}{!loading && !roadmap && <p>No roadmap yet. Choose a career path to generate one. <Link href="/dashboard/careers">Explore careers</Link></p>}{/* Overview Banner */}
        <div style={{
          padding: "24px",
          borderRadius: "16px",
          background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
          color: "#ffffff",
          marginBottom: "32px",
          boxShadow: "0 8px 24px rgba(79, 70, 229, 0.25)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <span style={{ fontSize: "0.8125rem", textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.9 }}>Active Pathway</span>
              <h2 style={{ margin: "4px 0 0 0", fontSize: "1.5rem" }}>{roadmap?.title || "Your learning roadmap"}</h2>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "1.75rem", fontWeight: 700 }}>{progressPercent}%</span>
              <span style={{ display: "block", fontSize: "0.8125rem", opacity: 0.9 }}>Completed ({completedCount}/{steps.length} Milestones)</span>
            </div>
          </div>

          <div style={{ width: "100%", height: "10px", background: "rgba(255, 255, 255, 0.25)", borderRadius: "6px", overflow: "hidden" }}>
            <div style={{ width: `${progressPercent}%`, height: "100%", background: "#ffffff", borderRadius: "6px", transition: "width 0.4s ease" }} />
          </div>

          <div style={{ display: "flex", gap: "24px", marginTop: "16px", fontSize: "0.875rem" }}>
            <span>⏱️ Estimated Total Time: <strong>{totalHours} Hours</strong></span>
            <span>🎯 {steps.length} Step Milestones</span>
            <span>⭐ Industry-Aligned Curriculum</span>
          </div>
        </div>

        {/* Step-by-Step Interactive Timeline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {steps.map((step, idx) => {
            const isCompleted = step.status === "completed";
            const isInProgress = step.status === "in_progress";

            return (
              <div
                key={step.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "60px 1fr auto",
                  gap: "20px",
                  padding: "24px",
                  borderRadius: "16px",
                  background: "var(--bg-card)",
                  border: isInProgress ? "2px solid var(--primary-600)" : "1px solid var(--border-color)",
                  boxShadow: isInProgress ? "0 8px 24px rgba(99, 102, 241, 0.12)" : "var(--shadow-sm)",
                  alignItems: "center"
                }}
              >
                {/* Step Number Circle */}
                <div style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: isCompleted ? "#d1fae5" : isInProgress ? "var(--primary-100)" : "var(--bg-card-hover)",
                  color: isCompleted ? "#065f46" : isInProgress ? "var(--primary-700)" : "var(--text-muted)",
                  fontSize: "1.25rem",
                  fontWeight: 700
                }}>
                  {isCompleted ? "✓" : step.stepOrder}
                </div>

                {/* Content */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                    <span style={{
                      padding: "2px 8px",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      background: step.type === "project" ? "#fce7f3" : "#e0e7ff",
                      color: step.type === "project" ? "#9d174d" : "#3730a3"
                    }}>
                      {step.type.toUpperCase()}
                    </span>
                    <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                      via {step.platform} · {step.durationHrs} hrs
                    </span>
                    {isInProgress && (
                      <span style={{ padding: "2px 8px", borderRadius: "10px", background: "#fef3c7", color: "#92400e", fontSize: "0.75rem", fontWeight: 700 }}>
                        In Progress
                      </span>
                    )}
                  </div>
                  <h3 style={{ margin: "0 0 6px 0", fontSize: "1.125rem", color: "var(--text-primary)" }}>
                    {step.title}
                  </h3>
                  <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                    {step.description}
                  </p>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
                  <button
                    onClick={() => toggleStep(step.id)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "10px",
                      border: "none",
                      background: isCompleted ? "#d1fae5" : "var(--primary-600)",
                      color: isCompleted ? "#065f46" : "#ffffff",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {isCompleted ? "Completed ✓" : isInProgress ? "Mark Done" : "Start Step"}
                  </button>
                  <a
                    href={step.courseUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: "0.8125rem", color: "var(--primary-600)", textDecoration: "none", fontWeight: 500 }}
                  >
                    Open Resource ↗
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
