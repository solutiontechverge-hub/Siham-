import "../bootstrap-env.js";
import pg from "pg";
import { getDatabaseConnectionString } from "./connectionString.js";

const { Pool, types } = pg;

// Keep Postgres DATE / timestamps as strings. Default Date parsing shifts
// wall-clock times across timezones (e.g. 09:00Z -> 14:00 local in UTC+5),
// which breaks busy/block matching for availability + createBooking.
types.setTypeParser(types.builtins.DATE, (value) => value);
types.setTypeParser(types.builtins.TIMESTAMP, (value) => value);
types.setTypeParser(types.builtins.TIMESTAMPTZ, (value) => value);

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
    max: Number(process.env.DB_POOL_MAX || 10),
    idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS || 30_000),
    connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT_MS || 15_000),
    allowExitOnIdle: false,
  });

  // Prevent transient Supabase/pooler drops from crashing the process via
  // unhandled Client "error" events.
  pool.on("error", (error) => {
    console.error("[db] Idle pool connection error:", error.message || error);
  });
  pool.on("connect", (client) => {
    client.on("error", (error) => {
      console.error("[db] Client connection error:", error.message || error);
    });
  });

  return pool;
}

export const query = (text, params) => getPool().query(text, params);
export const getClient = () => getPool().connect();
