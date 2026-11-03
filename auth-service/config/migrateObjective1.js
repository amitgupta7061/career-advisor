/**
 * Migration: Objective 1 - Student Profile Management Normalized Schema
 * 
 * Improvements incorporated:
 * 1. UUID primary keys for all new sub-entities using pgcrypto gen_random_uuid().
 * 2. Range & validation constraints (dates, CGPA 0-10, percentages 0-100, semesters 1-12, valid experience).
 * 3. Hashed refresh tokens support (token_hash).
 * 4. Uniqueness constraints (e.g. unique skill per student profile, user_id references).
 * 5. Normalized sub-entities for Academics, Skills, Projects, Experiences, Certifications, Preferences.
 * 6. Preserves existing tables and non-destructive extensions.
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const { getDb } = require("./db");

async function runMigration() {
  const sql = getDb();
  console.log("🚀 Running Migration for Objective 1: Student Profile Management...");

  // 1. Enable pgcrypto extension for UUID generation
  await sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`;
  console.log("  ✅ Extension pgcrypto enabled");

  // 2. Safely add missing columns to users table
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE`;
  console.log("  ✅ Table users updated with is_active");

  // 3. Upgrade refresh_tokens table to support token hashing
  await sql`ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS token_hash VARCHAR(64)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash)`;
  console.log("  ✅ Table refresh_tokens upgraded for hash storage");

  // 4. Create password_resets table
  await sql`
    CREATE TABLE IF NOT EXISTS password_resets (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash  VARCHAR(64) NOT NULL,
      expires_at  TIMESTAMPTZ NOT NULL,
      used        BOOLEAN DEFAULT FALSE,
      created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_password_resets_token_hash ON password_resets(token_hash)`;
  console.log("  ✅ Table password_resets verified");

  // 5. Expand student_profiles with personal details and profile completeness
  await sql`ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(25)`;
  await sql`ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE`;
  await sql`ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS gender VARCHAR(30)`;
  await sql`ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'India'`;
  await sql`ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS state VARCHAR(100)`;
  await sql`ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS city VARCHAR(100)`;
  await sql`ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS bio TEXT`;
  await sql`ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT`;
  await sql`ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS profile_completeness INTEGER DEFAULT 0`;
  console.log("  ✅ Table student_profiles expanded with personal profile fields");

  // 6. Create student_academics table (UUID PK)
  await sql`
    CREATE TABLE IF NOT EXISTS student_academics (
      id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_profile_id  INTEGER NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
      institution_name    VARCHAR(300) NOT NULL,
      degree              VARCHAR(150) NOT NULL,
      field_of_study      VARCHAR(150),
      current_semester    INTEGER CHECK (current_semester BETWEEN 1 AND 12),
      enrollment_year     INTEGER CHECK (enrollment_year >= 1990 AND enrollment_year <= 2100),
      graduation_year     INTEGER CHECK (graduation_year >= 1990 AND graduation_year <= 2100),
      grade_score         NUMERIC(5, 2),
      grade_type          VARCHAR(20) DEFAULT 'cgpa' CHECK (grade_type IN ('cgpa', 'percentage', 'grade_letter')),
      is_highest          BOOLEAN DEFAULT FALSE,
      created_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT chk_academic_years CHECK (graduation_year IS NULL OR enrollment_year IS NULL OR graduation_year >= enrollment_year),
      CONSTRAINT chk_grade_score_range CHECK (
        grade_score IS NULL OR 
        (grade_type = 'cgpa' AND grade_score >= 0.00 AND grade_score <= 10.00) OR
        (grade_type = 'percentage' AND grade_score >= 0.00 AND grade_score <= 100.00) OR
        (grade_type = 'grade_letter')
      )
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_academics_profile ON student_academics(student_profile_id)`;
  console.log("  ✅ Table student_academics created");

  // 7. Create student_skills table (UUID PK + uniqueness per student)
  await sql`
    CREATE TABLE IF NOT EXISTS student_skills (
      id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_profile_id  INTEGER NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
      skill_name          VARCHAR(100) NOT NULL,
      skill_category      VARCHAR(30) NOT NULL CHECK (skill_category IN ('technical', 'soft', 'tool', 'language')),
      proficiency_level   VARCHAR(20) NOT NULL CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
      years_of_experience NUMERIC(3, 1) DEFAULT 0 CHECK (years_of_experience >= 0.0 AND years_of_experience <= 50.0),
      created_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT uq_student_skill UNIQUE (student_profile_id, skill_name)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_student_skills_profile ON student_skills(student_profile_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_student_skills_name ON student_skills(LOWER(skill_name))`;
  await sql`CREATE INDEX IF NOT EXISTS idx_student_skills_category ON student_skills(skill_category)`;
  console.log("  ✅ Table student_skills created");

  // 8. Create student_career_preferences table (UUID PK, 1-to-1 with student_profiles)
  await sql`
    CREATE TABLE IF NOT EXISTS student_career_preferences (
      id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_profile_id  INTEGER UNIQUE NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
      preferred_domains   TEXT[] DEFAULT '{}',
      preferred_roles     TEXT[] DEFAULT '{}',
      preferred_industries TEXT[] DEFAULT '{}',
      preferred_locations TEXT[] DEFAULT '{}',
      work_preference     VARCHAR(30) DEFAULT 'flexible' CHECK (work_preference IN ('remote', 'hybrid', 'on_site', 'flexible')),
      employment_type     VARCHAR(30) DEFAULT 'full_time' CHECK (employment_type IN ('internship', 'full_time', 'part_time', 'any')),
      short_term_goal     TEXT,
      long_term_goal      TEXT,
      created_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_preferences_profile ON student_career_preferences(student_profile_id)`;
  console.log("  ✅ Table student_career_preferences created");

  // 9. Create student_projects table (UUID PK)
  await sql`
    CREATE TABLE IF NOT EXISTS student_projects (
      id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_profile_id  INTEGER NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
      title               VARCHAR(250) NOT NULL,
      description         TEXT NOT NULL,
      technologies        TEXT[] DEFAULT '{}',
      category            VARCHAR(50) DEFAULT 'academic' CHECK (category IN ('academic', 'personal', 'hackathon', 'freelance', 'open_source')),
      github_url          VARCHAR(500),
      live_url            VARCHAR(500),
      start_date          DATE,
      end_date            DATE,
      status              VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('in_progress', 'completed')),
      role_or_contribution TEXT,
      created_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT chk_project_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_projects_profile ON student_projects(student_profile_id)`;
  console.log("  ✅ Table student_projects created");

  // 10. Create student_experiences table (UUID PK)
  await sql`
    CREATE TABLE IF NOT EXISTS student_experiences (
      id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_profile_id  INTEGER NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
      organization        VARCHAR(250) NOT NULL,
      role_title          VARCHAR(200) NOT NULL,
      employment_type     VARCHAR(50) DEFAULT 'internship' CHECK (employment_type IN ('internship', 'full_time', 'part_time', 'contract', 'freelance')),
      location            VARCHAR(150),
      start_date          DATE NOT NULL,
      end_date            DATE,
      is_current          BOOLEAN DEFAULT FALSE,
      responsibilities    TEXT,
      technologies_used   TEXT[] DEFAULT '{}',
      created_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT chk_experience_dates CHECK (is_current = TRUE OR end_date IS NULL OR end_date >= start_date)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_experiences_profile ON student_experiences(student_profile_id)`;
  console.log("  ✅ Table student_experiences created");

  // 11. Create student_certifications table (UUID PK)
  await sql`
    CREATE TABLE IF NOT EXISTS student_certifications (
      id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_profile_id  INTEGER NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
      name                VARCHAR(250) NOT NULL,
      issuing_organization VARCHAR(250) NOT NULL,
      issue_date          DATE NOT NULL,
      expiration_date     DATE,
      credential_id       VARCHAR(150),
      credential_url      VARCHAR(500),
      related_skills      TEXT[] DEFAULT '{}',
      created_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT chk_cert_dates CHECK (expiration_date IS NULL OR expiration_date >= issue_date)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_certifications_profile ON student_certifications(student_profile_id)`;
  console.log("  ✅ Table student_certifications created");

  console.log("\n🎉 Phase 1 Migration successfully executed and verified!");
}

if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Migration failed:", err);
      process.exit(1);
    });
}

module.exports = { runMigration };

