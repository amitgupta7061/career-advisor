# 🏛️ System Architecture — PathFinder

## Overview

**PathFinder** is built using a **Microservices Architecture** decoupled through a centralized **API Gateway** and powered by a **Next.js 14** web application.

Each microservice encapsulates a distinct business capability with its own routes, controllers, middleware, and database tables, while sharing a unified serverless PostgreSQL database layer (Neon DB) and optional Redis cache (Upstash).

---

## 🗺️ High-Level Architecture Diagram

```
                              ┌──────────────────────────────────────────┐
                              │            Next.js Frontend              │
                              │         http://localhost:3000            │
                              │    (Pages: Dashboard, Careers, etc.)     │
                              └────────────────────┬─────────────────────┘
                                                   │
                                                   │ REST / JSON (JWT in Header)
                                                   ▼
                              ┌──────────────────────────────────────────┐
                              │               API Gateway                │
                              │         http://localhost:5000            │
                              │     (Rate Limiter, Helmet, CORS, Proxy)   │
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

## 🌐 Network & Port Topology

| Component | Port | Internal URL | Gateway Route Prefix | Role |
| :--- | :---: | :--- | :--- | :--- |
| **Frontend** | `3000` | `http://localhost:3000` | N/A | Next.js Client & Server Components |
| **API Gateway** | `5000` | `http://localhost:5000` | `/api/*` | Reverse Proxy & Security Guard |
| **Auth Service** | `5001` | `http://localhost:5001` | `/api/auth/*` | Registration, Login, JWT, Profiles |
| **Career AI Service** | `5002` | `http://localhost:5002` | `/api/career/*` | Role recommendation & skill gaps |
| **Learning Service** | `5003` | `http://localhost:5003` | `/api/learning/*` | Courses & personalized roadmaps |
| **Opportunity Service**| `5004` | `http://localhost:5004` | `/api/opportunities/*`| Jobs, internships, applications |
| **Resume Service** | `5005` | `http://localhost:5005` | `/api/resume/*` | ATS scoring & Google XYZ enhancer |
| **Progress Service** | `5006` | `http://localhost:5006` | `/api/progress/*` | Readiness algorithm, goals, badges |

---

## 🔒 Security & Authentication Flow

1. **Client Request**: The frontend makes an authentication call to `http://localhost:5000/api/auth/login`.
2. **Gateway Forwarding**: The Gateway checks the IP rate limit (100 req / 15 min), applies HTTP security headers (`Helmet`), and proxies the payload to `auth-service` on port `5001`.
3. **Password Verification**: `auth-service` verifies the bcrypt password hash against the `users` table in Neon PostgreSQL.
4. **Token Generation**: On success, an `accessToken` (7-day validity) and a `refreshToken` (30-day validity) are returned.
5. **Session Storage**: The frontend stores the JWT in `localStorage` and automatically attaches it as an `Authorization: Bearer <token>` header in all subsequent requests via [`frontend/src/lib/api.js`](file:///c:/Coding/career-advisor/frontend/src/lib/api.js).
6. **Subservice Verification**: Each microservice utilizes a shared, lightweight JWT authentication middleware that verifies signatures statelessly without needing inter-service network calls.

---

## 💻 Technology Stack Choices

- **Next.js 14 (App Router)**: Fast rendering, SEO metadata, modern React Hooks (`useState`, `useEffect`, `useRouter`), and zero CSS framework bloat using high-performance CSS Modules.
- **Express.js (Node.js)**: Battle-tested, lightweight microservice runtime with minimal memory footprint.
- **Neon Serverless PostgreSQL (`@neondatabase/serverless`)**: Cloud-native database queried over HTTP/WebSockets — eliminates connection pool exhaustion and idle connection costs.
- **Upstash Redis (`@upstash/redis`)**: Serverless Redis accessed over REST API for caching and rate limiting without requiring persistent TCP socket infrastructure.
