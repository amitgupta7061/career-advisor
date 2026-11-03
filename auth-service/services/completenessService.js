const { getDb } = require("../config/db");

/**
 * Computes profile completeness based on defined weighting rules:
 * - Personal details (15%): phone, bio, city, and at least one social/portfolio link
 * - Academics (20%): at least one academic qualification record with degree and grade
 * - Skills (25%): at least 3 technical skills + 1 soft skill
 * - Career Preferences (15%): preferred roles and domains selected
 * - Projects (15%): at least 1 project with description and technology stack
 * - Experience / Certifications (10%): at least 1 internship/job experience OR 1 certification
 *
 * @param {number} profileId - student_profiles.id
 * @returns {Promise<{score: number, breakdown: object}>}
 */
async function calculateProfileCompleteness(profileId) {
  const sql = getDb();

  const [
    [profile],
    academics,
    skills,
    [preferences],
    projects,
    experiences,
    certifications
  ] = await Promise.all([
    sql`SELECT phone, bio, city, linkedin_url, github_url, portfolio_url FROM student_profiles WHERE id = ${profileId}`,
    sql`SELECT id, degree, grade_score FROM student_academics WHERE student_profile_id = ${profileId}`,
    sql`SELECT id, skill_category FROM student_skills WHERE student_profile_id = ${profileId}`,
    sql`SELECT preferred_roles, preferred_domains FROM student_career_preferences WHERE student_profile_id = ${profileId}`,
    sql`SELECT id, title, description, technologies FROM student_projects WHERE student_profile_id = ${profileId}`,
    sql`SELECT id FROM student_experiences WHERE student_profile_id = ${profileId}`,
    sql`SELECT id FROM student_certifications WHERE student_profile_id = ${profileId}`
  ]);

  if (!profile) return { score: 0, breakdown: {} };

  const breakdown = {
    personal: 0,
    academics: 0,
    skills: 0,
    preferences: 0,
    projects: 0,
    experienceOrCerts: 0,
  };

  // 1. Personal (15%)
  let personalPoints = 0;
  if (profile.phone) personalPoints += 4;
  if (profile.bio && profile.bio.trim().length > 10) personalPoints += 4;
  if (profile.city) personalPoints += 3;
  if (profile.linkedin_url || profile.github_url || profile.portfolio_url) personalPoints += 4;
  breakdown.personal = Math.min(15, personalPoints);

  // 2. Academics (20%)
  if (academics.length > 0) {
    const hasDegree = academics.some((a) => a.degree);
    const hasGrade = academics.some((a) => a.grade_score !== null);
    if (hasDegree && hasGrade) {
      breakdown.academics = 20;
    } else if (hasDegree) {
      breakdown.academics = 12;
    }
  }

  // 3. Skills (25%): 3 technical + 1 soft
  const technicalCount = skills.filter((s) => s.skill_category === "technical" || s.skill_category === "tool").length;
  const softCount = skills.filter((s) => s.skill_category === "soft" || s.skill_category === "language").length;
  let skillsScore = 0;
  skillsScore += Math.min(18, technicalCount * 6); // up to 18 points for 3 tech skills
  skillsScore += Math.min(7, softCount * 7);       // up to 7 points for 1 soft skill
  breakdown.skills = Math.min(25, skillsScore);

  // 4. Preferences (15%)
  if (preferences) {
    let prefScore = 0;
    if (preferences.preferred_roles && preferences.preferred_roles.length > 0) prefScore += 8;
    if (preferences.preferred_domains && preferences.preferred_domains.length > 0) prefScore += 7;
    breakdown.preferences = Math.min(15, prefScore);
  }

  // 5. Projects (15%)
  if (projects.length > 0) {
    const validProjects = projects.filter((p) => p.title && p.technologies && p.technologies.length > 0);
    if (validProjects.length >= 2) {
      breakdown.projects = 15;
    } else if (validProjects.length === 1) {
      breakdown.projects = 10;
    } else {
      breakdown.projects = 5;
    }
  }

  // 6. Experience or Certifications (10%)
  if (experiences.length > 0 && certifications.length > 0) {
    breakdown.experienceOrCerts = 10;
  } else if (experiences.length > 0 || certifications.length > 0) {
    breakdown.experienceOrCerts = 8;
  }

  const totalScore = Math.min(
    100,
    breakdown.personal +
    breakdown.academics +
    breakdown.skills +
    breakdown.preferences +
    breakdown.projects +
    breakdown.experienceOrCerts
  );

  // Update cached score in database
  await sql`
    UPDATE student_profiles
    SET profile_completeness = ${totalScore},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${profileId}
  `;

  return { score: totalScore, breakdown };
}

module.exports = {
  calculateProfileCompleteness,
};

