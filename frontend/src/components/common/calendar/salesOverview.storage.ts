import type { SalesAddonRecord, SalesCardMetaRecord } from "./salesOverview.types";

const ADDONS_KEY = "mollure.sales.addons.v1";
const META_KEY = "mollure.sales.cardMeta.v1";

/** Dispatched after sales card meta is written so calendar cards can refresh. */
export const SALES_META_CHANGED_EVENT = "mollure:sales-meta-changed";

function emitSalesMetaChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SALES_META_CHANGED_EVENT));
}

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
  emitSalesMetaChanged();
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
  emitSalesMetaChanged();
}

export function getSalesCardMeta(cardId: string): SalesCardMetaRecord | null {
  return readJson<SalesCardMetaRecord[]>(META_KEY, []).find((row) => row.cardId === cardId) ?? null;
}

export function listSalesCardMetaForBooking(bookingId: string): SalesCardMetaRecord[] {
  return readJson<SalesCardMetaRecord[]>(META_KEY, []).filter((row) => row.bookingId === bookingId);
}

export function upsertSalesCardMeta(record: SalesCardMetaRecord) {
  const all = readJson<SalesCardMetaRecord[]>(META_KEY, []);
  const existing = all.find((row) => row.cardId === record.cardId);
  const merged = existing ? { ...existing, ...record } : record;
  const next = [...all.filter((row) => row.cardId !== record.cardId), merged];
  writeJsonValue(META_KEY, next);
  emitSalesMetaChanged();
}

function seqFromCardId(baseId: string, cardId: string): number {
  if (cardId === baseId) return 0;
  const prefix = `${baseId}-v`;
  if (!cardId.startsWith(prefix)) return 0;
  const n = Number(cardId.slice(prefix.length));
  return Number.isFinite(n) ? n : 0;
}

/** Live (non-canceled) card id after Cancel Sales tears down prior invoices. */
export function resolveLiveCardId(bookingId: string, baseId: string): string {
  const metas = listSalesCardMetaForBooking(bookingId);
  const canceled = metas.filter(
    (row) =>
      row.canceled &&
      (row.cardId === baseId || row.cardId.startsWith(`${baseId}-v`)),
  );
  if (!canceled.length) return baseId;
  const maxSeq = Math.max(
    0,
    ...canceled.map((row) => row.invoiceSeq ?? seqFromCardId(baseId, row.cardId)),
  );
  return `${baseId}-v${maxSeq + 1}`;
}

const SUPERSEDE_BASE_SUFFIXES = [
  "prepayment",
  "summary",
  "after-treatment",
] as const;

/**
 * Pre-resolution booking edit: cancel live unpaid sales cards so rebuild uses a
 * fresh id (same path as Cancel Sales → resolveLiveCardId), clearing frozen Edit
 * Sales lines that would otherwise keep stale totals.
 */
export function supersedeOpenSalesCardsForBooking(bookingId: string) {
  if (!bookingId) return;
  for (const suffix of SUPERSEDE_BASE_SUFFIXES) {
    const baseId = `${bookingId}-${suffix}`;
    const liveId = resolveLiveCardId(bookingId, baseId);
    const meta = getSalesCardMeta(liveId);
    if (!meta || meta.canceled) continue;
    // Skip settled cards — do not tear down prepaid/paid/refunded sales.
    if (meta.paid || meta.paidAt || meta.refunded || meta.voided) continue;
    const seqMatch = liveId.match(/-v(\d+)$/);
    upsertSalesCardMeta({
      bookingId,
      cardKind:
        meta.cardKind ??
        (suffix === "after-treatment" ? "after_treatment" : "prepayment"),
      cardId: liveId,
      note: meta.note,
      paymentMethod: meta.paymentMethod,
      dueDate: meta.dueDate ?? null,
      canceled: true,
      invoiceSeq: seqMatch ? Number(seqMatch[1]) : 0,
    });
  }
}
