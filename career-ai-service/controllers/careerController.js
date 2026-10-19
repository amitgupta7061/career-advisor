const { getDb, getRedis } = require("../config/db");

/**
 * GET /api/career/roles
 * Get all available career roles.
 */
async function getAllRoles(req, res) {
  try {
    const redis = getRedis();
    const cached = await redis.get("career:all_roles");
    if (cached) {
      return res.json({ success: true, data: typeof cached === "string" ? JSON.parse(cached) : cached });
    }

    const sql = getDb();
    const roles = await sql`
      SELECT id, title, slug, category, description, avg_salary_min, avg_salary_max,
             demand_level, growth_rate, required_skills, nice_to_have
      FROM career_roles ORDER BY title
    `;

    await redis.set("career:all_roles", JSON.stringify(roles), { ex: 3600 });

    res.json({ success: true, data: roles });
  } catch (error) {
    console.error("Get roles error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch career roles." });
  }
}

/**
 * GET /api/career/roles/:slug
 * Get a single career role by slug.
 */
async function getRoleBySlug(req, res) {
  try {
    const sql = getDb();
    const [role] = await sql`
      SELECT * FROM career_roles WHERE slug = ${req.params.slug}
    `;

    if (!role) {
      return res.status(404).json({ success: false, message: "Career role not found." });
    }

    res.json({ success: true, data: role });
  } catch (error) {
    console.error("Get role error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch career role." });
  }
}

/**
 * POST /api/career/recommend
 * Generate career recommendations based on user's skills.
 * This is the core AI recommendation engine.
 */
async function getRecommendations(req, res) {
  try {
    const sql = getDb();
    const userId = req.user.id;

    // Get user's skills from student profile
    const [profile] = await sql`
      SELECT skills, interests, career_goals FROM student_profiles WHERE user_id = ${userId}
    `;

    if (!profile || !profile.skills || profile.skills.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please update your profile with skills first.",
      });
    }

    const userSkills = profile.skills.map((s) => s.toLowerCase());
    const userInterests = (profile.interests || []).map((s) => s.toLowerCase());

    // Get all career roles
    const roles = await sql`SELECT * FROM career_roles`;

    // Calculate match scores for each role
    const recommendations = roles.map((role) => {
      const requiredSkills = role.required_skills.map((s) => s.toLowerCase());
      const niceToHave = role.nice_to_have.map((s) => s.toLowerCase());

      // Skills the user already has that are required
      const matchedRequired = requiredSkills.filter((s) => userSkills.includes(s));
      const matchedNice = niceToHave.filter((s) => userSkills.includes(s));

      // Missing skills
      const missingRequired = requiredSkills.filter((s) => !userSkills.includes(s));
      const missingNice = niceToHave.filter((s) => !userSkills.includes(s));

      // Score calculation (weighted)
      const requiredWeight = 0.7;
      const niceWeight = 0.15;
      const interestWeight = 0.15;

      const requiredScore =
        requiredSkills.length > 0
          ? (matchedRequired.length / requiredSkills.length) * 100
          : 0;

      const niceScore =
        niceToHave.length > 0
          ? (matchedNice.length / niceToHave.length) * 100
          : 0;

      // Interest alignment bonus
      const categoryMatch = userInterests.some(
        (i) =>
          role.category.toLowerCase().includes(i) ||
          i.includes(role.category.toLowerCase())
      );
      const interestScore = categoryMatch ? 100 : 0;

      const totalScore =
        requiredScore * requiredWeight +
        niceScore * niceWeight +
        interestScore * interestWeight;

      return {
        roleId: role.id,
        title: role.title,
        slug: role.slug,
        category: role.category,
        description: role.description,
        avgSalaryMin: role.avg_salary_min,
        avgSalaryMax: role.avg_salary_max,
        demandLevel: role.demand_level,
        growthRate: role.growth_rate,
        matchScore: Math.round(totalScore * 100) / 100,
        matchedSkills: matchedRequired.concat(matchedNice),
        missingSkills: missingRequired,
        missingNiceToHave: missingNice,
        totalRequired: requiredSkills.length,
        totalMatched: matchedRequired.length,
      };
    });

    // Sort by match score descending
    recommendations.sort((a, b) => b.matchScore - a.matchScore);

    // Store top recommendations in DB
    await sql`DELETE FROM career_recommendations WHERE user_id = ${userId}`;

    for (const rec of recommendations.slice(0, 5)) {
      await sql`
        INSERT INTO career_recommendations (user_id, role_id, match_score, matched_skills, missing_skills, reasoning)
        VALUES (${userId}, ${rec.roleId}, ${rec.matchScore}, ${rec.matchedSkills}, ${rec.missingSkills}, ${`Matched ${rec.totalMatched}/${rec.totalRequired} required skills`})
      `;
    }

    res.json({
      success: true,
      data: {
        userSkills: profile.skills,
        recommendations: recommendations.slice(0, 10),
        totalRolesAnalyzed: roles.length,
      },
    });
  } catch (error) {
    console.error("Recommendation error:", error);
    res.status(500).json({ success: false, message: "Failed to generate recommendations." });
  }
}

