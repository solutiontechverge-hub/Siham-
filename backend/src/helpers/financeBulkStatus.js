/**
 * Bulk markUnpaid allowlist:
 * - Pending (post-booking) → Unpaid
 * - manualEntry Payment due/Overdue with reissueLevel >= 2 (existing finance overview path)
 * - offline Overdue → Unpaid; offline Paid → Unpaid (reversible Paid ↔ Unpaid)
 */
export function isOfflineFinanceRow(row) {
  if (row?.entry_type === "offlineBooking") return true;
  const method = String(row?.method_title ?? row?.methodTitle ?? "")
    .trim()
    .toLowerCase();
  return method.startsWith("offline");
}

export function canBulkMarkUnpaid(row) {
  if (row?.status === "Pending") return true;
  if (
    ["Payment due", "Overdue"].includes(row?.status) &&
    row?.entry_type === "manualEntry" &&
    Number(row?.document?.reissueLevel ?? 0) >= 2
  ) {
    return true;
  }
  // Offline post-booking invoice: Overdue→Unpaid; Paid→Unpaid (not Payment due→Unpaid).
  if (isOfflineFinanceRow(row) && (row?.status === "Overdue" || row?.status === "Paid")) {
    return true;
  }
  return false;
}

/**
 * Bulk markPaid allowlist:
 * - manualEntry Unpaid|Pending|Payment due|Overdue (existing)
 * - offline Payment due|Overdue|Unpaid → Paid (reversible Unpaid→Paid)
 */
export function canBulkMarkPaid(row) {
  const status = row?.status;
  if (row?.entry_type === "manualEntry") {
    return ["Unpaid", "Pending", "Payment due", "Overdue"].includes(status);
  }
  if (isOfflineFinanceRow(row)) {
    return ["Unpaid", "Payment due", "Overdue"].includes(status);
  }
  return false;
}

const OWED_VOID_STATUSES = [
  "Payment due",
  "Prepayment due",
  "Overdue",
  "Overdue response",
  "Unpaid",
];

/** Money has left via a completed refund — void must not erase that. */
export function hasSettledRefund(row) {
  if (row?.status === "Refunded") return true;
  return Number(row?.refund_amount ?? row?.document?.refundAmount ?? 0) > 0;
}

/**
 * Bulk void outcome for one finance row:
 * - void: Paid/Prepaid (wrong client/service) → in-place Voided
 * - unpaid: open balance / money owed → Unpaid (do not void)
 * - block: settled refund or unsupported status
 */
export function resolveBulkVoidOutcome(row) {
  if (hasSettledRefund(row)) return "block";
  if (row?.status === "Paid" || row?.status === "Prepaid") return "void";
  if (OWED_VOID_STATUSES.includes(row?.status)) return "unpaid";
  return "block";
}
