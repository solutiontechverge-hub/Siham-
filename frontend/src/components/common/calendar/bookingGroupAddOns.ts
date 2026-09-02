/**
 * Group / Add-ons (⋮) menu visibility and protective-fee clamping.
 * Prepayment is always proposable; protective fees need policy + trigger tags.
 */

export function isPolicyFeeConfigured(
  policyPercent: number | string | null | undefined,
): boolean {
  const n = Number(policyPercent);
  return Number.isFinite(n) && n > 0;
}

export function parsePolicyPercentCeiling(
  policyPercent: number | string | null | undefined,
): number {
  const n = Number(policyPercent);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(100, n);
}

export function canAddPrepayment(input: { alreadyShown?: boolean }): boolean {
  return !input.alreadyShown;
}

export function canAddLateCancellation(input: {
  policyPercent?: number | string | null;
  status?: string | null;
  cancelledServiceIds?: readonly string[] | null;
  alreadyShown?: boolean;
}): boolean {
  if (input.alreadyShown) return false;
  if (!isPolicyFeeConfigured(input.policyPercent)) return false;
  const status = String(input.status ?? "");
  const cancelled =
    status === "Cancelled" ||
    (Array.isArray(input.cancelledServiceIds) &&
      input.cancelledServiceIds.length > 0);
  return cancelled;
}

export function canAddLateRescheduling(input: {
  policyPercent?: number | string | null;
  scheduleEdited?: boolean | null;
  alreadyShown?: boolean;
}): boolean {
  if (input.alreadyShown) return false;
  if (!isPolicyFeeConfigured(input.policyPercent)) return false;
  return Boolean(input.scheduleEdited);
}

export function canAddNoShowFee(input: {
  policyPercent?: number | string | null;
  status?: string | null;
  alreadyShown?: boolean;
}): boolean {
  if (input.alreadyShown) return false;
  if (!isPolicyFeeConfigured(input.policyPercent)) return false;
  return String(input.status ?? "") === "No Show";
}

/**
 * Protective fees may only decrease or stay at the policy ceiling — never increase.
 * Empty / invalid input clears to "" for controlled fields; numeric values clamp to [0, ceiling].
 */
export function clampProtectiveFeePercent(
  next: string,
  policyCeiling: number | string | null | undefined,
): string {
  const ceiling = parsePolicyPercentCeiling(policyCeiling);
  const trimmed = String(next ?? "").trim();
  if (!trimmed) return "";
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return "";
  const clamped = Math.max(0, Math.min(ceiling > 0 ? ceiling : 0, n));
  // Preserve integer vs decimal feel of input when possible
  if (Number.isInteger(clamped) && !trimmed.includes(".")) {
    return String(clamped);
  }
  return String(clamped);
}

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
