import type { SalesAddonRecord, SalesCardMetaRecord } from "./salesOverview.types";

const ADDONS_KEY = "mollure.sales.addons.v1";
const META_KEY = "mollure.sales.cardMeta.v1";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJsonValue(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function listSalesAddons(bookingId?: string | null): SalesAddonRecord[] {
  const all = readJson<SalesAddonRecord[]>(ADDONS_KEY, []);
  if (!bookingId) return all;
  return all.filter((row) => row.bookingId === bookingId);
}

export function listSalesAddonsForBookings(bookingIds: readonly string[]): SalesAddonRecord[] {
  const idSet = new Set(bookingIds.map(String));
  return readJson<SalesAddonRecord[]>(ADDONS_KEY, []).filter((row) => idSet.has(String(row.bookingId)));
}

export function saveSalesAddon(record: SalesAddonRecord) {
  const all = readJson<SalesAddonRecord[]>(ADDONS_KEY, []);
  const next = [record, ...all.filter((row) => row.id !== record.id)];
  writeJsonValue(ADDONS_KEY, next);
}

export function updateSalesAddon(
  id: string,
  patch: Partial<Pick<SalesAddonRecord, "note" | "voided" | "refunded">>,
) {
  const all = readJson<SalesAddonRecord[]>(ADDONS_KEY, []);
  writeJsonValue(
    ADDONS_KEY,
    all.map((row) => (row.id === id ? { ...row, ...patch } : row)),
  );
}

export function getSalesCardMeta(cardId: string): SalesCardMetaRecord | null {
  return readJson<SalesCardMetaRecord[]>(META_KEY, []).find((row) => row.cardId === cardId) ?? null;
}

export function listSalesCardMetaForBooking(bookingId: string): SalesCardMetaRecord[] {
  return readJson<SalesCardMetaRecord[]>(META_KEY, []).filter((row) => row.bookingId === bookingId);
}

export function upsertSalesCardMeta(record: SalesCardMetaRecord) {
  const all = readJson<SalesCardMetaRecord[]>(META_KEY, []);
  const next = [...all.filter((row) => row.cardId !== record.cardId), record];
  writeJsonValue(META_KEY, next);
}
