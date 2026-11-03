const { getDb } = require("../config/db");

/**
 * GET /api/progress/readiness
 * Computes career readiness score across 5 key pillars based on normalized student data.
 */
async function getCareerReadiness(req, res) {
  try {
    const sql = getDb();
    const userId = req.user.id;

    // 1. Fetch student profile anchor
    const [profile] = await sql`SELECT id FROM student_profiles WHERE user_id = ${userId}`;
    const profileId = profile?.id;

    // Fetch normalized skills, projects, and certifications
    let skillsCount = 0;
    let projectsCount = 0;
    let certsCount = 0;

    if (profileId) {
      const [skillsResult, projectsResult, certsResult] = await Promise.all([
        sql`SELECT count(*) as count FROM student_skills WHERE student_profile_id = ${profileId}`,
        sql`SELECT count(*) as count FROM student_projects WHERE student_profile_id = ${profileId}`,
        sql`SELECT count(*) as count FROM student_certifications WHERE student_profile_id = ${profileId}`,
      ]);
      skillsCount = parseInt(skillsResult[0]?.count || 0, 10);
      projectsCount = parseInt(projectsResult[0]?.count || 0, 10);
      certsCount = parseInt(certsResult[0]?.count || 0, 10);
    }

    // 2. Fetch learning roadmap progress
    const roadmaps = await sql`
      SELECT total_steps, completed_steps FROM learning_roadmaps WHERE user_id = ${userId}
    `;
    let totalSteps = 0, completedSteps = 0;
    roadmaps.forEach((r) => {
      totalSteps += (r.total_steps || 0);
      completedSteps += (r.completed_steps || 0);
    });
    const learningScore = totalSteps > 0 ? Math.min(100, Math.round((completedSteps / totalSteps) * 100)) : 30;

    // 3. Fetch latest resume ATS score
    const [latestResume] = await sql`
      SELECT ats_score FROM resume_analyses WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 1
    `;
    const resumeScore = latestResume ? Number(latestResume.ats_score) : 50;

    // 4. Fetch opportunity applications
    const applications = await sql`
      SELECT COUNT(*) as count FROM opportunity_applications WHERE user_id = ${userId}
    `;
    const appsCount = parseInt(applications[0]?.count || 0, 10);
    const opportunityScore = Math.min(100, 30 + appsCount * 15);

    // Calculate pillar scores
    const skillsScore = Math.min(100, Math.round((skillsCount / 6) * 100));
    const practicalProjectsScore = Math.min(100, Math.round(((projectsCount * 2 + certsCount) / 5) * 100));

    // Overall weighted readiness score (0 - 100)
    const overallScore = Math.round(
      skillsScore * 0.30 +
      practicalProjectsScore * 0.25 +
      resumeScore * 0.20 +
      learningScore * 0.15 +
      opportunityScore * 0.10
    );

    // Actionable next steps
    const nextSteps = [];
    if (skillsScore < 70) nextSteps.push("Add 2 or more target competencies in Student Profile.");
    if (practicalProjectsScore < 60) nextSteps.push("Publish a full-stack portfolio project to GitHub.");
    if (resumeScore < 75) nextSteps.push("Run Resume ATS Scanner and incorporate action verbs and impact metrics.");
    if (learningScore < 50) nextSteps.push("Complete in-progress milestones on your active Learning Roadmap.");
    if (appsCount === 0) nextSteps.push("Browse matching opportunities and submit your first application.");

    res.json({
      success: true,
      data: {
        overallScore,
        category: overallScore >= 80 ? "Industry Ready 🚀" : overallScore >= 60 ? "Proficient & Competitive ⚡" : "Developing Foundations 🌱",
        breakdown: {
          skills: skillsScore,
          projects: practicalProjectsScore,
          resume: resumeScore,
          learning: learningScore,
          opportunities: opportunityScore,
        },
        stats: {
          skillsCount,
          projectsCount,
          certsCount,
          completedSteps,
          totalSteps,
          applicationsCount: appsCount,
          latestAtsScore: latestResume ? latestResume.ats_score : null,
        },
        nextSteps,
      },
    });
  } catch (error) {
    console.error("Career readiness error:", error);
    res.status(500).json({ success: false, message: "Failed to calculate career readiness." });
  }
}

/**
 * GET /api/progress/dashboard
 * Aggregated dashboard metrics for the student home page.
 */
