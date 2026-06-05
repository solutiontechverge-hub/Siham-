import { exportTransactionsToExcel } from "./exportTransactionsExcel";
import { exportTransactionsToPdf } from "./exportTransactionsPdf";
import type { TransactionRow } from "../../../app/professionals/fixed-location/finance/data/transactions";

export type OverviewExportFormat = "pdf" | "excel";

export async function downloadTransactionsOverview(
  rows: readonly TransactionRow[],
  format: OverviewExportFormat,
  filenamePrefix = "transactions-overview",
): Promise<boolean> {
  if (rows.length === 0) return false;

  if (format === "excel") {
    return exportTransactionsToExcel(rows, filenamePrefix);
  }

  return exportTransactionsToPdf(rows, filenamePrefix);
}
