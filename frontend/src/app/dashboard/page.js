"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./dashboard.module.css";
import DashboardSidebar from "@/components/DashboardSidebar/DashboardSidebar";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (!token) {
        router.push("/login?message=Please log in or create an account first to access your personalized dashboard.");
        return;
      }

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Failed to parse stored user", e);
        }
      }
    }
  }, [router]);

  const handleLogout = () => {
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
              <span className={styles.statValue}>10</span>
              <span className={styles.statLabel}>Target Career Paths</span>
            </div>
          </Link>
          <Link href="/dashboard/roadmap" className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, #fef3c7, #fde68a)" }}>📊</div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>5</span>
              <span className={styles.statLabel}>Skill Gaps to Close</span>
            </div>
          </Link>
          <Link href="/dashboard/resume" className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, #d1fae5, #a7f3d0)" }}>📄</div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>82%</span>
              <span className={styles.statLabel}>Resume ATS Score</span>
            </div>
          </Link>
          <Link href="/dashboard/opportunities" className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, #fce7f3, #fbcfe8)" }}>💼</div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>8+</span>
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
              <Link href="/dashboard/careers" className={styles.careerItem} style={{ textDecoration: "none" }}>
                <span className={styles.careerEmoji}>🤖</span>
                <div className={styles.careerInfo}>
                  <h3>AI / Machine Learning Engineer</h3>
                  <p>94% match · 14 - 35 LPA · High Demand</p>
                </div>
                <span className={styles.careerScore}>94%</span>
              </Link>
              <Link href="/dashboard/careers" className={styles.careerItem} style={{ textDecoration: "none" }}>
                <span className={styles.careerEmoji}>🌐</span>
                <div className={styles.careerInfo}>
                  <h3>Full Stack Developer</h3>
                  <p>89% match · 8 - 25 LPA · 12k+ Openings</p>
                </div>
                <span className={styles.careerScore}>89%</span>
              </Link>
              <Link href="/dashboard/careers" className={styles.careerItem} style={{ textDecoration: "none" }}>
                <span className={styles.careerEmoji}>☁️</span>
                <div className={styles.careerInfo}>
                  <h3>Cloud & DevOps Engineer</h3>
                  <p>82% match · 10 - 28 LPA · Rapid Growth</p>
                </div>
                <span className={styles.careerScore}>82%</span>
              </Link>
            </div>
          </div>

          <div className={styles.contentCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 className={styles.cardTitle} style={{ margin: 0 }}>Critical Skill Gaps</h2>
              <Link href="/dashboard/roadmap" style={{ fontSize: "0.875rem", color: "var(--primary-600)", fontWeight: 600, textDecoration: "none" }}>Start Learning →</Link>
            </div>
            <div className={styles.skillList}>
              {[
                { name: "Docker & Kubernetes", priority: "Critical", color: "#ef4444" },
                { name: "System Design & Microservices", priority: "High", color: "#ef4444" },
                { name: "PostgreSQL & Indexing", priority: "Medium", color: "#f59e0b" },
                { name: "TypeScript & Next.js", priority: "Medium", color: "#f59e0b" },
                { name: "CI/CD & GitHub Actions", priority: "Low", color: "#10b981" },
              ].map((skill, i) => (
                <div key={i} className={styles.skillItem}>
                  <span className={styles.skillName}>{skill.name}</span>
                  <span className={styles.skillPriority} style={{ color: skill.color }}>{skill.priority}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
