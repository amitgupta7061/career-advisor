const BaseAIProvider = require("./baseAIProvider");
const { buildRecommendationPrompt } = require("./promptBuilder");

class GeminiProvider extends BaseAIProvider {
  constructor(config = {}) {
    super("Google Gemini", config);
    this.apiKey = config.apiKey || process.env.GEMINI_API_KEY;
    this.model = config.model || process.env.GEMINI_MODEL || "gemini-1.5-flash";
  }

  isAvailable() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 10);
  }

  async generateCompletion(systemInstruction, userPrompt) {
    if (!this.isAvailable()) {
      throw new Error("Gemini API key is not configured.");
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const requestPayload = {
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    };

    const res = await this.fetchWithTimeout(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestPayload),
    });

    if (!res.ok) {
      const errText = await res.text();
      let parsedErr = errText;
      try {
        const jsonErr = JSON.parse(errText);
        parsedErr = jsonErr.error?.message || errText;
      } catch (e) {}
      throw new Error(`Gemini API error [${res.status}]: ${parsedErr}`);
    }

    const data = await res.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error("No output candidate returned by Gemini model.");
    }

    return this.extractJSON(candidateText);
  }

  async generateRecommendations(studentProfile, careerRoles) {
    const { systemInstruction, userPrompt } = buildRecommendationPrompt(studentProfile, careerRoles);
    return this.generateCompletion(systemInstruction, userPrompt);
  }
}

module.exports = GeminiProvider;
