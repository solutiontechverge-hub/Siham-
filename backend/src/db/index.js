import "../bootstrap-env.js";
import pg from "pg";

const { Pool } = pg;

let pool;

function getPool() {
  if (pool) {
    return pool;
  }

  const connectionString = process.env.DB_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DB_URL or DATABASE_URL is required.");
  }

  const shouldUseSsl =
    process.env.DB_SSL === "true" ||
    process.env.PGSSLMODE === "require" ||
    connectionString.includes("supabase.co");

  pool = new Pool({
    connectionString,
    ssl: shouldUseSsl ? { rejectUnauthorized: false } : undefined,
  });

  return pool;
}

export const query = (text, params) => getPool().query(text, params);
export const getClient = () => getPool().connect();
