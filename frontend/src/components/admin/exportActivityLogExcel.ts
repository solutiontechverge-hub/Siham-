import * as XLSX from "xlsx";
import type { ActivityLogRow } from "./activityLogData";
import {
  ACTIVITY_LOG_EXPORT_HEADERS,
  ACTIVITY_LOG_EXPORT_TITLE,
  activityLogRowToExportRow,
  buildActivityLogExportStamp,
  buildActivityLogExportSubtitle,
} from "./exportActivityLogData";

export function exportActivityLogToExcel(rows: readonly ActivityLogRow[], filenamePrefix = "activity-log") {
  if (rows.length === 0) return false;

  const stamp = buildActivityLogExportStamp();
  const subtitle = buildActivityLogExportSubtitle(rows.length, stamp);
  const headerRow = ACTIVITY_LOG_EXPORT_HEADERS.slice();
  const dataRows = rows.map(activityLogRowToExportRow);
  const sheetData = [[ACTIVITY_LOG_EXPORT_TITLE], [subtitle], [], headerRow, ...dataRows];

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  const lastCol = ACTIVITY_LOG_EXPORT_HEADERS.length - 1;

  worksheet["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: lastCol } },
  ];

  worksheet["!cols"] = ACTIVITY_LOG_EXPORT_HEADERS.map((header, index) => {
    const maxLen = sheetData.reduce((max, row) => {
      const cell = String(row[index] ?? "");
      return Math.max(max, cell.length);
    }, header.length);
    return { wch: Math.min(Math.max(maxLen + 2, 14), 48) };
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Activity Log");
  XLSX.writeFile(workbook, `${filenamePrefix}-${stamp}.xlsx`);
  return true;
}
