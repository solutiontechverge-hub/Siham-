import type { BookingDrawerParticipantKind } from "./BookingDrawerParticipantActions";

export const DEFAULT_FIXED_LOCATION_MAX_GUESTS = 1;

/** Sticky footer actions: FL guest; DL model (+ planning/buffer on project). */
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
  return ["model", "buffer"];
}
