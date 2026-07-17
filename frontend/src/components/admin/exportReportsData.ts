import type { ReportRow } from "./reportsData";

export const REPORT_EXPORT_TITLE = "Reports Management — Report List";

export const REPORT_EXPORT_HEADERS = [
  "Report ID",
  "Reporter",
  "Reporter Email",
  "Reported User",
  "Reported Email",
  "User Type",
  "Reason",
  "Description",
  "Date Reported",
  "Status",
] as const;

export function reportRowToExportRow(report: ReportRow): string[] {
  return [
    report.reportId,
    report.reporter.name,
    report.reporter.email,
    report.reported.name,
    report.reported.email,
    report.reported.type,
    report.reasonCategory,
    report.reasonDescription,
    `${report.date} ${report.time}`,
    report.status === "new" ? "New" : "Viewed",
  ];
}

export function buildReportExportStamp() {
  return new Date().toISOString().slice(0, 10);
}

export function buildReportExportSubtitle(count: number, stamp = buildReportExportStamp()) {
  return `Exported on ${stamp} · ${count} report${count === 1 ? "" : "s"}`;
}
