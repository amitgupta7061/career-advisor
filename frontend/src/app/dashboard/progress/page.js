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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrent = true;
    async function loadProgress() {
      const results = await Promise.allSettled([api.getReadiness(), api.getGoals(), api.getBadges()]);
      if (!isCurrent) return;
      if (results[0].status === "fulfilled") setReadiness(results[0].value.data);
      if (results[1].status === "fulfilled") {
        setGoals((results[1].value.data || []).map((goal) => ({
          id: goal.id,
          title: goal.title,
          category: goal.category,
          completed: goal.is_completed,
          targetDate: goal.target_date ? String(goal.target_date).slice(0, 10) : "No target date",
        })));
      }
      if (results[2].status === "fulfilled") {
        const { catalog = [], earned = [] } = results[2].value;
        const earnedByCode = new Map(earned.map((badge) => [badge.badge_code, badge]));
        setBadges(catalog.map((badge) => {
          const earnedBadge = earnedByCode.get(badge.code);
          return {
            code: badge.code,
            name: badge.name,
            icon: badge.icon,
            desc: badge.description,
            earned: Boolean(earnedBadge),
            date: earnedBadge?.earned_at ? new Date(earnedBadge.earned_at).toLocaleDateString() : "Locked",
          };
        }));
      }
      const failed = results.find((result) => result.status === "rejected");
      if (failed) setError(failed.reason.message || "Some progress details could not be loaded.");
      setLoading(false);
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
      setGoals((prev) => prev.map((item) => item.id === id ? { ...item, completed: response.data.is_completed } : item));
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
      const response = await api.createGoal({ title, category: "learning" });
      const goal = response.data;
      setGoals((prev) => [...prev, { id: goal.id, title: goal.title, category: goal.category, completed: goal.is_completed, targetDate: "No target date" }]);
      setNewGoalTitle("");
    } catch (actionError) {
      setError(actionError.message || "Could not create this goal.");
    }
  }

  const readinessScore = readiness?.overallScore ?? 0;
  const readinessCategory = readiness?.category || "Loading readiness";
  const breakdown = readiness?.breakdown || {};
  return (
    <div className={styles.dashboard}>
      <DashboardSidebar />

      <main className={styles.mainContent}>
        <header className={styles.topBar}>
          <div>
            <h1 className={styles.pageTitle}>Career Readiness & Milestones 📈</h1>
            <p className={styles.pageSubtitle}>Real-time analytics on your industry readiness and milestone achievements</p>
          </div>
        </header>

        {error && <p role="alert" style={{ color: "#b91c1c", marginBottom: "16px" }}>{error}</p>}
        {loading && <p>Loading your progress…</p>}

        {/* Readiness Score Card */}
        <div style={{
          padding: "28px",
          borderRadius: "20px",
          background: "linear-gradient(135deg, #312e81, #4338ca)",
          color: "#ffffff",
          marginBottom: "28px",
          display: "grid",
          gridTemplateColumns: "180px 1fr",
          gap: "28px",
          alignItems: "center",
          boxShadow: "0 12px 28px rgba(67, 56, 202, 0.25)"
        }}>
          <div style={{
            width: "150px",
            height: "150px",
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.12)",
            border: "6px solid #818cf8",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <span style={{ fontSize: "2.75rem", fontWeight: 800 }}>{readinessScore}</span>
            <span style={{ fontSize: "0.8125rem", opacity: 0.85, fontWeight: 600 }}>/ 100</span>
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <h2 style={{ margin: 0, fontSize: "1.5rem" }}>{readinessCategory}</h2>
            </div>
            <p style={{ margin: "0 0 18px 0", fontSize: "0.9375rem", opacity: 0.9, lineHeight: "1.5" }}>
              Your readiness score is calculated from your profile, resume, learning progress, and applications.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px" }}>
              {[
                { label: "Technical Skills", val: breakdown.skills || 0 },
                { label: "Practical Projects", val: breakdown.projects || 0 },
                { label: "Resume ATS", val: breakdown.resume || 0 },
                { label: "Learning Path", val: breakdown.learning || 0 },
              ].map((p) => (
                <div key={p.label} style={{ padding: "8px 12px", borderRadius: "10px", background: "rgba(255, 255, 255, 0.15)" }}>
                  <span style={{ fontSize: "0.75rem", opacity: 0.85 }}>{p.label}</span>
                  <div style={{ fontSize: "1rem", fontWeight: 700 }}>{p.val}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Goals Checklist & Badges Showcase */}
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "28px" }}>
          {/* Weekly Goals Checklist */}
          <div style={{ padding: "24px", borderRadius: "16px", background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <h3 style={{ margin: "0 0 6px 0", fontSize: "1.125rem", color: "var(--text-primary)" }}>🎯 Active Milestone Goals</h3>
            <p style={{ margin: "0 0 20px 0", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              Weekly objectives to accelerate your career preparation
            </p>

            <form onSubmit={handleAddGoal} style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
              <input
                type="text"
                placeholder="Add a new career goal..."
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
                  outline: "none"
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
                  cursor: "pointer"
                }}
              >
                + Add
              </button>
            </form>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {goals.map((g) => (
                <div
                  key={g.id}

                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    background: g.completed ? "#f0fdf4" : "var(--bg-card-hover)",
                    border: g.completed ? "1px solid #bbf7d0" : "1px solid var(--border-color)",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  <input
                    type="checkbox"
                    checked={g.completed}
                    onChange={() => toggleGoal(g.id)}
                    style={{ width: "18px", height: "18px", accentColor: "var(--primary-600)", cursor: "pointer" }}
                  />
                  <span style={{
                    flex: 1,
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: g.completed ? "var(--text-muted)" : "var(--text-primary)",
                    textDecoration: g.completed ? "line-through" : "none"
                  }}>
                    {g.title}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{g.targetDate}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Achievement Badges Showcase */}
          <div style={{ padding: "24px", borderRadius: "16px", background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <h3 style={{ margin: "0 0 6px 0", fontSize: "1.125rem", color: "var(--text-primary)" }}>🏆 Achievement Badges</h3>
            <p style={{ margin: "0 0 20px 0", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              Milestones unlocked through continuous preparation
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px" }}>
              {badges.map((b) => (
                <div
                  key={b.code}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    background: b.earned ? "var(--bg-card-hover)" : "rgba(0,0,0,0.02)",
                    border: "1px solid var(--border-color)",
                    opacity: b.earned ? 1 : 0.6
                  }}
                >
                  <span style={{ fontSize: "2rem" }}>{b.icon}</span>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: "0.9375rem", color: "var(--text-primary)" }}>{b.name}</h4>
                    <p style={{ margin: "2px 0 0 0", fontSize: "0.8125rem", color: "var(--text-muted)" }}>{b.desc}</p>
                  </div>
                  <span style={{
                    fontSize: "0.75rem",
                    padding: "3px 8px",
                    borderRadius: "8px",
                    fontWeight: 600,
                    background: b.earned ? "#d1fae5" : "#e5e7eb",
                    color: b.earned ? "#065f46" : "#4b5563"
                  }}>
                    {b.date}
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
