import {
  lockOnlineImmediate,
  type FinanceTransactionOptions,
} from "../finance-documents/useFinanceTransactionOptions";

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

export function checkoutPaymentMethodApiValue(method: CheckoutPaymentMethodId) {
  if (method === "onlineInvoiceDueDate") return "onlineInvoice";
  if (method === "offlineInvoiceDueDate") return "offlineInvoice";
  if (method === "offlineDirect") return "offlineDirect";
  return "onlineDirect";
}

function toOption(
  item: (typeof ONLINE_OPTIONS)[number] | (typeof OFFLINE_OPTIONS)[number],
): CheckoutPaymentOption {
  return { id: item.id, label: item.label, description: item.description };
}

/** Map the method the professional saved on this booking to a single checkout option. */
export function optionFromStoredPaymentMethod(
  method?: string | null,
): CheckoutPaymentOption | null {
  const value = String(method ?? "").toLowerCase().replace(/[\s_-]/g, "");
  if (!value) return null;
  if (value === "offline" || value === "offlinedirect") {
    return toOption(OFFLINE_OPTIONS[0]);
  }
  if (value === "offlineinvoice" || value === "offlinenondirect") {
    return toOption(OFFLINE_OPTIONS[1]);
  }
  if (value === "onlineinvoice" || value === "onlinenondirect") {
    return toOption(ONLINE_OPTIONS[1]);
  }
  if (value === "online" || value === "onlinedirect") {
    return toOption(ONLINE_OPTIONS[0]);
  }
  return null;
}

export function resolveCheckoutPaymentOptions(
  txOptions: FinanceTransactionOptions,
  locationMode: "fixed" | "desired",
  chosenMethod?: string | null,
): CheckoutPaymentOption[] {
  // ponytail: lock here so checkout never drops online immediate even if stale API data says false
  const locked = lockOnlineImmediate(txOptions);
  const chosen = optionFromStoredPaymentMethod(chosenMethod);
  if (chosen) {
    if (locationMode === "desired" && chosen.id.startsWith("offline")) {
      return [toOption(ONLINE_OPTIONS[0])];
    }
    return [chosen];
  }
  const pool =
    locationMode === "desired" ? ONLINE_OPTIONS : [...ONLINE_OPTIONS, ...OFFLINE_OPTIONS];
  return pool.filter((item) => locked[item.key]).map(toOption);
}

export function checkoutPaymentMethodSupportsPayNow(method: CheckoutPaymentMethodId) {
  return method === "onlineDirect";
}

export function isOfflinePaymentMethod(method?: string | null): boolean {
  const value = String(method ?? "")
    .toLowerCase()
    .replace(/[\s_-]/g, "");
  return value.startsWith("offline");
}

export function checkoutPaymentMethodTitle(method?: string | null): string {
  const value = String(method ?? "")
    .toLowerCase()
    .replace(/[\s_-]/g, "");
  if (value.includes("invoice") || value.includes("nondirect")) {
    return isOfflinePaymentMethod(method) ? "Offline - Invoice" : "Online - Invoice";
  }
  return isOfflinePaymentMethod(method) ? "Offline - Direct" : "Online - Direct";
}

export function checkoutPaymentMethodDetail(method?: string | null): string {
  return isOfflinePaymentMethod(method) ? "Cash" : "Card";
}
