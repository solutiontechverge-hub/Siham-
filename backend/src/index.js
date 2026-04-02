import dotenv from "dotenv";
import app from "./app.js";
import { pool } from "./db/index.js";

dotenv.config();

const port = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await pool.query("SELECT 1");

    app.listen(port, () => {
      console.log(`Backend running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
