import type {
  FinanceInvoiceProduct,
  FinanceInvoiceSettings,
} from "../../common/finance-documents/useFinanceInvoiceSettings";
import type { ManualEntryCatalogOption } from "./manualEntry.data";
import { roundMoney } from "../../../utils/money";

export function toFinanceCatalogProduct(input: {
  id: string;
  name: string;
  price: number;
  vat?: string;
  unit?: number;
  discountType?: "fixed" | "percentage";
  discountAmount?: number | string;
}): FinanceInvoiceProduct {
  return {
    id: input.id,
    name: input.name,
    price: roundMoney(input.price),
    vat: input.vat?.trim() || "0%",
    unit: input.unit,
    discountType: input.discountType,
    discountAmount:
      input.discountAmount == null
        ? undefined
        : roundMoney(input.discountAmount),
  };
}

export function financeProductFromCatalogOption(
  option: ManualEntryCatalogOption,
): FinanceInvoiceProduct {
  return toFinanceCatalogProduct({
    id: option.id,
    name: option.label,
    price: option.unitPrice,
    vat: option.vat,
    unit: option.unit,
    discountType: option.discountType,
    discountAmount: option.discountAmount,
  });
}

function upsertInList(
  list: FinanceInvoiceProduct[],
  item: FinanceInvoiceProduct,
): FinanceInvoiceProduct[] {
  const exists = list.some((entry) => entry.id === item.id);
  if (exists) {
    return list.map((entry) => (entry.id === item.id ? { ...entry, ...item } : entry));
  }
  return [item, ...list];
}

export function upsertFinanceProduct(
  prev: FinanceInvoiceSettings,
  product: FinanceInvoiceProduct,
): FinanceInvoiceSettings {
  return { ...prev, products: upsertInList(prev.products, product) };
}

export function removeFinanceProduct(
  prev: FinanceInvoiceSettings,
  id: string,
): FinanceInvoiceSettings {
  return {
    ...prev,
    products: prev.products.filter((product) => product.id !== id),
  };
}

export function upsertFinanceUniqueItem(
  prev: FinanceInvoiceSettings,
  item: FinanceInvoiceProduct,
): FinanceInvoiceSettings {
  return {
    ...prev,
    uniqueItems: upsertInList(prev.uniqueItems ?? [], item),
  };
}

export function removeFinanceUniqueItem(
  prev: FinanceInvoiceSettings,
  id: string,
): FinanceInvoiceSettings {
  return {
    ...prev,
    uniqueItems: (prev.uniqueItems ?? []).filter((item) => item.id !== id),
  };
}
