"use client";

import {
  Stack,
} from "@mui/material";

import { useProfessionalFixedLocationCalendar } from "./useProfessionalFixedLocationCalendar";

import ProfessionalFixedLocationCalendarBookingDrawerDetailsStatusHeaderNoticesAlerts from "./ProfessionalFixedLocationCalendarBookingDrawerDetailsStatusHeaderNoticesAlerts";

import ProfessionalFixedLocationCalendarBookingDrawerDetailsStatusHeaderNoticesStatus from "./ProfessionalFixedLocationCalendarBookingDrawerDetailsStatusHeaderNoticesStatus";

import ProfessionalFixedLocationCalendarBookingDrawerDetailsStatusHeaderNoticesPayment from "./ProfessionalFixedLocationCalendarBookingDrawerDetailsStatusHeaderNoticesPayment";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarBookingDrawerDetailsStatusHeaderNoticesBag = Pick<
  Vm,
  | "businessResponseWindowInput"
  | "handleRestartResponseTime"
  | "handleDiscardBr"
  | "m"
  | "openActivityComparison"
  | "postBookingPendingPayment"
  | "responseTimeConfigured"
  | "selectedSlot"
  | "setFocusSalesCardId"
  | "setSlotDrawerTab"
  | "showExpiredResponseBanner"
  | "viewingBookingEvent"
  | "viewingBookingOverlapsBlockTime"
  | "viewingBookingPaymentDue"
>;

type Props = {
  bag: ProfessionalFixedLocationCalendarBookingDrawerDetailsStatusHeaderNoticesBag;
};

export default function ProfessionalFixedLocationCalendarBookingDrawerDetailsStatusHeaderNotices({
  bag,
}: Props) {
  const { viewingBookingEvent } = bag;

  if (!viewingBookingEvent) return null;

  return (
    <Stack spacing={1.25} sx={{ mt: 1.25 }}>
      <ProfessionalFixedLocationCalendarBookingDrawerDetailsStatusHeaderNoticesAlerts bag={bag} />
      <ProfessionalFixedLocationCalendarBookingDrawerDetailsStatusHeaderNoticesStatus bag={bag} />
      <ProfessionalFixedLocationCalendarBookingDrawerDetailsStatusHeaderNoticesPayment bag={bag} />
    </Stack>
  );
}
