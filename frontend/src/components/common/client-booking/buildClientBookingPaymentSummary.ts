import { buildBookingSummarySections } from "./buildBookingSummarySections";
import type { ClientBookingDraft, ClientBookingDraftService } from "./types";
import {
  formatFinanceDateTime,
  formatFinanceMethodLabel,
  formatOfflinePrepaymentVisitNote,
} from "../booking-finance/formatBookingFinance";
import type { BookingPaymentSummarySection } from "../booking-finance/bookingFinance.types";
import type { AfterTreatmentPayerRow } from "../calendar/resolveAfterTreatmentPayerRows";
import { isOfflinePaymentMethod } from "./checkoutPaymentOptions";
import {
  isProtectiveFeeEntryLabel,
  LATE_CANCELLATION_BOOKING_FEE,
  LATE_RESCHEDULING_FEE,
} from "../finance-documents/protectiveFeeInvoice";

export const afterTreatmentLineId = (payerKey: string) =>
  `after-treatment-${payerKey}`;

export function parseAfterTreatmentPayerKey(
  lineId?: string | null,
): string | null {
  const raw = String(lineId ?? "");
  if (!raw.startsWith("after-treatment-")) return null;
  return raw.slice("after-treatment-".length) || null;
}

export type PaymentSummaryLine = {
  id: string;
  label: string;
  amount: number;
  showInvoice?: boolean;
  showReceipt?: boolean;
  showPayNow?: boolean;
  note?: string;
};

export type PaymentSummarySection = BookingPaymentSummarySection;

type BuildInput = {
  draft: ClientBookingDraft | null;
  requesterName: string;
  prepaid?: boolean;
  paid?: boolean;
  requiresPrepayment?: boolean;
  prepaymentPercent?: number;
  paymentDue?: boolean;
  /** Invoice due date is before today — hide Pay Now, show wait note. */
  paymentOverdue?: boolean;
  /** Label for the active invoice due date (shown after reissue). */
  invoiceDueDateLabel?: string | null;
  hasEditPrepayment?: boolean;
  paymentDateIso?: string | null;
  paymentTime?: string | null;
  paymentMethod?: string | null;
  prepaidAmountOverride?: number;
  /** Offline prepayment still appears as "Prepayment" before online capture. */
  showUnpaidPrepayment?: boolean;
  shopName?: string | null;
  /** Charged LCF/LRF/NS finance rows (due or settled) for Fee Summary. */
  paidProtectiveFees?: ReadonlyArray<{
    entryLabel?: string | null;
    amount: number;
    dateLabel?: string;
    methodLabel?: string;
    status?: string;
    transactionId?: string;
    settled?: boolean;
  }>;
  /**
   * From pro checkout splitBill + finance. When empty / omitted, After Treatment
   * section is skipped (prepayment-only phase).
   */
  afterTreatmentPayers?: readonly AfterTreatmentPayerRow[];
};

function protectiveFeeLineId(fee: {
  entryLabel?: string | null;
  transactionId?: string;
}): string {
  if (fee.transactionId) return `fee-tx-${fee.transactionId}`;
  const label = String(fee.entryLabel ?? "").trim();
  if (label === LATE_RESCHEDULING_FEE) return "fee-lrf";
  if (label.toLowerCase() === "no-show fee") return "fee-ns";
  return "fee-lcf";
}

function sumServices(services: ClientBookingDraftService[]): number {
  return Math.round((services.reduce((sum, s) => sum + s.price, 0) + Number.EPSILON) * 100) / 100;
}

function splitServices(services: ClientBookingDraftService[]) {
  const standard: ClientBookingDraftService[] = [];
  const addOns: ClientBookingDraftService[] = [];
  for (const service of services) {
    if (service.isAddOn) addOns.push(service);
    else standard.push(service);
  }
  return { standard, addOns };
}

function personLabel(name: string, isRequester?: boolean): string {
  if (isRequester) return "Main Client";
  const trimmed = name.trim();
  return trimmed.toLowerCase().startsWith("guest") ? trimmed : `Guest ${trimmed}`;
}

