import { query } from "../db/index.js";
import { syncBookingToFinanceTransaction } from "../services/finance-sync.service.js";
import { emitBookingChanged } from "../messaging/messagingSocket.js";
import { dispatchBookingUpdatedNotifications } from "../services/bookingNotification.service.js";

const DEFAULT_INTERVAL_MS = Number(process.env.BOOKING_AUTOCOMPLETE_POLL_MS || 60 * 1000);

let intervalHandle = null;
let running = false;

/**
 * Transition in-progress bookings to completed once their service window has
 * passed. Uses end_time when available, otherwise falls back to the booking
 * date (completed once the booking date is before today).
 *
 * Confirmed bookings are intentionally left alone after the window ends so the
 * professional can still mark No Show (client booked but never arrived). Only
 * bookings that were started (in_progress) auto-complete.
 */
const runAutoCompleteCycle = async () => {
  if (running) return;
  running = true;
  try {
    const result = await query(
      `WITH targets AS (
         SELECT id, status AS prev_status
         FROM bookings
         WHERE status = 'in_progress'
           AND (
             (end_time IS NOT NULL AND end_time <= NOW())
             OR (end_time IS NULL AND booking_date < CURRENT_DATE)
           )
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
    );

    for (const booking of result.rows) {
      try {
        await syncBookingToFinanceTransaction(booking.id, {
          paymentMethod: booking.booking_type === "offline" ? "offlineDirect" : "onlineDirect",
        });
      } catch {
        // best-effort finance sync
      }
      // In-app + companion emails (client post-treatment / review; pro completed).
      void dispatchBookingUpdatedNotifications(booking, booking.prev_status, booking.prepayment_status);
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
    `[booking-autocomplete] Started (every ${Math.round(DEFAULT_INTERVAL_MS / 1000)}s).`,
  );
};

export const stopBookingAutoCompleteJob = () => {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
};
