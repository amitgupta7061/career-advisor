/**
 * Database initialization script.
 * Run with: npm run db:init
 * Creates all tables needed by the auth-service.
 */
require("dotenv").config();
const { getDb } = require("./db");

async function initDatabase() {
  const sql = getDb();

  console.log("🔧 Initializing database tables...\n");

  // Users table
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      first_name    VARCHAR(100) NOT NULL,
      last_name     VARCHAR(100) NOT NULL,
      email         VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role          VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'mentor', 'admin')),
      avatar_url    TEXT,
      bio           TEXT,
      phone         VARCHAR(20),
      location      VARCHAR(200),
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  console.log("  ✅ users table created");

  // Student profiles (extended data for students)
  await sql`
    CREATE TABLE IF NOT EXISTS student_profiles (
      id                  SERIAL PRIMARY KEY,
      user_id             INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      university          VARCHAR(300),
      degree              VARCHAR(200),
      branch              VARCHAR(200),
      year_of_study       INTEGER,
      graduation_year     INTEGER,
      gpa                 DECIMAL(4, 2),
      skills              TEXT[] DEFAULT '{}',
      interests           TEXT[] DEFAULT '{}',
      career_goals        TEXT[] DEFAULT '{}',
      preferred_locations TEXT[] DEFAULT '{}',
      github_url          VARCHAR(500),
      linkedin_url        VARCHAR(500),
      portfolio_url       VARCHAR(500),
      resume_url          TEXT,
      created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  console.log("  ✅ student_profiles table created");

  // Mentor profiles
  await sql`
    CREATE TABLE IF NOT EXISTS mentor_profiles (
      id                SERIAL PRIMARY KEY,
      user_id           INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      organization      VARCHAR(300),
      designation       VARCHAR(200),
      expertise_areas   TEXT[] DEFAULT '{}',
      years_experience  INTEGER,
      linkedin_url      VARCHAR(500),
      created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  console.log("  ✅ mentor_profiles table created");

  // Refresh tokens table (for token rotation)
  await sql`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
      token       TEXT NOT NULL,
      expires_at  TIMESTAMP NOT NULL,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  console.log("  ✅ refresh_tokens table created");

  console.log("\n🎉 Database initialization complete!");
  process.exit(0);
}

initDatabase().catch((err) => {
  console.error("❌ Database initialization failed:", err);
  process.exit(1);
});
