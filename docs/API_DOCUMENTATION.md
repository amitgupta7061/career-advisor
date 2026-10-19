# 📡 PathFinder REST API Specification

All API calls are routed through the central API Gateway at `http://localhost:5000/api`.

---

## 1. 🔐 Auth Service (`/api/auth`)

### Register New User
- **Method**: `POST /api/auth/register`
- **Auth**: None
- **Body**:
  ```json
  {
    "firstName": "Amit",
    "lastName": "Kumar",
    "email": "amit@example.com",
    "password": "Password123!",
    "role": "student"
  }
  ```
- **Response `201`**:
  ```json
  {
    "success": true,
    "message": "Account created successfully!",
    "data": {
      "user": { "id": 1, "firstName": "Amit", "email": "amit@example.com", "role": "student" },
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "eyJhbGciOi..."
    }
  }
  ```

### User Login
- **Method**: `POST /api/auth/login`
- **Auth**: None
- **Body**:
  ```json
  {
    "email": "amit@example.com",
    "password": "Password123!"
  }
  ```
- **Response `200`**:
  ```json
  {
    "success": true,
    "message": "Login successful!",
    "data": {
      "user": { "id": 1, "firstName": "Amit", "email": "amit@example.com", "role": "student" },
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "eyJhbGciOi..."
    }
  }
  ```

### Get Current Profile
- **Method**: `GET /api/auth/me`
- **Auth**: `Bearer <accessToken>`
- **Response `200`**:
  ```json
  {
    "success": true,
    "data": {
      "user": { "id": 1, "first_name": "Amit", "email": "amit@example.com" },
      "profile": { "skills": ["Python", "React"], "education_level": "Undergraduate" }
    }
  }
  ```

---

## 2. 🧠 Career AI Service (`/api/career`)

### List Career Roles
- **Method**: `GET /api/career/roles`
- **Auth**: None
- **Response `200`**: Returns list of all 10 seeded career roles with salary ranges in LPA and required skills.

### Get Career Role by Slug
- **Method**: `GET /api/career/roles/:slug`
- **Example**: `GET /api/career/roles/ai-ml-engineer`
- **Response `200`**: Single career role details.

### Analyze Skill Gaps
- **Method**: `POST /api/career/skill-gaps/analyze`
- **Auth**: `Bearer <accessToken>`
- **Body**:
  ```json
  {
    "roleId": 1
  }
  ```
- **Response `200`**:
  ```json
  {
    "success": true,
    "data": {
      "matchScore": 85,
      "matchedSkills": ["Python", "FastAPI"],
      "missingSkills": [
        { "name": "PyTorch", "priority": "critical" },
        { "name": "Docker", "priority": "high" }
      ]
    }
  }
  ```

---

## 3. 📚 Learning Service (`/api/learning`)

### Browse Courses
- **Method**: `GET /api/learning/courses?skill=Python&difficulty=beginner`
- **Auth**: None
- **Response `200`**: List of matching courses with links to Coursera, freeCodeCamp, Udemy, etc.

### Generate Learning Roadmap
- **Method**: `POST /api/learning/roadmap/generate`
- **Auth**: `Bearer <accessToken>`
- **Body**:
  ```json
  {
    "roleId": 1,
    "roleTitle": "AI / Machine Learning Engineer"
  }
  ```
- **Response `201`**: Creates multi-step milestone roadmap bridging missing skill gaps.

### Update Roadmap Step Progress
- **Method**: `PATCH /api/learning/roadmaps/:roadmapId/steps/:stepId`
- **Auth**: `Bearer <accessToken>`
- **Body**:
  ```json
  {
    "status": "completed"
  }
  ```

---

## 4. 💼 Opportunity Service (`/api/opportunities`)

### Search Opportunities
- **Method**: `GET /api/opportunities?type=internship&remote=true&search=React`
- **Auth**: None
- **Response `200`**: Filtered list of jobs, internships, hackathons, and scholarships.

### Match Opportunities to Authenticated Student
- **Method**: `GET /api/opportunities/match/me`
- **Auth**: `Bearer <accessToken>`
- **Response `200`**: Ranked opportunities with personalized `matchScore` (0-100%).

### Track Application
- **Method**: `POST /api/opportunities/:id/apply`
- **Auth**: `Bearer <accessToken>`
- **Body**:
  ```json
  {
    "notes": "Applied via company career portal on Oct 19"
  }
  ```

---

## 5. 📄 Resume Service (`/api/resume`)

### Analyze Resume (ATS Engine)
- **Method**: `POST /api/resume/analyze`
- **Auth**: Optional `Bearer <accessToken>`
- **Body**:
  ```json
  {
    "targetRole": "Full Stack Developer",
    "resumeText": "John Doe\nTechnical Skills: React, Node.js, SQL..."
  }
  ```
- **Response `200`**:
  ```json
  {
    "success": true,
    "data": {
      "atsScore": 84,
      "breakdown": {
        "keywordsScore": 82,
        "verbsScore": 85,
        "impactScore": 90,
        "formattingScore": 95
      },
      "matchedKeywords": ["react", "node.js", "sql"],
      "missingKeywords": ["typescript", "docker"],
      "feedback": { "strengths": [...], "improvements": [...] }
    }
  }
  ```

### Enhance Bullet Point (Google XYZ Formula)
- **Method**: `POST /api/resume/enhance-bullet`
- **Body**:
  ```json
  {
    "bulletPoint": "Worked on backend REST APIs using Node.js"
  }
  ```
- **Response `200`**:
  ```json
  {
    "success": true,
    "data": {
      "original": "Worked on backend REST APIs using Node.js",
      "enhanced": "Spearheaded backend REST APIs using Node.js, boosting overall efficiency by 25% and delivering ahead of schedule."
    }
  }
  ```

---

## 6. 📈 Progress Service (`/api/progress`)

### Get Career Readiness Score
- **Method**: `GET /api/progress/readiness`
- **Auth**: `Bearer <accessToken>`
- **Response `200`**: Weighted readiness score across 5 pillars (Skills, Projects, Resume, Learning, Opportunities).

### Manage Goals
- `GET /api/progress/goals`: Retrieve active checklist goals.
- `POST /api/progress/goals`: Create a new study milestone goal.
- `PATCH /api/progress/goals/:id`: Toggle goal completion.
- `DELETE /api/progress/goals/:id`: Remove goal.
