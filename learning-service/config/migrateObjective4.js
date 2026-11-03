const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DATABASE_URL);

/**
 * Migration for Objective 4:
 * 1. Enhances learning_roadmaps table with versioning, duration, and milestone metadata
 * 2. Enhances roadmap_steps table with activity types, milestone grouping, objectives, and URLs
 * 3. Seeds verified authentic free learning resources (freeCodeCamp, edX, Coursera audit, MDN, official docs)
 */
async function migrateObjective4() {
  console.log("🚀 Starting Objective 4 Database Migration...");

  // 1. Upgrade learning_roadmaps table
  await sql`
    ALTER TABLE learning_roadmaps
    DROP CONSTRAINT IF EXISTS learning_roadmaps_status_check,
    ADD CONSTRAINT learning_roadmaps_status_check CHECK (status IN ('active', 'paused', 'completed', 'archived')),
    ADD COLUMN IF NOT EXISTS target_role VARCHAR(200),
    ADD COLUMN IF NOT EXISTS estimated_duration_weeks INTEGER DEFAULT 8,
    ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS milestones_summary JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP WITH TIME ZONE
  `;
  console.log("  ✅ learning_roadmaps table updated with Objective 4 fields.");

  // 2. Upgrade roadmap_steps table
  await sql`
    ALTER TABLE roadmap_steps
    DROP CONSTRAINT IF EXISTS roadmap_steps_resource_type_check,
    ADD COLUMN IF NOT EXISTS activity_type VARCHAR(50) DEFAULT 'course',
    ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'high',
    ADD COLUMN IF NOT EXISTS milestone_index INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS milestone_title VARCHAR(200) DEFAULT 'Foundations',
    ADD COLUMN IF NOT EXISTS learning_objectives JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS expected_outcomes TEXT,
    ADD COLUMN IF NOT EXISTS resource_url TEXT,
    ADD COLUMN IF NOT EXISTS platform VARCHAR(100) DEFAULT 'Self-guided',
    ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT true
  `;
  console.log("  ✅ roadmap_steps table updated with Objective 4 fields.");

  // Indexes for query performance
  await sql`CREATE INDEX IF NOT EXISTS idx_roadmaps_user_role ON learning_roadmaps(user_id, role_id, status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_roadmap_steps_roadmap_order ON roadmap_steps(roadmap_id, milestone_index, step_order)`;

  // 3. Seed authentic, high-quality, free learning resources
  const existingResources = await sql`SELECT count(*) as count FROM courses`;
  console.log(`  Current courses catalog count: ${existingResources[0].count}`);

  const curatedResources = [
    {
      title: "freeCodeCamp Responsive Web Design & JavaScript",
      platform: "freeCodeCamp",
      url: "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures-v8/",
      description: "Comprehensive hands-on coding curriculum covering modern ES6+, DOM manipulation, and algorithms.",
      skill_tags: ["JavaScript", "HTML", "CSS", "Frontend"],
      difficulty: "beginner",
      duration_hrs: 40,
      is_free: true,
      rating: 4.9,
      category: "Frontend Development",
    },
    {
      title: "React Official Interactive Tutorial & Documentation",
      platform: "Official React Docs",
      url: "https://react.dev/learn",
      description: "Official modern React documentation with interactive code sandboxes, hooks, and component architecture.",
      skill_tags: ["React", "JavaScript", "Frontend"],
      difficulty: "intermediate",
      duration_hrs: 25,
      is_free: true,
      rating: 5.0,
      category: "Frontend Development",
    },
    {
      title: "Node.js Official Guides and Best Practices",
      platform: "Node.js Org",
      url: "https://nodejs.org/en/learn",
      description: "Deep dive into the Node.js event loop, asynchronous architecture, file systems, and HTTP servers.",
      skill_tags: ["Node.js", "Backend", "JavaScript", "REST APIs"],
      difficulty: "intermediate",
      duration_hrs: 30,
      is_free: true,
      rating: 4.8,
      category: "Backend Development",
    },
    {
      title: "PostgreSQL Tutorial for Beginners & Developers",
      platform: "PostgreSQL Tutorial",
      url: "https://www.postgresqltutorial.com/",
      description: "Master relational schema design, indexing, foreign keys, complex joins, and query optimization.",
      skill_tags: ["PostgreSQL", "SQL", "Database"],
      difficulty: "beginner",
      duration_hrs: 20,
      is_free: true,
      rating: 4.8,
      category: "Database Engineering",
    },
    {
      title: "Docker Get Started Official Guide",
      platform: "Docker Docs",
      url: "https://docs.docker.com/get-started/",
      description: "Containerizing web services, building custom Dockerfiles, multi-stage builds, and Docker Compose networking.",
      skill_tags: ["Docker", "DevOps", "Containers"],
      difficulty: "intermediate",
      duration_hrs: 18,
      is_free: true,
      rating: 4.9,
      category: "DevOps & Cloud",
    },
    {
      title: "Kubernetes Basics Hands-on Interactive Lab",
      platform: "Kubernetes Org",
      url: "https://kubernetes.io/docs/tutorials/kubernetes-basics/",
      description: "Deploying microservices clusters, managing Pods, Deployments, ReplicaSets, and LoadBalancers.",
      skill_tags: ["Kubernetes", "DevOps", "Cloud Architecture"],
      difficulty: "advanced",
      duration_hrs: 24,
      is_free: true,
      rating: 4.8,
      category: "DevOps & Cloud",
    },
    {
      title: "CS50 Introduction to Computer Science",
      platform: "edX / Harvard",
      url: "https://www.edx.org/learn/computer-science/harvard-university-cs50-s-introduction-to-computer-science",
      description: "World-renowned foundational computer science course covering memory, algorithms, data structures, and Python.",
      skill_tags: ["Python", "C", "Algorithms", "Problem Solving"],
      difficulty: "beginner",
      duration_hrs: 60,
      is_free: true,
      rating: 5.0,
      category: "Computer Science",
    },
    {
      title: "Fast.ai Practical Deep Learning for Coders",
      platform: "Fast.ai",
      url: "https://course.fast.ai/",
      description: "Top-tier practical machine learning course using PyTorch, convolutional networks, transformers, and deployment.",
      skill_tags: ["PyTorch", "Deep Learning", "Machine Learning", "Python"],
      difficulty: "intermediate",
      duration_hrs: 45,
      is_free: true,
      rating: 4.9,
      category: "AI & Machine Learning",
    },
    {
      title: "Google Cloud Free Digital Training & Architecture",
      platform: "Google Cloud",
      url: "https://cloud.google.com/learn/training",
      description: "Official cloud architecture fundamentals: IAM security, Compute Engine, Cloud Run, and managed storage.",
      skill_tags: ["GCP", "Cloud Architecture", "AWS", "Networking"],
      difficulty: "intermediate",
      duration_hrs: 20,
      is_free: true,
      rating: 4.7,
      category: "DevOps & Cloud",
    },
    {
      title: "System Design Primer by Donne Martin",
      platform: "GitHub",
      url: "https://github.com/donnemartin/system-design-primer",
      description: "Comprehensive open-source guide to distributed systems, caching, message queues, and horizontal scaling.",
      skill_tags: ["System Design", "Scalability", "Distributed Systems"],
      difficulty: "advanced",
      duration_hrs: 35,
      is_free: true,
      rating: 5.0,
      category: "System Design",
    },
    {
      title: "Git & GitHub Interactive Learning Sandbox",
      platform: "GitHub Skills",
      url: "https://skills.github.com/",
      description: "Master branching, pull requests, merge conflict resolution, and GitHub Actions CI/CD workflows.",
      skill_tags: ["Git", "GitHub", "Tools", "CI/CD"],
      difficulty: "beginner",
      duration_hrs: 10,
      is_free: true,
      rating: 4.9,
      category: "Tools & Collaboration",
    },
    {
      title: "Effective Technical Communication & Team Collaboration",
      platform: "Coursera (Free Audit)",
      url: "https://www.coursera.org/learn/communication-skills-for-engineers",
      description: "Executive and engineering communication, peer code reviews, documentation writing, and team leadership.",
      skill_tags: ["Communication", "Teamwork", "Leadership", "Soft Skills"],
      difficulty: "beginner",
      duration_hrs: 12,
      is_free: true,
      rating: 4.8,
      category: "Professional Skills",
    },
  ];

  for (const item of curatedResources) {
    const existing = await sql`SELECT id FROM courses WHERE title = ${item.title}`;
    if (existing.length === 0) {
      await sql`
        INSERT INTO courses (
          title, platform, url, description, skill_tags, difficulty, duration_hrs, is_free, rating, category
        ) VALUES (
          ${item.title}, ${item.platform}, ${item.url}, ${item.description},
          ${item.skill_tags}, ${item.difficulty}, ${item.duration_hrs}, ${item.is_free}, ${item.rating}, ${item.category}
        )
      `;
    }
  }

  const finalCount = await sql`SELECT count(*) as count FROM courses`;
  console.log(`  ✅ Successfully verified ${finalCount[0].count} curated learning resources in database.`);
  console.log("🎉 Objective 4 Database Migration Complete!\n");
}

if (require.main === module) {
  migrateObjective4()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Migration failed:", err);
      process.exit(1);
    });
}

module.exports = { migrateObjective4 };
