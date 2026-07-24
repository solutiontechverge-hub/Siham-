export type SettingsTab = "stripe" | "transaction" | "invoice";

export type ProductDraft = {
  productName: string;
  vat: string;
  price: string;
};

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
