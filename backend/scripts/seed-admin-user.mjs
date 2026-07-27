import dotenv from "dotenv";
import bcrypt from "bcrypt";
import pg from "pg";

dotenv.config();

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL || process.env.DB_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

// Allow user_type = 'admin' on users table
const constraints = await client.query(`
  SELECT conname
  FROM pg_constraint
  WHERE conrelid = 'users'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%user_type%'
`);

for (const row of constraints.rows) {
  await client.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS ${row.conname}`);
}

await client.query(`
  ALTER TABLE users
  ADD CONSTRAINT users_user_type_check
  CHECK (user_type IN ('individual', 'company', 'professional', 'admin'))
`);

const hash = await bcrypt.hash("Admin@123", 10);

const result = await client.query(
  `
  INSERT INTO users (user_type, email, password_hash, is_email_verified, is_active)
  VALUES ('admin', 'admin@molur.com', $1, true, true)
  ON CONFLICT (email) DO UPDATE SET
    user_type = 'admin',
    password_hash = EXCLUDED.password_hash,
    is_email_verified = true,
    is_active = true,
    updated_at = NOW()
  RETURNING id, email, user_type, is_active
  `,
  [hash],
);

console.log("users_admin:", result.rows[0]);
await client.end();
