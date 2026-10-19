const { getDb } = require("../config/db");

// Predefined role keyword dictionaries for ATS analysis
const ROLE_KEYWORDS = {
  "software engineer": ["java", "python", "data structures", "algorithms", "git", "sql", "rest api", "unit testing", "ci/cd", "system design", "microservices"],
  "full stack developer": ["javascript", "react", "node.js", "express", "html5", "css3", "typescript", "mongodb", "postgresql", "rest api", "git", "tailwind css"],
  "data scientist": ["python", "machine learning", "pandas", "numpy", "scikit-learn", "sql", "tableau", "deep learning", "statistics", "data visualization", "tensorflow"],
  "ai / ml engineer": ["python", "pytorch", "tensorflow", "deep learning", "nlp", "computer vision", "llm", "transformers", "docker", "cuda", "fastapi"],
  "cloud & devops engineer": ["aws", "docker", "kubernetes", "terraform", "ci/cd", "linux", "bash", "jenkins", "prometheus", "git", "monitoring"],
  "cyber security analyst": ["network security", "linux", "siem", "wireshark", "penetration testing", "vulnerability assessment", "owasp", "incident response", "firewalls"],
};

const ACTION_VERBS = [
  "architected", "spearheaded", "developed", "engineered", "implemented", "optimized",
  "automated", "deployed", "scaled", "reduced", "increased", "accelerated", "designed",
  "refactored", "orchestrated", "collaborated", "managed", "integrated", "constructed"
];

/**
 * POST /api/resume/analyze
 * Body: { resumeText, targetRole }
 */
async function analyzeResume(req, res) {
  try {
    const sql = getDb();
    const userId = req.user ? req.user.id : null;
    const { resumeText, targetRole } = req.body;

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid resume text (at least 50 characters).",
      });
    }

    const lowerText = resumeText.toLowerCase();

    // 1. Role keyword matching
    const roleKey = (targetRole || "software engineer").toLowerCase().trim();
    const targetKeywords = ROLE_KEYWORDS[roleKey] || ROLE_KEYWORDS["software engineer"];

    const matchedKeywords = targetKeywords.filter(kw => lowerText.includes(kw));
    const missingKeywords = targetKeywords.filter(kw => !lowerText.includes(kw));
    const keywordsScore = Math.round((matchedKeywords.length / targetKeywords.length) * 100);

    // 2. Action verbs analysis
    const foundVerbs = ACTION_VERBS.filter(verb => lowerText.includes(verb));
    const verbsScore = Math.min(100, Math.round((foundVerbs.length / 5) * 100));

    // 3. Measurable impact detection (numbers, percentages, metrics)
    const metricRegex = /\b\d+(\.\d+)?(%|x|\s*(ms|seconds|minutes|hours|users|requests|customers|queries|lpa|k))\b/gi;
    const metricMatches = resumeText.match(metricRegex) || [];
    const impactScore = Math.min(100, metricMatches.length * 20);

    // 4. Formatting and standard sections check
    const sections = ["education", "skills", "experience", "projects"];
    const foundSections = sections.filter(sec => lowerText.includes(sec));
    const formattingScore = Math.round((foundSections.length / sections.length) * 100);

    // Total ATS weighted score
    const atsScore = Math.round(
      keywordsScore * 0.4 +
      verbsScore * 0.2 +
      impactScore * 0.2 +
      formattingScore * 0.2
    );

    // Detailed feedback recommendations
    const feedback = {
      strengths: [],
      improvements: [],
      metricCount: metricMatches.length,
      actionVerbsCount: foundVerbs.length,
      missingSections: sections.filter(sec => !lowerText.includes(sec)),
      bulletPointRewrites: [
        {
          original: "Worked on frontend and backend using React and Node.",
          improved: "Engineered scalable full-stack features using React and Node.js, improving page response times by 35%.",
          reason: "Uses strong action verb ('Engineered') and quantifiable impact metric ('35%').",
        },
        {
          original: "Responsible for database queries and bug fixes.",
          improved: "Optimized PostgreSQL relational queries and resolved critical defects, accelerating query throughput by 40%.",
          reason: "Avoid passive phrase 'Responsible for' in favor of high-impact action verbs.",
        }
      ]
    };

    if (keywordsScore >= 70) {
      feedback.strengths.push(`Strong alignment with target role keywords (${matchedKeywords.length}/${targetKeywords.length} matched).`);
    } else {
      feedback.improvements.push(`Add essential missing keywords for ${targetRole}: ${missingKeywords.slice(0, 5).join(", ")}`);
    }

    if (impactScore < 50) {
      feedback.improvements.push("Add quantifiable metrics (e.g., 'reduced load time by 30%', 'handled 10k+ requests').");
    } else {
      feedback.strengths.push("Excellent use of data-driven and quantifiable achievement metrics.");
    }

    if (formattingScore < 100) {
      feedback.improvements.push(`Include clearly labeled sections: ${feedback.missingSections.join(", ")}.`);
    }

    // Save to DB if logged in
    let savedAnalysisId = null;
    if (userId) {
      const [saved] = await sql`
        INSERT INTO resume_analyses (
          user_id, target_role, ats_score, keywords_score, formatting_score,
          impact_score, matched_keywords, missing_keywords, action_verbs_found, feedback
        ) VALUES (
          ${userId}, ${targetRole || "Software Engineer"}, ${atsScore}, ${keywordsScore}, ${formattingScore},
          ${impactScore}, ${matchedKeywords}, ${missingKeywords}, ${foundVerbs}, ${JSON.stringify(feedback)}
        )
        RETURNING id
      `;
      savedAnalysisId = saved.id;
    }

    res.json({
      success: true,
      data: {
        analysisId: savedAnalysisId,
        atsScore,
        breakdown: {
          keywordsScore,
          verbsScore,
          impactScore,
          formattingScore,
        },
        matchedKeywords,
        missingKeywords,
        actionVerbsFound: foundVerbs,
        feedback,
      },
    });
  } catch (error) {
    console.error("Resume analysis error:", error);
    res.status(500).json({ success: false, message: "Failed to analyze resume." });
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
      SELECT id, target_role, ats_score, keywords_score, formatting_score, impact_score, created_at
      FROM resume_analyses
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 10
    `;

    res.json({ success: true, data: history });
  } catch (error) {
    console.error("Get resume history error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch resume history." });
  }
}

/**
 * GET /api/resume/target-roles
 */
function getTargetRoles(req, res) {
  const roles = Object.keys(ROLE_KEYWORDS).map(role => ({
    name: role.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    keywords: ROLE_KEYWORDS[role],
  }));
  res.json({ success: true, data: roles });
}

/**
 * POST /api/resume/enhance-bullet
 * Body: { bulletPoint }
 */
function enhanceBulletPoint(req, res) {
  const { bulletPoint } = req.body;
  if (!bulletPoint) {
    return res.status(400).json({ success: false, message: "bulletPoint string is required." });
  }

  const improved = `Spearheaded ${bulletPoint.replace(/^(worked on|helped with|responsible for)\s*/i, "")}, boosting overall efficiency by 25% and delivering ahead of schedule.`;

  res.json({
    success: true,
    data: {
      original: bulletPoint,
      enhanced: improved,
      formula: "Accomplished [X] as measured by [Y], by doing [Z]",
    },
  });
}

module.exports = {
  analyzeResume,
  getAnalysisHistory,
  getTargetRoles,
  enhanceBulletPoint,
};
