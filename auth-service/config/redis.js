const path = require("path");
require("dotenv").config();
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const { Redis } = require("@upstash/redis");

let redis;

/**
 * Get or create the Upstash Redis client.
 * Used for session caching, token blacklisting, and rate limiting.
 */
function getRedis() {
  if (!redis) {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      console.warn("⚠️  Upstash Redis credentials not set. Redis caching disabled.");
      return null;
    }
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    console.log("✅ Upstash Redis connected");
  }
  return redis;
}

module.exports = { getRedis };
