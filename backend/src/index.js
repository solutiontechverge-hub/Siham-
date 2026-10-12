import "./bootstrap-env.js";
import http from "http";
import app from "./app.js";
import { query } from "./db/index.js";
import { runMigrations } from "./db/runMigrations.js";
import { attachMessagingSocket } from "./messaging/messagingSocket.js";
import { startBookingReminderJob } from "./jobs/bookingReminder.job.js";
import { startBookingAutoInProgressJob } from "./jobs/bookingAutoInProgress.job.js";
import { startBookingAutoCompleteJob } from "./jobs/bookingAutoComplete.job.js";
import { startEmailReminderJob } from "./jobs/emailReminder.job.js";
import { startMessagingRetentionJob } from "./jobs/messagingRetention.job.js";
import { startSubscriptionRenewalJob } from "./jobs/subscriptionRenewal.job.js";
import { initEmailTransport } from "./helpers/email.helper.js";

const port = Number(process.env.PORT) || 5000;
// Required for Railway, Docker, and most PaaS — bind all interfaces, not loopback-only.
const host = process.env.HOST || "0.0.0.0";

const onRailway = Boolean(process.env.RAILWAY_PROJECT_ID);
const skipMigrations =
  process.env.SKIP_MIGRATIONS_ON_START === "1" ||
  process.env.SKIP_MIGRATIONS_ON_START === "true" ||
  onRailway;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Local/watch: keep retrying (0) so a brief Supabase drop doesn't exit and sit dead.
// Production/Railway: fail after a few attempts so bad DATABASE_URL doesn't hang deploy.
const waitForDatabase = async () => {
  const attempts = Number(
    process.env.DB_STARTUP_ATTEMPTS || (onRailway || process.env.NODE_ENV === "production" ? 5 : 0),
  );
  let lastError;
  for (let attempt = 1; ; attempt += 1) {
    try {
      await query("SELECT 1");
      if (attempt > 1) {
        console.log(`[db] Connected after ${attempt} attempts`);
      }
      return;
    } catch (error) {
      lastError = error;
      const message = error?.message || String(error);
      const budget = attempts > 0 ? `/${attempts}` : "";
      console.warn(`[db] Startup check failed (attempt ${attempt}${budget}): ${message}`);
      if (attempts > 0 && attempt >= attempts) {
        throw lastError;
      }
      await sleep(Math.min(1500 * attempt, 10_000));
    }
  }
};

const startServer = async () => {
  try {
    await waitForDatabase();
    if (!skipMigrations) {
      await runMigrations();
    } else if (onRailway) {
      console.warn(
        "Skipping migrations on boot (Railway). They should run via preDeployCommand: npm run migrate.",
      );
    } else {
      console.warn("SKIP_MIGRATIONS_ON_START set: skipping SQL migrations on boot.");
    }

    await initEmailTransport();

    const server = http.createServer(app);
    attachMessagingSocket(server);

    server.on("error", (error) => {
      console.error("Failed to start server:", error?.message || error);
      process.exit(1);
    });

    server.listen(port, host, () => {
      console.log(`Backend listening on http://${host}:${port}`);
      startBookingReminderJob();
      startBookingAutoInProgressJob();
      startBookingAutoCompleteJob();
      startEmailReminderJob();
      startMessagingRetentionJob();
      startSubscriptionRenewalJob();
    });
  } catch (error) {
    console.error("Failed to start server:", error?.message || error);
    process.exit(1);
  }
};

startServer();
