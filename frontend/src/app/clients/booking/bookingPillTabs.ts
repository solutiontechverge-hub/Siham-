import type { AppPillTab } from "../../../components/common/AppPillTabs";
import type { BookingListTab } from "./clientBookingRecords";

export const CLIENT_BOOKING_PILL_TABS: readonly AppPillTab[] = [
  { label: "Past", value: "past" },
  { label: "Outgoing", value: "outgoing" },
  { label: "Upcoming", value: "upcoming" },
] as const;

export function parseBookingListTab(value: string | null | undefined): BookingListTab {
  if (value === "past" || value === "outgoing" || value === "upcoming") return value;
  return "upcoming";
}
