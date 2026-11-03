const GeminiProvider = require("./geminiProvider");
const GroqProvider = require("./groqProvider");
const { generateHeuristicRoadmap } = require("./roadmapPromptBuilder");

class AIManager {
  constructor() {
    const timeoutMs = Number(process.env.AI_REQUEST_TIMEOUT_MS) || 15000;

    this.providers = {
      gemini: new GeminiProvider({ timeoutMs }),
      groq: new GroqProvider({ timeoutMs }),
    };

    const orderEnv = process.env.AI_PROVIDER_ORDER || "gemini,groq,heuristic";
    this.priorityOrder = orderEnv
      .split(",")
      .map((p) => p.trim().toLowerCase())
      .filter((p) => this.providers[p] || p === "heuristic");

    if (!this.priorityOrder.includes("heuristic")) {
      this.priorityOrder.push("heuristic");
    }
  }

  /**
   * Generates structured learning roadmap using failover priority chain
   */
  async generateRoadmap(role, gaps, student, availableCourses) {
    for (const providerKey of this.priorityOrder) {
      if (providerKey === "heuristic") continue;
      const provider = this.providers[providerKey];
      if (!provider || !provider.isAvailable()) continue;

      try {
        console.log(`🤖 Attempting roadmap generation with AI Provider: [${provider.name}]...`);
        const result = await provider.generateRoadmap(role, gaps, student, availableCourses);
        const validated = this.validateRoadmapOutput(result, role);
        console.log(`✅ Roadmap successfully generated using [${provider.name}]`);
        return {
          roadmap: validated,
          providerUsed: provider.name,
        };
      } catch (err) {
        console.warn(`⚠️ Provider [${provider.name}] failed: ${err.message}. Cascading...`);
      }
    }

    console.log("⚡ Executing Heuristic Roadmap Generator...");
    const fallback = generateHeuristicRoadmap(role, gaps, student, availableCourses);
    return {
      roadmap: this.validateRoadmapOutput(fallback, role),
      providerUsed: "Heuristic Curriculum Architect",
      fallbackNotice: "Curriculum generated via Heuristic Curriculum Architect due to AI provider unavailability.",
    };
  }

  /**
   * Validates and cleans output schema
   */
  validateRoadmapOutput(data, role) {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid roadmap output: Expected JSON object.");
    }

    const roadmapTitle = data.roadmapTitle || `Personalized Pathway to ${role.title}`;
    const description = data.description || `Milestone curriculum tailored for ${role.title}.`;
    const estimatedDurationWeeks = Math.max(4, Math.min(24, Number(data.estimatedDurationWeeks) || 10));

    const rawMilestones = Array.isArray(data.milestones) ? data.milestones : [];
    if (rawMilestones.length === 0) {
      throw new Error("Invalid roadmap output: No milestones provided.");
    }

    const milestones = rawMilestones.map((m, mIdx) => {
      const milestoneIndex = m.milestoneIndex || mIdx + 1;
      const title = m.title || `Phase ${milestoneIndex}: Learning Milestones`;
      const durationWeeks = Number(m.durationWeeks) || 3;
      const mDesc = m.description || "Core milestone objectives.";

      const activities = (Array.isArray(m.activities) ? m.activities : []).map((a, aIdx) => {
        const allowedTypes = ["course", "tutorial", "project", "certification", "practice", "documentation"];
        const rawType = (a.activityType || "course").toLowerCase();
        const activityType = allowedTypes.includes(rawType) ? rawType : "course";

        return {
          title: a.title || `Learning Activity ${aIdx + 1}`,
          description: a.description || "Deep dive into target competency.",
          activityType,
          skillName: a.skillName || role.title,
          priority: ["critical", "high", "medium", "low"].includes((a.priority || "").toLowerCase())
            ? a.priority.toLowerCase()
            : "high",
          platform: a.platform || "Self-guided",
          resourceUrl: a.resourceUrl || "https://developer.mozilla.org",
          isFree: a.isFree !== false,
          estimatedHrs: Math.max(2, Math.min(100, Number(a.estimatedHrs) || 15)),
          learningObjectives: Array.isArray(a.learningObjectives) ? a.learningObjectives : ["Gain practical skill proficiency"],
          expectedOutcomes: a.expectedOutcomes || "Demonstrated competency through working code.",
        };
      });

      return {
        milestoneIndex,
        title,
        durationWeeks,
        description: mDesc,
        activities,
      };
    });

    return {
      roadmapTitle,
      description,
      estimatedDurationWeeks,
      milestones,
    };
  }
}

module.exports = new AIManager();

