/**
 * Default API origin when NEXT_PUBLIC_API_BASE_URL is unset (no trailing slash).
 * Development uses local backend; production uses deployed API.
 */
export const LIVE_API_BASE_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:5000"
    : "https://mollure-frontend-backend-sw9l.vercel.app";
