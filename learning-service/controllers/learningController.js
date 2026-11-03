const { getDb } = require("../config/db");
const roadmapService = require("../services/roadmapService");

/**
 * GET /api/learning/courses
 * List courses with optional filtering (?skill=..., ?difficulty=..., ?category=..., ?free=...)
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

    res.json({ success: true, count: courses.length, data: courses });
  } catch (error) {
    console.error("Get courses error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch courses." });
  }
}

/**
 * POST /api/learning/roadmap/generate
 * Generates an AI-powered personalized learning roadmap based on skill gaps
 */
async function generateRoadmap(req, res) {
  try {
    const userId = req.user.id;
    const { roleId, roleTitle } = req.body;

    if (!roleId && !roleTitle) {
      return res.status(400).json({ success: false, message: "roleId or roleTitle is required." });
    }

    const roadmapData = await roadmapService.generatePersonalizedRoadmap(userId, roleId, roleTitle);

    res.status(201).json({
      success: true,
      message: "Personalized learning roadmap generated successfully.",
      data: roadmapData,
    });
  } catch (error) {
    console.error("Generate roadmap error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to generate roadmap." });
  }
}

/**
 * GET /api/learning/roadmaps
 * List all active and past roadmaps for the student
 */
async function getUserRoadmaps(req, res) {
  try {
    const sql = getDb();
    const roadmaps = await sql`
      SELECT lr.*, cr.title as role_title, cr.slug as role_slug
      FROM learning_roadmaps lr
      LEFT JOIN career_roles cr ON lr.role_id = cr.id
      WHERE lr.user_id = ${req.user.id}
      ORDER BY lr.created_at DESC
    `;

    res.json({ success: true, count: roadmaps.length, data: roadmaps });
  } catch (error) {
    console.error("Get roadmaps error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch roadmaps." });
  }
}

/**
 * GET /api/learning/roadmaps/:id
 * Retrieve a specific roadmap with milestone and step breakdowns
 */
async function getRoadmapDetail(req, res) {
  try {
    const roadmap = await roadmapService.getRoadmapDetail(req.params.id, req.user.id);
    if (!roadmap) {
      return res.status(404).json({ success: false, message: "Roadmap not found." });
    }

    res.json({ success: true, data: roadmap });
  } catch (error) {
    console.error("Get roadmap detail error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch roadmap." });
  }
}

/**
 * PATCH /api/learning/roadmaps/:roadmapId/steps/:stepId
 * Update activity status (pending, in_progress, completed, skipped) and sync skill progression
 */
async function updateStepStatus(req, res) {
  try {
    const { status } = req.body;
    const allowed = ["pending", "in_progress", "completed", "skipped"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value." });
    }

    const result = await roadmapService.updateStepStatus(
      req.params.roadmapId,
      req.params.stepId,
      status,
      req.user.id
    );

    res.json({
      success: true,
      message: "Step status updated successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Update step status error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to update step." });
  }
}

/**
 * PATCH /api/learning/roadmaps/:id/state
 * Pause, resume, or archive a roadmap
 */
async function setRoadmapStatus(req, res) {
  try {
    const { status } = req.body;
    const updated = await roadmapService.setRoadmapState(req.params.id, status, req.user.id);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Set roadmap state error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to update roadmap state." });
  }
}

module.exports = {
  getCourses,
  generateRoadmap,
  getUserRoadmaps,
  getRoadmapDetail,
  updateStepStatus,
  setRoadmapStatus,
};
