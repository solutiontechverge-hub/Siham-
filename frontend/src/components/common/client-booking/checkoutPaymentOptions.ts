import type { FinanceTransactionOptions } from "../finance-documents/useFinanceTransactionOptions";

export type CheckoutPaymentMethodId =
  | "onlineDirect"
  | "onlineInvoiceDueDate"
  | "offlineDirect"
  | "offlineInvoiceDueDate";

export type CheckoutPaymentOption = {
  id: CheckoutPaymentMethodId;
  label: string;
  description: string;
};

const ONLINE_OPTIONS: Array<{
  key: keyof FinanceTransactionOptions;
  id: CheckoutPaymentMethodId;
  label: string;
  description: string;
}> = [
  {
    key: "onlineImmediate",
    id: "onlineDirect",
    label: "Online – pay now (15 min window)",
    description: "Pay securely online with iDeal or card.",
  },
  {
    key: "onlineInvoiceDueDate",
    id: "onlineInvoiceDueDate",
    label: "Online – invoice with due date",
    description: "Receive an invoice and pay before the due date.",
  },
];

const OFFLINE_OPTIONS: Array<{
  key: keyof FinanceTransactionOptions;
  id: CheckoutPaymentMethodId;
  label: string;
  description: string;
}> = [
  {
    key: "offlineImmediate",
    id: "offlineDirect",
    label: "Offline – pay at appointment",
    description: "Pay directly at the salon on the day of your visit.",
  },
  {
    key: "offlineInvoiceDueDate",
    id: "offlineInvoiceDueDate",
    label: "Offline – invoice with due date",
    description: "An invoice will be issued for payment before your appointment.",
  },
];

export function resolveCheckoutPaymentOptions(
  txOptions: FinanceTransactionOptions,
  locationMode: "fixed" | "desired",
): CheckoutPaymentOption[] {
  const pool = locationMode === "desired" ? ONLINE_OPTIONS : [...ONLINE_OPTIONS, ...OFFLINE_OPTIONS];
  const enabled = pool.filter((item) => txOptions[item.key]);
  if (enabled.length) {
    return enabled.map(({ id, label, description }) => ({ id, label, description }));
  }
  return [
    {
      id: "onlineDirect",
      label: "Online – pay now (15 min window)",
      description: "Pay securely online with iDeal or card.",
    },
  ];
}

export function checkoutPaymentMethodSupportsPayNow(method: CheckoutPaymentMethodId) {
  return method === "onlineDirect";
}

export function checkoutPaymentMethodApiValue(method: CheckoutPaymentMethodId) {
  if (method === "onlineInvoiceDueDate") return "onlineInvoice";
  if (method === "offlineInvoiceDueDate") return "offlineInvoice";
  if (method === "offlineDirect") return "offlineDirect";
  return "onlineDirect";
}
