/**
 * Comprehensive Automated Test Suite for Objective 1: Student Profile Management
 * 
 * Tests:
 * 1. User Registration & Authentication (JWT issuance & password hashing)
 * 2. Personal Profile retrieval & update
 * 3. Academics CRUD & grade constraints
 * 4. Skills CRUD, categories, proficiency & duplicate prevention constraint
 * 5. Career Preferences GET & PUT upsert
 * 6. Projects CRUD & date constraints
 * 7. Experiences CRUD & current job handling
 * 8. Certifications CRUD & verification URLs
 * 9. Profile completeness calculation
 * 10. Authorization & cross-student isolation check
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const { getDb } = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getOrCreateStudentProfile, getStudentProfileId } = require("../services/profileService");
const { calculateProfileCompleteness } = require("../services/completenessService");

async function runTestSuite() {
  const sql = getDb();
  console.log("🧪 Starting Automated Test Suite for Objective 1: Student Profile Management...\n");
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // Generate unique test email
  const testEmail1 = `test_student_1_${Date.now()}@example.com`;
  const testEmail2 = `test_student_2_${Date.now()}@example.com`;
  let user1, user2, profile1, profile2;

  try {
    // ─── TEST 1: User Registration & Password Hashing ───────────────────
    console.log("▶ [Test 1] User Registration & Password Hashing");
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash("Password123!", salt);

    [user1] = await sql`
      INSERT INTO users (first_name, last_name, email, password_hash, role)
      VALUES ('Aarav', 'Sharma', ${testEmail1}, ${hash}, 'student')
      RETURNING id, first_name, last_name, email, role
    `;
    assert(user1 && user1.id && user1.email === testEmail1, "Student 1 created successfully");

    const pwMatch = await bcrypt.compare("Password123!", hash);
    assert(pwMatch === true, "Password hash verifies with bcrypt");

    // ─── TEST 2: Unique Email Constraint ────────────────────────────────
    console.log("\n▶ [Test 2] Enforcing Unique Email Constraint");
    let duplicateCaught = false;
    try {
      await sql`
        INSERT INTO users (first_name, last_name, email, password_hash, role)
        VALUES ('Aarav', 'Sharma', ${testEmail1}, ${hash}, 'student')
      `;
    } catch (e) {
      duplicateCaught = true;
    }
    assert(duplicateCaught, "Duplicate email registration rejected by database unique constraint");

    // ─── TEST 3: Student Profile Anchor & JWT Issuance ───────────────────
    console.log("\n▶ [Test 3] Student Profile Anchor & JWT Issuance");
    profile1 = await getOrCreateStudentProfile(user1.id);
    assert(profile1 && profile1.id && profile1.user_id === user1.id, "Student profile anchor auto-initialized");

    const token = jwt.sign(
      { id: user1.id, email: user1.email, role: user1.role },
      process.env.JWT_SECRET || "fallback_secret_key_123",
      { expiresIn: "1h" }
    );
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret_key_123");
    assert(decoded.id === user1.id && decoded.role === "student", "JWT payload authenticates student");

    // ─── TEST 4: Personal Profile Update ────────────────────────────────
    console.log("\n▶ [Test 4] Personal Profile Update");
    const [updatedPersonal] = await sql`
      UPDATE student_profiles
      SET phone = '+919876543210',
          city = 'Bengaluru',
          state = 'Karnataka',
          country = 'India',
          bio = 'Aspiring AI engineer with a strong foundation in Python and React.',
          linkedin_url = 'https://linkedin.com/in/aaravsharma',
          github_url = 'https://github.com/aaravsharma'
      WHERE id = ${profile1.id}
      RETURNING phone, city, bio, linkedin_url
    `;
    assert(updatedPersonal.phone === '+919876543210' && updatedPersonal.city === 'Bengaluru', "Personal profile fields updated");

    // ─── TEST 5: Academics CRUD & Grade Constraints ─────────────────────
    console.log("\n▶ [Test 5] Academics CRUD & Validation Constraints");
    const [academic] = await sql`
      INSERT INTO student_academics (
        student_profile_id, institution_name, degree, field_of_study,
        current_semester, enrollment_year, graduation_year, grade_score, grade_type, is_highest
      ) VALUES (
        ${profile1.id}, 'National Institute of Technology', 'B.Tech', 'Computer Science and Engineering',
        6, 2023, 2027, 8.95, 'cgpa', true
      )
      RETURNING id, institution_name, degree, grade_score
    `;
    assert(academic && academic.degree === 'B.Tech' && Number(academic.grade_score) === 8.95, "Academic qualification record added with UUID PK");

    // Test academic grade constraint (e.g. CGPA > 10 must fail)
    let academicConstraintCaught = false;
    try {
      await sql`
        INSERT INTO student_academics (
          student_profile_id, institution_name, degree, grade_score, grade_type
        ) VALUES (
          ${profile1.id}, 'Invalid College', 'Degree', 12.50, 'cgpa'
        )
      `;
    } catch (e) {
      academicConstraintCaught = true;
    }
    assert(academicConstraintCaught, "Invalid CGPA (> 10) rejected by chk_grade_score_range constraint");

    // ─── TEST 6: Technical & Soft Skills CRUD & Uniqueness ───────────────
    console.log("\n▶ [Test 6] Technical & Soft Skills CRUD & Duplicate Prevention");
    const [techSkill1] = await sql`
      INSERT INTO student_skills (
        student_profile_id, skill_name, skill_category, proficiency_level, years_of_experience
      ) VALUES (
        ${profile1.id}, 'Python', 'technical', 'advanced', 2.5
      )
      RETURNING id, skill_name, proficiency_level
    `;
    assert(techSkill1 && techSkill1.skill_name === 'Python', "Technical skill (Python) added");

    const [softSkill1] = await sql`
      INSERT INTO student_skills (
        student_profile_id, skill_name, skill_category, proficiency_level, years_of_experience
      ) VALUES (
        ${profile1.id}, 'Problem Solving', 'soft', 'expert', 3.0
      )
      RETURNING id, skill_name, skill_category
    `;
    assert(softSkill1 && softSkill1.skill_category === 'soft', "Soft skill (Problem Solving) added");

    // Duplicate skill check constraint
    let duplicateSkillCaught = false;
    try {
      await sql`
        INSERT INTO student_skills (
          student_profile_id, skill_name, skill_category, proficiency_level
        ) VALUES (
          ${profile1.id}, 'Python', 'technical', 'beginner'
        )
      `;
    } catch (e) {
      duplicateSkillCaught = true;
    }
    assert(duplicateSkillCaught, "Duplicate skill name on same student rejected by uq_student_skill constraint");

    // Add 2 more tech skills for profile completeness test
    await sql`
      INSERT INTO student_skills (student_profile_id, skill_name, skill_category, proficiency_level)
      VALUES (${profile1.id}, 'React', 'technical', 'intermediate'),
             (${profile1.id}, 'PostgreSQL', 'technical', 'advanced')
    `;

    // ─── TEST 7: Career Preferences Upsert ──────────────────────────────
    console.log("\n▶ [Test 7] Career Preferences Upsert");
    const [prefs] = await sql`
      INSERT INTO student_career_preferences (
        student_profile_id, preferred_domains, preferred_roles,
        preferred_locations, work_preference, employment_type
      ) VALUES (
        ${profile1.id},
        ARRAY['Software Engineering', 'Artificial Intelligence'],
        ARRAY['Full Stack Developer', 'Machine Learning Engineer'],
        ARRAY['Bengaluru', 'Remote'],
        'hybrid',
        'full_time'
      )
      ON CONFLICT (student_profile_id) DO UPDATE
      SET preferred_roles = EXCLUDED.preferred_roles
      RETURNING id, preferred_roles, work_preference
    `;
    assert(prefs && prefs.preferred_roles.includes('Full Stack Developer'), "Career preferences upserted");

    // ─── TEST 8: Projects Management & Date Validation ──────────────────
    console.log("\n▶ [Test 8] Projects Management & Date Constraints");
    const [project] = await sql`
      INSERT INTO student_projects (
        student_profile_id, title, description, technologies,
        category, github_url, status
      ) VALUES (
        ${profile1.id},
        'AI Career Advisor Platform',
        'End-to-end full-stack career advisory platform built with Next.js and PostgreSQL microservices.',
        ARRAY['Next.js', 'Express', 'PostgreSQL', 'Docker'],
        'academic',
        'https://github.com/aaravsharma/career-advisor',
        'completed'
      )
      RETURNING id, title, technologies
    `;
    assert(project && project.technologies.length === 4, "Project record created with structured technologies array");

    let projectDateError = false;
    try {
      await sql`
        INSERT INTO student_projects (
          student_profile_id, title, description, start_date, end_date
        ) VALUES (
          ${profile1.id}, 'Time Travel Project', 'Description', '2026-05-01', '2026-01-01'
        )
      `;
    } catch (e) {
      projectDateError = true;
    }
    assert(projectDateError, "Invalid project dates (end_date < start_date) rejected by chk_project_dates constraint");

    // ─── TEST 9: Experiences Management ─────────────────────────────────
    console.log("\n▶ [Test 9] Experiences Management (Internships)");
    const [exp] = await sql`
      INSERT INTO student_experiences (
        student_profile_id, organization, role_title, employment_type,
        location, start_date, is_current, responsibilities, technologies_used
      ) VALUES (
        ${profile1.id}, 'TechCorp Solutions', 'Software Engineering Intern', 'internship',
        'Bengaluru', '2026-01-01', true, 'Developed microservices APIs and database queries.',
        ARRAY['Node.js', 'PostgreSQL']
      )
      RETURNING id, organization, is_current
    `;
    assert(exp && exp.is_current === true, "Ongoing internship record saved");

    // ─── TEST 10: Certifications Management ─────────────────────────────
    console.log("\n▶ [Test 10] Certifications Management");
    const [cert] = await sql`
      INSERT INTO student_certifications (
        student_profile_id, name, issuing_organization, issue_date,
        credential_url, related_skills
      ) VALUES (
        ${profile1.id}, 'AWS Certified Cloud Practitioner', 'Amazon Web Services',
        '2025-11-15', 'https://aws.amazon.com/verify/12345',
        ARRAY['AWS', 'Cloud Computing']
      )
      RETURNING id, name, issuing_organization
    `;
    assert(cert && cert.name === 'AWS Certified Cloud Practitioner', "Professional certification recorded");

    // ─── TEST 11: Dynamic Profile Completeness Engine ───────────────────
    console.log("\n▶ [Test 11] Dynamic Profile Completeness Engine");
    const completeness = await calculateProfileCompleteness(profile1.id);
    assert(completeness.score >= 80, `Profile completeness scored high (${completeness.score}%) with valid data breakdown`);
    assert(completeness.breakdown.personal === 15, "Personal pillar achieved maximum 15%");
    assert(completeness.breakdown.academics === 20, "Academics pillar achieved maximum 20%");
    assert(completeness.breakdown.skills === 25, "Skills pillar achieved maximum 25%");

    // Verify score cached in student_profiles
    const [cachedProfile] = await sql`SELECT profile_completeness FROM student_profiles WHERE id = ${profile1.id}`;
    assert(cachedProfile.profile_completeness === completeness.score, "Completeness score cached in database");

    // ─── TEST 12: Cross-Student Authorization & Data Isolation ─────────
    console.log("\n▶ [Test 12] Cross-Student Authorization & Data Isolation");
    [user2] = await sql`
      INSERT INTO users (first_name, last_name, email, password_hash, role)
      VALUES ('Priya', 'Patel', ${testEmail2}, ${hash}, 'student')
      RETURNING id, email
    `;
    profile2 = await getOrCreateStudentProfile(user2.id);

    // Attempt to access or delete Student 1's academic qualification using Student 2's profileId
    const [unauthorizedDelete] = await sql`
      DELETE FROM student_academics
      WHERE id = ${academic.id} AND student_profile_id = ${profile2.id}
      RETURNING id
    `;
    assert(unauthorizedDelete === undefined, "Unauthorized cross-student delete blocked by student_profile_id scoping");

    // Verify Student 1's record remains intact
    const [stillExists] = await sql`SELECT id FROM student_academics WHERE id = ${academic.id}`;
    assert(stillExists && stillExists.id === academic.id, "Student 1's records protected from unauthorized modification");

  } finally {
    // ─── CLEANUP TEST DATA ──────────────────────────────────────────────
    console.log("\n🧹 Cleaning up test users and cascade relationships...");
    if (user1 && user1.id) await sql`DELETE FROM users WHERE id = ${user1.id}`;
    if (user2 && user2.id) await sql`DELETE FROM users WHERE id = ${user2.id}`;
    console.log("  ✅ Test cleanup completed successfully.");
  }

  console.log("\n=======================================================");
  console.log(`🎉 TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runTestSuite()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Test suite runner crashed:", err);
      process.exit(1);
    });
}

module.exports = { runTestSuite };

