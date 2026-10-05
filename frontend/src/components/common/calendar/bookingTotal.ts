import {
  calculateManualEntryDiscountAmount,
  type ManualEntryDiscount,
} from "../../sections/finance/manualEntry.data";
import { roundBookingMoney as roundMoney } from "../../../data/bookingLinePricing";

export type BookingPriceInput = {
  lineSubtotal: number;
  discount?: ManualEntryDiscount | null;
  /** Extra add-ons already resolved to money (e.g. kilometer allowance). */
  extrasAmount?: number;
  showLateCancellation?: boolean;
  lateCancellationFeePercent?: number | string;
  lateCancellationFeePercentCeiling?: number | string;
  showLateRescheduling?: boolean;
  lateRescheduleFeePercent?: number | string;
  lateRescheduleFeePercentCeiling?: number | string;
  showNoShowFee?: boolean;
  noShowFeePercent?: number | string;
  noShowFeePercentCeiling?: number | string;
  showPrepayment?: boolean;
  prepaymentPercent?: number | string;
  /** When true, prepaid amount is deducted from the payable total. */
  prepaymentPaid?: boolean;
  /** Offline prepayment is collected at the visit — do not deduct it from remaining. */
  prepaymentOffline?: boolean;
};

export type BookingPriceBreakdown = {
  lineSubtotal: number;
  extrasAmount: number;
  discountAmount: number;
  afterDiscount: number;
  lateCancellationFeeAmount: number;
  lateRescheduleFeeAmount: number;
  noShowFeeAmount: number;
  feesTotal: number;
  /** Booking value after discount + fees (persisted as total_price). */
  bookingTotal: number;
  prepaymentAmount: number;
  /** Amount deducted from payable because prepayment is paid / applied. */
  prepaidApplied: number;
  /** Amount still owed — shown as Total Price in the drawer. */
  payableTotal: number;
  remainingAfterPrepayment: number;
};

export { roundBookingMoney } from "../../../data/bookingLinePricing";

export type BookingPriceSummaryLine = {
  label: string;
  amount: number;
  kind?: "add" | "subtract";
};

export type BookingPricePerson = {
  id: string;
  isRequester?: boolean;
  participantType?: string | null;
};

export type BookingPriceService = {
  price: number;
  guestId?: string | null;
  isAddOn?: boolean;
};

export type BookingPriceProduct = {
  id?: string;
  price: number;
  quantity?: number;
  originalPrice?: number;
  unitPrice?: number;
};

export function lineDiscountAmountFromItems(input: {
  services?: readonly { price: number; originalPrice?: number }[] | null;
  products?: readonly { price: number; originalPrice?: number }[] | null;
}): number {
  let amount = 0;
  for (const item of [...(input.services ?? []), ...(input.products ?? [])]) {
    const net = Number(item.price) || 0;
    const original = Number(item.originalPrice ?? item.price) || 0;
    if (original > net) amount += original - net;
  }
  return roundMoney(amount);
}

export function isUniqueItemId(id?: string | null): boolean {
  return Boolean(id && String(id).startsWith("unique-"));
}

export function partitionBookingProducts<T extends { id?: string | null }>(
  items: readonly T[] | null | undefined,
): { products: T[]; uniqueItems: T[] } {
  const products: T[] = [];
  const uniqueItems: T[] = [];
  for (const item of items ?? []) {
    if (isUniqueItemId(item.id)) uniqueItems.push(item);
    else products.push(item);
  }
  return { products, uniqueItems };
}

const ITEMIZED_SUMMARY_LABELS = new Set([
  "Services",
  "Guests / Models",
  "Add-ons",
  "Products",
  "Unique items",
]);

/** Keep extras/fees/discount after services, products, and unique items are listed as cards. */
export function withoutItemizedBookingSummaryLines(
  lines: readonly BookingPriceSummaryLine[],
): BookingPriceSummaryLine[] {
  return lines.filter((line) => !ITEMIZED_SUMMARY_LABELS.has(line.label));
}

function isRequesterPerson(person: BookingPricePerson): boolean {
  return Boolean(person.isRequester) || person.participantType === "requester";
}

function isGuestOrModelPerson(person: BookingPricePerson): boolean {
  if (isRequesterPerson(person)) return false;
  return person.participantType === "guest" || person.participantType === "model";
}

