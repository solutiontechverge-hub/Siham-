/**
 * Track which booking updates each viewer has already opened.
 * Keyed by `${viewer}:${bookingRef}` → last seen updated_at ISO.
 */

export type BookingUpdateViewer = "professional" | "client";

const STORAGE_KEY = "mollure:booking_update_seen_v1";

type SeenMap = Record<string, string>;

function storageKey(viewer: BookingUpdateViewer, bookingRef: string) {
  const ref = bookingRef.replace(/^#/, "").trim();
  return `${viewer}:${ref}`;
}

function loadSeen(): SeenMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as SeenMap;
  } catch {
    return {};
  }
}

function saveSeen(map: SeenMap) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

function toMs(value?: string | null): number {
  if (!value) return 0;
  const t = Date.parse(value);
  return Number.isFinite(t) ? t : 0;
}

/**
 * True when the booking was updated by the other party after this viewer last opened it.
 */
export function hasUnseenBookingUpdate(input: {
  bookingRef?: string | null;
  updatedAt?: string | null;
  lastEditedBy?: "client" | "professional" | null;
  viewer: BookingUpdateViewer;
}): boolean {
  const ref = String(input.bookingRef ?? "")
    .replace(/^#/, "")
    .trim();
  if (!ref || !input.updatedAt) return false;

  // Only flag updates from the other party (avoids noise on own saves / first load).
  const editedBy = input.lastEditedBy ?? null;
  if (!editedBy || editedBy === input.viewer) return false;

  const seen = loadSeen()[storageKey(input.viewer, ref)];
  return toMs(input.updatedAt) > toMs(seen);
}

/** Call when the viewer opens booking details / drawer. */
export function markBookingUpdateSeen(
  viewer: BookingUpdateViewer,
  bookingRef: string | null | undefined,
  updatedAt?: string | null,
): void {
  const ref = String(bookingRef ?? "")
    .replace(/^#/, "")
    .trim();
  if (!ref) return;
  const stamp = updatedAt?.trim() || new Date().toISOString();
  const all = loadSeen();
  all[storageKey(viewer, ref)] = stamp;
  saveSeen(all);
}
