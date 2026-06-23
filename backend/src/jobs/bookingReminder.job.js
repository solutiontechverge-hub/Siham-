import { processAppointmentReminders } from "../services/bookingEmail.service.js";

const DEFAULT_INTERVAL_MS = Number(process.env.BOOKING_REMINDER_POLL_MS || 5 * 60 * 1000);

let intervalHandle = null;
let running = false;

const runReminderCycle = async () => {
  if (running) return;
  running = true;
  try {
    const outcomes = await processAppointmentReminders();
    const sentCount = outcomes.filter((item) => item.sent).length;
    if (sentCount > 0) {
      console.log(`[booking-reminder] Sent ${sentCount} appointment reminder email(s).`);
    }
  } catch (error) {
    console.error("[booking-reminder] Reminder cycle failed:", error.message);
  } finally {
    running = false;
  }
};

export const startBookingReminderJob = () => {
  if (process.env.DISABLE_BOOKING_REMINDER_JOB === "1") {
    console.warn("Booking reminder job disabled (DISABLE_BOOKING_REMINDER_JOB=1).");
    return;
  }

  if (intervalHandle) return;

  void runReminderCycle();
  intervalHandle = setInterval(runReminderCycle, DEFAULT_INTERVAL_MS);
  console.log(
    `[booking-reminder] Started (every ${Math.round(DEFAULT_INTERVAL_MS / 1000)}s, ${process.env.BOOKING_REMINDER_HOURS_BEFORE || 2}h before booking).`,
  );
};

export const stopBookingReminderJob = () => {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
};
