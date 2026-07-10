import type { ManualEntryDiscount, ManualEntryLine, ManualEntryPaymentMethod } from "../../sections/finance/manualEntry.data";

export type SalesLineItem = {
  id: string;
  label: string;
  amount: number;
};

export type SalesCardKind = "prepayment" | "after_treatment" | "addon";

export type SalesOverviewCardData = {
  id: string;
  bookingId: string;
  bookingCode: string;
  kind: SalesCardKind;
  title: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  statusBadge?: string;
  lines: SalesLineItem[];
  total: number;
  highlightLabel: string;
  highlightAmount: number;
  secondaryRows?: SalesLineItem[];
  metaLines?: string[];
  showAddOns?: boolean;
  voided?: boolean;
  refunded?: boolean;
  note?: string;
  paymentMethodLabel?: string;
  /** Amount used for invoice/receipt PDF */
  documentAmount: number;
  occurredAt: string;
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
};

export type SalesAddOnCheckoutPayload = {
  lines: ManualEntryLine[];
  discount: ManualEntryDiscount | null;
  discountAmount: number;
  totalPrice: number;
  paymentMethod: ManualEntryPaymentMethod;
};
