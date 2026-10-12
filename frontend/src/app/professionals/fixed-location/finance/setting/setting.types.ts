import type { BookingUniqueItemDraft } from "../../../../../data/bookingUniqueItem.data";

export type SettingsTab = "stripe" | "transaction" | "invoice";

/** Same draft shape as calendar drawer Add/Edit Product. */
export type ProductDraft = BookingUniqueItemDraft;

export type ServiceDraft = {
  service: string;
  vat: string;
};

export type ExpectItemKey =
  | "business"
  | "representative"
  | "public"
  | "payout"
  | "review";

export type ExpectItemDef = {
  key: ExpectItemKey;
  title: string;
  desc: string;
};

export type TransactionOptionKey =
  | "onlineImmediate"
  | "onlineInvoiceDueDate"
  | "offlineImmediate"
  | "offlineInvoiceDueDate";

export type TransactionOptionItem = {
  key: TransactionOptionKey;
  label: string;
};

export type ServiceOption = {
  label: string;
  category: string;
};
