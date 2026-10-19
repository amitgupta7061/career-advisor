const express = require("express");
const router = express.Router();
const careerController = require("../controllers/careerController");
const { authenticate } = require("../middleware/auth");

// Public routes
router.get("/roles", careerController.getAllRoles);
router.get("/roles/:slug", careerController.getRoleBySlug);

// Protected routes (require login)
router.post("/recommend", authenticate, careerController.getRecommendations);
router.get("/skill-gaps", authenticate, careerController.getSkillGaps);
router.post("/skill-gaps/analyze", authenticate, careerController.analyzeSkillGaps);

module.exports = router;
