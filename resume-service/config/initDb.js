const path = require("path");
require("dotenv").config();
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const { neon } = require("@neondatabase/serverless");

async function initDatabase() {
  const sql = neon(process.env.DATABASE_URL);
  console.log("🔧 Initializing Resume Service tables...\n");

  await sql`
    CREATE TABLE IF NOT EXISTS resume_analyses (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL,
      target_role VARCHAR(255) NOT NULL,
      ats_score INT NOT NULL,
      keywords_score INT NOT NULL,
      formatting_score INT NOT NULL,
      impact_score INT NOT NULL,
      matched_keywords TEXT[] DEFAULT '{}',
      missing_keywords TEXT[] DEFAULT '{}',
      action_verbs_found TEXT[] DEFAULT '{}',
      feedback JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `;
  console.log("  ✅ resume_analyses table created");

  console.log("\n✨ Resume Service DB initialization complete!\n");
}

initDatabase().catch(console.error);
