/**
 * Builds structured prompts for AI Skill Gap Explanation & Action Planning
 */
function buildSkillGapPrompt(role, analysis, student) {
  const missingSummary = analysis.missingSkills.map((s) => ({
    name: s.name,
    category: s.category,
    requiredLevel: s.requiredLevelLabel,
    priority: s.priority,
  }));

  const improvingSummary = analysis.improvingSkills.map((s) => ({
    name: s.name,
    category: s.category,
    currentLevel: s.currentLevelLabel,
    requiredLevel: s.requiredLevelLabel,
    gap: s.gap,
  }));

  const meetingSummary = analysis.meetingSkills.map((s) => ({
    name: s.name,
    category: s.category,
    currentLevel: s.currentLevelLabel,
  }));

  const systemInstruction = `You are a Senior Technical Career Architect and Engineering Mentor.
You provide precise, actionable, and encouraging skill-gap diagnoses for aspiring software and engineering students.
You MUST output ONLY a valid raw JSON object matching the requested schema without markdown codeblocks or commentary.`;

  const userPrompt = `
TARGET CAREER ROLE:
- Title: ${role.title}
- Domain: ${role.category}
- Description: ${role.description}

DETERMINISTIC ANALYSIS METRICS:
- Overall Skill Match: ${analysis.overallMatchPercentage}%
- Overall Skill Gap: ${analysis.overallGapPercentage}%
- Total Skills Evaluated: ${analysis.totalSkillsEvaluated}

SKILL CATEGORIZATION:
- Completely Missing (${analysis.missingCount}): ${JSON.stringify(missingSummary)}
- Requiring Improvement (${analysis.improvingCount}): ${JSON.stringify(improvingSummary)}
- Meeting / Exceeding (${analysis.meetingCount}): ${JSON.stringify(meetingSummary)}

STUDENT CONTEXT:
- Name: ${student.name || "Student"}
- Degree/Background: ${JSON.stringify(student.academics || [])}
- Active Projects: ${JSON.stringify(student.projects || [])}

INSTRUCTIONS:
Generate a personalized, industry-grade skill-gap report with:
1. "executiveSummary": An empowering 2-3 sentence overview explaining where the student stands today and their readiness trajectory.
2. "strategicFocus": Top 3 high-impact skills to focus on first.
3. "skillExplanations": Array of explanations for each missing or improving skill containing:
   - "skillName": exact name
   - "industrySignificance": 1-2 sentences on how this skill is used daily in this role.
   - "recommendedAction": specific project, tool, or practice milestone to bridge the gap.
4. "phasedRoadmap":
   - "immediate": (Weeks 1-4) foundational gaps
   - "intermediate": (Weeks 5-8) intermediate tools & integration
   - "capstone": (Weeks 9-12) end-to-end production project

OUTPUT SCHEMA:
{
  "executiveSummary": "...",
  "strategicFocus": ["Skill 1", "Skill 2", "Skill 3"],
  "skillExplanations": [
    {
      "skillName": "Docker",
      "industrySignificance": "Critical for standardizing container environments in microservice deployments.",
      "recommendedAction": "Containerize your current Node.js and React app with docker-compose."
    }
  ],
  "phasedRoadmap": {
    "immediate": "...",
    "intermediate": "...",
    "capstone": "..."
  }
}
`;

  return { systemInstruction, userPrompt };
}

/**
 * Deterministic fallback generator for skill gap explanations
 * Used when external LLMs are unavailable
 */
function generateHeuristicSkillGapExplanations(role, analysis, student) {
  const strategicFocus = [
    ...analysis.missingSkills.filter((s) => s.priority === "critical").map((s) => s.name),
    ...analysis.improvingSkills.map((s) => s.name),
    ...analysis.missingSkills.map((s) => s.name),
  ].slice(0, 3);

  const allGaps = [...analysis.missingSkills, ...analysis.improvingSkills];

  const skillExplanations = allGaps.map((g) => ({
    skillName: g.name,
    industrySignificance: g.whyNeeded || `Crucial competency for high-performance ${role.title} positions.`,
    recommendedAction: g.currentLevel === 0
      ? `Study fundamentals of ${g.name} and build a starter prototype demonstrating ${g.requiredLevelLabel} proficiency.`
      : `Advance your ${g.name} capability from ${g.currentLevelLabel} to ${g.requiredLevelLabel} through real-world implementation.`,
  }));

  const executiveSummary = `You currently possess a ${analysis.overallMatchPercentage}% skill alignment with the ${role.title} profile, demonstrating ${analysis.meetingCount} verified competencies. Bridging ${analysis.missingCount} missing skills and upgrading ${analysis.improvingCount} existing capabilities will position you strongly for industry hiring.`;

  return {
    executiveSummary,
    strategicFocus: strategicFocus.length > 0 ? strategicFocus : ["Core Technical Specialization"],
    skillExplanations,
    phasedRoadmap: {
      immediate: `Focus on high-priority gaps: ${strategicFocus.slice(0, 2).join(", ") || "Foundations"}.`,
      intermediate: `Integrate ${strategicFocus[2] || "Advanced tooling"} into existing codebases.`,
      capstone: `Deliver a comprehensive portfolio project demonstrating complete ${role.title} stack proficiency.`,
    },
  };
}

module.exports = {
  buildSkillGapPrompt,
  generateHeuristicSkillGapExplanations,
};

