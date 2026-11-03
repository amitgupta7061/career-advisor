/**
 * Base AI Provider Interface
 * All concrete providers (Gemini, Groq, Heuristics, etc.) inherit from this.
 */

class BaseAIProvider {
  constructor(name, config = {}) {
    this.name = name;
    this.config = config;
    this.timeoutMs = Number(config.timeoutMs) || 10000;
  }

  /**
   * Check if the provider has necessary credentials/configs to attempt execution
   * @returns {boolean}
   */
  isAvailable() {
    throw new Error("Method isAvailable() must be implemented.");
  }

  /**
   * Generates recommendation given student profile context and target role catalog
   * @param {object} studentProfile
   * @param {Array<object>} careerRoles
   * @returns {Promise<object>} Parsed structured JSON
   */
  async generateRecommendations(studentProfile, careerRoles) {
    throw new Error("Method generateRecommendations() must be implemented.");
  }

  /**
   * Safe fetch with AbortController timeout
   */
  async fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return response;
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === "AbortError") {
        throw new Error(`Provider ${this.name} timed out after ${this.timeoutMs}ms`);
      }
      throw err;
    }
  }

  /**
   * Helper to extract clean JSON object from potentially markdown-wrapped LLM text
   */
  extractJSON(rawText) {
    if (!rawText || typeof rawText !== "string") {
      throw new Error("Empty response from AI model.");
    }

    let cleaned = rawText.trim();
    // Remove markdown code fences if model returned ```json ... ```
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    }

    try {
      return JSON.parse(cleaned);
    } catch (err) {
      // Attempt substring extraction if model had leading or trailing chatter
      const firstBrace = cleaned.indexOf("{");
      const lastBrace = cleaned.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const sub = cleaned.substring(firstBrace, lastBrace + 1);
        return JSON.parse(sub);
      }
      throw new Error(`Failed to parse AI output into valid JSON: ${err.message}`);
    }
  }
}

module.exports = BaseAIProvider;

