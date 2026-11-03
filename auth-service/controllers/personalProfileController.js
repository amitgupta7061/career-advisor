const { getDb } = require("../config/db");
const { getOrCreateStudentProfile } = require("../services/profileService");

/**
 * GET /api/profile/me
 * Returns full consolidated profile for the authenticated student
 */
async function getMyProfile(req, res) {
  try {
    const sql = getDb();
    const userId = req.user.id;

    const [user] = await sql`
      SELECT id, first_name, last_name, email, role, avatar_url, bio, phone, location, created_at
      FROM users WHERE id = ${userId}
    `;

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const profile = await getOrCreateStudentProfile(userId);
    const profileId = profile.id;

    // Fetch sub-entities in parallel
    const [academics, skills, preferences, projects, experiences, certifications] = await Promise.all([
      sql`SELECT * FROM student_academics WHERE student_profile_id = ${profileId} ORDER BY graduation_year DESC NULLS LAST, created_at DESC`,
      sql`SELECT * FROM student_skills WHERE student_profile_id = ${profileId} ORDER BY skill_category, skill_name`,
      sql`SELECT * FROM student_career_preferences WHERE student_profile_id = ${profileId} LIMIT 1`,
      sql`SELECT * FROM student_projects WHERE student_profile_id = ${profileId} ORDER BY start_date DESC NULLS LAST, created_at DESC`,
      sql`SELECT * FROM student_experiences WHERE student_profile_id = ${profileId} ORDER BY start_date DESC NULLS LAST, created_at DESC`,
      sql`SELECT * FROM student_certifications WHERE student_profile_id = ${profileId} ORDER BY issue_date DESC NULLS LAST, created_at DESC`,
    ]);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          role: user.role,
        },
        personal: {
          phone: profile.phone || user.phone,
          dateOfBirth: profile.date_of_birth,
          gender: profile.gender,
          country: profile.country,
          state: profile.state,
          city: profile.city || user.location,
          bio: profile.bio || user.bio,
          avatarUrl: profile.avatar_url || user.avatar_url,
          linkedinUrl: profile.linkedin_url,
          githubUrl: profile.github_url,
          portfolioUrl: profile.portfolio_url,
          profileCompleteness: profile.profile_completeness || 0,
        },
        academics,
        skills,
        preferences: preferences[0] || null,
        projects,
        experiences,
        certifications,
      },
    });
  } catch (error) {
    console.error("Get my profile error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch profile." });
  }
}

/**
 * PATCH /api/profile/me
 * Update personal profile information
 */
async function updatePersonalProfile(req, res) {
  try {
    const sql = getDb();
    const userId = req.user.id;
    const {
      firstName, lastName, phone, dateOfBirth, gender,
      country, state, city, bio, avatarUrl, linkedinUrl,
      githubUrl, portfolioUrl
    } = req.body;

    // 1. Update basic user details
    await sql`
      UPDATE users
      SET first_name = COALESCE(${firstName}, first_name),
          last_name = COALESCE(${lastName}, last_name),
          avatar_url = COALESCE(${avatarUrl}, avatar_url),
          bio = COALESCE(${bio}, bio),
          phone = COALESCE(${phone}, phone),
          location = COALESCE(${city}, location),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${userId}
    `;

    // 2. Ensure and update student_profiles
    const profile = await getOrCreateStudentProfile(userId);

    const [updated] = await sql`
      UPDATE student_profiles
      SET phone = COALESCE(${phone}, phone),
          date_of_birth = COALESCE(${dateOfBirth ? new Date(dateOfBirth) : null}, date_of_birth),
          gender = COALESCE(${gender}, gender),
          country = COALESCE(${country}, country),
          state = COALESCE(${state}, state),
          city = COALESCE(${city}, city),
          bio = COALESCE(${bio}, bio),
          avatar_url = COALESCE(${avatarUrl}, avatar_url),
          linkedin_url = COALESCE(${linkedinUrl}, linkedin_url),
          github_url = COALESCE(${githubUrl}, github_url),
          portfolio_url = COALESCE(${portfolioUrl}, portfolio_url),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${profile.id}
      RETURNING *
    `;

    res.json({
      success: true,
      message: "Personal profile updated successfully.",
      data: updated,
    });
  } catch (error) {
    console.error("Update personal profile error:", error);
    res.status(500).json({ success: false, message: "Failed to update profile." });
  }
}

module.exports = {
  getMyProfile,
  updatePersonalProfile,
};

