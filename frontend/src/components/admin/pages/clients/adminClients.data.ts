import type { MockClient } from "../../adminMockData";
import type { SortOption } from "./adminClients.types";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "reg_desc", label: "Registration date (newest first)" },
  { value: "reg_asc", label: "Registration date (oldest first)" },
  { value: "booking_desc", label: "Last completed booking (newest first)" },
  { value: "booking_asc", label: "Last completed booking (oldest first)" },
];

export const CLIENT_TYPE_OPTIONS = [
  { value: "IC", label: "Individual (IC)" },
  { value: "CC", label: "Company (CC)" },
];

export const STATUS_STYLES: Record<
  MockClient["accountStatus"],
  { bg: string; fg: string; label: string }
> = {
  active: { bg: "rgba(76, 175, 80, 0.12)", fg: "#2E7D32", label: "Active" },
  disabled: { bg: "rgba(220, 104, 3, 0.14)", fg: "#DC6803", label: "Disabled" },
  deleted: { bg: "rgba(240, 68, 56, 0.12)", fg: "#B42318", label: "Deleted" },
};

export const CC_PURPLE = "#6941C6";
export const CC_PURPLE_SOFT = "rgba(127, 86, 217, 0.12)";
export const INITIAL_VISIBLE = 5;
export const PAGE_SIZE = 10;

export function formatDisplayDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
