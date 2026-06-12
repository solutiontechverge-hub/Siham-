import { LIVE_API_BASE_URL } from "../config/liveUrls";

export const backendProxyTarget =
  process.env.NEXT_PUBLIC_API_PROXY_TARGET?.replace(/\/$/, "") ||
  LIVE_API_BASE_URL;

export const useBackendProxy =
  process.env.NEXT_PUBLIC_API_USE_PROXY === "true";
