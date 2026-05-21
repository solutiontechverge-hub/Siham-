import { LIVE_API_BASE_URL } from "../config/liveApiBaseUrl";

export const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || LIVE_API_BASE_URL;

export const apiUrl = (path: string) =>
  `${apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
