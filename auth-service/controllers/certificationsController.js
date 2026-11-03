const { getDb } = require("../config/db");
const { getStudentProfileId } = require("../services/profileService");

/**
 * GET /api/profile/certifications
 */
async function getCertifications(req, res) {
  try {
    const sql = getDb();
    const profileId = await getStudentProfileId(req.user.id);
    const certs = await sql`
      SELECT * FROM student_certifications 
      WHERE student_profile_id = ${profileId} 
      ORDER BY issue_date DESC NULLS LAST, created_at DESC
    `;
    res.json({ success: true, count: certs.length, data: certs });
  } catch (error) {
    console.error("Get certifications error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch certifications." });
  }
}

/**
 * POST /api/profile/certifications
 */
async function addCertification(req, res) {
  try {
    const sql = getDb();
    const profileId = await getStudentProfileId(req.user.id);
    const {
      name, issuingOrganization, issueDate, expirationDate,
      credentialId, credentialUrl, relatedSkills = []
    } = req.body;

    if (!name || !issuingOrganization || !issueDate) {
      return res.status(400).json({ success: false, message: "Certification name, issuing organization, and issue date are required." });
    }

    const [cert] = await sql`
      INSERT INTO student_certifications (
        student_profile_id, name, issuing_organization, issue_date,
        expiration_date, credential_id, credential_url, related_skills
      ) VALUES (
        ${profileId}, ${name}, ${issuingOrganization}, ${new Date(issueDate)},
        ${expirationDate ? new Date(expirationDate) : null},
        ${credentialId || null}, ${credentialUrl || null}, ${relatedSkills}
      )
      RETURNING *
    `;

    res.status(201).json({ success: true, message: "Certification added successfully.", data: cert });
  } catch (error) {
    console.error("Add certification error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to add certification." });
  }
}

/**
 * PATCH /api/profile/certifications/:id
 */
async function updateCertification(req, res) {
  try {
    const sql = getDb();
    const profileId = await getStudentProfileId(req.user.id);
    const { id } = req.params;
    const {
      name, issuingOrganization, issueDate, expirationDate,
      credentialId, credentialUrl, relatedSkills
    } = req.body;

    const [updated] = await sql`
      UPDATE student_certifications
      SET name = COALESCE(${name}, name),
          issuing_organization = COALESCE(${issuingOrganization}, issuing_organization),
          issue_date = COALESCE(${issueDate ? new Date(issueDate) : null}, issue_date),
          expiration_date = COALESCE(${expirationDate ? new Date(expirationDate) : null}, expiration_date),
          credential_id = COALESCE(${credentialId}, credential_id),
          credential_url = COALESCE(${credentialUrl}, credential_url),
          related_skills = COALESCE(${relatedSkills}, related_skills),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND student_profile_id = ${profileId}
      RETURNING *
    `;

    if (!updated) {
      return res.status(404).json({ success: false, message: "Certification not found or unauthorized." });
    }

    res.json({ success: true, message: "Certification updated successfully.", data: updated });
  } catch (error) {
    console.error("Update certification error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to update certification." });
  }
}

/**
 * DELETE /api/profile/certifications/:id
 */
async function deleteCertification(req, res) {
  try {
    const sql = getDb();
    const profileId = await getStudentProfileId(req.user.id);
    const { id } = req.params;

    const [deleted] = await sql`
      DELETE FROM student_certifications
      WHERE id = ${id} AND student_profile_id = ${profileId}
      RETURNING id
    `;

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Certification not found or unauthorized." });
    }

    res.json({ success: true, message: "Certification removed successfully." });
  } catch (error) {
    console.error("Delete certification error:", error);
    res.status(500).json({ success: false, message: "Failed to delete certification." });
  }
}

module.exports = {
  getCertifications,
  addCertification,
  updateCertification,
  deleteCertification,
};

