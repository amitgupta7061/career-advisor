const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const assert = require("assert");

const { getDb } = require("../config/db");
const progressController = require("../controllers/progressController");

async function runTestSuite() {
  console.log("==============================================================");
  console.log("  STUDENT PROGRESS TRACKING TEST SUITE");
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

  // ── TEST 1: Career Readiness Multi-Pillar Computation ───────
  await test("Career readiness computes weighted score across skills, projects, ATS, and roadmaps", async () => {
    const sql = getDb();
    const [student] = await sql`SELECT id FROM users WHERE role = 'student' LIMIT 1`;
    assert.ok(student, "A student user must exist");

    // Mock Express req & res
    const req = { user: { id: student.id } };
    let responseData = null;
    const res = {
      json: (payload) => { responseData = payload; },
      status: () => res,
    };

    await progressController.getCareerReadiness(req, res);

    assert.ok(responseData);
    assert.strictEqual(responseData.success, true);
    assert.ok(typeof responseData.data.overallScore === "number");
    assert.ok(responseData.data.overallScore >= 0 && responseData.data.overallScore <= 100);
    assert.ok(responseData.data.breakdown.skills !== undefined);
    assert.ok(responseData.data.breakdown.projects !== undefined);
    assert.ok(responseData.data.breakdown.resume !== undefined);
    assert.ok(responseData.data.breakdown.learning !== undefined);
    assert.ok(Array.isArray(responseData.data.nextSteps));
  });

  // ── TEST 2: Milestone Goal Lifecycle (CRUD) ─────────────────
  await test("Goal management supports create, toggle completion, and delete", async () => {
    const sql = getDb();
    const [student] = await sql`SELECT id FROM users WHERE role = 'student' LIMIT 1`;

    // 1. Create goal
    const [createdGoal] = await sql`
      INSERT INTO user_goals (user_id, title, category)
      VALUES (${student.id}, 'Complete Cloud Architecture Certificate', 'certification')
      RETURNING *
    `;
    assert.ok(createdGoal.id);
    assert.strictEqual(createdGoal.is_completed, false);

    // 2. Toggle completion
    const [updatedGoal] = await sql`
      UPDATE user_goals
      SET is_completed = true, completed_at = CURRENT_TIMESTAMP
      WHERE id = ${createdGoal.id} AND user_id = ${student.id}
      RETURNING *
    `;
    assert.strictEqual(updatedGoal.is_completed, true);
    assert.ok(updatedGoal.completed_at);

    // 3. Delete goal
    await sql`DELETE FROM user_goals WHERE id = ${createdGoal.id} AND user_id = ${student.id}`;
    const [deleted] = await sql`SELECT * FROM user_goals WHERE id = ${createdGoal.id}`;
    assert.strictEqual(deleted, undefined);
  });

  // ── TEST 3: Dynamic Badge Eligibility & Awarding ────────────
  await test("Badge system awards achievements based on verified user progress", async () => {
    const sql = getDb();
    const [student] = await sql`SELECT id FROM users WHERE role = 'student' LIMIT 1`;

    const req = { user: { id: student.id } };
    let responseData = null;
    const res = {
      json: (payload) => { responseData = payload; },
      status: () => res,
    };

    await progressController.getUserBadges(req, res);

    assert.ok(responseData);
    assert.strictEqual(responseData.success, true);
    assert.ok(Array.isArray(responseData.catalog));
    assert.ok(Array.isArray(responseData.earned));
    assert.ok(responseData.catalog.length >= 4);
  });

  // ── TEST 4: Student Activity Logging ────────────────────────
  await test("User activity logger records milestone events", async () => {
    const sql = getDb();
    const [student] = await sql`SELECT id FROM users WHERE role = 'student' LIMIT 1`;

    const [activity] = await sql`
      INSERT INTO user_activities (user_id, title, activity_type, description)
      VALUES (${student.id}, 'Scanned Resume for Full Stack Role', 'resume', 'Attained 84% ATS Score')
      RETURNING *
    `;

    assert.ok(activity.id);
    assert.strictEqual(activity.user_id, student.id);
    assert.strictEqual(activity.activity_type, "resume");

    // Cleanup
    await sql`DELETE FROM user_activities WHERE id = ${activity.id}`;
  });

  console.log("\n==============================================================");
  console.log(`  PROGRESS TRACKING TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log("==============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test runner crashed:", err);
  process.exit(1);
});