/**
 * GET /api/career/skill-gaps
 * Get skill gaps for user's top recommended careers.
 */
async function getSkillGaps(req, res) {
  try {
    const sql = getDb();
    const userId = req.user.id;

    const gaps = await sql`
      SELECT sg.*, cr.title as role_title, cr.slug as role_slug
      FROM skill_gaps sg
      JOIN career_roles cr ON sg.role_id = cr.id
      WHERE sg.user_id = ${userId}
      ORDER BY
        CASE sg.priority
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END,
        sg.created_at DESC
    `;

    res.json({ success: true, data: gaps });
  } catch (error) {
    console.error("Skill gaps error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch skill gaps." });
  }
}

/**
 * POST /api/career/skill-gaps/analyze
 * Analyze and create skill gap records for a specific career role.
 */
async function analyzeSkillGaps(req, res) {
  try {
    const sql = getDb();
    const userId = req.user.id;
    const { roleId } = req.body;

    // Get role requirements
    const [role] = await sql`SELECT * FROM career_roles WHERE id = ${roleId}`;
    if (!role) {
      return res.status(404).json({ success: false, message: "Career role not found." });
    }

    // Get user skills
    const [profile] = await sql`
      SELECT skills FROM student_profiles WHERE user_id = ${userId}
    `;
    const userSkills = (profile?.skills || []).map((s) => s.toLowerCase());

    // Find missing skills
    const missingRequired = role.required_skills.filter(
      (s) => !userSkills.includes(s.toLowerCase())
    );
    const missingNice = role.nice_to_have.filter(
      (s) => !userSkills.includes(s.toLowerCase())
    );

    // Clear old gaps for this role
    await sql`
      DELETE FROM skill_gaps WHERE user_id = ${userId} AND role_id = ${roleId}
    `;

    // Insert new gaps
    for (let i = 0; i < missingRequired.length; i++) {
      const priority = i < 2 ? "critical" : i < 4 ? "high" : "medium";
      await sql`
        INSERT INTO skill_gaps (user_id, role_id, skill_name, priority, required_level)
        VALUES (${userId}, ${roleId}, ${missingRequired[i]}, ${priority}, 5)
      `;
    }

    for (const skill of missingNice) {
      await sql`
        INSERT INTO skill_gaps (user_id, role_id, skill_name, priority, required_level)
        VALUES (${userId}, ${roleId}, ${skill}, 'low', 3)
      `;
    }

    // Fetch the created gaps
    const gaps = await sql`
      SELECT * FROM skill_gaps WHERE user_id = ${userId} AND role_id = ${roleId}
      ORDER BY CASE priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END
    `;

    res.json({
      success: true,
      data: {
        role: role.title,
        totalGaps: gaps.length,
        criticalGaps: gaps.filter((g) => g.priority === "critical").length,
        gaps,
      },
    });
  } catch (error) {
    console.error("Analyze skill gaps error:", error);
    res.status(500).json({ success: false, message: "Failed to analyze skill gaps." });
  }
}

module.exports = {
  getAllRoles,
  getRoleBySlug,
  getRecommendations,
  getSkillGaps,
  analyzeSkillGaps,
};
