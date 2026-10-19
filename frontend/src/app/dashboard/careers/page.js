"use client";
import { useState } from "react";
import Link from "next/link";
import styles from "../dashboard.module.css";
import DashboardSidebar from "@/components/DashboardSidebar/DashboardSidebar";

const SAMPLE_CAREERS = [
  {
    id: 1,
    title: "AI / Machine Learning Engineer",
    domain: "Artificial Intelligence",
    icon: "🤖",
    matchScore: 94,
    salary: "₹14 - 35 LPA",
    growth: "+45% YoY",
    description: "Design, build, and deploy production machine learning pipelines, fine-tuned LLMs, and intelligent automation systems.",
    requiredSkills: ["Python", "PyTorch", "Machine Learning", "Mathematics", "Docker", "FastAPI"],
    userHas: ["Python", "Machine Learning", "FastAPI"],
    missing: ["PyTorch", "Docker", "Mathematics"],
  },
  {
    id: 2,
    title: "Full Stack Developer",
    domain: "Software Engineering",
    icon: "🌐",
    matchScore: 89,
    salary: "₹8 - 25 LPA",
    growth: "+28% YoY",
    description: "Engineer resilient web architectures from responsive Next.js user interfaces to distributed microservice backends.",
    requiredSkills: ["JavaScript", "React", "Node.js", "PostgreSQL", "System Design", "Docker"],
    userHas: ["JavaScript", "React", "Node.js", "PostgreSQL"],
    missing: ["System Design", "Docker"],
  },
  {
    id: 3,
    title: "Cloud & DevOps Engineer",
    domain: "Infrastructure & Cloud",
    icon: "☁️",
    matchScore: 82,
    salary: "₹10 - 28 LPA",
    growth: "+38% YoY",
    description: "Architect automated CI/CD deployment pipelines, container orchestration with Kubernetes, and high-availability AWS cloud topology.",
    requiredSkills: ["AWS", "Docker", "Kubernetes", "Linux", "CI/CD", "Terraform"],
    userHas: ["Linux", "Docker", "CI/CD"],
    missing: ["AWS", "Kubernetes", "Terraform"],
  },
  {
    id: 4,
    title: "Data Scientist",
    domain: "Data & Analytics",
    icon: "📊",
    matchScore: 78,
    salary: "₹10 - 26 LPA",
    growth: "+32% YoY",
    description: "Derive strategic business insights through statistical modeling, predictive analytics, and enterprise data visualization.",
    requiredSkills: ["Python", "SQL", "Pandas", "Statistics", "Machine Learning", "Tableau"],
    userHas: ["Python", "SQL", "Pandas"],
    missing: ["Statistics", "Machine Learning", "Tableau"],
  },
  {
    id: 5,
    title: "Cyber Security Analyst",
    domain: "Information Security",
    icon: "🛡️",
    matchScore: 68,
    salary: "₹9 - 24 LPA",
    growth: "+35% YoY",
    description: "Protect enterprise digital assets through vulnerability assessments, penetration testing, and security incident response.",
    requiredSkills: ["Network Security", "Linux", "Python", "Wireshark", "OWASP", "SIEM"],
    userHas: ["Linux", "Python"],
    missing: ["Network Security", "Wireshark", "OWASP", "SIEM"],
  },
];

