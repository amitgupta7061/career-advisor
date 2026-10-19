# 🚀 Getting Started with PathFinder

Welcome to **PathFinder** — the One-Stop Personalized AI Career & Education Advisor. This guide will walk you through setting up and running the entire platform on your local machine from scratch in under 5 minutes.

---

## 📋 Prerequisites

Make sure you have the following installed on your machine:

- **Node.js**: `v18.x` or `v20.x` or higher ([Download Node.js](https://nodejs.org/))
- **npm**: `v9.x` or higher (bundled with Node.js)
- **Git**: ([Download Git](https://git-scm.com/))
- **Neon PostgreSQL Account**: Free cloud serverless database ([Create Neon Account](https://neon.tech/))
- **Upstash Redis Account** *(Optional)*: Free cloud serverless Redis for caching & rate limiting ([Create Upstash Account](https://upstash.com/))

---

## 🛠️ Step 1: Clone the Repository

```bash
git clone <your-repository-url>
cd career-advisor
```

---

## 🔑 Step 2: Configure Environment Variables

1. Copy the example environment file in the root directory:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` in your text editor and paste your **Neon PostgreSQL database connection string**:
   ```env
   # Neon PostgreSQL Connection String
   DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-sample-pool.us-east-2.aws.neon.tech/neondb?sslmode=require

   # Upstash Redis (Optional - leave as placeholder if not using)
   UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-token

   # JWT secrets (replace with long random values before deployment)
   JWT_SECRET=replace-with-a-long-random-secret
   JWT_REFRESH_SECRET=replace-with-a-different-long-random-secret
   JWT_REFRESH_EXPIRES_IN=30d

   # Frontend and gateway URLs
   FRONTEND_URL=http://localhost:3000
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   AUTH_SERVICE_URL=http://localhost:5001
   CAREER_AI_SERVICE_URL=http://localhost:5002
   LEARNING_SERVICE_URL=http://localhost:5003
   OPPORTUNITY_SERVICE_URL=http://localhost:5004
   RESUME_SERVICE_URL=http://localhost:5005
   PROGRESS_SERVICE_URL=http://localhost:5006
   ```

> 💡 **Tip:** Each backend service loads its own `.env` first and then fills any missing values from the root `.env`. The gateway reads its local `.env` first and uses the root file as a fallback. The frontend uses `NEXT_PUBLIC_API_URL` from the root environment when you configure it before starting Next.js.

---

## 📦 Step 3: Install All Dependencies

Run the unified installer script from the root folder:

```bash
npm run install:all
```

*This will automatically install dependencies across the API Gateway, Frontend, and all 6 backend microservices.*

---

## 🗄️ Step 4: Initialize Database & Seed Realistic Data

Run the database setup script to create all relational tables and insert seed data (10 Indian-market career roles, 12 curated courses, and 8 top company opportunities):

```bash
npm run db:init:all
```

You should see confirmation output:
```
✅ Neon DB connection established
  ✅ users, student_profiles, mentor_profiles tables created
  ✅ 10 career roles seeded
  ✅ 12 courses seeded
  ✅ 8 opportunities seeded
  ✅ resume and progress tables created
🎉 Database initialization complete!
```

---

## 🚀 Step 5: Start the Platform

Open separate terminal tabs or windows in the root `career-advisor` directory:

### 1. Start the Frontend (Next.js)
```bash
npm run frontend
# Runs on http://localhost:3000
```

### 2. Start the API Gateway
```bash
npm run gateway
# Runs on http://localhost:5000
```

### 3. Start the Backend Microservices
```bash
npm run auth         # Auth Service on Port 5001
npm run career       # Career AI Service on Port 5002
npm run learning     # Learning Service on Port 5003
npm run opportunity  # Opportunity Service on Port 5004
npm run resume       # Resume Service on Port 5005
npm run progress     # Progress Service on Port 5006
```

---

## 🌐 Step 6: Verify in Browser

1. Open your browser and navigate to: **[http://localhost:3000](http://localhost:3000)**
2. Click **"Get Started"** or visit **`/signup`** to create your test account.
3. Once registered, you will be redirected to the **Student Dashboard**!
4. Explore the feature subpages:
   - 🧭 **Career Paths**: `http://localhost:3000/dashboard/careers`
   - 📚 **Learning Roadmap**: `http://localhost:3000/dashboard/roadmap`
   - 💼 **Opportunities & Jobs**: `http://localhost:3000/dashboard/opportunities`
   - 📄 **ATS Resume Scanner**: `http://localhost:3000/dashboard/resume`
   - 📈 **Readiness & Goals**: `http://localhost:3000/dashboard/progress`

---

## ❓ Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| `password authentication failed` | Wrong DB credentials in `.env` | Verify connection string from your Neon dashboard |
| `Cannot find module 'dotenv'` | Missing dependencies | Run `npm run install:all` in the root folder |
| `Service temporarily unavailable (502)` | Microservice not running | Make sure the target service is running (e.g. `npm run auth`) |
| `CORS Error` | Frontend URL mismatch | Ensure `FRONTEND_URL=http://localhost:3000` in `.env` |
