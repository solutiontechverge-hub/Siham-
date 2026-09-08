import type { CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import type { BookingIndicatorVariant } from "./BookingIndicatorIcon";
import { prepayBlocksConfirmation } from "./bookingAcknowledgment";
import { isResponseWindowOverdue } from "./bookingResponseDeadline";
import { resolveCalendarPrepaymentStatus } from "./prepaymentStatus";

export type CalendarResponseStatus = "suggestion_for_change" | "overdue_response";

export function resolveBookingResponseIndicators(
  event: Pick<CalendarEvent, "bookingScenario" | "details" | "status">,
  opts?: { responseTimeConfigured?: boolean },
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
    (event.status === "BR Accepted" &&
      prepayBlocksConfirmation({ prepayRequired, prepayPaid }));

  if (waitingPrepay) {
    if (event.status === "BR Accepted" && prepayBlocksConfirmation({ prepayRequired, prepayPaid })) {
      // Professional waits for the client to pay.
      indicators.push("waiting_for_payment");
    } else {
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
