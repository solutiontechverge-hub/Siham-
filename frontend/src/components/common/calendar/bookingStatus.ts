import { alpha, type SxProps, type Theme } from "@mui/material/styles";
import type {
  CalendarBookingStatus,
  CalendarBookingType,
  CalendarEvent,
} from "../../../app/professionals/fixed-location/calendar/calendar.data";
import { isOutgoingBookingRequest } from "./bookingRequestNegotiation";

export type BookingScenarioIndicator = "BR" | "EBR" | "ER" | "E";

export const ONLINE_BOOKING_STATUSES: readonly CalendarBookingStatus[] = [
  "Confirmed",
  "Requested",
  "Completed",
  "Cancelled",
  "Invalid",
  "No Show",
];

export const OFFLINE_BOOKING_STATUSES: readonly CalendarBookingStatus[] = [
  "Confirmed",
  "Completed",
  "Cancelled",
  "No Show",
];

export const BOOKING_SCENARIO_LABELS: Record<BookingScenarioIndicator, string> = {
  BR: "Booking Request",
  EBR: "Edited Booking request",
  ER: "Edit Request",
  E: "Edited",
};

type StatusTheme = {
  accent: string;
  cardBg: string;
  cardBorder: string;
  chipBg: string;
  chipColor: string;
  chipBorder: string;
};

export const BOOKING_STATUS_THEME: Record<CalendarBookingStatus, StatusTheme> = {
  Requested: {
    accent: "#FBB500",
    cardBg: "rgba(253, 246, 239, 0.6)",
    cardBorder: "#FBB500",
    chipBg: "#FBB500",
    chipColor: "#FFFFFF",
    chipBorder: "#FBB500",
  },
  Confirmed: {
    accent: "#22B573",
    cardBg: "#ECFFF4",
    cardBorder: "#75D9A6",
    chipBg: "#FFFFFF",
    chipColor: "#22B573",
    chipBorder: "#75D9A6",
  },
  Completed: {
    accent: "#74839A",
    cardBg: "#F7F9FC",
    cardBorder: "#B6C0CE",
    chipBg: "#F7F9FC",
    chipColor: "#74839A",
    chipBorder: "#B6C0CE",
  },
  Cancelled: {
    accent: "#E85D5D",
    cardBg: "#FFF1F1",
    cardBorder: "#F4A3A3",
    chipBg: alpha("#E85D5D", 0.1),
    chipColor: "#D94545",
    chipBorder: alpha("#E85D5D", 0.45),
  },
  "No Show": {
    accent: "#8B98AA",
    cardBg: "#F4F6F9",
    cardBorder: "#BFC8D4",
    chipBg: "#EEF0F5",
    chipColor: "#5C6778",
    chipBorder: "#8B98AA",
  },
  Invalid: {
    accent: "#EF4444",
    cardBg: "#FFF1F1",
    cardBorder: "#F4A3A3",
    chipBg: alpha("#EF4444", 0.12),
    chipColor: "#DC2626",
    chipBorder: alpha("#EF4444", 0.45),
  },
};

export function isOnlineBookingType(bookingType?: CalendarBookingType) {
  return bookingType === "Online" || bookingType === "Requests";
}

export function statusChipSx(status: CalendarBookingStatus): SxProps<Theme> {
  const theme = BOOKING_STATUS_THEME[status] ?? BOOKING_STATUS_THEME["No Show"];
  return {
    bgcolor: theme.chipBg,
    color: theme.chipColor,
    borderColor: theme.chipBorder,
  };
}

export function statusCardAccent(status: CalendarBookingStatus) {
  const theme = BOOKING_STATUS_THEME[status] ?? BOOKING_STATUS_THEME["No Show"];
  return { color: theme.accent, bg: theme.cardBg, border: theme.cardBorder };
}

export function statusAccentColor(status: CalendarBookingStatus) {
  return (BOOKING_STATUS_THEME[status] ?? BOOKING_STATUS_THEME["No Show"]).accent;
}

export function resolveBookingScenario(event: Pick<CalendarEvent, "bookingType" | "status" | "bookingScenario">) {
  if (!isOnlineBookingType(event.bookingType)) return undefined;
  if (event.bookingScenario) return event.bookingScenario;
  if (event.status === "Requested") return "BR" as const;
  return undefined;
}

export function getBookingScenarioIndicators(
  event: Pick<CalendarEvent, "bookingType" | "status" | "bookingScenario">,
): BookingScenarioIndicator[] {
  const scenario = resolveBookingScenario(event);
  return scenario ? [scenario] : [];
}

export function isAllowedStatusForBookingType(status: CalendarBookingStatus, bookingType?: CalendarBookingType) {
  const allowed = isOnlineBookingType(bookingType) ? ONLINE_BOOKING_STATUSES : OFFLINE_BOOKING_STATUSES;
  return allowed.includes(status);
}

export function isActiveBookingRequest(
  event: Pick<CalendarEvent, "status" | "bookingScenario" | "bookingType"> | null | undefined,
) {
  if (!event || event.status !== "Requested") return false;
  if (event.bookingScenario === "BR" || event.bookingScenario === "EBR") return true;
  return isOnlineBookingType(event.bookingType);
}

export function canDiscardBookingRequest(
  event: Pick<CalendarEvent, "status" | "bookingScenario" | "bookingType" | "details"> | null | undefined,
) {
  return isOutgoingBookingRequest(event);
}

/** Client accepted the booking request — status is confirmed while BR indicator remains. */
export function isBookingRequestAccepted(
  event: Pick<CalendarEvent, "status" | "bookingScenario"> | null | undefined,
) {
  if (!event || event.bookingScenario !== "BR") return false;
  return event.status === "Confirmed" || event.status === "Completed";
}

/** Professional or client rejected the booking request — invalid while BR indicator remains. */
export function isBookingRequestRejected(
  event: Pick<CalendarEvent, "status" | "bookingScenario"> | null | undefined,
) {
  if (!event || event.bookingScenario !== "BR") return false;
  return event.status === "Invalid";
}
