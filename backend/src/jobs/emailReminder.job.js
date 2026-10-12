import { processInvoiceReminders } from "../services/financeEmail.service.js";
import {
  dispatchInvoiceScheduledReminderNotification,
  processPaymentDueReminders,
  processPaymentOverdueNotifications,
  processRespondRequestReminderNotifications,
} from "../services/bookingNotification.service.js";
import { processOverdueResponseStatusUpdates } from "../services/bookingResponseOverdue.service.js";
import {
  processAutomaticInvoiceReissues,
  processPrepaymentDueOverdueUpdates,
} from "../services/finance-sync.service.js";

const DEFAULT_INTERVAL_MS = Number(process.env.EMAIL_REMINDER_POLL_MS || 15 * 60 * 1000);

let intervalHandle = null;
let running = false;

const runReminderCycle = async () => {
  if (running) return;
  running = true;
  try {
    const [
      respondOutcomes,
      invoiceOutcomes,
      overdueCount,
      dueReminderCount,
      responseOverdueFlipped,
      prepaymentOverdueFlipped,
    ] = await Promise.all([
      processRespondRequestReminderNotifications(),
      processInvoiceReminders(),
      processPaymentOverdueNotifications(),
      processPaymentDueReminders(),
      processOverdueResponseStatusUpdates(),
      processPrepaymentDueOverdueUpdates(),
    ]);

    // After overdue status flips, apply Automatic first/second reissues from settings.
    const reissueOutcomes = await processAutomaticInvoiceReissues();

    for (const outcome of invoiceOutcomes) {
      if (!outcome?.sent || !outcome.reminder) continue;
      try {
        await dispatchInvoiceScheduledReminderNotification(
          outcome.transactionId,
          outcome.reminder,
        );
      } catch (error) {
        console.error(
          `[email-reminder] In-app reminder failed for ${outcome.transactionId}:`,
          error.message,
        );
      }
    }

    const sentCount =
      respondOutcomes.filter((item) => item.sent).length +
      invoiceOutcomes.filter((item) => item.sent).length +
      overdueCount +
      dueReminderCount +
      reissueOutcomes.filter((item) => item.applied).length +
      (Number(responseOverdueFlipped) || 0) +
      (Number(prepaymentOverdueFlipped) || 0);

    if (sentCount > 0) {
      console.log(`[email-reminder] Sent ${sentCount} reminder/reissue/overdue update(s).`);
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
