const { getDb } = require("../config/db");
const aiManager = require("../adapters/aiManager");

/**
 * Generates a structured personalized learning roadmap based on student's profile & skill gaps
 */
async function generatePersonalizedRoadmap(userId, roleId, roleTitleInput) {
  const sql = getDb();

  // 1. Fetch career role
  let role;
  if (roleId) {
    const [r] = await sql`SELECT * FROM career_roles WHERE id = ${roleId}`;
    role = r;
  } else if (roleTitleInput) {
    const [r] = await sql`SELECT * FROM career_roles WHERE title ILIKE ${`%${roleTitleInput}%`} OR slug ILIKE ${`%${roleTitleInput}%`} LIMIT 1`;
    role = r;
  }

  if (!role) {
    throw new Error("Target career role not found.");
  }

  // 2. Fetch student user and profile
  const [user] = await sql`SELECT id, first_name, last_name, email FROM users WHERE id = ${userId}`;
  const [profile] = await sql`SELECT id FROM student_profiles WHERE user_id = ${userId}`;
  const profileId = profile?.id;

  const studentSkills = profileId
    ? await sql`SELECT skill_name, proficiency_level, skill_category FROM student_skills WHERE student_profile_id = ${profileId}`
    : [];

  // 3. Fetch active skill gaps for this user and role
  const rawGaps = await sql`
    SELECT skill_name, priority, current_level, required_level
    FROM skill_gaps
    WHERE user_id = ${userId} AND role_id = ${role.id}
    ORDER BY
      CASE priority
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END
  `;

  let missingSkills = [];
  let improvingSkills = [];
  let meetingSkills = [];

  if (rawGaps.length > 0) {
    rawGaps.forEach((g) => {
      if (!g.current_level || g.current_level === 0) {
        missingSkills.push({ name: g.skill_name, priority: g.priority });
      } else {
        improvingSkills.push({ name: g.skill_name, priority: g.priority });
      }
    });
  } else {
    // If student hasn't run skill gap analysis yet, deduce from role requirements vs student skills
    const reqs = await sql`
      SELECT skill_name, required_level, importance FROM role_skill_requirements WHERE role_id = ${role.id}
    `;
    const targetSkills = reqs.length > 0 ? reqs : (role.required_skills || []).map((s) => ({ skill_name: s, importance: "high" }));

    targetSkills.forEach((t) => {
      const hasSkill = studentSkills.some(
        (s) => s.skill_name.toLowerCase().includes(t.skill_name.toLowerCase())
      );
      if (hasSkill) {
        meetingSkills.push({ name: t.skill_name });
      } else {
        missingSkills.push({ name: t.skill_name, priority: t.importance || "high" });
      }
    });
  }

  // 4. Fetch available verified courses catalog
  const availableCourses = await sql`
    SELECT id, title, platform, url, skill_tags, difficulty, duration_hrs, is_free, rating, category
    FROM courses
    ORDER BY rating DESC
  `;

  // 5. Generate roadmap with multi-provider AI engine
  const { roadmap, providerUsed, fallbackNotice } = await aiManager.generateRoadmap(
    role,
    { missingSkills, improvingSkills, meetingSkills },
    { name: `${user?.first_name || ""} ${user?.last_name || ""}`.trim() },
    availableCourses
  );

  // 6. Manage roadmap versioning: archive previous active roadmaps for this role
  const [existingActive] = await sql`
    SELECT id, version FROM learning_roadmaps
    WHERE user_id = ${userId} AND role_id = ${role.id} AND status = 'active'
    ORDER BY version DESC LIMIT 1
  `;

  const nextVersion = existingActive ? (existingActive.version || 1) + 1 : 1;

  if (existingActive) {
    await sql`UPDATE learning_roadmaps SET status = 'archived' WHERE id = ${existingActive.id}`;
  }

  // Flatten activities count
  let totalActivitiesCount = 0;
  const milestonesSummary = roadmap.milestones.map((m) => {
    totalActivitiesCount += (m.activities || []).length;
    return {
      milestoneIndex: m.milestoneIndex,
      title: m.title,
      durationWeeks: m.durationWeeks,
      description: m.description,
      activitiesCount: (m.activities || []).length,
    };
  });

  // 7. Insert new learning_roadmap
  const [savedRoadmap] = await sql`
    INSERT INTO learning_roadmaps (
      user_id, role_id, target_role, title, description, status,
      total_steps, completed_steps, estimated_duration_weeks, version, milestones_summary
    ) VALUES (
      ${userId},
      ${role.id},
      ${role.title},
      ${roadmap.roadmapTitle},
      ${roadmap.description},
      'active',
      ${totalActivitiesCount},
      0,
      ${roadmap.estimatedDurationWeeks},
      ${nextVersion},
      ${JSON.stringify(milestonesSummary)}
    )
    RETURNING id, created_at
  `;

  // 8. Insert individual activities into roadmap_steps
  let stepOrderCounter = 1;
  const insertedSteps = [];

  for (const milestone of roadmap.milestones) {
    for (const act of milestone.activities) {
      // Find matching course id from catalog if any
      const matchingCourse = availableCourses.find((c) =>
        (c.skill_tags || []).some((tag) => tag.toLowerCase() === act.skillName.toLowerCase()) ||
        c.title.toLowerCase().includes(act.title.toLowerCase())
      );

      const legacyResourceType = ["course", "project", "certification", "practice", "reading"].includes(act.activityType)
        ? act.activityType
        : act.activityType === "documentation" ? "reading" : "course";

      const [step] = await sql`
        INSERT INTO roadmap_steps (
          roadmap_id, step_order, title, description, resource_type,
          course_id, skill_name, estimated_hrs, status,
          activity_type, priority, milestone_index, milestone_title,
          learning_objectives, expected_outcomes, resource_url, platform, is_free
        ) VALUES (
          ${savedRoadmap.id},
          ${stepOrderCounter},
          ${act.title},
          ${act.description},
          ${legacyResourceType},
          ${matchingCourse ? matchingCourse.id : null},
          ${act.skillName},
          ${act.estimatedHrs},
          'pending',
          ${act.activityType},
          ${act.priority},
          ${milestone.milestoneIndex},
          ${milestone.title},
          ${JSON.stringify(act.learningObjectives)},
          ${act.expectedOutcomes},
          ${act.resourceUrl || matchingCourse?.url || "https://developer.mozilla.org"},
          ${act.platform || matchingCourse?.platform || "Self-guided"},
          ${act.isFree !== false}
        )
        RETURNING *
      `;

      insertedSteps.push(step);
      stepOrderCounter++;
    }
  }

  return {
    roadmapId: savedRoadmap.id,
    version: nextVersion,
    targetRole: role.title,
    title: roadmap.roadmapTitle,
    description: roadmap.description,
    estimatedDurationWeeks: roadmap.estimatedDurationWeeks,
    totalSteps: totalActivitiesCount,
    completedSteps: 0,
    progressPercentage: 0,
    milestones: roadmap.milestones,
    steps: insertedSteps,
    providerUsed,
    fallbackNotice: fallbackNotice || null,
  };
}

