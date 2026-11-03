const { getDb } = require("../config/db");
const { getStudentProfileId } = require("../services/profileService");

/**
 * GET /api/profile/academics
 */
async function getAcademics(req, res) {
  try {
    const sql = getDb();
    const profileId = await getStudentProfileId(req.user.id);
    const academics = await sql`
      SELECT * FROM student_academics 
      WHERE student_profile_id = ${profileId} 
      ORDER BY graduation_year DESC NULLS LAST, created_at DESC
    `;
    res.json({ success: true, count: academics.length, data: academics });
  } catch (error) {
    console.error("Get academics error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch academics." });
  }
}

/**
 * POST /api/profile/academics
 */
async function addAcademic(req, res) {
  try {
    const sql = getDb();
    const profileId = await getStudentProfileId(req.user.id);
    const {
      institutionName, degree, fieldOfStudy, currentSemester,
      enrollmentYear, graduationYear, gradeScore, gradeType = "cgpa", isHighest = false
    } = req.body;

    if (!institutionName || !degree) {
      return res.status(400).json({ success: false, message: "Institution name and degree are required." });
    }

    // If isHighest is set, unset previous highest
    if (isHighest) {
      await sql`
        UPDATE student_academics SET is_highest = FALSE WHERE student_profile_id = ${profileId}
      `;
    }

    const [record] = await sql`
      INSERT INTO student_academics (
        student_profile_id, institution_name, degree, field_of_study,
        current_semester, enrollment_year, graduation_year, grade_score,
        grade_type, is_highest
      ) VALUES (
        ${profileId}, ${institutionName}, ${degree}, ${fieldOfStudy || null},
        ${currentSemester || null}, ${enrollmentYear || null}, ${graduationYear || null},
        ${gradeScore !== undefined && gradeScore !== null ? Number(gradeScore) : null},
        ${gradeType}, ${Boolean(isHighest)}
      )
      RETURNING *
    `;

    res.status(201).json({ success: true, message: "Academic record added.", data: record });
  } catch (error) {
    console.error("Add academic error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to add academic record." });
  }
}

/**
 * PATCH /api/profile/academics/:id
 * Strictly scoped to student_profile_id
 */
async function updateAcademic(req, res) {
  try {
    const sql = getDb();
    const profileId = await getStudentProfileId(req.user.id);
    const { id } = req.params;
    const {
      institutionName, degree, fieldOfStudy, currentSemester,
      enrollmentYear, graduationYear, gradeScore, gradeType, isHighest
    } = req.body;

    if (isHighest) {
      await sql`
        UPDATE student_academics SET is_highest = FALSE WHERE student_profile_id = ${profileId}
      `;
    }

    const [updated] = await sql`
      UPDATE student_academics
      SET institution_name = COALESCE(${institutionName}, institution_name),
          degree = COALESCE(${degree}, degree),
          field_of_study = COALESCE(${fieldOfStudy}, field_of_study),
          current_semester = COALESCE(${currentSemester}, current_semester),
          enrollment_year = COALESCE(${enrollmentYear}, enrollment_year),
          graduation_year = COALESCE(${graduationYear}, graduation_year),
          grade_score = COALESCE(${gradeScore !== undefined ? Number(gradeScore) : null}, grade_score),
          grade_type = COALESCE(${gradeType}, grade_type),
          is_highest = COALESCE(${isHighest !== undefined ? Boolean(isHighest) : null}, is_highest),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND student_profile_id = ${profileId}
      RETURNING *
    `;

    if (!updated) {
      return res.status(404).json({ success: false, message: "Academic record not found or unauthorized." });
    }

    res.json({ success: true, message: "Academic record updated.", data: updated });
  } catch (error) {
    console.error("Update academic error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to update academic record." });
  }
}

/**
 * DELETE /api/profile/academics/:id
 * Strictly scoped to student_profile_id
 */
async function deleteAcademic(req, res) {
  try {
    const sql = getDb();
    const profileId = await getStudentProfileId(req.user.id);
    const { id } = req.params;

    const [deleted] = await sql`
      DELETE FROM student_academics
      WHERE id = ${id} AND student_profile_id = ${profileId}
      RETURNING id
    `;

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Academic record not found or unauthorized." });
    }

    res.json({ success: true, message: "Academic record deleted successfully." });
  } catch (error) {
    console.error("Delete academic error:", error);
    res.status(500).json({ success: false, message: "Failed to delete academic record." });
  }
}

module.exports = {
  getAcademics,
  addAcademic,
  updateAcademic,
  deleteAcademic,
};

