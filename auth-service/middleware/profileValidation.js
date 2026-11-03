const { body, param, validationResult } = require("express-validator");

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed.",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

const validateUUID = (fieldName = "id") => [
  param(fieldName).isUUID().withMessage(`Invalid ${fieldName} format; must be a valid UUID.`),
  handleValidationErrors,
];

// Personal Profile validation
const validatePersonalProfile = [
  body("phone").optional({ checkFalsy: true }).isMobilePhone().withMessage("Invalid phone number format."),
  body("dateOfBirth").optional({ checkFalsy: true }).isISO8601().toDate().withMessage("Invalid date format for date of birth (YYYY-MM-DD expected)."),
  body("gender").optional({ checkFalsy: true }).isIn(["male", "female", "non-binary", "prefer_not_to_say", "other"]).withMessage("Invalid gender option."),
  body("linkedinUrl").optional({ checkFalsy: true }).isURL().withMessage("Invalid LinkedIn URL."),
  body("githubUrl").optional({ checkFalsy: true }).isURL().withMessage("Invalid GitHub URL."),
  body("portfolioUrl").optional({ checkFalsy: true }).isURL().withMessage("Invalid Portfolio URL."),
  handleValidationErrors,
];

// Academics validation
const validateAcademic = [
  body("institutionName").trim().notEmpty().withMessage("Institution name is required."),
  body("degree").trim().notEmpty().withMessage("Degree is required."),
  body("currentSemester").optional({ checkFalsy: true }).isInt({ min: 1, max: 12 }).withMessage("Semester must be between 1 and 12."),
  body("enrollmentYear").optional({ checkFalsy: true }).isInt({ min: 1990, max: 2100 }).withMessage("Invalid enrollment year."),
  body("graduationYear").optional({ checkFalsy: true }).isInt({ min: 1990, max: 2100 }).withMessage("Invalid graduation year."),
  body("gradeType").optional().isIn(["cgpa", "percentage", "grade_letter"]).withMessage("Grade type must be cgpa, percentage, or grade_letter."),
  body("gradeScore").optional({ checkFalsy: true }).isFloat({ min: 0, max: 100 }).withMessage("Grade score must be between 0 and 100."),
  handleValidationErrors,
];

// Skills validation
const validateSkill = [
  body("skillName").trim().notEmpty().withMessage("Skill name is required."),
  body("skillCategory").optional().isIn(["technical", "soft", "tool", "language"]).withMessage("Skill category must be technical, soft, tool, or language."),
  body("proficiencyLevel").optional().isIn(["beginner", "intermediate", "advanced", "expert"]).withMessage("Proficiency level must be beginner, intermediate, advanced, or expert."),
  body("yearsOfExperience").optional().isFloat({ min: 0, max: 50 }).withMessage("Years of experience must be between 0 and 50."),
  handleValidationErrors,
];

// Preferences validation
const validatePreferences = [
  body("workPreference").optional().isIn(["remote", "hybrid", "on_site", "flexible"]).withMessage("Invalid work preference option."),
  body("employmentType").optional().isIn(["internship", "full_time", "part_time", "any"]).withMessage("Invalid employment type option."),
  handleValidationErrors,
];

// Projects validation
const validateProject = [
  body("title").trim().notEmpty().withMessage("Project title is required."),
  body("description").trim().notEmpty().withMessage("Project description is required."),
  body("category").optional().isIn(["academic", "personal", "hackathon", "freelance", "open_source"]).withMessage("Invalid project category."),
  body("status").optional().isIn(["in_progress", "completed"]).withMessage("Status must be in_progress or completed."),
  body("githubUrl").optional({ checkFalsy: true }).isURL().withMessage("Invalid GitHub URL."),
  body("liveUrl").optional({ checkFalsy: true }).isURL().withMessage("Invalid Live Project URL."),
  body("startDate").optional({ checkFalsy: true }).isISO8601().toDate().withMessage("Invalid start date."),
  body("endDate").optional({ checkFalsy: true }).isISO8601().toDate().withMessage("Invalid end date."),
  handleValidationErrors,
];

// Experiences validation
const validateExperience = [
  body("organization").trim().notEmpty().withMessage("Organization / Company name is required."),
  body("roleTitle").trim().notEmpty().withMessage("Role / Internship title is required."),
  body("employmentType").optional().isIn(["internship", "full_time", "part_time", "contract", "freelance"]).withMessage("Invalid employment type."),
  body("startDate").notEmpty().isISO8601().toDate().withMessage("Valid start date is required."),
  body("endDate").optional({ checkFalsy: true }).isISO8601().toDate().withMessage("Invalid end date."),
  handleValidationErrors,
];

// Certifications validation
const validateCertification = [
  body("name").trim().notEmpty().withMessage("Certification name is required."),
  body("issuingOrganization").trim().notEmpty().withMessage("Issuing organization is required."),
  body("issueDate").notEmpty().isISO8601().toDate().withMessage("Valid issue date is required."),
  body("expirationDate").optional({ checkFalsy: true }).isISO8601().toDate().withMessage("Invalid expiration date."),
  body("credentialUrl").optional({ checkFalsy: true }).isURL().withMessage("Invalid credential URL."),
  handleValidationErrors,
];

module.exports = {
  validateUUID,
  validatePersonalProfile,
  validateAcademic,
  validateSkill,
  validatePreferences,
  validateProject,
  validateExperience,
  validateCertification,
};

