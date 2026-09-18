"use client";

import BookingGuidelineIcon from "../calendar/BookingGuidelineIcon";

/** Waiting for prepayment — product guideline PNG. */
export default function PrepaymentPayNowIcon({ size = 28 }: { size?: number }) {
  return <BookingGuidelineIcon variant="waiting_for_prepayment" size={size} />;
}
