const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");

const personalController = require("../controllers/personalProfileController");
const academicsController = require("../controllers/academicsController");
const skillsController = require("../controllers/skillsController");
const preferencesController = require("../controllers/preferencesController");
const projectsController = require("../controllers/projectsController");
const experiencesController = require("../controllers/experiencesController");
const certificationsController = require("../controllers/certificationsController");

const {
  validateUUID,
  validatePersonalProfile,
  validateAcademic,
  validateSkill,
  validatePreferences,
  validateProject,
  validateExperience,
  validateCertification,
} = require("../middleware/profileValidation");

// All profile endpoints require authenticated student/user session
router.use(authenticate);

// ─── 1. Personal Profile ─────────────────────────────────────────────
router.get("/me", personalController.getMyProfile);
router.patch("/me", validatePersonalProfile, personalController.updatePersonalProfile);

// ─── 2. Academic Information ─────────────────────────────────────────
router.get("/academics", academicsController.getAcademics);
router.post("/academics", validateAcademic, academicsController.addAcademic);
router.patch("/academics/:id", validateUUID("id"), validateAcademic, academicsController.updateAcademic);
router.delete("/academics/:id", validateUUID("id"), academicsController.deleteAcademic);

// ─── 3. Technical & Soft Skills ───────────────────────────────────────
router.get("/skills", skillsController.getSkills);
router.post("/skills", validateSkill, skillsController.addSkill);
router.patch("/skills/:id", validateUUID("id"), validateSkill, skillsController.updateSkill);
router.delete("/skills/:id", validateUUID("id"), skillsController.deleteSkill);

// ─── 4. Career Preferences ───────────────────────────────────────────
router.get("/preferences", preferencesController.getPreferences);
router.put("/preferences", validatePreferences, preferencesController.updatePreferences);

// ─── 5. Projects ─────────────────────────────────────────────────────
router.get("/projects", projectsController.getProjects);
router.post("/projects", validateProject, projectsController.addProject);
router.patch("/projects/:id", validateUUID("id"), validateProject, projectsController.updateProject);
router.delete("/projects/:id", validateUUID("id"), projectsController.deleteProject);

// ─── 6. Experience & Internships ─────────────────────────────────────
router.get("/experiences", experiencesController.getExperiences);
router.post("/experiences", validateExperience, experiencesController.addExperience);
router.patch("/experiences/:id", validateUUID("id"), validateExperience, experiencesController.updateExperience);
router.delete("/experiences/:id", validateUUID("id"), experiencesController.deleteExperience);

// ─── 7. Certifications ───────────────────────────────────────────────
router.get("/certifications", certificationsController.getCertifications);
router.post("/certifications", validateCertification, certificationsController.addCertification);
router.patch("/certifications/:id", validateUUID("id"), validateCertification, certificationsController.updateCertification);
router.delete("/certifications/:id", validateUUID("id"), certificationsController.deleteCertification);

module.exports = router;
