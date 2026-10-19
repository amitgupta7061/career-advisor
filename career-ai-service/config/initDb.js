const path = require("path");
require("dotenv").config();
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const { neon } = require("@neondatabase/serverless");

async function initDatabase() {
  const sql = neon(process.env.DATABASE_URL);
  console.log("🔧 Initializing Career AI Service tables...\n");

  // Career roles master data
  await sql`
    CREATE TABLE IF NOT EXISTS career_roles (
      id              SERIAL PRIMARY KEY,
      title           VARCHAR(200) NOT NULL,
      slug            VARCHAR(200) UNIQUE NOT NULL,
      category        VARCHAR(100),
      description     TEXT,
      avg_salary_min  INTEGER,
      avg_salary_max  INTEGER,
      demand_level    VARCHAR(20) DEFAULT 'medium' CHECK (demand_level IN ('low', 'medium', 'high', 'very_high')),
      growth_rate     VARCHAR(20) DEFAULT 'stable',
      required_skills TEXT[] DEFAULT '{}',
      nice_to_have    TEXT[] DEFAULT '{}',
      created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  console.log("  ✅ career_roles table created");

  // User career recommendations
  await sql`
    CREATE TABLE IF NOT EXISTS career_recommendations (
      id            SERIAL PRIMARY KEY,
      user_id       INTEGER NOT NULL,
      role_id       INTEGER REFERENCES career_roles(id),
      match_score   DECIMAL(5, 2),
      matched_skills TEXT[] DEFAULT '{}',
      missing_skills TEXT[] DEFAULT '{}',
      reasoning     TEXT,
      is_active     BOOLEAN DEFAULT true,
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  console.log("  ✅ career_recommendations table created");

  // Skill gap records
  await sql`
    CREATE TABLE IF NOT EXISTS skill_gaps (
      id              SERIAL PRIMARY KEY,
      user_id         INTEGER NOT NULL,
      role_id         INTEGER REFERENCES career_roles(id),
      skill_name      VARCHAR(200) NOT NULL,
      priority        VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
      current_level   INTEGER DEFAULT 0,
      required_level  INTEGER DEFAULT 5,
      status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
      created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  console.log("  ✅ skill_gaps table created");

  // Seed some career roles
  const existingRoles = await sql`SELECT COUNT(*) as count FROM career_roles`;
  if (parseInt(existingRoles[0].count) === 0) {
    console.log("\n  📦 Seeding career roles...");
    await sql`
      INSERT INTO career_roles (title, slug, category, description, avg_salary_min, avg_salary_max, demand_level, growth_rate, required_skills, nice_to_have)
      VALUES
        ('Machine Learning Engineer', 'ml-engineer', 'AI & Data Science', 'Design and implement ML models and pipelines for production systems', 1200000, 2500000, 'very_high', 'rapid', ARRAY['Python', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'SQL', 'Statistics', 'Linear Algebra'], ARRAY['MLOps', 'Docker', 'Kubernetes', 'Spark', 'AWS SageMaker']),
        ('Full-Stack Developer', 'full-stack-developer', 'Software Development', 'Build end-to-end web applications with frontend and backend', 800000, 2000000, 'high', 'growing', ARRAY['JavaScript', 'React', 'Node.js', 'HTML', 'CSS', 'SQL', 'Git', 'REST APIs'], ARRAY['TypeScript', 'Next.js', 'Docker', 'AWS', 'GraphQL', 'MongoDB']),
        ('Data Scientist', 'data-scientist', 'AI & Data Science', 'Analyze data, build models, and derive business insights', 1000000, 2200000, 'very_high', 'rapid', ARRAY['Python', 'SQL', 'Statistics', 'Machine Learning', 'Pandas', 'NumPy', 'Data Visualization'], ARRAY['R', 'Tableau', 'Spark', 'Deep Learning', 'NLP']),
        ('Backend Developer', 'backend-developer', 'Software Development', 'Build server-side logic, APIs, and database architecture', 700000, 1800000, 'high', 'growing', ARRAY['Node.js', 'Python', 'SQL', 'REST APIs', 'Git', 'Database Design'], ARRAY['GraphQL', 'Docker', 'Redis', 'Message Queues', 'Microservices']),
        ('Frontend Developer', 'frontend-developer', 'Software Development', 'Build responsive and interactive user interfaces', 600000, 1600000, 'high', 'growing', ARRAY['JavaScript', 'React', 'HTML', 'CSS', 'Git', 'Responsive Design'], ARRAY['TypeScript', 'Next.js', 'Vue.js', 'Tailwind CSS', 'Testing']),
        ('DevOps Engineer', 'devops-engineer', 'Infrastructure', 'Automate infrastructure, CI/CD, and cloud deployments', 900000, 2200000, 'very_high', 'rapid', ARRAY['Linux', 'Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Terraform', 'Git'], ARRAY['Ansible', 'Prometheus', 'Grafana', 'Python', 'GCP']),
        ('Cybersecurity Analyst', 'cybersecurity-analyst', 'Security', 'Protect systems and networks from cyber threats', 800000, 2000000, 'very_high', 'rapid', ARRAY['Networking', 'Linux', 'Security Protocols', 'Penetration Testing', 'SIEM', 'Risk Assessment'], ARRAY['Python', 'Cryptography', 'Cloud Security', 'Incident Response']),
        ('Mobile App Developer', 'mobile-developer', 'Software Development', 'Build native or cross-platform mobile applications', 700000, 1800000, 'high', 'growing', ARRAY['React Native', 'JavaScript', 'Mobile UI', 'REST APIs', 'Git'], ARRAY['Flutter', 'Swift', 'Kotlin', 'Firebase', 'App Store Deployment']),
        ('Cloud Architect', 'cloud-architect', 'Infrastructure', 'Design and manage cloud infrastructure and services', 1500000, 3500000, 'very_high', 'rapid', ARRAY['AWS', 'Cloud Architecture', 'Networking', 'Security', 'Docker', 'Kubernetes', 'Terraform'], ARRAY['GCP', 'Azure', 'Cost Optimization', 'Serverless']),
        ('UI/UX Designer', 'ui-ux-designer', 'Design', 'Design user interfaces and experiences for digital products', 500000, 1500000, 'high', 'growing', ARRAY['Figma', 'UI Design', 'UX Research', 'Prototyping', 'Design Systems', 'Typography'], ARRAY['Adobe XD', 'Sketch', 'HTML/CSS', 'User Testing', 'Motion Design'])
    `;
    console.log("  ✅ 10 career roles seeded");
  }

  console.log("\n🎉 Career AI Service tables initialized!");
  process.exit(0);
}

initDatabase().catch((err) => {
  console.error("❌ Init failed:", err);
  process.exit(1);
});
