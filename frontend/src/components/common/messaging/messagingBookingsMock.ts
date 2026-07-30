export type LinkableBooking = {
  id: string;
  bookingId: string;
  label: string;
  dateLabel: string;
  timeRange: string;
  status?: string;
  /** Past / completed / cancelled / no-show bookings. */
  closed?: boolean;
};

export function formatLinkableBookingLabel(booking: LinkableBooking): string {
  return `#${booking.bookingId}-${booking.dateLabel}-${booking.timeRange}`;
}

/** @deprecated Prefer API linkable bookings; kept for fallback/stories. */
export const linkableBookingsMock: LinkableBooking[] = [];
