"use client";

import {
  alpha,
} from "@mui/material/styles";

import {
  BodyText,
} from "../../../ui/typography";

import { Box, Stack } from "@mui/material";

import BookingStartEndTimeRow from "../../BookingStartEndTimeRow";

import { useProfessionalFixedLocationCalendar } from "./useProfessionalFixedLocationCalendar";

import ProfessionalFixedLocationCalendarBookingDrawerDetailsStatusHeaderActions from "./ProfessionalFixedLocationCalendarBookingDrawerDetailsStatusHeaderActions";

import ProfessionalFixedLocationCalendarBookingDrawerDetailsStatusHeaderNotices from "./ProfessionalFixedLocationCalendarBookingDrawerDetailsStatusHeaderNotices";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarBookingDrawerDetailsStatusHeaderBag = Pick<
  Vm,
  | "bookingActionAnchor"
  | "bookingGuests"
  | "businessResponseWindowInput"
  | "handleBookingActionSelect"
  | "handleRestartResponseTime"
  | "isMollureClientPath"
  | "isViewingBooking"
  | "lateCancellationFeeAmount"
  | "m"
  | "noShowFeeAmount"
  | "openActivityComparison"
  | "openBookingMessages"
  | "postBookingPendingPayment"
  | "responseTimeConfigured"
  | "selectedServices"
  | "selectedSlot"
  | "setBookingActionAnchor"
  | "setFocusSalesCardId"
  | "setSlotDrawerTab"
  | "showExpiredResponseBanner"
  | "showLateCancellation"
  | "showNoShowFee"
  | "viewingBookingEvent"
  | "viewingBookingOverlapsBlockTime"
  | "viewingBookingPaymentDue"
  | "viewingBookingUnread"
>;

export type ProfessionalFixedLocationCalendarBookingDrawerDetailsStatusHeaderProps = {
  bag: ProfessionalFixedLocationCalendarBookingDrawerDetailsStatusHeaderBag;
};

/** True when duration is known from services / planning / buffer — not grid +15. */
function hasComputedBookingEnd(
  selectedServices: Vm["selectedServices"],
  bookingGuests: Vm["bookingGuests"],
): boolean {
  if (selectedServices.length > 0) return true;
  return bookingGuests.some(
    (g) =>
      g.services.length > 0 ||
      Boolean(g.planningStartTime?.trim() && g.planningEndTime?.trim()) ||
      Boolean(g.bufferStartTime?.trim() && g.bufferEndTime?.trim()),
  );
}

/** Actions / status header (viewing) or New Booking title */
export default function ProfessionalFixedLocationCalendarBookingDrawerDetailsStatusHeader({ bag }: ProfessionalFixedLocationCalendarBookingDrawerDetailsStatusHeaderProps) {
  const {
    bookingGuests,
    isViewingBooking,
    m,
    selectedServices,
    selectedSlot,
    viewingBookingEvent,
  } = bag;

  const newBookingEnd = hasComputedBookingEnd(selectedServices, bookingGuests)
    ? selectedSlot?.end
    : undefined;

  return (
    <>
      {isViewingBooking && viewingBookingEvent ? (
        <Box>
          <ProfessionalFixedLocationCalendarBookingDrawerDetailsStatusHeaderActions bag={bag} />
          <ProfessionalFixedLocationCalendarBookingDrawerDetailsStatusHeaderNotices bag={bag} />
        </Box>
      ) : (
        <Stack spacing={1.25}>
          <BodyText
            sx={{
              fontWeight: 900,
              color: alpha(m.navy, 0.88),
              fontSize: 16,
              letterSpacing: "-0.01em",
            }}
          >
            New Booking
          </BodyText>
          <BookingStartEndTimeRow
            start={selectedSlot?.start}
            end={newBookingEnd}
          />
        </Stack>
      )}
    </>
  );
}
