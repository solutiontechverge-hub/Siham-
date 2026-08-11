import type { BookingRequestDirection, ClientBookingStatus } from "./clientBookingRecords";

/**
 * Client create status matrix:
 * - Fixed Location → Confirmed (client + pro)
 * - Desired Location → Requested BR outgoing (pro sees incoming)
 */
export function resolveCreateBookingStatus(input: {
  locationMode: "fixed" | "desired";
}): { status: ClientBookingStatus; bookingRequestDirection?: BookingRequestDirection } {
  if (input.locationMode === "desired") {
    return { status: "requested", bookingRequestDirection: "outgoing" };
  }
  return { status: "confirmed" };
}

export function resolveCreateCheckoutPath(input: {
  locationMode: "fixed" | "desired";
  requiresPrepayment: boolean;
}): string {
  if (input.locationMode === "desired") {
    return "/clients/booking/checkout";
  }
  return input.requiresPrepayment ? "/clients/booking/checkout/prepaid" : "/clients/booking/checkout";
}
