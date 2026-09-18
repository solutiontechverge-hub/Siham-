"use client";

import { useProfessionalFixedLocationCalendar } from "./useProfessionalFixedLocationCalendar";

import ProfessionalFixedLocationCalendarBookingDrawerDetailsFeesPaymentLocation from "./ProfessionalFixedLocationCalendarBookingDrawerDetailsFeesPaymentLocation";

import ProfessionalFixedLocationCalendarBookingDrawerDetailsFeesPaymentContact from "./ProfessionalFixedLocationCalendarBookingDrawerDetailsFeesPaymentContact";

import ProfessionalFixedLocationCalendarBookingDrawerDetailsFeesPaymentProtective from "./ProfessionalFixedLocationCalendarBookingDrawerDetailsFeesPaymentProtective";

import ProfessionalFixedLocationCalendarBookingDrawerDetailsFeesPaymentPrepayment from "./ProfessionalFixedLocationCalendarBookingDrawerDetailsFeesPaymentPrepayment";

import WithdrawErButton from "../../client-booking/WithdrawErButton";

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
  | "handleWithdrawEr"
  | "isDrawerPrepaymentPaid"
  | "isViewingExisting"
  | "isWithdrawingEr"
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
  | "showWithdrawEr"
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
      {bag.showWithdrawEr ? (
        <WithdrawErButton
          isLoading={bag.isWithdrawingEr}
          onClick={() => void bag.handleWithdrawEr()}
        />
      ) : null}
      <ProfessionalFixedLocationCalendarBookingDrawerDetailsFeesPaymentLocation bag={bag} />
      <ProfessionalFixedLocationCalendarBookingDrawerDetailsFeesPaymentContact bag={bag} />
      <ProfessionalFixedLocationCalendarBookingDrawerDetailsFeesPaymentProtective bag={bag} />
      <ProfessionalFixedLocationCalendarBookingDrawerDetailsFeesPaymentPrepayment bag={bag} />
    </>
  );
}
