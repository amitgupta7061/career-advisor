function buildRecommendationPrompt(studentProfile, careerRoles) {
  const rolesSummary = careerRoles.map((r) => ({
    title: r.title,
    slug: r.slug,
    category: r.category,
    salaryRange: `₹${Math.round((r.avg_salary_min || 600000) / 100000)} - ${Math.round((r.avg_salary_max || 2000000) / 100000)} LPA`,
    requiredSkills: r.required_skills || [],
    niceToHave: r.nice_to_have || [],
  }));

  const systemInstruction = `You are a Principal Career & Education Advisor AI for Indian engineering and computer science students.
Analyze the student's profile across academics, technical skills, soft skills, projects, work experience, certifications, and career preferences against industry standards and the available target roles.
You MUST output ONLY a valid, raw JSON object matching the requested schema without any markdown formatting or commentary.`;

  const userPrompt = `
STUDENT PROFILE:
- Name: ${studentProfile.name || "Student"}
- Academics: ${JSON.stringify(studentProfile.academics || [])}
- Technical Skills: ${JSON.stringify(studentProfile.skills?.filter((s) => s.skill_category === "technical" || s.skill_category === "tool") || [])}
- Soft Skills: ${JSON.stringify(studentProfile.skills?.filter((s) => s.skill_category === "soft" || s.skill_category === "language") || [])}
- Career Preferences: ${JSON.stringify(studentProfile.preferences || {})}
- Showcase Projects: ${JSON.stringify(studentProfile.projects || [])}
- Internships & Experience: ${JSON.stringify(studentProfile.experiences || [])}
- Certifications: ${JSON.stringify(studentProfile.certifications || [])}

AVAILABLE TARGET CAREER ROLES CATALOG:
${JSON.stringify(rolesSummary, null, 2)}

INSTRUCTIONS:
1. Recommend the top 3 to 5 most suitable career roles ranked from highest to lowest suitability score (0 to 100).
2. For each recommended role:
   - Calculate realistic suitabilityScore based on skill overlap, projects, and academic background.
   - List matchingSkills (skills student already possesses).
   - List missingSkills (skills student needs to acquire with priority: 'critical', 'high', 'medium', or 'low').
   - Provide clear, actionable reasoning and a recommendedNextStep.

OUTPUT SCHEMA (Respond strictly with this JSON structure):
{
  "summary": "Concise summary of student strengths and career readiness",
  "recommendedRoles": [
    {
      "roleTitle": "Full Stack Developer",
      "slug": "full-stack-developer",
      "suitabilityScore": 92,
      "domain": "Software Engineering",
      "marketOutlook": "High Demand (+28% YoY)",
      "salaryRange": "₹8 - 25 LPA",
      "reasoning": "Detailed justification connecting student skills & projects to role expectations",
      "matchingSkills": [
        { "name": "React", "level": "intermediate" },
        { "name": "Node.js", "level": "intermediate" }
      ],
      "missingSkills": [
        { "name": "Docker", "priority": "critical" },
        { "name": "System Design", "priority": "high" }
      ],
      "recommendedNextStep": "Complete a microservices & Docker deployment project"
    }
  ]
}
`;

  return { systemInstruction, userPrompt };
}

module.exports = { buildRecommendationPrompt };

