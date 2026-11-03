const express = require("express");
const router = express.Router();
const careerController = require("../controllers/careerController");
const recommendationController = require("../controllers/recommendationController");
const skillGapController = require("../controllers/skillGapController");
const { authenticate } = require("../middleware/auth");

// Public routes
router.get("/roles", careerController.getAllRoles);
router.get("/roles/:slug", careerController.getRoleBySlug);
router.get("/roles/:roleId/requirements", skillGapController.getRoleSkillRequirements);
router.get("/skill-gaps/requirements/:roleId", skillGapController.getRoleSkillRequirements);

// Protected routes (require login)
router.post("/recommend", authenticate, recommendationController.generateRecommendations);
router.get("/recommendations/latest", authenticate, recommendationController.getLatestRecommendations);

// Skill Gap Analysis routes (Objective 3)
router.post("/skill-gaps/analyze", authenticate, skillGapController.analyzeSkillGap);
router.get("/skill-gaps/history", authenticate, skillGapController.getSkillGapHistory);
router.get("/skill-gaps", authenticate, careerController.getSkillGaps);

module.exports = router;
