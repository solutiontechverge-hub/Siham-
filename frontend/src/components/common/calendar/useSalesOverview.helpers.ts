import type { TransactionRow } from "../../../app/professionals/fixed-location/finance/data/transactions";
import type { ClientBookingDraft } from "../client-booking/types";
import type {
  SalesFinanceHint,
  SalesOverviewCardData,
} from "./salesOverview.types";
import {
  ALLOWED_BOOKING_STATUSES,
  type AllowedBookingStatus,
} from "./salesOverview.data";

export function allowedBookingStatus(
  status: string | null | undefined,
): AllowedBookingStatus {
  const normalized = String(status || "")
    .toLowerCase()
    .replace(/\s+/g, "_");
  return (
    ALLOWED_BOOKING_STATUSES.find((value) => value === normalized) ?? "confirmed"
  );
}

export function toFinanceHints(rows: TransactionRow[]): SalesFinanceHint[] {
  return rows.map((row) => {
    const doc = (row.issuedDocument ?? row.document) as
      | {
          paymentPhase?: string;
          addonId?: string;
          dueDate?: string;
          penaltyAmount?: number;
          payerKey?: string;
        }
      | undefined;
    const paid =
      row.status === "Paid" || row.status === "Prepaid"
        ? row.date
          ? `${row.date}T12:00:00`
          : null
        : null;
    const amount = Number(row.grossAmount ?? row.netAmount);
    return {
      bookingId: row.bookingId,
      bookingCode: row.entryId || row.bookingId,
      phase: doc?.paymentPhase,
      addonId: doc?.addonId,
      payerKey: doc?.payerKey,
      status: row.status,
      paidAt: paid,
      dueDate: doc?.dueDate || row.document?.dueDate || null,
      penaltyAmount: doc?.penaltyAmount,
      entryLabel: row.entryLabel,
      amount: Number.isFinite(amount) ? amount : undefined,
    };
  });
}

export function timeFromOccurredAt(iso: string): string {
  if (!iso) return "";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    const match = iso.match(/T(\d{2}:\d{2})/);
    return match?.[1] ?? "";
  }
  return parsed.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function cardToDraft(card: SalesOverviewCardData): ClientBookingDraft {
  const sourceLines = card.highlightedLineIds?.length
    ? card.lines.filter(
        (line) =>
          card.highlightedLineIds!.includes(line.id) && line.amount >= 0,
      )
    : card.lines.filter((line) => line.amount >= 0);

  return {
    selectedDateISO: card.occurredAt.slice(0, 10),
    selectedTime: timeFromOccurredAt(card.occurredAt),
    combineServices: false,
    services: (sourceLines.length
      ? sourceLines
      : card.lines.filter((line) => line.amount >= 0)
    ).map((line) => ({
      id: line.id,
      name: line.label,
      price: line.amount,
      durationMins: 30,
    })),
    total: card.documentAmount,
    people: [],
    teamMembers: [],
  };
}
