import {
  mockClientRecords,
  mockMollureDirectory,
  type ClientRecord,
  type MollureDirectoryRow,
} from "../../../app/professionals/fixed-location/client/data/clientList";

export type ManualEntryClientMode = "list" | "platform" | "guest";

export type ManualEntryClientSelection =
  | { type: "guest"; name?: string }
  | { type: "list"; client: ClientRecord }
  | { type: "platform"; client: MollureDirectoryRow };

export { mockClientRecords, mockMollureDirectory };

export function filterClientsByName(query: string): ClientRecord[] {
  const q = query.trim().toLowerCase();
  if (!q) return mockClientRecords.slice(0, 5);
  return mockClientRecords.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 8);
}

export function filterMollureByEmail(query: string): MollureDirectoryRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return mockMollureDirectory;
  return mockMollureDirectory.filter((r) => `${r.email} ${r.name}`.toLowerCase().includes(q));
}

export function selectionLabel(selection: ManualEntryClientSelection | null): string {
  if (!selection) return "";
  if (selection.type === "guest") return selection.name?.trim() ? selection.name.trim() : "Guest";
  return selection.client.name;
}

export type ManualEntryLineKind = "product" | "item";

export type ManualEntryLine = {
  id: string;
  kind: ManualEntryLineKind;
  name: string;
  quantity: number;
  unitPrice: number;
};

export const DEFAULT_MANUAL_ENTRY_PRODUCT: Pick<ManualEntryLine, "name" | "quantity" | "unitPrice"> = {
  name: "Shampoo",
  quantity: 2,
  unitPrice: 25,
};

export const DEFAULT_MANUAL_ENTRY_ITEM: Pick<ManualEntryLine, "name" | "quantity" | "unitPrice"> = {
  name: "Extra Conditioner",
  quantity: 2,
  unitPrice: 25,
};

export function lineTotal(line: Pick<ManualEntryLine, "quantity" | "unitPrice">): number {
  return line.quantity * line.unitPrice;
}

export function formatEurAmount(amount: number, suffix = "EUR"): string {
  const value = Number.isFinite(amount) ? amount : 0;
  const rounded = Math.round(value * 100) / 100;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
  return `${text} ${suffix}`;
}

export type ManualEntryDiscountType = "fixed" | "percentage";

export type ManualEntryDiscount = {
  type: ManualEntryDiscountType;
  amount: number;
};

export type ManualEntryCatalogOption = {
  id: string;
  label: string;
  unitPrice: number;
};

export function parseFinancePrice(price: string): number {
  const normalized = price.replace(/[^\d.,-]/g, "").replace(",", ".");
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : 0;
}

export function calculateManualEntryDiscountAmount(
  subtotal: number,
  discount: ManualEntryDiscount | null,
): number {
  if (!discount || discount.amount <= 0 || subtotal <= 0) return 0;
  if (discount.type === "percentage") {
    return Math.min(subtotal, (subtotal * discount.amount) / 100);
  }
  return Math.min(subtotal, discount.amount);
}

export function formatManualEntryDiscountLabel(discount: ManualEntryDiscount): string {
  if (discount.type === "percentage") {
    return `${discount.amount}%`;
  }
  return formatEurAmount(discount.amount);
}

export type ManualEntryPaymentMethod = "onlineDirect" | "offlineDirect";

export type ManualEntrySavePayload = {
  clientSelection: ManualEntryClientSelection;
  lines: readonly ManualEntryLine[];
  totalPrice: number;
  discount: ManualEntryDiscount | null;
  discountAmount: number;
  paymentMethod: ManualEntryPaymentMethod;
  guestEmail?: string;
  guestName?: string;
};

export function manualEntryClientFields(
  selection: ManualEntryClientSelection,
  guestEmail?: string,
  guestName?: string,
): { clientName: string; clientEmail: string; clientType: "mollure" | "nonMollure" | "business" | "guest" } {
  if (selection.type === "guest") {
    const name = guestName?.trim() || selection.name?.trim() || "Guest";
    return { clientName: name, clientEmail: guestEmail?.trim() ?? "", clientType: "guest" };
  }
  if (selection.type === "list") {
    const client = selection.client;
    return {
      clientName: client.name,
      clientEmail: client.email,
      clientType: client.tags.includes("Mollure")
        ? "mollure"
        : client.kind === "company"
          ? "business"
          : "nonMollure",
    };
  }
  return {
    clientName: selection.client.name,
    clientEmail: selection.client.email,
    clientType: "mollure",
  };
}

export function createManualEntryLine(
  kind: ManualEntryLineKind,
  index: number,
): ManualEntryLine {
  const base = kind === "product" ? DEFAULT_MANUAL_ENTRY_PRODUCT : DEFAULT_MANUAL_ENTRY_ITEM;
  const name = index === 0 ? base.name : `${base.name} ${index + 1}`;
  return {
    id: `${kind}-${Date.now()}-${index}`,
    kind,
    name,
    quantity: base.quantity,
    unitPrice: base.unitPrice,
  };
}

export function createManualEntryLineFromOption(
  kind: ManualEntryLineKind,
  option: ManualEntryCatalogOption,
  quantity = 1,
): ManualEntryLine {
  return {
    id: `${kind}-${option.id}-${Date.now()}`,
    kind,
    name: option.label,
    quantity: Math.max(1, quantity),
    unitPrice: option.unitPrice,
  };
}
