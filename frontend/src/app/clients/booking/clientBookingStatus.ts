import type { CalendarBookingStatus } from "../../professionals/fixed-location/calendar/calendar.data";
import { BOOKING_STATUS_THEME } from "../../../components/common/calendar/bookingStatus";
import type { ClientBookingStatus } from "./clientBookingRecords";

const CLIENT_TO_CALENDAR: Record<Exclude<ClientBookingStatus, "draft">, CalendarBookingStatus> = {
  requested: "Requested",
  // Chip theme matches Confirmed; BR accepted is a separate indicator.
  br_accepted: "Confirmed",
  confirmed: "Confirmed",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
  invalid: "Invalid",
};

/** Canonical status chip labels — never use payment/response as status text. */
export function bookingStatusLabel(
  status: ClientBookingStatus,
  options?: { edited?: boolean },
): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "requested":
      return "Requested";
    case "br_accepted":
      // Internal accept step — primary chip is Confirmed; BR is the indicator.
      return "Confirmed";
    case "confirmed":
      return options?.edited ? "Confirmed Edited" : "Confirmed";
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
    border: "none",
  };
}

/** BR / ER / EBR / Updated — same height as main status chip, solid grey, no border. */
export const bookingSecondaryStatusChipSx = {
  height: 24,
  minHeight: 24,
  maxHeight: 24,
  boxSizing: "border-box",
  fontWeight: 600,
  fontSize: 11,
  borderRadius: "6px",
  bgcolor: "#F2F4F7",
  color: "rgba(52, 74, 102, 0.62)",
  border: "none",
  borderWidth: 0,
  borderColor: "transparent",
  "& .MuiChip-label": {
    px: 1.1,
    py: 0,
    lineHeight: "24px",
    display: "flex",
    alignItems: "center",
  },
} as const;

/** BR / ER badge stacks in the status row (non-Chip). */
export const bookingSecondaryStatusBadgeSx = {
  height: 24,
  minHeight: 24,
  maxHeight: 24,
  boxSizing: "border-box",
  borderRadius: "6px",
  bgcolor: "#F2F4F7",
  border: "none",
  borderWidth: 0,
  borderColor: "transparent",
  color: "rgba(52, 74, 102, 0.62)",
  px: 1.1,
  py: 0,
  flexShrink: 0,
  display: "inline-flex",
  alignItems: "center",
} as const;

export function mapApiBookingStatusToClient(status: string): ClientBookingStatus | null {
  const normalized = status.trim().toLowerCase();
  if (normalized === "requested") return "requested";
  if (normalized === "br_accepted" || normalized === "br accepted") return "br_accepted";
  if (normalized === "confirmed") return "confirmed";
  if (normalized === "in_progress" || normalized === "in progress") return "in_progress";
  if (normalized === "completed") return "completed";
  if (normalized === "cancelled") return "cancelled";
  if (normalized === "no_show" || normalized === "no show") return "no_show";
  if (normalized === "invalid") return "invalid";
  // Legacy alias — map to br_accepted when prepay was outstanding after accept.
  if (normalized === "waiting_for_prepayment" || normalized === "waiting for prepayment") {
    return "br_accepted";
  }
  return null;
}

export function mapClientStatusToApi(status: ClientBookingStatus): string {
  if (status === "br_accepted") return "br_accepted";
  if (status === "confirmed") return "confirmed";
  if (status === "completed") return "completed";
  if (status === "cancelled") return "cancelled";
  if (status === "no_show") return "no_show";
  if (status === "invalid") return "invalid";
  if (status === "in_progress") return "in_progress";
  return "requested";
}
