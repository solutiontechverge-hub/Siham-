import type { CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import type { PrepaymentStatusIconVariant } from "./PrepaymentStatusIcon";

export type CalendarPrepaymentStatus = "pending" | "confirmed" | "canceled" | "invalid";

export function toPrepaymentIconVariant(
  status: CalendarPrepaymentStatus,
): PrepaymentStatusIconVariant {
  if (status === "confirmed") return "confirmed";
  if (status === "pending") return "pending";
  return "canceled_or_invalid";
}

/** Map API `prepayment_status` → calendar icon status. */
export function mapApiPrepaymentStatus(
  apiStatus?: string | null,
): CalendarPrepaymentStatus | undefined {
  const value = String(apiStatus ?? "").toLowerCase();
  if (!value) return undefined;
  if (value === "paid") return "confirmed";
  if (value === "required" || value === "pending") return "pending";
  if (value === "failed" || value === "canceled" || value === "cancelled") return "canceled";
  if (value === "invalid") return "invalid";
  return undefined;
}

export function resolveCalendarPrepaymentStatus(
  event: Pick<CalendarEvent, "status" | "details">,
): CalendarPrepaymentStatus | undefined {
  const details = event.details;
  if (!details?.showPrepayment) return undefined;

  // Prefer explicit detail status (synced from API / notes).
  if (details.prepaymentStatus) return details.prepaymentStatus;

  if (event.status === "Cancelled") return "canceled";
  if (event.status === "Invalid") return "invalid";

  // When prepayment is required but not marked paid, show due (pending) icon.
  return "pending";
}

export function hasPrepaymentIndicator(event: Pick<CalendarEvent, "status" | "details">) {
  return Boolean(resolveCalendarPrepaymentStatus(event));
}