export default function CareersPage() {
  const [selectedDomain, setSelectedDomain] = useState("All");
  const [search, setSearch] = useState("");
  const [activeRole, setActiveRole] = useState(SAMPLE_CAREERS[0]);

  const domains = ["All", "Software Engineering", "Artificial Intelligence", "Infrastructure & Cloud", "Data & Analytics", "Information Security"];

  const filtered = SAMPLE_CAREERS.filter((c) => {
    const matchesDomain = selectedDomain === "All" || c.domain === selectedDomain;
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase());
    return matchesDomain && matchesSearch;
  });

  return (
    <div className={styles.dashboard}>
      <DashboardSidebar />

      <main className={styles.mainContent}>
        <header className={styles.topBar}>
          <div>
            <h1 className={styles.pageTitle}>Career Paths & Skill Gap Analysis 🧭</h1>
            <p className={styles.pageSubtitle}>Explore high-growth career roles tailored to your current skills and interests</p>
          </div>
        </header>

        {/* Filter Bar */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Search roles or technologies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: "1",
              minWidth: "260px",
              padding: "12px 16px",
              borderRadius: "12px",
              border: "1px solid var(--border-color)",
              background: "var(--bg-card)",
              color: "var(--text-primary)",
              fontSize: "0.9375rem",
              outline: "none"
            }}
          />
          <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
            {domains.map((dom) => (
              <button
                key={dom}
                onClick={() => setSelectedDomain(dom)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "20px",
                  border: selectedDomain === dom ? "1px solid var(--primary-600)" : "1px solid var(--border-color)",
                  background: selectedDomain === dom ? "var(--primary-600)" : "var(--bg-card)",
                  color: selectedDomain === dom ? "#ffffff" : "var(--text-secondary)",
                  fontWeight: selectedDomain === dom ? 600 : 500,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                {dom}
              </button>
            ))}
          </div>
        </div>

        {/* Two Column Layout: Roles list & Selected Role Deep-Dive */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px" }}>
          {/* Roles List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {filtered.map((role) => {
              const isSelected = activeRole.id === role.id;
              return (
                <div
                  key={role.id}
                  onClick={() => setActiveRole(role)}
                  style={{
                    padding: "20px",
                    borderRadius: "16px",
                    background: "var(--bg-card)",
                    border: isSelected ? "2px solid var(--primary-600)" : "1px solid var(--border-color)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: isSelected ? "0 8px 24px rgba(99, 102, 241, 0.15)" : "var(--shadow-sm)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "2rem" }}>{role.icon}</span>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "1.125rem", color: "var(--text-primary)" }}>{role.title}</h3>
                        <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{role.domain}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "4px 10px",
                        borderRadius: "20px",
                        fontSize: "0.8125rem",
                        fontWeight: 700,
                        background: role.matchScore >= 85 ? "#d1fae5" : "#e0e7ff",
                        color: role.matchScore >= 85 ? "#065f46" : "#3730a3"
                      }}>
                        {role.matchScore}% Match
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: "0 0 16px 0", lineHeight: "1.5" }}>
                    {role.description}
                  </p>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid var(--border-color)", fontSize: "0.875rem" }}>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>💰 {role.salary}</span>
                    <span style={{ color: "#10b981", fontWeight: 600 }}>📈 {role.growth}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Role Skill Gap Detail */}
          <div style={{
            position: "sticky",
            top: "24px",
            alignSelf: "start",
            padding: "28px",
            borderRadius: "20px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-md)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
              <span style={{ fontSize: "2.5rem" }}>{activeRole.icon}</span>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.375rem", color: "var(--text-primary)" }}>{activeRole.title}</h2>
                <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Detailed Skill Gap Breakdown</span>
              </div>
            </div>

            <div style={{ marginBottom: "24px", padding: "16px", borderRadius: "12px", background: "var(--primary-50)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--primary-900)" }}>Your Match Score</span>
                <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--primary-700)" }}>{activeRole.matchScore}%</span>
              </div>
              <div style={{ width: "100%", height: "8px", background: "#e0e7ff", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: `${activeRole.matchScore}%`, height: "100%", background: "var(--primary-600)", borderRadius: "4px" }} />
              </div>
            </div>

            <h4 style={{ margin: "0 0 10px 0", fontSize: "0.9375rem", color: "#065f46" }}>
              ✅ Skills You Already Have ({activeRole.userHas.length})
            </h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
              {activeRole.userHas.map((s) => (
                <span key={s} style={{ padding: "6px 12px", borderRadius: "8px", background: "#d1fae5", color: "#065f46", fontSize: "0.8125rem", fontWeight: 600 }}>
                  {s}
                </span>
              ))}
            </div>

            <h4 style={{ margin: "0 0 10px 0", fontSize: "0.9375rem", color: "#991b1b" }}>
              ⚠️ Missing Skills To Bridge ({activeRole.missing.length})
            </h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "28px" }}>
              {activeRole.missing.map((s) => (
                <span key={s} style={{ padding: "6px 12px", borderRadius: "8px", background: "#fee2e2", color: "#991b1b", fontSize: "0.8125rem", fontWeight: 600 }}>
                  {s} (Gap)
                </span>
              ))}
            </div>

            <Link
              href="/dashboard/roadmap"
              style={{
                display: "block",
                textAlign: "center",
                padding: "14px 20px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, var(--primary-600), var(--primary-700))",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "0.9375rem",
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(99, 102, 241, 0.35)",
                transition: "all 0.2s ease"
              }}
            >
              Generate AI Learning Roadmap →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
