import "./bootstrap-env.js";
import http from "http";
import app from "./app.js";
import { query } from "./db/index.js";
import { runMigrations } from "./db/runMigrations.js";
import { attachMessagingSocket } from "./messaging/messagingSocket.js";
import { startBookingReminderJob } from "./jobs/bookingReminder.job.js";
import { startEmailReminderJob } from "./jobs/emailReminder.job.js";
import { startMessagingRetentionJob } from "./jobs/messagingRetention.job.js";
import { initEmailTransport } from "./helpers/email.helper.js";

const port = Number(process.env.PORT) || 5000;
// Required for Railway, Docker, and most PaaS — bind all interfaces, not loopback-only.
const host = process.env.HOST || "0.0.0.0";

const onRailway = Boolean(process.env.RAILWAY_PROJECT_ID);
const skipMigrations =
  process.env.SKIP_MIGRATIONS_ON_START === "1" ||
  process.env.SKIP_MIGRATIONS_ON_START === "true" ||
  onRailway;

const startServer = async () => {
  try {
    await query("SELECT 1");
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

    server.listen(port, host, () => {
      console.log(`Backend listening on http://${host}:${port}`);
      startBookingReminderJob();
      startEmailReminderJob();
      startMessagingRetentionJob();
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
