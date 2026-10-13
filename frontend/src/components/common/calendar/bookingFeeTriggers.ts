/**
 * Business Template fee triggers for the booking side panel.
 * Protective fees: template policy + real event. KM: DL manual (no template required).
 */
import { isLateCancellation } from "../client-booking/settleCancellationFee";

export type ProtectiveFeeKind =
  | "lateCancellation"
  | "lateReschedule"
  | "noShow";

export type ProtectiveFeeActivation = {
  kind: ProtectiveFeeKind;
  percent: string;
  ceiling: string;
  cancellationFeeAt?: string;
  exceededCancellationWindow?: boolean;
};

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
  if (Number.isInteger(clamped) && !trimmed.includes(".")) {
    return String(clamped);
  }
  return String(clamped);
}

/** Cap enforcement alias — reduce/remove only, never above template ceiling. */
export function enforceProtectiveFeeCap(
  nextPercent: string,
  templateCap: number | string | null | undefined,
): string {
  return clampProtectiveFeePercent(nextPercent, templateCap);
}

function hasCancelEvent(input: {
  status?: string | null;
  cancelledServiceIds?: readonly string[] | null;
}): boolean {
  const status = String(input.status ?? "");
  return (
    status === "Cancelled" ||
    (Array.isArray(input.cancelledServiceIds) &&
      input.cancelledServiceIds.length > 0)
  );
}

function noticeContextPresent(input: {
  appointmentStartMs?: number | null;
  noticeHours?: number | null;
  noticeMinutes?: number | null;
}): boolean {
  return (
    input.appointmentStartMs != null ||
    input.noticeHours != null ||
    input.noticeMinutes != null
  );
}

/** Template defaults → capped percent + ceiling for a newly triggered fee. */
export function buildProtectiveFeeActivation(
  policyPercent: number | string | null | undefined,
  extras?: {
    kind?: ProtectiveFeeKind;
    cancellationFeeAt?: string;
    exceededCancellationWindow?: boolean;
  },
): ProtectiveFeeActivation | null {
  if (!isPolicyFeeConfigured(policyPercent)) return null;
  const ceiling = String(parsePolicyPercentCeiling(policyPercent));
  const percent = clampProtectiveFeePercent(ceiling, ceiling);
  return {
    kind: extras?.kind ?? "lateCancellation",
    percent,
    ceiling,
    ...(extras?.cancellationFeeAt
      ? { cancellationFeeAt: extras.cancellationFeeAt }
      : {}),
    ...(typeof extras?.exceededCancellationWindow === "boolean"
      ? { exceededCancellationWindow: extras.exceededCancellationWindow }
      : {}),
  };
}

/**
 * Late cancellation: template fee + cancel event + outside notice window.
 * Actor (client vs professional/offline) is irrelevant.
 */
export function shouldTriggerLateCancellationFee(input: {
  policyPercent?: number | string | null;
  status?: string | null;
  cancelledServiceIds?: readonly string[] | null;
  alreadyShown?: boolean;
  appointmentStartMs?: number | null;
  noticeHours?: number | null;
  noticeMinutes?: number | null;
  nowMs?: number;
}): boolean {
  if (input.alreadyShown) return false;
  if (!isPolicyFeeConfigured(input.policyPercent)) return false;
  if (!hasCancelEvent(input)) return false;
  if (!noticeContextPresent(input)) {
    // ponytail: no slot timing → treat cancel as late; tighten when start always known
    return true;
  }
  return isLateCancellation({
    appointmentStartMs: input.appointmentStartMs,
    noticeHours: input.noticeHours,
    noticeMinutes: input.noticeMinutes,
    nowMs: input.nowMs,
  });
}

/**
 * Late reschedule: template fee + schedule edit + outside reschedule notice window.
 */
export function shouldTriggerLateRescheduleFee(input: {
  policyPercent?: number | string | null;
  scheduleEdited?: boolean | null;
  alreadyShown?: boolean;
  appointmentStartMs?: number | null;
  noticeHours?: number | null;
  noticeMinutes?: number | null;
  nowMs?: number;
}): boolean {
  if (input.alreadyShown) return false;
  if (!isPolicyFeeConfigured(input.policyPercent)) return false;
  if (!input.scheduleEdited) return false;
  if (!noticeContextPresent(input)) return true;
  return isLateCancellation({
    appointmentStartMs: input.appointmentStartMs,
    noticeHours: input.noticeHours,
    noticeMinutes: input.noticeMinutes,
    nowMs: input.nowMs,
  });
}

/** No-show: template fee + No Show status. */
export function shouldTriggerNoShowFee(input: {
  policyPercent?: number | string | null;
  status?: string | null;
  alreadyShown?: boolean;
}): boolean {
  if (input.alreadyShown) return false;
  if (!isPolicyFeeConfigured(input.policyPercent)) return false;
  return String(input.status ?? "") === "No Show";
}

/**
 * Kilometre Allowance: desired-location only; manual OK even when not in template.
 */
export function canTriggerKilometerAllowance(input: {
  location?: string | null;
  alreadyShown?: boolean;
}): boolean {
  if (input.alreadyShown) return false;
  return String(input.location ?? "") === "DL";
}
