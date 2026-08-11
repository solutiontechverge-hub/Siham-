import type { BookingRequestDirection } from "./clientBookingRecords";

/** API create payload statuses returned by the client create flow. */
export type CreateBookingResolvedStatus = "requested" | "confirmed";

/**
 * Client create status matrix:
 * - Fixed Location → Confirmed (client + pro)
 * - Desired Location → Requested BR outgoing (pro sees incoming)
 */
export function resolveCreateBookingStatus(input: {
  locationMode: "fixed" | "desired";
}): {
  status: CreateBookingResolvedStatus;
  bookingRequestDirection?: BookingRequestDirection;
} {
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
