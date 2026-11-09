import "../src/bootstrap-env.js";
import { query } from "../src/db/index.js";

const result = await query(
  `UPDATE users
   SET is_email_verified = true, updated_at = NOW()
   WHERE is_email_verified = false
   RETURNING id, email, user_type`,
);

console.log(`Verified ${result.rowCount} user(s):`);
console.table(result.rows);
