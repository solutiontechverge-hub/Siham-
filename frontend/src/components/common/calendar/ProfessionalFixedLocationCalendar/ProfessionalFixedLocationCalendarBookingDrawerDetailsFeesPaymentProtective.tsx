"use client";

import { useProfessionalFixedLocationCalendar } from "./useProfessionalFixedLocationCalendar";
import ProtectiveFeeCard from "./ProfessionalFixedLocationCalendarBookingDrawerDetailsFeesPaymentProtectiveCard";

type Vm = ReturnType<typeof useProfessionalFixedLocationCalendar>;

export type ProfessionalFixedLocationCalendarBookingDrawerDetailsFeesPaymentProtectiveBag = Pick<
  Vm,
  | "beginExistingBookingEdit"
  | "canMutateDrawerContents"
  | "exceededCancellationWindow"
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
  | "setCancellationFeeAt"
  | "setExceededCancellationWindow"
  | "setLateCancellationFeePercent"
  | "setLateCancellationFeePercentCeiling"
  | "setLateRescheduleFeePercent"
  | "setLateRescheduleFeePercentCeiling"
  | "setNoShowFeePercent"
  | "setNoShowFeePercentCeiling"
  | "setShowLateCancellation"
  | "setShowLateRescheduling"
  | "setShowNoShowFee"
  | "showLateCancellation"
  | "showLateRescheduling"
  | "showNoShowFee"
>;

type Props = {
  bag: ProfessionalFixedLocationCalendarBookingDrawerDetailsFeesPaymentProtectiveBag;
};

export default function ProfessionalFixedLocationCalendarBookingDrawerDetailsFeesPaymentProtective({ bag }: Props) {
  const {
    beginExistingBookingEdit,
    canMutateDrawerContents,
    exceededCancellationWindow,
    lateCancelNoticeLabel,
    lateCancellationFeeAmount,
    lateCancellationFeePercent,
    lateCancellationFeePercentCeiling,
    lateCancellationFeePercentDefault,
    lateRescheduleFeeAmount,
    lateRescheduleFeePercent,
    lateRescheduleFeePercentCeiling,
    lateRescheduleFeePercentDefault,
    m,
    noShowFeeAmount,
    noShowFeePercent,
    noShowFeePercentCeiling,
    noShowFeePercentDefault,
    setCancellationFeeAt,
    setExceededCancellationWindow,
    setLateCancellationFeePercent,
    setLateCancellationFeePercentCeiling,
    setLateRescheduleFeePercent,
    setLateRescheduleFeePercentCeiling,
    setNoShowFeePercent,
    setNoShowFeePercentCeiling,
    setShowLateCancellation,
    setShowLateRescheduling,
    setShowNoShowFee,
    showLateCancellation,
    showLateRescheduling,
    showNoShowFee,
  } = bag;

  return (
    <>
      {showLateCancellation ? (
        <ProtectiveFeeCard
          m={m}
          title="Late Cancellation"
          removeAriaLabel="Remove late cancellation"
          canMutateDrawerContents={canMutateDrawerContents}
          beginExistingBookingEdit={beginExistingBookingEdit}
          percent={lateCancellationFeePercent}
          percentCeiling={lateCancellationFeePercentCeiling}
          percentDefault={lateCancellationFeePercentDefault}
          amount={lateCancellationFeeAmount}
          onRemove={() => {
            setShowLateCancellation(false);
            setLateCancellationFeePercent("");
            setLateCancellationFeePercentCeiling("");
            setCancellationFeeAt(undefined);
            setExceededCancellationWindow(undefined);
          }}
          onPercentChange={setLateCancellationFeePercent}
          notice={
            <>
              {lateCancelNoticeLabel}
              {typeof exceededCancellationWindow === "boolean"
                ? exceededCancellationWindow
                  ? " · Outside notice window"
                  : " · Within notice window"
                : null}
            </>
          }
        />
      ) : null}

      {showLateRescheduling ? (
        <ProtectiveFeeCard
          m={m}
          title="Late Rescheduling"
          removeAriaLabel="Remove late rescheduling"
          canMutateDrawerContents={canMutateDrawerContents}
          beginExistingBookingEdit={beginExistingBookingEdit}
          percent={lateRescheduleFeePercent}
          percentCeiling={lateRescheduleFeePercentCeiling}
          percentDefault={lateRescheduleFeePercentDefault}
          amount={lateRescheduleFeeAmount}
          onRemove={() => {
            setShowLateRescheduling(false);
            setLateRescheduleFeePercent("");
            setLateRescheduleFeePercentCeiling("");
          }}
          onPercentChange={setLateRescheduleFeePercent}
          notice="Fee applies when rescheduling after the allowed notice period"
        />
      ) : null}

      {showNoShowFee ? (
        <ProtectiveFeeCard
          m={m}
          title="No-Show Fee"
          removeAriaLabel="Remove no-show fee"
          canMutateDrawerContents={canMutateDrawerContents}
          beginExistingBookingEdit={beginExistingBookingEdit}
          percent={noShowFeePercent}
          percentCeiling={noShowFeePercentCeiling}
          percentDefault={noShowFeePercentDefault}
          amount={noShowFeeAmount}
          onRemove={() => {
            setShowNoShowFee(false);
            setNoShowFeePercent("");
            setNoShowFeePercentCeiling("");
          }}
          onPercentChange={setNoShowFeePercent}
          notice="Fee for a guest tagged No Show. You may only decrease or remove this fee."
        />
      ) : null}
    </>
  );
}
