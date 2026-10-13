import * as XLSX from "xlsx";
import {
  formatTransactionStatusLabel,
  getTransactionClientTypeLabel,
  shouldShowTransactionClientEmail,
  type TransactionRow,
} from "../../../app/professionals/fixed-location/finance/data/transactions";

export const TRANSACTION_EXPORT_HEADERS = [
  "Entry ID",
  "Date",
  "Client Name",
  "Net Amount",
  "Method",
  "Status",
  "Invoice/Receipt",
] as const;

function formatClientNameCell(row: TransactionRow): string {
  const clientTypeLabel = getTransactionClientTypeLabel(row.clientType);
  const lines = [row.clientName];
  if (clientTypeLabel) lines.push(clientTypeLabel);
  if (shouldShowTransactionClientEmail(row)) lines.push(row.clientEmail.trim());
  return lines.join("\n");
}

function formatMethodCell(row: TransactionRow): string {
  const lines = [row.methodTitle];
  if (row.methodDetail?.trim()) lines.push(row.methodDetail.trim());
  return lines.join("\n");
}

export function transactionRowToExportRow(row: TransactionRow): Array<string | number> {
  return [
    row.entryLabel ?? row.entryId ?? "",
    row.date ?? "",
    formatClientNameCell(row),
    row.netAmount,
    formatMethodCell(row),
    formatTransactionStatusLabel(row.status, row.entryLabel),
    "Invoice, Receipt",
  ];
}

export function exportTransactionsToExcel(rows: readonly TransactionRow[], filenamePrefix = "transactions") {
  if (rows.length === 0) return false;

  const sheetData = [TRANSACTION_EXPORT_HEADERS.slice(), ...rows.map(transactionRowToExportRow)];
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

  const columnWidths = TRANSACTION_EXPORT_HEADERS.map((header, index) => {
    const maxLen = sheetData.reduce((max, row) => {
      const cell = String(row[index] ?? "");
      const longestLine = cell.split("\n").reduce((lineMax, line) => Math.max(lineMax, line.length), 0);
      return Math.max(max, longestLine);
    }, header.length);
    return { wch: Math.min(Math.max(maxLen + 2, 12), 48) };
  });
  worksheet["!cols"] = columnWidths;

  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `${filenamePrefix}-${stamp}.xlsx`);
  return true;
}
