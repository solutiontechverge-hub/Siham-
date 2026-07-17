import * as XLSX from "xlsx";
import type { MockClient } from "./adminMockData";
import {
  buildClientExportStamp,
  buildClientExportSubtitle,
  CLIENT_EXPORT_HEADERS,
  CLIENT_EXPORT_TITLE,
  clientRowToExportRow,
} from "./exportClientsData";

export function exportClientsToExcel(clients: readonly MockClient[], filenamePrefix = "client-management") {
  if (clients.length === 0) return false;

  const stamp = buildClientExportStamp();
  const subtitle = buildClientExportSubtitle(clients.length, stamp);
  const headerRow = CLIENT_EXPORT_HEADERS.slice();
  const dataRows = clients.map(clientRowToExportRow);
  const sheetData = [[CLIENT_EXPORT_TITLE], [subtitle], [], headerRow, ...dataRows];

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  const lastCol = CLIENT_EXPORT_HEADERS.length - 1;

  worksheet["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: lastCol } },
  ];

  const columnWidths = CLIENT_EXPORT_HEADERS.map((header, index) => {
    const maxLen = sheetData.reduce((max, row) => {
      const cell = String(row[index] ?? "");
      return Math.max(max, cell.length);
    }, header.length);
    return { wch: Math.min(Math.max(maxLen + 2, 14), 52) };
  });
  worksheet["!cols"] = columnWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Clients");
  XLSX.writeFile(workbook, `${filenamePrefix}-${stamp}.xlsx`);
  return true;
}
