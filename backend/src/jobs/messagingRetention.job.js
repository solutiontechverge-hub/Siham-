import { purgeExpiredMessages } from "../messaging/messaging.repository.js";
import { MESSAGE_RETENTION_DAYS } from "../messaging/messaging.constants.js";

const DEFAULT_INTERVAL_MS = Number(process.env.MESSAGING_PURGE_POLL_MS || 24 * 60 * 60 * 1000);

let intervalHandle = null;

const runPurge = async () => {
  try {
    await purgeExpiredMessages();
  } catch (error) {
    console.error("[messaging-retention] Failed to purge old messages:", error.message);
  }
};

export const startMessagingRetentionJob = () => {
  if (process.env.DISABLE_MESSAGING_RETENTION_JOB === "1") {
    console.warn("Messaging retention job disabled (DISABLE_MESSAGING_RETENTION_JOB=1).");
    return;
  }

  if (intervalHandle) return;

  void runPurge();
  intervalHandle = setInterval(runPurge, DEFAULT_INTERVAL_MS);
  console.log(
    `[messaging-retention] Keeping messages for ${MESSAGE_RETENTION_DAYS} days (purge every ${Math.round(DEFAULT_INTERVAL_MS / 3600000)}h).`,
  );
};

export const stopMessagingRetentionJob = () => {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
};
