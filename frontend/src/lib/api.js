const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

/**
 * Universal fetch wrapper with automatic JWT token attachment
 */
async function request(endpoint, options = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }
    return data;
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err.message);
    throw err;
  }
}

export const api = {
  // Auth
  register: (body) => request("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => request("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  getProfile: () => request("/auth/me"),
  updateProfile: (body) => request("/auth/profile", { method: "PUT", body: JSON.stringify(body) }),

  // Career AI
  getCareerRoles: () => request("/career/roles"),
  getCareerBySlug: (slug) => request(`/career/roles/${slug}`),
  getRecommendations: (body) => request("/career/recommend", { method: "POST", body: JSON.stringify(body) }),
  getSkillGaps: (roleId) => request(`/career/skill-gaps${roleId ? `?roleId=${roleId}` : ""}`),
  analyzeSkillGaps: (body) => request("/career/skill-gaps/analyze", { method: "POST", body: JSON.stringify(body) }),

  // Learning
  getCourses: (params = "") => request(`/learning/courses${params}`),
  generateRoadmap: (body) => request("/learning/roadmap/generate", { method: "POST", body: JSON.stringify(body) }),
  getUserRoadmaps: () => request("/learning/roadmaps"),
  getRoadmapDetail: (id) => request(`/learning/roadmaps/${id}`),
  updateStepStatus: (roadmapId, stepId, status) =>
    request(`/learning/roadmaps/${roadmapId}/steps/${stepId}`, { method: "PATCH", body: JSON.stringify({ status }) }),

  // Opportunities
  getOpportunities: (params = "") => request(`/opportunities${params}`),
  getOpportunityDetail: (id) => request(`/opportunities/detail/${id}`),
  getMatchingOpportunities: () => request("/opportunities/match/me"),
  bookmarkOpportunity: (id) => request(`/opportunities/${id}/bookmark`, { method: "POST" }),
  unbookmarkOpportunity: (id) => request(`/opportunities/${id}/bookmark`, { method: "DELETE" }),
  getBookmarks: () => request("/opportunities/bookmarks/me"),
  applyOpportunity: (id, body = {}) => request(`/opportunities/${id}/apply`, { method: "POST", body: JSON.stringify(body) }),
  getUserApplications: () => request("/opportunities/applications/me"),

  // Resume
  getTargetRoles: () => request("/resume/target-roles"),
  analyzeResume: (body) => request("/resume/analyze", { method: "POST", body: JSON.stringify(body) }),
  getResumeHistory: () => request("/resume/history"),
  enhanceBullet: (bulletPoint) => request("/resume/enhance-bullet", { method: "POST", body: JSON.stringify({ bulletPoint }) }),

  // Progress
  getReadiness: () => request("/progress/readiness"),
  getDashboardSummary: () => request("/progress/dashboard"),
  getGoals: () => request("/progress/goals"),
  createGoal: (body) => request("/progress/goals", { method: "POST", body: JSON.stringify(body) }),
  updateGoal: (id, body) => request(`/progress/goals/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteGoal: (id) => request(`/progress/goals/${id}`, { method: "DELETE" }),
  getBadges: () => request("/progress/badges"),
  logActivity: (body) => request("/progress/activities", { method: "POST", body: JSON.stringify(body) }),
};
