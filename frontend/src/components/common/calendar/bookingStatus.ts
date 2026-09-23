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
import { parseStoredEbrFromNotes } from "./bookingEventDetails";
import { prepayBlocksConfirmation } from "./bookingAcknowledgment";
import { resolveCalendarPrepaymentStatus } from "./prepaymentStatus";

export type BookingScenarioIndicator = "BR" | "EBR" | "ER" | "E";

export const ONLINE_BOOKING_STATUSES: readonly CalendarBookingStatus[] = [
  "Confirmed",
  "Requested",
  "BR Accepted",
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
];

export const BOOKING_SCENARIO_LABELS: Record<BookingScenarioIndicator, string> = {
  BR: "Booking Request",
  EBR: "Edited Booking request",
  ER: "Edit Request",
  E: "Edit",
};

/** Visible badge text — keep BR/EBR/ER abbreviated, spell out Edit. */
export function scenarioIndicatorDisplayLabel(
  indicator: BookingScenarioIndicator,
): string {
  if (indicator === "E") return "Edit";
  return indicator;
}

/** Confirmed booking that was edited after ER/EBR accept (date/time or lines). */
export function isConfirmedEditedEvent(
  event: Pick<CalendarEvent, "bookingType" | "status" | "bookingScenario" | "details">,
): boolean {
  return event.status === "Confirmed" && resolveBookingScenario(event) === "E";
}

export function calendarBookingStatusLabel(
  event: Pick<CalendarEvent, "bookingType" | "status" | "bookingScenario" | "details">,
): string {
  if (isConfirmedEditedEvent(event)) return "Confirmed Edited";
  const method = String(event.details?.paymentMethod ?? "")
    .toLowerCase()
    .replace(/[\s_-]/g, "");
  const prepaidOffline =
    event.status === "Confirmed" &&
    Boolean(event.details?.showPrepayment) &&
    event.details?.prepaymentStatus === "confirmed" &&
    method.startsWith("offline");
  if (prepaidOffline) return "Prepaid Offline";
  // BR Accepted is an internal accept step — chip shows Confirmed; BR is the indicator.
  if (event.status === "BR Accepted") return "Confirmed";
  return event.status;
}

/** Pro accepted, but client still owes prepayment — not Confirmed yet. */
export function professionalWaitingForClientPrepay(
  event: Pick<CalendarEvent, "status" | "details">,
): boolean {
  if (event.status !== "BR Accepted") return false;
  return prepayBlocksConfirmation({
    prepayRequired: Boolean(event.details?.showPrepayment),
    prepayPaid: resolveCalendarPrepaymentStatus(event) === "confirmed",
  });
}

/** Chip/accent status on the professional calendar (unpaid prepay reads as Requested). */
export function professionalCalendarDisplayStatus(
  event: Pick<
    CalendarEvent,
    "status" | "details" | "bookingType" | "bookingScenario"
  >,
): CalendarBookingStatus {
  if (professionalWaitingForClientPrepay(event)) return "Requested";
  if (event.status === "BR Accepted") return "Confirmed";
  return event.status;
}

/** Professional calendar chip — BR Accepted with unpaid prepay reads as Requested. */
export function professionalCalendarStatusLabel(
  event: Pick<CalendarEvent, "status" | "details" | "bookingType" | "bookingScenario">,
): string {
  if (professionalWaitingForClientPrepay(event)) return "Requested";
  return calendarBookingStatusLabel(event);
}

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
    accent: "#F97316",
    cardBg: "rgba(255, 247, 237, 0.75)",
    cardBorder: "#F97316",
    chipBg: "#F97316",
    chipColor: "#FFFFFF",
    chipBorder: "#F97316",
  },
  "BR Accepted": {
    accent: "#22B573",
    cardBg: "#ECFFF4",
    cardBorder: "#75D9A6",
    chipBg: "#FFFFFF",
    chipColor: "#22B573",
    chipBorder: "#75D9A6",
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
    accent: "#3B82F6",
    cardBg: "#EFF6FF",
    cardBorder: alpha("#3B82F6", 0.35),
    chipBg: alpha("#3B82F6", 0.1),
    chipColor: "#2563EB",
    chipBorder: alpha("#3B82F6", 0.35),
  },
  Completed: {
    accent: "#98A2B3",
    cardBg: "#F9FAFB",
    cardBorder: "#D0D5DD",
    chipBg: "#F9FAFB",
    chipColor: "#98A2B3",
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
    accent: "#4B5563",
    cardBg: "#E5E7EB",
    cardBorder: "#9CA3AF",
    chipBg: "#D1D5DB",
    chipColor: "#4B5563",
    chipBorder: "#9CA3AF",
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
  return bookingType === "Online";
}

