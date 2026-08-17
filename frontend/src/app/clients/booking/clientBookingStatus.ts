import type { CalendarBookingStatus } from "../../professionals/fixed-location/calendar/calendar.data";
import { BOOKING_STATUS_THEME } from "../../../components/common/calendar/bookingStatus";
import type { ClientBookingStatus } from "./clientBookingRecords";

const CLIENT_TO_CALENDAR: Record<Exclude<ClientBookingStatus, "draft">, CalendarBookingStatus> = {
  requested: "Requested",
  confirmed: "Confirmed",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
  invalid: "Invalid",
};

/** Canonical status chip labels — never use payment/response as status text. */
export function bookingStatusLabel(status: ClientBookingStatus): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "requested":
      return "Requested";
    case "confirmed":
      return "Confirmed";
    case "in_progress":
      return "In Progress";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    case "no_show":
      return "No Show";
    case "invalid":
      return "Invalid";
    default:
      return "Requested";
  }
}

export function bookingStatusChipColors(status: ClientBookingStatus): {
  bgcolor: string;
  color: string;
  border: string;
} {
  if (status === "draft") {
    return {
      bgcolor: "rgba(52, 74, 102, 0.06)",
      color: "rgba(52, 74, 102, 0.45)",
      border: "1px solid rgba(52, 74, 102, 0.1)",
    };
  }
  const calendarStatus = CLIENT_TO_CALENDAR[status] ?? "Requested";
  const theme = BOOKING_STATUS_THEME[calendarStatus] ?? BOOKING_STATUS_THEME.Requested;
  return {
    bgcolor: theme.chipBg,
    color: theme.chipColor,
    border: `1px solid ${theme.chipBorder}`,
  };
}

export function mapApiBookingStatusToClient(status: string): ClientBookingStatus | null {
  const normalized = status.trim().toLowerCase();
  if (normalized === "requested") return "requested";
  if (normalized === "confirmed") return "confirmed";
  if (normalized === "in_progress" || normalized === "in progress") return "in_progress";
  if (normalized === "completed") return "completed";
  if (normalized === "cancelled") return "cancelled";
  if (normalized === "no_show" || normalized === "no show") return "no_show";
  if (normalized === "invalid") return "invalid";
  // Legacy alias — keep requested + waiting icon instead of a fake status.
  if (normalized === "waiting_for_prepayment" || normalized === "waiting for prepayment") {
    return "requested";
  }
  return null;
}
