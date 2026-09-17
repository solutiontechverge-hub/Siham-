"use client";

import { useProfessionalFixedLocationCalendar } from "./useProfessionalFixedLocationCalendar";

import ProfessionalFixedLocationCalendarBookingDrawerDetailsFeesPaymentLocation from "./ProfessionalFixedLocationCalendarBookingDrawerDetailsFeesPaymentLocation";

import ProfessionalFixedLocationCalendarBookingDrawerDetailsFeesPaymentContact from "./ProfessionalFixedLocationCalendarBookingDrawerDetailsFeesPaymentContact";

import ProfessionalFixedLocationCalendarBookingDrawerDetailsFeesPaymentProtective from "./ProfessionalFixedLocationCalendarBookingDrawerDetailsFeesPaymentProtective";

import ProfessionalFixedLocationCalendarBookingDrawerDetailsFeesPaymentPrepayment from "./ProfessionalFixedLocationCalendarBookingDrawerDetailsFeesPaymentPrepayment";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarBookingDrawerDetailsFeesPaymentBag = Pick<
  Vm,
  | "addClientSource"
  | "beginExistingBookingEdit"
  | "bookingPhoneDraft"
  | "canMutateDrawerContents"
  | "desiredLocationDraft"
  | "desiredVisitMunicipalityOptions"
  | "drawerPaymentMethod"
  | "exceededCancellationWindow"
  | "fixedLocationAddress"
  | "grid"
  | "isDrawerPrepaymentPaid"
  | "isViewingExisting"
  | "kilometerAllowanceAmount"
  | "kilometerAllowanceDraft"
  | "lateCancelNoticeLabel"
  | "lateCancellationFeeAmount"
  | "lateCancellationFeePercent"
  | "lateCancellationFeePercentCeiling"
  | "lateCancellationFeePercentDefault"
  | "lateRescheduleFeeAmount"
  | "lateRescheduleFeePercent"
  | "lateRescheduleFeePercentCeiling"
  | "lateRescheduleFeePercentDefault"
  | "m"
  | "noShowFeeAmount"
  | "noShowFeePercent"
  | "noShowFeePercentCeiling"
  | "noShowFeePercentDefault"
  | "paymentMethod"
  | "paymentMethodPolicy"
  | "persistedPaymentIsOffline"
  | "prepaymentAmount"
  | "prepaymentPercent"
  | "prepaymentSectionTitle"
  | "remainingAfterPrepayment"
  | "selectedClient"
  | "setBookingPhoneDraft"
  | "setCancellationFeeAt"
  | "setDesiredLocationDraft"
  | "setExceededCancellationWindow"
  | "setKilometerAllowanceDraft"
  | "setLateCancellationFeePercent"
  | "setLateCancellationFeePercentCeiling"
  | "setLateRescheduleFeePercent"
  | "setLateRescheduleFeePercentCeiling"
  | "setNoShowFeePercent"
  | "setNoShowFeePercentCeiling"
  | "setPaymentMethod"
  | "setPrepaymentPercent"
  | "setSelectedClient"
  | "setShowKilometerAllowance"
  | "setShowLateCancellation"
  | "setShowLateRescheduling"
  | "setShowNoShowFee"
  | "setShowPrepayment"
  | "showKilometerAllowance"
  | "showLateCancellation"
  | "showLateRescheduling"
  | "showNoShowFee"
  | "showPrepayment"
  | "silentFieldUpdates"
  | "slotErrors"
  | "slotLocation"
>;

export type ProfessionalFixedLocationCalendarBookingDrawerDetailsFeesPaymentProps = {
  bag: ProfessionalFixedLocationCalendarBookingDrawerDetailsFeesPaymentBag;
};

/** Location, phone, fees, payment method */
export default function ProfessionalFixedLocationCalendarBookingDrawerDetailsFeesPayment({ bag }: ProfessionalFixedLocationCalendarBookingDrawerDetailsFeesPaymentProps) {
  return (
    <>
      <ProfessionalFixedLocationCalendarBookingDrawerDetailsFeesPaymentLocation bag={bag} />
      <ProfessionalFixedLocationCalendarBookingDrawerDetailsFeesPaymentContact bag={bag} />
      <ProfessionalFixedLocationCalendarBookingDrawerDetailsFeesPaymentProtective bag={bag} />
      <ProfessionalFixedLocationCalendarBookingDrawerDetailsFeesPaymentPrepayment bag={bag} />
    </>
  );
}
