import { processDueSubscriptionRenewals } from "../services/subscription-lifecycle.service.js";

const DEFAULT_INTERVAL_MS = Number(
  process.env.SUBSCRIPTION_RENEWAL_POLL_MS || 60 * 60 * 1000,
);

let intervalHandle = null;
let running = false;

const runRenewalCycle = async () => {
  if (running) return;
  running = true;
  try {
    const outcomes = await processDueSubscriptionRenewals();
    if (outcomes.length > 0) {
      const deactivated = outcomes.filter((o) => o.nextStatus === "inactive").length;
      console.log(
        `[subscription-renewal] Processed ${outcomes.length} due row(s); ${deactivated} deactivated.`,
      );
    }
  } catch (error) {
    console.error("[subscription-renewal] Cycle failed:", error.message);
  } finally {
    running = false;
  }
};

export const startSubscriptionRenewalJob = () => {
  if (process.env.DISABLE_SUBSCRIPTION_RENEWAL_JOB === "1") {
    console.warn("Subscription renewal job disabled (DISABLE_SUBSCRIPTION_RENEWAL_JOB=1).");
    return;
  }

  if (intervalHandle) return;

  void runRenewalCycle();
  intervalHandle = setInterval(runRenewalCycle, DEFAULT_INTERVAL_MS);
  console.log(
    `[subscription-renewal] Started (every ${Math.round(DEFAULT_INTERVAL_MS / 60000)}m).`,
  );
};

export const stopSubscriptionRenewalJob = () => {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
};
