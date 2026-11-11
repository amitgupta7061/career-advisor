"use client";
import { useState, useEffect } from "react";
import styles from "../dashboard.module.css";
import DashboardSidebar from "@/components/DashboardSidebar/DashboardSidebar";
import { api } from "@/lib/api";

export default function StudentProfilePage() {
  const [activeTab, setActiveTab] = useState("personal");
  const [, setLoading] = useState(true);
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
          firstName: user?.firstName || "",
          lastName: user?.lastName || "",
          phone: personal?.phone || "",
          city: personal?.city || "",
          state: personal?.state || "",
          country: personal?.country || "India",
          bio: personal?.bio || "",
          linkedinUrl: personal?.linkedinUrl || "",
          githubUrl: personal?.githubUrl || "",
          portfolioUrl: personal?.portfolioUrl || "",
        });
      }
    } catch {
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
      const techArr = newProject.technologies.split(",").map((t) => t.trim()).filter(Boolean);
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
      const techArr = newExperience.technologiesUsed.split(",").map((t) => t.trim()).filter(Boolean);
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
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>Student Profile Management 🎓</h1>
            <p className={styles.pageSubtitle}>
              Centralized repository for academics, verified skills, projects, and career credentials
            </p>
          </div>
        </header>

        {/* Profile Completeness Card */}
        <div
          style={{
            padding: "24px 28px",
            borderRadius: "var(--radius-xl)",
            background: "linear-gradient(135deg, var(--primary-700), var(--primary-500))",
            color: "#ffffff",
            marginBottom: "24px",
            boxShadow: "0 8px 24px rgba(99, 102, 241, 0.22)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.9, fontWeight: 700 }}>
                Profile Completeness
              </span>
              <h2 style={{ margin: "2px 0 0 0", fontSize: "1.375rem", fontWeight: 700 }}>
                {profileData?.user?.firstName || "Student"}&apos;s Profile Overview
              </h2>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "2rem", fontWeight: 800 }}>{completeness}%</span>
              <span style={{ display: "block", fontSize: "0.75rem", opacity: 0.9 }}>
                Industry Target: 85%+
              </span>
            </div>
          </div>
          <div style={{ width: "100%", height: "8px", background: "rgba(255, 255, 255, 0.25)", borderRadius: "4px", overflow: "hidden" }}>
            <div
              style={{
                width: `${completeness}%`,
                height: "100%",
                background: "#ffffff",
                borderRadius: "4px",
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>

        {/* Notification Banner */}
        {message.text && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "var(--radius-md)",
              background: message.type === "success" ? "var(--success-50)" : "var(--danger-50)",
              border: message.type === "success" ? "1px solid var(--success-200)" : "1px solid var(--danger-200)",
              color: message.type === "success" ? "var(--success-700)" : "var(--danger-600)",
              marginBottom: "20px",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            {message.type === "success" ? "✅ " : "⚠️ "} {message.text}
          </div>
        )}

        {/* Tab Navigation */}
        <div className={styles.pillsScroll} style={{ marginBottom: "24px" }}>
          {[
            { id: "personal", label: "Personal Info" },
            { id: "academics", label: "Academics" },
            { id: "skills", label: "Skills Inventory" },
            { id: "projects", label: "Projects" },
            { id: "experience", label: "Internships & Experience" },
            { id: "certifications", label: "Certifications" },
          ].map((tab) => {
            const isTab = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`btn btn-sm ${isTab ? "btn-primary" : "btn-outline"}`}
                style={{ borderRadius: "var(--radius-full)" }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Personal Profile */}
        {activeTab === "personal" && (
          <div className="card" style={{ padding: "28px" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "1.125rem", color: "var(--text-primary)", fontWeight: 700 }}>
              Personal & Contact Details
            </h3>
            <form onSubmit={handleUpdatePersonal} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "6px", fontWeight: 600 }}>First Name</label>
                <input
                  type="text"
                  value={personalForm.firstName}
                  onChange={(e) => setPersonalForm({ ...personalForm, firstName: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "6px", fontWeight: 600 }}>Last Name</label>
                <input
                  type="text"
                  value={personalForm.lastName}
                  onChange={(e) => setPersonalForm({ ...personalForm, lastName: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "6px", fontWeight: 600 }}>Phone Number</label>
                <input
                  type="text"
                  value={personalForm.phone}
                  onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "6px", fontWeight: 600 }}>City / Location</label>
                <input
                  type="text"
                  value={personalForm.city}
                  onChange={(e) => setPersonalForm({ ...personalForm, city: e.target.value })}
                  className="input-field"
                />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "6px", fontWeight: 600 }}>Professional Bio / Intro</label>
                <textarea
                  rows={3}
                  value={personalForm.bio}
                  onChange={(e) => setPersonalForm({ ...personalForm, bio: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "6px", fontWeight: 600 }}>LinkedIn Profile URL</label>
                <input
                  type="url"
                  value={personalForm.linkedinUrl}
                  onChange={(e) => setPersonalForm({ ...personalForm, linkedinUrl: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "6px", fontWeight: 600 }}>GitHub Profile URL</label>
                <input
                  type="url"
                  value={personalForm.githubUrl}
                  onChange={(e) => setPersonalForm({ ...personalForm, githubUrl: e.target.value })}
                  className="input-field"
                />
              </div>
              <div style={{ gridColumn: "1 / -1", marginTop: "8px" }}>
                <button type="submit" className="btn btn-primary">
                  Save Personal Profile
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Academics */}
        {activeTab === "academics" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="card" style={{ padding: "24px" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "1.125rem", color: "var(--text-primary)", fontWeight: 700 }}>
                Add Academic Qualification
              </h3>
              <form onSubmit={handleAddAcademic} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "4px", fontWeight: 600 }}>Institution / College</label>
                  <input
                    type="text"
                    placeholder="e.g. National Institute of Technology"
                    value={newAcademic.institutionName}
                    onChange={(e) => setNewAcademic({ ...newAcademic, institutionName: e.target.value })}
                    required
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "4px", fontWeight: 600 }}>Degree</label>
                  <input
                    type="text"
                    placeholder="e.g. B.Tech, BCA, MCA"
                    value={newAcademic.degree}
                    onChange={(e) => setNewAcademic({ ...newAcademic, degree: e.target.value })}
                    required
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "4px", fontWeight: 600 }}>Field of Study</label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science"
                    value={newAcademic.fieldOfStudy}
                    onChange={(e) => setNewAcademic({ ...newAcademic, fieldOfStudy: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "4px", fontWeight: 600 }}>CGPA or Score</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 8.85"
                    value={newAcademic.gradeScore}
                    onChange={(e) => setNewAcademic({ ...newAcademic, gradeScore: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <button type="submit" className="btn btn-primary btn-sm">
                    + Add Academic Record
                  </button>
                </div>
              </form>
            </div>

            {/* Academic List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {profileData?.academics?.map((a) => (
                <div key={a.id} className="card" style={{ padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <h4 style={{ margin: "0 0 4px 0", fontSize: "1rem", color: "var(--text-primary)", fontWeight: 700 }}>{a.degree} in {a.field_of_study || "General"}</h4>
                    <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-secondary)" }}>{a.institution_name} · Graduating {a.graduation_year || "N/A"}</p>
                    <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--primary-600)" }}>Grade: {a.grade_score} {String(a.grade_type || "").toUpperCase()}</span>
                  </div>
                  <button onClick={() => handleDeleteAcademic(a.id)} className="btn btn-danger btn-sm">
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
            <div className="card" style={{ padding: "24px" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "1.125rem", color: "var(--text-primary)", fontWeight: 700 }}>
                Add Technical or Soft Skill
              </h3>
              <form onSubmit={handleAddSkill} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr)) auto", gap: "12px", alignItems: "end" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "4px", fontWeight: 600 }}>Skill Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Python, Docker, Communication"
                    value={newSkill.skillName}
                    onChange={(e) => setNewSkill({ ...newSkill, skillName: e.target.value })}
                    required
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "4px", fontWeight: 600 }}>Category</label>
                  <select
                    value={newSkill.skillCategory}
                    onChange={(e) => setNewSkill({ ...newSkill, skillCategory: e.target.value })}
                    className="input-field"
                  >
                    <option value="technical">Technical</option>
                    <option value="soft">Soft Skill</option>
                    <option value="tool">Tool / DevOps</option>
                    <option value="language">Language</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "4px", fontWeight: 600 }}>Proficiency</label>
                  <select
                    value={newSkill.proficiencyLevel}
                    onChange={(e) => setNewSkill({ ...newSkill, proficiencyLevel: e.target.value })}
                    className="input-field"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" style={{ height: "42px" }}>
                  + Add
                </button>
              </form>
            </div>

            {/* Skills Badges */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {profileData?.skills?.map((s) => (
                <div
                  key={s.id}
                  className="badge badge-primary"
                  style={{
                    fontSize: "0.875rem",
                    padding: "6px 14px",
                    gap: "8px",
                  }}
                >
                  <span>{s.skill_name}</span>
                  <span style={{ fontSize: "0.75rem", opacity: 0.8, textTransform: "capitalize" }}>({s.proficiency_level})</span>
                  <button
                    onClick={() => handleDeleteSkill(s.id)}
                    style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: "0 2px" }}
                    aria-label={`Remove ${s.skill_name}`}
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
            <div className="card" style={{ padding: "24px" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "1.125rem", color: "var(--text-primary)", fontWeight: 700 }}>
                Add Showcase Project
              </h3>
              <form onSubmit={handleAddProject} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "4px", fontWeight: 600 }}>Project Title</label>
                  <input
                    type="text"
                    placeholder="e.g. AI Career Advisor"
                    value={newProject.title}
                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                    required
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "4px", fontWeight: 600 }}>Tech Stack (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. React, Node.js, PostgreSQL"
                    value={newProject.technologies}
                    onChange={(e) => setNewProject({ ...newProject, technologies: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "4px", fontWeight: 600 }}>Project Description</label>
                  <textarea
                    rows={2}
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    required
                    className="input-field"
                  />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <button type="submit" className="btn btn-primary btn-sm">
                    + Save Project
                  </button>
                </div>
              </form>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: "16px" }}>
              {profileData?.projects?.map((p) => (
                <div key={p.id} className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "12px" }}>
                  <div>
                    <h4 style={{ margin: "0 0 6px 0", fontSize: "1.05rem", color: "var(--text-primary)", fontWeight: 700 }}>{p.title}</h4>
                    <p style={{ margin: "0 0 12px 0", fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>{p.description}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {p.technologies?.map((tech) => (
                        <span key={tech} className="badge badge-neutral" style={{ fontSize: "0.75rem" }}>{tech}</span>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => handleDeleteProject(p.id)} className="btn btn-danger btn-sm" style={{ alignSelf: "flex-start" }}>
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
            <div className="card" style={{ padding: "24px" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "1.125rem", color: "var(--text-primary)", fontWeight: 700 }}>
                Add Work / Internship Experience
              </h3>
              <form onSubmit={handleAddExperience} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "4px", fontWeight: 600 }}>Organization / Company</label>
                  <input
                    type="text"
                    placeholder="e.g. Microsoft Research"
                    value={newExperience.organization}
                    onChange={(e) => setNewExperience({ ...newExperience, organization: e.target.value })}
                    required
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "4px", fontWeight: 600 }}>Role / Title</label>
                  <input
                    type="text"
                    placeholder="e.g. SDE Intern"
                    value={newExperience.roleTitle}
                    onChange={(e) => setNewExperience({ ...newExperience, roleTitle: e.target.value })}
                    required
                    className="input-field"
                  />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <button type="submit" className="btn btn-primary btn-sm">
                    + Save Experience Record
                  </button>
                </div>
              </form>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {profileData?.experiences?.map((exp) => (
                <div key={exp.id} className="card" style={{ padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <h4 style={{ margin: "0 0 4px 0", fontSize: "1rem", color: "var(--text-primary)", fontWeight: 700 }}>{exp.role_title} at {exp.organization}</h4>
                    <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-secondary)" }}>{exp.employment_type} · {exp.location || "Remote"}</p>
                  </div>
                  <button onClick={() => handleDeleteExperience(exp.id)} className="btn btn-danger btn-sm">
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
            <div className="card" style={{ padding: "24px" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "1.125rem", color: "var(--text-primary)", fontWeight: 700 }}>
                Add Professional Certification
              </h3>
              <form onSubmit={handleAddCert} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "4px", fontWeight: 600 }}>Certification Name</label>
                  <input
                    type="text"
                    placeholder="e.g. AWS Certified Developer"
                    value={newCert.name}
                    onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
                    required
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "4px", fontWeight: 600 }}>Issuing Organization</label>
                  <input
                    type="text"
                    placeholder="e.g. Amazon Web Services"
                    value={newCert.issuingOrganization}
                    onChange={(e) => setNewCert({ ...newCert, issuingOrganization: e.target.value })}
                    required
                    className="input-field"
                  />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <button type="submit" className="btn btn-primary btn-sm">
                    + Save Certification
                  </button>
                </div>
              </form>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {profileData?.certifications?.map((c) => (
                <div key={c.id} className="card" style={{ padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <h4 style={{ margin: "0 0 4px 0", fontSize: "1rem", color: "var(--text-primary)", fontWeight: 700 }}>{c.name}</h4>
                    <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-secondary)" }}>Issued by {c.issuing_organization}</p>
                  </div>
                  <button onClick={() => handleDeleteCert(c.id)} className="btn btn-danger btn-sm">
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
