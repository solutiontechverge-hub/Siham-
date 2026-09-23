import type {
  CalendarBookingStatus,
  CalendarEvent,
} from "../../../app/professionals/fixed-location/calendar/calendar.data";

/**
 * Connected-chain badge rule:
 * - Anchor (first) block always shows the status badge.
 * - Non-anchor blocks hide the badge when status matches the chain.
 * - Divergent blocks break away and show their own badge.
 */
export function hideConnectedChainStatusBadge(input: {
  isAnchor: boolean;
  blockStatus: CalendarBookingStatus;
  chainStatus: CalendarBookingStatus;
}): boolean {
  if (input.isAnchor) return false;
  return input.blockStatus === input.chainStatus;
}

/** Per-service / per-guest status when it diverges from the booking shell. */
export function resolveConnectedChainBlockStatus(
  event: Pick<CalendarEvent, "status" | "details">,
  block: { serviceId?: string | null; guestId?: string | null },
): CalendarBookingStatus {
  const serviceId = String(block.serviceId ?? "").trim();
  const guestId = String(block.guestId ?? "").trim();
  const cancelled = event.details?.cancelledServiceIds ?? [];
  if (
    serviceId &&
    cancelled.some((id) => String(id).trim() === serviceId)
  ) {
    return "Cancelled";
  }
  const noShows = event.details?.noShowParticipantIds ?? [];
  if (
    guestId &&
    noShows.some((id) => String(id).trim() === guestId)
  ) {
    return "No Show";
  }
  // Main-client services: "client" id from the no-show modal.
  if (
    !guestId &&
    serviceId &&
    noShows.some((id) => String(id).trim() === "client")
  ) {
    return "No Show";
  }
  return event.status;
}
