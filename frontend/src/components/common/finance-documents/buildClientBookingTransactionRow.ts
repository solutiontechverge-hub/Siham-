import type {
  TransactionClientType,
  TransactionDocument,
  TransactionDocumentParty,
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

function resolveVatForLabel(
  name: string,
  settings: FinanceInvoiceSettings,
  kind: "service" | "product",
): string {
  const normalized = name.trim().toLowerCase();
  if (kind === "product") {
    const match = [...settings.products, ...(settings.uniqueItems ?? [])].find(
      (row) => {
        const label = row.name.trim().toLowerCase();
        return label && (normalized.includes(label) || label.includes(normalized));
      },
    );
    return match?.vat ?? "0%";
  }
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
  /** Prepayment amount shown on invoice/receipt as "Prepayment". */
  prepaymentAmount?: number;
  /** Receipt for a prepayment: line item is labeled Prepayment. */
  asPrepaymentReceipt?: boolean;
  clientType?: TransactionClientType;
  methodTitle?: string;
  methodDetail?: string;
  clientParty?: Partial<TransactionDocumentParty>;
};

export function buildClientBookingTransactionRow({
  bookingRef,
  draft,
  requesterName,
  requesterEmail,
  financeSettings,
  documentAmount,
  prepaymentAmount,
  asPrepaymentReceipt = false,
  clientType = "mollure",
  methodTitle = "Online - Direct",
  methodDetail = "Stripe",
  clientParty,
}: BuildClientBookingTransactionRowInput): TransactionRow {
  const serviceDate = draft.selectedDateISO || new Date().toISOString().slice(0, 10);
  const serviceTime = draft.selectedTime?.trim() || undefined;
  const invoiceDate = new Date().toISOString().slice(0, 10);
  const dueValue = Number(financeSettings.paymentTerms.originalDueValue) || 2;
  const dueUnit = financeSettings.paymentTerms.originalDueUnit.toLowerCase();
  const dueDays = dueUnit.startsWith("month") ? dueValue * 30 : dueUnit.startsWith("day") ? dueValue : dueValue * 7;
  const dueDate = addDaysIso(invoiceDate, dueDays);

  const prepaidValue =
    prepaymentAmount != null && prepaymentAmount > 0
      ? prepaymentAmount
      : asPrepaymentReceipt && documentAmount != null && documentAmount > 0
        ? documentAmount
        : 0;

  const serviceLineItems = draft.services.map((service) => ({
    description: service.name,
    quantity: "1",
    vat: resolveVatForLabel(service.name, financeSettings, "service"),
    pricePerUnit: formatCurrencyEur(service.price),
    totalPrice: formatCurrencyEur(service.price),
  }));

  const productLineItems = (draft.products ?? []).map((product) => {
    const quantity = Math.max(1, Number(product.quantity) || 1);
    const unitPrice =
      product.unitPrice ??
      (quantity > 0 ? product.price / quantity : product.price);
    return {
      description: product.name,
      quantity: String(quantity),
      vat: resolveVatForLabel(product.name, financeSettings, "product"),
      pricePerUnit: formatCurrencyEur(unitPrice),
      totalPrice: formatCurrencyEur(product.price),
    };
  });

  const prepaidLabel = formatCurrencyEur(prepaidValue);
  const lineItems =
    asPrepaymentReceipt && prepaidValue > 0
      ? [
          {
            description: "Prepayment",
            quantity: "1",
            vat: "0%",
            pricePerUnit: prepaidLabel,
            totalPrice: prepaidLabel,
          },
        ]
      : [...serviceLineItems, ...productLineItems];

  const bookingItems = (asPrepaymentReceipt && prepaidValue > 0
    ? [{ label: "Prepayment", value: prepaidLabel }]
    : [
        ...draft.services.map((service) => ({
          label: service.name,
          value: formatCurrencyEur(service.price),
        })),
        ...(draft.products ?? []).map((product) => ({
          label: product.name,
          value: formatCurrencyEur(product.price),
        })),
      ]
  );

  const totalFromServices =
    draft.services.reduce((sum, s) => sum + s.price, 0) +
    (draft.products ?? []).reduce((sum, product) => sum + product.price, 0);
  const totalAmount = documentAmount ?? draft.total ?? totalFromServices;
  const totalPriceLabel = formatCurrencyEur(totalAmount);
  const receiptNumber = `${bookingRef.replace(/[^a-zA-Z0-9]/g, "")}${String(Date.now()).slice(-4)}`;

  const document: TransactionDocument = {
    documentNumber: bookingRef,
    receiptNumber,
    serviceDate,
    serviceTime,
    invoiceDate,
    dueDate,
    lateFeeNotice: financeSettings.paymentTerms.originalPenaltyValue
      ? `Late payment fee: ${financeSettings.paymentTerms.originalPenaltyValue} ${financeSettings.paymentTerms.originalPenaltyUnit} applies after the due date.`
      : undefined,
    client: {
      legalName: clientParty?.legalName || requesterName,
      email: clientParty?.email || requesterEmail,
      address: clientParty?.address,
      vatNumber: clientParty?.vatNumber,
      cocNumber: clientParty?.cocNumber,
    },
    bookingItems,
    lineItems,
    totalPrice: totalPriceLabel,
    ...(prepaidValue > 0 ? { prepaymentAmount: prepaidLabel } : {}),
  };

  return {
    id: `booking-${bookingRef}`,
    entryType: methodTitle.toLowerCase().includes("offline") ? "offlineBooking" : "onlineBooking",
    entryId: bookingRef,
    date: invoiceDate,
    bookingId: bookingRef,
    entryLabel: asPrepaymentReceipt ? "Prepayment" : "Booking",
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