/** Split requester vs guest/model vs product buckets. Amounts stay dynamic. */
export function splitBookingLineTotals(input: {
  services?: readonly BookingPriceService[] | null;
  people?: readonly BookingPricePerson[] | null;
  products?: readonly BookingPriceProduct[] | null;
  uniqueItemsTotal?: number;
}): {
  servicesTotal: number;
  guestsTotal: number;
  addOnsTotal: number;
  productsTotal: number;
  uniqueItemsTotal: number;
} {
  const people = input.people ?? [];
  const guestIds = new Set(
    people.filter(isGuestOrModelPerson).map((person) => String(person.id)),
  );

  let servicesTotal = 0;
  let guestsTotal = 0;
  let addOnsTotal = 0;
  for (const service of input.services ?? []) {
    const price = Number(service.price) || 0;
    if (service.isAddOn) {
      addOnsTotal += price;
      continue;
    }
    const guestId =
      service.guestId != null && String(service.guestId).trim() !== ""
        ? String(service.guestId)
        : "";
    if (guestId && guestIds.has(guestId)) guestsTotal += price;
    else servicesTotal += price;
  }

  let productsTotal = 0;
  let uniqueFromProducts = 0;
  for (const product of input.products ?? []) {
    const amount = Number(product.price) || 0;
    if (isUniqueItemId(product.id)) uniqueFromProducts += amount;
    else productsTotal += amount;
  }

  return {
    servicesTotal: roundMoney(servicesTotal),
    guestsTotal: roundMoney(guestsTotal),
    addOnsTotal: roundMoney(addOnsTotal),
    productsTotal: roundMoney(productsTotal),
    uniqueItemsTotal: roundMoney(
      (Number(input.uniqueItemsTotal) || 0) + uniqueFromProducts,
    ),
  };
}

export function buildBookingPriceSummaryLines(input: {
  servicesTotal?: number;
  guestsTotal?: number;
  addOnsTotal?: number;
  productsTotal?: number;
  uniqueItemsTotal?: number;
  extrasAmount?: number;
  extrasLabel?: string;
  discountAmount?: number;
  lateCancellationFeeAmount?: number;
  lateRescheduleFeeAmount?: number;
  noShowFeeAmount?: number;
}): BookingPriceSummaryLine[] {
  const servicesTotal = input.servicesTotal ?? 0;
  const guestsTotal = input.guestsTotal ?? 0;
  const addOnsTotal = input.addOnsTotal ?? 0;
  const productsTotal = input.productsTotal ?? 0;
  const uniqueItemsTotal = input.uniqueItemsTotal ?? 0;
  const extrasAmount = input.extrasAmount ?? 0;
  const discountAmount = input.discountAmount ?? 0;
  const lateCancellationFeeAmount = input.lateCancellationFeeAmount ?? 0;
  const lateRescheduleFeeAmount = input.lateRescheduleFeeAmount ?? 0;
  const noShowFeeAmount = input.noShowFeeAmount ?? 0;
  const hasBreakdown =
    guestsTotal > 0 ||
    addOnsTotal > 0 ||
    productsTotal > 0 ||
    uniqueItemsTotal > 0 ||
    extrasAmount > 0 ||
    discountAmount > 0 ||
    lateCancellationFeeAmount > 0 ||
    lateRescheduleFeeAmount > 0 ||
    noShowFeeAmount > 0;
  if (!hasBreakdown) return [];
  const lines: BookingPriceSummaryLine[] = [];
  if (servicesTotal > 0) lines.push({ label: "Services", amount: servicesTotal });
  if (guestsTotal > 0) lines.push({ label: "Guests / Models", amount: guestsTotal });
  if (addOnsTotal > 0) lines.push({ label: "Add-ons", amount: addOnsTotal });
  if (productsTotal > 0) lines.push({ label: "Products", amount: productsTotal });
  if (uniqueItemsTotal > 0) {
    lines.push({ label: "Unique items", amount: uniqueItemsTotal });
  }
  if (extrasAmount > 0) {
    lines.push({
      label: input.extrasLabel ?? "Kilometer Allowance",
      amount: extrasAmount,
    });
  }
  if (discountAmount > 0) {
    lines.push({ label: "Discount", amount: discountAmount, kind: "subtract" });
  }
  if (lateCancellationFeeAmount > 0) {
    lines.push({ label: "Cancellation fee", amount: lateCancellationFeeAmount });
  }
  if (lateRescheduleFeeAmount > 0) {
    lines.push({
      label: "Late reschedule fee",
      amount: lateRescheduleFeeAmount,
    });
  }
  if (noShowFeeAmount > 0) {
    lines.push({ label: "No-show fee", amount: noShowFeeAmount });
  }
  return lines;
}

export function resolveBookingPriceDisplay(input: {
  breakdown: BookingPriceBreakdown;
  prepaymentPaid?: boolean;
}): { displayTotal: number; originalPrice: number | null } {
  const { breakdown, prepaymentPaid } = input;
  const preDiscount = roundMoney(breakdown.lineSubtotal + breakdown.extrasAmount);
  if (prepaymentPaid && breakdown.prepaymentAmount > 0) {
    return {
      displayTotal: breakdown.payableTotal,
      originalPrice:
        breakdown.discountAmount > 0 ? preDiscount : breakdown.bookingTotal,
    };
  }
  if (breakdown.discountAmount > 0) {
    return {
      displayTotal: breakdown.bookingTotal,
      originalPrice: preDiscount,
    };
  }
  return { displayTotal: breakdown.bookingTotal, originalPrice: null };
}

export type ClientBookingPriceInput = Omit<BookingPriceInput, "lineSubtotal"> & {
  services?: readonly BookingPriceService[] | null;
  people?: readonly BookingPricePerson[] | null;
  products?: readonly BookingPriceProduct[] | null;
  uniqueItemsTotal?: number;
  extrasLabel?: string;
};

