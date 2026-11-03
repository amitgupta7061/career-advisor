const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const assert = require("assert");

const { getDb } = require("../config/db");
const { buildRoadmapPrompt, generateHeuristicRoadmap } = require("../adapters/roadmapPromptBuilder");
const aiManager = require("../adapters/aiManager");
const roadmapService = require("../services/roadmapService");

async function runTestSuite() {
  console.log("==============================================================");
  console.log("  OBJECTIVE 4: AI-POWERED LEARNING ROADMAP TEST SUITE");
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
  await test("RoadmapPromptBuilder builds structured prompt with course catalog", () => {
    const mockRole = { title: "Full-Stack Developer", category: "Web" };
    const mockGaps = {
      missingSkills: [{ name: "Docker", priority: "critical" }],
      improvingSkills: [{ name: "Node.js", priority: "high" }],
      meetingSkills: [{ name: "React" }],
    };
    const mockStudent = { name: "Ananya Sharma" };
    const mockCourses = [{ title: "Docker Guide", platform: "Docker Docs", url: "https://docker.com", skill_tags: ["Docker"] }];

    const { systemInstruction, userPrompt } = buildRoadmapPrompt(mockRole, mockGaps, mockStudent, mockCourses);
    assert.ok(systemInstruction.includes("Engineering Curriculum Architect"));
    assert.ok(userPrompt.includes("Full-Stack Developer"));
    assert.ok(userPrompt.includes("Docker"));
    assert.ok(userPrompt.includes("https://docker.com"));
  });

  // ── TEST 2: Deterministic Heuristic Roadmap Generator ───────
  await test("HeuristicRoadmapGenerator creates sequential milestones & projects", () => {
    const mockRole = { title: "Full-Stack Developer", category: "Web" };
    const mockGaps = {
      missingSkills: [{ name: "PostgreSQL", priority: "critical" }],
      improvingSkills: [{ name: "Node.js", priority: "high" }],
    };
    const mockStudent = { name: "Ananya Sharma" };

    const result = generateHeuristicRoadmap(mockRole, mockGaps, mockStudent, []);
    assert.ok(result.roadmapTitle.includes("Full-Stack Developer"));
    assert.ok(result.milestones.length >= 3);

    // Phase 1 has foundations
    const m1 = result.milestones[0];
    assert.strictEqual(m1.milestoneIndex, 1);
    assert.ok(m1.activities.length > 0);

    // Has a hands-on project
    const hasProject = result.milestones.some((m) =>
      m.activities.some((a) => a.activityType === "project")
    );
    assert.ok(hasProject, "Roadmap must include practical hands-on project activities");
  });

  // ── TEST 3: Output Schema Validation & Sanitization ─────────
  await test("AIManager validates schema, clamps durations, and standardizes activity types", () => {
    const mockRole = { title: "Backend Engineer" };
    const rawData = {
      roadmapTitle: "Custom Backend Path",
      estimatedDurationWeeks: 50, // Should clamp to 24
      milestones: [
        {
          milestoneIndex: 1,
          title: "Phase 1",
          activities: [
            {
              title: "Intro",
              activityType: "invalid_type", // Should sanitize to 'course'
              estimatedHrs: 500, // Should clamp to 100
            },
          ],
        },
      ],
    };

    const validated = aiManager.validateRoadmapOutput(rawData, mockRole);
    assert.strictEqual(validated.estimatedDurationWeeks, 24);
    assert.strictEqual(validated.milestones[0].activities[0].activityType, "course");
    assert.strictEqual(validated.milestones[0].activities[0].estimatedHrs, 100);
  });

  // ── TEST 4: Database Catalog & Objective 4 Schema ───────────
  await test("Database schema contains Objective 4 fields & authentic resources", async () => {
    const sql = getDb();

    // Verify learning_roadmaps columns
    const roadmapCols = await sql`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'learning_roadmaps'
    `;
    const rColNames = roadmapCols.map((c) => c.column_name);
    assert.ok(rColNames.includes("target_role"));
    assert.ok(rColNames.includes("version"));
    assert.ok(rColNames.includes("milestones_summary"));

    // Verify roadmap_steps columns
    const stepCols = await sql`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'roadmap_steps'
    `;
    const sColNames = stepCols.map((c) => c.column_name);
    assert.ok(sColNames.includes("activity_type"));
    assert.ok(sColNames.includes("milestone_index"));
    assert.ok(sColNames.includes("learning_objectives"));
    assert.ok(sColNames.includes("expected_outcomes"));

    // Verify curated authentic free courses
    const [freeCourses] = await sql`
      SELECT count(*) as count FROM courses WHERE is_free = true
    `;
    assert.ok(parseInt(freeCourses.count, 10) >= 5, "Database must contain verified free learning resources");
  });

  // ── TEST 5: End-to-End Roadmap Generation Service ───────────
  await test("RoadmapService generates, versions, and persists roadmap into Neon DB", async () => {
    const sql = getDb();
    const [student] = await sql`SELECT id FROM users WHERE role = 'student' LIMIT 1`;
    assert.ok(student, "A student user must exist");

    const [role] = await sql`SELECT id, title FROM career_roles LIMIT 1`;
    assert.ok(role, "A career role must exist");

    const roadmapData = await roadmapService.generatePersonalizedRoadmap(student.id, role.id, role.title);
    assert.ok(roadmapData.roadmapId, "Must return created roadmap ID");
    assert.ok(roadmapData.milestones.length >= 2, "Must contain at least 2 milestones");
    assert.ok(roadmapData.totalSteps > 0, "Must contain steps");

    // Verify persisted in DB
    const [dbRoadmap] = await sql`SELECT * FROM learning_roadmaps WHERE id = ${roadmapData.roadmapId}`;
    assert.strictEqual(dbRoadmap.user_id, student.id);
    assert.strictEqual(dbRoadmap.status, "active");
  });

  // ── TEST 6: Detail Retrieval & Milestone Progress Math ───────
  await test("RoadmapService calculates milestone completion & overall percentages", async () => {
    const sql = getDb();
    const [student] = await sql`SELECT id FROM users WHERE role = 'student' LIMIT 1`;
    const [activeRoadmap] = await sql`
      SELECT id FROM learning_roadmaps WHERE user_id = ${student.id} AND status = 'active' ORDER BY created_at DESC LIMIT 1
    `;
    assert.ok(activeRoadmap, "Active roadmap must exist");

    const detail = await roadmapService.getRoadmapDetail(activeRoadmap.id, student.id);
    assert.ok(detail.milestones);
    assert.ok(Array.isArray(detail.milestones));
    assert.ok(typeof detail.overallProgress === "number");
    detail.milestones.forEach((m) => {
      assert.ok(typeof m.progressPercentage === "number");
    });
  });

  // ── TEST 7: Activity Status Update & Skill Progression Sync ─
  await test("Completing a step updates progress & synchronizes skill proficiency", async () => {
    const sql = getDb();
    const [student] = await sql`SELECT id FROM users WHERE role = 'student' LIMIT 1`;
    const [activeRoadmap] = await sql`
      SELECT id FROM learning_roadmaps WHERE user_id = ${student.id} AND status = 'active' ORDER BY created_at DESC LIMIT 1
    `;
    const [step] = await sql`
      SELECT id, skill_name, status FROM roadmap_steps WHERE roadmap_id = ${activeRoadmap.id} LIMIT 1
    `;
    assert.ok(step, "Step must exist");

    // Complete the step
    const result = await roadmapService.updateStepStatus(activeRoadmap.id, step.id, "completed", student.id);
    assert.strictEqual(result.step.status, "completed");
    assert.ok(result.completedSteps > 0);

    // Verify database step was updated
    const [updatedStep] = await sql`SELECT status, completed_at FROM roadmap_steps WHERE id = ${step.id}`;
    assert.strictEqual(updatedStep.status, "completed");
    assert.ok(updatedStep.completed_at);
  });

  // ── TEST 8: Roadmap State Lifecycle (Pause & Resume) ─────────
  await test("RoadmapService supports pause and resume lifecycle transitions", async () => {
    const sql = getDb();
    const [student] = await sql`SELECT id FROM users WHERE role = 'student' LIMIT 1`;
    const [activeRoadmap] = await sql`
      SELECT id FROM learning_roadmaps WHERE user_id = ${student.id} AND status = 'active' ORDER BY created_at DESC LIMIT 1
    `;

    // 1. Pause
    const paused = await roadmapService.setRoadmapState(activeRoadmap.id, "paused", student.id);
    assert.strictEqual(paused.status, "paused");
    assert.ok(paused.paused_at);

    // 2. Resume
    const resumed = await roadmapService.setRoadmapState(activeRoadmap.id, "active", student.id);
    assert.strictEqual(resumed.status, "active");
  });

  console.log("\n==============================================================");
  console.log(`  OBJECTIVE 4 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log("==============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test runner crashed:", err);
  process.exit(1);
});

