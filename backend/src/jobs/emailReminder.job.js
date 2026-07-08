import { processInvoiceReminders } from "../services/financeEmail.service.js";
import { processRespondToRequestReminders } from "../services/bookingEmail.service.js";

const DEFAULT_INTERVAL_MS = Number(process.env.EMAIL_REMINDER_POLL_MS || 15 * 60 * 1000);

let intervalHandle = null;
let running = false;

const runReminderCycle = async () => {
  if (running) return;
  running = true;
  try {
    const [respondOutcomes, invoiceOutcomes] = await Promise.all([
      processRespondToRequestReminders(),
      processInvoiceReminders(),
    ]);

    const sentCount =
      respondOutcomes.filter((item) => item.sent).length +
      invoiceOutcomes.filter((item) => item.sent).length;

    if (sentCount > 0) {
      console.log(`[email-reminder] Sent ${sentCount} reminder email(s).`);
    }
  } catch (error) {
    console.error("[email-reminder] Reminder cycle failed:", error.message);
  } finally {
    running = false;
  }
};

export const startEmailReminderJob = () => {
  if (process.env.DISABLE_EMAIL_REMINDER_JOB === "1") {
    console.warn("Email reminder job disabled (DISABLE_EMAIL_REMINDER_JOB=1).");
    return;
  }

  if (intervalHandle) return;

  void runReminderCycle();
  intervalHandle = setInterval(runReminderCycle, DEFAULT_INTERVAL_MS);
  console.log(`[email-reminder] Started (every ${Math.round(DEFAULT_INTERVAL_MS / 1000)}s).`);
};

export const stopEmailReminderJob = () => {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
};