async function getDashboardSummary(req, res) {
  try {
    const sql = getDb();
    const userId = req.user.id;

    // Recent activities
    const activities = await sql`
      SELECT * FROM user_activities WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 5
    `;

    // Active goals
    const goals = await sql`
      SELECT * FROM user_goals WHERE user_id = ${userId} ORDER BY is_completed ASC, target_date ASC LIMIT 4
    `;

    // Active roadmap
    const [activeRoadmap] = await sql`
      SELECT lr.*, cr.title as role_title
      FROM learning_roadmaps lr
      LEFT JOIN career_roles cr ON lr.role_id = cr.id
      WHERE lr.user_id = ${userId} AND lr.status = 'active'
      ORDER BY lr.created_at DESC LIMIT 1
    `;

    // Badges count
    const badges = await sql`SELECT * FROM user_badges WHERE user_id = ${userId} ORDER BY earned_at DESC`;

    res.json({
      success: true,
      data: {
        recentActivities: activities,
        activeGoals: goals,
        activeRoadmap: activeRoadmap || null,
        badges,
      },
    });
  } catch (error) {
    console.error("Dashboard summary error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch dashboard summary." });
  }
}

/**
 * POST /api/progress/activities
 */
async function logActivity(req, res) {
  try {
    const sql = getDb();
    const userId = req.user.id;
    const { title, activityType, description } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: "Title is required." });
    }

    const [activity] = await sql`
      INSERT INTO user_activities (user_id, title, activity_type, description)
      VALUES (${userId}, ${title}, ${activityType || 'general'}, ${description || null})
      RETURNING *
    `;

    res.status(201).json({ success: true, data: activity });
  } catch (error) {
    console.error("Log activity error:", error);
    res.status(500).json({ success: false, message: "Failed to log activity." });
  }
}

/**
 * GET /api/progress/activities
 */
async function getActivities(req, res) {
  try {
    const sql = getDb();
    const userId = req.user.id;

    const activities = await sql`
      SELECT * FROM user_activities WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 20
    `;

    res.json({ success: true, count: activities.length, data: activities });
  } catch (error) {
    console.error("Get activities error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch activities." });
  }
}

/**
 * GET /api/progress/goals
 */
async function getGoals(req, res) {
  try {
    const sql = getDb();
    const userId = req.user.id;

    const goals = await sql`
      SELECT * FROM user_goals WHERE user_id = ${userId} ORDER BY is_completed ASC, created_at DESC
    `;

    res.json({ success: true, count: goals.length, data: goals });
  } catch (error) {
    console.error("Get goals error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch goals." });
  }
}

/**
 * POST /api/progress/goals
 */
async function createGoal(req, res) {
  try {
    const sql = getDb();
    const userId = req.user.id;
    const { title, category, targetDate } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: "Goal title is required." });
    }

    const [goal] = await sql`
      INSERT INTO user_goals (user_id, title, category, target_date)
      VALUES (${userId}, ${title}, ${category || 'learning'}, ${targetDate || null})
      RETURNING *
    `;

    res.status(201).json({ success: true, data: goal });
  } catch (error) {
    console.error("Create goal error:", error);
    res.status(500).json({ success: false, message: "Failed to create goal." });
  }
}

/**
 * PATCH /api/progress/goals/:id
 */
async function updateGoal(req, res) {
  try {
    const sql = getDb();
    const userId = req.user.id;
    const { isCompleted, title, targetDate } = req.body;
    if (isCompleted !== undefined && typeof isCompleted !== "boolean") {
      return res.status(400).json({ success: false, message: "isCompleted must be a boolean." });
    }

    const [goal] = await sql`
      UPDATE user_goals
      SET
        is_completed = COALESCE(${isCompleted}, is_completed),
        completed_at = CASE
          WHEN ${isCompleted} IS TRUE THEN COALESCE(completed_at, CURRENT_TIMESTAMP)
          WHEN ${isCompleted} IS FALSE THEN NULL
          ELSE completed_at
        END,
        title = COALESCE(${title}, title),
        target_date = COALESCE(${targetDate}, target_date)
      WHERE id = ${req.params.id} AND user_id = ${userId}
      RETURNING *
    `;

    if (!goal) {
      return res.status(404).json({ success: false, message: "Goal not found." });
    }

    res.json({ success: true, data: goal });
  } catch (error) {
    console.error("Update goal error:", error);
    res.status(500).json({ success: false, message: "Failed to update goal." });
  }
}

