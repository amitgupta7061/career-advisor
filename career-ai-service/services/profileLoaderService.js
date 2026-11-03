const { getDb } = require("../config/db");

/**
 * Loads consolidated student profile data from the database.
 * Aggregates user details, student_profiles, academics, skills, preferences, projects, experiences, and certifications.
 *
 * @param {number} userId
 * @returns {Promise<object>}
 */
async function loadStudentProfileData(userId) {
  const sql = getDb();

  // 1. Fetch user & core student profile
  const [user] = await sql`
    SELECT id, first_name, last_name, email, role, bio, location
    FROM users WHERE id = ${userId}
  `;

  if (!user) {
    throw new Error(`User with ID ${userId} not found.`);
  }

  const [profile] = await sql`
    SELECT * FROM student_profiles WHERE user_id = ${userId}
  `;

  const profileId = profile ? profile.id : null;

  if (!profileId) {
    return {
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      skills: [],
      academics: [],
      preferences: {},
      projects: [],
      experiences: [],
      certifications: [],
    };
  }

  // 2. Fetch all normalized sub-entities in parallel
  const [academics, skills, [preferences], projects, experiences, certifications] = await Promise.all([
    sql`SELECT institution_name, degree, field_of_study, current_semester, grade_score, grade_type FROM student_academics WHERE student_profile_id = ${profileId}`,
    sql`SELECT skill_name, skill_category, proficiency_level, years_of_experience FROM student_skills WHERE student_profile_id = ${profileId}`,
    sql`SELECT preferred_domains, preferred_roles, preferred_industries, preferred_locations, work_preference, employment_type, short_term_goal, long_term_goal FROM student_career_preferences WHERE student_profile_id = ${profileId}`,
    sql`SELECT title, description, technologies, category, status FROM student_projects WHERE student_profile_id = ${profileId}`,
    sql`SELECT organization, role_title, employment_type, is_current, technologies_used FROM student_experiences WHERE student_profile_id = ${profileId}`,
    sql`SELECT name, issuing_organization, related_skills FROM student_certifications WHERE student_profile_id = ${profileId}`,
  ]);

  return {
    userId,
    profileId,
    name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    location: profile.city || user.location,
    bio: profile.bio || user.bio,
    academics,
    skills,
    preferences: preferences || {},
    projects,
    experiences,
    certifications,
  };
}

module.exports = { loadStudentProfileData };

