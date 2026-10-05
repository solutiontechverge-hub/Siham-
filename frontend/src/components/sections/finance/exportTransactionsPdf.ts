import {
  TRANSACTION_EXPORT_HEADERS,
  transactionRowToExportRow,
} from "./exportTransactionsExcel";
import { formatNetAmountEur, type TransactionRow } from "../../../app/professionals/fixed-location/finance/data/transactions";

export async function exportTransactionsToPdf(
  rows: readonly TransactionRow[],
  filenamePrefix = "transactions-overview",
): Promise<boolean> {
  if (rows.length === 0) return false;

  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
  const left = 40;
  const top = 48;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const usableWidth = pageWidth - left * 2;

  const colCount = TRANSACTION_EXPORT_HEADERS.length;
  const colWidth = usableWidth / colCount;
  const headerHeight = 22;
  const rowHeight = 28;
  const lineHeight = 11;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Transactions Overview", left, top);

  const drawHeader = (y: number) => {
    doc.setFillColor(245, 247, 250);
    doc.rect(left, y, usableWidth, headerHeight, "F");
    doc.setDrawColor(220);
    doc.rect(left, y, usableWidth, headerHeight);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(50);
    TRANSACTION_EXPORT_HEADERS.forEach((header, index) => {
      doc.text(header, left + index * colWidth + 6, y + 14, { maxWidth: colWidth - 10 });
    });
  };

  const drawRow = (cells: Array<string | number>, y: number) => {
    doc.setDrawColor(235);
    doc.rect(left, y, usableWidth, rowHeight);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(60);
    cells.forEach((cell, index) => {
      const displayCell = index === 3 && typeof cell === "number" ? formatNetAmountEur(cell) : String(cell ?? "");
      const lines = doc.splitTextToSize(displayCell, colWidth - 10);
      const clipped = lines.slice(0, 2);
      clipped.forEach((line: string, lineIndex: number) => {
        doc.text(line, left + index * colWidth + 6, y + 12 + lineIndex * lineHeight, {
          maxWidth: colWidth - 10,
        });
      });
    });
  };

  let y = top + 28;
  drawHeader(y);
  y += headerHeight;

  const sheetRows = rows.map(transactionRowToExportRow);

  sheetRows.forEach((cells) => {
    if (y + rowHeight > pageHeight - 40) {
      doc.addPage();
      y = 48;
      drawHeader(y);
      y += headerHeight;
    }
    drawRow(cells, y);
    y += rowHeight;
  });

  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`${filenamePrefix}-${stamp}.pdf`);
  return true;
}
