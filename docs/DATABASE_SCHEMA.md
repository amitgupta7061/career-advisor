# 🗄️ Neon PostgreSQL Database Schema

This document details the relational data model for the PathFinder platform running on Neon Serverless PostgreSQL.

---

## 1. Authentication & Profiles (`auth-service`)

### `users`
Core user identity credentials and system roles.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | Unique User ID |
| `first_name` | `VARCHAR(100)` | `NOT NULL` | First name |
| `last_name` | `VARCHAR(100)` | `NOT NULL` | Last name |
| `email` | `VARCHAR(255)` | `UNIQUE, NOT NULL`| User email address |
| `password_hash`| `VARCHAR(255)` | `NOT NULL` | bcrypt salt + hash |
| `role` | `VARCHAR(50)` | `DEFAULT 'student'`| `'student'`, `'mentor'`, `'admin'` |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Registration timestamp |

### `student_profiles`
Educational background, skill inventory, and career preferences.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | Unique Profile ID |
| `user_id` | `INT` | `REFERENCES users(id) ON DELETE CASCADE` | Associated User |
| `education_level` | `VARCHAR(100)` | | e.g. `'Undergraduate'` |
| `university` | `VARCHAR(255)` | | College / University name |
| `major` | `VARCHAR(255)` | | e.g. `'Computer Science'` |
| `skills` | `TEXT[]` | `DEFAULT '{}'` | Array of acquired skills |
| `career_interests` | `TEXT[]` | `DEFAULT '{}'` | Target domains |

---

## 2. Career Roles & Skill Gaps (`career-ai-service`)

### `career_roles`
Master directory of tech industry career tracks.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `SERIAL PRIMARY KEY` | Role ID |
| `title` | `VARCHAR(200)` | e.g. `'AI / Machine Learning Engineer'` |
| `slug` | `VARCHAR(200) UNIQUE` | URL-friendly identifier |
| `category` | `VARCHAR(100)` | e.g. `'Artificial Intelligence'` |
| `salary_range` | `VARCHAR(100)` | e.g. `'₹14 - 35 LPA'` |
| `growth_outlook`| `VARCHAR(100)` | Market growth e.g. `'+45% YoY'` |
| `required_skills`| `TEXT[]` | Mandatory industry skills |

### `skill_gaps`
Tracks missing competencies per student per career track.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `SERIAL PRIMARY KEY` | Record ID |
| `user_id` | `INT` | Student ID |
| `role_id` | `INT` | Target Career Role ID |
| `skill_name` | `VARCHAR(100)` | Identified missing skill |
| `priority` | `VARCHAR(20)` | `'critical'`, `'high'`, `'medium'`, `'low'` |

---

## 3. Courses & Roadmaps (`learning-service`)

### `courses`
Curated educational materials.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `SERIAL PRIMARY KEY` | Course ID |
| `title` | `VARCHAR(255)` | Course Title |
| `platform` | `VARCHAR(100)` | freeCodeCamp, Coursera, Udemy |
| `skill_tags` | `TEXT[]` | Skills taught |
| `duration_hrs` | `INT` | Estimated completion hours |
| `is_free` | `BOOLEAN` | Free vs Paid resource |
| `url` | `TEXT` | Resource link |

### `learning_roadmaps` & `roadmap_steps`
User-specific generated study tracks with step order, status (`'pending'`, `'in_progress'`, `'completed'`), and completion tracking.

---

## 4. Opportunities (`opportunity-service`)

### `opportunities`
Live listings for jobs, internships, hackathons, and scholarships.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `SERIAL PRIMARY KEY` | Opportunity ID |
| `title` | `VARCHAR(255)` | Role title |
| `company` | `VARCHAR(255)` | Company or organization |
| `opportunity_type` | `VARCHAR(50)` | `'job'`, `'internship'`, `'hackathon'`, `'scholarship'` |
| `location` | `VARCHAR(150)` | City/state or Remote |
| `is_remote` | `BOOLEAN` | Remote status |
| `stipend_or_ctc` | `VARCHAR(100)` | Compensation / Prize pool |
| `required_skills`| `TEXT[]` | Skills evaluated for matching |
| `deadline` | `DATE` | Application closing date |

### `opportunity_applications`
Student job application tracker with stages (`'applied'`, `'in_review'`, `'interviewing'`, `'offered'`, `'rejected'`).

---

## 5. Resumes (`resume-service`)

### `resume_analyses`
Records ATS resume audits, keyword alignment scores, impact metrics, action verb frequencies, and improvement recommendations.

---

## 6. Progress & Milestones (`progress-service`)

### `user_goals`
Weekly and monthly student milestone checklist items with target completion dates.

### `user_badges`
Gamification achievement awards (`'SKILL_EXPLORER'`, `'ATS_PRO'`, `'FAST_LEARNER'`, `'CAREER_READY'`).
