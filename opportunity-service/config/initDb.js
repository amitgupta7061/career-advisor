const path = require("path");
require("dotenv").config();
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const { neon } = require("@neondatabase/serverless");

async function initDatabase() {
  const sql = neon(process.env.DATABASE_URL);
  console.log("🔧 Initializing Opportunity Service tables...\n");

  // 1. Opportunities table
  await sql`
    CREATE TABLE IF NOT EXISTS opportunities (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      company VARCHAR(255) NOT NULL,
      company_logo TEXT,
      opportunity_type VARCHAR(50) NOT NULL CHECK (opportunity_type IN ('job', 'internship', 'hackathon', 'scholarship')),
      location VARCHAR(150) NOT NULL,
      is_remote BOOLEAN DEFAULT false,
      experience_level VARCHAR(50) DEFAULT 'entry_level',
      stipend_or_ctc VARCHAR(100),
      description TEXT,
      required_skills TEXT[] DEFAULT '{}',
      apply_url TEXT,
      deadline DATE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `;
  console.log("  ✅ opportunities table created");

  // 2. Opportunity Bookmarks
  await sql`
    CREATE TABLE IF NOT EXISTS opportunity_bookmarks (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL,
      opportunity_id INT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, opportunity_id)
    )
  `;
  console.log("  ✅ opportunity_bookmarks table created");

  // 3. Opportunity Applications tracker
  await sql`
    CREATE TABLE IF NOT EXISTS opportunity_applications (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL,
      opportunity_id INT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
      status VARCHAR(50) DEFAULT 'applied' CHECK (status IN ('applied', 'in_review', 'interviewing', 'offered', 'rejected')),
      notes TEXT,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, opportunity_id)
    )
  `;
  console.log("  ✅ opportunity_applications table created");

  // 4. Seed opportunities
  const opportunitiesCount = await sql`SELECT COUNT(*) FROM opportunities`;
  if (parseInt(opportunitiesCount[0].count) === 0) {
    console.log("\n🌱 Seeding initial opportunities data...");

    const seedOpportunities = [
      {
        title: "Software Development Engineer Intern",
        company: "Flipkart",
        opportunity_type: "internship",
        location: "Bengaluru, Karnataka",
        is_remote: false,
        experience_level: "fresher",
        stipend_or_ctc: "₹65,000 / month",
        description: "Join Flipkart's core engineering team to build scalable microservices and high-throughput backend pipelines for e-commerce scale.",
        required_skills: ["Java", "Data Structures", "Algorithms", "SQL", "Git"],
        apply_url: "https://flipkartcareers.com",
        deadline: "2026-12-31"
      },
      {
        title: "Frontend Engineer (React / Next.js)",
        company: "Swiggy",
        opportunity_type: "job",
        location: "Bengaluru, Karnataka",
        is_remote: true,
        experience_level: "entry_level",
        stipend_or_ctc: "14 - 18 LPA",
        description: "Build delightful customer-facing experiences for 50M+ monthly users across food, grocery, and dining verticals.",
        required_skills: ["JavaScript", "React", "TypeScript", "HTML5", "CSS3", "Tailwind CSS"],
        apply_url: "https://careers.swiggy.com",
        deadline: "2026-11-30"
      },
      {
        title: "AI / ML Research Intern",
        company: "Microsoft Research India",
        opportunity_type: "internship",
        location: "Bengaluru, Karnataka",
        is_remote: false,
        experience_level: "fresher",
        stipend_or_ctc: "₹80,000 / month",
        description: "Collaborate with world-class scientists on foundational LLM alignment, multilingual NLP, and multimodal AI systems.",
        required_skills: ["Python", "PyTorch", "Machine Learning", "NLP", "Mathematics"],
        apply_url: "https://careers.microsoft.com",
        deadline: "2026-12-15"
      },
      {
        title: "Associate Cloud & DevOps Engineer",
        company: "Zomato",
        opportunity_type: "job",
        location: "Gurugram, Haryana",
        is_remote: false,
        experience_level: "entry_level",
        stipend_or_ctc: "12 - 16 LPA",
        description: "Manage AWS infrastructure, automate CI/CD deployments using Kubernetes and GitHub Actions, and ensure 99.99% uptime.",
        required_skills: ["AWS", "Docker", "Kubernetes", "Linux", "CI/CD", "Python"],
        apply_url: "https://zomato.com/careers",
        deadline: "2026-11-25"
      },
      {
        title: "Junior Data Analyst",
        company: "Razorpay",
        opportunity_type: "job",
        location: "Bengaluru, Karnataka",
        is_remote: true,
        experience_level: "entry_level",
        stipend_or_ctc: "10 - 13 LPA",
        description: "Analyze financial transaction patterns, construct automated Tableau dashboards, and support payment routing optimization.",
        required_skills: ["SQL", "Python", "Tableau", "Power BI", "Statistics", "Excel"],
        apply_url: "https://razorpay.com/jobs",
        deadline: "2026-12-10"
      },
      {
        title: "Smart India Hackathon 2026",
        company: "Ministry of Education & AICTE",
        opportunity_type: "hackathon",
        location: "All India (Nationwide)",
        is_remote: true,
        experience_level: "all_students",
        stipend_or_ctc: "₹1,00,000 Prize Pool",
        description: "World's biggest open innovation model bringing students to solve pressing digital problems for government departments and industries.",
        required_skills: ["Problem Solving", "Full Stack Development", "AI/ML", "Team Collaboration"],
        apply_url: "https://sih.gov.in",
        deadline: "2026-10-31"
      },
      {
        title: "National Merit STEM Scholarship 2026",
        company: "Tata Trusts & Tech Mahindra Foundation",
        opportunity_type: "scholarship",
        location: "Pan-India",
        is_remote: true,
        experience_level: "undergraduate",
        stipend_or_ctc: "₹50,000 / year",
        description: "Merit-cum-means scholarship for undergraduate students pursuing engineering and computer science degrees across accredited universities.",
        required_skills: ["Academic Excellence", "Computer Science", "Engineering"],
        apply_url: "https://tatatrusts.org/scholarships",
        deadline: "2026-11-15"
      },
      {
        title: "Cyber Security Analyst Intern",
        company: "Quick Heal Technologies",
        opportunity_type: "internship",
        location: "Pune, Maharashtra",
        is_remote: false,
        experience_level: "fresher",
        stipend_or_ctc: "₹35,000 / month",
        description: "Assist threat intelligence analysts in vulnerability assessments, penetration testing, and log forensic investigations.",
        required_skills: ["Network Security", "Linux", "Python", "Wireshark", "OWASP"],
        apply_url: "https://quickheal.com/careers",
        deadline: "2026-12-20"
      }
    ];

    for (const op of seedOpportunities) {
      await sql`
        INSERT INTO opportunities (
          title, company, opportunity_type, location, is_remote, experience_level,
          stipend_or_ctc, description, required_skills, apply_url, deadline
        ) VALUES (
          ${op.title}, ${op.company}, ${op.opportunity_type}, ${op.location}, ${op.is_remote}, ${op.experience_level},
          ${op.stipend_or_ctc}, ${op.description}, ${op.required_skills}, ${op.apply_url}, ${op.deadline}
        )
      `;
    }
    console.log(`  ✅ Seeded ${seedOpportunities.length} opportunities (Jobs, Internships, Hackathons, Scholarships)`);
  }

  console.log("\n✨ Opportunity Service DB initialization complete!\n");
}

initDatabase().catch(console.error);
