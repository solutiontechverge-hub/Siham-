import type { CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import type { BookingIndicatorVariant } from "./BookingIndicatorIcon";
import { prepayBlocksConfirmation } from "./bookingAcknowledgment";
import {
  shouldShowExpiredResponseBanner,
  type ResponseWindowInput,
} from "./bookingResponseDeadline";
import { resolveTimeBasedCalendarStatus } from "./bookingStatus";
import { resolveCalendarPrepaymentStatus } from "./prepaymentStatus";
import { parseBookingFinancialsFromNotes } from "./bookingEventDetails";

export type CalendarResponseStatus = "suggestion_for_change" | "overdue_response";

/** Appointment completion and a deposit do not confirm the remaining payment. */
export function resolveBookingPaymentIconStatus(
  event: Pick<CalendarEvent, "status" | "details"> &
    Partial<Pick<CalendarEvent, "notes" | "date" | "start" | "end">>,
) {
  const status = resolveTimeBasedCalendarStatus(event);
  if (status !== "In Progress" && status !== "Completed") {
    return resolveCalendarPrepaymentStatus(event);
  }
  if (event.details?.refunded) return undefined;
  const financials = parseBookingFinancialsFromNotes(event.notes);
  const paymentStatus = String(financials?.payment_status ?? "").trim().toLowerCase();
  return (paymentStatus === "paid" || paymentStatus === "completed") &&
    !(Number(financials?.outstanding_balance) > 0)
    ? "confirmed" as const
    : "pending" as const;
}

export function resolveBookingResponseIndicators(
  event: Pick<
    CalendarEvent,
    "id" | "bookingScenario" | "details" | "status" | "date" | "start"
  > & Partial<Pick<CalendarEvent, "notes" | "end">>,
  opts?: {
    responseTimeConfigured?: boolean;
    responseTime?: ResponseWindowInput | null;
  },
): BookingIndicatorVariant[] {
  const indicators: BookingIndicatorVariant[] = [];
  const details = event.details;
  const prepayment = resolveBookingPaymentIconStatus(event);
  const prepayRequired = Boolean(details?.showPrepayment);
  const prepayPaid = prepayment === "confirmed";
  // Waiting/overdue response clock only while accept is still pending.
  // Do not key off leftover bookingScenario "BR"/"EBR" after Confirmed/Completed.
  const pendingNegotiation =
    event.status === "Requested" ||
    (event.status === "Confirmed" && event.bookingScenario === "ER");

  if (
    details?.responseStatus === "suggestion_for_change" ||
    event.bookingScenario === "EBR" ||
    event.bookingScenario === "ER"
  ) {
    indicators.push("suggestion_for_change");
  }

  const waitingPrepay =
    prepayment === "pending" ||
    ((event.status === "BR Accepted" || event.status === "Requested") &&
      prepayBlocksConfirmation({ prepayRequired, prepayPaid }));

  if (waitingPrepay) {
    // Shared €-in-circle pending seal — BR outstanding or post-accept client pay wait.
    indicators.push("waiting_for_prepayment");
  } else if (prepayPaid) {
    indicators.push("prepaid");
  }

  // Time-based In Progress / Completed — signal unpaid close-out (incl. Confirmed past end).
  const displayStatus = resolveTimeBasedCalendarStatus(
    event as CalendarEvent,
  );
  if (
    (displayStatus === "In Progress" || displayStatus === "Completed") &&
    !details?.refunded &&
    prepayment === "pending"
  ) {
    const due = details?.invoiceDueDate?.trim();
    const overdue =
      displayStatus === "Completed" &&
      Boolean(due) &&
      !Number.isNaN(new Date(`${due}T00:00:00`).getTime()) &&
      new Date(`${due}T00:00:00`).getTime() <
        new Date(new Date().toISOString().slice(0, 10) + "T00:00:00").getTime();
    const prepayIndex = indicators.indexOf("waiting_for_prepayment");
    if (prepayIndex !== -1) indicators.splice(prepayIndex, 1);
    indicators.push(overdue ? "overdue_payment" : "waiting_for_payment");
  }

  if (pendingNegotiation && opts?.responseTimeConfigured !== false) {
    // Same gate as Booking Details expiry banner (respondBy or past appointment).
    const overdue = shouldShowExpiredResponseBanner(
      event,
      opts?.responseTime,
    );
    indicators.push(overdue ? "overdue_response" : "response_time_active");
  }

  return indicators;
}

const HIDDEN_SETTLED_INDICATORS: ReadonlySet<BookingIndicatorVariant> = new Set([
  "refund_completed",
]);

/** Hide refund-completed tick from action rows; prepaid stays visible after pay. */
export function isActionRequiredBookingIndicator(
  indicator: BookingIndicatorVariant,
): boolean {
  return !HIDDEN_SETTLED_INDICATORS.has(indicator);
}

export function actionRequiredBookingIndicators(
  indicators: readonly BookingIndicatorVariant[] | undefined,
): BookingIndicatorVariant[] {
  return (indicators ?? []).filter(isActionRequiredBookingIndicator);
}
