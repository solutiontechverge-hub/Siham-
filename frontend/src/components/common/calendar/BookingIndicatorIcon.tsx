"use client";

import BookingGuidelineIcon, {
  BOOKING_GUIDELINE_ICON_LABELS,
  type BookingGuidelineIconVariant,
} from "./BookingGuidelineIcon";

export type BookingIndicatorVariant =
  | "suggestion_for_change"
  | "waiting_for_prepayment"
  | "overdue_response"
  | "waiting_for_payment"
  | "overdue_payment"
  | "refund_pending"
  | "refund_completed"
  | "prepaid";

const VARIANT_MAP: Record<BookingIndicatorVariant, BookingGuidelineIconVariant> = {
  suggestion_for_change: "suggestion_for_change",
  waiting_for_prepayment: "response_time_active",
  overdue_response: "overdue_response",
  waiting_for_payment: "waiting_for_payment",
  overdue_payment: "overdue_payment",
  refund_pending: "refund_pending",
  refund_completed: "refund_completed",
  prepaid: "prepaid",
};

export const BOOKING_INDICATOR_LABELS: Record<BookingIndicatorVariant, string> = {
  suggestion_for_change: BOOKING_GUIDELINE_ICON_LABELS.suggestion_for_change,
  waiting_for_prepayment: BOOKING_GUIDELINE_ICON_LABELS.response_time_active,
  overdue_response: BOOKING_GUIDELINE_ICON_LABELS.overdue_response,
  waiting_for_payment: BOOKING_GUIDELINE_ICON_LABELS.waiting_for_payment,
  overdue_payment: BOOKING_GUIDELINE_ICON_LABELS.overdue_payment,
  refund_pending: BOOKING_GUIDELINE_ICON_LABELS.refund_pending,
  refund_completed: BOOKING_GUIDELINE_ICON_LABELS.refund_completed,
  prepaid: BOOKING_GUIDELINE_ICON_LABELS.prepaid,
};

type BookingIndicatorIconProps = {
  variant: BookingIndicatorVariant;
  size?: number;
};

export default function BookingIndicatorIcon({
  variant,
  size = 16,
}: BookingIndicatorIconProps) {
  return <BookingGuidelineIcon variant={VARIANT_MAP[variant]} size={size} />;
}
