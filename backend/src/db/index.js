import "../bootstrap-env.js";
import pg from "pg";
import { getDatabaseConnectionString } from "./connectionString.js";

const { Pool } = pg;

let pool;

function getPool() {
  if (pool) {
    return pool;
  }

  const connectionString = getDatabaseConnectionString();

  if (!connectionString) {
    throw new Error(
      "Database URL missing: set DATABASE_URL or DB_URL, or PGHOST/PGUSER/PGDATABASE (and PGPASSWORD if needed).",
    );
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