/**
 * Retrieves roadmap details with milestone breakdown and computed progress percentages
 */
async function getRoadmapDetail(roadmapId, userId) {
  const sql = getDb();

  const [roadmap] = await sql`
    SELECT lr.*, cr.title as role_title, cr.slug as role_slug
    FROM learning_roadmaps lr
    LEFT JOIN career_roles cr ON lr.role_id = cr.id
    WHERE lr.id = ${roadmapId} AND lr.user_id = ${userId}
  `;

  if (!roadmap) return null;

  const steps = await sql`
    SELECT rs.*, c.title as course_title, c.platform as catalog_platform, c.url as catalog_url
    FROM roadmap_steps rs
    LEFT JOIN courses c ON rs.course_id = c.id
    WHERE rs.roadmap_id = ${roadmapId}
    ORDER BY rs.milestone_index ASC, rs.step_order ASC
  `;

  // Compute milestone completion stats
  const milestoneMap = new Map();
  steps.forEach((s) => {
    const idx = s.milestone_index || 1;
    if (!milestoneMap.has(idx)) {
      milestoneMap.set(idx, {
        milestoneIndex: idx,
        title: s.milestone_title || `Phase ${idx}`,
        total: 0,
        completed: 0,
        steps: [],
      });
    }
    const m = milestoneMap.get(idx);
    m.total++;
    if (s.status === "completed") m.completed++;
    m.steps.push(s);
  });

  const milestones = Array.from(milestoneMap.values()).map((m) => ({
    ...m,
    progressPercentage: m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0,
  }));

  const totalSteps = steps.length;
  const completedSteps = steps.filter((s) => s.status === "completed").length;
  const overallProgress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return {
    ...roadmap,
    totalSteps,
    completedSteps,
    overallProgress,
    milestones,
    steps,
  };
}

