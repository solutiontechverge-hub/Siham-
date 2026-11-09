import "../src/bootstrap-env.js";
import { query } from "../src/db/index.js";

const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
  console.error("Usage: node --env-file=.env scripts/verify-user-by-email.mjs <email>");
  process.exit(1);
}

const userResult = await query(
  `SELECT id, email, is_email_verified
   FROM users
   WHERE email = $1`,
  [email],
);

if (userResult.rowCount === 0) {
  console.error(`No user found for ${email}`);
  process.exit(1);
}

const user = userResult.rows[0];

if (user.is_email_verified) {
  console.log(`Already verified: ${email} (id ${user.id})`);
  process.exit(0);
}

await query(
  `UPDATE users
   SET is_email_verified = true, updated_at = NOW()
   WHERE id = $1`,
  [user.id],
);

await query(
  `UPDATE email_verifications
   SET is_used = true
   WHERE user_id = $1 AND is_used = false`,
  [user.id],
);

console.log(`Verified: ${email} (id ${user.id})`);
