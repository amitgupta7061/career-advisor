"use client";
import { useState } from "react";
import styles from "../dashboard.module.css";
import DashboardSidebar from "@/components/DashboardSidebar/DashboardSidebar";

const INITIAL_GOALS = [
  { id: 1, title: "Complete PyTorch Neural Network module", category: "learning", completed: true, targetDate: "Oct 22" },
  { id: 2, title: "Add Docker containerization to portfolio project", category: "projects", completed: false, targetDate: "Oct 25" },
  { id: 3, title: "Apply to Flipkart SDE Internship", category: "opportunities", completed: true, targetDate: "Oct 20" },
  { id: 4, title: "Achieve ATS score > 85 on full-stack resume", category: "resume", completed: false, targetDate: "Oct 28" },
];

const BADGES = [
  { code: "SKILL_EXPLORER", name: "Skill Explorer", icon: "🎯", desc: "Added 5+ verified technical skills", earned: true, date: "Oct 12" },
  { code: "ATS_PRO", name: "ATS 75+ Club", icon: "📄", desc: "Achieved an ATS score of 84", earned: true, date: "Oct 15" },
  { code: "FAST_LEARNER", name: "Fast Learner", icon: "⚡", desc: "Completed 2 roadmap milestones", earned: true, date: "Oct 18" },
  { code: "OPPORTUNITY_HUNTER", name: "Opportunity Hunter", icon: "💼", desc: "Submitted first internship application", earned: true, date: "Oct 19" },
  { code: "CAREER_READY", name: "Career Ready Master", icon: "🏆", desc: "Attain overall readiness >= 85", earned: false, date: "Locked" },
];

export default function ProgressPage() {
  const [goals, setGoals] = useState(INITIAL_GOALS);
  const [newGoalTitle, setNewGoalTitle] = useState("");

  const toggleGoal = (id) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g))
    );
  };

  const handleAddGoal = (e) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;
    setGoals((prev) => [
      ...prev,
      {
        id: Date.now(),
        title: newGoalTitle,
        category: "learning",
        completed: false,
        targetDate: "This Week",
      },
    ]);
    setNewGoalTitle("");
  };

  const readinessScore = 78;

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
              <h2 style={{ margin: 0, fontSize: "1.5rem" }}>Proficient &amp; Highly Competitive ⚡</h2>
            </div>
            <p style={{ margin: "0 0 18px 0", fontSize: "0.9375rem", opacity: 0.9, lineHeight: "1.5" }}>
              You are among the top 15% of engineering candidates. Completing your pending containerization module and adding 1 more live project will elevate you to <strong>Industry Ready (85+)</strong> status!
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px" }}>
              {[
                { label: "Technical Skills", val: 80 },
                { label: "Practical Projects", val: 75 },
                { label: "Resume ATS", val: 84 },
                { label: "Learning Path", val: 68 },
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
                  onClick={() => toggleGoal(g.id)}
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
                    onChange={() => {}}
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
              {BADGES.map((b) => (
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
