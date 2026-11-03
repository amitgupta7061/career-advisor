const { getDb } = require("../config/db");
const { getStudentProfileId } = require("../services/profileService");

/**
 * GET /api/profile/projects
 */
async function getProjects(req, res) {
  try {
    const sql = getDb();
    const profileId = await getStudentProfileId(req.user.id);
    const projects = await sql`
      SELECT * FROM student_projects 
      WHERE student_profile_id = ${profileId} 
      ORDER BY start_date DESC NULLS LAST, created_at DESC
    `;
    res.json({ success: true, count: projects.length, data: projects });
  } catch (error) {
    console.error("Get projects error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch projects." });
  }
}

/**
 * POST /api/profile/projects
 */
async function addProject(req, res) {
  try {
    const sql = getDb();
    const profileId = await getStudentProfileId(req.user.id);
    const {
      title, description, technologies = [], category = "academic",
      githubUrl, liveUrl, startDate, endDate, status = "completed", roleOrContribution
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: "Project title and description are required." });
    }

    const [project] = await sql`
      INSERT INTO student_projects (
        student_profile_id, title, description, technologies,
        category, github_url, live_url, start_date, end_date,
        status, role_or_contribution
      ) VALUES (
        ${profileId}, ${title}, ${description}, ${technologies},
        ${category}, ${githubUrl || null}, ${liveUrl || null},
        ${startDate ? new Date(startDate) : null},
        ${endDate ? new Date(endDate) : null},
        ${status}, ${roleOrContribution || null}
      )
      RETURNING *
    `;

    res.status(201).json({ success: true, message: "Project added successfully.", data: project });
  } catch (error) {
    console.error("Add project error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to add project." });
  }
}

/**
 * PATCH /api/profile/projects/:id
 */
async function updateProject(req, res) {
  try {
    const sql = getDb();
    const profileId = await getStudentProfileId(req.user.id);
    const { id } = req.params;
    const {
      title, description, technologies, category,
      githubUrl, liveUrl, startDate, endDate, status, roleOrContribution
    } = req.body;

    const [updated] = await sql`
      UPDATE student_projects
      SET title = COALESCE(${title}, title),
          description = COALESCE(${description}, description),
          technologies = COALESCE(${technologies}, technologies),
          category = COALESCE(${category}, category),
          github_url = COALESCE(${githubUrl}, github_url),
          live_url = COALESCE(${liveUrl}, live_url),
          start_date = COALESCE(${startDate ? new Date(startDate) : null}, start_date),
          end_date = COALESCE(${endDate ? new Date(endDate) : null}, end_date),
          status = COALESCE(${status}, status),
          role_or_contribution = COALESCE(${roleOrContribution}, role_or_contribution),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND student_profile_id = ${profileId}
      RETURNING *
    `;

    if (!updated) {
      return res.status(404).json({ success: false, message: "Project not found or unauthorized." });
    }

    res.json({ success: true, message: "Project updated successfully.", data: updated });
  } catch (error) {
    console.error("Update project error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to update project." });
  }
}

/**
 * DELETE /api/profile/projects/:id
 */
async function deleteProject(req, res) {
  try {
    const sql = getDb();
    const profileId = await getStudentProfileId(req.user.id);
    const { id } = req.params;

    const [deleted] = await sql`
      DELETE FROM student_projects
      WHERE id = ${id} AND student_profile_id = ${profileId}
      RETURNING id
    `;

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Project not found or unauthorized." });
    }

    res.json({ success: true, message: "Project deleted successfully." });
  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json({ success: false, message: "Failed to delete project." });
  }
}

module.exports = {
  getProjects,
  addProject,
  updateProject,
  deleteProject,
};

