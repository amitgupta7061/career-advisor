const { getDb } = require("../config/db");
const { getStudentProfileId } = require("../services/profileService");

/**
 * GET /api/profile/experiences
 */
async function getExperiences(req, res) {
  try {
    const sql = getDb();
    const profileId = await getStudentProfileId(req.user.id);
    const experiences = await sql`
      SELECT * FROM student_experiences 
      WHERE student_profile_id = ${profileId} 
      ORDER BY start_date DESC NULLS LAST, created_at DESC
    `;
    res.json({ success: true, count: experiences.length, data: experiences });
  } catch (error) {
    console.error("Get experiences error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch work experiences." });
  }
}

/**
 * POST /api/profile/experiences
 */
async function addExperience(req, res) {
  try {
    const sql = getDb();
    const profileId = await getStudentProfileId(req.user.id);
    const {
      organization, roleTitle, employmentType = "internship", location,
      startDate, endDate, isCurrent = false, responsibilities, technologiesUsed = []
    } = req.body;

    if (!organization || !roleTitle || !startDate) {
      return res.status(400).json({ success: false, message: "Organization, role title, and start date are required." });
    }

    const [exp] = await sql`
      INSERT INTO student_experiences (
        student_profile_id, organization, role_title, employment_type,
        location, start_date, end_date, is_current, responsibilities,
        technologies_used
      ) VALUES (
        ${profileId}, ${organization}, ${roleTitle}, ${employmentType},
        ${location || null}, ${new Date(startDate)},
        ${isCurrent ? null : (endDate ? new Date(endDate) : null)},
        ${Boolean(isCurrent)}, ${responsibilities || null}, ${technologiesUsed}
      )
      RETURNING *
    `;

    res.status(201).json({ success: true, message: "Experience record added successfully.", data: exp });
  } catch (error) {
    console.error("Add experience error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to add experience record." });
  }
}

/**
 * PATCH /api/profile/experiences/:id
 */
async function updateExperience(req, res) {
  try {
    const sql = getDb();
    const profileId = await getStudentProfileId(req.user.id);
    const { id } = req.params;
    const {
      organization, roleTitle, employmentType, location,
      startDate, endDate, isCurrent, responsibilities, technologiesUsed
    } = req.body;

    const [updated] = await sql`
      UPDATE student_experiences
      SET organization = COALESCE(${organization}, organization),
          role_title = COALESCE(${roleTitle}, role_title),
          employment_type = COALESCE(${employmentType}, employment_type),
          location = COALESCE(${location}, location),
          start_date = COALESCE(${startDate ? new Date(startDate) : null}, start_date),
          end_date = COALESCE(${endDate ? new Date(endDate) : null}, end_date),
          is_current = COALESCE(${isCurrent !== undefined ? Boolean(isCurrent) : null}, is_current),
          responsibilities = COALESCE(${responsibilities}, responsibilities),
          technologies_used = COALESCE(${technologiesUsed}, technologies_used),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND student_profile_id = ${profileId}
      RETURNING *
    `;

    if (!updated) {
      return res.status(404).json({ success: false, message: "Experience record not found or unauthorized." });
    }

    res.json({ success: true, message: "Experience record updated successfully.", data: updated });
  } catch (error) {
    console.error("Update experience error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to update experience record." });
  }
}

/**
 * DELETE /api/profile/experiences/:id
 */
async function deleteExperience(req, res) {
  try {
    const sql = getDb();
    const profileId = await getStudentProfileId(req.user.id);
    const { id } = req.params;

    const [deleted] = await sql`
      DELETE FROM student_experiences
      WHERE id = ${id} AND student_profile_id = ${profileId}
      RETURNING id
    `;

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Experience record not found or unauthorized." });
    }

    res.json({ success: true, message: "Experience record removed successfully." });
  } catch (error) {
    console.error("Delete experience error:", error);
    res.status(500).json({ success: false, message: "Failed to delete experience record." });
  }
}

module.exports = {
  getExperiences,
  addExperience,
  updateExperience,
  deleteExperience,
};

