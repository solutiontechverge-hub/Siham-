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

/**
 * Catch-up: in_progress past end → completed ONLY when close-out rules are
 * already met (invoice due date / all payers paid). Clock alone must not force
 * Completed — incomplete checkout stays In Progress (timing out of sync is OK).
 *
 * Walk-out: after scheduled end + BOOKING_WALKOUT_GRACE_MINUTES without
 * checkout/payment, never auto-complete — stay in_progress for manual unpaid.
 *
 * Confirmed bookings are left alone so No Show remains available.
 * Paid/invoice transitions normally happen on checkout persist; this job only
 * heals lag.
 */
const runAutoCompleteCycle = async () => {
  if (running) return;
  running = true;
  try {
    const pastEnd = await query(
      `SELECT id, notes, end_time, booking_date
         FROM bookings
        WHERE status = 'in_progress'
          AND (
            (end_time IS NOT NULL AND end_time <= NOW())
            OR (end_time IS NULL AND booking_date < CURRENT_DATE)
          )`,
    );

    const eligibleIds = pastEnd.rows
      .filter((row) => {
        const meta = parseBookingNotesMeta(row.notes);
        if (isWalkOutBlockingAutoComplete(meta, row.end_time, row.booking_date)) {
          return false;
        }
        return isCheckoutCloseOutComplete(meta);
      })
      .map((row) => row.id);

    if (eligibleIds.length === 0) return;

    const result = await query(
      `WITH targets AS (
         SELECT id, status AS prev_status
           FROM bookings
          WHERE id = ANY($1::uuid[])
            AND status = 'in_progress'
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
      [eligibleIds],
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

    if (result.rows.length > 0) {
      console.log(`[booking-autocomplete] Marked ${result.rows.length} booking(s) as completed.`);
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
