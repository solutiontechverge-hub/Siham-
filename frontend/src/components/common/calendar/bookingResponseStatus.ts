import type { CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import type { BookingIndicatorVariant } from "./BookingIndicatorIcon";
import { resolveCalendarPrepaymentStatus } from "./prepaymentStatus";

export type CalendarResponseStatus = "suggestion_for_change" | "overdue_response";

export function resolveBookingResponseIndicators(
  event: Pick<CalendarEvent, "bookingScenario" | "details" | "status">,
): BookingIndicatorVariant[] {
  const indicators: BookingIndicatorVariant[] = [];
  const details = event.details;
  const prepayment = resolveCalendarPrepaymentStatus(event);

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

  if (details?.responseStatus === "overdue_response") {
    indicators.push("overdue_response");
  }

  return indicators;
}
