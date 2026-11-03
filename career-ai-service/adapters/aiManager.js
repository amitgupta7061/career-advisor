const GeminiProvider = require("./geminiProvider");
const GroqProvider = require("./groqProvider");
const HeuristicProvider = require("./heuristicProvider");

class AIManager {
  constructor() {
    const timeoutMs = Number(process.env.AI_REQUEST_TIMEOUT_MS) || 12000;

    // Available provider registry
    this.providers = {
      gemini: new GeminiProvider({ timeoutMs }),
      groq: new GroqProvider({ timeoutMs }),
      heuristic: new HeuristicProvider({ timeoutMs }),
    };

    // Configurable priority sequence from environment variable
    const orderEnv = process.env.AI_PROVIDER_ORDER || "gemini,groq,heuristic";
    this.priorityOrder = orderEnv
      .split(",")
      .map((p) => p.trim().toLowerCase())
      .filter((p) => this.providers[p]);

    if (!this.priorityOrder.includes("heuristic")) {
      this.priorityOrder.push("heuristic"); // Ensure deterministic fallback is always present
    }
  }

  /**
   * Executes multi-provider fallback loop
   * @param {object} studentProfile
   * @param {Array<object>} careerRoles
   * @returns {Promise<{result: object, providerUsed: string}>}
   */
  async generateRecommendations(studentProfile, careerRoles) {
    const errors = [];

    for (const providerKey of this.priorityOrder) {
      const provider = this.providers[providerKey];
      if (!provider || !provider.isAvailable()) {
        continue;
      }

      try {
        console.log(`🤖 Attempting career recommendation with AI Provider: [${provider.name}]...`);
        const result = await provider.generateRecommendations(studentProfile, careerRoles);

        // Validate structure
        const validated = this.validateRecommendationOutput(result);
        console.log(`✅ Career recommendations successfully generated using [${provider.name}]`);

        const isFallback = providerKey === "heuristic" && this.priorityOrder[0] !== "heuristic";
        return {
          result: validated,
          providerUsed: provider.name,
          fallbackNotice: isFallback
            ? "Generated via Heuristic Competency Matcher due to AI provider unavailability."
            : undefined,
        };
      } catch (err) {
        console.warn(`⚠️ Provider [${provider.name}] failed: ${err.message}. Cascading to next provider...`);
        errors.push({ provider: provider.name, message: err.message });
      }
    }

    // If external providers failed, use heuristic engine directly
    console.log("⚡ Executing Heuristic Fallback Engine...");
    const fallbackResult = await this.providers.heuristic.generateRecommendations(studentProfile, careerRoles);
    return {
      result: this.validateRecommendationOutput(fallbackResult),
      providerUsed: this.providers.heuristic.name,
      fallbackNotice: "Generated via Heuristic Competency Matcher due to AI provider unavailability.",
    };
  }

  /**
   * Strict validation of output schema before returning to caller
   */
  validateRecommendationOutput(data) {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid output format: Expected JSON object.");
    }

    const summary = typeof data.summary === "string" ? data.summary : "Personalized career path recommendations.";
    const rawRoles = Array.isArray(data.recommendedRoles) ? data.recommendedRoles : [];

    if (rawRoles.length === 0) {
      throw new Error("Invalid recommendation output: No recommended roles provided.");
    }

    const recommendedRoles = rawRoles.map((r, i) => {
      const suitabilityScore = Math.min(100, Math.max(20, Math.round(Number(r.suitabilityScore) || 75)));
      return {
        roleTitle: r.roleTitle || `Career Role ${i + 1}`,
        slug: r.slug || (r.roleTitle ? r.roleTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "role"),
        suitabilityScore,
        domain: r.domain || "Technology",
        marketOutlook: r.marketOutlook || "High Demand",
        salaryRange: r.salaryRange || "₹8 - 25 LPA",
        reasoning: r.reasoning || "Strong alignment with student capabilities.",
        matchingSkills: Array.isArray(r.matchingSkills) ? r.matchingSkills : [],
        missingSkills: Array.isArray(r.missingSkills) ? r.missingSkills : [],
        recommendedNextStep: r.recommendedNextStep || "Continue building practical projects in this domain.",
      };
    });

    return {
      summary,
      recommendedRoles,
    };
  }

  /**
   * Generates AI explanations and strategic action plan for Skill Gap Analysis
   * @param {object} role - Career role
   * @param {object} analysis - Deterministic skill gap analysis
   * @param {object} student - Student profile
   */
  async generateSkillGapInsights(role, analysis, student) {
    const { buildSkillGapPrompt, generateHeuristicSkillGapExplanations } = require("./skillGapPromptBuilder");

    for (const providerKey of this.priorityOrder) {
      const provider = this.providers[providerKey];
      if (!provider || !provider.isAvailable() || providerKey === "heuristic") {
        continue;
      }

      try {
        console.log(`🤖 Attempting skill gap insights with AI Provider: [${provider.name}]...`);
        const { systemInstruction, userPrompt } = buildSkillGapPrompt(role, analysis, student);
        const result = await provider.generateCompletion(systemInstruction, userPrompt);
        if (result && (result.executiveSummary || result.summary)) {
          console.log(`✅ Skill gap insights successfully generated using [${provider.name}]`);
          return {
            insights: {
              executiveSummary: result.executiveSummary || result.summary,
              strategicFocus: Array.isArray(result.strategicFocus) ? result.strategicFocus : [],
              skillExplanations: Array.isArray(result.skillExplanations) ? result.skillExplanations : [],
              phasedRoadmap: result.phasedRoadmap || {},
            },
            providerUsed: provider.name,
          };
        }
      } catch (err) {
        console.warn(`⚠️ Skill gap AI Provider [${provider.name}] failed: ${err.message}. Cascading...`);
      }
    }

    console.log("⚡ Executing Heuristic Skill Gap Explanations...");
    const fallback = generateHeuristicSkillGapExplanations(role, analysis, student);
    return {
      insights: fallback,
      providerUsed: this.providers.heuristic.name,
      fallbackNotice: "Explanations generated via Heuristic Competency Engine due to AI provider unavailability.",
    };
  }
}

// Export singleton instance
module.exports = new AIManager();
