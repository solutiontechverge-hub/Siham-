import type { CalendarBookingStatus, CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import type { PrepaymentStatusIconVariant } from "./PrepaymentStatusIcon";

export type CalendarPrepaymentStatus = "pending" | "confirmed" | "canceled" | "invalid";

export function toPrepaymentIconVariant(
  status: CalendarPrepaymentStatus,
): PrepaymentStatusIconVariant {
  if (status === "confirmed") return "confirmed";
  if (status === "pending") return "pending";
  return "canceled_or_invalid";
}

export function resolveCalendarPrepaymentStatus(
  event: Pick<CalendarEvent, "status" | "details">,
): CalendarPrepaymentStatus | undefined {
  const details = event.details;
  if (!details?.showPrepayment) return undefined;
  if (details.prepaymentStatus) return details.prepaymentStatus;

  if (event.status === "Cancelled") return "canceled";
  if (event.status === "Invalid") return "invalid";
  if (event.status === "Confirmed" || event.status === "Completed") return "confirmed";

  return "pending";
}

export function hasPrepaymentIndicator(event: Pick<CalendarEvent, "status" | "details">) {
  return Boolean(resolveCalendarPrepaymentStatus(event));
}
