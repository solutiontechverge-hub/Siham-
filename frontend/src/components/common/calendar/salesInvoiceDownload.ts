import type { TransactionRow } from "../../../app/professionals/fixed-location/finance/data/transactions";
import { roundBookingMoney as roundMoney } from "../../../data/bookingLinePricing";
import { getIssuedDocument, hasStoredDocumentSnapshot } from "../finance-documents";
import type { SalesOverviewCardData } from "./salesOverview.types";

function issuedExportLines(financeRow?: TransactionRow | null) {
  if (!financeRow || !hasStoredDocumentSnapshot(financeRow)) return null;
  const doc = getIssuedDocument(financeRow);
  const lines = (doc?.lineItems ?? []).map((line) => ({
    label: String(line.description || "Item"),
    amount: Number(line.totalPrice) || 0,
  }));
  if (!lines.length) return null;
  const total =
    Number(doc?.totalPrice) ||
    Number(financeRow.grossAmount) ||
    lines.reduce((sum, line) => sum + line.amount, 0);
  return {
    title: doc?.documentNumber || doc?.receiptNumber || "Invoice",
    clientName: doc?.client?.legalName || financeRow.clientName,
    clientEmail: doc?.client?.email || financeRow.clientEmail || "",
    bookingCode: financeRow.bookingId || financeRow.entryId || "",
    methodDateLine: [financeRow.methodTitle, financeRow.date].filter(Boolean).join(", "),
    lines,
    total,
    highlightLabel: "Total",
    highlightAmount: total,
  };
}

export async function downloadSalesInvoicePdf(
  card: SalesOverviewCardData,
  financeRow?: TransactionRow | null,
) {
  const issued = issuedExportLines(financeRow);
  const source = issued ?? {
    title: card.title || "Invoice",
    clientName: card.clientName,
    clientEmail: card.clientEmail || "",
    bookingCode: card.bookingCode,
    methodDateLine: card.methodDateLine || "",
    lines: card.lines,
    total: card.total,
    highlightLabel: card.highlightLabel,
    highlightAmount: card.highlightAmount,
  };

  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const left = 48;
  let y = 56;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(source.title || "Invoice", left, y);
  y += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Client: ${source.clientName}`, left, y);
  y += 16;
  if (source.clientEmail) {
    doc.text(`Email: ${source.clientEmail}`, left, y);
    y += 16;
  }
  doc.text(`Booking: ${source.bookingCode}`, left, y);
  y += 16;
  if (source.methodDateLine) {
    doc.text(source.methodDateLine, left, y);
    y += 20;
  }
  if (!issued) {
    for (const meta of card.metaLines ?? []) {
      doc.text(meta, left, y);
      y += 14;
    }
  }

  y += 8;
  doc.setFont("helvetica", "bold");
  doc.text("Items", left, y);
  y += 16;
  doc.setFont("helvetica", "normal");

  for (const line of source.lines) {
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
  doc.text(`Total: €${roundMoney(source.total).toFixed(2)}`, left, y);
  y += 18;
  doc.text(
    `${source.highlightLabel}: €${roundMoney(source.highlightAmount).toFixed(2)}`,
    left,
    y,
  );

  doc.save(`${source.bookingCode || card.bookingCode || "invoice"}-${card.kind}.pdf`);
}

export async function downloadSalesInvoiceExcel(
  card: SalesOverviewCardData,
  financeRow?: TransactionRow | null,
) {
  const issued = issuedExportLines(financeRow);
  const source = issued ?? {
    title: card.title,
    clientName: card.clientName,
    clientEmail: card.clientEmail || "",
    bookingCode: card.bookingCode,
    methodDateLine: card.methodDateLine || card.paymentMethodLabel || "",
    lines: card.lines,
    total: card.total,
    highlightLabel: card.highlightLabel,
    highlightAmount: card.highlightAmount,
  };

  const XLSX = await import("xlsx");
  const rows = [
    ["Title", source.title],
    ["Client", source.clientName],
    ["Email", source.clientEmail || ""],
    ["Booking", source.bookingCode],
    ["Status", card.statusBadge || ""],
    ["Method", source.methodDateLine || ""],
    ...(!issued ? (card.metaLines ?? []).map((line) => ["Meta", line]) : []),
    [],
    ["Item", "Amount"],
    ...source.lines.map((line) => [line.label, roundMoney(line.amount)]),
    [],
    ["Total", roundMoney(source.total)],
    [source.highlightLabel, roundMoney(source.highlightAmount)],
  ];
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Invoice");
  XLSX.writeFile(book, `${source.bookingCode || card.bookingCode || "invoice"}-${card.kind}.xlsx`);
}
