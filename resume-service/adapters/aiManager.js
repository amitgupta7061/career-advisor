const GeminiProvider = require("./geminiProvider");
const GroqProvider = require("./groqProvider");
const { generateHeuristicResumeAnalysis } = require("./resumePromptBuilder");

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

  async analyzeResume(resumeText, targetRole, targetKeywords) {
    for (const providerKey of this.priorityOrder) {
      if (providerKey === "heuristic") continue;
      const provider = this.providers[providerKey];
      if (!provider || !provider.isAvailable()) continue;

      try {
        console.log(`🤖 Attempting resume analysis with AI Provider: [${provider.name}]...`);
        const result = await provider.analyzeResume(resumeText, targetRole, targetKeywords);
        const validated = this.validateResumeOutput(result, targetRole);
        console.log(`✅ Resume analysis successfully generated using [${provider.name}]`);
        return {
          analysis: validated,
          providerUsed: provider.name,
        };
      } catch (err) {
        console.warn(`⚠️ Resume AI Provider [${provider.name}] failed: ${err.message}. Cascading...`);
      }
    }

    console.log("⚡ Executing Heuristic Resume Engine...");
    const fallback = generateHeuristicResumeAnalysis(resumeText, targetRole, targetKeywords);
    return {
      analysis: this.validateResumeOutput(fallback, targetRole),
      providerUsed: "Heuristic ATS Matcher",
      fallbackNotice: "Analysis generated via Heuristic ATS Matcher due to AI provider unavailability.",
    };
  }

  validateResumeOutput(data, targetRole) {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid resume analysis format: Expected JSON object.");
    }

    const atsScore = Math.max(10, Math.min(100, Math.round(Number(data.atsScore) || 70)));
    const breakdown = {
      keywordsScore: Math.max(10, Math.min(100, Math.round(Number(data.breakdown?.keywordsScore) || 70))),
      verbsScore: Math.max(10, Math.min(100, Math.round(Number(data.breakdown?.verbsScore) || 70))),
      impactScore: Math.max(10, Math.min(100, Math.round(Number(data.breakdown?.impactScore) || 60))),
      formattingScore: Math.max(10, Math.min(100, Math.round(Number(data.breakdown?.formattingScore) || 80))),
    };

    const candidateInfo = {
      name: data.candidateInfo?.name || "Candidate",
      extractedSkills: Array.isArray(data.candidateInfo?.extractedSkills) ? data.candidateInfo.extractedSkills : [],
      detectedSections: Array.isArray(data.candidateInfo?.detectedSections) ? data.candidateInfo.detectedSections : [],
    };

    const matchedKeywords = Array.isArray(data.matchedKeywords) ? data.matchedKeywords : [];
    const missingKeywords = Array.isArray(data.missingKeywords) ? data.missingKeywords : [];
    const actionVerbsFound = Array.isArray(data.actionVerbsFound) ? data.actionVerbsFound : [];

    const feedback = {
      summary: data.feedback?.summary || `Evaluated resume compatibility for ${targetRole}.`,
      strengths: Array.isArray(data.feedback?.strengths) ? data.feedback.strengths : ["Clear role layout"],
      improvements: Array.isArray(data.feedback?.improvements) ? data.feedback.improvements : ["Add quantifiable achievements"],
      bulletPointRewrites: Array.isArray(data.feedback?.bulletPointRewrites) ? data.feedback.bulletPointRewrites : [],
    };

    return {
      atsScore,
      breakdown,
      candidateInfo,
      matchedKeywords,
      missingKeywords,
      actionVerbsFound,
      feedback,
    };
  }
}

module.exports = new AIManager();

