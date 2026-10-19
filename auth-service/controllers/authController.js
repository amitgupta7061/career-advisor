const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getDb } = require("../config/db");
const { getRedis } = require("../config/redis");

/**
 * Generate access & refresh tokens for a user.
 */
function generateTokens(user) {
  const secret = process.env.JWT_SECRET || "fallback_secret_key_123";
  const refreshSecret = process.env.JWT_REFRESH_SECRET || secret + "_refresh";

  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    refreshSecret,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d" }
  );

  return { accessToken, refreshToken };
}

/**
 * POST /api/auth/register
 * Register a new user (student, mentor, or admin).
 */
async function register(req, res) {
  try {
    const { firstName, lastName, email, password, role = "student" } = req.body;
    const sql = getDb();

    // Check if user exists
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const [user] = await sql`
      INSERT INTO users (first_name, last_name, email, password_hash, role)
      VALUES (${firstName}, ${lastName}, ${email}, ${passwordHash}, ${role})
      RETURNING id, first_name, last_name, email, role, created_at
    `;

    // Create corresponding profile
    if (role === "student") {
      await sql`INSERT INTO student_profiles (user_id) VALUES (${user.id})`;
    } else if (role === "mentor") {
      await sql`INSERT INTO mentor_profiles (user_id) VALUES (${user.id})`;
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Store refresh token
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await sql`
      INSERT INTO refresh_tokens (user_id, token, expires_at)
      VALUES (${user.id}, ${refreshToken}, ${expiresAt})
    `;

    // Cache user session in Redis (optional)
    const redis = getRedis();
    if (redis) {
      await redis.set(`session:${user.id}`, JSON.stringify(user), { ex: 3600 });
    }

    res.status(201).json({
      success: true,
      message: "Account created successfully!",
      data: {
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create account. Please try again.",
    });
  }
}

/**
 * POST /api/auth/login
 * Login with email and password.
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;
    const sql = getDb();

    // Find user
    const [user] = await sql`
      SELECT id, first_name, last_name, email, password_hash, role, avatar_url
      FROM users WHERE email = ${email}
    `;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Store refresh token
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await sql`
      INSERT INTO refresh_tokens (user_id, token, expires_at)
      VALUES (${user.id}, ${refreshToken}, ${expiresAt})
    `;

    // Cache session (optional)
    const redis = getRedis();
    if (redis) {
      await redis.set(
        `session:${user.id}`,
        JSON.stringify({
          id: user.id,
          email: user.email,
          role: user.role,
        }),
        { ex: 3600 }
      );
    }

    res.json({
      success: true,
      message: "Login successful!",
      data: {
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatar_url,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
    });
  }
}

/**
 * POST /api/auth/refresh
 * Get a new access token using a refresh token.
 */
async function refreshToken(req, res) {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required.",
      });
    }

    const sql = getDb();

    // Verify refresh token
    const refreshSecret = process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET || "fallback_secret_key_123") + "_refresh";
    const decoded = jwt.verify(token, refreshSecret);

    // Check if token exists in DB
    const [storedToken] = await sql`
      SELECT id FROM refresh_tokens
      WHERE user_id = ${decoded.id} AND token = ${token} AND expires_at > NOW()
    `;

    if (!storedToken) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token.",
      });
    }

    // Get user
    const [user] = await sql`
      SELECT id, email, role FROM users WHERE id = ${decoded.id}
    `;

    // Generate new access token
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "fallback_secret_key_123",
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.json({
      success: true,
      data: { accessToken },
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid refresh token.",
    });
  }
}

/**
 * POST /api/auth/logout
 * Blacklist the current access token and remove refresh tokens.
 */
async function logout(req, res) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const sql = getDb();
    const redis = getRedis();

    if (token && redis) {
      // Blacklist the access token in Redis until it expires
      const decoded = jwt.decode(token);
      const ttl = decoded ? decoded.exp - Math.floor(Date.now() / 1000) : 0;
      if (ttl > 0) {
        await redis.set(`blacklist:${token}`, "true", { ex: ttl });
      }
    }

    // Remove all refresh tokens for this user
    if (req.user) {
      await sql`DELETE FROM refresh_tokens WHERE user_id = ${req.user.id}`;
      if (redis) {
        await redis.del(`session:${req.user.id}`);
      }
    }

    res.json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.json({ success: true, message: "Logged out." });
  }
}

/**
 * GET /api/auth/me
 * Get current user profile.
 */
async function getProfile(req, res) {
  try {
    const sql = getDb();

    const [user] = await sql`
      SELECT id, first_name, last_name, email, role, avatar_url, bio, phone, location, created_at
      FROM users WHERE id = ${req.user.id}
    `;

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    let profile = null;
    if (user.role === "student") {
      const [sp] = await sql`
        SELECT * FROM student_profiles WHERE user_id = ${user.id}
      `;
      profile = sp || null;
    } else if (user.role === "mentor") {
      const [mp] = await sql`
        SELECT * FROM mentor_profiles WHERE user_id = ${user.id}
      `;
      profile = mp || null;
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatar_url,
          bio: user.bio,
          phone: user.phone,
          location: user.location,
          createdAt: user.created_at,
        },
        profile,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile.",
    });
  }
}

/**
 * PUT /api/auth/profile
 * Update user profile and student/mentor-specific data.
 */
async function updateProfile(req, res) {
  try {
    const sql = getDb();
    const { firstName, lastName, bio, phone, location, ...profileData } = req.body;

    // Update user basics
    const [user] = await sql`
      UPDATE users
      SET first_name = COALESCE(${firstName}, first_name),
          last_name = COALESCE(${lastName}, last_name),
          bio = COALESCE(${bio}, bio),
          phone = COALESCE(${phone}, phone),
          location = COALESCE(${location}, location),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${req.user.id}
      RETURNING id, first_name, last_name, email, role
    `;

    // Update role-specific profile
    if (user.role === "student" && Object.keys(profileData).length > 0) {
      const {
        university, degree, branch, yearOfStudy, graduationYear, gpa,
        skills, interests, careerGoals, preferredLocations,
        githubUrl, linkedinUrl, portfolioUrl,
      } = profileData;

      await sql`
        UPDATE student_profiles
        SET university = COALESCE(${university}, university),
            degree = COALESCE(${degree}, degree),
            branch = COALESCE(${branch}, branch),
            year_of_study = COALESCE(${yearOfStudy}, year_of_study),
            graduation_year = COALESCE(${graduationYear}, graduation_year),
            gpa = COALESCE(${gpa}, gpa),
            skills = COALESCE(${skills}, skills),
            interests = COALESCE(${interests}, interests),
            career_goals = COALESCE(${careerGoals}, career_goals),
            preferred_locations = COALESCE(${preferredLocations}, preferred_locations),
            github_url = COALESCE(${githubUrl}, github_url),
            linkedin_url = COALESCE(${linkedinUrl}, linkedin_url),
            portfolio_url = COALESCE(${portfolioUrl}, portfolio_url),
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${req.user.id}
      `;
    }

    // Invalidate cached session
    const redis = getRedis();
    await redis.del(`session:${req.user.id}`);

    res.json({
      success: true,
      message: "Profile updated successfully.",
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile.",
    });
  }
}

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
};
