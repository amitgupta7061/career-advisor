const { getDb } = require("../config/db");
const { loadStudentProfileData } = require("../services/profileLoaderService");
const aiManager = require("../adapters/aiManager");

/**
 * POST /api/career/recommend
 * Generates ranked AI career recommendations based on student's full profile
 */
async function generateRecommendations(req, res) {
  try {
    const sql = getDb();
    const userId = req.user.id;

    // 1. Load full student profile
    const studentProfile = await loadStudentProfileData(userId);

    // 2. Fetch available target career roles from database
    const roles = await sql`
      SELECT id, title, slug, category, description, avg_salary_min, avg_salary_max,
             demand_level, growth_rate, required_skills, nice_to_have
      FROM career_roles
      ORDER BY title
    `;

    if (!roles || roles.length === 0) {
      return res.status(500).json({ success: false, message: "No career roles catalog available." });
    }

    // 3. Invoke multi-provider AI manager
    const { result, providerUsed, fallbackNotice } = await aiManager.generateRecommendations(studentProfile, roles);

    // 4. Persist recommendations into career_recommendations & skill_gaps tables
    await sql`UPDATE career_recommendations SET is_active = false WHERE user_id = ${userId}`;

    for (const rec of result.recommendedRoles) {
      // Find matching role in db
      const matchingRole = roles.find(
        (r) => r.slug === rec.slug || r.title.toLowerCase() === rec.roleTitle.toLowerCase()
      );
      const roleId = matchingRole ? matchingRole.id : null;

      const matchedSkills = (rec.matchingSkills || []).map((s) => (typeof s === "string" ? s : s.name || String(s)));
      const missingSkills = (rec.missingSkills || []).map((s) => (typeof s === "string" ? s : s.name || String(s)));

      await sql`
        INSERT INTO career_recommendations (
          user_id, role_id, match_score, matched_skills, missing_skills, reasoning, is_active
        ) VALUES (
          ${userId},
          ${roleId},
          ${rec.suitabilityScore},
          ${matchedSkills},
          ${missingSkills},
          ${rec.reasoning},
          true
        )
      `;

      // Save skill gaps if roleId exists
      if (roleId) {
        for (const gap of missingSkills) {
          const gapName = typeof gap === "string" ? gap : gap.name || String(gap);
          const priority = (typeof gap === "object" && gap.priority) ? gap.priority : "high";
          
          try {
            const existing = await sql`
              SELECT id FROM skill_gaps 
              WHERE user_id = ${userId} AND role_id = ${roleId} AND LOWER(skill_name) = LOWER(${gapName})
            `;
            if (existing.length === 0) {
              await sql`
                INSERT INTO skill_gaps (user_id, role_id, skill_name, priority, current_level, required_level, status)
                VALUES (${userId}, ${roleId}, ${gapName}, ${priority}, 1, 5, 'pending')
              `;
            }
          } catch (gapErr) {
            console.warn(`Failed to insert skill gap: ${gapName}`, gapErr.message);
          }
        }
      }
    }

    res.json({
      success: true,
      provider: providerUsed,
      fallbackNotice: fallbackNotice || null,
      data: result,
    });
  } catch (error) {
    console.error("Generate recommendations error:", error);
    res.status(500).json({ success: false, message: "Failed to generate career recommendations." });
  }
}

/**
 * GET /api/career/recommendations/latest
 * Retrieves latest active recommendations from database
 */
async function getLatestRecommendations(req, res) {
  try {
    const sql = getDb();
    const userId = req.user.id;

    const recs = await sql`
      SELECT cr.*, r.title as role_title, r.slug as role_slug, r.category as domain,
             r.demand_level, r.growth_rate, r.avg_salary_min, r.avg_salary_max
      FROM career_recommendations cr
      LEFT JOIN career_roles r ON cr.role_id = r.id
      WHERE cr.user_id = ${userId} AND cr.is_active = true
      ORDER BY cr.match_score DESC
    `;

    res.json({ success: true, count: recs.length, data: recs });
  } catch (error) {
    console.error("Get latest recommendations error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch saved recommendations." });
  }
}

module.exports = {
  generateRecommendations,
  getLatestRecommendations,
};
