import { LIVE_API_BASE_URL } from "../config/liveApiBaseUrl";
import { useBackendProxy } from "./backendProxyTarget";

/** Proxy mode: calls go to /api on this app, forwarded to the live backend. */
export const apiBaseUrl = useBackendProxy
  ? ""
  : (process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || LIVE_API_BASE_URL);

export const apiUrl = (path: string) =>
  `${apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
