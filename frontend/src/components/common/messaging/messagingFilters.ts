import type {
  MessagingBookingStatus,
  MessagingDrawerFilters,
  MessagingSettingsFilters,
  MessagingThread,
} from "./messagingTypes";

export function threadPassesSettingsFilters(_thread: MessagingThread, _settings: MessagingSettingsFilters): boolean {
  return true;
}

export function threadPassesDrawerFilters(thread: MessagingThread, drawer: MessagingDrawerFilters): boolean {
  if (drawer.searchFor === "unlinked") {
    if (!thread.unlinked) return false;
  } else if (drawer.searchFor !== "all" && thread.bookingStatus !== drawer.searchFor) {
    return false;
  }
  const locationOk =
    (drawer.locationFixed && thread.locationType === "fixed") ||
    (drawer.locationDesired && thread.locationType === "desired");
  if (!drawer.locationFixed && !drawer.locationDesired) return true;
  return locationOk;
}

export function statusLabel(status: MessagingBookingStatus): string {
  const map: Record<MessagingBookingStatus, string> = {
    completed: "Completed",
    confirmed: "Confirmed",
    requested: "Requests",
    cancelled: "Cancelled",
    invalid: "Invalid",
    no_show: "No Show",
  };
  return map[status];
}
