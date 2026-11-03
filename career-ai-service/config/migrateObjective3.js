const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DATABASE_URL);

/**
 * Migration for Objective 3:
 * 1. Creates role_skill_requirements table for structured career-skill requirements
 * 2. Creates skill_gap_analyses table to record historical analyses over time
 * 3. Seeds detailed skill requirements for all existing career roles
 */
async function migrateObjective3() {
  console.log("🚀 Starting Objective 3 Database Migration...");

  // 1. Create role_skill_requirements table
  await sql`
    CREATE TABLE IF NOT EXISTS role_skill_requirements (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      role_id INTEGER NOT NULL REFERENCES career_roles(id) ON DELETE CASCADE,
      skill_name VARCHAR(100) NOT NULL,
      skill_category VARCHAR(50) NOT NULL CHECK (skill_category IN ('technical', 'soft', 'tool')),
      required_level INTEGER NOT NULL CHECK (required_level BETWEEN 1 AND 4),
      importance VARCHAR(20) NOT NULL CHECK (importance IN ('critical', 'high', 'medium', 'low')),
      why_needed TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT uq_role_skill UNIQUE (role_id, skill_name)
    )
  `;
  console.log("  ✅ role_skill_requirements table created/verified.");

  // 2. Create skill_gap_analyses table to store history snapshots
  await sql`
    CREATE TABLE IF NOT EXISTS skill_gap_analyses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role_id INTEGER NOT NULL REFERENCES career_roles(id) ON DELETE CASCADE,
      overall_match_percentage NUMERIC(5, 2) NOT NULL,
      overall_gap_percentage NUMERIC(5, 2) NOT NULL,
      summary TEXT,
      analysis_data JSONB NOT NULL,
      provider_used VARCHAR(50),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `;
  console.log("  ✅ skill_gap_analyses table created/verified.");

  // Indexes for performance
  await sql`CREATE INDEX IF NOT EXISTS idx_role_skill_reqs_role ON role_skill_requirements(role_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_skill_gap_analyses_user_role ON skill_gap_analyses(user_id, role_id, created_at DESC)`;

  // 3. Seed structured skill requirements for all existing career roles
  const roles = await sql`SELECT id, title, slug, required_skills, nice_to_have FROM career_roles`;
  console.log(`  Found ${roles.length} career roles in database to configure.`);

  for (const role of roles) {
    const skillsToInsert = [];

    // Map required skills as critical/high with level 3 (Advanced) or 2 (Intermediate)
    for (let i = 0; i < (role.required_skills || []).length; i++) {
      const s = role.required_skills[i];
      const isSoft = ["communication", "teamwork", "leadership", "problem solving", "time management", "critical thinking"].includes(s.toLowerCase());
      const isTool = ["git", "docker", "kubernetes", "jira", "aws", "postman", "linux"].includes(s.toLowerCase());
      const category = isSoft ? "soft" : isTool ? "tool" : "technical";
      const importance = i < 3 ? "critical" : "high";
      const requiredLevel = i < 2 ? 3 : 2; // Level 3 = Advanced, Level 2 = Intermediate

      skillsToInsert.push({
        roleId: role.id,
        name: s,
        category,
        requiredLevel,
        importance,
        whyNeeded: `Fundamental competency for ${role.title} to deliver production-grade work.`,
      });
    }

    // Map nice_to_have as medium/low with level 2 (Intermediate)
    for (const s of role.nice_to_have || []) {
      const isTool = ["docker", "kubernetes", "aws", "terraform", "tableau"].includes(s.toLowerCase());
      const category = isTool ? "tool" : "technical";
      skillsToInsert.push({
        roleId: role.id,
        name: s,
        category,
        requiredLevel: 2,
        importance: "medium",
        whyNeeded: `High-value modern capability that differentiates senior ${role.title} candidates.`,
      });
    }

    // Add core soft skills if missing
    skillsToInsert.push({
      roleId: role.id,
      name: "Problem Solving",
      category: "soft",
      requiredLevel: 3,
      importance: "high",
      whyNeeded: "Essential for algorithmic thinking, system troubleshooting, and engineering design.",
    });

    skillsToInsert.push({
      roleId: role.id,
      name: "Communication",
      category: "soft",
      requiredLevel: 2,
      importance: "medium",
      whyNeeded: "Required for agile ceremonies, cross-functional collaboration, and technical documentation.",
    });

    // Upsert into database
    for (const item of skillsToInsert) {
      await sql`
        INSERT INTO role_skill_requirements (
          role_id, skill_name, skill_category, required_level, importance, why_needed
        ) VALUES (
          ${item.roleId}, ${item.name}, ${item.category}, ${item.requiredLevel}, ${item.importance}, ${item.whyNeeded}
        )
        ON CONFLICT (role_id, skill_name) DO UPDATE SET
          skill_category = EXCLUDED.skill_category,
          required_level = EXCLUDED.required_level,
          importance = EXCLUDED.importance,
          why_needed = EXCLUDED.why_needed
      `;
    }
  }

  const countReqs = await sql`SELECT count(*) FROM role_skill_requirements`;
  console.log(`  ✅ Successfully configured ${countReqs[0].count} career skill requirements.`);
  console.log("🎉 Objective 3 Migration Complete!\n");
}

if (require.main === module) {
  migrateObjective3()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Migration failed:", err);
      process.exit(1);
    });
}

module.exports = { migrateObjective3 };

