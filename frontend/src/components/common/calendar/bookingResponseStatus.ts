import type { CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import type { BookingIndicatorVariant } from "./BookingIndicatorIcon";
import { isResponseWindowOverdue } from "./bookingResponseDeadline";
import { resolveCalendarPrepaymentStatus } from "./prepaymentStatus";

export type CalendarResponseStatus = "suggestion_for_change" | "overdue_response";

export function resolveBookingResponseIndicators(
  event: Pick<CalendarEvent, "bookingScenario" | "details" | "status">,
): BookingIndicatorVariant[] {
  const indicators: BookingIndicatorVariant[] = [];
  const details = event.details;
  const prepayment = resolveCalendarPrepaymentStatus(event);
  const pendingNegotiation =
    event.status === "Requested" ||
    event.bookingScenario === "BR" ||
    event.bookingScenario === "EBR" ||
    event.bookingScenario === "ER";

  if (details?.responseStatus === "suggestion_for_change" || event.bookingScenario === "EBR") {
    indicators.push("suggestion_for_change");
  }

  if (prepayment === "pending") {
    indicators.push("waiting_for_prepayment");
  }

  if (prepayment === "confirmed") {
    indicators.push("prepaid");
  }

  if (prepayment === "canceled" || prepayment === "invalid") {
    indicators.push("refund_pending");
  }

  if (details?.refunded) {
    indicators.push("refund_completed");
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
    isResponseWindowOverdue({
      responseStatus: details?.responseStatus,
      responseStartedAt: details?.responseStartedAt,
      respondBy: details?.respondBy,
      responseWindowMinutes: details?.responseWindowMinutes,
    })
  ) {
    indicators.push("overdue_response");
  }

  return indicators;
}
