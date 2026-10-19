const path = require("path");
require("dotenv").config();
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const { neon } = require("@neondatabase/serverless");

async function initDatabase() {
  const sql = neon(process.env.DATABASE_URL);
  console.log("🔧 Initializing Learning Service tables...\n");

  // Courses / Resources
  await sql`
    CREATE TABLE IF NOT EXISTS courses (
      id            SERIAL PRIMARY KEY,
      title         VARCHAR(500) NOT NULL,
      platform      VARCHAR(100),
      url           TEXT,
      description   TEXT,
      skill_tags    TEXT[] DEFAULT '{}',
      difficulty    VARCHAR(20) DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
      duration_hrs  INTEGER,
      is_free       BOOLEAN DEFAULT false,
      rating        DECIMAL(3, 2),
      category      VARCHAR(100),
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  console.log("  ✅ courses table created");

  // Learning roadmaps (generated per user per career)
  await sql`
    CREATE TABLE IF NOT EXISTS learning_roadmaps (
      id            SERIAL PRIMARY KEY,
      user_id       INTEGER NOT NULL,
      role_id       INTEGER,
      title         VARCHAR(300) NOT NULL,
      description   TEXT,
      status        VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
      total_steps   INTEGER DEFAULT 0,
      completed_steps INTEGER DEFAULT 0,
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  console.log("  ✅ learning_roadmaps table created");

  // Roadmap steps (individual items in a roadmap)
  await sql`
    CREATE TABLE IF NOT EXISTS roadmap_steps (
      id            SERIAL PRIMARY KEY,
      roadmap_id    INTEGER REFERENCES learning_roadmaps(id) ON DELETE CASCADE,
      step_order    INTEGER NOT NULL,
      title         VARCHAR(300) NOT NULL,
      description   TEXT,
      resource_type VARCHAR(50) DEFAULT 'course' CHECK (resource_type IN ('course', 'project', 'certification', 'practice', 'reading')),
      course_id     INTEGER REFERENCES courses(id),
      skill_name    VARCHAR(200),
      estimated_hrs INTEGER,
      status        VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
      completed_at  TIMESTAMP,
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  console.log("  ✅ roadmap_steps table created");

  // Seed sample courses
  const existing = await sql`SELECT COUNT(*) as count FROM courses`;
  if (parseInt(existing[0].count) === 0) {
    console.log("\n  📦 Seeding courses...");
    await sql`
      INSERT INTO courses (title, platform, url, skill_tags, difficulty, duration_hrs, is_free, rating, category) VALUES
      ('Machine Learning by Andrew Ng', 'Coursera', 'https://coursera.org/learn/machine-learning', ARRAY['Machine Learning', 'Python', 'Statistics'], 'beginner', 60, false, 4.9, 'AI & Data Science'),
      ('CS50 Introduction to Computer Science', 'edX', 'https://cs50.harvard.edu', ARRAY['Programming', 'C', 'Python', 'SQL'], 'beginner', 100, true, 4.9, 'Computer Science'),
      ('The Complete Node.js Developer Course', 'Udemy', 'https://udemy.com/course/nodejs', ARRAY['Node.js', 'JavaScript', 'REST APIs', 'MongoDB'], 'beginner', 35, false, 4.7, 'Backend'),
      ('React - The Complete Guide', 'Udemy', 'https://udemy.com/course/react', ARRAY['React', 'JavaScript', 'Next.js', 'Redux'], 'intermediate', 48, false, 4.8, 'Frontend'),
      ('Docker & Kubernetes: The Practical Guide', 'Udemy', 'https://udemy.com/course/docker-kubernetes', ARRAY['Docker', 'Kubernetes', 'DevOps'], 'intermediate', 24, false, 4.8, 'DevOps'),
      ('AWS Certified Solutions Architect', 'AWS', 'https://aws.amazon.com/certification/', ARRAY['AWS', 'Cloud Architecture', 'Networking'], 'advanced', 80, false, 4.7, 'Cloud'),
      ('Python for Data Science and AI', 'Coursera', 'https://coursera.org/learn/python-for-data-science', ARRAY['Python', 'Pandas', 'NumPy', 'Data Visualization'], 'beginner', 25, false, 4.6, 'Data Science'),
      ('freeCodeCamp Full Stack', 'freeCodeCamp', 'https://freecodecamp.org', ARRAY['HTML', 'CSS', 'JavaScript', 'React', 'Node.js'], 'beginner', 300, true, 4.8, 'Full Stack'),
      ('Deep Learning Specialization', 'Coursera', 'https://coursera.org/specializations/deep-learning', ARRAY['Deep Learning', 'TensorFlow', 'Neural Networks'], 'advanced', 80, false, 4.9, 'AI & Data Science'),
      ('System Design Interview Prep', 'Educative', 'https://educative.io/courses/system-design', ARRAY['System Design', 'Distributed Systems', 'Scalability'], 'advanced', 30, false, 4.7, 'System Design'),
      ('TypeScript: The Complete Developer Guide', 'Udemy', 'https://udemy.com/course/typescript', ARRAY['TypeScript', 'JavaScript'], 'intermediate', 27, false, 4.7, 'Frontend'),
      ('Git & GitHub Bootcamp', 'Udemy', 'https://udemy.com/course/git-and-github-bootcamp', ARRAY['Git', 'GitHub', 'Version Control'], 'beginner', 17, false, 4.7, 'Tools')
    `;
    console.log("  ✅ 12 courses seeded");
  }

  console.log("\n🎉 Learning Service tables initialized!");
  process.exit(0);
}

initDatabase().catch((err) => { console.error("❌ Init failed:", err); process.exit(1); });
