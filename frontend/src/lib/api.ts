const fallbackBaseUrl = "http://localhost:5000";

export const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || fallbackBaseUrl;

export const apiUrl = (path: string) =>
  `${apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
