const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const assert = require("assert");

// Service and Adapter imports
const {
  calculateSkillGap,
  parseProficiency,
  areSkillsMatching,
} = require("../services/skillGapService");
const {
  buildSkillGapPrompt,
  generateHeuristicSkillGapExplanations,
} = require("../adapters/skillGapPromptBuilder");
const aiManager = require("../adapters/aiManager");
const { getDb } = require("../config/db");
const { loadStudentProfileData } = require("../services/profileLoaderService");

async function runTestSuite() {
  console.log("==============================================================");
  console.log("  OBJECTIVE 3: AI-POWERED SKILL GAP ANALYSIS TEST SUITE");
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

  // ── TEST 1: Proficiency Parsing and Normalization ───────────
  await test("Proficiency parser maps text and numbers correctly to 1-4 scale", () => {
    assert.strictEqual(parseProficiency("beginner"), 1);
    assert.strictEqual(parseProficiency("intermediate"), 2);
    assert.strictEqual(parseProficiency("advanced"), 3);
    assert.strictEqual(parseProficiency("expert"), 4);
    assert.strictEqual(parseProficiency(3), 3);
    assert.strictEqual(parseProficiency("unknown"), 1); // fallback to beginner
  });

  // ── TEST 2: Tolerant/Fuzzy Skill Name Matching ──────────────
  await test("Fuzzy matcher reconciles punctuation and casing variances", () => {
    assert.ok(areSkillsMatching("React.js", "React"));
    assert.ok(areSkillsMatching("NodeJS", "Node.js"));
    assert.ok(areSkillsMatching("C++", "c++"));
    assert.ok(areSkillsMatching("Machine Learning", "machine learning"));
    assert.ok(!areSkillsMatching("Python", "Java"));
  });

  // ── TEST 3: Deterministic Categorization Engine ─────────────
  await test("Deterministic calculation classifies into Missing, Improving, and Meeting buckets", () => {
    const studentSkills = [
      { skill_name: "React.js", proficiency_level: "advanced" }, // Meets: req=3, student=3
      { skill_name: "Node.js", proficiency_level: "beginner" },   // Improving: req=3, student=1
    ];

    const requiredSkills = [
      { skill_name: "React", required_level: 3, importance: "critical", why_needed: "Frontend architecture" },
      { skill_name: "Node.js", required_level: 3, importance: "high", why_needed: "Backend runtime" },
      { skill_name: "Docker", required_level: 2, importance: "high", why_needed: "Containerization" }, // Missing
    ];

    const result = calculateSkillGap(studentSkills, requiredSkills);

    assert.strictEqual(result.totalSkillsEvaluated, 3);
    assert.strictEqual(result.meetingCount, 1);
    assert.strictEqual(result.improvingCount, 1);
    assert.strictEqual(result.missingCount, 1);

    // Verify bucket contents
    assert.strictEqual(result.meetingSkills[0].name, "React");
    assert.strictEqual(result.improvingSkills[0].name, "Node.js");
    assert.strictEqual(result.improvingSkills[0].currentLevel, 1);
    assert.strictEqual(result.improvingSkills[0].requiredLevel, 3);
    assert.strictEqual(result.improvingSkills[0].gap, 2);

    assert.strictEqual(result.missingSkills[0].name, "Docker");
    assert.strictEqual(result.missingSkills[0].currentLevel, 0);
    assert.strictEqual(result.missingSkills[0].gap, 2);

    // Verify match percentage + gap percentage = 100%
    assert.strictEqual(Math.round(result.overallMatchPercentage + result.overallGapPercentage), 100);
    assert.ok(result.overallMatchPercentage > 0 && result.overallMatchPercentage < 100);
  });

  // ── TEST 4: Prompt Builder & Heuristic Explanations ─────────
  await test("SkillGapPromptBuilder generates structured instructions & schema", () => {
    const mockRole = { title: "Full-Stack Developer", category: "Web", description: "Web apps" };
    const mockAnalysis = {
      overallMatchPercentage: 65,
      overallGapPercentage: 35,
      totalSkillsEvaluated: 5,
      missingCount: 2,
      improvingCount: 1,
      meetingCount: 2,
      missingSkills: [{ name: "Docker", category: "tool", requiredLevelLabel: "Intermediate", priority: "high" }],
      improvingSkills: [{ name: "Node.js", category: "technical", currentLevelLabel: "Beginner", requiredLevelLabel: "Advanced", gap: 2 }],
      meetingSkills: [{ name: "React", category: "technical", currentLevelLabel: "Advanced" }],
    };
    const mockStudent = { name: "Test Student", academics: [], projects: [] };

    const { systemInstruction, userPrompt } = buildSkillGapPrompt(mockRole, mockAnalysis, mockStudent);
    assert.ok(systemInstruction.includes("Technical Career Architect"));
    assert.ok(userPrompt.includes("Full-Stack Developer"));
    assert.ok(userPrompt.includes("Docker"));

    const heuristicFallback = generateHeuristicSkillGapExplanations(mockRole, mockAnalysis, mockStudent);
    assert.ok(heuristicFallback.executiveSummary.includes("65%"));
    assert.ok(Array.isArray(heuristicFallback.strategicFocus));
    assert.ok(Array.isArray(heuristicFallback.skillExplanations));
    assert.ok(heuristicFallback.phasedRoadmap.immediate);
  });

  // ── TEST 5: Database Role Skill Requirements Table ──────────
  await test("Neon DB role_skill_requirements contains structured role skills", async () => {
    const sql = getDb();
    const reqs = await sql`
      SELECT count(*) FROM role_skill_requirements
    `;
    const count = parseInt(reqs[0].count, 10);
    assert.ok(count > 50, `Expected > 50 role skill requirements, got ${count}`);

    const [sample] = await sql`
      SELECT * FROM role_skill_requirements LIMIT 1
    `;
    assert.ok(sample.skill_name);
    assert.ok(sample.required_level >= 1 && sample.required_level <= 4);
    assert.ok(["critical", "high", "medium", "low"].includes(sample.importance));
  });

  // ── TEST 6: Multi-Provider AI Explanation Integration ───────
  await test("AIManager generates skill gap insights with failover support", async () => {
    const mockRole = { title: "Machine Learning Engineer", category: "AI & ML", description: "ML Models" };
    const mockAnalysis = {
      overallMatchPercentage: 55,
      overallGapPercentage: 45,
      totalSkillsEvaluated: 6,
      missingCount: 2,
      improvingCount: 2,
      meetingCount: 2,
      missingSkills: [{ name: "PyTorch", category: "technical", requiredLevelLabel: "Advanced", priority: "critical", whyNeeded: "Deep learning model development" }],
      improvingSkills: [{ name: "Python", category: "technical", currentLevelLabel: "Intermediate", requiredLevelLabel: "Advanced", gap: 1, whyNeeded: "Primary programming language" }],
      meetingSkills: [{ name: "SQL", category: "technical", currentLevelLabel: "Intermediate" }],
    };
    const mockStudent = { name: "Aditya Verma" };

    const { insights, providerUsed } = await aiManager.generateSkillGapInsights(mockRole, mockAnalysis, mockStudent);
    assert.ok(insights.executiveSummary);
    assert.ok(insights.strategicFocus.length > 0);
    assert.ok(typeof providerUsed === "string");
  });

  // ── TEST 7: End-to-End Analysis & Snapshot Persistence ───────
  await test("Full Skill Gap Analysis persists active gaps & historical snapshots in DB", async () => {
    const sql = getDb();
    const [student] = await sql`SELECT id FROM users WHERE role = 'student' LIMIT 1`;
    assert.ok(student, "A student user must exist");

    const [role] = await sql`SELECT * FROM career_roles WHERE slug = 'full-stack-developer' OR title ILIKE '%full-stack%' LIMIT 1`;
    assert.ok(role, "A Full Stack role must exist in catalog");

    // 1. Fetch requirements and student profile
    const studentProfile = await loadStudentProfileData(student.id);
    const requiredSkills = await sql`
      SELECT * FROM role_skill_requirements WHERE role_id = ${role.id}
    `;
    assert.ok(requiredSkills.length > 0, "Requirements must exist for role");

    // 2. Perform calculation
    const deterministic = calculateSkillGap(studentProfile.skills, requiredSkills);

    // 3. Clear and persist active gaps into skill_gaps table
    await sql`DELETE FROM skill_gaps WHERE user_id = ${student.id} AND role_id = ${role.id}`;
    for (const gap of [...deterministic.missingSkills, ...deterministic.improvingSkills]) {
      await sql`
        INSERT INTO skill_gaps (user_id, role_id, skill_name, priority, current_level, required_level, status)
        VALUES (${student.id}, ${role.id}, ${gap.name}, ${gap.priority}, ${gap.currentLevel}, ${gap.requiredLevel}, 'pending')
      `;
    }

    // 4. Save historical snapshot in skill_gap_analyses table
    const [snapshot] = await sql`
      INSERT INTO skill_gap_analyses (
        user_id, role_id, overall_match_percentage, overall_gap_percentage, summary, analysis_data, provider_used
      ) VALUES (
        ${student.id},
        ${role.id},
        ${deterministic.overallMatchPercentage},
        ${deterministic.overallGapPercentage},
        'Automated test snapshot analysis',
        ${JSON.stringify({ metrics: deterministic })},
        'TestRunner'
      )
      RETURNING id, created_at
    `;
    assert.ok(snapshot.id, "Snapshot record must return UUID PK");

    // 5. Query active skill_gaps
    const activeGaps = await sql`SELECT * FROM skill_gaps WHERE user_id = ${student.id} AND role_id = ${role.id}`;
    assert.ok(activeGaps.length > 0, "Active skill gaps must be persisted");

    // 6. Query history table
    const history = await sql`SELECT * FROM skill_gap_analyses WHERE id = ${snapshot.id}`;
    assert.strictEqual(history.length, 1);
    assert.strictEqual(Number(history[0].overall_match_percentage), deterministic.overallMatchPercentage);
  });

  // ── TEST 8: History Retrieval & Student Data Isolation ───────
  await test("History query is strictly scoped to student and tracks evaluations over time", async () => {
    const sql = getDb();
    const [student] = await sql`SELECT id FROM users WHERE role = 'student' LIMIT 1`;

    const userHistory = await sql`
      SELECT sga.id, sga.user_id, sga.overall_match_percentage, cr.title as role_title
      FROM skill_gap_analyses sga
      JOIN career_roles cr ON sga.role_id = cr.id
      WHERE sga.user_id = ${student.id}
      ORDER BY sga.created_at DESC
    `;

    assert.ok(Array.isArray(userHistory));
    assert.ok(userHistory.length > 0);
    // Ensure all records belong to the student
    userHistory.forEach((h) => {
      assert.strictEqual(h.user_id, student.id);
    });
  });

  console.log("\n==============================================================");
  console.log(`  OBJECTIVE 3 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log("==============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test runner crashed:", err);
  process.exit(1);
});

