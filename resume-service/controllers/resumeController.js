const { getDb } = require("../config/db");
const aiManager = require("../adapters/aiManager");

// Static keyword fallback dictionaries
const FALLBACK_ROLE_KEYWORDS = {
  "software engineer": ["java", "python", "data structures", "algorithms", "git", "sql", "rest api", "unit testing", "ci/cd", "system design", "microservices"],
  "full stack developer": ["javascript", "react", "node.js", "express", "html5", "css3", "typescript", "mongodb", "postgresql", "rest api", "git", "docker"],
  "data scientist": ["python", "machine learning", "pandas", "numpy", "scikit-learn", "sql", "tableau", "deep learning", "statistics", "data visualization", "tensorflow"],
  "ai / ml engineer": ["python", "pytorch", "tensorflow", "deep learning", "nlp", "computer vision", "llm", "transformers", "docker", "cuda", "fastapi"],
  "cloud & devops engineer": ["aws", "docker", "kubernetes", "terraform", "ci/cd", "linux", "bash", "jenkins", "prometheus", "git", "cloud architecture"],
  "cyber security analyst": ["network security", "linux", "siem", "wireshark", "penetration testing", "vulnerability assessment", "owasp", "incident response", "firewalls"],
};

/**
 * POST /api/resume/analyze
 * Body: { resumeText, targetRole }
 */
async function analyzeResume(req, res) {
  try {
    const sql = getDb();
    const userId = req.user ? req.user.id : null;
    const { resumeText, targetRole = "Full Stack Developer" } = req.body;

    if (!resumeText || resumeText.trim().length < 30) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid resume text (at least 30 characters).",
      });
    }

    // 1. Fetch dynamic keywords from career_roles & role_skill_requirements
    let targetKeywords = [];
    try {
      const [role] = await sql`
        SELECT id, title, required_skills, nice_to_have FROM career_roles
        WHERE title ILIKE ${`%${targetRole}%`} OR slug ILIKE ${`%${targetRole}%`}
        LIMIT 1
      `;

      if (role) {
        targetKeywords = [...(role.required_skills || []), ...(role.nice_to_have || [])];
        const reqs = await sql`SELECT skill_name FROM role_skill_requirements WHERE role_id = ${role.id}`;
        if (reqs.length > 0) {
          targetKeywords = [...new Set([...targetKeywords, ...reqs.map((r) => r.skill_name)])];
        }
      }
    } catch (dbErr) {
      console.warn("Could not query DB career roles for keywords:", dbErr.message);
    }

    if (targetKeywords.length === 0) {
      const roleKey = targetRole.toLowerCase().trim();
      targetKeywords = FALLBACK_ROLE_KEYWORDS[roleKey] || FALLBACK_ROLE_KEYWORDS["software engineer"];
    }

    // 2. Execute multi-provider AI Analysis (Gemini -> Groq -> Heuristic)
    const { analysis, providerUsed, fallbackNotice } = await aiManager.analyzeResume(
      resumeText,
      targetRole,
      targetKeywords
    );

    // 3. Save to database if student is logged in
    let savedAnalysisId = null;
    if (userId) {
      const [saved] = await sql`
        INSERT INTO resume_analyses (
          user_id, target_role, ats_score, keywords_score, formatting_score,
          impact_score, matched_keywords, missing_keywords, action_verbs_found, feedback
        ) VALUES (
          ${userId},
          ${targetRole},
          ${analysis.atsScore},
          ${analysis.breakdown.keywordsScore},
          ${analysis.breakdown.formattingScore},
          ${analysis.breakdown.impactScore},
          ${analysis.matchedKeywords},
          ${analysis.missingKeywords},
          ${analysis.actionVerbsFound},
          ${JSON.stringify({
            ...analysis.feedback,
            candidateInfo: analysis.candidateInfo,
            verbsScore: analysis.breakdown.verbsScore,
            providerUsed,
          })}
        )
        RETURNING id
      `;
      savedAnalysisId = saved.id;
    }

    res.json({
      success: true,
      providerUsed,
      fallbackNotice: fallbackNotice || null,
      data: {
        analysisId: savedAnalysisId,
        targetRole,
        atsScore: analysis.atsScore,
        breakdown: analysis.breakdown,
        candidateInfo: analysis.candidateInfo,
        matchedKeywords: analysis.matchedKeywords,
        missingKeywords: analysis.missingKeywords,
        actionVerbsFound: analysis.actionVerbsFound,
        feedback: analysis.feedback,
      },
    });
  } catch (error) {
    console.error("Resume analysis error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to analyze resume." });
  }
}

/**
 * GET /api/resume/history
 */
async function getAnalysisHistory(req, res) {
  try {
    const sql = getDb();
    const userId = req.user.id;

    const history = await sql`
      SELECT id, target_role, ats_score, keywords_score, formatting_score, impact_score,
             matched_keywords, missing_keywords, feedback, created_at
      FROM resume_analyses
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 10
    `;

    res.json({ success: true, count: history.length, data: history });
  } catch (error) {
    console.error("Get resume history error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch resume history." });
  }
}

/**
 * GET /api/resume/target-roles
 */
async function getTargetRoles(req, res) {
  try {
    const sql = getDb();
    const dbRoles = await sql`SELECT id, title, slug, category, required_skills FROM career_roles ORDER BY title`;

    if (dbRoles.length > 0) {
      return res.json({
        success: true,
        data: dbRoles.map((r) => ({
          id: r.id,
          name: r.title,
          slug: r.slug,
          category: r.category,
          keywords: r.required_skills || [],
        })),
      });
    }

    // Fallback
    const fallback = Object.keys(FALLBACK_ROLE_KEYWORDS).map((role) => ({
      name: role.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
      keywords: FALLBACK_ROLE_KEYWORDS[role],
    }));
    res.json({ success: true, data: fallback });
  } catch (e) {
    const fallback = Object.keys(FALLBACK_ROLE_KEYWORDS).map((role) => ({
      name: role.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
      keywords: FALLBACK_ROLE_KEYWORDS[role],
    }));
    res.json({ success: true, data: fallback });
  }
}

/**
 * POST /api/resume/enhance-bullet
 * Body: { bulletPoint, role }
 */
function enhanceBulletPoint(req, res) {
  const { bulletPoint, role = "Software Engineer" } = req.body;
  if (!bulletPoint || bulletPoint.trim().length === 0) {
    return res.status(400).json({ success: false, message: "bulletPoint string is required." });
  }

  const cleaned = bulletPoint.replace(/^(worked on|helped with|responsible for|part of|involved in)\s*/i, "").trim();
  const enhanced = `Architected and deployed ${cleaned}, streamlining core workflows and improving operational throughput by 34% within production environments.`;

  res.json({
    success: true,
    data: {
      original: bulletPoint,
      enhanced,
      formula: "Accomplished [X] as measured by [Y], by doing [Z] (Google XYZ Formula)",
    },
  });
}

module.exports = {
  analyzeResume,
  getAnalysisHistory,
  getTargetRoles,
  enhanceBulletPoint,
};
