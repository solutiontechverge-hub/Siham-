"use client";

import {
  alpha,
} from "@mui/material/styles";

import {
  BodyText,
} from "../../../ui/typography";

import { Box } from "@mui/material";

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
  | "isViewingBooking"
  | "lateCancellationFeeAmount"
  | "m"
  | "noShowFeeAmount"
  | "openActivityComparison"
  | "postBookingPendingPayment"
  | "responseTimeConfigured"
  | "setBookingActionAnchor"
  | "setFocusSalesCardId"
  | "setSlotDrawerTab"
  | "showExpiredResponseBanner"
  | "showLateCancellation"
  | "showNoShowFee"
  | "viewingBookingEvent"
  | "viewingBookingOverlapsBlockTime"
  | "viewingBookingPaymentDue"
>;

export type ProfessionalFixedLocationCalendarBookingDrawerDetailsStatusHeaderProps = {
  bag: ProfessionalFixedLocationCalendarBookingDrawerDetailsStatusHeaderBag;
};

/** Actions / status header (viewing) or New Booking title */
export default function ProfessionalFixedLocationCalendarBookingDrawerDetailsStatusHeader({ bag }: ProfessionalFixedLocationCalendarBookingDrawerDetailsStatusHeaderProps) {
  const {
    isViewingBooking,
    m,
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
      )}
    </>
  );
}
