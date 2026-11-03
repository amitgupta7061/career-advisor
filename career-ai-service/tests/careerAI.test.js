const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const assert = require("assert");

// Import adapters and services
const BaseAIProvider = require("../adapters/baseAIProvider");
const GeminiProvider = require("../adapters/geminiProvider");
const GroqProvider = require("../adapters/groqProvider");
const HeuristicProvider = require("../adapters/heuristicProvider");
const aiManager = require("../adapters/aiManager");
const { buildRecommendationPrompt } = require("../adapters/promptBuilder");
const { loadStudentProfileData } = require("../services/profileLoaderService");
const { getDb } = require("../config/db");

// Mock profile for test isolation
const mockStudent = {
  name: "Amit Sharma",
  email: "amit.test@example.com",
  skills: [
    { skill_name: "JavaScript", proficiency_level: "Advanced", skill_category: "Technical" },
    { skill_name: "React.js", proficiency_level: "Advanced", skill_category: "Technical" },
    { skill_name: "Node.js", proficiency_level: "Intermediate", skill_category: "Technical" },
    { skill_name: "PostgreSQL", proficiency_level: "Intermediate", skill_category: "Technical" },
    { skill_name: "Communication", proficiency_level: "Advanced", skill_category: "Soft Skill" },
  ],
  academics: [
    { degree: "B.Tech", field_of_study: "Computer Science", current_semester: 6, grade_score: 8.9 },
  ],
  preferences: {
    preferred_roles: ["Full Stack Developer", "Software Engineer"],
    preferred_domains: ["Web Development", "Cloud"],
    short_term_goal: "Secure a Full Stack SDE role",
  },
  projects: [
    { title: "E-Commerce Microservices", technologies: ["React", "Node.js", "PostgreSQL", "Docker"] },
  ],
  experiences: [],
  certifications: [{ name: "Meta Full-Stack Developer Specialization" }],
};

const mockCatalogRoles = [
  {
    id: 1,
    title: "Full Stack Developer",
    slug: "full-stack-developer",
    category: "Software Engineering",
    description: "Builds modern client and server web applications.",
    required_skills: ["JavaScript", "React", "Node.js", "SQL", "Git"],
    nice_to_have: ["Docker", "TypeScript", "AWS"],
    avg_salary_min: 700000,
    avg_salary_max: 1800000,
    growth_rate: "+22%",
    demand_level: "Very High",
  },
  {
    id: 2,
    title: "Data Scientist",
    slug: "data-scientist",
    category: "AI & Data",
    description: "Builds machine learning models and performs data analytics.",
    required_skills: ["Python", "Machine Learning", "Pandas", "SQL"],
    nice_to_have: ["Deep Learning", "TensorFlow", "PyTorch"],
    avg_salary_min: 800000,
    avg_salary_max: 2200000,
    growth_rate: "+31%",
    demand_level: "Extremely High",
  },
  {
    id: 3,
    title: "DevOps Engineer",
    slug: "devops-engineer",
    category: "Cloud & Infrastructure",
    description: "Automates deployments and manages scalable cloud infrastructure.",
    required_skills: ["Linux", "Docker", "Kubernetes", "CI/CD", "AWS"],
    nice_to_have: ["Terraform", "Prometheus"],
    avg_salary_min: 900000,
    avg_salary_max: 2400000,
    growth_rate: "+28%",
    demand_level: "High",
  },
];

