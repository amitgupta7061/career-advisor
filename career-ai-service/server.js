const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET must be configured in the service or root .env file.");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const careerRoutes = require("./routes/careerRoutes");

const app = express();
const PORT = Number(process.env.PORT || process.env.CAREER_AI_SERVICE_PORT || 5002);

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ success: true, service: "career-ai-service", timestamp: new Date().toISOString() });
});

app.use("/api/career", careerRoutes);

app.use("*", (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use((err, req, res, next) => {
  console.error("Career AI Error:", err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`\n🧠 Career AI Service running on http://localhost:${PORT}`);
  console.log(`   Routes: /api/career/roles, /api/career/recommend, /api/career/skill-gaps\n`);
});
