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

export type BookingLinePricingMode = "net" | "list";

export type BookingLinePriceFields = {
  price: number;
  originalPrice?: number;
  discount?: BookingLineDiscount | null;
  /** `net` = price already discounted; absent/list = legacy pro list+discount. */
  pricingMode?: BookingLinePricingMode;
  discountPct?: number;
};

/**
 * Net line amount.
 * - `pricingMode: "net"` or originalPrice > price: `price` is already net.
 * - Legacy pro list+discount (no mode / no original): apply discount onto `price`.
 */
export function effectiveServiceAmount(service: BookingLinePriceFields): number {
  const price = roundBookingMoney(Math.max(0, Number(service.price) || 0));
  if (service.pricingMode === "net") return price;
  const originalRaw = Number(service.originalPrice);
  if (Number.isFinite(originalRaw) && originalRaw > price + Number.EPSILON) {
    return price;
  }
  if (service.discount) return applyLineDiscount(price, service.discount).price;
  return price;
}

/** List/base amount for strike-through UI (net when undiscounted). */
export function serviceListAmount(service: BookingLinePriceFields): number {
  const net = effectiveServiceAmount(service);
  const originalRaw = Number(service.originalPrice);
  if (Number.isFinite(originalRaw) && originalRaw > net + Number.EPSILON) {
    return roundBookingMoney(originalRaw);
  }
  if (service.discount?.amount && service.pricingMode !== "net") {
    return roundBookingMoney(Number(service.price) || 0);
  }
  if (service.discount?.amount && Number.isFinite(originalRaw) && originalRaw > 0) {
    return roundBookingMoney(originalRaw);
  }
  return net;
}

/** Coerce discountPct / partial discount into a BookingLineDiscount. */
export function coerceLineDiscount(
  service: BookingLinePriceFields,
): BookingLineDiscount | null {
  if (service.discount && Number(service.discount.amount) > 0) {
    return {
      type: service.discount.type === "percentage" ? "percentage" : "fixed",
      amount: Number(service.discount.amount),
    };
  }
  const pct = Number(service.discountPct);
  if (Number.isFinite(pct) && pct > 0) {
    return { type: "percentage", amount: pct };
  }
  return null;
}

/**
 * Normalize a stored service line to canonical net + originalPrice.
 * Legacy rows stored list in `price` (sometimes with a reverse-engineered originalPrice);
 * treat `price` as list when `pricingMode` is not `net`.
 */
export function normalizeServiceLinePricing<T extends BookingLinePriceFields>(
  service: T,
): T {
  const discount = coerceLineDiscount(service);
  if (!discount?.amount) {
    const price = roundBookingMoney(Number(service.price) || 0);
    return {
      ...service,
      price,
      originalPrice: undefined,
      discount: null,
      pricingMode: "net" as BookingLinePricingMode,
    };
  }
  if (service.pricingMode === "net") {
    const price = roundBookingMoney(Number(service.price) || 0);
    const originalRaw = Number(service.originalPrice);
    return {
      ...service,
      price,
      originalPrice:
        Number.isFinite(originalRaw) && originalRaw > price + Number.EPSILON
          ? roundBookingMoney(originalRaw)
          : undefined,
      discount,
      pricingMode: "net",
      ...(discount.type === "percentage" ? { discountPct: discount.amount } : {}),
    };
  }
  // ponytail: legacy/poison list-in-price; ignore reverse-engineered originalPrice
  const list = roundBookingMoney(Number(service.price) || 0);
  const applied = applyLineDiscount(list, discount);
  return {
    ...service,
    price: applied.price,
    originalPrice: applied.discountAmount > 0 ? applied.original : undefined,
    discount: applied.discountAmount > 0 ? discount : null,
    pricingMode: "net" as BookingLinePricingMode,
    ...(discount.type === "percentage" ? { discountPct: discount.amount } : {}),
  };
}

/** Keep list/net price + original + discount together when persisting a line. */
export function persistLinePricing(
  item: BookingLinePriceFields & { unitPrice?: number; quantity?: number },
) {
  const price = roundBookingMoney(Number(item.price) || 0);
  const originalRaw = Number(item.originalPrice);
  const hasList =
    Number.isFinite(originalRaw) && originalRaw > price + Number.EPSILON;
  const discount = coerceLineDiscount(item);
  const discountPctFields =
    typeof item.discountPct === "number"
      ? { discountPct: item.discountPct }
      : discount?.type === "percentage"
        ? { discountPct: discount.amount }
        : {};
  // Products always carry unitPrice; services do not.
  const isProductLine = item.unitPrice != null;

  // Already net + list (explicit mode, or product catalog lines).
  if (item.pricingMode === "net" || (discount && hasList && isProductLine)) {
    return {
      price,
      originalPrice: hasList ? roundBookingMoney(originalRaw) : price,
      discount,
      pricingMode: "net" as BookingLinePricingMode,
      ...discountPctFields,
    };
  }
  // Service draft / legacy poison: price is list — write net + list.
  if (discount) {
    const applied = applyLineDiscount(price, discount);
    return {
      price: applied.price,
      originalPrice: applied.original,
      discount,
      pricingMode: "net" as BookingLinePricingMode,
      ...discountPctFields,
    };
  }
  return {
    price,
    originalPrice: hasList ? roundBookingMoney(originalRaw) : price,
    discount: null,
    pricingMode: "net" as BookingLinePricingMode,
    ...(typeof item.discountPct === "number"
      ? { discountPct: item.discountPct }
      : {}),
  };
}
