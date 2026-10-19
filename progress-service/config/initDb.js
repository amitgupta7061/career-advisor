const path = require("path");
require("dotenv").config();
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const { neon } = require("@neondatabase/serverless");

async function initDatabase() {
  const sql = neon(process.env.DATABASE_URL);
  console.log("🔧 Initializing Progress Service tables...\n");

  // 1. Activities table
  await sql`
    CREATE TABLE IF NOT EXISTS user_activities (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      activity_type VARCHAR(50) NOT NULL,
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `;
  console.log("  ✅ user_activities table created");

  // 2. User Goals table
  await sql`
    CREATE TABLE IF NOT EXISTS user_goals (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(50) DEFAULT 'learning',
      target_date DATE,
      is_completed BOOLEAN DEFAULT false,
      completed_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `;
  console.log("  ✅ user_goals table created");

  // 3. User Badges table
  await sql`
    CREATE TABLE IF NOT EXISTS user_badges (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL,
      badge_code VARCHAR(50) NOT NULL,
      badge_name VARCHAR(100) NOT NULL,
      badge_icon VARCHAR(50) NOT NULL,
      badge_description TEXT,
      earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, badge_code)
    )
  `;
  console.log("  ✅ user_badges table created");

  console.log("\n✨ Progress Service DB initialization complete!\n");
}

initDatabase().catch(console.error);
