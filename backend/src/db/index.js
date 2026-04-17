import dotenv from "dotenv";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

const { Pool } = pg;
const connectionString = process.env.DB_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DB_URL is required.");
}

export const pool = new Pool({
  connectionString,
});

export const query = (text, params) => pool.query(text, params);
export const getClient = () => pool.connect();
