const { getDb } = require("../config/db");

/**
 * Helper to ensure a student profile exists for the given user,
 * returning the student_profile record.
 * 
 * Enforces ownership: only returns profile owned by userId.
 */
async function getOrCreateStudentProfile(userId) {
  const sql = getDb();
  let [profile] = await sql`
    SELECT * FROM student_profiles WHERE user_id = ${userId}
  `;

  if (!profile) {
    [profile] = await sql`
      INSERT INTO student_profiles (user_id)
      VALUES (${userId})
      RETURNING *
    `;
  }

  return profile;
}

/**
 * Get the profile ID for a user. Throws 403/404 if not found.
 */
async function getStudentProfileId(userId) {
  const profile = await getOrCreateStudentProfile(userId);
  return profile.id;
}

module.exports = {
  getOrCreateStudentProfile,
  getStudentProfileId,
};

