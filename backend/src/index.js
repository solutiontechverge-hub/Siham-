import dotenv from "dotenv";
import app from "./app.js";
import { pool } from "./db/index.js";
import { runMigrations } from "./db/runMigrations.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

const port = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await pool.query("SELECT 1");
        await runMigrations();


    app.listen(port, () => {
      console.log(`Backend running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
