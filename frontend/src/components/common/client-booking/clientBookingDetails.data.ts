export const bookingPillTabs = [
  { label: "Past", value: "past" },
  { label: "Ongoing", value: "ongoing" },
  { label: "Upcoming", value: "upcoming" },
] as const;

/** Placeholder address labels that should not render as a real location. */
export const UNSPECIFIED_ADDRESS_LABELS = [
  "location not specified",
  "studio location",
  "enter visit address",
  "service at your location",
] as const;

export const ACTIVITY_DRAWER_TITLES = {
  overview: "Activity",
  overviewHeading: "Activity Overview",
  details: "Activity Details",
  comparison: "Comparison",
  editRequest: "Edit request details",
  empty: "No activity for this booking yet.",
} as const;

export const CLIENT_BOOKING_DETAILS_COPY = {
  sendBookingRequest: "Save",
  ok: "Ok",
  acceptSuggestedChanges: "ACCEPT",
  suggestChanges: "Suggest changes",
  reject: "REJECT",
  payCancellationFeeTitle: "Pay cancellation fee",
  payCancellationFeeSubtitlePrefix: "Cancellation fee for booking",
  activeLabelBooking: "Booking",
} as const;
