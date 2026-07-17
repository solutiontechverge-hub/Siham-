import * as XLSX from "xlsx";
import type { MockProfessional } from "./adminMockData";
import {
  buildProfessionalExportStamp,
  buildProfessionalExportSubtitle,
  PROFESSIONAL_EXPORT_HEADERS,
  PROFESSIONAL_EXPORT_TITLE,
  professionalRowToExportRow,
} from "./exportProfessionalsData";

export function exportProfessionalsToExcel(
  professionals: readonly MockProfessional[],
  filenamePrefix = "professional-management",
) {
  if (professionals.length === 0) return false;

  const stamp = buildProfessionalExportStamp();
  const subtitle = buildProfessionalExportSubtitle(professionals.length, stamp);
  const headerRow = PROFESSIONAL_EXPORT_HEADERS.slice();
  const dataRows = professionals.map(professionalRowToExportRow);
  const sheetData = [[PROFESSIONAL_EXPORT_TITLE], [subtitle], [], headerRow, ...dataRows];

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  const lastCol = PROFESSIONAL_EXPORT_HEADERS.length - 1;

  worksheet["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: lastCol } },
  ];

  const columnWidths = PROFESSIONAL_EXPORT_HEADERS.map((header, index) => {
    const maxLen = sheetData.reduce((max, row) => {
      const cell = String(row[index] ?? "");
      return Math.max(max, cell.length);
    }, header.length);
    return { wch: Math.min(Math.max(maxLen + 2, 14), 52) };
  });
  worksheet["!cols"] = columnWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Professionals");
  XLSX.writeFile(workbook, `${filenamePrefix}-${stamp}.xlsx`);
  return true;
}
