import { emptyBookingUniqueItemDraft } from "../../../../../data/bookingUniqueItem.data";
import type {
  ExpectItemDef,
  ProductDraft,
  ServiceDraft,
  TransactionOptionItem,
} from "./setting.types";

export const SETTINGS_TAB_LABELS = {
  stripe: "Stripe",
  transaction: "Transaction Options",
  invoice: "Invoice",
} as const;

export const EXPECT_ITEMS: ExpectItemDef[] = [
  {
    key: "business",
    title: "Business Information",
    desc: "Enter your legal business details, business type, and contact information.",
  },
  {
    key: "representative",
    title: "Representative Details",
    desc: "Provide personal information for the account owner or legal representative.",
  },
  {
    key: "public",
    title: "Public Business Information",
    desc: "Set how your business appears on client bank statements and provide customer contact details.",
  },
  {
    key: "payout",
    title: "Payout Details",
    desc: "Connect your bank account (IBAN) to receive payouts.",
  },
  {
    key: "review",
    title: "Review & Submit",
    desc: "Confirm your information before activating online payments.",
  },
];

export const PAYOUT_BULLETS = [
  "First payout typically 7–10 business days",
  "Future payouts follow your selected payout schedule",
  "Your payouts may pause only if Stripe requires additional verification",
] as const;

export const MANAGING_BULLETS = [
  "Update bank account (IBAN)",
  "Edit statement descriptor",
  "Update business contact details",
  "Review payout history",
  "Check balances and payouts",
  "Comply with any verification tasks required by Stripe",
] as const;

export const TRANSACTION_OPTION_ITEMS: TransactionOptionItem[] = [
  {
    key: "onlineImmediate",
    label: "Online (immediate – payment window – 15 min)",
  },
  {
    key: "onlineInvoiceDueDate",
    label:
      "Online (Invoice with a due date – for BC clients and IC for fee charges)",
  },
  {
    key: "offlineImmediate",
    label: "Offline (Immediate)",
  },
  {
    key: "offlineInvoiceDueDate",
    label:
      "Offline (Invoice with a due date – for BC clients and IC for fee charges)",
  },
];

export const DEFAULT_PRODUCT_DRAFT: ProductDraft = emptyBookingUniqueItemDraft();

export const DEFAULT_SERVICE_DRAFT: ServiceDraft = {
  service: "",
  vat: "21%",
};