/**
 * DELETE /api/progress/goals/:id
 */
async function deleteGoal(req, res) {
  try {
    const sql = getDb();
    const userId = req.user.id;

    await sql`DELETE FROM user_goals WHERE id = ${req.params.id} AND user_id = ${userId}`;
    res.json({ success: true, message: "Goal deleted successfully." });
  } catch (error) {
    console.error("Delete goal error:", error);
    res.status(500).json({ success: false, message: "Failed to delete goal." });
  }
}

/**
 * GET /api/progress/badges
 */
async function getUserBadges(req, res) {
  try {
    const sql = getDb();
    const userId = req.user.id;

    const [profile] = await sql`SELECT id FROM student_profiles WHERE user_id = ${userId}`;
    const profileId = profile?.id;

    let skillsCount = 0;
    if (profileId) {
      const [skillsCountRes] = await sql`SELECT count(*) as count FROM student_skills WHERE student_profile_id = ${profileId}`;
      skillsCount = parseInt(skillsCountRes?.count || 0, 10);
    }

    const [resume] = await sql`SELECT ats_score FROM resume_analyses WHERE user_id = ${userId} ORDER BY ats_score DESC LIMIT 1`;
    const [completedSteps] = await sql`
      SELECT COUNT(*) as count FROM roadmap_steps rs
      JOIN learning_roadmaps lr ON rs.roadmap_id = lr.id
      WHERE lr.user_id = ${userId} AND rs.status = 'completed'
    `;

    // Award "Skill Explorer" if >= 3 skills
    if (skillsCount >= 3) {
      await sql`
        INSERT INTO user_badges (user_id, badge_code, badge_name, badge_icon, badge_description)
        VALUES (${userId}, 'SKILL_EXPLORER', 'Skill Explorer', '🎯', 'Added 3 or more verified technical skills to your profile.')
        ON CONFLICT (user_id, badge_code) DO NOTHING
      `;
    }

    // Award "ATS Pro" if ATS >= 75
    if (resume && resume.ats_score >= 75) {
      await sql`
        INSERT INTO user_badges (user_id, badge_code, badge_name, badge_icon, badge_description)
        VALUES (${userId}, 'ATS_PRO', 'ATS 75+ Club', '📄', 'Achieved an ATS compatibility score of 75 or higher on your resume.')
        ON CONFLICT (user_id, badge_code) DO NOTHING
      `;
    }

    // Award "Fast Learner" if completed at least 1 roadmap step
    if (parseInt(completedSteps.count, 10) >= 1) {
      await sql`
        INSERT INTO user_badges (user_id, badge_code, badge_name, badge_icon, badge_description)
        VALUES (${userId}, 'FAST_LEARNER', 'Fast Learner', '⚡', 'Successfully completed your first roadmap learning module.')
        ON CONFLICT (user_id, badge_code) DO NOTHING
      `;
    }

    const earnedBadges = await sql`
      SELECT * FROM user_badges WHERE user_id = ${userId} ORDER BY earned_at DESC
    `;

    const allBadgesCatalog = [
      { code: 'SKILL_EXPLORER', name: 'Skill Explorer', icon: '🎯', description: 'Add 3 or more technical skills.' },
      { code: 'FAST_LEARNER', name: 'Fast Learner', icon: '⚡', description: 'Complete your first roadmap milestone.' },
      { code: 'ATS_PRO', name: 'ATS 75+ Club', icon: '📄', description: 'Score 75+ on Resume ATS Scanner.' },
      { code: 'OPPORTUNITY_HUNTER', name: 'Opportunity Hunter', icon: '💼', description: 'Submit 3 job or internship applications.' },
      { code: 'CAREER_READY', name: 'Career Ready Master', icon: '🏆', description: 'Attain an overall career readiness score >= 85.' },
    ];

    res.json({
      success: true,
      earned: earnedBadges,
      catalog: allBadgesCatalog,
    });
  } catch (error) {
    console.error("Get badges error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch badges." });
  }
}

module.exports = {
  getCareerReadiness,
  getDashboardSummary,
  logActivity,
  getActivities,
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  getUserBadges,
};
