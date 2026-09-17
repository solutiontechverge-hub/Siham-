import {
  formatProductLineName,
  type BookingCatalogProduct,
} from "./bookingProductCatalog.data";
import {
  applyLineDiscount,
  parseDiscountFields,
  type BookingLineDiscount,
} from "./bookingLinePricing";

export type BookingUniqueItemDiscountType = "fixed" | "percentage";

export type BookingUniqueItemDraft = {
  productName: string;
  vat: string;
  price: string;
  unit: number;
  discountType: BookingUniqueItemDiscountType;
  discountAmount: string;
};

/** Common local VAT rate — editable on the Unique Item form. */
export const DEFAULT_UNIQUE_ITEM_VAT = "21";

export const BOOKING_CATALOG_PRICE_TYPE_OPTIONS: { label: string; value: string }[] = [
  { label: "Fixed price", value: "fixed" },
  { label: "Starting from", value: "starting_from" },
];

export const BOOKING_CATALOG_DISCOUNT_TYPE_OPTIONS: { label: string; value: string }[] = [
  { label: "Fixed discount", value: "fixed" },
  { label: "Percentage discount", value: "percentage" },
];

export const emptyBookingUniqueItemDraft = (): BookingUniqueItemDraft => ({
  productName: "",
  vat: DEFAULT_UNIQUE_ITEM_VAT,
  price: "",
  unit: 1,
  discountType: "fixed",
  discountAmount: "0",
});

export function buildUniqueItemDraftFromProduct(
  product: Pick<
    BookingCatalogProduct,
    "name" | "price" | "vat" | "unit" | "discountType" | "discountAmount"
  >,
): BookingUniqueItemDraft {
  const vat = product.vat?.trim().replace(/%$/, "") || DEFAULT_UNIQUE_ITEM_VAT;
  return {
    productName: product.name,
    vat,
    price: String(product.price),
    unit: Math.max(1, product.unit ?? 1),
    discountType: product.discountType ?? "fixed",
    discountAmount: product.discountAmount ?? "0",
  };
}

export function buildCatalogProductFromUniqueItemDraft(
  draft: BookingUniqueItemDraft,
  id: string,
): BookingCatalogProduct | null {
  const productName = draft.productName.trim();
  if (!productName) return null;
  const unitPrice = Math.max(
    0,
    Number.parseFloat(draft.price.replace(",", ".")) || 0,
  );
  return {
    id,
    name: productName,
    price: unitPrice,
    vat: draft.vat.trim() || undefined,
    unit: Math.max(1, draft.unit),
    discountType: draft.discountType,
    discountAmount: draft.discountAmount,
  };
}

export type BookingUniqueItemLine = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unitPrice: number;
  vat?: string;
  /** Earliest chronological service block this line attaches to (Section 2.9). */
  attachedStartTime?: string;
  guestId?: string | null;
  originalPrice?: number;
  discount?: BookingLineDiscount | null;
};

export function buildUniqueItemLine(
  draft: BookingUniqueItemDraft,
  id = `unique-${Date.now()}`,
): BookingUniqueItemLine | null {
  const productName = draft.productName.trim();
  if (!productName) return null;

  const unitPrice = Math.max(0, Number.parseFloat(draft.price.replace(",", ".")) || 0);
  const quantity = Math.max(1, draft.unit);
  const subtotal = unitPrice * quantity;
  const discount = parseDiscountFields(draft.discountType, draft.discountAmount);
  const priced = applyLineDiscount(subtotal, discount);
  const vat = draft.vat.trim() || undefined;

  return {
    id,
    name: formatProductLineName(productName, quantity),
    unitPrice,
    quantity,
    price: priced.price,
    vat,
    originalPrice: priced.discountAmount > 0 ? priced.original : undefined,
    discount: priced.discountAmount > 0 ? discount : null,
  };
}

export function getUniqueItemDraftErrors(draft: BookingUniqueItemDraft) {
  const errors: Partial<Record<"productName" | "price", string>> = {};
  if (!draft.productName.trim()) errors.productName = "Product name is required.";
  if (!draft.price.trim()) errors.price = "Price is required.";
  return errors;
}
