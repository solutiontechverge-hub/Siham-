import type { FlaggedReviewRow } from "./reviewsData";
import {
  buildReviewExportStamp,
  buildReviewExportSubtitle,
  REVIEW_EXPORT_HEADERS,
  REVIEW_EXPORT_TITLE,
  reviewRowToExportRow,
} from "./exportReviewsData";

export async function exportReviewsToPdf(
  reviews: readonly FlaggedReviewRow[],
  filenamePrefix = "flagged-reviews",
): Promise<boolean> {
  if (reviews.length === 0) return false;

  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
  const left = 36;
  const top = 42;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const usableWidth = pageWidth - left * 2;

  const colCount = REVIEW_EXPORT_HEADERS.length;
  const colWidth = usableWidth / colCount;
  const headerHeight = 24;
  const rowHeight = 28;
  const lineHeight = 10;
  const stamp = buildReviewExportStamp();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(33, 184, 191);
  doc.text(REVIEW_EXPORT_TITLE, left, top);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(113, 129, 154);
  doc.text(buildReviewExportSubtitle(reviews.length, stamp), left, top + 18);

  const drawHeader = (y: number) => {
    doc.setFillColor(232, 251, 247);
    doc.rect(left, y, usableWidth, headerHeight, "F");
    doc.setDrawColor(33, 184, 191);
    doc.setLineWidth(0.5);
    doc.rect(left, y, usableWidth, headerHeight);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(20, 122, 130);
    REVIEW_EXPORT_HEADERS.forEach((header, index) => {
      doc.text(header, left + index * colWidth + 5, y + 15, { maxWidth: colWidth - 8 });
    });
  };

  const drawRow = (cells: string[], y: number, shaded: boolean) => {
    if (shaded) {
      doc.setFillColor(247, 251, 253);
      doc.rect(left, y, usableWidth, rowHeight, "F");
    }
    doc.setDrawColor(230, 238, 244);
    doc.setLineWidth(0.25);
    doc.rect(left, y, usableWidth, rowHeight);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(52, 74, 102);
    cells.forEach((cell, index) => {
      const lines = doc.splitTextToSize(String(cell ?? ""), colWidth - 8);
      const clipped = lines.slice(0, 2);
      clipped.forEach((line: string, lineIndex: number) => {
        doc.text(line, left + index * colWidth + 5, y + 11 + lineIndex * lineHeight, {
          maxWidth: colWidth - 8,
        });
      });
    });
  };

  let y = top + 36;
  drawHeader(y);
  y += headerHeight;

  reviews.map(reviewRowToExportRow).forEach((cells, index) => {
    if (y + rowHeight > pageHeight - 36) {
      doc.addPage();
      y = top;
      drawHeader(y);
      y += headerHeight;
    }
    drawRow(cells, y, index % 2 === 1);
    y += rowHeight;
  });

  doc.save(`${filenamePrefix}-${stamp}.pdf`);
  return true;
}
