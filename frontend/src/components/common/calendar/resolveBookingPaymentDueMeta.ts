import * as React from "react";
import { listSalesCardMetaForBooking, SALES_META_CHANGED_EVENT } from "./salesOverview.storage";
import type { SalesCardMetaRecord } from "./salesOverview.types";
import { parseApiCalendarEventId } from "./bookingEventDetails";
import { extractBookingId } from "./calendar.utils";
import { isCancelledOrNoShowBookingStatus } from "./bookingStatus";
import { formatFinanceDueDate } from "../booking-finance/formatBookingFinance";
import type { TransactionRow } from "../../../app/professionals/fixed-location/finance/data/transactions";
import { useGetFinanceTransactionsQuery } from "../../../store/services/financeApi";
import { isDueDatePast } from "./buildSalesOverviewCards.format";

export type BookingPaymentDueMeta = {
  dueDateIso: string;
  dateLabel: string;
  reissued: boolean;
  paymentDue: boolean;
  /** True when dueDate is before today (needs reissue / wait state). */
  pastDue: boolean;
};

const FinancePaymentDueRowsContext = React.createContext<TransactionRow[] | null>(null);

export function FinancePaymentDueRowsProvider({
  children,
  rows,
}: {
  children: React.ReactNode;
  rows: TransactionRow[];
}) {
  return React.createElement(FinancePaymentDueRowsContext.Provider, { value: rows }, children);
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
    dateLabel: formatFinanceDueDate(meta.dueDate),
    reissued:
      meta.cardKind === "reissued_invoice" || Boolean(meta.reissuedAt),
    paymentDue: true,
    pastDue: isDueDatePast(meta.dueDate),
  };
}

/** Live meta for a calendar booking — refreshes when sales reissue meta changes. */
function resolveFinancePaymentDueMeta(
  rows: TransactionRow[],
): BookingPaymentDueMeta | null {
  const candidates = rows.filter((row) => {
    const status = String(row.status).trim().toLowerCase();
    const document = row.issuedDocument ?? row.document;
    const reissued =
      Boolean(document?.reissuedAt || document?.reissuedFrom) ||
      Number(document?.reissueLevel ?? 0) > 0;
    const closed = ["paid", "prepaid", "refunded", "voided"].includes(status);
    return (
      Boolean(
        row.paymentDeadline ||
          row.issuedDocument?.dueDate ||
          row.document?.dueDate,
      ) &&
      !closed &&
      (reissued ||
        status === "payment due" ||
        status === "overdue" ||
        status === "unpaid")
    );
  });
  const row =
    candidates.find((candidate) => {
      const document = candidate.issuedDocument ?? candidate.document;
      return (
        Boolean(document?.reissuedAt || document?.reissuedFrom) ||
        Number(document?.reissueLevel ?? 0) > 0
      );
    }) ?? candidates[0];
  if (!row) return null;

  const document = row.issuedDocument ?? row.document;
  const dueDate = row.paymentDeadline || document?.dueDate;
  if (!dueDate) return null;

  return {
    dueDateIso: dueDate,
    dateLabel: formatFinanceDueDate(dueDate),
    reissued:
      Boolean(document?.reissuedAt || document?.reissuedFrom) ||
      Number(document?.reissueLevel ?? 0) > 0,
    paymentDue: true,
    pastDue: isDueDatePast(dueDate),
  };
}

export function useBookingPaymentDueMeta(event: {
  id: string;
  bookingCode?: string;
  status?: string;
  details?: { invoiceDueDate?: string | null } | null;
} | null): BookingPaymentDueMeta | null {
  const [revision, setRevision] = React.useState(0);
  const preloadedRows = React.useContext(FinancePaymentDueRowsContext);
  const bookingKey = event
    ? event.bookingCode ||
      parseApiCalendarEventId(event.id)?.id ||
      extractBookingId(event.id)
    : "";
  const skipPaymentDue = isCancelledOrNoShowBookingStatus(event?.status);
  const { data: financeResponse } = useGetFinanceTransactionsQuery(
    { bookingId: bookingKey, limit: 50 },
    {
      skip: skipPaymentDue || preloadedRows !== null || !bookingKey,
      refetchOnMountOrArgChange: true,
    },
  );

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
    if (!event || skipPaymentDue) return null;
    const fromMeta = resolveBookingPaymentDueMeta({
      bookingId: parseApiCalendarEventId(event.id)?.id ?? event.id,
      bookingCode: event.bookingCode,
      eventId: event.id,
    });
    let fromFinance: BookingPaymentDueMeta | null = null;
    if (preloadedRows !== null) {
      const bookingIds = new Set(resolveBookingIds(event));
      fromFinance = resolveFinancePaymentDueMeta(
        preloadedRows.filter(
          (row) =>
            bookingIds.has(String(row.bookingId ?? "")) ||
            bookingIds.has(String(row.entryId ?? "")),
        ),
      );
    } else if (financeResponse) {
      fromFinance = resolveFinancePaymentDueMeta(
        financeResponse.data?.rows ?? [],
      );
    }
    const dueFromNotes = String(event.details?.invoiceDueDate ?? "").trim();
    const fromNotes: BookingPaymentDueMeta | null = dueFromNotes
      ? {
          dueDateIso: dueFromNotes,
          dateLabel: formatFinanceDueDate(dueFromNotes),
          reissued: false,
          paymentDue: true,
          pastDue: isDueDatePast(dueFromNotes),
        }
      : null;
    // Sales meta holds reissue due dates; finance list can lag until Sales mounts.
    if (fromFinance?.reissued) return fromFinance;
    if (fromMeta?.reissued) return fromMeta;
    return fromFinance ?? fromMeta ?? fromNotes;
    // revision intentionally included so in-memory sales meta updates re-resolve
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    event?.id,
    event?.bookingCode,
    event?.status,
    event?.details?.invoiceDueDate,
    financeResponse,
    preloadedRows,
    revision,
    skipPaymentDue,
  ]);
}
