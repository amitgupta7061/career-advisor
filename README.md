# 🚀 PathFinder — One-Stop Personalized AI Career & Education Advisor

An intelligent, full-stack microservices platform designed to guide students and graduates from foundational learning to high-growth tech careers with personalized roadmaps, skill gap analysis, ATS resume optimization, and curated opportunity matching.

---

## 🏛️ Architecture Overview

The system is built as a modular microservices architecture coordinated via a centralized API Gateway and powered by Next.js on the frontend.

```
                              ┌──────────────────────────────────────────┐
                              │            Next.js Frontend              │
                              │         http://localhost:3000            │
                              └────────────────────┬─────────────────────┘
                                                   │
                                                   ▼
                              ┌──────────────────────────────────────────┐
                              │               API Gateway                │
                              │         http://localhost:5000            │
                              └────────────────────┬─────────────────────┘
                                                   │
        ┌───────────────┬──────────────────┬───────┴──────────┬─────────────────┬────────────────┐
        ▼               ▼                  ▼                  ▼                 ▼                ▼
 ┌─────────────┐ ┌───────────────┐ ┌───────────────┐ ┌─────────────────┐ ┌─────────────┐ ┌──────────────┐
 │ Auth Svc    │ │ Career AI Svc │ │ Learning Svc  │ │ Opportunity Svc │ │ Resume Svc  │ │ Progress Svc │
 │ Port 5001   │ │ Port 5002     │ │ Port 5003     │ │ Port 5004       │ │ Port 5005   │ │ Port 5006    │
 └──────┬──────┘ └───────┬───────┘ └───────┬───────┘ └────────┬────────┘ └──────┬──────┘ └──────┬───────┘
        │                │                 │                  │                 │               │
        └────────────────┴─────────────────┴────────┬─────────┴─────────────────┴───────────────┘
                                                    ▼
                               ┌────────────────────────────────────────┐
                               │   Neon Serverless PostgreSQL Database  │
                               │        + Upstash Redis (Cache)         │
                               └────────────────────────────────────────┘
```

---

## 📦 Services Directory & Port Allocation

| Service | Port | Base Proxy URL | Description | Key Capabilities |
| :--- | :---: | :--- | :--- | :--- |
| **API Gateway** | `5000` | `http://localhost:5000` | Central Entry Point | Rate limiting, CORS, Helmet security, request proxying |
| **Frontend** | `3000` | `http://localhost:3000` | Next.js 14 Web App | Responsive UI, Dashboard, Career Explorer, ATS Scanner |
| **Auth Service** | `5001` | `/api/auth` | Identity & Profiles | JWT Auth, bcrypt hashing, Neon DB, Redis session tokens |
| **Career AI Service** | `5002` | `/api/career` | Career Recommendation | 10 Indian tech roles (LPA), skill gap analysis & matching |
| **Learning Service** | `5003` | `/api/learning` | Courses & Roadmaps | Step-by-step learning milestones, course links, progress |
| **Opportunity Service**| `5004` | `/api/opportunities`| Jobs & Internships | Filter jobs/internships, AI skill match %, bookmarks & apply |
| **Resume Service** | `5005` | `/api/resume` | ATS Resume Scanner | ATS score (0-100), missing keywords, Google XYZ enhancer |
| **Progress Service** | `5006` | `/api/progress` | Analytics & Badges | Career readiness score, 5 pillars, goals, badge awards |

---

## 🛠️ Quick Start Guide

### 1. Install All Dependencies
Run this in the root directory:
```bash
npm run install:all
```

Or install individual service dependencies:
```bash
cd api-gateway && npm install
cd ../auth-service && npm install
cd ../career-ai-service && npm install
cd ../learning-service && npm install
cd ../opportunity-service && npm install
cd ../resume-service && npm install
cd ../progress-service && npm install
cd ../frontend && npm install
```

### 2. Configure Database Connection
Copy `.env.example` or update each microservice `.env` file with your **Neon PostgreSQL** connection string:
```env
DATABASE_URL=postgresql://user:password@ep-sample-pool-123456.us-east-2.aws.neon.tech/career_advisor?sslmode=require
```

### 3. Initialize Database & Seed Realistic Indian Market Data
Run the unified initialization script to create all tables and seed career roles, courses, and opportunities:
```bash
npm run db:init:all
```

### 4. Run the Applications

**Frontend:**
```bash
npm run frontend
# Runs on http://localhost:3000
```

**API Gateway:**
```bash
npm run gateway
# Runs on http://localhost:5000
```

**Microservices (in separate terminals or via concurrently):**
```bash
npm run auth         # Port 5001
npm run career       # Port 5002
npm run learning     # Port 5003
npm run opportunity  # Port 5004
npm run resume       # Port 5005
npm run progress     # Port 5006
```

---

## 🌟 Key Application Features

1. **AI Career Recommendation & Skill Gap Analysis (`/dashboard/careers`)**:
   - 10 Indian-market roles with realistic LPA compensation ranges (e.g. ₹8 - 35 LPA).
   - Dynamic comparison between student profile skills vs required skills.
   - Skill gaps categorized by Critical, High, and Medium priority.

2. **Personalized Learning Roadmap (`/dashboard/roadmap`)**:
   - Step-by-step milestone timeline with hours estimation.
   - Integrated curated courses from freeCodeCamp, Coursera, DeepLearning.AI, and hands-on capstone projects.
   - Live milestone progress tracking with toggleable checkmarks.

3. **Job & Internship Matching Portal (`/dashboard/opportunities`)**:
   - Curated listings across top tech companies (Flipkart, Swiggy, Microsoft Research, Zomato, Razorpay).
   - AI Skill Match % badge computed against student skills.
   - Track application pipeline stages (`Applied`, `Interviewing`, `Offered`).

4. **AI Resume ATS Scanner (`/dashboard/resume`)**:
   - Detailed ATS score breakdown (Keywords, Action Verbs, Measurable Impact Metrics, Section Formatting).
   - Missing keyword identification against the target job role.
   - **Google XYZ Formula Bullet Enhancer**: Converts weak responsibilities into high-impact accomplishment bullets.

5. **Career Readiness & Badges (`/dashboard/progress`)**:
   - Weighted overall readiness score across 5 essential pillars.
   - Weekly milestone goals checklist with one-click completion.
   - Gamified achievement badges (Skill Explorer, ATS Pro, Fast Learner, Career Ready Master).
