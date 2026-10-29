/**
 * Default browser API origin when NEXT_PUBLIC_API_BASE_URL is unset (no trailing slash).
 * Use 127.0.0.1 — not localhost — so Windows clients that prefer ::1 don't get
 * ECONNREFUSED (Express binds 0.0.0.0 / IPv4 only). Matches INTERNAL_API_ORIGIN.
 * Production fullstack: set NEXT_PUBLIC_API_BASE_URL to the public web origin so /api
 * is same-origin; next.config.js rewrites /api → INTERNAL_API_ORIGIN.
 * Email verify deep-links use backend FRONTEND_URL (same live web host + /auth/verify-email).
 */
export const LIVE_API_BASE_URL = "http://127.0.0.1:5000";
