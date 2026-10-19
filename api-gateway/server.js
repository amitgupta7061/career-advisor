require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security Middleware ───────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ─── Rate Limiting ─────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ─── Logging ───────────────────────────────────────────────────
app.use(morgan("combined"));

// ─── Health Check ──────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "API Gateway is running",
    timestamp: new Date().toISOString(),
    services: {
      auth: process.env.AUTH_SERVICE_URL,
      careerAi: process.env.CAREER_AI_SERVICE_URL,
      learning: process.env.LEARNING_SERVICE_URL,
      opportunity: process.env.OPPORTUNITY_SERVICE_URL,
      resume: process.env.RESUME_SERVICE_URL,
      progress: process.env.PROGRESS_SERVICE_URL,
    },
  });
});

// ─── Proxy Configuration ──────────────────────────────────────
// Each route prefix is forwarded to the corresponding microservice.

const proxyOptions = (target, pathRewrite) => ({
  target,
  changeOrigin: true,
  pathRewrite,
  on: {
    proxyReq: (proxyReq, req) => {
      // Forward authorization header
      if (req.headers.authorization) {
        proxyReq.setHeader("Authorization", req.headers.authorization);
      }
    },
    error: (err, req, res) => {
      console.error(`Proxy error for ${req.url}:`, err.message);
      res.status(502).json({
        success: false,
        message: "Service temporarily unavailable. Please try again later.",
      });
    },
  },
});

// Auth Service → /api/auth/*
app.use(
  "/api/auth",
  createProxyMiddleware(
    proxyOptions(process.env.AUTH_SERVICE_URL, { "^/api/auth": "/api/auth" })
  )
);

// Career AI Service → /api/career/*
app.use(
  "/api/career",
  createProxyMiddleware(
    proxyOptions(process.env.CAREER_AI_SERVICE_URL, {
      "^/api/career": "/api/career",
    })
  )
);

// Learning Service → /api/learning/*
app.use(
  "/api/learning",
  createProxyMiddleware(
    proxyOptions(process.env.LEARNING_SERVICE_URL, {
      "^/api/learning": "/api/learning",
    })
  )
);

// Opportunity Service → /api/opportunities/*
app.use(
  "/api/opportunities",
  createProxyMiddleware(
    proxyOptions(process.env.OPPORTUNITY_SERVICE_URL, {
      "^/api/opportunities": "/api/opportunities",
    })
  )
);

// Resume Service → /api/resume/*
app.use(
  "/api/resume",
  createProxyMiddleware(
    proxyOptions(process.env.RESUME_SERVICE_URL, {
      "^/api/resume": "/api/resume",
    })
  )
);

// Progress Service → /api/progress/*
app.use(
  "/api/progress",
  createProxyMiddleware(
    proxyOptions(process.env.PROGRESS_SERVICE_URL, {
      "^/api/progress": "/api/progress",
    })
  )
);

// ─── 404 Handler ───────────────────────────────────────────────
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found. Use /api/{service} to access services.`,
  });
});

// ─── Global Error Handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Gateway Error:", err);
  res.status(500).json({
    success: false,
    message: "Internal gateway error",
  });
});

// ─── Start Server ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 API Gateway running on http://localhost:${PORT}`);
  console.log(`───────────────────────────────────────────────`);
  console.log(`   Auth Service     → ${process.env.AUTH_SERVICE_URL}`);
  console.log(`   Career AI Service→ ${process.env.CAREER_AI_SERVICE_URL}`);
  console.log(`   Learning Service → ${process.env.LEARNING_SERVICE_URL}`);
  console.log(`   Opportunity Svc  → ${process.env.OPPORTUNITY_SERVICE_URL}`);
  console.log(`   Resume Service   → ${process.env.RESUME_SERVICE_URL}`);
  console.log(`   Progress Service → ${process.env.PROGRESS_SERVICE_URL}`);
  console.log(`───────────────────────────────────────────────\n`);
});
