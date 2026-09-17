"use client";

import BookingRequestDirectionIcon from "./BookingRequestDirectionIcon";

export const BOOKING_REQUEST_RECEIVED_LABEL = "Booking request received";

export default function BookingRequestReceivedIcon({
  size = 10,
}: {
  size?: number;
}) {
  return <BookingRequestDirectionIcon direction="received" size={size} />;
}
