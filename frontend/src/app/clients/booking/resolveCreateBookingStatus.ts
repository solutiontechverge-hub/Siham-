import type { BookingRequestDirection, ClientBookingStatus } from "./clientBookingRecords";

/** Client-created booking: DL → BR outgoing (requested); FL → confirmed or pending prepay. */
export function resolveCreateBookingStatus(input: {
  locationMode: "fixed" | "desired";
  requiresPrepayment: boolean;
}): { status: ClientBookingStatus; bookingRequestDirection?: BookingRequestDirection } {
  if (input.locationMode === "desired") {
    return { status: "requested", bookingRequestDirection: "outgoing" };
  }
  if (input.requiresPrepayment) {
    return { status: "requested" };
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
