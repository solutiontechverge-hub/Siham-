import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { getClient } from "./index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sqlDir = path.resolve(__dirname, "../../sql");

const ensureMigrationsTable = async (client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id BIGSERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
};

const getSqlFiles = async () => {
  const entries = await fs.readdir(sqlDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".sql"))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
};

export const runMigrations = async () => {
  const client = await getClient();

  try {
    await ensureMigrationsTable(client);

    const files = await getSqlFiles();

    for (const filename of files) {
      const alreadyRan = await client.query(
        "SELECT 1 FROM schema_migrations WHERE filename = $1",
        [filename],
      );

      if (alreadyRan.rowCount > 0) {
        continue;
      }

      const filePath = path.join(sqlDir, filename);
      const sql = await fs.readFile(filePath, "utf8");

      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(
          "INSERT INTO schema_migrations (filename) VALUES ($1)",
          [filename],
        );
        await client.query("COMMIT");
        console.log(`Migration applied: ${filename}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw new Error(`Migration failed for ${filename}: ${error.message}`);
      }
    }
  } finally {
    client.release();
  }
};
