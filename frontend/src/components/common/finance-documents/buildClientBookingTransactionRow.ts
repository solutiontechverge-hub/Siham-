import type {
  TransactionClientType,
  TransactionDocument,
  TransactionDocumentParty,
  TransactionRow,
} from "../../../app/professionals/fixed-location/finance/data/transactions";
import type { ClientBookingDraft } from "../client-booking/types";
import type { FinanceInvoiceSettings } from "./useFinanceInvoiceSettings";

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

function vatRateFromText(vat: string): number | null {
  const match = String(vat).match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const value = Number(match[0]);
  return Number.isFinite(value) ? value : null;
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

  const serviceLineItems = draft.services.map((service) => {
    const vat = resolveVatForLabel(service.name, financeSettings, "service");
    return {
    description: service.name,
    quantity: 1,
    vat,
    vatRate: vatRateFromText(vat),
    pricePerUnit: service.price,
    totalPrice: service.price,
    };
  });

  const productLineItems = (draft.products ?? []).map((product) => {
    const quantity = Math.max(1, Number(product.quantity) || 1);
    const unitPrice =
      product.unitPrice ??
      (quantity > 0 ? product.price / quantity : product.price);
    const vat = resolveVatForLabel(product.name, financeSettings, "product");
    return {
      description: product.name,
      quantity,
      vat,
      vatRate: vatRateFromText(vat),
      pricePerUnit: unitPrice,
      totalPrice: product.price,
    };
  });

  const lineItems =
    asPrepaymentReceipt && prepaidValue > 0
      ? [
          {
            description: "Prepayment",
            quantity: 1,
            vat: "0%",
            vatRate: 0,
            pricePerUnit: prepaidValue,
            totalPrice: prepaidValue,
          },
        ]
      : [...serviceLineItems, ...productLineItems];

  const bookingItems = (asPrepaymentReceipt && prepaidValue > 0
    ? [{ label: "Prepayment", value: prepaidValue }]
    : [
        ...draft.services.map((service) => ({
          label: service.name,
          value: service.price,
        })),
        ...(draft.products ?? []).map((product) => ({
          label: product.name,
          value: product.price,
        })),
      ]
  );

  const totalFromServices =
    draft.services.reduce((sum, s) => sum + s.price, 0) +
    (draft.products ?? []).reduce((sum, product) => sum + product.price, 0);
  const totalAmount = documentAmount ?? draft.total ?? totalFromServices;
  const document: TransactionDocument = {
    // Invoice/receipt numbers are server-issued only. Keep these absent until
    // the persisted finance transaction returns its document snapshot.
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
    totalPrice: totalAmount,
    ...(prepaidValue > 0 ? { prepaymentAmount: prepaidValue } : {}),
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
    netAmount: totalAmount,
    methodTitle,
    methodDetail,
    status: "Paid",
    document,
  };
}
