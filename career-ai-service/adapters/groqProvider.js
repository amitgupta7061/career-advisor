const BaseAIProvider = require("./baseAIProvider");
const { buildRecommendationPrompt } = require("./promptBuilder");

class GroqProvider extends BaseAIProvider {
  constructor(config = {}) {
    super("Groq", config);
    this.apiKey = config.apiKey || process.env.GROQ_API_KEY;
    this.model = config.model || process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  }

  isAvailable() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 10);
  }

  async generateCompletion(systemInstruction, userPrompt) {
    if (!this.isAvailable()) {
      throw new Error("Groq API key is not configured.");
    }

    const endpoint = "https://api.groq.com/openai/v1/chat/completions";
    const requestPayload = {
      model: this.model,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    };

    const res = await this.fetchWithTimeout(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(requestPayload),
    });

    if (!res.ok) {
      const errText = await res.text();
      let parsedErr = errText;
      try {
        const jsonErr = JSON.parse(errText);
        parsedErr = jsonErr.error?.message || errText;
      } catch (e) {}
      throw new Error(`Groq API error [${res.status}]: ${parsedErr}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No completion choices returned by Groq model.");
    }

    return this.extractJSON(content);
  }

  async generateRecommendations(studentProfile, careerRoles) {
    const { systemInstruction, userPrompt } = buildRecommendationPrompt(studentProfile, careerRoles);
    return this.generateCompletion(systemInstruction, userPrompt);
  }
}

module.exports = GroqProvider;
