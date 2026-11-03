/**
 * Deterministic Skill Gap Analysis Engine
 * Calculates mathematically sound, reproducible skill-match and skill-gap percentages,
 * and categorizes competencies into Missing, Improving, and Meeting buckets.
 */

const PROFICIENCY_MAP = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
};

const LEVEL_LABEL_MAP = {
  0: "Not Acquired",
  1: "Beginner",
  2: "Intermediate",
  3: "Advanced",
  4: "Expert",
};

/**
 * Normalizes proficiency string or number to integer scale 1-4
 */
function parseProficiency(level) {
  if (typeof level === "number" && level >= 1 && level <= 4) {
    return Math.round(level);
  }
  if (typeof level === "string") {
    const clean = level.toLowerCase().trim();
    if (PROFICIENCY_MAP[clean]) return PROFICIENCY_MAP[clean];
    const parsedNum = parseInt(clean, 10);
    if (!isNaN(parsedNum) && parsedNum >= 1 && parsedNum <= 4) return parsedNum;
  }
  return 1; // Default to Beginner
}

/**
 * Clean string for tolerant/fuzzy skill name matching
 * (e.g. "React.js" matches "React", "NodeJS" matches "Node.js")
 */
function cleanSkillName(name) {
  return (name || "").toLowerCase().replace(/[\.\s_\-#\+]/g, "").trim();
}

function areSkillsMatching(nameA, nameB) {
  const a = cleanSkillName(nameA);
  const b = cleanSkillName(nameB);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

/**
 * Performs pure deterministic skill gap analysis
 *
 * @param {Array<object>} studentSkills - Student's skills from profile
 * @param {Array<object>} requiredSkills - Structured skill requirements for the target role
 * @returns {object} Analysis result
 */
function calculateSkillGap(studentSkills = [], requiredSkills = []) {
  if (!requiredSkills || requiredSkills.length === 0) {
    throw new Error("No required skills provided for career role analysis.");
  }

  const missingSkills = [];
  const improvingSkills = [];
  const meetingSkills = [];

  let totalRequiredPoints = 0;
  let totalAcquiredPoints = 0;

  for (const req of requiredSkills) {
    const requiredLevel = parseProficiency(req.required_level || req.requiredLevel || 2);
    const importance = (req.importance || "high").toLowerCase();
    const category = (req.skill_category || req.category || "technical").toLowerCase();
    const whyNeeded = req.why_needed || req.whyNeeded || `Core capability required for professional execution.`;

    // Multiplier based on role importance: Critical (x1.5), High (x1.2), Medium (x1.0), Low (x0.8)
    const weight = importance === "critical" ? 1.5 : importance === "high" ? 1.2 : importance === "medium" ? 1.0 : 0.8;
    totalRequiredPoints += requiredLevel * weight;

    // Search for matching skill in student's profile
    const matchedStudentSkill = studentSkills.find((s) =>
      areSkillsMatching(s.skill_name || s.name, req.skill_name || req.name)
    );

    if (!matchedStudentSkill) {
      // 1. Completely Missing Skill
      missingSkills.push({
        name: req.skill_name || req.name,
        category,
        currentLevel: 0,
        currentLevelLabel: LEVEL_LABEL_MAP[0],
        requiredLevel,
        requiredLevelLabel: LEVEL_LABEL_MAP[requiredLevel],
        gap: requiredLevel,
        gapScore: Math.round((requiredLevel / 4) * 100),
        priority: importance === "critical" ? "critical" : importance === "high" ? "high" : "medium",
        status: "missing",
        whyNeeded,
      });
    } else {
      const currentLevel = parseProficiency(matchedStudentSkill.proficiency_level || matchedStudentSkill.proficiencyLevel);
      const pointsContributed = Math.min(currentLevel, requiredLevel) * weight;
      totalAcquiredPoints += pointsContributed;

      if (currentLevel < requiredLevel) {
        // 2. Skill Requiring Improvement (Proficiency below required)
        const gap = requiredLevel - currentLevel;
        improvingSkills.push({
          name: req.skill_name || req.name,
          category,
          currentLevel,
          currentLevelLabel: LEVEL_LABEL_MAP[currentLevel],
          requiredLevel,
          requiredLevelLabel: LEVEL_LABEL_MAP[requiredLevel],
          gap,
          gapScore: Math.round((gap / 4) * 100),
          priority: importance === "critical" || gap >= 2 ? "high" : "medium",
          status: "improving",
          whyNeeded,
        });
      } else {
        // 3. Meets or Exceeds Requirements
        meetingSkills.push({
          name: req.skill_name || req.name,
          category,
          currentLevel,
          currentLevelLabel: LEVEL_LABEL_MAP[currentLevel],
          requiredLevel,
          requiredLevelLabel: LEVEL_LABEL_MAP[requiredLevel],
          gap: 0,
          gapScore: 0,
          status: currentLevel > requiredLevel ? "exceeding" : "meeting",
          whyNeeded,
        });
      }
    }
  }

  // Calculate overall match & gap percentages
  const rawMatch = totalRequiredPoints > 0 ? (totalAcquiredPoints / totalRequiredPoints) * 100 : 0;
  const overallMatchPercentage = Math.min(100, Math.max(0, Math.round(rawMatch * 10) / 10));
  const overallGapPercentage = Math.round((100 - overallMatchPercentage) * 10) / 10;

  return {
    overallMatchPercentage,
    overallGapPercentage,
    totalSkillsEvaluated: requiredSkills.length,
    missingCount: missingSkills.length,
    improvingCount: improvingSkills.length,
    meetingCount: meetingSkills.length,
    missingSkills,
    improvingSkills,
    meetingSkills,
  };
}

module.exports = {
  calculateSkillGap,
  parseProficiency,
  cleanSkillName,
  areSkillsMatching,
  LEVEL_LABEL_MAP,
  PROFICIENCY_MAP,
};

