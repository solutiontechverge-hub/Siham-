import type {
  TransactionClientType,
  TransactionDocument,
  TransactionRow,
} from "../../../app/professionals/fixed-location/finance/data/transactions";
import type { ClientBookingDraft } from "../client-booking/types";
import type { FinanceInvoiceSettings } from "./useFinanceInvoiceSettings";

function formatCurrencyEur(amount: number) {
  return new Intl.NumberFormat("en-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function resolveVatForService(serviceName: string, settings: FinanceInvoiceSettings): string {
  const normalized = serviceName.trim().toLowerCase();
  const match = settings.services.find((row) => {
    const label = row.service.trim().toLowerCase();
    return label && (normalized.includes(label) || label.includes(normalized));
  });
  return match?.vat ?? "0%";
}

function addDaysIso(isoDate: string, days: number): string {
  const base = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(base.getTime())) return isoDate;
  base.setDate(base.getDate() + days);
  return base.toISOString().slice(0, 10);
}

export type BuildClientBookingTransactionRowInput = {
  bookingRef: string;
  draft: ClientBookingDraft;
  requesterName: string;
  requesterEmail?: string;
  financeSettings: FinanceInvoiceSettings;
  /** When set (e.g. prepayment receipt), document total uses this amount. */
  documentAmount?: number;
  clientType?: TransactionClientType;
  methodTitle?: string;
  methodDetail?: string;
};

export function buildClientBookingTransactionRow({
  bookingRef,
  draft,
  requesterName,
  requesterEmail,
  financeSettings,
  documentAmount,
  clientType = "mollure",
  methodTitle = "Online - Direct",
  methodDetail = "Stripe",
}: BuildClientBookingTransactionRowInput): TransactionRow {
  const serviceDate = draft.selectedDateISO || new Date().toISOString().slice(0, 10);
  const invoiceDate = new Date().toISOString().slice(0, 10);
  const dueValue = Number(financeSettings.paymentTerms.originalDueValue) || 2;
  const dueUnit = financeSettings.paymentTerms.originalDueUnit.toLowerCase();
  const dueDays = dueUnit.startsWith("month") ? dueValue * 30 : dueUnit.startsWith("day") ? dueValue : dueValue * 7;
  const dueDate = addDaysIso(invoiceDate, dueDays);

  const lineItems = draft.services.map((service) => ({
    description: service.name,
    quantity: "1",
    vat: resolveVatForService(service.name, financeSettings),
    pricePerUnit: formatCurrencyEur(service.price),
    totalPrice: formatCurrencyEur(service.price),
  }));

  const bookingItems = draft.services.map((service) => ({
    label: service.name,
    value: formatCurrencyEur(service.price),
  }));

  const totalFromServices = draft.services.reduce((sum, s) => sum + s.price, 0);
  const totalAmount = documentAmount ?? draft.total ?? totalFromServices;
  const totalPriceLabel = formatCurrencyEur(totalAmount);
  const receiptNumber = `${bookingRef.replace(/[^a-zA-Z0-9]/g, "")}${String(Date.now()).slice(-4)}`;

  const document: TransactionDocument = {
    documentNumber: bookingRef,
    receiptNumber,
    serviceDate,
    invoiceDate,
    dueDate,
    lateFeeNotice: financeSettings.paymentTerms.originalPenaltyValue
      ? `Late payment fee: ${financeSettings.paymentTerms.originalPenaltyValue} ${financeSettings.paymentTerms.originalPenaltyUnit} applies after the due date.`
      : undefined,
    client: {
      legalName: requesterName,
      email: requesterEmail,
    },
    bookingItems,
    lineItems,
    totalPrice: totalPriceLabel,
  };

  return {
    id: `booking-${bookingRef}`,
    entryId: bookingRef,
    date: invoiceDate,
    entryLabel: "Booking",
    clientName: requesterName,
    clientEmail: requesterEmail ?? "",
    clientType,
    netAmount: totalPriceLabel,
    methodTitle,
    methodDetail,
    status: "Paid",
    document,
  };
}
