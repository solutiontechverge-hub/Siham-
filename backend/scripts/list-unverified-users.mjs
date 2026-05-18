import "../src/bootstrap-env.js";
import { query } from "../src/db/index.js";

const pattern = process.argv[2] || "%";

const result = await query(
  `SELECT id, email, user_type, is_email_verified, created_at
   FROM users
   WHERE email ILIKE $1
   ORDER BY id DESC
   LIMIT 30`,
  [pattern],
);

console.table(result.rows);
