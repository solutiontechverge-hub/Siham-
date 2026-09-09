import type { CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import type { BookingIndicatorVariant } from "./BookingIndicatorIcon";
import { prepayBlocksConfirmation } from "./bookingAcknowledgment";
import {
  isResponseWindowOverdue,
  type ResponseWindowInput,
} from "./bookingResponseDeadline";
import { resolveCalendarPrepaymentStatus } from "./prepaymentStatus";

export type CalendarResponseStatus = "suggestion_for_change" | "overdue_response";

export function resolveBookingResponseIndicators(
  event: Pick<CalendarEvent, "bookingScenario" | "details" | "status">,
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

  if (details?.responseStatus === "suggestion_for_change" || event.bookingScenario === "EBR") {
    indicators.push("suggestion_for_change");
  }

  const waitingPrepay =
    prepayment === "pending" ||
    ((event.status === "BR Accepted" || event.status === "Requested") &&
      prepayBlocksConfirmation({ prepayRequired, prepayPaid }));

  if (waitingPrepay) {
    if (
      event.status === "BR Accepted" &&
      prepayBlocksConfirmation({ prepayRequired, prepayPaid })
    ) {
      // Professional waits for the client to pay after accept.
      indicators.push("waiting_for_payment");
    } else {
      // BR sent with prepayment outstanding (client checkout), or pending API status.
      indicators.push("waiting_for_prepayment");
    }
  }

  if (event.status === "Completed" && details?.waitingForPayment && !details?.refunded) {
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

const SETTLED_BOOKING_INDICATORS: ReadonlySet<BookingIndicatorVariant> = new Set(
  ["prepaid", "refund_completed"],
);

/** Hide settled ticks — only keep icons that still need a response or payment. */
export function isActionRequiredBookingIndicator(
  indicator: BookingIndicatorVariant,
): boolean {
  return !SETTLED_BOOKING_INDICATORS.has(indicator);
}

export function actionRequiredBookingIndicators(
  indicators: readonly BookingIndicatorVariant[] | undefined,
): BookingIndicatorVariant[] {
  return (indicators ?? []).filter(isActionRequiredBookingIndicator);
}
