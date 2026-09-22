import type { CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import type { BookingIndicatorVariant } from "./BookingIndicatorIcon";
import { prepayBlocksConfirmation } from "./bookingAcknowledgment";
import { resolvePostBookingPendingPayment } from "./bookingCheckout";
import {
  isResponseWindowOverdue,
  type ResponseWindowInput,
} from "./bookingResponseDeadline";
import { resolveCalendarPrepaymentStatus } from "./prepaymentStatus";

export type CalendarResponseStatus = "suggestion_for_change" | "overdue_response";

export function resolveBookingResponseIndicators(
  event: Pick<CalendarEvent, "id" | "bookingScenario" | "details" | "status">,
  opts?: {
    responseTimeConfigured?: boolean;
    responseTime?: ResponseWindowInput | null;
  },
): BookingIndicatorVariant[] {
  const indicators: BookingIndicatorVariant[] = [];
  const details = event.details;
  const prepayment = resolveCalendarPrepaymentStatus(event);
  const prepayRequired = Boolean(details?.showPrepayment);
  const prepayPaid = prepayment === "confirmed";
  const pendingNegotiation =
    event.status === "Requested" ||
    event.bookingScenario === "BR" ||
    event.bookingScenario === "EBR" ||
    event.bookingScenario === "ER";

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
  } else if (prepayRequired && prepayPaid) {
    indicators.push("prepaid");
  }

  // In Progress past end may stay out of sync — still signal close-out when unpaid.
  if (event.status === "In Progress" && !details?.refunded) {
    if (resolvePostBookingPendingPayment(event as CalendarEvent)) {
      indicators.push("waiting_for_payment");
    }
  } else if (
    event.status === "Completed" &&
    details?.waitingForPayment &&
    !details?.refunded
  ) {
    const due = details.invoiceDueDate?.trim();
    const overdue =
      Boolean(due) &&
      !Number.isNaN(new Date(`${due}T00:00:00`).getTime()) &&
      new Date(`${due}T00:00:00`).getTime() <
        new Date(new Date().toISOString().slice(0, 10) + "T00:00:00").getTime();
    indicators.push(overdue ? "overdue_payment" : "waiting_for_payment");
  }

  if (
    pendingNegotiation &&
    opts?.responseTimeConfigured !== false &&
    isResponseWindowOverdue(
      {
        responseStatus: details?.responseStatus,
        responseStartedAt: details?.responseStartedAt,
        respondBy: details?.respondBy,
        responseWindowMinutes: details?.responseWindowMinutes,
      },
      new Date(),
      opts?.responseTime,
    )
  ) {
    indicators.push("overdue_response");
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
