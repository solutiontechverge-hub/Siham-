import type { ActivityLogRow } from "./activityLogData";

export const ACTIVITY_LOG_EXPORT_TITLE = "Activity Log — Platform Audit Trail";

export const ACTIVITY_LOG_EXPORT_HEADERS = [
  "Date",
  "Time",
  "User",
  "Email",
  "Action",
  "Module",
  "Details",
  "IP Address",
] as const;

export function activityLogRowToExportRow(row: ActivityLogRow): string[] {
  return [
    row.date,
    row.time,
    row.user.name,
    row.user.email,
    row.actionLabel,
    row.moduleLabel,
    row.details,
    row.ipAddress,
  ];
}

export function buildActivityLogExportStamp() {
  return new Date().toISOString().slice(0, 10);
}

export function buildActivityLogExportSubtitle(count: number, stamp = buildActivityLogExportStamp()) {
  return `Exported on ${stamp} · ${count} activit${count === 1 ? "y" : "ies"}`;
}
