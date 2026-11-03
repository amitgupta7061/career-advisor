const { getDb } = require("../config/db");
const { getStudentProfileId } = require("../services/profileService");

/**
 * GET /api/profile/skills
 */
async function getSkills(req, res) {
  try {
    const sql = getDb();
    const profileId = await getStudentProfileId(req.user.id);
    const { category, search } = req.query;

    let skills;
    if (category && search) {
      skills = await sql`
        SELECT * FROM student_skills 
        WHERE student_profile_id = ${profileId} 
          AND skill_category = ${category}
          AND skill_name ILIKE ${'%' + search + '%'}
        ORDER BY skill_name ASC
      `;
    } else if (category) {
      skills = await sql`
        SELECT * FROM student_skills 
        WHERE student_profile_id = ${profileId} 
          AND skill_category = ${category}
        ORDER BY skill_name ASC
      `;
    } else if (search) {
      skills = await sql`
        SELECT * FROM student_skills 
        WHERE student_profile_id = ${profileId} 
          AND skill_name ILIKE ${'%' + search + '%'}
        ORDER BY skill_category, skill_name ASC
      `;
    } else {
      skills = await sql`
        SELECT * FROM student_skills 
        WHERE student_profile_id = ${profileId} 
        ORDER BY skill_category, skill_name ASC
      `;
    }

    res.json({ success: true, count: skills.length, data: skills });
  } catch (error) {
    console.error("Get skills error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch skills." });
  }
}

/**
 * POST /api/profile/skills
 */
async function addSkill(req, res) {
  try {
    const sql = getDb();
    const profileId = await getStudentProfileId(req.user.id);
    const { skillName, skillCategory = "technical", proficiencyLevel = "intermediate", yearsOfExperience = 0 } = req.body;

    if (!skillName || !skillName.trim()) {
      return res.status(400).json({ success: false, message: "Skill name is required." });
    }

    const trimmedName = skillName.trim();

    // Enforce uniqueness check directly & safely
    const [existing] = await sql`
      SELECT id FROM student_skills 
      WHERE student_profile_id = ${profileId} AND LOWER(skill_name) = LOWER(${trimmedName})
    `;
    if (existing) {
      return res.status(409).json({ success: false, message: "This skill has already been added to your profile." });
    }

    const [skill] = await sql`
      INSERT INTO student_skills (
        student_profile_id, skill_name, skill_category, proficiency_level, years_of_experience
      ) VALUES (
        ${profileId}, ${trimmedName}, ${skillCategory}, ${proficiencyLevel}, ${Number(yearsOfExperience) || 0}
      )
      RETURNING *
    `;

    res.status(201).json({ success: true, message: "Skill added successfully.", data: skill });
  } catch (error) {
    console.error("Add skill error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to add skill." });
  }
}

/**
 * PATCH /api/profile/skills/:id
 */
async function updateSkill(req, res) {
  try {
    const sql = getDb();
    const profileId = await getStudentProfileId(req.user.id);
    const { id } = req.params;
    const { skillName, skillCategory, proficiencyLevel, yearsOfExperience } = req.body;

    const [updated] = await sql`
      UPDATE student_skills
      SET skill_name = COALESCE(${skillName ? skillName.trim() : null}, skill_name),
          skill_category = COALESCE(${skillCategory}, skill_category),
          proficiency_level = COALESCE(${proficiencyLevel}, proficiency_level),
          years_of_experience = COALESCE(${yearsOfExperience !== undefined ? Number(yearsOfExperience) : null}, years_of_experience),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND student_profile_id = ${profileId}
      RETURNING *
    `;

    if (!updated) {
      return res.status(404).json({ success: false, message: "Skill not found or unauthorized." });
    }

    res.json({ success: true, message: "Skill updated successfully.", data: updated });
  } catch (error) {
    console.error("Update skill error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to update skill." });
  }
}

/**
 * DELETE /api/profile/skills/:id
 */
async function deleteSkill(req, res) {
  try {
    const sql = getDb();
    const profileId = await getStudentProfileId(req.user.id);
    const { id } = req.params;

    const [deleted] = await sql`
      DELETE FROM student_skills
      WHERE id = ${id} AND student_profile_id = ${profileId}
      RETURNING id
    `;

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Skill not found or unauthorized." });
    }

    res.json({ success: true, message: "Skill removed successfully." });
  } catch (error) {
    console.error("Delete skill error:", error);
    res.status(500).json({ success: false, message: "Failed to delete skill." });
  }
}

module.exports = {
  getSkills,
  addSkill,
  updateSkill,
  deleteSkill,
};

