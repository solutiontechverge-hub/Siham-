import { alpha, type SxProps, type Theme } from "@mui/material/styles";

const withAlpha = (hex: string, opacity: number) => {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return hex;
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};
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
  "In Progress",
  "Completed",
  "Cancelled",
  "Invalid",
  "No Show",
];

export const OFFLINE_BOOKING_STATUSES: readonly CalendarBookingStatus[] = [
  "Confirmed",
  "In Progress",
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
  "In Progress": {
    accent: "#21B8BF",
    cardBg: "#E9F8F9",
    cardBorder: alpha("#21B8BF", 0.35),
    chipBg: alpha("#21B8BF", 0.1),
    chipColor: "#149CA7",
    chipBorder: alpha("#21B8BF", 0.35),
  },
  Completed: {
    accent: "#667085",
    cardBg: "#F9FAFB",
    cardBorder: "#D0D5DD",
    chipBg: "#F9FAFB",
    chipColor: "#667085",
    chipBorder: "#D0D5DD",
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
    accent: "#667085",
    cardBg: "#D0D5DD",
    cardBorder: "#D0D5DD",
    chipBg: "#D0D5DD",
    chipColor: "#667085",
    chipBorder: "#D0D5DD",
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

export function statusCardAccent(status: CalendarBookingStatus, customAccent?: string) {
  if (customAccent) {
    return {
      color: customAccent,
      bg: withAlpha(customAccent, status === "Requested" ? 0.14 : 0.1),
      border: customAccent,
    };
  }
  const theme = BOOKING_STATUS_THEME[status] ?? BOOKING_STATUS_THEME["No Show"];
  return { color: theme.accent, bg: theme.cardBg, border: theme.cardBorder };
}

export function statusChipSxWithOverride(
  status: CalendarBookingStatus,
  customAccent?: string,
): SxProps<Theme> {
  if (!customAccent) return statusChipSx(status);
  const onSolid = status === "Requested";
  return {
    bgcolor: onSolid ? customAccent : withAlpha(customAccent, 0.12),
    color: onSolid ? "#FFFFFF" : customAccent,
    borderColor: customAccent,
  };
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
