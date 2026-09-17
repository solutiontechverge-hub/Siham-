"use client";

import BookingRequestDirectionIcon from "./BookingRequestDirectionIcon";

export const BOOKING_REQUEST_SENT_LABEL = "Booking request sent";

export default function BookingRequestSentIcon({ size = 10 }: { size?: number }) {
  return <BookingRequestDirectionIcon direction="sent" size={size} />;
}
