const STORAGE_KEY = "mollure:cancelled_checkout_refs";

function loadSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

function saveSet(set: Set<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
}

export function isCheckoutBookingCancelled(bookingRef: string): boolean {
  if (!bookingRef) return false;
  return loadSet().has(bookingRef);
}

export function markCheckoutBookingCancelled(bookingRef: string) {
  if (!bookingRef) return;
  const set = loadSet();
  set.add(bookingRef);
  saveSet(set);
}

export function clearCheckoutBookingCancelled(bookingRef: string) {
  if (!bookingRef) return;
  const set = loadSet();
  set.delete(bookingRef);
  saveSet(set);
}
