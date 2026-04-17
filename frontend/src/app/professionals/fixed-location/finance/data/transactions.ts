export type TransactionStatus = "Paid" | "Unpaid" | "Refunded";

export type TransactionRow = {
  id: string;

  entryId?: string;
  entryLabel?: string;

  date?: string;

  clientName: string;
  clientEmail: string;
  member?: boolean;

  netAmount: string;

  methodTitle: string;
  methodDetail: string;

  status: TransactionStatus;
};

