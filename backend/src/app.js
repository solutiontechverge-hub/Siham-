import fs from "fs";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";

dotenv.config();

const app = express();
fs.mkdirSync(path.resolve("uploads"), { recursive: true });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.resolve("uploads")));

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running.",
    data: null,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

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
