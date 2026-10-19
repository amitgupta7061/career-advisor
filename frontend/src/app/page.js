import Link from "next/link";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import styles from "./landing.module.css";

export default function Home() {
  return (
    <div className={styles.landing}>
      <Navbar />

      {/* ===== HERO SECTION ===== */}
      <section className={styles.hero}>
        <div className={styles.heroBg}></div>
        <div className={styles.heroBlob1}></div>
        <div className={styles.heroBlob2}></div>
        <div className={styles.heroGrid}></div>

        <div className={styles.heroContainer}>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <span className={styles.heroBadgeDot}></span>
              AI-Powered Career Guidance
            </div>

            <h1 className={styles.heroTitle}>
              Discover Your
              <br />
              <span className={styles.heroTitleGradient}>Perfect Career</span>
              <br />
              Path Today
            </h1>

            <p className={styles.heroSubtitle}>
              PathFinder AI analyzes your skills, interests, and goals to create
              personalized career recommendations, identify skill gaps, and build
              a learning roadmap tailored just for you.
            </p>

            <div className={styles.heroActions}>
              <Link href="/signup" className="btn btn-primary btn-lg">
                Start Free Analysis →
              </Link>
              <Link href="#how-it-works" className="btn btn-secondary btn-lg">
                See How It Works
              </Link>
            </div>

            <div className={styles.heroStats}>
              <div className={styles.heroStat}>
                <span className={styles.heroStatNumber}>50K+</span>
                <span className={styles.heroStatLabel}>Students Guided</span>
              </div>
              <div className={styles.heroStat}>
                <span className={styles.heroStatNumber}>200+</span>
                <span className={styles.heroStatLabel}>Career Paths</span>
              </div>
              <div className={styles.heroStat}>
                <span className={styles.heroStatNumber}>95%</span>
                <span className={styles.heroStatLabel}>Satisfaction Rate</span>
              </div>
            </div>
          </div>

          {/* Hero Visual - Interactive Card Preview */}
          <div className={styles.heroVisual}>
            <div className={styles.heroCard}>
              <div className={styles.heroCardHeader}>
                <div className={styles.heroCardAvatar}>AK</div>
                <div className={styles.heroCardInfo}>
                  <h3>Amit Kumar</h3>
                  <p>B.Tech CSE · 3rd Year</p>
                </div>
                <span className={styles.heroCardMatch}>92% Match</span>
              </div>

              <div className={styles.heroCardSkills}>
                <span className={styles.skillTag}>Python</span>
                <span className={styles.skillTag}>React</span>
                <span className={styles.skillTag}>Machine Learning</span>
                <span className={styles.skillTag}>Node.js</span>
                <span className={styles.skillTag}>SQL</span>
                <span className={styles.skillTag}>Git</span>
              </div>

              <div className={styles.heroCardPaths}>
                <div className={styles.pathItem}>
                  <div
                    className={styles.pathIcon}
                    style={{ background: "linear-gradient(135deg, #eef2ff, #e0e7ff)" }}
                  >
                    🤖
                  </div>
                  <div className={styles.pathDetails}>
                    <h4>ML Engineer</h4>
                    <p>High demand · ₹12-25 LPA</p>
                  </div>
                  <span className={styles.pathScore}>95%</span>
                </div>
                <div className={styles.pathItem}>
                  <div
                    className={styles.pathIcon}
                    style={{ background: "linear-gradient(135deg, #d1fae5, #a7f3d0)" }}
                  >
                    🌐
                  </div>
                  <div className={styles.pathDetails}>
                    <h4>Full-Stack Developer</h4>
                    <p>Growing · ₹8-20 LPA</p>
                  </div>
                  <span className={styles.pathScore}>88%</span>
                </div>
                <div className={styles.pathItem}>
                  <div
                    className={styles.pathIcon}
                    style={{ background: "linear-gradient(135deg, #fef3c7, #fde68a)" }}
                  >
                    📊
                  </div>
                  <div className={styles.pathDetails}>
                    <h4>Data Scientist</h4>
                    <p>Trending · ₹10-22 LPA</p>
                  </div>
                  <span className={styles.pathScore}>84%</span>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className={`${styles.floatingCard} ${styles.floatingCard1}`}>
              <div className={styles.floatingContent}>
                <span className={styles.floatingEmoji}>🎯</span>
                <span>Skill Gap Found: Docker</span>
              </div>
            </div>
            <div className={`${styles.floatingCard} ${styles.floatingCard2}`}>
              <div className={styles.floatingContent}>
                <span className={styles.floatingEmoji}>📈</span>
                <span style={{ color: "var(--success-600)" }}>+12 Skills This Month</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section id="features" className={styles.features}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionBadge}>✨ Features</span>
          <h2 className={styles.sectionTitle}>
            Everything You Need to{" "}
            <span className="text-gradient">Build Your Career</span>
          </h2>
          <p className={styles.sectionSubtitle}>
            From skill analysis to opportunity discovery — PathFinder brings all
            career tools into one intelligent platform.
          </p>
        </div>

        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={`${styles.featureIcon} ${styles.featureIcon1}`}>🧭</div>
            <h3 className={styles.featureTitle}>Career Path Recommendations</h3>
            <p className={styles.featureDesc}>
              AI analyzes your skills, interests, and academic background to suggest
              the most suitable career paths with match scores.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={`${styles.featureIcon} ${styles.featureIcon2}`}>🔍</div>
            <h3 className={styles.featureTitle}>Skill Gap Analysis</h3>
            <p className={styles.featureDesc}>
              Identify exactly which skills you need to develop for your desired
              career role, with priority-based recommendations.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={`${styles.featureIcon} ${styles.featureIcon3}`}>🗺️</div>
            <h3 className={styles.featureTitle}>Learning Roadmaps</h3>
            <p className={styles.featureDesc}>
              Get structured learning plans with courses, certifications, projects,
              and resources to bridge your skill gaps.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={`${styles.featureIcon} ${styles.featureIcon4}`}>💼</div>
            <h3 className={styles.featureTitle}>Opportunity Discovery</h3>
            <p className={styles.featureDesc}>
              Find internships, jobs, competitions, and other educational
              opportunities matched to your growing profile.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={`${styles.featureIcon} ${styles.featureIcon5}`}>📄</div>
            <h3 className={styles.featureTitle}>Resume Analysis</h3>
            <p className={styles.featureDesc}>
              Upload your resume for AI-powered analysis. Get actionable suggestions
              to improve your skills and career readiness.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={`${styles.featureIcon} ${styles.featureIcon6}`}>📊</div>
            <h3 className={styles.featureTitle}>Progress Tracking</h3>
            <p className={styles.featureDesc}>
              Track your skills, completed courses, projects, and certifications
              as you progress toward your career goals.
            </p>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className={styles.howItWorks}>
        <div className={styles.howItWorksBg}></div>
        <div className={styles.sectionHeader} style={{ position: "relative", zIndex: 1 }}>
          <span className={styles.sectionBadge}>🚀 How It Works</span>
          <h2 className={styles.sectionTitle}>
            Your Career Journey in{" "}
            <span className="text-gradient">4 Simple Steps</span>
          </h2>
          <p className={styles.sectionSubtitle}>
            From profile creation to career success — our AI guides you every step
            of the way.
          </p>
        </div>

        <div className={styles.stepsGrid}>
          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>1</div>
            <h3 className={styles.stepTitle}>Create Your Profile</h3>
            <p className={styles.stepDesc}>
              Enter your skills, education, interests, projects, and career
              aspirations. Upload your resume for instant analysis.
            </p>
          </div>
          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>2</div>
            <h3 className={styles.stepTitle}>Get AI Analysis</h3>
            <p className={styles.stepDesc}>
              Our AI engine processes your profile to recommend career paths, detect
              skill gaps, and match you with opportunities.
            </p>
          </div>
          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>3</div>
            <h3 className={styles.stepTitle}>Follow Your Roadmap</h3>
            <p className={styles.stepDesc}>
              Receive a personalized learning plan with courses, projects, and
              certifications to close your skill gaps.
            </p>
          </div>
          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>4</div>
            <h3 className={styles.stepTitle}>Achieve Your Goals</h3>
            <p className={styles.stepDesc}>
              Track your progress, discover opportunities, and watch your
              recommendations adapt as you grow.
            </p>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section id="testimonials" className={styles.testimonials}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionBadge}>💬 Testimonials</span>
          <h2 className={styles.sectionTitle}>
            Loved by <span className="text-gradient">Students Worldwide</span>
          </h2>
          <p className={styles.sectionSubtitle}>
            See how PathFinder has helped students discover their ideal career paths.
          </p>
        </div>

        <div className={styles.testimonialsGrid}>
          <div className={styles.testimonialCard}>
            <div className={styles.testimonialStars}>
              {[...Array(5)].map((_, i) => (
                <span key={i} className={styles.star}>★</span>
              ))}
            </div>
            <p className={styles.testimonialText}>
              &ldquo;PathFinder showed me career paths I never considered. The skill gap
              analysis was incredibly accurate and the roadmap helped me land my
              dream internship at a top tech company.&rdquo;
            </p>
            <div className={styles.testimonialAuthor}>
              <div className={styles.authorAvatar} style={{ background: "var(--gradient-primary)" }}>PS</div>
              <div className={styles.authorInfo}>
                <h4>Priya Sharma</h4>
                <p>B.Tech CSE · IIT Delhi</p>
              </div>
            </div>
          </div>

          <div className={styles.testimonialCard}>
            <div className={styles.testimonialStars}>
              {[...Array(5)].map((_, i) => (
                <span key={i} className={styles.star}>★</span>
              ))}
            </div>
            <p className={styles.testimonialText}>
              &ldquo;The resume analysis feature gave me specific, actionable feedback.
              Within 2 months of following the suggestions, I received 3x more
              interview callbacks than before.&rdquo;
            </p>
            <div className={styles.testimonialAuthor}>
              <div className={styles.authorAvatar} style={{ background: "var(--gradient-accent)" }}>RK</div>
              <div className={styles.authorInfo}>
                <h4>Rahul Kumar</h4>
                <p>MCA · NIT Trichy</p>
              </div>
            </div>
          </div>

          <div className={styles.testimonialCard}>
            <div className={styles.testimonialStars}>
              {[...Array(5)].map((_, i) => (
                <span key={i} className={styles.star}>★</span>
              ))}
            </div>
            <p className={styles.testimonialText}>
              &ldquo;As a mentor, I recommend PathFinder to all my students. The
              analytics dashboard gives me visibility into each student&apos;s
              progress and helps me guide them more effectively.&rdquo;
            </p>
            <div className={styles.testimonialAuthor}>
              <div className={styles.authorAvatar} style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>DA</div>
              <div className={styles.authorInfo}>
                <h4>Dr. Anita Verma</h4>
                <p>Professor · VIT Vellore</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className={styles.cta}>
        <div className={styles.ctaCard}>
          <div className={styles.ctaGlow}></div>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>
              Ready to Discover Your
              <br />
              Ideal Career Path?
            </h2>
            <p className={styles.ctaSubtitle}>
              Join thousands of students who are already building their future with
              AI-powered career guidance. It&apos;s free to start.
            </p>
            <div className={styles.ctaActions}>
              <Link href="/signup" className={styles.ctaBtnPrimary}>
                Get Started Free →
              </Link>
              <Link href="#features" className={styles.ctaBtnSecondary}>
                Explore Features
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
