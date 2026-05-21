import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import "../bootstrap-env.js";
import { getDatabaseConnectionString } from "../db/connectionString.js";
import { getClient } from "../db/index.js";

const SEED_FILENAME = "2026-05-21_seed_users_and_catalog.sql";
const SEED_EMAILS = ["pro@mollure.dev", "client@mollure.dev", "company@mollure.dev"];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const seedSqlPath = path.resolve(__dirname, "../../sql", SEED_FILENAME);

if (!getDatabaseConnectionString()) {
  console.error("DATABASE_URL or DB_URL is required in backend/.env");
  process.exit(1);
}

const client = await getClient();

try {
  await client.query("BEGIN");

  await client.query(
    `DELETE FROM bookings
     WHERE customer_id IN (SELECT id FROM users WHERE email = ANY($1::text[]))
        OR business_setup_id IN (
          SELECT bs.id
          FROM business_setups bs
          INNER JOIN professional_profiles pp ON pp.id = bs.professional_profile_id
          INNER JOIN users u ON u.id = pp.user_id
          WHERE u.email = ANY($1::text[])
        )`,
    [SEED_EMAILS],
  );

  await client.query(
    `DELETE FROM calendar_entries
     WHERE professional_profile_id IN (
       SELECT pp.id
       FROM professional_profiles pp
       INNER JOIN users u ON u.id = pp.user_id
       WHERE u.email = ANY($1::text[])
     )`,
    [SEED_EMAILS],
  );

  await client.query(
    `DELETE FROM calendar_settings
     WHERE professional_profile_id IN (
       SELECT pp.id
       FROM professional_profiles pp
       INNER JOIN users u ON u.id = pp.user_id
       WHERE u.email = ANY($1::text[])
     )`,
    [SEED_EMAILS],
  );

  const deletedUsers = await client.query(
    `DELETE FROM users WHERE email = ANY($1::text[]) RETURNING email`,
    [SEED_EMAILS],
  );

  await client.query("DELETE FROM schema_migrations WHERE filename = $1", [SEED_FILENAME]);

  const seedSql = await fs.readFile(seedSqlPath, "utf8");
  await client.query(seedSql);

  await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [SEED_FILENAME]);

  await client.query("COMMIT");

  console.log("Dev seed reset complete.");
  console.log(`Removed ${deletedUsers.rowCount} seed user(s); re-inserted with new auto-generated UUIDs.`);
  console.log("Password for all: Password123!");
  console.log("Emails:", SEED_EMAILS.join(", "));
} catch (error) {
  await client.query("ROLLBACK");
  console.error("Seed reset failed:", error.message);
  process.exit(1);
} finally {
  client.release();
  process.exit(0);
}
