const path = require("path");
require("dotenv").config();
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const { neon } = require("@neondatabase/serverless");

let sql;

/**
 * Get or create the Neon DB connection.
 * Uses the serverless driver which works over HTTP — no persistent connections needed.
 */
function getDb() {
  if (!sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set. Please set it in .env");
    }
    sql = neon(process.env.DATABASE_URL);
    console.log("✅ Neon DB connection established");
  }
  return sql;
}

module.exports = { getDb };
