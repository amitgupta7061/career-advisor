const jwt = require("jsonwebtoken");
function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Access denied." });
    }
    req.user = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
    next();
  } catch { return res.status(401).json({ success: false, message: "Invalid token." }); }
}
module.exports = { authenticate };
