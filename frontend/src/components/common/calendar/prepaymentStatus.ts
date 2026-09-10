import type { CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import type { PrepaymentStatusIconVariant } from "./PrepaymentStatusIcon";

export type CalendarPrepaymentStatus = "pending" | "confirmed" | "canceled" | "invalid";

function isOfflinePaymentMethod(method?: string | null) {
  return String(method ?? "")
    .toLowerCase()
    .replace(/[\s_-]/g, "")
    .startsWith("offline");
}

export function toPrepaymentIconVariant(
  status: CalendarPrepaymentStatus,
): PrepaymentStatusIconVariant {
  if (status === "confirmed") return "confirmed";
  if (status === "pending") return "pending";
  return "canceled_or_invalid";
}

/** Confirmed prepaid is status, not an action — only pending pay / refund. */
export function isActionRequiredPrepaymentStatus(
  status: CalendarPrepaymentStatus | undefined,
): status is Exclude<CalendarPrepaymentStatus, "confirmed"> {
  return status === "pending" || status === "canceled" || status === "invalid";
}

export function actionRequiredPrepaymentIconVariant(
  variant: PrepaymentStatusIconVariant | undefined,
): PrepaymentStatusIconVariant | undefined {
  if (variant === "pending" || variant === "canceled_or_invalid") return variant;
  return undefined;
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

  const finished =
    event.status === "Completed" ||
    event.status === "No Show" ||
    event.status === "Cancelled" ||
    event.status === "Invalid";

  // Offline prepayment can be confirmed on save (pro acknowledges offline prepaid).
  // Only force pending when offline and not yet confirmed/canceled/invalid.
  if (isOfflinePaymentMethod(details.paymentMethod)) {
    if (finished) return undefined;
    if (
      details.prepaymentStatus === "confirmed" ||
      details.prepaymentStatus === "canceled" ||
      details.prepaymentStatus === "invalid"
    ) {
      return details.prepaymentStatus;
    }
    return "pending";
  }

  if (details.prepaymentStatus) {
    if (finished && details.prepaymentStatus === "pending") return undefined;
    return details.prepaymentStatus;
  }

  if (event.status === "Cancelled") return "canceled";
  if (event.status === "Invalid") return "invalid";

  return "pending";
}

export function hasPrepaymentIndicator(event: Pick<CalendarEvent, "status" | "details">) {
  return Boolean(resolveCalendarPrepaymentStatus(event));
}
