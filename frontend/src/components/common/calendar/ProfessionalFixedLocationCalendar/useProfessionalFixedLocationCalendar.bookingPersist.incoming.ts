import type { UseProfessionalFixedLocationCalendarBookingPersistArgs } from "./useProfessionalFixedLocationCalendar.bookingPersist";
import { useProfessionalFixedLocationCalendarBookingPersistIncomingAccept } from "./useProfessionalFixedLocationCalendar.bookingPersist.incoming.accept";
import { useProfessionalFixedLocationCalendarBookingPersistIncomingReject } from "./useProfessionalFixedLocationCalendar.bookingPersist.incoming.reject";

export function useProfessionalFixedLocationCalendarBookingPersistIncoming(
  args: UseProfessionalFixedLocationCalendarBookingPersistArgs,
) {
  const { handleAcceptIncomingRequest } =
    useProfessionalFixedLocationCalendarBookingPersistIncomingAccept(args);
  const { handleRejectIncomingRequest, handleStartIncomingEdit } =
    useProfessionalFixedLocationCalendarBookingPersistIncomingReject(args);

  return {
    handleAcceptIncomingRequest,
    handleRejectIncomingRequest,
    handleStartIncomingEdit,
  };
}
