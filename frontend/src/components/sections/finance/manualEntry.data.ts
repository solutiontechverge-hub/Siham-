import type {
  ClientRecord,
  MollureDirectoryRow,
} from "../../../app/professionals/fixed-location/client/data/clientList";
import type {
  FinanceInvoiceProduct,
  FinanceInvoiceService,
} from "../../common/finance-documents/useFinanceInvoiceSettings";

export const STEPS = ["Client", "Items", "Payment", "Summary"] as const;

export type ManualEntryClientMode = "list" | "platform" | "guest";

export type ManualEntryClientSelection =
  | { type: "guest"; name?: string }
  | { type: "list"; client: ClientRecord }
  | { type: "platform"; client: MollureDirectoryRow };

export function selectionLabel(selection: ManualEntryClientSelection | null): string {
  if (!selection) return "";
  if (selection.type === "guest") return selection.name?.trim() ? selection.name.trim() : "Guest";
  return selection.client.name;
}

export type ManualEntryLineKind = "product" | "item";

export type ManualEntryLine = {
  id: string;
  /** Stable catalog reference for the item actually sold. */
  sourceReference?: string;
  sourceType?: "serviceId" | "productId" | "uniqueItemCode";
  kind: ManualEntryLineKind;
  name: string;
  quantity: number;
  unitPrice: number;
};

export const DEFAULT_MANUAL_ENTRY_PRODUCT: Pick<ManualEntryLine, "name" | "quantity" | "unitPrice"> = {
  name: "",
  quantity: 1,
  unitPrice: 0,
};

export const DEFAULT_MANUAL_ENTRY_ITEM: Pick<ManualEntryLine, "name" | "quantity" | "unitPrice"> = {
  name: "",
  quantity: 1,
  unitPrice: 0,
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
  /** Optional fields kept for edit round-trip (Add/Edit Product form). */
  vat?: string;
  unit?: number;
  discountType?: "fixed" | "percentage";
  discountAmount?: number;
};

export function parseFinancePrice(price: number | string): number {
  if (typeof price === "number") return Number.isFinite(price) ? price : 0;
  const raw = price.replace(/[^\d.,-]/g, "");
  const lastComma = raw.lastIndexOf(",");
  const lastDot = raw.lastIndexOf(".");
  const separator = lastComma > lastDot ? "," : lastDot >= 0 ? "." : "";
  const occurrences = separator ? raw.split(separator).length - 1 : 0;
  const decimalDigits = separator ? raw.length - raw.lastIndexOf(separator) - 1 : 0;
  const isDecimal = separator && (occurrences === 1 ? decimalDigits !== 3 : decimalDigits <= 2);
  const normalized = isDecimal
    ? `${raw.slice(0, raw.lastIndexOf(separator)).replace(/[.,]/g, "")}.${raw.slice(raw.lastIndexOf(separator) + 1)}`
    : raw.replace(/[.,]/g, "");
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : 0;
}

/** Minimal setup-service shape used when mapping catalog item options. */
export type ManualEntrySetupService = {
  id: string;
  service_title?: string | null;
  category_title?: string | null;
  price?: string | number | null;
};

/** Maps invoice-settings (+ optional setup services) into catalog drawer options. */
export function buildManualEntryCatalogOptions(input: {
  products: readonly FinanceInvoiceProduct[];
  services: readonly FinanceInvoiceService[];
  uniqueItems?: readonly FinanceInvoiceProduct[] | null;
  setupServices?: readonly ManualEntrySetupService[] | null;
}): {
  productOptions: ManualEntryCatalogOption[];
  itemOptions: ManualEntryCatalogOption[];
  uniqueItemOptions: ManualEntryCatalogOption[];
} {
  const productOptions = input.products.map((product) => ({
    id: product.id,
    label: product.name,
    unitPrice: parseFinancePrice(product.price),
    vat: product.vat,
  }));

  const setupServices = input.setupServices ?? [];
  const itemOptions =
    setupServices.length > 0
      ? setupServices.map((service) => ({
          id: service.id,
          label: service.service_title || service.category_title || "Service",
          unitPrice: parseFinancePrice(String(service.price ?? "")),
        }))
      : input.services.map((service) => ({
          id: service.id,
          label: service.service
            ? `${service.category} - ${service.service}`
            : service.category,
          unitPrice: 0,
          vat: service.vat,
        }));

  const uniqueItemOptions = (input.uniqueItems ?? []).map((item) => ({
    id: item.id,
    label: item.name,
    unitPrice: parseFinancePrice(item.price),
    vat: item.vat,
    unit: item.unit,
    discountType: item.discountType,
    discountAmount: item.discountAmount,
  }));

  return { productOptions, itemOptions, uniqueItemOptions };
}

export function calculateManualEntryDiscountAmount(
  subtotal: number,
  discount: ManualEntryDiscount | null,
): number {
  if (!discount) return 0;
  const amount = Number(discount.amount);
  if (!Number.isFinite(amount) || amount <= 0 || subtotal <= 0) return 0;
  if (discount.type === "percentage") {
    return Math.min(subtotal, (subtotal * amount) / 100);
  }
  return Math.min(subtotal, amount);
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
): { clientName: string; clientEmail: string; clientType: "mollure" | "nonMollure" | "business" | "guest"; vatNumber?: string; cocNumber?: string } {
  if (selection.type === "guest") {
    const name = guestName?.trim() || selection.name?.trim() || "Guest";
    return { clientName: name, clientEmail: guestEmail?.trim() ?? "", clientType: "guest" };
  }
  if (selection.type === "list") {
    const client = selection.client;
    return {
      clientName: client.name,
      clientEmail: client.email,
      vatNumber: client.vat,
      cocNumber: client.coc,
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
    vatNumber: (selection.client as MollureDirectoryRow & { vat?: string }).vat,
    cocNumber: (selection.client as MollureDirectoryRow & { coc?: string }).coc,
  };
}

export function createManualEntryLine(
  kind: ManualEntryLineKind,
  index: number,
): ManualEntryLine {
  const base = kind === "product" ? DEFAULT_MANUAL_ENTRY_PRODUCT : DEFAULT_MANUAL_ENTRY_ITEM;
  return {
    id: `${kind}-${Date.now()}-${index}`,
    kind,
    name: base.name,
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
    sourceReference: option.id,
    sourceType: kind === "item" ? "serviceId" : "productId",
    kind,
    name: option.label,
    quantity: Math.max(1, quantity),
    unitPrice: option.unitPrice,
  };
}
