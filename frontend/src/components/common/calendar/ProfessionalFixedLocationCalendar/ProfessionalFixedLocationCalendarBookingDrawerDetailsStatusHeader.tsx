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

/** Actions / status header (viewing) or New Booking title */
export default function ProfessionalFixedLocationCalendarBookingDrawerDetailsStatusHeader({ bag }: ProfessionalFixedLocationCalendarBookingDrawerDetailsStatusHeaderProps) {
  const {
    isViewingBooking,
    m,
    selectedSlot,
    viewingBookingEvent,
  } = bag;

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
            end={selectedSlot?.end}
          />
        </Stack>
      )}
    </>
  );
}
