require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const opportunityRoutes = require("./routes/opportunityRoutes");

const app = express();
const PORT = process.env.PORT || 5004;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || "*", credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ success: true, service: "opportunity-service", timestamp: new Date().toISOString() });
});

app.use("/api/opportunities", opportunityRoutes);

app.use("*", (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use((err, req, res, next) => {
  console.error("Opportunity Service Error:", err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`\n💼 Opportunity Service running on http://localhost:${PORT}`);
  console.log(`   Routes: /api/opportunities, /api/opportunities/match/me, /api/opportunities/bookmarks/me\n`);
});
