import { formatProductLineName } from "./bookingProductCatalog.data";

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

export type BookingUniqueItemLine = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unitPrice: number;
};

export function buildUniqueItemLine(draft: BookingUniqueItemDraft): BookingUniqueItemLine | null {
  const productName = draft.productName.trim();
  if (!productName) return null;

  const unitPrice = Math.max(0, Number.parseFloat(draft.price.replace(",", ".")) || 0);
  const quantity = Math.max(1, draft.unit);
  const subtotal = unitPrice * quantity;
  const discountValue = Math.max(0, Number.parseFloat(draft.discountAmount.replace(",", ".")) || 0);
  const discount =
    draft.discountType === "percentage"
      ? Math.round((subtotal * discountValue) / 100)
      : Math.min(subtotal, discountValue);

  return {
    id: `unique-${Date.now()}`,
    name: formatProductLineName(productName, quantity),
    unitPrice,
    quantity,
    price: Math.max(0, subtotal - discount),
  };
}

export function getUniqueItemDraftErrors(draft: BookingUniqueItemDraft) {
  const errors: Partial<Record<"productName" | "price", string>> = {};
  if (!draft.productName.trim()) errors.productName = "Product name is required.";
  if (!draft.price.trim()) errors.price = "Price is required.";
  return errors;
}
