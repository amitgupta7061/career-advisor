require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const authRoutes = require("./routes/authRoutes");

const app = express();
const PORT = process.env.PORT || 5001;

// ─── Middleware ────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// ─── Health Check ──────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "auth-service",
    timestamp: new Date().toISOString(),
  });
});

// ─── Routes ────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);

// ─── 404 Handler ───────────────────────────────────────────────
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Auth service: Route ${req.originalUrl} not found`,
  });
});

// ─── Global Error Handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Auth Service Error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// ─── Start Server ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🔐 Auth Service running on http://localhost:${PORT}`);
  console.log(`   Routes: /api/auth/register, /api/auth/login, /api/auth/me\n`);
});