async function runTestSuite() {
  console.log("==============================================================");
  console.log("  OBJECTIVE 2: AI-BASED CAREER RECOMMENDATIONS TEST SUITE");
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

  // ── TEST 1: Base AI Provider Utility Functions ─────────────
  await test("BaseAIProvider extracts clean JSON from markdown-wrapped response", () => {
    const base = new BaseAIProvider("TestProvider");
    const jsonMarkdown = "```json\n{\"summary\": \"Test summary\", \"recommendedRoles\": []}\n```";
    const parsed = base.extractJSON(jsonMarkdown);
    assert.strictEqual(parsed.summary, "Test summary");
    assert.deepStrictEqual(parsed.recommendedRoles, []);
  });

  await test("BaseAIProvider handles raw JSON strings safely", () => {
    const base = new BaseAIProvider("TestProvider");
    const rawJson = '{"key": "value"}';
    const parsed = base.extractJSON(rawJson);
    assert.strictEqual(parsed.key, "value");
  });

  // ── TEST 2: Prompt Builder Generation ───────────────────────
  await test("PromptBuilder formats complete student profile into structured LLM prompt", () => {
    const { systemInstruction, userPrompt } = buildRecommendationPrompt(mockStudent, mockCatalogRoles);
    assert.ok(systemInstruction.includes("Career & Education Advisor AI"));
    assert.ok(userPrompt.includes("Amit Sharma"));
    assert.ok(userPrompt.includes("JavaScript"));
    assert.ok(userPrompt.includes("Full Stack Developer"));
    assert.ok(userPrompt.includes("Data Scientist"));
  });

  // ── TEST 3: Heuristic Provider Engine ───────────────────────
  await test("HeuristicProvider computes accurate suitability scores & skills matching", async () => {
    const heuristic = new HeuristicProvider();
    const result = await heuristic.generateRecommendations(mockStudent, mockCatalogRoles);

    assert.ok(result.summary);
    assert.ok(Array.isArray(result.recommendedRoles));
    assert.strictEqual(result.recommendedRoles.length, 3);

    const topRole = result.recommendedRoles[0];
    assert.strictEqual(topRole.roleTitle, "Full Stack Developer");
    assert.ok(topRole.suitabilityScore >= 70, `Expected score >= 70, got ${topRole.suitabilityScore}`);

    // Check matched skills
    const matchedNames = topRole.matchingSkills.map((s) => s.name);
    assert.ok(matchedNames.includes("JavaScript"), "JavaScript should be matched");
    assert.ok(matchedNames.includes("React"), "React should be matched");

    // Check missing skills
    const missingNames = topRole.missingSkills.map((s) => s.name);
    assert.ok(missingNames.includes("Git"), "Git should be in missing skills");
  });

  // ── TEST 4: Output Schema Validation ────────────────────────
  await test("AIManager validates schema and clamps suitability scores within 20-100", () => {
    const invalidData = {
      summary: "Sample",
      recommendedRoles: [
        {
          roleTitle: "Backend Engineer",
          suitabilityScore: 150, // Should clamp to 100
        },
        {
          roleTitle: "QA Engineer",
          suitabilityScore: 5, // Should clamp to 20
        },
      ],
    };

    const validated = aiManager.validateRecommendationOutput(invalidData);
    assert.strictEqual(validated.recommendedRoles[0].suitabilityScore, 100);
    assert.strictEqual(validated.recommendedRoles[1].suitabilityScore, 20);
    assert.strictEqual(validated.recommendedRoles[0].slug, "backend-engineer");
  });

  await test("AIManager rejects malformed recommendation outputs", () => {
    assert.throws(() => {
      aiManager.validateRecommendationOutput(null);
    }, /Invalid output format/);

    assert.throws(() => {
      aiManager.validateRecommendationOutput({ summary: "No roles", recommendedRoles: [] });
    }, /No recommended roles/);
  });

  // ── TEST 5: Fallback Cascading Loop ─────────────────────────
  await test("AIManager gracefully fails over when external API keys are missing/invalid", async () => {
    const { result, providerUsed, fallbackNotice } = await aiManager.generateRecommendations(mockStudent, mockCatalogRoles);

    assert.ok(result);
    assert.ok(result.recommendedRoles.length > 0);
    assert.ok(typeof providerUsed === "string");
    console.log(`         (Active provider resolved to: ${providerUsed})`);
    if (providerUsed === "Heuristic Knowledge Engine") {
      assert.ok(fallbackNotice, "Expected fallback notice when falling back to heuristic engine");
    }
  });

  // ── TEST 6: Simulated Provider Failure Failover ─────────────
  await test("AIManager cascades to next provider on simulated 500 error", async () => {
    // Create isolated manager with a failing dummy provider followed by Heuristic
    class FailingProvider extends BaseAIProvider {
      constructor() {
        super("FailingPrimaryMock");
      }
      isAvailable() {
        return true;
      }
      async generateRecommendations() {
        throw new Error("HTTP 503 Service Unavailable / Rate Limit Exceeded");
      }
    }

    const testManager = new (require("../adapters/aiManager").constructor)();
    testManager.providers.failing = new FailingProvider();
    testManager.priorityOrder = ["failing", "heuristic"];

    const outcome = await testManager.generateRecommendations(mockStudent, mockCatalogRoles);
    assert.strictEqual(outcome.providerUsed, "Heuristic Knowledge Engine");
    assert.ok(outcome.result.recommendedRoles.length > 0);
  });

  // ── TEST 7: Database Profile Loader Service ─────────────────
  await test("ProfileLoaderService retrieves student records from PostgreSQL database", async () => {
    const sql = getDb();
    // Fetch an existing student user
    const [existingUser] = await sql`SELECT id FROM users WHERE role = 'student' LIMIT 1`;
    assert.ok(existingUser, "A student user should exist in database");

    const profile = await loadStudentProfileData(existingUser.id);
    assert.strictEqual(profile.userId, existingUser.id);
    assert.ok(Array.isArray(profile.skills));
    assert.ok(Array.isArray(profile.academics));
    assert.ok(Array.isArray(profile.projects));
  });

  // ── TEST 8: Full End-to-End Persistence into Database ────────
  await test("Recommendations and Skill Gaps successfully persist to database", async () => {
    const sql = getDb();
    const [student] = await sql`SELECT id FROM users WHERE role = 'student' LIMIT 1`;

    // Fetch catalog roles from db
    const roles = await sql`SELECT * FROM career_roles ORDER BY title LIMIT 3`;
    assert.ok(roles.length > 0, "Career roles catalog must exist in database");

    // Generate recommendations using AIManager
    const studentData = await loadStudentProfileData(student.id);
    const { result } = await aiManager.generateRecommendations(studentData, roles);

    // Deactivate prior and persist new recommendations
    await sql`UPDATE career_recommendations SET is_active = false WHERE user_id = ${student.id}`;

    for (const rec of result.recommendedRoles) {
      const matchingRole = roles.find((r) => r.slug === rec.slug || r.title.toLowerCase() === rec.roleTitle.toLowerCase());
      const roleId = matchingRole ? matchingRole.id : null;

      const matchedSkills = (rec.matchingSkills || []).map((s) => (typeof s === "string" ? s : s.name || String(s)));
      const missingSkills = (rec.missingSkills || []).map((s) => (typeof s === "string" ? s : s.name || String(s)));

      await sql`
        INSERT INTO career_recommendations (
          user_id, role_id, match_score, matched_skills, missing_skills, reasoning, is_active
        ) VALUES (
          ${student.id}, ${roleId}, ${rec.suitabilityScore}, ${matchedSkills}, ${missingSkills}, ${rec.reasoning}, true
        )
      `;

      if (roleId && missingSkills.length > 0) {
        const gapSkill = missingSkills[0];
        const existing = await sql`
          SELECT id FROM skill_gaps WHERE user_id = ${student.id} AND role_id = ${roleId} AND LOWER(skill_name) = LOWER(${gapSkill})
        `;
        if (existing.length === 0) {
          await sql`
            INSERT INTO skill_gaps (user_id, role_id, skill_name, priority, current_level, required_level, status)
            VALUES (${student.id}, ${roleId}, ${gapSkill}, 'high', 1, 5, 'pending')
          `;
        }
      }
    }

    // Verify active recommendations exist in DB
    const persisted = await sql`
      SELECT * FROM career_recommendations WHERE user_id = ${student.id} AND is_active = true
    `;
    assert.ok(persisted.length > 0, "Active recommendations should exist in database");
    assert.ok(Number(persisted[0].match_score) > 0, "Match score should be positive");
  });

  // ── TEST 9: Query Latest Saved Recommendations ──────────────
  await test("Latest recommendations endpoint query returns joined role data", async () => {
    const sql = getDb();
    const [student] = await sql`SELECT id FROM users WHERE role = 'student' LIMIT 1`;

    const latest = await sql`
      SELECT cr.*, r.title as role_title, r.slug as role_slug, r.category as domain
      FROM career_recommendations cr
      LEFT JOIN career_roles r ON cr.role_id = r.id
      WHERE cr.user_id = ${student.id} AND cr.is_active = true
      ORDER BY cr.match_score DESC
    `;

    assert.ok(latest.length > 0);
    assert.ok(latest[0].role_title);
  });

  console.log("\n==============================================================");
  console.log(`  OBJECTIVE 2 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log("==============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test runner crashed:", err);
  process.exit(1);
});
