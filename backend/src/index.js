import "./bootstrap-env.js";
import app from "./app.js";
import { query } from "./db/index.js";
import { runMigrations } from "./db/runMigrations.js";

const port = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await query("SELECT 1");
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
