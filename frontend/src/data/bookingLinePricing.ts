export type BookingLineDiscountType = "fixed" | "percentage";

export type BookingLineDiscount = {
  type: BookingLineDiscountType;
  amount: number;
};

export function roundBookingMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatBookingEur(value: number): string {
  const rounded = roundBookingMoney(value);
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

export function calculateLineDiscountAmount(
  subtotal: number,
  discount?: BookingLineDiscount | null,
): number {
  if (!discount) return 0;
  const amount = Number(discount.amount);
  if (!Number.isFinite(amount) || amount <= 0 || subtotal <= 0) return 0;
  if (discount.type === "percentage") {
    return roundBookingMoney(Math.min(subtotal, (subtotal * amount) / 100));
  }
  return roundBookingMoney(Math.min(subtotal, amount));
}

export function applyLineDiscount(
  subtotal: number,
  discount?: BookingLineDiscount | null,
): { original: number; discountAmount: number; price: number } {
  const original = roundBookingMoney(Math.max(0, Number(subtotal) || 0));
  const discountAmount = calculateLineDiscountAmount(original, discount);
  return {
    original,
    discountAmount,
    price: roundBookingMoney(Math.max(0, original - discountAmount)),
  };
}

export function formatLineDiscountLabel(
  discount?: BookingLineDiscount | null,
): string | null {
  if (!discount || !(Number(discount.amount) > 0)) return null;
  if (discount.type === "percentage") {
    return `${discount.amount}% Discount`;
  }
  return `€${formatBookingEur(discount.amount)} Discount`;
}

export function parseDiscountFields(
  type?: string | null,
  amount?: string | number | null,
): BookingLineDiscount | null {
  const parsed = Number.parseFloat(String(amount ?? "").replace(",", "."));
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return {
    type: type === "percentage" ? "percentage" : "fixed",
    amount: parsed,
  };
}

export function clientLineDiscountLabel(item: {
  discountPct?: number;
  discountType?: string;
  discountAmount?: number;
  originalPrice?: number;
  price: number;
}): string | null {
  if (typeof item.discountPct === "number" && item.discountPct > 0) {
    return `${item.discountPct}% Discount`;
  }
  if (item.discountType === "percentage" && Number(item.discountAmount) > 0) {
    return `${item.discountAmount}% Discount`;
  }
  if (item.discountType === "fixed" && Number(item.discountAmount) > 0) {
    return `€${formatBookingEur(Number(item.discountAmount))} Discount`;
  }
  if (
    typeof item.originalPrice === "number" &&
    item.originalPrice > item.price
  ) {
    return `€${formatBookingEur(item.originalPrice - item.price)} Discount`;
  }
  return null;
}

export function effectiveServiceAmount(service: {
  price: number;
  originalPrice?: number;
  discount?: BookingLineDiscount | null;
}): number {
  const original = service.originalPrice ?? service.price;
  if (service.discount) {
    return applyLineDiscount(original, service.discount).price;
  }
  return roundBookingMoney(service.price);
}

/** Keep list/net price + original + discount together when persisting a line. */
export function persistLinePricing(item: {
  price: number;
  originalPrice?: number;
  discount?: BookingLineDiscount | null;
  discountPct?: number;
}) {
  const price = roundBookingMoney(Number(item.price) || 0);
  const originalRaw = Number(item.originalPrice);
  let original =
    Number.isFinite(originalRaw) && originalRaw > 0
      ? roundBookingMoney(originalRaw)
      : price;
  if (item.discount && original <= price) {
    if (item.discount.type === "percentage") {
      const pct = Number(item.discount.amount) || 0;
      if (pct > 0 && pct < 100) {
        original = roundBookingMoney(price / (1 - pct / 100));
      }
    } else {
      original = roundBookingMoney(price + (Number(item.discount.amount) || 0));
    }
  }
  return {
    price,
    originalPrice: original,
    discount: item.discount ?? null,
    ...(typeof item.discountPct === "number" ? { discountPct: item.discountPct } : {}),
  };
}
