/**
 * Builds structured prompts for Resume ATS Analysis & Bullet Point Optimization
 */

const DEFAULT_ACTION_VERBS = [
  "architected", "spearheaded", "developed", "engineered", "implemented", "optimized",
  "automated", "deployed", "scaled", "reduced", "increased", "accelerated", "designed",
  "refactored", "orchestrated", "collaborated", "managed", "integrated", "constructed"
];

function buildResumePrompt(resumeText, targetRole, targetKeywords = []) {
  const systemInstruction = `You are a Principal Technical Recruiter and ATS (Applicant Tracking System) Specialist at a premier engineering enterprise.
You meticulously audit candidate resumes for role relevance, technical depth, quantifiable impact, and ATS compliance.
You MUST output ONLY a valid raw JSON object matching the requested schema without markdown codeblocks or commentary.`;

  const userPrompt = `
TARGET JOB ROLE:
- Role: ${targetRole}
- Required ATS Competencies: ${JSON.stringify(targetKeywords)}

CANDIDATE RESUME TEXT:
"""
${resumeText.slice(0, 5000)}
"""

INSTRUCTIONS:
1. Extract candidate information (name, detected skills, detected projects, detected sections).
2. Calculate realistic scores (0 to 100):
   - "atsScore": overall weighted composite score
   - "keywordsScore": alignment with ${targetRole} terminology
   - "verbsScore": strong active verbs vs passive phrases
   - "impactScore": presence of quantifiable metrics (%, $, latency, scale, user numbers)
   - "formattingScore": presence of essential sections (Education, Skills, Projects, Experience)
3. Categorize matchedKeywords (skills/tools found in resume) vs missingKeywords (critical keywords absent).
4. Provide structured feedback:
   - "strengths": 2-3 specific positive observations
   - "improvements": 2-3 specific high-impact gaps to fix
   - "bulletPointRewrites": 2-3 bullet point enhancements from the resume transformed using Google's XYZ formula ("Accomplished [X] as measured by [Y], by doing [Z]")

OUTPUT JSON SCHEMA:
{
  "atsScore": 82,
  "breakdown": {
    "keywordsScore": 85,
    "verbsScore": 80,
    "impactScore": 75,
    "formattingScore": 90
  },
  "candidateInfo": {
    "name": "Detected Name or Candidate",
    "extractedSkills": ["React", "Node.js", "Docker"],
    "detectedSections": ["Education", "Skills", "Experience", "Projects"]
  },
  "matchedKeywords": ["React", "Node.js", "Git"],
  "missingKeywords": ["Docker", "Kubernetes", "CI/CD"],
  "actionVerbsFound": ["engineered", "developed", "optimized"],
  "feedback": {
    "summary": "Strong technical foundation in web engineering, but lacks quantifiable business impact metrics.",
    "strengths": ["Clear technical stack enumeration", "Consistent engineering roles"],
    "improvements": ["Add concrete numerical outcomes to project bullets", "Incorporate missing cloud deployment keywords"],
    "bulletPointRewrites": [
      {
        "original": "Worked on backend APIs with Node.js.",
        "improved": "Engineered 12 RESTful microservices using Node.js and Express, reducing API response latency by 28%.",
        "reason": "Replaced weak verb 'Worked on' with 'Engineered' and added quantifiable impact ('reduced latency by 28%')."
      }
    ]
  }
}
`;

  return { systemInstruction, userPrompt };
}

/**
 * Deterministic Heuristic Fallback Analysis
 */
function generateHeuristicResumeAnalysis(resumeText, targetRole, targetKeywords = []) {
  const lower = resumeText.toLowerCase();

  const matchedKeywords = targetKeywords.filter((kw) => lower.includes(kw.toLowerCase()));
  const missingKeywords = targetKeywords.filter((kw) => !lower.includes(kw.toLowerCase()));
  const keywordsScore = targetKeywords.length > 0 ? Math.round((matchedKeywords.length / targetKeywords.length) * 100) : 75;

  const foundVerbs = DEFAULT_ACTION_VERBS.filter((verb) => lower.includes(verb));
  const verbsScore = Math.min(100, Math.round((foundVerbs.length / 5) * 100));

  const metricRegex = /\b\d+(\.\d+)?(%|x|\s*(ms|seconds|minutes|hours|users|requests|customers|queries|lpa|k))\b/gi;
  const metricMatches = resumeText.match(metricRegex) || [];
  const impactScore = Math.min(100, Math.max(30, metricMatches.length * 20));

  const sections = ["education", "skills", "experience", "projects"];
  const foundSections = sections.filter((sec) => lower.includes(sec));
  const formattingScore = Math.round((foundSections.length / sections.length) * 100);

  const atsScore = Math.min(95, Math.max(35, Math.round(
    keywordsScore * 0.4 +
    verbsScore * 0.2 +
    impactScore * 0.2 +
    formattingScore * 0.2
  )));

  const strengths = [];
  const improvements = [];

  if (keywordsScore >= 70) {
    strengths.push(`Strong keyword relevance with ${matchedKeywords.length} matching technical terms for ${targetRole}.`);
  } else {
    improvements.push(`Include essential high-priority keywords: ${missingKeywords.slice(0, 4).join(", ") || "Cloud, CI/CD"}.`);
  }

  if (impactScore >= 60) {
    strengths.push("Good inclusion of measurable data points and quantifiable achievements.");
  } else {
    improvements.push("Incorporate quantifiable impact metrics (e.g. latency reduced by 25%, handled 5,000+ users).");
  }

  if (formattingScore === 100) {
    strengths.push("Follows standard ATS-friendly section headers (Education, Skills, Experience, Projects).");
  } else {
    improvements.push(`Add clearly defined section titles for: ${sections.filter((s) => !foundSections.includes(s)).join(", ")}.`);
  }

  return {
    atsScore,
    breakdown: {
      keywordsScore,
      verbsScore,
      impactScore,
      formattingScore,
    },
    candidateInfo: {
      name: "Resume Candidate",
      extractedSkills: matchedKeywords,
      detectedSections: foundSections,
    },
    matchedKeywords,
    missingKeywords,
    actionVerbsFound: foundVerbs,
    feedback: {
      summary: `Your resume demonstrates ${keywordsScore}% technical alignment with ${targetRole} positions. Enhancing quantifiable results will maximize recruiter callback rates.`,
      strengths,
      improvements,
      bulletPointRewrites: [
        {
          original: "Worked on frontend and backend features for web application.",
          improved: `Architected full-stack features using ${matchedKeywords.slice(0, 2).join(" and ") || "React and Node.js"}, reducing user-facing latency by 32%.`,
          reason: "Applies action verb 'Architected' and concrete metrics demonstrating impact.",
        },
        {
          original: "Helped with database bug fixes and query maintenance.",
          improved: "Optimized relational database queries and resolved production defects, boosting query throughput by 40%.",
          reason: "Eliminates passive language and highlights measurable performance improvements.",
        },
      ],
    },
  };
}

module.exports = {
  buildResumePrompt,
  generateHeuristicResumeAnalysis,
};

