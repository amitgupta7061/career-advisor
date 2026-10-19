"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./dashboard.module.css";
import DashboardSidebar from "@/components/DashboardSidebar/DashboardSidebar";
import { api } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [user] = useState(() => { try { return typeof window === "undefined" ? null : JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; } });
  const [dashboardData, setDashboardData] = useState({ roleCount: 0, skillGaps: [], recommendations: [], opportunitiesCount: 0, resumeScore: null });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (!token) {
        router.push("/login?message=Please log in or create an account first to access your personalized dashboard.");
        return;
      }
    }
  }, [router]);

  useEffect(() => {
    let isCurrent = true;
    async function loadDashboardData() {
      const results = await Promise.allSettled([
        api.getCareerRoles(),
        api.getRecommendations({}),
        api.getSkillGaps(),
        api.getOpportunities(),
        api.getResumeHistory(),
      ]);
      if (!isCurrent) return;
      setDashboardData({
        roleCount: results[0].status === "fulfilled" ? (results[0].value.data || []).length : 0,
        recommendations: results[1].status === "fulfilled" ? results[1].value.data?.recommendations || [] : [],
        skillGaps: results[2].status === "fulfilled" ? results[2].value.data || [] : [],
        opportunitiesCount: results[3].status === "fulfilled" ? results[3].value.count || 0 : 0,
        resumeScore: results[4].status === "fulfilled" ? results[4].value.data?.[0]?.ats_score ?? null : null,
      });
    }
    loadDashboardData();
    return () => { isCurrent = false; };
  }, []);

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // Clear the local session even when the gateway is unavailable.
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/login?message=You have been logged out successfully.");
    }
  };

  const displayName = user?.firstName ? `${user.firstName}` : "Student";
  const initials = user?.firstName ? `${user.firstName[0]}${user?.lastName ? user.lastName[0] : ""}`.toUpperCase() : "PF";

  return (
    <div className={styles.dashboard}>
      <DashboardSidebar />

      <main className={styles.mainContent}>
        <header className={styles.topBar}>
          <div>
            <h1 className={styles.pageTitle}>Welcome back, {displayName}! 👋</h1>
            <p className={styles.pageSubtitle}>Here&apos;s your unified AI career and learning progress</p>
          </div>
          <div className={styles.topBarActions} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={handleLogout}
              style={{
                padding: "8px 14px",
                borderRadius: "10px",
                border: "1px solid var(--border-color)",
                background: "var(--bg-card)",
                color: "var(--text-secondary)",
                fontSize: "0.8125rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              Log Out ↪
            </button>
            <div className={styles.avatar}>{initials}</div>
          </div>
        </header>

        <div className={styles.statsGrid}>
          <Link href="/dashboard/careers" className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, #eef2ff, #e0e7ff)" }}>🎯</div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{dashboardData.roleCount}</span>
              <span className={styles.statLabel}>Target Career Paths</span>
            </div>
          </Link>
          <Link href="/dashboard/roadmap" className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, #fef3c7, #fde68a)" }}>📊</div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{dashboardData.skillGaps.length}</span>
              <span className={styles.statLabel}>Skill Gaps to Close</span>
            </div>
          </Link>
          <Link href="/dashboard/resume" className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, #d1fae5, #a7f3d0)" }}>📄</div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{dashboardData.resumeScore === null ? "—" : `${dashboardData.resumeScore}%`}</span>
              <span className={styles.statLabel}>Resume ATS Score</span>
            </div>
          </Link>
          <Link href="/dashboard/opportunities" className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, #fce7f3, #fbcfe8)" }}>💼</div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{dashboardData.opportunitiesCount}</span>
              <span className={styles.statLabel}>Live Opportunities</span>
            </div>
          </Link>
        </div>

        <div className={styles.contentGrid}>
          <div className={styles.contentCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 className={styles.cardTitle} style={{ margin: 0 }}>Top Career Recommendations</h2>
              <Link href="/dashboard/careers" style={{ fontSize: "0.875rem", color: "var(--primary-600)", fontWeight: 600, textDecoration: "none" }}>View All →</Link>
            </div>
                        <div className={styles.careerList}>
              {dashboardData.recommendations.slice(0, 3).map((recommendation) => (
                <Link key={recommendation.roleId} href="/dashboard/careers" className={styles.careerItem} style={{ textDecoration: "none" }}>
                  <span className={styles.careerEmoji}>🎯</span>
                  <div className={styles.careerInfo}>
                    <h3>{recommendation.title}</h3>
                    <p>{recommendation.matchScore}% match · {recommendation.demandLevel || "Demand not listed"}</p>
                  </div>
                  <span className={styles.careerScore}>{recommendation.matchScore}%</span>
                </Link>
              ))}
              {dashboardData.recommendations.length === 0 && <p>Add skills to your profile to see career recommendations.</p>}
            </div>
          </div>

          <div className={styles.contentCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 className={styles.cardTitle} style={{ margin: 0 }}>Critical Skill Gaps</h2>
              <Link href="/dashboard/roadmap" style={{ fontSize: "0.875rem", color: "var(--primary-600)", fontWeight: 600, textDecoration: "none" }}>Start Learning →</Link>
            </div>
            <div className={styles.skillList}>
              {dashboardData.skillGaps.slice(0, 5).map((gap, i) => {
                const priority = gap.priority || "medium";
                const color = priority === "critical" || priority === "high" ? "#ef4444" : priority === "medium" ? "#f59e0b" : "#10b981";
                return (
                <div key={i} className={styles.skillItem}>
                  <span className={styles.skillName}>{gap.skill_name}</span>
                  <span className={styles.skillPriority} style={{ color }}>{priority}</span>
                </div>
                ); })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
