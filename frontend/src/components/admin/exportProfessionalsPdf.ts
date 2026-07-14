import type { MockProfessional } from "./adminMockData";
import {
  buildProfessionalExportStamp,
  buildProfessionalExportSubtitle,
  PROFESSIONAL_EXPORT_HEADERS,
  PROFESSIONAL_EXPORT_TITLE,
  professionalRowToExportRow,
} from "./exportProfessionalsData";

export async function exportProfessionalsToPdf(
  professionals: readonly MockProfessional[],
  filenamePrefix = "professional-management",
): Promise<boolean> {
  if (professionals.length === 0) return false;

  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
  const left = 28;
  const top = 42;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const usableWidth = pageWidth - left * 2;

  const colCount = PROFESSIONAL_EXPORT_HEADERS.length;
  const colWidth = usableWidth / colCount;
  const headerHeight = 24;
  const rowHeight = 26;
  const lineHeight = 10;
  const stamp = buildProfessionalExportStamp();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(52, 74, 102);
  doc.text(PROFESSIONAL_EXPORT_TITLE, left, top);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(113, 129, 154);
  doc.text(buildProfessionalExportSubtitle(professionals.length, stamp), left, top + 18);

  const drawHeader = (y: number) => {
    doc.setFillColor(232, 251, 247);
    doc.rect(left, y, usableWidth, headerHeight, "F");
    doc.setDrawColor(210, 227, 236);
    doc.rect(left, y, usableWidth, headerHeight);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(52, 74, 102);
    PROFESSIONAL_EXPORT_HEADERS.forEach((header, index) => {
      doc.text(header, left + index * colWidth + 4, y + 15, { maxWidth: colWidth - 6 });
    });
  };

  const drawRow = (cells: string[], y: number, shaded: boolean) => {
    if (shaded) {
      doc.setFillColor(247, 251, 253);
      doc.rect(left, y, usableWidth, rowHeight, "F");
    }
    doc.setDrawColor(230, 238, 244);
    doc.rect(left, y, usableWidth, rowHeight);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(52, 74, 102);
    cells.forEach((cell, index) => {
      const lines = doc.splitTextToSize(String(cell ?? ""), colWidth - 6);
      const clipped = lines.slice(0, 2);
      clipped.forEach((line: string, lineIndex: number) => {
        doc.text(line, left + index * colWidth + 4, y + 11 + lineIndex * lineHeight, {
          maxWidth: colWidth - 6,
        });
      });
    });
  };

  let y = top + 36;
  drawHeader(y);
  y += headerHeight;

  professionals.map(professionalRowToExportRow).forEach((cells, index) => {
    if (y + rowHeight > pageHeight - 36) {
      doc.addPage();
      y = 48;
      drawHeader(y);
      y += headerHeight;
    }
    drawRow(cells, y, index % 2 === 1);
    y += rowHeight;
  });

  doc.save(`${filenamePrefix}-${stamp}.pdf`);
  return true;
}
