import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

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
