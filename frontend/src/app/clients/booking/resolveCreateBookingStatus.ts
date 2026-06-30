import type { BookingRequestDirection, ClientBookingStatus } from "./clientBookingRecords";

/** Client-created bookings start as requested until the professional accepts. */
export function resolveCreateBookingStatus(input: {
  locationMode: "fixed" | "desired";
}): { status: ClientBookingStatus; bookingRequestDirection?: BookingRequestDirection } {
  if (input.locationMode === "desired") {
    return { status: "requested", bookingRequestDirection: "outgoing" };
  }
  return { status: "requested" };
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
