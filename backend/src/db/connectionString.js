/**
 * Resolves Postgres URL from env. Supports explicit URLs and discrete PG vars
 * (common when platforms inject PGHOST/PGUSER/... without DATABASE_URL).
 */
export function getDatabaseConnectionString() {
  const explicit = process.env.DB_URL || process.env.DATABASE_URL;
  if (explicit && String(explicit).trim()) {
    return String(explicit).trim();
  }

  const host = process.env.PGHOST || process.env.POSTGRES_HOST;
  const user = process.env.PGUSER || process.env.POSTGRES_USER;
  const password = process.env.PGPASSWORD ?? process.env.POSTGRES_PASSWORD ?? "";
  const database = process.env.PGDATABASE || process.env.POSTGRES_DB;
  const port = process.env.PGPORT || process.env.POSTGRES_PORT || "5432";

  if (!host || !user || !database) {
    return null;
  }

  const auth =
    password === ""
      ? `${encodeURIComponent(user)}`
      : `${encodeURIComponent(user)}:${encodeURIComponent(password)}`;

  return `postgresql://${auth}@${host}:${port}/${encodeURIComponent(database)}`;
}
