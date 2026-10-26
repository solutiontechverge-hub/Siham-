import { query } from "../db/index.js";
import { syncBookingToFinanceTransaction } from "../services/finance-sync.service.js";
import { safeEnsureProfessionalClientFromBooking } from "../services/professional-clients.service.js";
import { emitBookingChanged } from "../messaging/messagingSocket.js";
import { dispatchBookingUpdatedNotifications } from "../services/bookingNotification.service.js";
import {
  BOOKING_WALKOUT_GRACE_MINUTES,
  isCheckoutCloseOutComplete,
  isWalkOutBlockingAutoComplete,
  parseBookingNotesMeta,
} from "./bookingAutoCompleteCloseOut.js";

const DEFAULT_INTERVAL_MS = Number(process.env.BOOKING_AUTOCOMPLETE_POLL_MS || 60 * 1000);

let intervalHandle = null;
let running = false;

const PAST_END_SQL = `(
  (end_time IS NOT NULL AND end_time <= NOW())
  OR (end_time IS NULL AND booking_date < CURRENT_DATE)
)`;

/**
 * Catch-up past scheduled end → completed.
 *
 * confirmed: time-only (No Show must be marked before end; after end we complete).
 * in_progress: only when close-out rules are met (every billed payer paid, not
 * waiting for payment). Clock alone must not force Completed — incomplete
 * checkout / invoice pending stays In Progress.
 *
 * Walk-out: after scheduled end + BOOKING_WALKOUT_GRACE_MINUTES without
 * checkout/payment, never auto-complete — stay in_progress for manual unpaid.
 * Intentional invoice / payment-pending is not treated as a walk-out.
 *
 * Paid transitions normally happen on checkout persist; this job heals lag.
 */
const completeBookingsByIds = async (eligibleIds, allowedStatuses) => {
  if (eligibleIds.length === 0) return 0;

  const result = await query(
    `WITH targets AS (
       SELECT id, status AS prev_status
         FROM bookings
        WHERE id = ANY($1::uuid[])
          AND status = ANY($2::text[])
        FOR UPDATE
     ),
     updated AS (
       UPDATE bookings b
          SET status = 'completed',
              updated_at = NOW()
         FROM targets t
        WHERE b.id = t.id
       RETURNING b.*, t.prev_status
     )
     SELECT * FROM updated`,
    [eligibleIds, allowedStatuses],
  );

  for (const booking of result.rows) {
    try {
      await syncBookingToFinanceTransaction(booking.id, {
        paymentMethod: booking.booking_type === "offline" ? "offlineDirect" : "onlineDirect",
      });
    } catch {
      // best-effort finance sync
    }
    await safeEnsureProfessionalClientFromBooking(booking.id);
    void dispatchBookingUpdatedNotifications(
      booking,
      booking.prev_status,
      booking.prepayment_status,
    );
    emitBookingChanged(booking, "updated");
  }

  return result.rows.length;
};

const runAutoCompleteCycle = async () => {
  if (running) return;
  running = true;
  try {
    // ponytail: confirmed → completed on clock; No Show window = before end only
    const confirmedPast = await query(
      `SELECT id
         FROM bookings
        WHERE status = 'confirmed'
          AND ${PAST_END_SQL}
          AND COALESCE(edit_request->>'status', '') <> 'pending'`,
    );

    const inProgressPast = await query(
      `SELECT id, notes, end_time, booking_date
         FROM bookings
        WHERE status = 'in_progress'
          AND ${PAST_END_SQL}`,
    );

    const inProgressIds = inProgressPast.rows
      .filter((row) => {
        const meta = parseBookingNotesMeta(row.notes);
        if (isWalkOutBlockingAutoComplete(meta, row.end_time, row.booking_date)) {
          return false;
        }
        return isCheckoutCloseOutComplete(meta);
      })
      .map((row) => row.id);

    const confirmedCount = await completeBookingsByIds(
      confirmedPast.rows.map((row) => row.id),
      ["confirmed"],
    );
    const inProgressCount = await completeBookingsByIds(inProgressIds, ["in_progress"]);
    const total = confirmedCount + inProgressCount;

    if (total > 0) {
      console.log(
        `[booking-autocomplete] Marked ${total} booking(s) as completed (${confirmedCount} confirmed, ${inProgressCount} in_progress).`,
      );
    }
  } catch (error) {
    console.error("[booking-autocomplete] Auto-complete cycle failed:", error.message);
  } finally {
    running = false;
  }
};

export const startBookingAutoCompleteJob = () => {
  if (process.env.DISABLE_BOOKING_AUTOCOMPLETE_JOB === "1") {
    console.warn("Booking auto-complete job disabled (DISABLE_BOOKING_AUTOCOMPLETE_JOB=1).");
    return;
  }

  if (intervalHandle) return;

  void runAutoCompleteCycle();
  intervalHandle = setInterval(runAutoCompleteCycle, DEFAULT_INTERVAL_MS);
  console.log(
    `[booking-autocomplete] Started (every ${Math.round(DEFAULT_INTERVAL_MS / 1000)}s; walk-out grace ${BOOKING_WALKOUT_GRACE_MINUTES}m).`,
  );
};

export const stopBookingAutoCompleteJob = () => {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
};
