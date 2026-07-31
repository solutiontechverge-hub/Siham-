"use client";

import { Box } from "@mui/material";

/**
 * Booking status guideline icons — product PNGs in /public/images/booking-status/
 */
export type BookingGuidelineIconVariant =
  | "refund_pending"
  | "prepaid"
  | "refund_completed"
  | "response_time_active"
  | "waiting_for_payment"
  | "overdue_response"
  | "overdue_payment"
  | "suggestion_for_change";

export const BOOKING_GUIDELINE_ICON_LABELS: Record<
  BookingGuidelineIconVariant,
  string
> = {
  refund_pending: "Refund pending",
  prepaid: "Prepayment received",
  refund_completed: "Refund completed",
  response_time_active: "Waiting for response / prepayment",
  waiting_for_payment: "Invoice due / waiting for payment",
  overdue_response: "Overdue response",
  overdue_payment: "Overdue payment",
  suggestion_for_change: "Suggestion for change",
};

const ICON_SRC: Record<BookingGuidelineIconVariant, string> = {
  refund_pending: "/images/booking-status/refund-pending.png",
  prepaid: "/images/booking-status/prepaid.png",
  refund_completed: "/images/booking-status/refund-completed.png",
  response_time_active: "/images/booking-status/response-time-active.png",
  waiting_for_payment: "/images/booking-status/waiting-for-payment.png",
  overdue_response: "/images/booking-status/overdue-response.png",
  overdue_payment: "/images/booking-status/overdue-response.png",
  suggestion_for_change: "/images/booking-status/suggestion-for-change.png",
};

type Props = {
  variant: BookingGuidelineIconVariant;
  size?: number;
};

export default function BookingGuidelineIcon({ variant, size = 16 }: Props) {
  return (
    <Box
      component="span"
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 0,
        "& img": {
          width: size,
          height: size,
          objectFit: "contain",
          display: "block",
          pointerEvents: "none",
          userSelect: "none",
        },
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={ICON_SRC[variant]} alt="" aria-hidden />
    </Box>
  );
}