/** Online plus Desired Location "Project" bookings (BR / EBR / ER). */
export function supportsBookingRequestScenario(bookingType?: CalendarBookingType) {
  return isOnlineBookingType(bookingType) || bookingType === "Project";
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

export function resolveBookingScenario(
  event: Pick<CalendarEvent, "bookingType" | "status" | "bookingScenario" | "details">,
) {
  if (!supportsBookingRequestScenario(event.bookingType)) return undefined;
  if (event.details?.needsOk && event.details.ackScenario) {
    return event.details.ackScenario;
  }
  const scenario = event.bookingScenario;
  // BR Accepted → keep BR indicator (accepted badge), not as the status label.
  if (event.status === "BR Accepted") return "BR";
  // BR / EBR are pending-request markers only — clear once accepted or rejected
  // unless an OK acknowledgement is still outstanding.
  if (scenario === "BR" || scenario === "EBR") {
    if (event.status !== "Requested") return undefined;
    return scenario;
  }
  // Confirmed Edit (E) — booking changed after ER/EBR accept.
  if (scenario === "E") {
    if (event.status !== "Confirmed") return undefined;
    return scenario;
  }
  // ER stays on Confirmed while the edit request is pending (incoming or outgoing).
  if (scenario) return scenario;
  if (event.status === "Requested") return "BR" as const;
  return undefined;
}

export function getBookingScenarioIndicators(
  event: Pick<CalendarEvent, "bookingType" | "status" | "bookingScenario">,
): BookingScenarioIndicator[] {
  const scenario = resolveBookingScenario(event);
  return scenario ? [scenario] : [];
}

/** Pending BR / EBR / ER only — settled “E” is history, not an action. */
export function getActionRequiredScenarioIndicators(
  event: Pick<
    CalendarEvent,
    "bookingType" | "status" | "bookingScenario" | "details"
  >,
): Exclude<BookingScenarioIndicator, "E">[] {
  return getBookingScenarioIndicators(event).filter(
    (indicator): indicator is Exclude<BookingScenarioIndicator, "E"> =>
      indicator !== "E",
  );
}

export function isAllowedStatusForBookingType(status: CalendarBookingStatus, bookingType?: CalendarBookingType) {
  if (bookingType === "Offline") return OFFLINE_BOOKING_STATUSES.includes(status);
  return ONLINE_BOOKING_STATUSES.includes(status);
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

/** @deprecated BR badge is hidden after accept — kept for callers that still check. */
export function isBookingRequestAccepted(
  event: Pick<CalendarEvent, "status" | "bookingScenario"> | null | undefined,
) {
  if (!event) return false;
  if (event.status === "BR Accepted") return true;
  if (event.bookingScenario !== "BR") return false;
  return event.status === "Confirmed" || event.status === "Completed";
}

/** @deprecated BR badge is hidden after reject — kept for callers that still check. */
export function isBookingRequestRejected(
  event: Pick<CalendarEvent, "status" | "bookingScenario"> | null | undefined,
) {
  if (!event || event.bookingScenario !== "BR") return false;
  return event.status === "Invalid";
}

/** Client rejected an outgoing plain BR from the professional. Not EBR. */
export function isOutgoingPlainBookingRequestRejected(
  event:
    | Pick<CalendarEvent, "status" | "bookingScenario" | "details" | "notes">
    | null
    | undefined,
) {
  if (!event || event.status !== "Invalid") return false;
  if (
    event.bookingScenario === "EBR" ||
    event.bookingScenario === "ER" ||
    event.bookingScenario === "E"
  ) {
    return false;
  }
  if (event.details?.requestDirection !== "outgoing") return false;
  if (event.notes) {
    const ebr = parseStoredEbrFromNotes(event.notes);
    if (ebr) return false;
  }
  return true;
}
