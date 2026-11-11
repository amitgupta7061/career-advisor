"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./dashboard.module.css";
import DashboardSidebar from "@/components/DashboardSidebar/DashboardSidebar";
import { api } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    roleCount: 0,
    skillGaps: [],
    recommendations: [],
    opportunitiesCount: 0,
    resumeScore: null,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");
      if (!token) {
        router.push("/login?message=Please log in or create an account first to access your personalized dashboard.");
        return;
      }
      try {
        if (storedUser) setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }
  }, [router]);

  useEffect(() => {
    let isCurrent = true;
    async function loadDashboardData() {
      setLoading(true);
      try {
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
      } finally {
        if (isCurrent) setLoading(false);
      }
    }
    loadDashboardData();
    return () => { isCurrent = false; };
  }, []);

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // Clear local session even when network unreachable
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/login?message=You have been logged out successfully.");
    }
  };

  const displayName = user?.firstName ? `${user.firstName}` : "Student";
  const fullName = user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "Student";
  const initials = user?.firstName
    ? `${user.firstName[0]}${user?.lastName ? user.lastName[0] : ""}`.toUpperCase()
    : "PF";

  return (
    <div className={styles.dashboard}>
      <DashboardSidebar />

      <main className={styles.mainContent}>
        <header className={styles.topBar}>
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>Welcome back, {displayName}! 👋</h1>
            <p className={styles.pageSubtitle}>
              Here is your unified AI career progress, skill gaps, and active recommendations
            </p>
          </div>
          <div className={styles.topBarActions}>
            <div className={styles.userBadge}>
              <div className={styles.avatar}>{initials}</div>
              <span className={styles.userName}>{fullName}</span>
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-outline btn-sm"
              title="Log out of your account"
            >
              Log Out ↪
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <section className={styles.statsGrid} aria-label="Key Dashboard Metrics">
          <Link href="/dashboard/careers" className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, #eef2ff, #e0e7ff)" }}>🎯</div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{loading ? "…" : dashboardData.roleCount}</span>
              <span className={styles.statLabel}>Target Career Paths</span>
            </div>
          </Link>
          <Link href="/dashboard/roadmap" className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, #fef3c7, #fde68a)" }}>📊</div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{loading ? "…" : dashboardData.skillGaps.length}</span>
              <span className={styles.statLabel}>Skill Gaps to Close</span>
            </div>
          </Link>
          <Link href="/dashboard/resume" className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, #d1fae5, #a7f3d0)" }}>📄</div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>
                {loading ? "…" : dashboardData.resumeScore === null ? "—" : `${dashboardData.resumeScore}%`}
              </span>
              <span className={styles.statLabel}>Resume ATS Score</span>
            </div>
          </Link>
          <Link href="/dashboard/opportunities" className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, #fce7f3, #fbcfe8)" }}>💼</div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{loading ? "…" : dashboardData.opportunitiesCount}</span>
              <span className={styles.statLabel}>Live Opportunities</span>
            </div>
          </Link>
        </section>

        {/* Content Grid */}
        <section className={styles.contentGrid}>
          {/* Career Recommendations Card */}
          <div className={styles.contentCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Top Career Recommendations</h2>
              <Link href="/dashboard/careers" className={styles.cardActionLink}>
                Explore All →
              </Link>
            </div>
            <div className={styles.careerList}>
              {dashboardData.recommendations.length > 0 ? (
                dashboardData.recommendations.slice(0, 3).map((rec) => (
                  <Link
                    key={rec.roleId || rec.title}
                    href="/dashboard/careers"
                    className={styles.careerItem}
                  >
                    <span className={styles.careerEmoji}>🎯</span>
                    <div className={styles.careerInfo}>
                      <h3>{rec.title}</h3>
                      <p>{rec.matchScore}% Match · {rec.demandLevel || "In Demand"}</p>
                    </div>
                    <span className={styles.careerScoreBadge}>{rec.matchScore}%</span>
                  </Link>
                ))
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyStateIcon}>💡</div>
                  <h3 className={styles.emptyStateTitle}>No Career Recommendations Yet</h3>
                  <p className={styles.emptyStateText}>
                    Add your technical skills and academics to your student profile to generate personalized AI recommendations.
                  </p>
                  <Link href="/dashboard/profile" className="btn btn-primary btn-sm">
                    Complete Student Profile
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Critical Skill Gaps Card */}
          <div className={styles.contentCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Critical Skill Gaps</h2>
              <Link href="/dashboard/roadmap" className={styles.cardActionLink}>
                Generate Roadmap →
              </Link>
            </div>
            <div className={styles.skillList}>
              {dashboardData.skillGaps.length > 0 ? (
                dashboardData.skillGaps.slice(0, 5).map((gap, i) => {
                  const priority = (gap.priority || "medium").toLowerCase();
                  const badgeClass =
                    priority === "critical" || priority === "high"
                      ? "badge-danger"
                      : priority === "medium"
                      ? "badge-warning"
                      : "badge-success";

                  return (
                    <div key={gap.id || i} className={styles.skillItem}>
                      <span className={styles.skillName}>{gap.skill_name}</span>
                      <span className={`badge ${badgeClass}`}>
                        {priority}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyStateIcon}>🎯</div>
                  <h3 className={styles.emptyStateTitle}>All Skill Gaps Clear</h3>
                  <p className={styles.emptyStateText}>
                    Select a target career path to analyze competency benchmarks and uncover learning priorities.
                  </p>
                  <Link href="/dashboard/careers" className="btn btn-secondary btn-sm">
                    Explore Career Roles
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
