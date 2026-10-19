const { getDb, getRedis } = require("../config/db");

/**
 * GET /api/learning/courses
 * List courses. Optional query params: ?skill=Python&difficulty=beginner
 */
async function getCourses(req, res) {
  try {
    const sql = getDb();
    const { skill, difficulty, category, free } = req.query;

    let courses;
    if (skill) {
      courses = await sql`
        SELECT * FROM courses WHERE ${skill} = ANY(skill_tags) ORDER BY rating DESC
      `;
    } else if (difficulty) {
      courses = await sql`SELECT * FROM courses WHERE difficulty = ${difficulty} ORDER BY rating DESC`;
    } else if (category) {
      courses = await sql`SELECT * FROM courses WHERE category = ${category} ORDER BY rating DESC`;
    } else if (free === "true") {
      courses = await sql`SELECT * FROM courses WHERE is_free = true ORDER BY rating DESC`;
    } else {
      courses = await sql`SELECT * FROM courses ORDER BY rating DESC`;
    }

    res.json({ success: true, data: courses });
  } catch (error) {
    console.error("Get courses error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch courses." });
  }
}

/**
 * POST /api/learning/roadmap/generate
 * Generate a personalized learning roadmap based on skill gaps.
 */
async function generateRoadmap(req, res) {
  try {
    const sql = getDb();
    const userId = req.user.id;
    const { roleId, roleTitle } = req.body;

    // Get skill gaps for this role
    const gaps = await sql`
      SELECT skill_name, priority FROM skill_gaps
      WHERE user_id = ${userId} AND role_id = ${roleId}
      ORDER BY CASE priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END
    `;

    if (gaps.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No skill gaps found. Run skill gap analysis first.",
      });
    }

    // Create roadmap
    const [roadmap] = await sql`
      INSERT INTO learning_roadmaps (user_id, role_id, title, description, total_steps)
      VALUES (${userId}, ${roleId}, ${"Roadmap: " + (roleTitle || "Career Path")}, ${"Personalized learning path to become a " + (roleTitle || "professional")}, ${gaps.length})
      RETURNING id
    `;

    // For each skill gap, find relevant courses and create steps
    let stepOrder = 1;
    for (const gap of gaps) {
      // Find matching course
      const matchingCourses = await sql`
        SELECT id, title, estimated_hrs FROM courses
        WHERE ${gap.skill_name} = ANY(skill_tags)
        ORDER BY rating DESC LIMIT 1
      `;

      const courseId = matchingCourses.length > 0 ? matchingCourses[0].id : null;
      const estimatedHrs = matchingCourses.length > 0 ? matchingCourses[0].duration_hrs : 20;

      await sql`
        INSERT INTO roadmap_steps (roadmap_id, step_order, title, description, resource_type, course_id, skill_name, estimated_hrs)
        VALUES (
          ${roadmap.id}, ${stepOrder},
          ${"Learn " + gap.skill_name},
          ${"Build proficiency in " + gap.skill_name + " (Priority: " + gap.priority + ")"},
          'course', ${courseId}, ${gap.skill_name}, ${estimatedHrs}
        )
      `;

      // Add a practice project step for critical/high priority skills
      if (gap.priority === "critical" || gap.priority === "high") {
        stepOrder++;
        await sql`
          INSERT INTO roadmap_steps (roadmap_id, step_order, title, description, resource_type, skill_name, estimated_hrs)
          VALUES (
            ${roadmap.id}, ${stepOrder},
            ${"Build a " + gap.skill_name + " Project"},
            ${"Apply your " + gap.skill_name + " skills in a hands-on project"},
            'project', ${gap.skill_name}, 15
          )
        `;
      }
      stepOrder++;
    }

    // Update total steps
    await sql`UPDATE learning_roadmaps SET total_steps = ${stepOrder - 1} WHERE id = ${roadmap.id}`;

    // Fetch the complete roadmap
    const steps = await sql`
      SELECT rs.*, c.title as course_title, c.platform, c.url as course_url
      FROM roadmap_steps rs LEFT JOIN courses c ON rs.course_id = c.id
      WHERE rs.roadmap_id = ${roadmap.id} ORDER BY rs.step_order
    `;

    res.status(201).json({
      success: true,
      data: { roadmapId: roadmap.id, title: "Roadmap: " + (roleTitle || "Career Path"), totalSteps: stepOrder - 1, steps },
    });
  } catch (error) {
    console.error("Generate roadmap error:", error);
    res.status(500).json({ success: false, message: "Failed to generate roadmap." });
  }
}

/**
 * GET /api/learning/roadmaps
 * Get all roadmaps for the authenticated user.
 */
async function getUserRoadmaps(req, res) {
  try {
    const sql = getDb();
    const roadmaps = await sql`
      SELECT lr.*, cr.title as role_title
      FROM learning_roadmaps lr
      LEFT JOIN career_roles cr ON lr.role_id = cr.id
      WHERE lr.user_id = ${req.user.id}
      ORDER BY lr.created_at DESC
    `;
    res.json({ success: true, data: roadmaps });
  } catch (error) {
    console.error("Get roadmaps error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch roadmaps." });
  }
}

/**
 * GET /api/learning/roadmaps/:id
 * Get a specific roadmap with all its steps.
 */
async function getRoadmapDetail(req, res) {
  try {
    const sql = getDb();
    const [roadmap] = await sql`
      SELECT * FROM learning_roadmaps WHERE id = ${req.params.id} AND user_id = ${req.user.id}
    `;
    if (!roadmap) return res.status(404).json({ success: false, message: "Roadmap not found." });

    const steps = await sql`
      SELECT rs.*, c.title as course_title, c.platform, c.url as course_url, c.is_free
      FROM roadmap_steps rs LEFT JOIN courses c ON rs.course_id = c.id
      WHERE rs.roadmap_id = ${roadmap.id} ORDER BY rs.step_order
    `;

    res.json({ success: true, data: { ...roadmap, steps } });
  } catch (error) {
    console.error("Get roadmap error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch roadmap." });
  }
}

/**
 * PATCH /api/learning/roadmaps/:roadmapId/steps/:stepId
 * Update step status (mark complete, in_progress, etc.)
 */
async function updateStepStatus(req, res) {
  try {
    const sql = getDb();
    const { status } = req.body;

    const [step] = await sql`
      UPDATE roadmap_steps SET status = ${status},
        completed_at = ${status === "completed" ? new Date() : null}
      WHERE id = ${req.params.stepId} AND roadmap_id = ${req.params.roadmapId}
      RETURNING *
    `;

    if (!step) return res.status(404).json({ success: false, message: "Step not found." });

    // Update roadmap completed count
    const [counts] = await sql`
      SELECT COUNT(*) FILTER (WHERE status = 'completed') as completed,
             COUNT(*) as total
      FROM roadmap_steps WHERE roadmap_id = ${req.params.roadmapId}
    `;

    await sql`
      UPDATE learning_roadmaps
      SET completed_steps = ${counts.completed},
          status = ${parseInt(counts.completed) === parseInt(counts.total) ? "completed" : "active"},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${req.params.roadmapId}
    `;

    res.json({ success: true, data: step });
  } catch (error) {
    console.error("Update step error:", error);
    res.status(500).json({ success: false, message: "Failed to update step." });
  }
}

module.exports = { getCourses, generateRoadmap, getUserRoadmaps, getRoadmapDetail, updateStepStatus };
