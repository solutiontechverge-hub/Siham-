"use client";

import BookingGuidelineIcon from "../calendar/BookingGuidelineIcon";

/** Waiting-for-payment clock — product guideline PNG. */
export default function PaymentDueIcon({ size = 24 }: { size?: number }) {
  return <BookingGuidelineIcon variant="waiting_for_payment" size={size} />;
}
