export const ALLOWED_BOOKING_STATUSES = [
  "requested",
  "cancelled",
  "completed",
  "confirmed",
  "in_progress",
  "no_show",
  "invalid",
] as const;

export type AllowedBookingStatus = (typeof ALLOWED_BOOKING_STATUSES)[number];

export const SALES_OVERVIEW_OVERDUE_COLOR = "#F79009";

export const SALES_OVERVIEW_COPY = {
  title: "Sales Overview",
  afterTreatmentSummary: "After treatment Summary",
  totalAmount: "Total Amount",
  payment: "Payment",
  penaltyInvoiceTitle: "Penalty invoice",
  penaltyInvoiceSubtitle:
    "This invoice is overdue. Send a penalty invoice to the client.",
  sendPenaltyInvoice: "Send penalty invoice",
  empty: "No sales for this client yet.",
  noLineItems: "No line items available for this document.",
  downloadFailed: "Download failed.",
  markedUnpaid: "Sale marked as Unpaid.",
  markUnpaidFailed: "Could not mark as unpaid.",
  markedPaid: "Sale marked as Paid.",
  markPaidFailed: "Could not mark as paid.",
  transactionDateUpdated: "Transaction date updated.",
  editTransactionDateFailed: "Could not update transaction date.",
  refunded: "Sale refunded.",
  refundFailed: "Unable to refund this sale.",
  refundNoTransactions:
    "No Paid/Prepaid finance transactions found for this sale yet.",
  canceled: "Sale canceled. Payment link deactivated.",
  cancelFailed: "Failed to cancel sale.",
  addonCreated: "New add-on sale created.",
  addonFailed: "Unable to create add-on sale.",
  clientNotifiedEmailFailed: "Client notified in app. Email could not be sent.",
  clientNotifyFailed: "Sale saved, but client notification failed.",
  saleUpdated: "Sale updated.",
  bookingCompleteFailed:
    "Invoice saved, but the booking status could not be updated.",
  invoiceReissued: "Invoice reissued with new due date.",
  noteSaved: "Note saved.",
  noteDeleted: "Note deleted.",
  fallbackClient: "Client",
  downloadSuccess: (format: string) =>
    `Invoice downloaded as ${format.toUpperCase()}.`,
  clientNotifiedAt: (emailTo: string) =>
    `Client notified${emailTo ? ` at ${emailTo}` : ""} (app + email).`,
} as const;
