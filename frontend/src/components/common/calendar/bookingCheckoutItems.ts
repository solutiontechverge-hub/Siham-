import {
  calendarEventIsGuest,
  type CalendarEvent,
} from "../../../app/professionals/fixed-location/calendar/calendar.data";
import {
  calculateManualEntryDiscountAmount,
  lineTotal,
  type ManualEntryDiscount,
  type ManualEntryLine,
} from "../../sections/finance/manualEntry.data";
import type { SalesClientKind, SalesLineItem } from "./salesOverview.types";
import type { SalesPayerRole, SalesPayerShare } from "./salesSplitBill";

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function pushServiceLine(
  out: ManualEntryLine[],
  service: { id: string; name: string; price: number; guestId?: string | null },
  index: number,
  guestId?: string | null,
) {
  const gid = guestId ?? service.guestId ?? "";
  const id = `${service.id}::${String(gid)}::${index}`;
  if (out.some((line) => line.id === id)) return;
  out.push({
    id,
    sourceReference: service.id,
    sourceType: String(service.id).startsWith("unique-")
      ? "uniqueItemCode"
      : "serviceId",
    kind: "item",
    name: service.name,
    quantity: 1,
    unitPrice: roundMoney(service.price),
  });
}

function pushProductLine(
  out: ManualEntryLine[],
  product: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    unitPrice: number;
    guestId?: string | null;
  },
  index: number,
  guestId?: string | null,
) {
  const gid = guestId ?? product.guestId ?? "";
  const id = `${product.id}::${String(gid)}::${index}`;
  // Composite ids only — plain catalog id match used to drop guest copies.
  if (out.some((line) => line.id === id)) return;
  const qty = Math.max(1, Number(product.quantity) || 1);
  const unit =
    Number(product.unitPrice) > 0
      ? Number(product.unitPrice)
      : roundMoney((Number(product.price) || 0) / qty);
  const isUnique = String(product.id).startsWith("unique-");
  out.push({
    id,
    sourceReference: product.id,
    sourceType: isUnique ? "uniqueItemCode" : "productId",
    kind: isUnique ? "item" : "product",
    name: product.name,
    quantity: qty,
    unitPrice: roundMoney(unit),
  });
}

/** Seed editable checkout lines from the booking event (services / products / unique). */
export function manualLinesFromBookingEvent(
  event: CalendarEvent,
): ManualEntryLine[] {
  const details = event.details;
  const out: ManualEntryLine[] = [];
  const snapshotServices = details?.clientSnapshot?.services ?? [];

  if (snapshotServices.length) {
    snapshotServices.forEach((service, index) =>
      pushServiceLine(out, service, index, service.guestId),
    );
  } else {
    (details?.services ?? []).forEach((service, index) =>
      pushServiceLine(out, service, index, service.guestId),
    );
    for (const guest of details?.guests ?? []) {
      (guest.services ?? []).forEach((service, index) =>
        pushServiceLine(out, service, index, guest.id),
      );
    }
  }

  // Products/unique always — snapshot path used to skip guests[].products.
  for (const guest of details?.guests ?? []) {
    (guest.products ?? []).forEach((product, index) =>
      pushProductLine(out, product, index, guest.id),
    );
  }
  (details?.products ?? []).forEach((product, index) =>
    pushProductLine(out, product, index, product.guestId),
  );

  return out;
}

/** Middle segment of `catalogId::assigneeKey::index` (empty = main / unscoped). */
export function lineAssigneeKey(lineId: string): string {
  const parts = String(lineId).split("::");
  return parts.length >= 2 ? parts[1] : "";
}

export function filterLinesForParty(
  lines: ManualEntryLine[],
  party: { key: string; role: SalesPayerRole },
): ManualEntryLine[] {
  return lines.filter((line) => {
    const assignee = lineAssigneeKey(line.id);
    if (party.role === "main_client") {
      return !assignee || assignee === party.key;
    }
    return assignee === party.key;
  });
}

/** Stamp new catalog lines onto the active party so split shares stay correct. */
export function stampLinesForParty(
  lines: ManualEntryLine[],
  partyKey: string,
): ManualEntryLine[] {
  return lines.map((line, index) => {
    if (lineAssigneeKey(line.id)) return line;
    const base = line.sourceReference || line.id.split("::")[0] || line.id;
    return {
      ...line,
      id: `${base}::${partyKey}::${Date.now()}-${index}`,
    };
  });
}

