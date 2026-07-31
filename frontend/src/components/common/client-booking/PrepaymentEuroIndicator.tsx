"use client";

import BookingGuidelineIcon from "../calendar/BookingGuidelineIcon";

/** Compact prepaid € indicator — product guideline PNG. */
export default function PrepaymentEuroIndicator({
  size = 22,
}: {
  size?: number;
}) {
  return <BookingGuidelineIcon variant="prepaid" size={size} />;
}
