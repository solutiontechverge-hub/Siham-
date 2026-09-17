import type { BookingDrawerParticipantKind } from "./BookingDrawerParticipantActions";

export const DEFAULT_FIXED_LOCATION_MAX_GUESTS = 1;

/** Sticky footer: FL guest; DL guest (no project) / model+planning (project) + buffer. */
export function resolveBookingDrawerParticipantKinds({
  location,
  projectEnabled,
  extraGuestCount,
  maxFixedLocationGuests = DEFAULT_FIXED_LOCATION_MAX_GUESTS,
  primaryClientIsGuest = false,
}: {
  location: string;
  projectEnabled: boolean;
  extraGuestCount: number;
  maxFixedLocationGuests?: number;
  /** Primary client is Guest — hide + Add Guest (extra guests only for non-guest primaries). */
  primaryClientIsGuest?: boolean;
}): BookingDrawerParticipantKind[] {
  let kinds: BookingDrawerParticipantKind[];
  if (location === "FL") {
    kinds = extraGuestCount < maxFixedLocationGuests ? ["guest"] : [];
  } else if (location !== "DL") {
    kinds = [];
  } else if (projectEnabled) {
    kinds = ["model", "planning", "buffer"];
  } else {
    kinds = ["guest", "buffer"];
  }
  if (primaryClientIsGuest) {
    return kinds.filter((k) => k !== "guest" && k !== "guestModel");
  }
  return kinds;
}
