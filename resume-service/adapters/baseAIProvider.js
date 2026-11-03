/**
 * Base AI Provider for Resume Analysis
 */
class BaseAIProvider {
  constructor(name, config = {}) {
    this.name = name;
    this.config = config;
    this.timeoutMs = config.timeoutMs || 15000;
  }

  isAvailable() {
    return false;
  }

  async fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timer);
      return response;
    } catch (err) {
      clearTimeout(timer);
      if (err.name === "AbortError") {
        throw new Error(`AI Provider [${this.name}] request timed out after ${this.timeoutMs}ms`);
      }
      throw err;
    }
  }

  extractJSON(rawText) {
    if (!rawText || typeof rawText !== "string") {
      throw new Error(`Empty response received from ${this.name}`);
    }

    let cleaned = rawText.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json\s*/i, "").replace(/```\s*$/, "");
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```\s*/, "").replace(/```\s*$/, "");
    }

    try {
      return JSON.parse(cleaned);
    } catch (err) {
      const firstBrace = cleaned.indexOf("{");
      const lastBrace = cleaned.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        try {
          return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
        } catch (e) {}
      }
      throw new Error(`Failed to parse JSON response from ${this.name}: ${err.message}`);
    }
  }
}

module.exports = BaseAIProvider;
