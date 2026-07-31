import { apiBaseUrl, apiUrl } from "./api";

/**
 * Turn backend-relative media paths into absolute URLs the browser can load.
 * Leaves blob:/data:/http(s) alone.
 */
export function resolveMediaUrl(url?: string | null): string | undefined {
  const trimmed = String(url ?? "").trim();
  if (!trimmed) return undefined;
  if (
    /^https?:\/\//i.test(trimmed) ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }
  if (trimmed.startsWith("//")) {
    if (typeof window !== "undefined" && window.location?.protocol) {
      return `${window.location.protocol}${trimmed}`;
    }
    return `https:${trimmed}`;
  }
  // Backend static uploads: /uploads/...
  if (trimmed.startsWith("/")) {
    return apiUrl(trimmed);
  }
  // Bare relative path
  return apiUrl(`/${trimmed}`);
}

export function resolveMediaUrlOrEmpty(url?: string | null): string {
  return resolveMediaUrl(url) ?? "";
}

/** Useful when comparing against the configured API host. */
export function getApiMediaOrigin(): string {
  return apiBaseUrl;
}
