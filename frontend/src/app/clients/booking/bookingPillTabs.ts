import type { AppPillTab } from "../../../components/common/AppPillTabs";
import type { BookingListTab } from "./clientBookingRecords";

export const CLIENT_BOOKING_PILL_TABS: readonly AppPillTab[] = [
  { label: "Past", value: "past" },
  { label: "Ongoing", value: "ongoing" },
  { label: "Upcoming", value: "upcoming" },
] as const;

export function parseBookingListTab(value: string | null | undefined): BookingListTab {
  // Legacy URL support: older links used `outgoing` for the confirmed/today+future tab.
  if (value === "outgoing" || value === "ongoing") return "ongoing";
  if (value === "past" || value === "upcoming") return value;
  return "upcoming";
}
