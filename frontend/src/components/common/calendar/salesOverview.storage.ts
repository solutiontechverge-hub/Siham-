import type { SalesAddonRecord, SalesCardMetaRecord } from "./salesOverview.types";

let cardMetadata: SalesCardMetaRecord[] = [];
let persistSalesCardMeta: ((record: SalesCardMetaRecord) => void) | null = null;
let addonRecords: SalesAddonRecord[] = [];
let persistSalesAddon: ((record: SalesAddonRecord) => void) | null = null;

/** Dispatched after sales card meta is written so calendar cards can refresh. */
export const SALES_META_CHANGED_EVENT = "mollure:sales-meta-changed";

function emitSalesMetaChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SALES_META_CHANGED_EVENT));
}

export function hydrateSalesCardMetadata(records: SalesCardMetaRecord[]) {
  cardMetadata = records;
  // Add-ons live in getSalesAddons — do not clobber addonRecords from meta embeds.
  emitSalesMetaChanged();
}

export function hydrateSalesAddons(records: SalesAddonRecord[]) {
  addonRecords = records;
  emitSalesMetaChanged();
}

export function configureSalesAddonPersistence(persist: ((record: SalesAddonRecord) => void) | null) {
  persistSalesAddon = persist;
}

export function configureSalesCardMetadataPersistence(
  persist: ((record: SalesCardMetaRecord) => void) | null,
) {
  persistSalesCardMeta = persist;
}

export function listSalesAddons(bookingId?: string | null): SalesAddonRecord[] {
  if (!bookingId) return addonRecords;
  return addonRecords.filter((row) => row.bookingId === bookingId);
}

export function listSalesAddonsForBookings(bookingIds: readonly string[]): SalesAddonRecord[] {
  const idSet = new Set(bookingIds.map(String));
  return addonRecords.filter((row) => idSet.has(String(row.bookingId)));
}

export function saveSalesAddon(record: SalesAddonRecord) {
  addonRecords = [record, ...addonRecords.filter((row) => row.id !== record.id)];
  persistSalesAddon?.(record);
  emitSalesMetaChanged();
}

export function updateSalesAddon(
  id: string,
  patch: Partial<Pick<SalesAddonRecord, "note" | "voided" | "refunded">>,
) {
  addonRecords = addonRecords.map((row) => (row.id === id ? { ...row, ...patch } : row));
  const record = addonRecords.find((row) => row.id === id);
  if (record) persistSalesAddon?.(record);
  emitSalesMetaChanged();
}

export function getSalesCardMeta(cardId: string): SalesCardMetaRecord | null {
  return cardMetadata.find((row) => row.cardId === cardId) ?? null;
}

export function listSalesCardMetaForBooking(bookingId: string): SalesCardMetaRecord[] {
  return cardMetadata.filter((row) => row.bookingId === bookingId);
}

export function upsertSalesCardMeta(record: SalesCardMetaRecord) {
  const all = cardMetadata;
  const existing = all.find((row) => row.cardId === record.cardId);
  const merged = existing ? { ...existing, ...record } : record;
  const next = [...all.filter((row) => row.cardId !== record.cardId), merged];
  cardMetadata = next;
  persistSalesCardMeta?.(merged);
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
