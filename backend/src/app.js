import "./bootstrap-env.js";
import path from "path";
import cors from "cors";
import express from "express";
import { fileURLToPath } from "url";
import { getUploadsDir } from "./config/uploads-dir.js";
import { query } from "./db/index.js";
import adminRoutes from "./routes/admin.routes.js";
import authRoutes from "./routes/auth.routes.js";
import businessRoutes from "./routes/business.routes.js";
import businessSetupsRoutes from "./routes/business-setups.routes.js";
import financeRoutes from "./routes/finance.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import messagingRoutes from "./routes/messaging.routes.js";
import notificationsRoutes from "./routes/notifications.routes.js";
import userRoutes from "./routes/user.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import { handleStripeWebhook } from "./controllers/stripeWebhook.controller.js";
import { logError, clientErrorMessage, clientErrorStatus } from "./utils/httpError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const uploadsDir = getUploadsDir();

app.use(cors());
// Stripe webhooks need the raw body for signature verification — before json parser.
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook,
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(
  "/uploads",
  (_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
    next();
  },
  express.static(uploadsDir, {
    setHeaders(res, filePath) {
      res.setHeader("X-Content-Type-Options", "nosniff");
      // Force download for non-images so browsers won't execute spoofed HTML/JS.
      const lower = String(filePath).toLowerCase();
      if (!/\.(jpe?g|png|gif|webp|heic|heif)$/i.test(lower)) {
        res.setHeader("Content-Disposition", "attachment");
      }
    },
  }),
);

// Railway and other platforms often probe `/` — must return 2xx before routes that need DB.
app.get("/", (_req, res) => {
  res.status(200).type("text/plain").send("ok");
});

app.get("/api/health", async (_req, res) => {
  try {
    await query("SELECT 1");
    return res.status(200).json({ status: "ok", database: "connected" });
  } catch (error) {
    logError("/api/health", error);
    return res.status(503).json({
      status: "degraded",
      database: "unavailable",
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/business-setups", businessSetupsRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/messaging", messagingRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reviews", reviewRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found.",
    data: null,
  });
});

app.use((error, _req, res, _next) => {
  logError("express", error);
  res.status(clientErrorStatus(error, 500)).json({
    success: false,
    message: clientErrorMessage(error, "Internal server error."),
    data: null,
  });
});

export default app;