/**
 * Updates a roadmap step status and triggers skill proficiency updates on completion
 */
async function updateStepStatus(roadmapId, stepId, status, userId) {
  const sql = getDb();

  const [step] = await sql`
    UPDATE roadmap_steps
    SET status = ${status},
        completed_at = ${status === "completed" ? new Date() : null}
    WHERE id = ${stepId} AND roadmap_id = ${roadmapId}
      AND EXISTS (
        SELECT 1 FROM learning_roadmaps WHERE id = ${roadmapId} AND user_id = ${userId}
      )
    RETURNING *
  `;

  if (!step) {
    throw new Error("Roadmap step not found or unauthorized.");
  }

  // Recalculate roadmap completion
  const [counts] = await sql`
    SELECT COUNT(*) FILTER (WHERE status = 'completed') as completed,
           COUNT(*) as total
    FROM roadmap_steps WHERE roadmap_id = ${roadmapId}
  `;

  const total = parseInt(counts.total, 10);
  const completed = parseInt(counts.completed, 10);
  const isFinished = total > 0 && completed === total;

  await sql`
    UPDATE learning_roadmaps
    SET completed_steps = ${completed},
        status = ${isFinished ? "completed" : "active"},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${roadmapId}
  `;

  // Skill Progression Sync: On completion of a course or project, upgrade student skill proficiency
  let skillUpdated = null;
  if (status === "completed" && step.skill_name) {
    const [profile] = await sql`SELECT id FROM student_profiles WHERE user_id = ${userId}`;
    if (profile?.id) {
      const [existingSkill] = await sql`
        SELECT id, proficiency_level FROM student_skills
        WHERE student_profile_id = ${profile.id}
          AND LOWER(skill_name) = LOWER(${step.skill_name})
      `;

      if (existingSkill) {
        // Upgrade level: beginner -> intermediate -> advanced -> expert
        const nextLevelMap = {
          beginner: "intermediate",
          intermediate: "advanced",
          advanced: "expert",
          expert: "expert",
        };
        const newLevel = nextLevelMap[existingSkill.proficiency_level?.toLowerCase()] || "intermediate";
        if (newLevel !== existingSkill.proficiency_level) {
          await sql`
            UPDATE student_skills
            SET proficiency_level = ${newLevel}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ${existingSkill.id}
          `;
          skillUpdated = { skillName: step.skill_name, newLevel };
        }
      } else {
        // Add newly acquired skill
        await sql`
          INSERT INTO student_skills (
            student_profile_id, skill_name, skill_category, proficiency_level, years_of_experience
          ) VALUES (
            ${profile.id}, ${step.skill_name}, 'technical', 'intermediate', 1
          )
          ON CONFLICT (student_profile_id, skill_name) DO NOTHING
        `;
        skillUpdated = { skillName: step.skill_name, newLevel: "intermediate" };
      }
    }
  }

  return {
    step,
    completedSteps: completed,
    totalSteps: total,
    overallProgress: total > 0 ? Math.round((completed / total) * 100) : 0,
    skillUpdated,
  };
}

/**
 * Pause or Resume a roadmap
 */
async function setRoadmapState(roadmapId, status, userId) {
  const sql = getDb();
  const allowed = ["active", "paused", "completed", "archived"];
  if (!allowed.includes(status)) {
    throw new Error(`Invalid status ${status}. Allowed: ${allowed.join(", ")}`);
  }

  const [roadmap] = await sql`
    UPDATE learning_roadmaps
    SET status = ${status},
        paused_at = ${status === "paused" ? new Date() : null},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${roadmapId} AND user_id = ${userId}
    RETURNING *
  `;

  if (!roadmap) {
    throw new Error("Roadmap not found or unauthorized.");
  }

  return roadmap;
}

module.exports = {
  generatePersonalizedRoadmap,
  getRoadmapDetail,
  updateStepStatus,
  setRoadmapState,
};
