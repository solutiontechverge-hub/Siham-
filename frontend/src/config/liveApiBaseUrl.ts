/**
 * Default browser API origin when NEXT_PUBLIC_API_BASE_URL is unset (no trailing slash).
 * Local Express for dev. Production fullstack: set NEXT_PUBLIC_API_BASE_URL to the public
 * web origin (https://web--mollure-backend--sc4tt92szkkg.code.run) so /api is same-origin;
 * next.config.js rewrites /api → INTERNAL_API_ORIGIN (default http://127.0.0.1:5000).
 * Email verify deep-links use backend FRONTEND_URL (same live web host + /auth/verify-email).
 */
export const LIVE_API_BASE_URL = "http://localhost:5000";
