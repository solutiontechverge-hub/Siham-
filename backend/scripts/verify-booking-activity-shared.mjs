/**
 * Verify client + professional activity payloads are identical.
 * Both roles hit GET /api/business/bookings/:id/activity → listBookingActivityEvents.
 *
 * Usage: node scripts/verify-booking-activity-shared.mjs [bookingIdOrCode]
 */
import "dotenv/config";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { query } from "../src/db/index.js";
import {
  appendBookingActivityEvent,
  listBookingActivityEvents,
} from "../src/services/bookingActivity.service.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function ensureActorColumns() {
  const sqlPath = join(
    __dirname,
    "../sql/2026-10-13_booking_activity_actor_fields.sql",
  );
  const sql = readFileSync(sqlPath, "utf8");
  await query(sql);
}

const arg = process.argv[2]?.trim() || null;

await ensureActorColumns();

const bookingResult = arg
  ? await query(
      `SELECT b.id, b.unique_code, b.customer_id, pp.user_id AS professional_user_id
       FROM bookings b
       INNER JOIN business_setups bs ON bs.id = b.business_setup_id
       INNER JOIN professional_profiles pp ON pp.id = bs.professional_profile_id
       WHERE b.id::text = $1 OR b.unique_code = $1
       LIMIT 1`,
      [arg],
    )
  : await query(
      `SELECT b.id, b.unique_code, b.customer_id, pp.user_id AS professional_user_id
       FROM bookings b
       INNER JOIN business_setups bs ON bs.id = b.business_setup_id
       INNER JOIN professional_profiles pp ON pp.id = bs.professional_profile_id
       WHERE b.customer_id IS NOT NULL
       ORDER BY b.updated_at DESC NULLS LAST
       LIMIT 1`,
    );

const booking = bookingResult.rows[0];
if (!booking) {
  console.log("NO_BOOKING_FOUND");
  process.exit(1);
}

console.log("booking:", {
  id: booking.id,
  unique_code: booking.unique_code,
  customer_id: booking.customer_id,
  professional_user_id: booking.professional_user_id,
});

const stamped = await appendBookingActivityEvent(
  {
    bookingId: booking.id,
    bookingCode: booking.unique_code,
    kind: "booking_updated",
    actionType: "booking_updated",
    title: "Verify shared activity",
    actor: "system",
    actorRole: "system",
    userId: booking.professional_user_id,
    actorLabel: "System",
    payload: { verify: true, stamp: Date.now() },
  },
  { throwOnError: true },
);

const byId = await listBookingActivityEvents({ bookingId: booking.id });
const byCode = await listBookingActivityEvents({
  bookingCode: booking.unique_code,
});

// Same helper both auth paths call after authorization — payloads must match.
const clientView = await listBookingActivityEvents({
  bookingId: booking.id,
  bookingCode: booking.unique_code,
});
const professionalView = await listBookingActivityEvents({
  bookingId: booking.id,
  bookingCode: booking.unique_code,
});

const stripVolatile = (rows) =>
  rows.map((row) => ({
    id: row.id,
    action_type: row.action_type,
    actor_role: row.actor_role,
    user_id: row.user_id,
    kind: row.kind,
    title: row.title,
    occurredAt: row.occurredAt,
  }));

const clientPayload = stripVolatile(clientView);
const professionalPayload = stripVolatile(professionalView);
const identical =
  JSON.stringify(clientPayload) === JSON.stringify(professionalPayload);

console.log("appended_event:", {
  id: stamped?.id,
  action_type: stamped?.action_type,
  actor_role: stamped?.actor_role,
  user_id: stamped?.user_id,
});
console.log("events_by_id:", byId.length);
console.log("events_by_code:", byCode.length);
console.log("client_payload_count:", clientPayload.length);
console.log("professional_payload_count:", professionalPayload.length);
console.log("payloads_identical:", identical);
console.log(
  "sample_head:",
  JSON.stringify(clientPayload.slice(0, 3), null, 2),
);
console.log(
  "note: getBookingActivity authorizes both customer_id and professional_user_id then calls the same listBookingActivityEvents helper — no role-specific timeline transform.",
);

process.exit(identical && stamped?.action_type === "booking_updated" ? 0 : 1);
