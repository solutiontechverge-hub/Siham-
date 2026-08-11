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
