const express = require("express");
const router = express.Router();
const resumeController = require("../controllers/resumeController");
const { authenticate } = require("../middleware/auth");

// Public endpoints
router.get("/target-roles", resumeController.getTargetRoles);
router.post("/enhance-bullet", resumeController.enhanceBulletPoint);

// Can analyze anonymously or logged-in (optional auth check)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const jwt = require("jsonwebtoken");
      const token = authHeader.split(" ")[1];
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      // ignore invalid token in optional auth
    }
  }
  next();
};

router.post("/analyze", optionalAuth, resumeController.analyzeResume);

// Protected endpoints
router.get("/history", authenticate, resumeController.getAnalysisHistory);

module.exports = router;
