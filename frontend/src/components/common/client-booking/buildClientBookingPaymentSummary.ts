import { buildBookingSummarySections } from "./buildBookingSummarySections";
import type { ClientBookingDraft, ClientBookingDraftService } from "./types";
import {
  formatFinanceDateTime,
  formatFinanceMethodLabel,
  formatOfflinePrepaymentVisitNote,
} from "../booking-finance/formatBookingFinance";
import type { BookingPaymentSummarySection } from "../booking-finance/bookingFinance.types";
import { isOfflinePaymentMethod } from "./checkoutPaymentOptions";

export type PaymentSummaryLine = {
  id: string;
  label: string;
  amount: number;
  showInvoice?: boolean;
  showReceipt?: boolean;
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
  hasEditPrepayment?: boolean;
  paymentDateIso?: string | null;
  paymentTime?: string | null;
  paymentMethod?: string | null;
  prepaidAmountOverride?: number;
  /** Offline prepayment still appears as "Prepayment" before online capture. */
  showUnpaidPrepayment?: boolean;
  shopName?: string | null;
};

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
    hasEditPrepayment = false,
    paymentDateIso,
    paymentTime,
    paymentMethod,
    prepaidAmountOverride,
    showUnpaidPrepayment = false,
    shopName,
  } = input;

  if (!draft?.services?.length) return [];

  const bookingDate = formatFinanceDateTime(
    paymentDateIso || draft.selectedDateISO,
    paymentTime || draft.selectedTime,
  );
  const methodLabel = formatFinanceMethodLabel(paymentMethod);
  const offline = isOfflinePaymentMethod(paymentMethod);
  const visitNote = formatOfflinePrepaymentVisitNote(shopName, bookingDate);
  const total = draft.total ?? sumServices(draft.services);
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

  const summarySections = buildBookingSummarySections(draft);
  const afterTreatmentLines: PaymentSummaryLine[] = [];

  for (const section of summarySections) {
    const { standard } = splitServices(section.items);
    if (!standard.length) continue;

    const amount = sumServices(standard);
    const isRequester = section.isRequester ?? section.title === requesterName;
    const labelName = isRequester ? "Main Client" : personLabel(section.title, false);
    const status = paymentDue ? "Payment Due" : paid ? "Paid" : "Pending";
    const method = isRequester ? methodLabel : "Offline Direct";

    afterTreatmentLines.push({
      id: `after-treatment-${section.key}`,
      label: `${labelName} - ${status} - ${bookingDate} - ${method}`,
      amount,
      showInvoice: isRequester && paid && !paymentDue,
      showReceipt: isRequester && paid && !paymentDue,
    });
  }

  if (!afterTreatmentLines.length) {
    const { standard } = splitServices(draft.services);
    if (standard.length) {
      const amount = sumServices(standard);
      const status = paymentDue ? "Payment Due" : paid ? "Paid" : "Pending";
      afterTreatmentLines.push({
        id: "after-treatment-main",
        label: `Main Client - ${status} - ${bookingDate} - ${methodLabel}`,
        amount,
        showInvoice: paid && !paymentDue,
        showReceipt: paid && !paymentDue,
      });
    }
  }

  if (afterTreatmentLines.length) {
    sections.push({
      id: "after-treatment",
      title: "After Treatment Payment",
      amount: afterTreatmentLines.reduce((sum, line) => sum + line.amount, 0),
      lines: afterTreatmentLines,
    });
  }

  const addOnLines: PaymentSummaryLine[] = [];
  for (const section of summarySections) {
    const { addOns } = splitServices(section.items);
    if (!addOns.length) continue;

    const amount = sumServices(addOns);
    const isRequester = section.isRequester ?? section.title === requesterName;
    const labelName = isRequester ? "Main Client" : personLabel(section.title, false);
    const status = paymentDue ? "Payment Due" : paid ? "Paid" : "Pending";

    addOnLines.push({
      id: `addon-${section.key}`,
      label: `${labelName} - ${status} - ${bookingDate} - Offline Direct`,
      amount,
    });
  }

  if (!addOnLines.length) {
    const { addOns } = splitServices(draft.services);
    if (addOns.length) {
      const amount = sumServices(addOns);
      const status = paymentDue ? "Payment Due" : paid ? "Paid" : "Pending";
      addOnLines.push({
        id: "addon-main",
        label: `Main Client - ${status} - ${bookingDate} - Offline Direct`,
        amount,
      });
    }
  }

  if (addOnLines.length) {
    sections.push({
      id: "addons",
      title: "Add Ons - After Checkout",
      amount: addOnLines.reduce((sum, line) => sum + line.amount, 0),
      lines: addOnLines,
    });
  }

  return sections;
}

export function paymentSummaryGrandTotal(sections: PaymentSummarySection[]): number {
  return sections.reduce(
    (sum, section) => sum + section.lines.reduce((lineSum, line) => lineSum + line.amount, 0),
    0,
  );
}
