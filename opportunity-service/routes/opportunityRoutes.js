const express = require("express");
const router = express.Router();
const oppController = require("../controllers/opportunityController");
const { authenticate } = require("../middleware/auth");

// Public routes
router.get("/", oppController.getOpportunities);
router.get("/detail/:id", oppController.getOpportunityById);

// Protected routes (require login)
router.get("/match/me", authenticate, oppController.getMatchingOpportunities);
router.get("/bookmarks/me", authenticate, oppController.getBookmarks);
router.post("/:id/bookmark", authenticate, oppController.bookmarkOpportunity);
router.delete("/:id/bookmark", authenticate, oppController.unbookmarkOpportunity);

router.post("/:id/apply", authenticate, oppController.applyOpportunity);
router.get("/applications/me", authenticate, oppController.getUserApplications);
router.patch("/applications/:id/status", authenticate, oppController.updateApplicationStatus);

module.exports = router;
