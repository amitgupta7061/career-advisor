const crypto = require("crypto");

/**
 * Hash a plain text token (such as a refresh token or password reset token)
 * using SHA-256 for secure database storage.
 * 
 * @param {string} token 
 * @returns {string} hex digest
 */
function hashToken(token) {
  if (!token) return null;
  return crypto.createHash("sha256").update(token).digest("hex");
}

module.exports = { hashToken };

