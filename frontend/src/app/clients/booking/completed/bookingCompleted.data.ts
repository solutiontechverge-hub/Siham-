export const bookingCompletedPageData = {
  redirectSeconds: 30,
  titles: {
    requested: "Booking Request sent",
    completed: "Booking Completed",
  },
  redirectLabel: (seconds: number) => `Redirecting to bookings in ${seconds}s`,
  viewBookingLabel: "View Booking",
  bookingsHref: "/clients/booking",
} as const;

export type BookingCompletedOutcome = "requested" | "completed";
