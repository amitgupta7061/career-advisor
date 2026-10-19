const path = require("path");
require("dotenv").config();
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const { neon } = require("@neondatabase/serverless");
const { Redis } = require("@upstash/redis");

let sql, redis;

function getDb() {
  if (!sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set in environment. Please set it in .env");
    }
    sql = neon(process.env.DATABASE_URL);
  }
  return sql;
}

function getRedis() {
  if (!redis) {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
    } else {
      redis = null;
    }
  }
  return redis;
}

module.exports = { getDb, getRedis };
