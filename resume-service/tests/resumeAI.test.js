const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const assert = require("assert");

const { buildResumePrompt, generateHeuristicResumeAnalysis } = require("../adapters/resumePromptBuilder");
const aiManager = require("../adapters/aiManager");
const { getDb } = require("../config/db");

const mockResumeText = `
Amit Sharma
Email: amit@example.com | Phone: +91 9876543210 | Bangalore, India
LinkedIn: linkedin.com/in/amitsharma | GitHub: github.com/amitsharma

SUMMARY
Passionate Full-Stack Developer with hands-on experience building web applications and microservices using React, Node.js, and PostgreSQL.

EDUCATION
B.Tech in Computer Science and Engineering | CGPA: 8.9 / 10 | 2022 - 2026

TECHNICAL SKILLS
Languages: JavaScript, TypeScript, Python, SQL
Frontend: React, Next.js, HTML5, CSS3, Tailwind CSS
Backend: Node.js, Express.js, REST APIs, Microservices
Databases: PostgreSQL, MongoDB, Redis
DevOps & Tools: Docker, Git, Linux, Postman

EXPERIENCE
Full Stack Developer Intern | Tech Innovations
- Architected RESTful microservices using Node.js and Express, improving API response latency by 35%.
- Engineered responsive React dashboard interfaces used by 10,000+ active monthly users.
- Optimized database indexing in PostgreSQL, reducing complex query duration by 40%.

PROJECTS
E-Commerce Microservices Platform
- Implemented decoupled authentication service with JWT and refresh tokens.
- Containerized services with Docker Compose, automating local deployment in under 2 minutes.
`;

async function runTestSuite() {
  console.log("==============================================================");
  console.log("  AI-POWERED RESUME ANALYSIS TEST SUITE");
  console.log("==============================================================\n");

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}`);
      console.error(`         Error: ${err.message}`);
      failed++;
    }
  }

  // ── TEST 1: Prompt Builder Structure ────────────────────────
  await test("ResumePromptBuilder constructs prompt and enforces JSON schema", () => {
    const { systemInstruction, userPrompt } = buildResumePrompt(mockResumeText, "Full Stack Developer", ["React", "Node.js", "Docker"]);
    assert.ok(systemInstruction.includes("Technical Recruiter"));
    assert.ok(userPrompt.includes("Full Stack Developer"));
    assert.ok(userPrompt.includes("Amit Sharma"));
    assert.ok(userPrompt.includes("Docker"));
  });

  // ── TEST 2: Deterministic Heuristic ATS Scoring ─────────────
  await test("HeuristicResumeEngine computes ATS score & categorizes keywords", () => {
    const result = generateHeuristicResumeAnalysis(mockResumeText, "Full Stack Developer", ["React", "Node.js", "Docker", "Kubernetes"]);
    assert.ok(result.atsScore >= 70, `Expected ATS score >= 70, got ${result.atsScore}`);
    assert.ok(result.breakdown.keywordsScore > 0);
    assert.ok(result.breakdown.verbsScore > 0);
    assert.ok(result.breakdown.impactScore > 0);
    assert.ok(result.breakdown.formattingScore === 100);

    // Verify keywords
    assert.ok(result.matchedKeywords.includes("React"));
    assert.ok(result.matchedKeywords.includes("Node.js"));
    assert.ok(result.matchedKeywords.includes("Docker"));
    assert.ok(result.missingKeywords.includes("Kubernetes"));

    // Verify bullet rewrites
    assert.ok(result.feedback.bulletPointRewrites.length > 0);
  });

  // ── TEST 3: AI Manager Schema Validation & Clamping ─────────
  await test("AIManager validates resume output and clamps scores within 10-100", () => {
    const rawData = {
      atsScore: 120, // should clamp to 100
      breakdown: { keywordsScore: 5 }, // should clamp to 10
      matchedKeywords: ["React"],
    };

    const validated = aiManager.validateResumeOutput(rawData, "Full Stack Developer");
    assert.strictEqual(validated.atsScore, 100);
    assert.strictEqual(validated.breakdown.keywordsScore, 10);
    assert.deepStrictEqual(validated.matchedKeywords, ["React"]);
  });

  // ── TEST 4: Full Multi-Provider AI Failover Execution ───────
  await test("AIManager analyzes resume with failover provider support", async () => {
    const { analysis, providerUsed } = await aiManager.analyzeResume(
      mockResumeText,
      "Full Stack Developer",
      ["React", "Node.js", "PostgreSQL", "Docker"]
    );

    assert.ok(analysis.atsScore > 50);
    assert.ok(typeof providerUsed === "string");
    assert.ok(analysis.feedback.strengths.length > 0);
  });

  // ── TEST 5: Database Persistence in resume_analyses ─────────
  await test("Resume analysis persists into Neon DB resume_analyses table", async () => {
    const sql = getDb();
    const [student] = await sql`SELECT id FROM users WHERE role = 'student' LIMIT 1`;
    assert.ok(student, "A student user must exist");

    const analysisResult = generateHeuristicResumeAnalysis(mockResumeText, "Full Stack Developer", ["React", "Node.js"]);

    const [saved] = await sql`
      INSERT INTO resume_analyses (
        user_id, target_role, ats_score, keywords_score, formatting_score,
        impact_score, matched_keywords, missing_keywords, action_verbs_found, feedback
      ) VALUES (
        ${student.id}, 'Full Stack Developer', ${analysisResult.atsScore},
        ${analysisResult.breakdown.keywordsScore}, ${analysisResult.breakdown.formattingScore},
        ${analysisResult.breakdown.impactScore}, ${analysisResult.matchedKeywords},
        ${analysisResult.missingKeywords}, ${analysisResult.actionVerbsFound},
        ${JSON.stringify(analysisResult.feedback)}
      )
      RETURNING id, created_at
    `;

    assert.ok(saved.id, "Must return created record ID");

    // Query back
    const [retrieved] = await sql`SELECT * FROM resume_analyses WHERE id = ${saved.id}`;
    assert.strictEqual(retrieved.user_id, student.id);
    assert.strictEqual(retrieved.target_role, "Full Stack Developer");
    assert.strictEqual(retrieved.ats_score, analysisResult.atsScore);
  });

  console.log("\n==============================================================");
  console.log(`  RESUME ANALYSIS TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log("==============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test runner crashed:", err);
  process.exit(1);
});
