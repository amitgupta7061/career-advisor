const express = require("express");
const router = express.Router();
const learningController = require("../controllers/learningController");
const { authenticate } = require("../middleware/auth");

// Public routes
router.get("/courses", learningController.getCourses);

// Protected routes (require login)
router.post("/roadmap/generate", authenticate, learningController.generateRoadmap);
router.get("/roadmaps", authenticate, learningController.getUserRoadmaps);
router.get("/roadmaps/:id", authenticate, learningController.getRoadmapDetail);
router.patch("/roadmaps/:roadmapId/steps/:stepId", authenticate, learningController.updateStepStatus);
router.patch("/roadmaps/:id/state", authenticate, learningController.setRoadmapStatus);

module.exports = router;
