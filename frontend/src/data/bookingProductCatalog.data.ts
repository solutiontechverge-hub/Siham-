import {
  applyLineDiscount,
  parseDiscountFields,
  type BookingLineDiscount,
} from "./bookingLinePricing";

export type BookingCatalogProduct = {
  id: string;
  name: string;
  price: number;
  /** Optional fields kept for edit round-trip (Add/Edit Product form). */
  vat?: string;
  unit?: number;
  discountType?: "fixed" | "percentage";
  discountAmount?: string;
};

export type BookingProductLineItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unitPrice: number;
  originalPrice?: number;
  discount?: BookingLineDiscount | null;
};

/** Empty — professionals load their own products from finance settings. */
export const bookingProductCatalog: readonly BookingCatalogProduct[] = [];

export type BookingProductDraftItem = {
  selected: boolean;
  quantity: number;
};

export type BookingProductSelectionDraft = Record<
  string,
  BookingProductDraftItem
>;

export function createEmptyProductSelectionDraft(
  catalog: readonly BookingCatalogProduct[] = bookingProductCatalog,
): BookingProductSelectionDraft {
  return Object.fromEntries(
    catalog.map((product) => [product.id, { selected: false, quantity: 1 }]),
  );
}

export function buildProductSelectionDraftFromSelected(
  selected: ReadonlyArray<{ id: string; quantity: number }>,
  catalog: readonly BookingCatalogProduct[] = bookingProductCatalog,
): BookingProductSelectionDraft {
  const selectedById = new Map(
    selected.map((item) => [item.id, item.quantity]),
  );
  return Object.fromEntries(
    catalog.map((product) => [
      product.id,
      {
        selected: selectedById.has(product.id),
        quantity: selectedById.get(product.id) ?? 1,
      },
    ]),
  );
}

export function formatProductLineName(name: string, quantity: number) {
  return quantity > 1 ? `${name} x${quantity}` : name;
}

export function formatProductUnitPrice(price: number) {
  return `€${price}`;
}

export function getProductBaseName(name: string, quantity: number) {
  const suffix = ` x${quantity}`;
  return quantity > 1 && name.endsWith(suffix)
    ? name.slice(0, -suffix.length)
    : name;
}

export function buildBookingProductLine(
  product: BookingCatalogProduct,
  quantity: number,
): BookingProductLineItem {
  const qty = Math.max(1, quantity);
  const unitPrice = product.price;
  const original = unitPrice * qty;
  const discount = parseDiscountFields(
    product.discountType,
    product.discountAmount,
  );
  const priced = applyLineDiscount(original, discount);
  return {
    id: product.id,
    name: formatProductLineName(product.name, qty),
    unitPrice,
    quantity: qty,
    price: priced.price,
    originalPrice: priced.discountAmount > 0 ? priced.original : undefined,
    discount: priced.discountAmount > 0 ? discount : null,
  };
}

export function productLineOriginalAmount(product: {
  originalPrice?: number;
  unitPrice?: number;
  quantity?: number;
  price: number;
}): number {
  if (typeof product.originalPrice === "number") return product.originalPrice;
  const qty = Math.max(1, product.quantity ?? 1);
  const unit = product.unitPrice ?? product.price;
  return unit * qty;
}
