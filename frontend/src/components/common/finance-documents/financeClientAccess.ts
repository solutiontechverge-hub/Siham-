import type { TransactionRow } from "../../../app/professionals/fixed-location/finance/data/transactions";

/** Registered Mollure clients — invoice client fields are read-only. */
export function isMollureFinanceClient(row: TransactionRow | null | undefined): boolean {
  return row?.clientType === "mollure";
}

export function canEditFinanceInvoiceClient(row: TransactionRow | null | undefined): boolean {
  if (!row) return true;
  return !isMollureFinanceClient(row);
}
