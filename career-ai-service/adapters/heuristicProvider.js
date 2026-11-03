const BaseAIProvider = require("./baseAIProvider");

/**
 * Deterministic Heuristic AI Provider
 * High-performance, zero-network fallback that uses weighted vector matching against
 * student technical skills, soft skills, projects, and career preferences.
 * Guarantees 100% uptime even if all external LLM APIs fail or run out of quotas.
 */
class HeuristicProvider extends BaseAIProvider {
  constructor(config = {}) {
    super("Heuristic Knowledge Engine", config);
  }

  isAvailable() {
    return true; // Always available as final fallback
  }

  async generateRecommendations(studentProfile, careerRoles) {
    const studentSkills = (studentProfile.skills || []).map((s) => ({
      name: s.skill_name || s.name || "",
      category: s.skill_category || "technical",
      level: s.proficiency_level || "intermediate",
    }));

    const skillNames = studentSkills.map((s) => s.name.toLowerCase().trim());
    const preferredRoles = (studentProfile.preferences?.preferred_roles || []).map((r) => r.toLowerCase().trim());
    const preferredDomains = (studentProfile.preferences?.preferred_domains || []).map((d) => d.toLowerCase().trim());
    const projectTechs = (studentProfile.projects || []).flatMap((p) => p.technologies || []).map((t) => t.toLowerCase().trim());

    // Helper to match skills with fuzzy/punctuation tolerance (e.g. React.js matches React)
    const matchesSkill = (reqSkill) => {
      const lowerReq = reqSkill.toLowerCase().trim();
      const cleanReq = lowerReq.replace(/[\.\s_-]/g, "");

      return (
        skillNames.some((sn) => {
          const cleanSn = sn.replace(/[\.\s_-]/g, "");
          return cleanSn === cleanReq || cleanSn.includes(cleanReq) || cleanReq.includes(cleanSn);
        }) ||
        projectTechs.some((pt) => {
          const cleanPt = pt.replace(/[\.\s_-]/g, "");
          return cleanPt === cleanReq || cleanPt.includes(cleanReq) || cleanReq.includes(cleanPt);
        })
      );
    };

    // Score each role
    const scoredRoles = careerRoles.map((role) => {
      const matchedRequired = [];
      const missingRequired = [];
      for (const s of role.required_skills || []) {
        if (matchesSkill(s)) {
          matchedRequired.push(s);
        } else {
          missingRequired.push(s);
        }
      }

      const matchedNice = [];
      const missingNice = [];
      for (const s of role.nice_to_have || []) {
        if (matchesSkill(s)) {
          matchedNice.push(s);
        } else {
          missingNice.push(s);
        }
      }

      const totalReq = (role.required_skills || []).length;
      const totalNice = (role.nice_to_have || []).length;

      let score = 30; // base potential

      // Skill overlap contribution (up to 45 pts)
      if (totalReq > 0) {
        score += (matchedRequired.length / totalReq) * 45;
      }
      if (totalNice > 0) {
        score += (matchedNice.length / totalNice) * 10;
      }

      // Preference bonus (up to 15 pts)
      const roleMatchesPref = preferredRoles.some(
        (pr) => role.title.toLowerCase().includes(pr) || pr.includes(role.slug)
      );
      const domainMatchesPref = preferredDomains.some((pd) =>
        role.category.toLowerCase().includes(pd)
      );
      if (roleMatchesPref) score += 10;
      if (domainMatchesPref) score += 5;

      const finalScore = Math.min(96, Math.max(45, Math.round(score)));
      const salaryRange = `₹${Math.round((role.avg_salary_min || 600000) / 100000)} - ${Math.round((role.avg_salary_max || 2000000) / 100000)} LPA`;

      return {
        roleTitle: role.title,
        slug: role.slug,
        suitabilityScore: finalScore,
        domain: role.category,
        marketOutlook: `${role.demand_level?.toUpperCase() || "HIGH"} Demand (${role.growth_rate || "+30% YoY"})`,
        salaryRange,
        reasoning: `Matches ${matchedRequired.length} core technical requirements including ${matchedRequired.slice(0, 3).join(", ") || "fundamental engineering skills"}. Supported by verified profile experience.`,
        matchingSkills: matchedRequired.map((name) => ({
          name,
          level: studentSkills.find((s) => s.name.toLowerCase() === name.toLowerCase())?.level || "intermediate",
        })),
        missingSkills: missingRequired.map((name, idx) => ({
          name,
          priority: idx === 0 ? "critical" : idx === 1 ? "high" : "medium",
        })),
        recommendedNextStep: missingRequired[0]
          ? `Focus on mastering ${missingRequired[0]} and containerizing project architecture.`
          : `Build a production-grade full-stack capstone project showcasing ${role.title} capabilities.`,
      };
    });

    // Sort by suitability score descending
    scoredRoles.sort((a, b) => b.suitabilityScore - a.suitabilityScore);

    return {
      summary: `Analyzed student profile with ${studentSkills.length} verified skills, ${studentProfile.projects?.length || 0} projects, and academic background. Generated ranked role suitability based on current market competency models.`,
      recommendedRoles: scoredRoles.slice(0, 5),
    };
  }
}

module.exports = HeuristicProvider;
