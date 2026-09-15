import type { BookingDrawerParticipantKind } from "./BookingDrawerParticipantActions";

export const DEFAULT_FIXED_LOCATION_MAX_GUESTS = 1;

/** Sticky footer: FL guest; DL guest (no project) / model+planning (project) + buffer. */
export function resolveBookingDrawerParticipantKinds({
  location,
  projectEnabled,
  extraGuestCount,
  maxFixedLocationGuests = DEFAULT_FIXED_LOCATION_MAX_GUESTS,
}: {
  location: string;
  projectEnabled: boolean;
  extraGuestCount: number;
  maxFixedLocationGuests?: number;
}): BookingDrawerParticipantKind[] {
  if (location === "FL") {
    return extraGuestCount < maxFixedLocationGuests ? ["guest"] : [];
  }
  if (location !== "DL") return [];
  if (projectEnabled) return ["model", "planning", "buffer"];
  return ["guest", "buffer"];
}
