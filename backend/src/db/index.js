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
    idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS || 30_000),
    connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT_MS || 10_000),
  });

  pool.on("error", (error) => {
    console.error("[db] Idle pool connection error:", error.message || error);
  });

  return pool;
}

export const query = (text, params) => getPool().query(text, params);
export const getClient = () => getPool().connect();
