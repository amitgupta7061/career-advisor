const express = require("express");
const router = express.Router();
const progressController = require("../controllers/progressController");
const { authenticate } = require("../middleware/auth");

// All progress routes are authenticated
router.use(authenticate);

router.get("/readiness", progressController.getCareerReadiness);
router.get("/dashboard", progressController.getDashboardSummary);

// Activities
router.get("/activities", progressController.getActivities);
router.post("/activities", progressController.logActivity);

// Goals
router.get("/goals", progressController.getGoals);
router.post("/goals", progressController.createGoal);
router.patch("/goals/:id", progressController.updateGoal);
router.delete("/goals/:id", progressController.deleteGoal);

// Badges
router.get("/badges", progressController.getUserBadges);

module.exports = router;
