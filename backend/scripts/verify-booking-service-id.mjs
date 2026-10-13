import "dotenv/config";
import { query } from "../src/db/index.js";

const cols = await query(`
  SELECT is_nullable
  FROM information_schema.columns
  WHERE table_name = 'bookings' AND column_name = 'service_id'
`);
console.log("is_nullable:", cols.rows[0]?.is_nullable);

const fks = await query(`
  SELECT rc.delete_rule
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.referential_constraints rc ON rc.constraint_name = tc.constraint_name
  WHERE tc.table_name = 'bookings'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'service_id'
`);
console.log("delete_rule:", fks.rows[0]?.delete_rule);

const nulls = await query(`
  SELECT COUNT(*)::int AS null_count FROM bookings WHERE service_id IS NULL
`);
console.log("null_count:", nulls.rows[0]?.null_count);

const links = await query(`
  SELECT COUNT(*)::int AS bookings_without_links
  FROM bookings b
  WHERE NOT EXISTS (
    SELECT 1 FROM booking_service_links l WHERE l.booking_id = b.id
  )
`);
console.log("bookings_without_links:", links.rows[0]?.bookings_without_links);

// Attempt insert without service_id — must fail
const setup = await query(`SELECT id FROM business_setups LIMIT 1`);
const customer = await query(`SELECT id FROM users LIMIT 1`);
let rejected = false;
let rejectMsg = "";
try {
  await query(
    `INSERT INTO bookings (
       booking_date, business_setup_id, customer_id, service_id,
       status, booking_type, unique_code, total_price
     ) VALUES (
       CURRENT_DATE, $1, $2, NULL,
       'requested', 'online', $3, 0
     )`,
    [
      setup.rows[0].id,
      customer.rows[0].id,
      `VERIFY-NO-SERVICE-${Date.now()}`,
    ],
  );
} catch (error) {
  rejected = true;
  rejectMsg = error.message;
}
console.log("null_insert_rejected:", rejected);
console.log("null_insert_error:", rejectMsg);

process.exit(rejected && cols.rows[0]?.is_nullable === "NO" ? 0 : 1);
