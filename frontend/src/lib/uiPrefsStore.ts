/**
 * In-memory UI prefs hydrated from GET/PUT /api/user/ui-prefs.
 * Replaces durable localStorage for messaging prefs + booking update-seen.
 */

export type UiPrefsState = {
  messagingPrefs?: Record<string, unknown>;
  bookingUpdateSeen?: Record<string, string>;
  reviewerDisplayFormat?: string;
};

type PersistFn = ((patch: Record<string, unknown>) => void) | null;

let prefs: UiPrefsState = {};
let persistUiPrefs: PersistFn = null;
let persistTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function bump() {
  listeners.forEach((l) => l());
}

export function subscribeUiPrefs(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getUiPrefsSnapshot(): UiPrefsState {
  return prefs;
}

export function hydrateUiPrefs(next: UiPrefsState | null | undefined) {
  if (!next || typeof next !== "object") {
    prefs = {};
  } else {
    prefs = { ...next };
  }
  bump();
}

export function configureUiPrefsPersistence(persist: PersistFn) {
  persistUiPrefs = persist;
}

function schedulePersist(patch: Record<string, unknown>) {
  if (!persistUiPrefs) return;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    persistUiPrefs?.(patch);
  }, 400);
}

export function patchUiPrefs(patch: UiPrefsState) {
  prefs = { ...prefs, ...patch };
  bump();
  schedulePersist(patch as Record<string, unknown>);
}

/** One-shot clear of legacy browser keys (non-auth). */
export function purgeLegacyUiLocalStorage() {
  if (typeof window === "undefined") return;
  const keys = [
    "mollure:client_profile",
    "mollure:favorites",
    "mollure:messaging:v1",
    "mollure:messaging:prefs:v1",
    "mollure:messaging:runtime:v1",
    "mollure:booking_update_seen_v1",
    "mollure:booking_edit_requests",
    "mollure:booking_cancellation_reasons",
    "mollure:client_professional_reviews",
    "mollure:reviewer_display_format",
  ];
  for (const key of keys) {
    try {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
}
