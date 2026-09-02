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
  | "prepayment_due"
  | "prepaid"
  | "not_paid"
  | "pending"
  | "payment_due"
  | "paid"
  | "overdue";

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
  methodDateLine?: string;
  dueDate?: string | null;
  showAddOns?: boolean;
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
  paymentMethod?: SalesCheckoutPaymentMethod;
  dueDate?: string | null;
  penaltyAmount?: number;
  penaltyType?: "fixed" | "percentage";
  reissuedAt?: string;
  editedLines?: ManualEntryLine[];
  discount?: ManualEntryDiscount | null;
  discountAmount?: number;
  totalPrice?: number;
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