export function buildClientBookingPaymentSummary(input: BuildInput): PaymentSummarySection[] {
  const {
    draft,
    requesterName,
    prepaid = false,
    paid = false,
    requiresPrepayment = false,
    prepaymentPercent = 0,
    paymentDue = false,
    paymentOverdue = false,
    invoiceDueDateLabel = null,
    hasEditPrepayment = false,
    paymentDateIso,
    paymentTime,
    paymentMethod,
    prepaidAmountOverride,
    showUnpaidPrepayment = false,
    shopName,
    paidProtectiveFees = [],
    afterTreatmentPayers = [],
  } = input;

  if (!draft?.services?.length && !paidProtectiveFees.length) return [];

  const bookingDate = formatFinanceDateTime(
    paymentDateIso || draft?.selectedDateISO,
    paymentTime || draft?.selectedTime,
  );
  const methodLabel = formatFinanceMethodLabel(paymentMethod);
  const offline = isOfflinePaymentMethod(paymentMethod);
  const visitNote = formatOfflinePrepaymentVisitNote(shopName, bookingDate);
  const total =
    draft?.total ??
    (draft?.services?.length ? sumServices(draft.services) : 0);
  const computedPrepaid =
    Math.round(((total * prepaymentPercent) / 100 + Number.EPSILON) * 100) / 100;
  const prepaidAmount =
    prepaidAmountOverride != null && prepaidAmountOverride > 0
      ? prepaidAmountOverride
      : computedPrepaid;
  const sections: PaymentSummarySection[] = [];

  if (requiresPrepayment || prepaid || showUnpaidPrepayment) {
    const prepaymentLines: PaymentSummaryLine[] = [];
    const includePrepayment =
      (prepaid || showUnpaidPrepayment) && prepaidAmount > 0;
    if (includePrepayment) {
      prepaymentLines.push({
        id: "prepaid-main",
        label: `Prepayment - ${bookingDate} - ${methodLabel}`,
        amount: prepaidAmount,
        showInvoice: !offline,
        showReceipt: !offline,
        note: offline ? visitNote : undefined,
      });
    }
    if (hasEditPrepayment && includePrepayment) {
      prepaymentLines.push({
        id: "prepaid-er",
        label: `Prepayment ER - ${bookingDate} - ${methodLabel}`,
        amount: prepaidAmount,
        showInvoice: !offline,
        showReceipt: !offline,
        note: offline ? visitNote : undefined,
      });
    }
    if (prepaymentLines.length) {
      sections.push({
        id: "prepayment",
        title: "Prepayment",
        amount: prepaymentLines.reduce((sum, line) => sum + line.amount, 0),
        lines: prepaymentLines,
      });
    }
  }

  const chargedFees = paidProtectiveFees.filter(
    (fee) =>
      isProtectiveFeeEntryLabel(fee.entryLabel) &&
      Number.isFinite(fee.amount) &&
      fee.amount > 0,
  );
  if (chargedFees.length) {
    const feeLines: PaymentSummaryLine[] = chargedFees.map((fee) => {
      const label =
        fee.entryLabel === LATE_RESCHEDULING_FEE
          ? LATE_RESCHEDULING_FEE
          : String(fee.entryLabel ?? "").toLowerCase() === "no-show fee"
            ? "No-show fee"
            : String(fee.entryLabel || LATE_CANCELLATION_BOOKING_FEE);
      const settled =
        fee.settled === true ||
        ["paid", "prepaid"].includes(String(fee.status ?? "").toLowerCase());
      const statusLabel = settled
        ? "Paid"
        : String(fee.status ?? "").toLowerCase() === "overdue"
          ? "Overdue"
          : "Payment Due";
      const when = fee.dateLabel || bookingDate;
      const method = fee.methodLabel || methodLabel;
      return {
        id: protectiveFeeLineId(fee),
        label: `${label} - ${statusLabel} - ${when} - ${method}`,
        amount: fee.amount,
        showInvoice: true,
        showReceipt: settled,
        note: settled ? undefined : "Invoice issued — payment pending",
      };
    });
    sections.push({
      id: "fee-summary",
      title: "Fee Summary",
      variant: "fee",
      amount: feeLines.reduce((sum, line) => sum + line.amount, 0),
      lines: feeLines,
    });
  }

  if (!draft?.services?.length) return sections;

  // After Treatment only from pro checkout payer rows (not draft people guesswork).
  if (afterTreatmentPayers.length) {
    const afterTreatmentLines: PaymentSummaryLine[] = afterTreatmentPayers.map(
      (payer) => ({
        id: afterTreatmentLineId(payer.payerKey),
        label: `${payer.labelName} - ${payer.statusLabel} - ${bookingDate} - ${payer.methodLabel}`,
        amount: payer.amount,
        showInvoice: payer.showInvoice,
        showReceipt: payer.showReceipt,
        showPayNow: payer.showPayNow,
        note: payer.note,
      }),
    );
    sections.push({
      id: "after-treatment",
      title: "After Treatment Payment",
      amount: afterTreatmentLines.reduce((sum, line) => sum + line.amount, 0),
      lines: afterTreatmentLines,
    });

    const summarySections = buildBookingSummarySections(draft);
    const addOnLines: PaymentSummaryLine[] = [];
    for (const section of summarySections) {
      const { addOns } = splitServices(section.items);
      if (!addOns.length) continue;
      const amount = sumServices(addOns);
      const isRequester = section.isRequester ?? section.title === requesterName;
      const labelName = isRequester
        ? "Main Client"
        : personLabel(section.title, false);
      const payerMatch = afterTreatmentPayers.find((p) =>
        isRequester
          ? p.role === "main_client"
          : p.labelName.toLowerCase().includes(section.title.trim().toLowerCase()),
      );
      const method = payerMatch?.methodLabel ?? "Offline Direct";
      const status = payerMatch?.statusLabel ?? "Paid";
      addOnLines.push({
        id: `addon-${section.key}`,
        label: `${labelName} - ${status} - ${bookingDate} - ${method}`,
        amount,
      });
    }
    if (addOnLines.length) {
      sections.push({
        id: "addons",
        title: "Add Ons - After Checkout",
        amount: addOnLines.reduce((sum, line) => sum + line.amount, 0),
        lines: addOnLines,
      });
    }
  }

  return sections;
}

export function paymentSummaryGrandTotal(sections: PaymentSummarySection[]): number {
  return sections.reduce(
    (sum, section) => sum + section.lines.reduce((lineSum, line) => lineSum + line.amount, 0),
    0,
  );
}
