const { getDb } = require("../config/db");
const { loadStudentProfileData } = require("../services/profileLoaderService");
const { calculateSkillGap } = require("../services/skillGapService");
const aiManager = require("../adapters/aiManager");

/**
 * POST /api/career/skill-gaps/analyze
 * Performs deterministic skill gap analysis and generates AI explanations
 */
async function analyzeSkillGap(req, res) {
  try {
    const sql = getDb();
    const userId = req.user.id;
    const { roleId, roleSlug } = req.body;

    if (!roleId && !roleSlug) {
      return res.status(400).json({ success: false, message: "roleId or roleSlug is required." });
    }

    // 1. Fetch career role
    let role;
    if (roleId) {
      const [r] = await sql`SELECT * FROM career_roles WHERE id = ${roleId}`;
      role = r;
    } else {
      const [r] = await sql`SELECT * FROM career_roles WHERE slug = ${roleSlug}`;
      role = r;
    }

    if (!role) {
      return res.status(404).json({ success: false, message: "Target career role not found." });
    }

    // 2. Load student profile data
    const studentProfile = await loadStudentProfileData(userId);

    // 3. Load structured skill requirements for the role
    let requiredSkills = await sql`
      SELECT id, role_id, skill_name, skill_category, required_level, importance, why_needed
      FROM role_skill_requirements
      WHERE role_id = ${role.id}
      ORDER BY
        CASE importance
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END,
        skill_name ASC
    `;

    // Dynamic fallback if new role was added without custom entries in role_skill_requirements
    if (!requiredSkills || requiredSkills.length === 0) {
      requiredSkills = (role.required_skills || []).map((name, i) => ({
        skill_name: name,
        skill_category: "technical",
        required_level: i < 2 ? 3 : 2,
        importance: i < 3 ? "critical" : "high",
        why_needed: `Essential core capability for ${role.title}.`,
      }));
    }

    // 4. Perform pure deterministic calculation
    const deterministicResult = calculateSkillGap(studentProfile.skills, requiredSkills);

    // 5. Generate AI insights & explanations (Gemini -> Groq -> Heuristic fallback)
    const { insights, providerUsed, fallbackNotice } = await aiManager.generateSkillGapInsights(
      role,
      deterministicResult,
      studentProfile
    );

    // Merge AI insights with individual skill gap objects
    const explanationMap = new Map();
    (insights.skillExplanations || []).forEach((exp) => {
      if (exp.skillName) explanationMap.set(exp.skillName.toLowerCase(), exp);
    });

    const enrichWithAI = (item) => {
      const exp = explanationMap.get(item.name.toLowerCase());
      return {
        ...item,
        industrySignificance: exp?.industrySignificance || item.whyNeeded,
        recommendedAction: exp?.recommendedAction || `Practice and build working components using ${item.name}.`,
      };
    };

    const enrichedMissing = deterministicResult.missingSkills.map(enrichWithAI);
    const enrichedImproving = deterministicResult.improvingSkills.map(enrichWithAI);

    const fullAnalysisData = {
      role: {
        id: role.id,
        title: role.title,
        slug: role.slug,
        category: role.category,
        description: role.description,
      },
      metrics: {
        overallMatchPercentage: deterministicResult.overallMatchPercentage,
        overallGapPercentage: deterministicResult.overallGapPercentage,
        totalSkillsEvaluated: deterministicResult.totalSkillsEvaluated,
        missingCount: deterministicResult.missingCount,
        improvingCount: deterministicResult.improvingCount,
        meetingCount: deterministicResult.meetingCount,
      },
      missingSkills: enrichedMissing,
      improvingSkills: enrichedImproving,
      meetingSkills: deterministicResult.meetingSkills,
      insights: {
        executiveSummary: insights.executiveSummary,
        strategicFocus: insights.strategicFocus,
        phasedRoadmap: insights.phasedRoadmap,
      },
      providerUsed,
      fallbackNotice: fallbackNotice || null,
      analyzedAt: new Date().toISOString(),
    };

    // 6. Update active individual skill_gaps in database
    await sql`DELETE FROM skill_gaps WHERE user_id = ${userId} AND role_id = ${role.id}`;

    for (const gap of [...enrichedMissing, ...enrichedImproving]) {
      try {
        await sql`
          INSERT INTO skill_gaps (
            user_id, role_id, skill_name, priority, current_level, required_level, status
          ) VALUES (
            ${userId},
            ${role.id},
            ${gap.name},
            ${gap.priority},
            ${gap.currentLevel},
            ${gap.requiredLevel},
            'pending'
          )
        `;
      } catch (e) {
        console.warn(`Could not insert skill gap ${gap.name}:`, e.message);
      }
    }

    // 7. Record historical analysis snapshot in skill_gap_analyses table
    const [snapshot] = await sql`
      INSERT INTO skill_gap_analyses (
        user_id, role_id, overall_match_percentage, overall_gap_percentage, summary, analysis_data, provider_used
      ) VALUES (
        ${userId},
        ${role.id},
        ${deterministicResult.overallMatchPercentage},
        ${deterministicResult.overallGapPercentage},
        ${insights.executiveSummary},
        ${JSON.stringify(fullAnalysisData)},
        ${providerUsed}
      )
      RETURNING id, created_at
    `;

    res.json({
      success: true,
      analysisId: snapshot.id,
      data: fullAnalysisData,
    });
  } catch (error) {
    console.error("Skill Gap Analysis error:", error);
    res.status(500).json({ success: false, message: "Failed to perform skill gap analysis." });
  }
}

