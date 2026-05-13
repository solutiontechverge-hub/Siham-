/**
 * Vercel serverless entry: default export must be the Express app (no app.listen).
 * In Vercel: set project Root Directory to `backend`.
 */
import app from "../src/app.js";

export default app;
