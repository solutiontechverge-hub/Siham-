import { buildBookingSummarySections } from "./buildBookingSummarySections";
import type { ClientBookingDraft, ClientBookingDraftService } from "./types";

export type PaymentSummaryLine = {
  id: string;
  label: string;
  amount: number;
  showInvoice?: boolean;
  showReceipt?: boolean;
};

export type PaymentSummarySection = {
  title: string;
  lines: PaymentSummaryLine[];
};

type BuildInput = {
  draft: ClientBookingDraft | null;
  requesterName: string;
  prepaid?: boolean;
  paid?: boolean;
  requiresPrepayment?: boolean;
  prepaymentPercent?: number;
  paymentDue?: boolean;
  hasEditPrepayment?: boolean;
};

function formatPaymentDate(iso?: string): string {
  const d = iso ? new Date(`${iso}T00:00:00`) : new Date();
  if (Number.isNaN(d.getTime())) return new Date().toLocaleDateString("en-GB");
  return d.toLocaleDateString("en-GB");
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
    hasEditPrepayment = false,
  } = input;

  if (!draft?.services?.length) return [];

  const treatmentDate = formatPaymentDate(draft.selectedDateISO);
  const prepaymentDate = formatPaymentDate(draft.selectedDateISO);
  const total = draft.total ?? sumServices(draft.services);
  const prepaidAmount =
    Math.round(((total * prepaymentPercent) / 100 + Number.EPSILON) * 100) / 100;
  const sections: PaymentSummarySection[] = [];

  if (requiresPrepayment || prepaid) {
    const prepaymentLines: PaymentSummaryLine[] = [];
    if (prepaid && prepaidAmount > 0) {
      prepaymentLines.push({
        id: "prepaid-main",
        label: `Prepaid ${prepaymentPercent}% - Online (Direct)`,
        amount: prepaidAmount,
        showInvoice: true,
        showReceipt: true,
      });
    }
    if (hasEditPrepayment && prepaid) {
      prepaymentLines.push({
        id: "prepaid-er",
        label: `Additional Prepayment ER - ${prepaymentDate} - Online Direct`,
        amount: prepaidAmount,
        showInvoice: true,
        showReceipt: true,
      });
    }
    if (prepaymentLines.length) {
      sections.push({ title: "Prepayment", lines: prepaymentLines });
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
    const method = isRequester ? "Online Direct" : "Offline Direct";

    afterTreatmentLines.push({
      id: `after-treatment-${section.key}`,
      label: `${labelName} - ${status} - ${treatmentDate} - ${method}`,
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
        label: `Main Client - ${status} - ${treatmentDate} - Online Direct`,
        amount,
        showInvoice: paid && !paymentDue,
        showReceipt: paid && !paymentDue,
      });
    }
  }

  if (afterTreatmentLines.length) {
    sections.push({ title: "After Treatment Payment", lines: afterTreatmentLines });
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
      label: `${labelName} - ${status} - ${treatmentDate} - Offline Direct`,
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
        label: `Main Client - ${status} - ${treatmentDate} - Offline Direct`,
        amount,
      });
    }
  }

  if (addOnLines.length) {
    sections.push({ title: "Add Ons - After Checkout", lines: addOnLines });
  }

  return sections;
}

export function paymentSummaryGrandTotal(sections: PaymentSummarySection[]): number {
  return sections.reduce(
    (sum, section) => sum + section.lines.reduce((lineSum, line) => lineSum + line.amount, 0),
    0,
  );
}
