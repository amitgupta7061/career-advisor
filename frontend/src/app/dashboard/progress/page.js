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

        const failed = results.find((result) => result.status === "rejected");
        if (failed) setError(failed.reason.message || "Some progress details could not be loaded.");
      } catch (err) {
        if (isCurrent) setError(err.message || "Could not load progress data.");
      } finally {
        if (isCurrent) setLoading(false);
      }
    }

    loadProgress();
    return () => { isCurrent = false; };
  }, []);

  async function toggleGoal(id) {
    const goal = goals.find((item) => item.id === id);
    if (!goal) return;
    setError("");
    try {
      const response = await api.updateGoal(id, { isCompleted: !goal.completed });
      setGoals((prev) =>
        prev.map((item) => (item.id === id ? { ...item, completed: response.data.is_completed } : item))
      );
    } catch (actionError) {
      setError(actionError.message || "Could not update this goal.");
    }
  }

  async function handleAddGoal(event) {
    event.preventDefault();
    const title = newGoalTitle.trim();
    if (!title) return;
    setError("");
    try {
      const response = await api.createGoal({ title, category: newGoalCategory });
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
  const readinessCategory = readiness?.category || "Calculating Readiness...";
  const breakdown = readiness?.breakdown || {};
  const stats = readiness?.stats || {};
  const nextSteps = readiness?.nextSteps || [];

  return (
    <div className={styles.dashboard}>
      <DashboardSidebar />

      <main className={styles.mainContent}>
        <header className={styles.topBar}>
          <div>
            <h1 className={styles.pageTitle}>Student Progress & Career Readiness 📈</h1>
            <p className={styles.pageSubtitle}>
              Continuous competency tracking, milestone progress, and multi-pillar industry readiness analytics
            </p>
          </div>
        </header>

        {error && (
          <div style={{ padding: "14px 18px", borderRadius: "12px", background: "#fee2e2", color: "#991b1b", marginBottom: "20px" }}>
            {error}
          </div>
        )}

        {loading && <p>Loading real-time career readiness analytics…</p>}

        {/* Hero Card: Overall Career Readiness Gauge */}
        <div
          style={{
            padding: "32px",
            borderRadius: "22px",
            background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
            color: "#ffffff",
            marginBottom: "32px",
            display: "grid",
            gridTemplateColumns: "180px 1fr",
            gap: "36px",
            alignItems: "center",
            boxShadow: "0 14px 32px rgba(67, 56, 202, 0.28)",
          }}
        >
          {/* Radial Circular Gauge */}
          <div
            style={{
              width: "160px",
              height: "160px",
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.12)",
              border: `7px solid ${readinessScore >= 80 ? "#10b981" : readinessScore >= 60 ? "#818cf8" : "#f59e0b"}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(6px)",
            }}
          >
            <span style={{ fontSize: "3rem", fontWeight: 900, lineHeight: "1" }}>{readinessScore}</span>
            <span style={{ fontSize: "0.8125rem", opacity: 0.85, fontWeight: 700, marginTop: "4px" }}>
              / 100 PTS
            </span>
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <h2 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800 }}>{readinessCategory}</h2>
            </div>
            <p style={{ margin: "0 0 20px 0", fontSize: "0.9375rem", opacity: 0.9, lineHeight: "1.5", maxWidth: "680px" }}>
              Weighted multi-pillar index evaluating verified technical competencies, showcase projects, resume ATS compatibility, learning roadmap velocity, and job applications.
            </p>

            {/* 5 Pillars Graphical Strip */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px" }}>
              {[
                { label: "Technical Skills (30%)", val: breakdown.skills || 0, count: `${stats.skillsCount || 0} Skills` },
                { label: "Portfolio Projects (25%)", val: breakdown.projects || 0, count: `${stats.projectsCount || 0} Projects` },
                { label: "Resume ATS (20%)", val: breakdown.resume || 0, count: `${stats.latestAtsScore ? `${stats.latestAtsScore}% ATS` : "Unscanned"}` },
                { label: "Learning Roadmaps (15%)", val: breakdown.learning || 0, count: `${stats.completedSteps || 0} Milestones` },
                { label: "Opportunities (10%)", val: breakdown.opportunities || 0, count: `${stats.applicationsCount || 0} Applied` },
              ].map((p) => (
                <div key={p.label} style={{ padding: "10px 12px", borderRadius: "12px", background: "rgba(255, 255, 255, 0.14)", border: "1px solid rgba(255, 255, 255, 0.15)" }}>
                  <span style={{ display: "block", fontSize: "0.6875rem", opacity: 0.85, fontWeight: 600 }}>
                    {p.label}
                  </span>
                  <div style={{ fontSize: "1.125rem", fontWeight: 800, margin: "2px 0" }}>{p.val}%</div>
                  <span style={{ fontSize: "0.6875rem", color: "#a5b4fc", fontWeight: 600 }}>{p.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actionable Next Steps Recommendations */}
        {nextSteps.length > 0 && (
          <div
            style={{
              padding: "20px 24px",
              borderRadius: "16px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              marginBottom: "32px",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <h3 style={{ margin: "0 0 12px 0", fontSize: "1rem", color: "var(--text-primary)" }}>
              🚀 Recommended Actions to Boost Your Career Readiness Score:
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "10px" }}>
              {nextSteps.map((step, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    background: "var(--bg-card-hover)",
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
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "28px" }}>
          {/* Milestone Goals Checklist */}
          <div style={{ padding: "24px", borderRadius: "18px", background: "var(--bg-card)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.125rem", color: "var(--text-primary)" }}>
                  🎯 Active Milestone Goals
                </h3>
                <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                  Personalized milestones to stay on schedule
                </span>
              </div>
              <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--primary-600)" }}>
                {goals.filter((g) => g.completed).length} / {goals.length} Completed
              </span>
            </div>

            <form onSubmit={handleAddGoal} style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
              <input
                type="text"
                placeholder="Add a new milestone goal (e.g. Build Docker microservice)..."
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-card-hover)",
                  color: "var(--text-primary)",
                  fontSize: "0.875rem",
                  outline: "none",
                }}
              />
              <button
                type="submit"
                style={{
                  padding: "10px 18px",
                  borderRadius: "10px",
                  border: "none",
                  background: "var(--primary-600)",
                  color: "#ffffff",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                }}
              >
                + Add Goal
              </button>
            </form>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {goals.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No milestone goals created yet.</p>
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
                      borderRadius: "12px",
                      background: g.completed ? "#f0fdf4" : "var(--bg-card-hover)",
                      border: g.completed ? "1px solid #bbf7d0" : "1px solid var(--border-color)",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
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
                        color: g.completed ? "var(--text-muted)" : "var(--text-primary)",
                        textDecoration: g.completed ? "line-through" : "none",
                      }}
                    >
                      {g.title}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {g.completed ? "Done ✓" : "Active"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Achievement Badges Showcase */}
          <div style={{ padding: "24px", borderRadius: "18px", background: "var(--bg-card)", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)" }}>
            <h3 style={{ margin: "0 0 4px 0", fontSize: "1.125rem", color: "var(--text-primary)" }}>
              🏆 Achievement Badges & Milestones
            </h3>
            <p style={{ margin: "0 0 20px 0", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
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
                    borderRadius: "14px",
                    background: b.earned ? "#f0fdf4" : "var(--bg-card-hover)",
                    border: b.earned ? "1px solid #bbf7d0" : "1px solid var(--border-color)",
                    opacity: b.earned ? 1 : 0.65,
                  }}
                >
                  <span style={{ fontSize: "2.25rem" }}>{b.icon}</span>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: "0.9375rem", color: "var(--text-primary)" }}>{b.name}</h4>
                    <p style={{ margin: "2px 0 0 0", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                      {b.desc}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      padding: "4px 10px",
                      borderRadius: "8px",
                      fontWeight: 700,
                      background: b.earned ? "#dcfce7" : "#e2e8f0",
                      color: b.earned ? "#166534" : "#64748b",
                    }}
                  >
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
