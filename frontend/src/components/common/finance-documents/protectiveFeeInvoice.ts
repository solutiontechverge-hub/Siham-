/** Canonical fee invoice entry labels (finance `entry_label` / transaction type). */
export const LATE_CANCELLATION_BOOKING_FEE = "Late Cancellation Booking Fee";
export const LATE_RESCHEDULING_FEE = "Late Rescheduling Fee";

function formatProtectiveFeeBase(baseAmount: number): string {
  const base = Number.isFinite(baseAmount) ? Math.max(0, baseAmount) : 0;
  // Design: "10% Of €230" (no trailing .00 for whole euros).
  return Number.isInteger(base) || Math.abs(base - Math.round(base)) < 0.005
    ? String(Math.round(base))
    : base.toFixed(2);
}

/** Design-matched fee line: "Late Rescheduling Fee (10% Of €230)". */
export function formatProtectiveFeeLineDescription(
  kind: "lateCancellation" | "lateRescheduling",
  percent: number,
  baseAmount: number,
): string {
  const name =
    kind === "lateCancellation"
      ? LATE_CANCELLATION_BOOKING_FEE
      : LATE_RESCHEDULING_FEE;
  const pct = Number(percent) || 0;
  return `${name} (${pct}% Of €${formatProtectiveFeeBase(baseAmount)})`;
}

/** Upgrade bare fee labels (legacy docs) when percent + base are known. */
export function ensureProtectiveFeeLineDescription(
  description: string | null | undefined,
  opts?: {
    entryLabel?: string | null;
    kind?: "lateCancellation" | "lateRescheduling";
    percent?: number | null;
    baseAmount?: number | null;
  },
): string {
  const raw = String(description ?? "").trim();
  if (/%\s*Of\s*€/i.test(raw)) return raw;
  const percent = Number(opts?.percent);
  const base = Number(opts?.baseAmount);
  if (!(percent > 0) || !Number.isFinite(base) || base < 0) return raw;
  const kind =
    opts?.kind ??
    (opts?.entryLabel === LATE_RESCHEDULING_FEE ||
    raw.startsWith(LATE_RESCHEDULING_FEE)
      ? "lateRescheduling"
      : "lateCancellation");
  if (
    !isProtectiveFeeLineDescription(raw) &&
    !isProtectiveFeeEntryLabel(opts?.entryLabel)
  ) {
    return raw;
  }
  return formatProtectiveFeeLineDescription(kind, percent, base);
}

export function isProtectiveFeeEntryLabel(label?: string | null): boolean {
  const value = String(label ?? "").trim();
  return (
    value === LATE_CANCELLATION_BOOKING_FEE ||
    value === LATE_RESCHEDULING_FEE ||
    value === "No-show fee"
  );
}

export function isProtectiveFeeLineDescription(description?: string | null): boolean {
  const value = String(description ?? "");
  return (
    value.startsWith(LATE_CANCELLATION_BOOKING_FEE) ||
    value.startsWith(LATE_RESCHEDULING_FEE) ||
    value.toLowerCase().startsWith("no-show fee")
  );
}
