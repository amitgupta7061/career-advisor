const BaseAIProvider = require("./baseAIProvider");
const { buildResumePrompt } = require("./resumePromptBuilder");

class GeminiProvider extends BaseAIProvider {
  constructor(config = {}) {
    super("Google Gemini", config);
    this.apiKey = config.apiKey || process.env.GEMINI_API_KEY;
    this.model = config.model || process.env.GEMINI_MODEL || "gemini-1.5-flash";
  }

  isAvailable() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 10);
  }

  async analyzeResume(resumeText, targetRole, targetKeywords) {
    if (!this.isAvailable()) {
      throw new Error("Gemini API key is not configured.");
    }

    const { systemInstruction, userPrompt } = buildResumePrompt(resumeText, targetRole, targetKeywords);
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
      throw new Error("No candidate output returned by Gemini model.");
    }

    return this.extractJSON(candidateText);
  }
}

module.exports = GeminiProvider;
