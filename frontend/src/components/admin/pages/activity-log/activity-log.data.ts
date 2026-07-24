import type { ElementType } from "react";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import PeopleOutlineOutlinedIcon from "@mui/icons-material/PeopleOutlineOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import ViewListOutlinedIcon from "@mui/icons-material/ViewListOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import type { ActivityLogModule } from "./activity-log.types";

export const PAGE_SIZE_OPTIONS = [10, 20, 50];

export const MODULE_ICONS: Record<ActivityLogModule, ElementType> = {
  professional: BadgeOutlinedIcon, client: PeopleOutlineOutlinedIcon, authentication: LockOutlinedIcon,
  review: RateReviewOutlinedIcon, listing: ViewListOutlinedIcon, system: SettingsOutlinedIcon,
  booking: EventOutlinedIcon, email: EmailOutlinedIcon, report: FlagOutlinedIcon, access: LockOutlinedIcon,
};

export function formatDisplayDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true,
  });
}

export function formatTime12h(time: string) {
  return new Date(`2000-01-01T${time}:00`).toLocaleTimeString("en-GB", {
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

export function formatDateRangeLabel(from: string, to: string) {
  if (!from && !to) return null;
  if (from && to) return `Showing results for ${formatDisplayDate(from)} - ${formatDisplayDate(to)}`;
  return from ? `Showing results from ${formatDisplayDate(from)}` : `Showing results until ${formatDisplayDate(to)}`;
}
