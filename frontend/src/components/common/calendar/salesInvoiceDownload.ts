import type { SalesOverviewCardData } from "./salesOverview.types";
import { roundBookingMoney as roundMoney } from "../../../data/bookingLinePricing";

export async function downloadSalesInvoicePdf(card: SalesOverviewCardData) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const left = 48;
  let y = 56;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(card.title || "Invoice", left, y);
  y += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Client: ${card.clientName}`, left, y);
  y += 16;
  if (card.clientEmail) {
    doc.text(`Email: ${card.clientEmail}`, left, y);
    y += 16;
  }
  doc.text(`Booking: ${card.bookingCode}`, left, y);
  y += 16;
  if (card.methodDateLine) {
    doc.text(card.methodDateLine, left, y);
    y += 20;
  }
  for (const meta of card.metaLines ?? []) {
    doc.text(meta, left, y);
    y += 14;
  }

  y += 8;
  doc.setFont("helvetica", "bold");
  doc.text("Items", left, y);
  y += 16;
  doc.setFont("helvetica", "normal");

  for (const line of card.lines) {
    doc.text(line.label, left, y);
    doc.text(`€${roundMoney(line.amount).toFixed(2)}`, left + 420, y, { align: "right" });
    y += 15;
    if (y > 760) {
      doc.addPage();
      y = 56;
    }
  }

  y += 10;
  doc.setFont("helvetica", "bold");
  doc.text(`Total: €${roundMoney(card.total).toFixed(2)}`, left, y);
  y += 18;
  doc.text(`${card.highlightLabel}: €${roundMoney(card.highlightAmount).toFixed(2)}`, left, y);

  doc.save(`${card.bookingCode || "invoice"}-${card.kind}.pdf`);
}

export async function downloadSalesInvoiceExcel(card: SalesOverviewCardData) {
  const XLSX = await import("xlsx");
  const rows = [
    ["Title", card.title],
    ["Client", card.clientName],
    ["Email", card.clientEmail || ""],
    ["Booking", card.bookingCode],
    ["Status", card.statusBadge || ""],
    ["Method", card.methodDateLine || card.paymentMethodLabel || ""],
    ...(card.metaLines ?? []).map((line) => ["Meta", line]),
    [],
    ["Item", "Amount"],
    ...card.lines.map((line) => [line.label, roundMoney(line.amount)]),
    [],
    ["Total", roundMoney(card.total)],
    [card.highlightLabel, roundMoney(card.highlightAmount)],
  ];
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Invoice");
  XLSX.writeFile(book, `${card.bookingCode || "invoice"}-${card.kind}.xlsx`);
}
