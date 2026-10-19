const { getDb } = require("../config/db");

/**
 * GET /api/opportunities
 * Query filters: ?type=internship&location=Bengaluru&remote=true&search=React
 */
async function getOpportunities(req, res) {
  try {
    const sql = getDb();
    const { type, location, remote, search } = req.query;

    const allowedTypes = ["job", "internship", "hackathon", "scholarship"];
    if (type && !allowedTypes.includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid opportunity type." });
    }
    if (remote !== undefined && remote !== "true" && remote !== "false") {
      return res.status(400).json({ success: false, message: "Remote filter must be true or false." });
    }
    if ([type, location, search].some((value) => value !== undefined && typeof value !== "string")) {
      return res.status(400).json({ success: false, message: "Opportunity filters must be single text values." });
    }

    const typeFilter = type?.trim() || null;
    const locationFilter = location?.trim() || null;
    const searchFilter = search?.trim() || null;
    const remoteFilter = remote === undefined ? null : remote === "true";
    const searchPattern = searchFilter ? `%${searchFilter}%` : null;

    const opportunities = await sql`
      SELECT * FROM opportunities
      WHERE (${typeFilter}::text IS NULL OR opportunity_type = ${typeFilter})
        AND (${locationFilter}::text IS NULL OR location ILIKE ${locationFilter ? `%${locationFilter}%` : null})
        AND (${remoteFilter}::boolean IS NULL OR is_remote = ${remoteFilter})
        AND (
          ${searchFilter}::text IS NULL
          OR title ILIKE ${searchPattern}
          OR company ILIKE ${searchPattern}
          OR description ILIKE ${searchPattern}
          OR EXISTS (
            SELECT 1
            FROM unnest(COALESCE(required_skills, ARRAY[]::text[])) AS required_skill
            WHERE required_skill ILIKE ${searchPattern}
          )
        )
      ORDER BY created_at DESC
    `;

    res.json({ success: true, count: opportunities.length, data: opportunities });
  } catch (error) {
    console.error("Get opportunities error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch opportunities." });
  }
}

/**
 * GET /api/opportunities/:id
 */
async function getOpportunityById(req, res) {
  try {
    const sql = getDb();
    const [opp] = await sql`SELECT * FROM opportunities WHERE id = ${req.params.id}`;
    if (!opp) {
      return res.status(404).json({ success: false, message: "Opportunity not found." });
    }
    res.json({ success: true, data: opp });
  } catch (error) {
    console.error("Get opportunity detail error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch opportunity detail." });
  }
}

/**
 * GET /api/opportunities/match/me
 * Intelligent skill match against authenticated student's profile skills.
 */
async function getMatchingOpportunities(req, res) {
  try {
    const sql = getDb();
    const userId = req.user.id;

    // Fetch user's skills
    const [profile] = await sql`
      SELECT skills FROM student_profiles WHERE user_id = ${userId}
    `;

    const userSkills = (profile && profile.skills) ? profile.skills.map(s => s.toLowerCase().trim()) : [];

    const allOpportunities = await sql`SELECT * FROM opportunities ORDER BY created_at DESC`;

    const matched = allOpportunities.map(opp => {
      const reqSkills = opp.required_skills || [];
      if (reqSkills.length === 0) {
        return { ...opp, matchScore: 70, matchedSkills: [], missingSkills: [] };
      }

      const matchedSkills = reqSkills.filter(sk => userSkills.includes(sk.toLowerCase().trim()));
      const missingSkills = reqSkills.filter(sk => !userSkills.includes(sk.toLowerCase().trim()));
      const matchScore = Math.round((matchedSkills.length / reqSkills.length) * 100);

      return {
        ...opp,
        matchScore,
        matchedSkills,
        missingSkills,
      };
    });

    // Sort by highest match score
    matched.sort((a, b) => b.matchScore - a.matchScore);

    res.json({
      success: true,
      studentSkills: userSkills,
      data: matched,
    });
  } catch (error) {
    console.error("Match opportunities error:", error);
    res.status(500).json({ success: false, message: "Failed to calculate opportunity matches." });
  }
}

/**
 * POST /api/opportunities/:id/bookmark
 */
