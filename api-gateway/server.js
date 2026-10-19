const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const PORT = Number(process.env.PORT || process.env.API_GATEWAY_PORT || 5000);

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}

const serviceProxies = [
  { prefix: "/api/auth", envName: "AUTH_SERVICE_URL" },
  { prefix: "/api/career", envName: "CAREER_AI_SERVICE_URL" },
  { prefix: "/api/learning", envName: "LEARNING_SERVICE_URL" },
  { prefix: "/api/opportunities", envName: "OPPORTUNITY_SERVICE_URL" },
  { prefix: "/api/resume", envName: "RESUME_SERVICE_URL" },
  { prefix: "/api/progress", envName: "PROGRESS_SERVICE_URL" },
].map((service) => {
  const target = process.env[service.envName]?.trim();
  if (!target) {
    throw new Error(`${service.envName} is required. Set it in api-gateway/.env.`);
  }

  let parsedTarget;
  try {
    parsedTarget = new URL(target);
  } catch {
    throw new Error(`${service.envName} must be a valid HTTP or HTTPS URL.`);
  }
  if (parsedTarget.protocol !== "http:" && parsedTarget.protocol !== "https:") {
    throw new Error(`${service.envName} must use HTTP or HTTPS.`);
  }

  return { ...service, target };
});

const readPositiveInteger = (name, fallback) => {
  const rawValue = process.env[name];
  if (rawValue === undefined || rawValue.trim() === "") return fallback;

  const value = Number(rawValue);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return value;
};

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
  windowMs: readPositiveInteger("RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000),
  max: readPositiveInteger("RATE_LIMIT_MAX", 100),
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
  });
});

// ─── Proxy Configuration ──────────────────────────────────────
// Express strips the mounted prefix from req.url, so restore it for the service.
const proxyOptions = (target, servicePrefix) => ({
  target,
  changeOrigin: true,
  pathRewrite: (path) => `${servicePrefix}${path}`,
  on: {
    error: (err, req, res) => {
      console.error(`Proxy error for ${req.originalUrl || req.url}:`, err.message);
      if (res.headersSent || res.writableEnded) {
        res.destroy(err);
        return;
      }
      res.status(502).json({
        success: false,
        message: "Service temporarily unavailable. Please try again later.",
      });
    },
  },
});

for (const { prefix, target } of serviceProxies) {
  app.use(prefix, createProxyMiddleware(proxyOptions(target, prefix)));
}

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
  console.log("───────────────────────────────────────────────");
  for (const { prefix, target } of serviceProxies) {
    console.log(`   ${prefix.padEnd(20)} → ${target}`);
  }
  console.log("───────────────────────────────────────────────\n");
});