/**
 * GET /api/career/skill-gaps/history
 * Returns historical skill gap analysis snapshots for progress tracking
 */
async function getSkillGapHistory(req, res) {
  try {
    const sql = getDb();
    const userId = req.user.id;
    const { roleId } = req.query;

    const history = roleId
      ? await sql`
          SELECT sga.id, sga.user_id, sga.role_id, sga.overall_match_percentage,
                 sga.overall_gap_percentage, sga.summary, sga.provider_used, sga.created_at,
                 cr.title as role_title, cr.slug as role_slug, cr.category as role_category
          FROM skill_gap_analyses sga
          JOIN career_roles cr ON sga.role_id = cr.id
          WHERE sga.user_id = ${userId} AND sga.role_id = ${roleId}
          ORDER BY sga.created_at DESC
          LIMIT 20
        `
      : await sql`
          SELECT sga.id, sga.user_id, sga.role_id, sga.overall_match_percentage,
                 sga.overall_gap_percentage, sga.summary, sga.provider_used, sga.created_at,
                 cr.title as role_title, cr.slug as role_slug, cr.category as role_category
          FROM skill_gap_analyses sga
          JOIN career_roles cr ON sga.role_id = cr.id
          WHERE sga.user_id = ${userId}
          ORDER BY sga.created_at DESC
          LIMIT 20
        `;

    res.json({ success: true, count: history.length, data: history });
  } catch (error) {
    console.error("Skill gap history error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch skill gap history." });
  }
}

/**
 * GET /api/career/skill-gaps/requirements/:roleId
 * Returns structured requirements for a career role
 */
async function getRoleSkillRequirements(req, res) {
  try {
    const sql = getDb();
    const { roleId } = req.params;

    const [role] = await sql`SELECT id, title, slug, category, description FROM career_roles WHERE id = ${roleId}`;
    if (!role) {
      return res.status(404).json({ success: false, message: "Role not found." });
    }

    const requirements = await sql`
      SELECT id, skill_name, skill_category, required_level, importance, why_needed
      FROM role_skill_requirements
      WHERE role_id = ${roleId}
      ORDER BY
        CASE importance
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END,
        skill_name ASC
    `;

    res.json({
      success: true,
      data: {
        role,
        requirements,
      },
    });
  } catch (error) {
    console.error("Get role requirements error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch role requirements." });
  }
}

module.exports = {
  analyzeSkillGap,
  getSkillGapHistory,
  getRoleSkillRequirements,
};

