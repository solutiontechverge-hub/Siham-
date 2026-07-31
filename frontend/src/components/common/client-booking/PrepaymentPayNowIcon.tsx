"use client";

import BookingGuidelineIcon from "../calendar/BookingGuidelineIcon";

/** Waiting for prepayment — product guideline hourglass PNG. */
export default function PrepaymentPayNowIcon({ size = 28 }: { size?: number }) {
  return <BookingGuidelineIcon variant="response_time_active" size={size} />;
}
