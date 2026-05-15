import "./bootstrap-env.js";
import { getDatabaseConnectionString } from "./db/connectionString.js";
import { runMigrations } from "./db/runMigrations.js";

const skipMigrations = ["1", "true", "yes"].includes(
  String(process.env.SKIP_DB_MIGRATIONS || "").toLowerCase(),
);

if (!getDatabaseConnectionString()) {
  if (skipMigrations) {
    console.warn(
      "[migrate] No database URL resolved. SKIP_DB_MIGRATIONS is set; skipping migrations.",
    );
    process.exit(0);
  }

  console.error(`[migrate] No PostgreSQL connection string found.

Railway fix (recommended):
  1. In your Railway project, add a PostgreSQL database (New → Database → PostgreSQL).
  2. Open your backend service → Variables → add a reference to the Postgres plugin's DATABASE_URL,
     or use "Connect" / service linking so DATABASE_URL is injected automatically.

Local: set DATABASE_URL or DB_URL in backend/.env (see backend/.env.example).

Emergency only (skips schema updates): set SKIP_DB_MIGRATIONS=1 on the service, then redeploy.
`);
  process.exit(1);
}

await runMigrations();
console.log("Migrations finished.");
