import type { ManualEntryDiscount, ManualEntryLine, ManualEntryPaymentMethod } from "../../sections/finance/manualEntry.data";

export type SalesLineItem = {
  id: string;
  label: string;
  amount: number;
};

export type SalesCardKind =
  | "prepayment"
  | "after_treatment"
  | "addon"
  | "reissued_invoice";

export type SalesPayerRole = "main_client" | "guest" | "model";

export type SalesClientKind = "individual" | "company";

export type SalesPaymentState =
  | "payment_due"
  | "pending"
  | "prepaid"
  | "paid"
  | "refunded"
  | "voided"
  | "failed"
  | "overdue"
  | "overdue_invoice"
  | "unpaid";

export type SalesOverdueKind = "prepayment" | "invoice";

export type SalesPenaltyPrompt = "automatic" | "manual" | "none";

/** Finance row overlay used to auto-settle Pending → Paid and terminal statuses. */
export type SalesFinanceHint = {
  bookingId?: string;
  bookingCode?: string;
  phase?: "prepay" | "full" | "addon" | string;
  addonId?: string;
  payerKey?: string;
  status: string;
  paidAt?: string | null;
  dueDate?: string | null;
  paymentMethod?: string;
  penaltyAmount?: number;
};

export type SalesPaymentTermsInput = {
  originalDueValue?: string;
  originalDueUnit?: string;
  firstReissueTrigger?: string;
  secondReissueTrigger?: string;
};

/** Extended checkout payment methods for Sales Edit. */
export type SalesCheckoutPaymentMethod =
  | ManualEntryPaymentMethod
  | "onlineNonDirect"
  | "offlineNonDirect";

export type SalesSubCardData = {
  id: string;
  bookingId: string;
  bookingCode: string;
  payerRole: SalesPayerRole;
  payerLabel: string;
  payerName: string;
  lines: SalesLineItem[];
  total: number;
  highlightLabel: string;
  highlightAmount: number;
  statusBadge?: string;
  paymentState?: SalesPaymentState;
  overdueKind?: SalesOverdueKind;
  markedUnpaid?: boolean;
  paidAt?: string | null;
  penaltyPrompt?: SalesPenaltyPrompt;
  methodDateLine?: string;
  dueDate?: string | null;
  showAddOns?: boolean;
  limitedMenu?: boolean;
  /** Parent client name for context on invoices. */
  parentClientName?: string;
};

export type SalesOverviewCardData = {
  id: string;
  bookingId: string;
  bookingCode: string;
  kind: SalesCardKind;
  title: string;
  clientName: string;
  /** When set (Guest/Model), shown as primary label; clientName is the real name below. */
  payerLabel?: string;
  payerRole?: SalesPayerRole;
  payerKey?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientKind?: SalesClientKind;
  statusBadge?: string;
  paymentState?: SalesPaymentState;
  overdueKind?: SalesOverdueKind;
  markedUnpaid?: boolean;
  paidAt?: string | null;
  penaltyPrompt?: SalesPenaltyPrompt;
  lines: SalesLineItem[];
  /** Line ids wrapped in the dotted highlight box (payer's own services). */
  highlightedLineIds?: string[];
  /** Guest/model sub-cards nested under the main after-treatment card. */
  subCards?: SalesSubCardData[];
  total: number;
  totalLabel?: string;
  highlightLabel: string;
  highlightAmount: number;
  secondaryRows?: SalesLineItem[];
  metaLines?: string[];
  /** Single meta line like "Online Direct, July 25, 2025 10:00pm" */
  methodDateLine?: string;
  dueDate?: string | null;
  showAddOns?: boolean;
  voided?: boolean;
  refunded?: boolean;
  canceled?: boolean;
  note?: string;
  paymentMethodLabel?: string;
  paymentMethod?: SalesCheckoutPaymentMethod;
  /** Amount used for invoice/receipt PDF */
  documentAmount: number;
  occurredAt: string;
  bookingEndAt?: string | null;
  /** Limited 3-dot menu (no Cancel) for overdue/reissued cards. */
  limitedMenu?: boolean;
  penaltyAmount?: number;
  invoiceSeq?: number;
};

export type SalesAddonRecord = {
  id: string;
  bookingId: string;
  bookingCode: string;
  clientName: string;
  clientEmail?: string;
  lines: ManualEntryLine[];
  discount: ManualEntryDiscount | null;
  discountAmount: number;
  totalPrice: number;
  paymentMethod: ManualEntryPaymentMethod;
  createdAt: string;
  note?: string;
  voided?: boolean;
  refunded?: boolean;
};

export type SalesCardMetaRecord = {
  bookingId: string;
  cardKind: SalesCardKind;
  cardId: string;
  note?: string;
  voided?: boolean;
  refunded?: boolean;
  canceled?: boolean;
  markedUnpaid?: boolean;
  paidAt?: string | null;
  invoiceSeq?: number;
  paymentMethod?: SalesCheckoutPaymentMethod;
  dueDate?: string | null;
  penaltyAmount?: number;
  penaltyType?: "fixed" | "percentage";
  reissuedAt?: string;
  editedLines?: ManualEntryLine[];
  discount?: ManualEntryDiscount | null;
  discountAmount?: number;
  totalPrice?: number;
  paid?: boolean;
  addon?: SalesAddonRecord;
};

export type SalesAddOnCheckoutPayload = {
  lines: ManualEntryLine[];
  discount: ManualEntryDiscount | null;
  discountAmount: number;
  totalPrice: number;
  paymentMethod: ManualEntryPaymentMethod;
  clientEmail?: string | null;
};

export type SalesEditCheckoutPayload = {
  lines: ManualEntryLine[];
  discount: ManualEntryDiscount | null;
  discountAmount: number;
  totalPrice: number;
  paymentMethod: SalesCheckoutPaymentMethod;
  dueDate?: string | null;
  clientEmail?: string | null;
};

export function salesPaymentBadge(state: SalesPaymentState): string {
  switch (state) {
    case "payment_due":
      return "Payment Due";
    case "pending":
      return "Pending";
    case "prepaid":
      return "Prepaid";
    case "paid":
      return "Paid";
    case "refunded":
      return "Refunded";
    case "voided":
      return "Voided";
    case "failed":
      return "Failed";
    case "overdue":
    case "overdue_invoice":
      return "!Overdue";
    case "unpaid":
      return "Unpaid";
  }
}
