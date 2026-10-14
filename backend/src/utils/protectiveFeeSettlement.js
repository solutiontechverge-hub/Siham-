import { roundMoney } from "./money.js";

/**
 * Protective fee vs prepayment rules. Mirror of frontend
 * `components/common/client-booking/settleCancellationFee.ts` — keep in sync.
 */

/** Rule A/B decision clock: action time vs appointment start. Unknown → future (B). */
export function isAppointmentPassedAt(actionAtMs, startMs) {
  if (actionAtMs == null || startMs == null) return false;
  const action = Number(actionAtMs);
  const start = Number(startMs);
  if (!Number.isFinite(action) || !Number.isFinite(start)) return false;
  return action >= start;
}

/**
 * Rule A (passed): every fee is deducted from prepaid.
 * Rule B (future): late cancel still nets; late reschedule is added to the booking total.
 * No-show is always after start → nets.
 */
export function protectiveFeeNetsPrepaid(kind, appointmentPassed) {
  return kind !== "lateReschedule" || appointmentPassed === true;
}

/** Fee Total → Prepaid applied → Payment remainder (€0 when prepaid covers). */
export function settleProtectiveFee({ feeTotal, prepaidAvailable, netsPrepaid = true }) {
  const fee = roundMoney(Math.max(0, Number(feeTotal) || 0));
  const prepaid = roundMoney(Math.max(0, Number(prepaidAvailable) || 0));
  const prepaidApplied = netsPrepaid === false ? 0 : roundMoney(Math.min(prepaid, fee));
  return {
    feeTotal: fee,
    prepaidApplied,
    amountDue: roundMoney(Math.max(0, fee - prepaidApplied)),
  };
}