async function bookmarkOpportunity(req, res) {
  try {
    const sql = getDb();
    const userId = req.user.id;
    const oppId = req.params.id;

    await sql`
      INSERT INTO opportunity_bookmarks (user_id, opportunity_id)
      VALUES (${userId}, ${oppId})
      ON CONFLICT (user_id, opportunity_id) DO NOTHING
    `;

    res.json({ success: true, message: "Opportunity bookmarked successfully." });
  } catch (error) {
    console.error("Bookmark opportunity error:", error);
    res.status(500).json({ success: false, message: "Failed to bookmark opportunity." });
  }
}

/**
 * DELETE /api/opportunities/:id/bookmark
 */
async function unbookmarkOpportunity(req, res) {
  try {
    const sql = getDb();
    const userId = req.user.id;
    const oppId = req.params.id;

    await sql`
      DELETE FROM opportunity_bookmarks
      WHERE user_id = ${userId} AND opportunity_id = ${oppId}
    `;

    res.json({ success: true, message: "Bookmark removed." });
  } catch (error) {
    console.error("Unbookmark opportunity error:", error);
    res.status(500).json({ success: false, message: "Failed to remove bookmark." });
  }
}

/**
 * GET /api/opportunities/bookmarks/me
 */
async function getBookmarks(req, res) {
  try {
    const sql = getDb();
    const userId = req.user.id;

    const bookmarks = await sql`
      SELECT o.*, b.created_at as bookmarked_at
      FROM opportunity_bookmarks b
      JOIN opportunities o ON b.opportunity_id = o.id
      WHERE b.user_id = ${userId}
      ORDER BY b.created_at DESC
    `;

    res.json({ success: true, data: bookmarks });
  } catch (error) {
    console.error("Get bookmarks error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch bookmarks." });
  }
}

/**
 * POST /api/opportunities/:id/apply
 */
async function applyOpportunity(req, res) {
  try {
    const sql = getDb();
    const userId = req.user.id;
    const oppId = req.params.id;
    const { notes } = req.body;

    const [application] = await sql`
      INSERT INTO opportunity_applications (user_id, opportunity_id, status, notes)
      VALUES (${userId}, ${oppId}, 'applied', ${notes || null})
      ON CONFLICT (user_id, opportunity_id) DO UPDATE
      SET status = 'applied', updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    res.status(201).json({
      success: true,
      message: "Application recorded successfully.",
      data: application,
    });
  } catch (error) {
    console.error("Apply opportunity error:", error);
    res.status(500).json({ success: false, message: "Failed to record application." });
  }
}

/**
 * GET /api/opportunities/applications/me
 */
async function getUserApplications(req, res) {
  try {
    const sql = getDb();
    const userId = req.user.id;

    const applications = await sql`
      SELECT a.*, o.title, o.company, o.opportunity_type, o.location, o.is_remote, o.stipend_or_ctc
      FROM opportunity_applications a
      JOIN opportunities o ON a.opportunity_id = o.id
      WHERE a.user_id = ${userId}
      ORDER BY a.applied_at DESC
    `;

    res.json({ success: true, data: applications });
  } catch (error) {
    console.error("Get applications error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch applications." });
  }
}

/**
 * PATCH /api/opportunities/applications/:id/status
 */
async function updateApplicationStatus(req, res) {
  try {
    const sql = getDb();
    const userId = req.user.id;
    const { status, notes } = req.body;
    const allowedStatuses = ["applied", "in_review", "interviewing", "offered", "rejected"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid application status." });
    }

    const [app] = await sql`
      UPDATE opportunity_applications
      SET status = ${status}, notes = COALESCE(${notes}, notes), updated_at = CURRENT_TIMESTAMP
      WHERE id = ${req.params.id} AND user_id = ${userId}
      RETURNING *
    `;

    if (!app) {
      return res.status(404).json({ success: false, message: "Application not found." });
    }

    res.json({ success: true, data: app });
  } catch (error) {
    console.error("Update application status error:", error);
    res.status(500).json({ success: false, message: "Failed to update application status." });
  }
}

module.exports = {
  getOpportunities,
  getOpportunityById,
  getMatchingOpportunities,
  bookmarkOpportunity,
  unbookmarkOpportunity,
  getBookmarks,
  applyOpportunity,
  getUserApplications,
  updateApplicationStatus,
};
