import * as React from "react";
import { listSalesCardMetaForBooking, SALES_META_CHANGED_EVENT } from "./salesOverview.storage";
import type { SalesCardMetaRecord } from "./salesOverview.types";
import { parseApiCalendarEventId } from "./bookingEventDetails";
import { extractBookingId } from "./calendar.utils";

export type BookingPaymentDueMeta = {
  dueDateIso: string;
  dateLabel: string;
  reissued: boolean;
  paymentDue: boolean;
};

function formatDueDateLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function isPaymentDueFromMeta(meta: SalesCardMetaRecord): boolean {
  if (meta.canceled || meta.voided || meta.refunded) return false;
  if (!meta.dueDate) return false;
  if (meta.cardKind === "reissued_invoice") return true;
  if (
    meta.paymentMethod === "onlineNonDirect" ||
    meta.paymentMethod === "offlineNonDirect"
  ) {
    return true;
  }
  return Boolean(meta.reissuedAt);
}

function pickBestMeta(rows: SalesCardMetaRecord[]): SalesCardMetaRecord | null {
  const candidates = rows.filter(isPaymentDueFromMeta);
  if (!candidates.length) return null;
  return (
    candidates.find((row) => row.cardKind === "reissued_invoice") ??
    candidates.find((row) => Boolean(row.reissuedAt)) ??
    candidates[0]
  );
}

export function resolveBookingIds(event: {
  id: string;
  bookingCode?: string;
}): string[] {
  const parsed = parseApiCalendarEventId(event.id)?.id;
  const extracted = extractBookingId(event.id);
  return [parsed, extracted, event.id, event.bookingCode]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);
}

export function resolveBookingPaymentDueMeta(input: {
  bookingId?: string | null;
  bookingCode?: string | null;
  eventId?: string | null;
}): BookingPaymentDueMeta | null {
  const ids = [
    input.bookingId,
    input.bookingCode,
    input.eventId ? parseApiCalendarEventId(input.eventId)?.id : null,
    input.eventId ? extractBookingId(input.eventId) : null,
    input.eventId,
  ]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);

  if (!ids.length) return null;

  const seen = new Set<string>();
  const rows: SalesCardMetaRecord[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    rows.push(...listSalesCardMetaForBooking(id));
  }

  const meta = pickBestMeta(rows);
  if (!meta?.dueDate) return null;

  return {
    dueDateIso: meta.dueDate,
    dateLabel: formatDueDateLabel(meta.dueDate),
    reissued:
      meta.cardKind === "reissued_invoice" || Boolean(meta.reissuedAt),
    paymentDue: true,
  };
}

/** Live meta for a calendar booking — refreshes when sales reissue meta changes. */
export function useBookingPaymentDueMeta(event: {
  id: string;
  bookingCode?: string;
} | null): BookingPaymentDueMeta | null {
  const [revision, setRevision] = React.useState(0);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const bump = () => setRevision((n) => n + 1);
    window.addEventListener(SALES_META_CHANGED_EVENT, bump);
    window.addEventListener("storage", bump);
    return () => {
      window.removeEventListener(SALES_META_CHANGED_EVENT, bump);
      window.removeEventListener("storage", bump);
    };
  }, []);

  return React.useMemo(() => {
    if (!event) return null;
    return resolveBookingPaymentDueMeta({
      bookingId: parseApiCalendarEventId(event.id)?.id ?? event.id,
      bookingCode: event.bookingCode,
      eventId: event.id,
    });
    // revision intentionally included so localStorage meta updates re-resolve
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.id, event?.bookingCode, revision]);
}
