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

export const emptyBookingUniqueItemDraft = (): BookingUniqueItemDraft => ({
  productName: "",
  vat: "",
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
  return {
    productName: product.name,
    vat: product.vat ?? "",
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
  originalPrice?: number;
  discount?: BookingLineDiscount | null;
};

export function buildUniqueItemLine(draft: BookingUniqueItemDraft): BookingUniqueItemLine | null {
  const productName = draft.productName.trim();
  if (!productName) return null;

  const unitPrice = Math.max(0, Number.parseFloat(draft.price.replace(",", ".")) || 0);
  const quantity = Math.max(1, draft.unit);
  const subtotal = unitPrice * quantity;
  const discount = parseDiscountFields(draft.discountType, draft.discountAmount);
  const priced = applyLineDiscount(subtotal, discount);

  return {
    id: `unique-${Date.now()}`,
    name: formatProductLineName(productName, quantity),
    unitPrice,
    quantity,
    price: priced.price,
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
