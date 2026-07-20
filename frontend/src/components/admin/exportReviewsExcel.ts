import * as XLSX from "xlsx";
import type { FlaggedReviewRow } from "./reviewsData";
import {
  buildReviewExportStamp,
  buildReviewExportSubtitle,
  REVIEW_EXPORT_HEADERS,
  REVIEW_EXPORT_TITLE,
  reviewRowToExportRow,
} from "./exportReviewsData";

export function exportReviewsToExcel(reviews: readonly FlaggedReviewRow[], filenamePrefix = "flagged-reviews") {
  if (reviews.length === 0) return false;

  const stamp = buildReviewExportStamp();
  const subtitle = buildReviewExportSubtitle(reviews.length, stamp);
  const headerRow = REVIEW_EXPORT_HEADERS.slice();
  const dataRows = reviews.map(reviewRowToExportRow);
  const sheetData = [[REVIEW_EXPORT_TITLE], [subtitle], [], headerRow, ...dataRows];

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  const lastCol = REVIEW_EXPORT_HEADERS.length - 1;

  worksheet["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: lastCol } },
  ];

  worksheet["!cols"] = REVIEW_EXPORT_HEADERS.map((header, index) => {
    const maxLen = sheetData.reduce((max, row) => {
      const cell = String(row[index] ?? "");
      return Math.max(max, cell.length);
    }, header.length);
    return { wch: Math.min(Math.max(maxLen + 2, 14), 52) };
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Flagged Reviews");
  XLSX.writeFile(workbook, `${filenamePrefix}-${stamp}.xlsx`);
  return true;
}
