require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const learningRoutes = require("./routes/learningRoutes");

const app = express();
const PORT = process.env.PORT || 5003;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || "*", credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ success: true, service: "learning-service", timestamp: new Date().toISOString() });
});

app.use("/api/learning", learningRoutes);

app.use("*", (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use((err, req, res, next) => {
  console.error("Learning Service Error:", err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`\n📚 Learning Service running on http://localhost:${PORT}`);
  console.log(`   Routes: /api/learning/courses, /api/learning/roadmap/generate, /api/learning/roadmaps\n`);
});
