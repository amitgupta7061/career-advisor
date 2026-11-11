"use client";
import { useEffect, useState } from "react";
import styles from "../dashboard.module.css";
import DashboardSidebar from "@/components/DashboardSidebar/DashboardSidebar";
import { api } from "@/lib/api";

export default function ProgressPage() {
  const [readiness, setReadiness] = useState(null);
  const [goals, setGoals] = useState([]);
  const [badges, setBadges] = useState([]);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalCategory, setNewGoalCategory] = useState("learning");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrent = true;
    async function loadProgress() {
      try {
        setLoading(true);
        const results = await Promise.allSettled([
          api.getReadiness(),
          api.getGoals(),
          api.getBadges(),
        ]);

        if (!isCurrent) return;

        if (results[0].status === "fulfilled" && results[0].value.data) {
          setReadiness(results[0].value.data);
        }

        if (results[1].status === "fulfilled") {
          setGoals(
            (results[1].value.data || []).map((goal) => ({
              id: goal.id,
              title: goal.title,
              category: goal.category,
              completed: goal.is_completed,
              targetDate: goal.target_date ? String(goal.target_date).slice(0, 10) : null,
            }))
          );
        }

        if (results[2].status === "fulfilled") {
          const { catalog = [], earned = [] } = results[2].value;
          const earnedByCode = new Map(earned.map((badge) => [badge.badge_code, badge]));
          setBadges(
            catalog.map((badge) => {
              const earnedBadge = earnedByCode.get(badge.code);
              return {
                code: badge.code,
                name: badge.name,
                icon: badge.icon,
                desc: badge.description,
                earned: Boolean(earnedBadge),
                date: earnedBadge?.earned_at
                  ? new Date(earnedBadge.earned_at).toLocaleDateString()
                  : "Locked",
              };
            })
          );
        }
      } catch (err) {
        if (isCurrent) setError(err.message || "Could not load progress data.");
      } finally {
        if (isCurrent) setLoading(false);
      }
    }
    loadProgress();
    return () => { isCurrent = false; };
  }, []);

  async function toggleGoal(goalId) {
    const goal = goals.find((item) => item.id === goalId);
    if (!goal) return;

    try {
      const updated = await api.updateGoal(goalId, {
        is_completed: !goal.completed,
      });

      setGoals((prev) =>
        prev.map((item) =>
          item.id === goalId
            ? { ...item, completed: updated.data?.is_completed ?? !goal.completed }
            : item
        )
      );

      // Refresh readiness index
      const readRes = await api.getReadiness();
      if (readRes.success && readRes.data) {
        setReadiness(readRes.data);
      }
    } catch (actionError) {
      setError(actionError.message || "Could not update goal status.");
    }
  }

  async function handleAddGoal(e) {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    try {
      const response = await api.createGoal({
        title: newGoalTitle.trim(),
        category: newGoalCategory,
      });

      const goal = response.data;
      setGoals((prev) => [
        ...prev,
        {
          id: goal.id,
          title: goal.title,
          category: goal.category,
          completed: goal.is_completed,
          targetDate: null,
        },
      ]);
      setNewGoalTitle("");
    } catch (actionError) {
      setError(actionError.message || "Could not create this goal.");
    }
  }

  const readinessScore = readiness?.overallScore ?? 0;
  const readinessCategory = readiness?.category || "Calculating Readiness…";
  const breakdown = readiness?.breakdown || {};
  const stats = readiness?.stats || {};
  const nextSteps = readiness?.nextSteps || [];

  return (
    <div className={styles.dashboard}>
      <DashboardSidebar />

      <main className={styles.mainContent}>
        <header className={styles.topBar}>
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>Student Progress & Career Readiness 📈</h1>
            <p className={styles.pageSubtitle}>
              Continuous competency tracking, milestone progress, and multi-pillar industry readiness analytics
            </p>
          </div>
        </header>

        {error && (
          <div style={{ padding: "14px 18px", borderRadius: "var(--radius-md)", background: "var(--danger-50)", color: "var(--danger-600)", border: "1px solid var(--danger-200)", marginBottom: "20px", fontSize: "0.875rem" }}>
            ⚠️ {error}
          </div>
        )}

        {loading && (
          <div className="card" style={{ padding: "28px", textAlign: "center", marginBottom: "24px" }}>
            <span className="spinner" style={{ color: "var(--primary-600)", marginBottom: "8px" }} />
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>Loading real-time career readiness analytics…</p>
          </div>
        )}

        {/* Hero Card: Overall Career Readiness Gauge */}
        <div
          style={{
            padding: "32px",
            borderRadius: "var(--radius-2xl)",
            background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
            color: "#ffffff",
            marginBottom: "32px",
            boxShadow: "0 14px 32px rgba(67, 56, 202, 0.25)",
          }}
        >
          <div className={styles.heroGaugeLayout}>
            {/* Radial Circular Gauge */}
            <div
              style={{
                width: "150px",
                height: "150px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.12)",
                border: `7px solid ${readinessScore >= 80 ? "var(--success-400)" : readinessScore >= 60 ? "var(--primary-300)" : "var(--warning-400)"}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(6px)",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: "2.75rem", fontWeight: 900, lineHeight: 1 }}>{readinessScore}</span>
              <span style={{ fontSize: "0.8125rem", opacity: 0.85, fontWeight: 700, marginTop: "4px" }}>
                / 100 PTS
              </span>
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px", flexWrap: "wrap" }}>
                <h2 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800 }}>{readinessCategory}</h2>
              </div>
              <p style={{ margin: "0 0 20px 0", fontSize: "0.9375rem", opacity: 0.9, lineHeight: "1.5", maxWidth: "680px" }}>
                Weighted multi-pillar index evaluating verified technical competencies, showcase projects, resume ATS compatibility, learning roadmap velocity, and job applications.
              </p>

              {/* 5 Pillars Graphical Strip */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
                {[
                  { label: "Technical Skills (30%)", val: breakdown.skills || 0, count: `${stats.skillsCount || 0} Skills` },
                  { label: "Portfolio Projects (25%)", val: breakdown.projects || 0, count: `${stats.projectsCount || 0} Projects` },
                  { label: "Resume ATS (20%)", val: breakdown.resume || 0, count: `${stats.latestAtsScore ? `${stats.latestAtsScore}% ATS` : "Unscanned"}` },
                  { label: "Learning Roadmaps (15%)", val: breakdown.learning || 0, count: `${stats.completedSteps || 0} Milestones` },
                  { label: "Opportunities (10%)", val: breakdown.opportunities || 0, count: `${stats.applicationsCount || 0} Applied` },
                ].map((p) => (
                  <div key={p.label} style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: "rgba(255, 255, 255, 0.14)", border: "1px solid rgba(255, 255, 255, 0.16)" }}>
                    <span style={{ display: "block", fontSize: "0.6875rem", opacity: 0.85, fontWeight: 600 }}>
                      {p.label}
                    </span>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "4px" }}>
                      <span style={{ fontSize: "1.125rem", fontWeight: 800 }}>{p.val} pts</span>
                      <span style={{ fontSize: "0.6875rem", opacity: 0.8 }}>{p.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* AI Action Items Banner */}
        {nextSteps.length > 0 && (
          <div className="card" style={{ padding: "20px", marginBottom: "28px" }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "1rem", color: "var(--text-primary)", fontWeight: 700 }}>
              🚀 Recommended Actions to Boost Your Career Readiness Score:
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "10px" }}>
              {nextSteps.map((step, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-md)",
                    background: "var(--surface-secondary)",
                    border: "1px solid var(--border-light)",
                    fontSize: "0.8125rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  <span style={{ color: "var(--primary-600)", fontWeight: 700 }}>→</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Goals Checklist & Badges Showcase */}
        <div className={styles.twoColLayout}>
          {/* Milestone Goals Checklist */}
          <div className="card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.125rem", color: "var(--text-primary)", fontWeight: 700 }}>
                  🎯 Active Milestone Goals
                </h3>
                <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                  Personalized milestones to stay on schedule
                </span>
              </div>
              <span className="badge badge-primary">
                {goals.filter((g) => g.completed).length} / {goals.length} Completed
              </span>
            </div>

            <form onSubmit={handleAddGoal} style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="Add a new milestone goal (e.g. Build Docker microservice)..."
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                className="input-field"
                style={{ flex: 1, minWidth: "220px" }}
              />
              <select
                value={newGoalCategory}
                onChange={(e) => setNewGoalCategory(e.target.value)}
                className="input-field"
                style={{ width: "auto" }}
              >
                <option value="learning">Learning</option>
                <option value="project">Project</option>
                <option value="resume">Resume</option>
                <option value="networking">Networking</option>
              </select>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
              >
                + Add Goal
              </button>
            </form>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {goals.length === 0 ? (
                <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>No milestone goals created yet.</p>
              ) : (
                goals.map((g) => (
                  <div
                    key={g.id}
                    onClick={() => toggleGoal(g.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      padding: "12px 16px",
                      borderRadius: "var(--radius-md)",
                      background: g.completed ? "var(--success-50)" : "var(--surface-secondary)",
                      border: g.completed ? "1px solid var(--success-200)" : "1px solid var(--border-light)",
                      cursor: "pointer",
                      transition: "all var(--transition-fast)",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={g.completed}
                      onChange={() => toggleGoal(g.id)}
                      style={{ width: "18px", height: "18px", accentColor: "var(--primary-600)", cursor: "pointer" }}
                    />
                    <span
                      style={{
                        flex: 1,
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: g.completed ? "var(--text-secondary)" : "var(--text-primary)",
                        textDecoration: g.completed ? "line-through" : "none",
                      }}
                    >
                      {g.title}
                    </span>
                    <span className={`badge ${g.completed ? "badge-success" : "badge-neutral"}`}>
                      {g.completed ? "Done ✓" : "Active"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Achievement Badges Showcase */}
          <div className="card" style={{ padding: "24px" }}>
            <h3 style={{ margin: "0 0 4px 0", fontSize: "1.125rem", color: "var(--text-primary)", fontWeight: 700 }}>
              🏆 Achievement Badges & Milestones
            </h3>
            <p style={{ margin: "0 0 20px 0", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
              Unlocked through profile completeness and learning activities
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {badges.map((b) => (
                <div
                  key={b.code}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "12px 16px",
                    borderRadius: "var(--radius-lg)",
                    background: b.earned ? "var(--success-50)" : "var(--surface-secondary)",
                    border: b.earned ? "1px solid var(--success-200)" : "1px solid var(--border-light)",
                    opacity: b.earned ? 1 : 0.65,
                  }}
                >
                  <span style={{ fontSize: "2.25rem", lineHeight: 1 }}>{b.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ margin: 0, fontSize: "0.9375rem", color: "var(--text-primary)", fontWeight: 700 }}>{b.name}</h4>
                    <p style={{ margin: "2px 0 0 0", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                      {b.desc}
                    </p>
                  </div>
                  <span className={`badge ${b.earned ? "badge-success" : "badge-neutral"}`}>
                    {b.earned ? "Unlocked ✓" : "Locked"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
