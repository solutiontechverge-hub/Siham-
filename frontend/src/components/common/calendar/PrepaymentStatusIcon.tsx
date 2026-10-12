"use client";

import BookingGuidelineIcon from "./BookingGuidelineIcon";

export type PrepaymentStatusIconVariant =
  | "pending"
  | "confirmed"
  | "canceled_or_invalid";

export const PREPAYMENT_STATUS_LABELS: Record<
  PrepaymentStatusIconVariant,
  string
> = {
  pending: "Prepayment required",
  confirmed: "Prepayment confirmed",
  canceled_or_invalid: "Prepayment canceled or invalid",
};

type PrepaymentStatusIconProps = {
  variant: PrepaymentStatusIconVariant;
  size?: number;
};

/** Maps legacy prepayment variants onto product guideline PNGs. */
export default function PrepaymentStatusIcon({
  variant,
  size = 24,
}: PrepaymentStatusIconProps) {
  if (variant === "pending") {
    return <BookingGuidelineIcon variant="waiting_for_prepayment" size={size} />;
  }
  if (variant === "confirmed") {
    return <BookingGuidelineIcon variant="prepaid" size={size} />;
  }
  return <BookingGuidelineIcon variant="refund_pending" size={size} />;
}
