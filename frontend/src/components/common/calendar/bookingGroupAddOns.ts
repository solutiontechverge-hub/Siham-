/**
 * Group / Add-ons (⋮) menu visibility and protective-fee clamping.
 * Prepayment is proposable only when not already shown/paid; protective fees need policy + trigger tags.
 */
import {
  canTriggerKilometerAllowance,
  clampProtectiveFeePercent,
  isPolicyFeeConfigured,
  parsePolicyPercentCeiling,
  shouldTriggerLateCancellationFee,
  shouldTriggerLateRescheduleFee,
  shouldTriggerNoShowFee,
} from "./bookingFeeTriggers";

export {
  clampProtectiveFeePercent,
  isPolicyFeeConfigured,
  parsePolicyPercentCeiling,
};

export function canAddPrepayment(input: {
  alreadyShown?: boolean;
  /** Client/pro already collected prepayment — never offer Add again. */
  alreadyPaid?: boolean;
}): boolean {
  if (input.alreadyPaid) return false;
  return !input.alreadyShown;
}

export function canAddLateCancellation(input: {
  policyPercent?: number | string | null;
  status?: string | null;
  cancelledServiceIds?: readonly string[] | null;
  alreadyShown?: boolean;
  appointmentStartMs?: number | null;
  noticeHours?: number | null;
  noticeMinutes?: number | null;
  nowMs?: number;
}): boolean {
  return shouldTriggerLateCancellationFee(input);
}

export function canAddLateRescheduling(input: {
  policyPercent?: number | string | null;
  scheduleEdited?: boolean | null;
  alreadyShown?: boolean;
  appointmentStartMs?: number | null;
  noticeHours?: number | null;
  noticeMinutes?: number | null;
  nowMs?: number;
}): boolean {
  return shouldTriggerLateRescheduleFee(input);
}

export function canAddNoShowFee(input: {
  policyPercent?: number | string | null;
  status?: string | null;
  alreadyShown?: boolean;
}): boolean {
  return shouldTriggerNoShowFee(input);
}

export function canAddKilometerAllowance(input: {
  location?: string | null;
  alreadyShown?: boolean;
}): boolean {
  return canTriggerKilometerAllowance(input);
}

/**
 * ⋮ restore after remove — same gates as canAdd* (hidden + trigger still active).
 * Protective: template + event. KM: DL only, manual, no template membership.
 */
export const canRestoreLateCancellation = canAddLateCancellation;
export const canRestoreLateRescheduling = canAddLateRescheduling;
export const canRestoreNoShowFee = canAddNoShowFee;
export const canRestoreKilometerAllowance = canAddKilometerAllowance;

/** Whether a protective fee amount is due and checkout should be offered. */
export function canCheckoutProtectiveFee(input: {
  status?: string | null;
  showLateCancellation?: boolean;
  lateCancellationFeeAmount?: number;
  showNoShowFee?: boolean;
  noShowFeeAmount?: number;
}): boolean {
  const status = String(input.status ?? "");
  if (status === "Cancelled") {
    return Boolean(
      input.showLateCancellation && (input.lateCancellationFeeAmount ?? 0) > 0,
    );
  }
  if (status === "No Show") {
    return Boolean(input.showNoShowFee && (input.noShowFeeAmount ?? 0) > 0);
  }
  return false;
}
