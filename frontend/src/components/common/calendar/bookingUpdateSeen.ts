"use client";

/**
 * Track which booking updates each viewer has already opened.
 * Keyed by `${viewer}:${bookingRef}` → last seen updated_at ISO.
 */

import * as React from "react";

export type BookingUpdateViewer = "professional" | "client";

const STORAGE_KEY = "mollure:booking_update_seen_v1";

type SeenMap = Record<string, string>;

let seenVersion = 0;
const seenListeners = new Set<() => void>();

function bumpSeenVersion() {
  seenVersion += 1;
  seenListeners.forEach((listener) => listener());
}

export function subscribeBookingUpdateSeen(listener: () => void) {
  seenListeners.add(listener);
  return () => {
    seenListeners.delete(listener);
  };
}

export function getBookingUpdateSeenVersion() {
  return seenVersion;
}

/** Re-render list/calendar tags after a booking is opened and marked seen. */
export function useBookingUpdateSeenVersion() {
  return React.useSyncExternalStore(
    subscribeBookingUpdateSeen,
    getBookingUpdateSeenVersion,
    getBookingUpdateSeenVersion,
  );
}

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

/**
 * Contact / guest name / service-order change — show "Updated" until the
 * other party opens the booking. No approval click.
 */
export function shouldShowSilentUpdatedTag(input: {
  silentUpdated?: boolean | null;
  viewer: BookingUpdateViewer;
  bookingRef?: string | null;
  updatedAt?: string | null;
  lastEditedBy?: "client" | "professional" | null;
}): boolean {
  if (!input.silentUpdated) return false;
  return hasUnseenBookingUpdate({
    viewer: input.viewer,
    bookingRef: input.bookingRef,
    updatedAt: input.updatedAt,
    lastEditedBy: input.lastEditedBy,
  });
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
  const key = storageKey(viewer, ref);
  if (all[key] === stamp) return;
  all[key] = stamp;
  saveSeen(all);
  bumpSeenVersion();
}