export type CheckoutItemParty = {
  key: string;
  role: SalesPayerRole;
  name: string;
  email?: string;
  /** main → avatar + IC/BC badge; guest → name + "Guest User" subtitle */
  variant: "main" | "guest";
  clientBadge: "IC Client" | "BC Client" | null;
};

/**
 * Items-review parties: solo → one step; main+guest → main then each guest/model.
 * Guest-only walk-in → single Guest User step (no empty IC step).
 */
export function buildCheckoutItemParties(input: {
  event: CalendarEvent;
  shares: Array<
    Pick<SalesPayerShare, "key" | "role" | "displayName" | "email" | "label">
  >;
  clientName: string;
  clientEmail?: string;
  clientKind?: SalesClientKind | null;
}): CheckoutItemParty[] {
  const guestOnly = calendarEventIsGuest(input.event);
  const guests = input.shares.filter(
    (share) => share.role === "guest" || share.role === "model",
  );
  const main = input.shares.find((share) => share.role === "main_client");
  const mainBadge: CheckoutItemParty["clientBadge"] =
    input.clientKind === "company" ? "BC Client" : "IC Client";

  if (guestOnly || guests.length === 0) {
    const sole = main ?? input.shares[0];
    const asGuest =
      guestOnly || (sole ? sole.role !== "main_client" : false);
    return [
      {
        key: sole?.key ?? "main-client",
        role: sole?.role ?? "main_client",
        name: sole?.displayName || input.clientName,
        email: sole?.email || input.clientEmail,
        variant: asGuest ? "guest" : "main",
        clientBadge: asGuest ? null : mainBadge,
      },
    ];
  }

  const parties: CheckoutItemParty[] = [];
  if (main) {
    parties.push({
      key: main.key,
      role: "main_client",
      name: main.displayName || input.clientName,
      email: main.email || input.clientEmail,
      variant: "main",
      clientBadge: mainBadge,
    });
  }
  for (const guest of guests) {
    parties.push({
      key: guest.key,
      role: guest.role,
      name: guest.displayName,
      email: guest.email,
      variant: "guest",
      clientBadge: null,
    });
  }
  return parties.length
    ? parties
    : [
        {
          key: "main-client",
          role: "main_client",
          name: input.clientName,
          email: input.clientEmail,
          variant: "main",
          clientBadge: mainBadge,
        },
      ];
}

export function salesLinesFromManualCheckout(
  lines: ManualEntryLine[],
  discount: ManualEntryDiscount | null,
): SalesLineItem[] {
  const sales: SalesLineItem[] = lines.map((line) => ({
    id: line.id,
    label:
      line.quantity > 1 ? `${line.name} ×${line.quantity}` : line.name,
    amount: roundMoney(lineTotal(line)),
  }));
  const subtotal = sales.reduce((sum, line) => sum + line.amount, 0);
  const discountAmount = calculateManualEntryDiscountAmount(subtotal, discount);
  if (discountAmount > 0) {
    sales.push({
      id: "discount",
      label: "Discount",
      amount: -roundMoney(discountAmount),
    });
  }
  return sales;
}

/** Merge per-party discounts into sales lines (discount id scoped by party key). */
export function salesLinesFromPartyCheckout(
  lines: ManualEntryLine[],
  parties: CheckoutItemParty[],
  discountByParty: Record<string, ManualEntryDiscount | null>,
): SalesLineItem[] {
  const out: SalesLineItem[] = [];
  for (const party of parties) {
    const partyLines = filterLinesForParty(lines, party);
    const sales = salesLinesFromManualCheckout(
      partyLines,
      discountByParty[party.key] ?? null,
    );
    for (const line of sales) {
      if (line.id === "discount") {
        out.push({ ...line, id: `discount::${party.key}` });
      } else {
        out.push(line);
      }
    }
  }
  // Lines that somehow escaped party filters (legacy unscoped) — keep them.
  const seen = new Set(out.map((line) => line.id));
  for (const line of lines) {
    if (seen.has(line.id)) continue;
    if (parties.some((party) => filterLinesForParty([line], party).length)) {
      continue;
    }
    out.push({
      id: line.id,
      label:
        line.quantity > 1 ? `${line.name} ×${line.quantity}` : line.name,
      amount: roundMoney(lineTotal(line)),
    });
  }
  return out;
}

export function checkoutItemsSubtotal(lines: ManualEntryLine[]) {
  return roundMoney(lines.reduce((sum, line) => sum + lineTotal(line), 0));
}
