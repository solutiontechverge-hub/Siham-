import { query } from "../db/index.js";
import { emitBookingChanged } from "../messaging/messagingSocket.js";
import { dispatchBookingUpdatedNotifications } from "../services/bookingNotification.service.js";
import { logScheduledBookingStatusActivity } from "../services/bookingActivity.service.js";

const DEFAULT_INTERVAL_MS = Number(process.env.BOOKING_AUTO_IN_PROGRESS_POLL_MS || 60 * 1000);

let intervalHandle = null;
let running = false;

/**
 * Promote confirmed bookings to in_progress once their scheduled window starts.
 * Skips pending edit requests and bookings whose window already ended (those
 * stay confirmed so the pro can still mark No Show).
 */
const runAutoInProgressCycle = async () => {
  if (running) return;
  running = true;
  try {
    const result = await query(
      `WITH targets AS (
         SELECT id, status AS prev_status
         FROM bookings
         WHERE status = 'confirmed'
           AND start_time IS NOT NULL
           AND start_time <= NOW()
           AND (end_time IS NULL OR end_time > NOW())
           AND COALESCE(edit_request->>'status', '') <> 'pending'
         FOR UPDATE
       ),
       updated AS (
         UPDATE bookings b
            SET status = 'in_progress',
                updated_at = NOW()
           FROM targets t
          WHERE b.id = t.id
         RETURNING b.*, t.prev_status
       )
       SELECT * FROM updated`,
    );

    for (const booking of result.rows) {
      await logScheduledBookingStatusActivity(booking);
      void dispatchBookingUpdatedNotifications(
        booking,
        booking.prev_status,
        booking.prepayment_status,
      );
      emitBookingChanged(booking, "updated");
    }

    if (result.rows.length > 0) {
      console.log(
        `[booking-auto-in-progress] Marked ${result.rows.length} booking(s) as in progress.`,
      );
    }
  } catch (error) {
    console.error(
      "[booking-auto-in-progress] Auto in-progress cycle failed:",
      error.message,
    );
  } finally {
    running = false;
  }
};

export const startBookingAutoInProgressJob = () => {
  if (process.env.DISABLE_BOOKING_AUTO_IN_PROGRESS_JOB === "1") {
    console.warn(
      "Booking auto in-progress job disabled (DISABLE_BOOKING_AUTO_IN_PROGRESS_JOB=1).",
    );
    return;
  }

  if (intervalHandle) return;

  void runAutoInProgressCycle();
  intervalHandle = setInterval(runAutoInProgressCycle, DEFAULT_INTERVAL_MS);
  console.log(
    `[booking-auto-in-progress] Started (every ${Math.round(DEFAULT_INTERVAL_MS / 1000)}s).`,
  );
};

export const stopBookingAutoInProgressJob = () => {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
};
