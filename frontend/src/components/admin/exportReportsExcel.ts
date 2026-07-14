import * as XLSX from "xlsx";
import type { ReportRow } from "./reportsData";
import {
  buildReportExportStamp,
  buildReportExportSubtitle,
  REPORT_EXPORT_HEADERS,
  REPORT_EXPORT_TITLE,
  reportRowToExportRow,
} from "./exportReportsData";

export function exportReportsToExcel(reports: readonly ReportRow[], filenamePrefix = "reports") {
  if (reports.length === 0) return false;

  const stamp = buildReportExportStamp();
  const subtitle = buildReportExportSubtitle(reports.length, stamp);
  const headerRow = REPORT_EXPORT_HEADERS.slice();
  const dataRows = reports.map(reportRowToExportRow);
  const sheetData = [[REPORT_EXPORT_TITLE], [subtitle], [], headerRow, ...dataRows];

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  const lastCol = REPORT_EXPORT_HEADERS.length - 1;

  worksheet["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: lastCol } },
  ];

  worksheet["!cols"] = REPORT_EXPORT_HEADERS.map((header, index) => {
    const maxLen = sheetData.reduce((max, row) => {
      const cell = String(row[index] ?? "");
      return Math.max(max, cell.length);
    }, header.length);
    return { wch: Math.min(Math.max(maxLen + 2, 14), 48) };
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Reports");
  XLSX.writeFile(workbook, `${filenamePrefix}-${stamp}.xlsx`);
  return true;
}
