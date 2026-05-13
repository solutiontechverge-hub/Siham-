import "./bootstrap-env.js";
import path from "path";
import cors from "cors";
import express from "express";
import { fileURLToPath } from "url";
import { getUploadsDir } from "./config/uploads-dir.js";
import authRoutes from "./routes/auth.routes.js";
import businessRoutes from "./routes/business.routes.js";
import userRoutes from "./routes/user.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const uploadsDir = getUploadsDir();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadsDir));

// Railway and other platforms often probe `/` — must return 2xx before routes that need DB.
app.get("/", (_req, res) => {
  res.status(200).type("text/plain").send("ok");
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running.",
    data: null,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/business", businessRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found.",
    data: null,
  });
});

app.use((error, _req, res, _next) => {
  const statusCode =
    error.code === "LIMIT_FILE_SIZE" || error.message?.includes("allowed") ? 400 : 500;

  res.status(statusCode).json({
    success: false,
    message: error.message || "Internal server error.",
    data: null,
  });
});

export default app;
