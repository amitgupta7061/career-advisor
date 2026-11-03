const { getDb } = require("../config/db");
const { getStudentProfileId } = require("../services/profileService");

/**
 * GET /api/profile/preferences
 */
async function getPreferences(req, res) {
  try {
    const sql = getDb();
    const profileId = await getStudentProfileId(req.user.id);
    const [preferences] = await sql`
      SELECT * FROM student_career_preferences WHERE student_profile_id = ${profileId}
    `;

    res.json({
      success: true,
      data: preferences || {
        preferred_domains: [],
        preferred_roles: [],
        preferred_industries: [],
        preferred_locations: [],
        work_preference: "flexible",
        employment_type: "full_time",
        short_term_goal: "",
        long_term_goal: "",
      },
    });
  } catch (error) {
    console.error("Get preferences error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch preferences." });
  }
}

/**
 * PUT /api/profile/preferences
 * Upserts career preferences for the authenticated student
 */
async function updatePreferences(req, res) {
  try {
    const sql = getDb();
    const profileId = await getStudentProfileId(req.user.id);
    const {
      preferredDomains = [],
      preferredRoles = [],
      preferredIndustries = [],
      preferredLocations = [],
      workPreference = "flexible",
      employmentType = "full_time",
      shortTermGoal = "",
      longTermGoal = ""
    } = req.body;

    const [saved] = await sql`
      INSERT INTO student_career_preferences (
        student_profile_id, preferred_domains, preferred_roles,
        preferred_industries, preferred_locations, work_preference,
        employment_type, short_term_goal, long_term_goal
      ) VALUES (
        ${profileId}, ${preferredDomains}, ${preferredRoles},
        ${preferredIndustries}, ${preferredLocations}, ${workPreference},
        ${employmentType}, ${shortTermGoal}, ${longTermGoal}
      )
      ON CONFLICT (student_profile_id) DO UPDATE
      SET preferred_domains = EXCLUDED.preferred_domains,
          preferred_roles = EXCLUDED.preferred_roles,
          preferred_industries = EXCLUDED.preferred_industries,
          preferred_locations = EXCLUDED.preferred_locations,
          work_preference = EXCLUDED.work_preference,
          employment_type = EXCLUDED.employment_type,
          short_term_goal = EXCLUDED.short_term_goal,
          long_term_goal = EXCLUDED.long_term_goal,
          updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    res.json({ success: true, message: "Career preferences updated successfully.", data: saved });
  } catch (error) {
    console.error("Update preferences error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to update preferences." });
  }
}

module.exports = {
  getPreferences,
  updatePreferences,
};

