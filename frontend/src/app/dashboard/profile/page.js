"use client";
import { useState, useEffect } from "react";
import styles from "../dashboard.module.css";
import DashboardSidebar from "@/components/DashboardSidebar/DashboardSidebar";
import { api } from "@/lib/api";

export default function StudentProfilePage() {
  const [activeTab, setActiveTab] = useState("personal");
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Form states
  const [personalForm, setPersonalForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    city: "",
    state: "",
    country: "India",
    bio: "",
    linkedinUrl: "",
    githubUrl: "",
    portfolioUrl: "",
  });

  const [newSkill, setNewSkill] = useState({
    skillName: "",
    skillCategory: "technical",
    proficiencyLevel: "intermediate",
    yearsOfExperience: 1,
  });

  const [newAcademic, setNewAcademic] = useState({
    institutionName: "",
    degree: "",
    fieldOfStudy: "",
    currentSemester: 6,
    enrollmentYear: 2023,
    graduationYear: 2027,
    gradeScore: 8.5,
    gradeType: "cgpa",
  });

  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    technologies: "",
    category: "academic",
    githubUrl: "",
    liveUrl: "",
    status: "completed",
  });

  const [newExperience, setNewExperience] = useState({
    organization: "",
    roleTitle: "",
    employmentType: "internship",
    location: "",
    startDate: "2026-01-01",
    isCurrent: true,
    responsibilities: "",
    technologiesUsed: "",
  });

  const [newCert, setNewCert] = useState({
    name: "",
    issuingOrganization: "",
    issueDate: "2025-12-01",
    credentialUrl: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    try {
      const res = await api.getMyProfile();
      if (res.success && res.data) {
        setProfileData(res.data);
        const { user, personal } = res.data;
        setPersonalForm({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          phone: personal.phone || "",
          city: personal.city || "",
          state: personal.state || "",
          country: personal.country || "India",
          bio: personal.bio || "",
          linkedinUrl: personal.linkedinUrl || "",
          githubUrl: personal.githubUrl || "",
          portfolioUrl: personal.portfolioUrl || "",
        });
      }
    } catch (e) {
      console.error("Failed to load profile:", e);
      setMessage({ type: "error", text: "Please log in to manage your student profile." });
    } finally {
      setLoading(false);
    }
  }

  const handleUpdatePersonal = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    try {
      const res = await api.updatePersonalProfile(personalForm);
      if (res.success) {
        setMessage({ type: "success", text: "Personal profile updated successfully!" });
        loadProfile();
      }
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to update profile." });
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkill.skillName.trim()) return;
    try {
      const res = await api.addSkill(newSkill);
      if (res.success) {
        setMessage({ type: "success", text: "Skill added!" });
        setNewSkill({ skillName: "", skillCategory: "technical", proficiencyLevel: "intermediate", yearsOfExperience: 1 });
        loadProfile();
      }
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to add skill." });
    }
  };

  const handleDeleteSkill = async (id) => {
    try {
      await api.deleteSkill(id);
      loadProfile();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleAddAcademic = async (e) => {
    e.preventDefault();
    try {
      const res = await api.addAcademic(newAcademic);
      if (res.success) {
        setMessage({ type: "success", text: "Academic qualification added!" });
        loadProfile();
      }
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to add academic record." });
    }
  };

  const handleDeleteAcademic = async (id) => {
    try {
      await api.deleteAcademic(id);
      loadProfile();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    try {
      const techArr = newProject.technologies.split(",").map(t => t.trim()).filter(Boolean);
      const res = await api.addProject({ ...newProject, technologies: techArr });
      if (res.success) {
        setMessage({ type: "success", text: "Project added successfully!" });
        setNewProject({ title: "", description: "", technologies: "", category: "academic", githubUrl: "", liveUrl: "", status: "completed" });
        loadProfile();
      }
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to add project." });
    }
  };

  const handleDeleteProject = async (id) => {
    try {
      await api.deleteProject(id);
      loadProfile();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleAddExperience = async (e) => {
    e.preventDefault();
    try {
      const techArr = newExperience.technologiesUsed.split(",").map(t => t.trim()).filter(Boolean);
      const res = await api.addExperience({ ...newExperience, technologiesUsed: techArr });
      if (res.success) {
        setMessage({ type: "success", text: "Experience record saved!" });
        loadProfile();
      }
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to save experience." });
    }
  };

  const handleDeleteExperience = async (id) => {
    try {
      await api.deleteExperience(id);
      loadProfile();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleAddCert = async (e) => {
    e.preventDefault();
    try {
      const res = await api.addCertification(newCert);
      if (res.success) {
        setMessage({ type: "success", text: "Certification saved!" });
        loadProfile();
      }
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to save certification." });
    }
  };

  const handleDeleteCert = async (id) => {
    try {
      await api.deleteCertification(id);
      loadProfile();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const completeness = profileData?.personal?.profileCompleteness || 0;

  return (
    <div className={styles.dashboard}>
      <DashboardSidebar />

      <main className={styles.mainContent}>
        <header className={styles.topBar}>
          <div>
            <h1 className={styles.pageTitle}>Student Profile Management 🎓</h1>
            <p className={styles.pageSubtitle}>Centralized inventory for academics, skills, career preferences, projects, and certifications</p>
          </div>
        </header>

        {/* Profile Completeness Card */}
        <div style={{
          padding: "24px",
          borderRadius: "16px",
          background: "linear-gradient(135deg, #4338ca, #6366f1)",
          color: "#ffffff",
          marginBottom: "24px",
          boxShadow: "0 8px 24px rgba(99, 102, 241, 0.25)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <span style={{ fontSize: "0.8125rem", textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.9 }}>Profile Completeness</span>
              <h2 style={{ margin: "2px 0 0 0", fontSize: "1.5rem" }}>{profileData?.user?.firstName || "Student"}&apos;s Profile Overview</h2>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "2rem", fontWeight: 800 }}>{completeness}%</span>
              <span style={{ display: "block", fontSize: "0.8125rem", opacity: 0.9 }}>Industry Ready Target: 85%+</span>
            </div>
          </div>
          <div style={{ width: "100%", height: "8px", background: "rgba(255, 255, 255, 0.25)", borderRadius: "4px", overflow: "hidden" }}>
            <div style={{ width: `${completeness}%`, height: "100%", background: "#ffffff", borderRadius: "4px", transition: "width 0.4s ease" }} />
          </div>
        </div>

        {/* Notification Banner */}
        {message.text && (
          <div style={{
            padding: "12px 16px",
            borderRadius: "10px",
            background: message.type === "success" ? "#f0fdf4" : "#fef2f2",
            border: message.type === "success" ? "1px solid #bbf7d0" : "1px solid #fecaca",
            color: message.type === "success" ? "#15803d" : "#b91c1c",
            marginBottom: "20px",
            fontSize: "0.875rem",
            fontWeight: 500
          }}>
            {message.type === "success" ? "✅ " : "⚠️ "} {message.text}
          </div>
        )}

        {/* Tab Navigation */}
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", marginBottom: "24px", paddingBottom: "4px" }}>
          {[
            { id: "personal", label: "Personal Info" },
            { id: "academics", label: "Academics" },
            { id: "skills", label: "Skills Inventory" },
            { id: "projects", label: "Projects" },
            { id: "experience", label: "Internships & Experience" },
            { id: "certifications", label: "Certifications" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "10px 18px",
                borderRadius: "12px",
                border: activeTab === tab.id ? "1px solid var(--primary-600)" : "1px solid var(--border-color)",
                background: activeTab === tab.id ? "var(--primary-600)" : "var(--bg-card)",
                color: activeTab === tab.id ? "#ffffff" : "var(--text-secondary)",
                fontWeight: activeTab === tab.id ? 600 : 500,
                fontSize: "0.875rem",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Personal Profile */}
        {activeTab === "personal" && (
          <div style={{ background: "var(--bg-card)", padding: "28px", borderRadius: "16px", border: "1px solid var(--border-color)" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "1.125rem" }}>Personal & Contact Details</h3>
            <form onSubmit={handleUpdatePersonal} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "6px" }}>First Name</label>
                <input
                  type="text"
                  value={personalForm.firstName}
                  onChange={(e) => setPersonalForm({ ...personalForm, firstName: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border-color)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "6px" }}>Last Name</label>
                <input
                  type="text"
                  value={personalForm.lastName}
                  onChange={(e) => setPersonalForm({ ...personalForm, lastName: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border-color)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "6px" }}>Phone Number</label>
                <input
                  type="text"
                  value={personalForm.phone}
                  onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border-color)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "6px" }}>City / Location</label>
                <input
                  type="text"
                  value={personalForm.city}
                  onChange={(e) => setPersonalForm({ ...personalForm, city: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border-color)" }}
                />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "6px" }}>Professional Bio / Intro</label>
                <textarea
                  rows={3}
                  value={personalForm.bio}
                  onChange={(e) => setPersonalForm({ ...personalForm, bio: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border-color)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "6px" }}>LinkedIn Profile URL</label>
                <input
                  type="url"
                  value={personalForm.linkedinUrl}
                  onChange={(e) => setPersonalForm({ ...personalForm, linkedinUrl: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border-color)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "6px" }}>GitHub Profile URL</label>
                <input
                  type="url"
                  value={personalForm.githubUrl}
                  onChange={(e) => setPersonalForm({ ...personalForm, githubUrl: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border-color)" }}
                />
              </div>
              <div style={{ gridColumn: "1 / -1", marginTop: "8px" }}>
                <button
                  type="submit"
                  style={{
                    padding: "12px 24px",
                    borderRadius: "10px",
                    border: "none",
                    background: "var(--primary-600)",
                    color: "#ffffff",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Save Personal Profile
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Academics */}
        {activeTab === "academics" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ background: "var(--bg-card)", padding: "24px", borderRadius: "16px", border: "1px solid var(--border-color)" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "1.125rem" }}>Add Academic Qualification</h3>
              <form onSubmit={handleAddAcademic} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Institution / College</label>
                  <input
                    type="text"
                    placeholder="e.g. National Institute of Technology"
                    value={newAcademic.institutionName}
                    onChange={(e) => setNewAcademic({ ...newAcademic, institutionName: e.target.value })}
                    required
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-color)" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Degree</label>
                  <input
                    type="text"
                    placeholder="e.g. B.Tech, BCA, MCA"
                    value={newAcademic.degree}
                    onChange={(e) => setNewAcademic({ ...newAcademic, degree: e.target.value })}
                    required
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-color)" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Field of Study</label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science"
                    value={newAcademic.fieldOfStudy}
                    onChange={(e) => setNewAcademic({ ...newAcademic, fieldOfStudy: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-color)" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "4px" }}>CGPA or Score</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 8.85"
                    value={newAcademic.gradeScore}
                    onChange={(e) => setNewAcademic({ ...newAcademic, gradeScore: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-color)" }}
                  />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <button type="submit" style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: "var(--primary-600)", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
                    + Add Academic Record
                  </button>
                </div>
              </form>
            </div>

            {/* Academic List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {profileData?.academics?.map((a) => (
                <div key={a.id} style={{ padding: "18px", borderRadius: "12px", background: "var(--bg-card)", border: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h4 style={{ margin: "0 0 4px 0", fontSize: "1rem" }}>{a.degree} in {a.field_of_study || "General"}</h4>
                    <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-secondary)" }}>{a.institution_name} · Graduating {a.graduation_year || "N/A"}</p>
                    <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--primary-700)" }}>Grade: {a.grade_score} {a.grade_type.toUpperCase()}</span>
                  </div>
                  <button onClick={() => handleDeleteAcademic(a.id)} style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid #fee2e2", background: "#fef2f2", color: "#b91c1c", cursor: "pointer" }}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Skills */}
        {activeTab === "skills" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ background: "var(--bg-card)", padding: "24px", borderRadius: "16px", border: "1px solid var(--border-color)" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "1.125rem" }}>Add Technical or Soft Skill</h3>
              <form onSubmit={handleAddSkill} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr auto", gap: "12px", alignItems: "end" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Skill Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Python, Docker, Communication"
                    value={newSkill.skillName}
                    onChange={(e) => setNewSkill({ ...newSkill, skillName: e.target.value })}
                    required
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-color)" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Category</label>
                  <select
                    value={newSkill.skillCategory}
                    onChange={(e) => setNewSkill({ ...newSkill, skillCategory: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-color)" }}
                  >
                    <option value="technical">Technical</option>
                    <option value="soft">Soft Skill</option>
                    <option value="tool">Tool / DevOps</option>
                    <option value="language">Language</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Proficiency</label>
                  <select
                    value={newSkill.proficiencyLevel}
                    onChange={(e) => setNewSkill({ ...newSkill, proficiencyLevel: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-color)" }}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
                <button type="submit" style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: "var(--primary-600)", color: "#fff", fontWeight: 600, cursor: "pointer", height: "42px" }}>
                  + Add
                </button>
              </form>
            </div>

            {/* Skills Badges */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {profileData?.skills?.map((s) => (
                <div
                  key={s.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 14px",
                    borderRadius: "20px",
                    background: s.skill_category === "soft" ? "#fce7f3" : "#e0e7ff",
                    color: s.skill_category === "soft" ? "#9d174d" : "#3730a3",
                    fontSize: "0.875rem",
                    fontWeight: 600
                  }}
                >
                  <span>{s.skill_name}</span>
                  <span style={{ fontSize: "0.75rem", opacity: 0.8, textTransform: "capitalize" }}>({s.proficiency_level})</span>
                  <button
                    onClick={() => handleDeleteSkill(s.id)}
                    style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: "0 2px" }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Projects */}
        {activeTab === "projects" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ background: "var(--bg-card)", padding: "24px", borderRadius: "16px", border: "1px solid var(--border-color)" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "1.125rem" }}>Add Showcase Project</h3>
              <form onSubmit={handleAddProject} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Project Title</label>
                  <input
                    type="text"
                    placeholder="e.g. AI Career Advisor"
                    value={newProject.title}
                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                    required
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-color)" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Tech Stack (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. React, Node.js, PostgreSQL"
                    value={newProject.technologies}
                    onChange={(e) => setNewProject({ ...newProject, technologies: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-color)" }}
                  />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Project Description</label>
                  <textarea
                    rows={2}
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    required
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-color)" }}
                  />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <button type="submit" style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: "var(--primary-600)", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
                    + Save Project
                  </button>
                </div>
              </form>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
              {profileData?.projects?.map((p) => (
                <div key={p.id} style={{ padding: "20px", borderRadius: "14px", background: "var(--bg-card)", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <h4 style={{ margin: "0 0 6px 0", fontSize: "1.05rem" }}>{p.title}</h4>
                    <p style={{ margin: "0 0 12px 0", fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>{p.description}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px" }}>
                      {p.technologies?.map((tech) => (
                        <span key={tech} style={{ padding: "2px 8px", borderRadius: "6px", background: "var(--bg-card-hover)", fontSize: "0.75rem" }}>{tech}</span>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => handleDeleteProject(p.id)} style={{ alignSelf: "flex-start", padding: "6px 12px", borderRadius: "8px", border: "1px solid #fee2e2", background: "#fef2f2", color: "#b91c1c", cursor: "pointer", fontSize: "0.8125rem" }}>
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Experience */}
        {activeTab === "experience" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ background: "var(--bg-card)", padding: "24px", borderRadius: "16px", border: "1px solid var(--border-color)" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "1.125rem" }}>Add Work / Internship Experience</h3>
              <form onSubmit={handleAddExperience} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Organization / Company</label>
                  <input
                    type="text"
                    placeholder="e.g. Microsoft Research"
                    value={newExperience.organization}
                    onChange={(e) => setNewExperience({ ...newExperience, organization: e.target.value })}
                    required
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-color)" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Role / Title</label>
                  <input
                    type="text"
                    placeholder="e.g. SDE Intern"
                    value={newExperience.roleTitle}
                    onChange={(e) => setNewExperience({ ...newExperience, roleTitle: e.target.value })}
                    required
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-color)" }}
                  />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <button type="submit" style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: "var(--primary-600)", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
                    + Save Experience Record
                  </button>
                </div>
              </form>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {profileData?.experiences?.map((exp) => (
                <div key={exp.id} style={{ padding: "18px", borderRadius: "12px", background: "var(--bg-card)", border: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h4 style={{ margin: "0 0 4px 0", fontSize: "1rem" }}>{exp.role_title} at {exp.organization}</h4>
                    <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-secondary)" }}>{exp.employment_type} · {exp.location || "Remote"}</p>
                  </div>
                  <button onClick={() => handleDeleteExperience(exp.id)} style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid #fee2e2", background: "#fef2f2", color: "#b91c1c", cursor: "pointer" }}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 6: Certifications */}
        {activeTab === "certifications" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ background: "var(--bg-card)", padding: "24px", borderRadius: "16px", border: "1px solid var(--border-color)" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "1.125rem" }}>Add Professional Certification</h3>
              <form onSubmit={handleAddCert} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Certification Name</label>
                  <input
                    type="text"
                    placeholder="e.g. AWS Certified Developer"
                    value={newCert.name}
                    onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
                    required
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-color)" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Issuing Organization</label>
                  <input
                    type="text"
                    placeholder="e.g. Amazon Web Services"
                    value={newCert.issuingOrganization}
                    onChange={(e) => setNewCert({ ...newCert, issuingOrganization: e.target.value })}
                    required
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-color)" }}
                  />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <button type="submit" style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: "var(--primary-600)", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
                    + Save Certification
                  </button>
                </div>
              </form>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {profileData?.certifications?.map((c) => (
                <div key={c.id} style={{ padding: "18px", borderRadius: "12px", background: "var(--bg-card)", border: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h4 style={{ margin: "0 0 4px 0", fontSize: "1rem" }}>{c.name}</h4>
                    <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-secondary)" }}>Issued by {c.issuing_organization}</p>
                  </div>
                  <button onClick={() => handleDeleteCert(c.id)} style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid #fee2e2", background: "#fef2f2", color: "#b91c1c", cursor: "pointer" }}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

