import type {
  ReportStatus,
  ReportStatusStyle,
  ReportUserType,
  ReportUserTypeStyle,
} from "./reports.types";

export const PAGE_SIZE_OPTIONS = [10, 20, 50];

export const USER_TYPE_STYLES: Record<ReportUserType, ReportUserTypeStyle> = {
  Professional: { bg: "rgba(127, 86, 217, 0.12)", color: "#6941C6" },
  Client: { bg: "rgba(76, 175, 80, 0.12)", color: "#2E7D32" },
};

export const STATUS_STYLES: Record<ReportStatus, ReportStatusStyle> = {
  new: { bg: "rgba(220, 104, 3, 0.14)", color: "#DC6803", label: "New" },
  viewed: {
    bg: "rgba(59, 130, 246, 0.12)",
    color: "#2563EB",
    label: "Viewed",
  },
};

export function formatDisplayDate(iso: string) {
  const date = new Date(`${iso}T00:00:00`);

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
