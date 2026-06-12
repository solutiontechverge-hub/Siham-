export type LinkableBooking = {
  id: string;
  bookingId: string;
  label: string;
  dateLabel: string;
  timeRange: string;
};

export function formatLinkableBookingLabel(booking: LinkableBooking): string {
  return `#${booking.bookingId}-${booking.dateLabel}-${booking.timeRange}`;
}

/** Bookings the user can link a conversation to (mock until API is connected). */
export const linkableBookingsMock: LinkableBooking[] = [
  {
    id: "lb-1",
    bookingId: "B139420393",
    label: "B139420393",
    dateLabel: "Nov, 09, 2025",
    timeRange: "4:00-5:00",
  },
  {
    id: "lb-2",
    bookingId: "B139420394",
    label: "B139420394",
    dateLabel: "Nov, 12, 2025",
    timeRange: "2:00-3:30",
  },
];