export function summarizeClientBookingPrice(input: ClientBookingPriceInput) {
  const split = splitBookingLineTotals(input);
  const lineSubtotal = roundMoney(
    split.servicesTotal +
      split.guestsTotal +
      split.addOnsTotal +
      split.productsTotal +
      split.uniqueItemsTotal,
  );
  const breakdown = computeBookingPrice({
    lineSubtotal,
    extrasAmount: input.extrasAmount,
    discount: input.discount,
    showLateCancellation: input.showLateCancellation,
    lateCancellationFeePercent: input.lateCancellationFeePercent,
    showLateRescheduling: input.showLateRescheduling,
    lateRescheduleFeePercent: input.lateRescheduleFeePercent,
    showNoShowFee: input.showNoShowFee,
    noShowFeePercent: input.noShowFeePercent,
    showPrepayment: input.showPrepayment,
    prepaymentPercent: input.prepaymentPercent,
    prepaymentPaid: input.prepaymentPaid,
    prepaymentOffline: input.prepaymentOffline,
  });
  const lines = buildBookingPriceSummaryLines({
    ...split,
    extrasAmount: breakdown.extrasAmount,
    extrasLabel: input.extrasLabel,
    discountAmount: breakdown.discountAmount,
    lateCancellationFeeAmount: breakdown.lateCancellationFeeAmount,
    lateRescheduleFeeAmount: breakdown.lateRescheduleFeeAmount,
    noShowFeeAmount: breakdown.noShowFeeAmount,
  });
  const display = resolveBookingPriceDisplay({
    breakdown,
    prepaymentPaid: input.prepaymentPaid,
  });
  return { split, breakdown, lines, ...display };
}

function parsePercent(value: number | string | undefined): number {
  const pct = Number(value);
  if (!Number.isFinite(pct) || pct <= 0) return 0;
  return pct;
}

function percentOf(base: number, percent: number | string | undefined): number {
  const pct = parsePercent(percent);
  if (pct <= 0 || base <= 0) return 0;
  return roundMoney((base * pct) / 100);
}

/**
 * Single source of truth for New Booking / drawer pricing:
 * line items → discount → late/cancel fees → optional prepaid deduction.
 */
export function computeBookingPrice(
  input: BookingPriceInput,
): BookingPriceBreakdown {
  const lineSubtotal = Math.max(0, Number(input.lineSubtotal) || 0);
  const extrasAmount = Math.max(0, Number(input.extrasAmount) || 0);
  const baseBeforeDiscount = roundMoney(lineSubtotal + extrasAmount);

  const discountAmount = roundMoney(
    calculateManualEntryDiscountAmount(
      baseBeforeDiscount,
      input.discount ?? null,
    ),
  );
  const afterDiscount = roundMoney(
    Math.max(0, baseBeforeDiscount - discountAmount),
  );

  const cappedPercent = (value: number | string | undefined, ceiling: number | string | undefined) => {
    const requested = Math.max(0, Number(value) || 0);
    const max = Number(ceiling);
    return Number.isFinite(max) && max >= 0 ? Math.min(requested, max) : requested;
  };
  const lateCancellationFeeAmount = input.showLateCancellation
    ? percentOf(afterDiscount, cappedPercent(input.lateCancellationFeePercent, input.lateCancellationFeePercentCeiling))
    : 0;
  const lateRescheduleFeeAmount = input.showLateRescheduling
    ? percentOf(afterDiscount, cappedPercent(input.lateRescheduleFeePercent, input.lateRescheduleFeePercentCeiling))
    : 0;
  const noShowFeeAmount = input.showNoShowFee
    ? percentOf(afterDiscount, cappedPercent(input.noShowFeePercent, input.noShowFeePercentCeiling))
    : 0;
  const feesTotal = roundMoney(
    lateCancellationFeeAmount + lateRescheduleFeeAmount + noShowFeeAmount,
  );

  const bookingTotal = roundMoney(afterDiscount + feesTotal);

  const prepaymentAmount = input.showPrepayment
    ? percentOf(afterDiscount, input.prepaymentPercent)
    : 0;
  const prepaidApplied =
    input.prepaymentPaid && !input.prepaymentOffline && prepaymentAmount > 0
      ? prepaymentAmount
      : 0;

  const payableTotal = roundMoney(Math.max(0, bookingTotal - prepaidApplied));
  const remainingAfterPrepayment = roundMoney(
    input.prepaymentOffline
      ? bookingTotal
      : Math.max(0, bookingTotal - prepaymentAmount),
  );

  return {
    lineSubtotal: roundMoney(lineSubtotal),
    extrasAmount,
    discountAmount,
    afterDiscount,
    lateCancellationFeeAmount,
    lateRescheduleFeeAmount,
    noShowFeeAmount,
    feesTotal,
    bookingTotal,
    prepaymentAmount,
    prepaidApplied,
    payableTotal,
    remainingAfterPrepayment,
  };
}

export function isBookingPrepaymentPaid(status?: string | null): boolean {
  const value = String(status ?? "").toLowerCase();
  return value === "paid" || value === "confirmed";
}
