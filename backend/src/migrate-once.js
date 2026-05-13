import "./bootstrap-env.js";
import { runMigrations } from "./db/runMigrations.js";

await runMigrations();
console.log("Migrations finished.");
