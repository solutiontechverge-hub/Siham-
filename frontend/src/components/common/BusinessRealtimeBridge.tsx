"use client";

import { useBookingRealtimeSync } from "../../hooks/useBookingRealtimeSync";
import { useBusinessRealtimeSync } from "../../hooks/useBusinessRealtimeSync";

/** App-wide: listing/calendar business events + BC/client booking status → Professional portal. */
export default function BusinessRealtimeBridge() {
  useBusinessRealtimeSync();
  // BC = Business Client (company) / Mollure IC — updateMyBooking emits bookings:changed.
  useBookingRealtimeSync();
  return null;
}
