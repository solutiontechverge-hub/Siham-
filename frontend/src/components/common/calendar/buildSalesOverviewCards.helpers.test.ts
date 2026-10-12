/**
 * Run with: npx --yes tsx src/components/common/calendar/buildSalesOverviewCards.helpers.test.ts
 */
import assert from "node:assert/strict";
import type { CalendarEvent } from "../../../app/professionals/fixed-location/calendar/calendar.data";
import {
  buildCancellationFeeInvoiceMetaLines,
  buildCardsForEvent,
  mergeAddonRecordsIntoCards,
  resolveProtectiveFeeSalesCardSpec,
  shouldShowAfterTreatmentCard,
} from "./buildSalesOverviewCards.helpers";
import { buildSalesOverviewCards } from "./buildSalesOverviewCards";
import {
  salesPaymentBadge,
  type SalesAddonRecord,
  type SalesOverviewCardData,
} from "./salesOverview.types";

assert.equal(
  salesPaymentBadge("payment_due", "prepayment"),
  "Prepayment Due",
);
assert.equal(salesPaymentBadge("payment_due", "after_treatment"), "Payment Due");
assert.equal(salesPaymentBadge("payment_due"), "Payment Due");
assert.equal(salesPaymentBadge("voided"), "Voided");

// Cancel Sales → voided addon stays visible with Voided badge (not hidden).
const voidedAddon = mergeAddonRecordsIntoCards(
  [],
  [
    {
      id: "addon-1",
      bookingId: "b1",
      bookingCode: "BK1",
      clientName: "Guest Sara",
      lines: [
        {
          id: "l1",
          kind: "item",
          name: "Scissor Cut",
          quantity: 1,
          unitPrice: 100,
        },
      ],
      discount: null,
      discountAmount: 0,
      totalPrice: 100,
      paymentMethod: "onlineDirect",
      createdAt: "2026-06-25T10:00:00.000Z",
      voided: true,
    } satisfies SalesAddonRecord,
  ],
  { financeHints: [] },
);
assert.equal(voidedAddon.length, 1, "voided addon card remains in overview");
assert.equal(voidedAddon[0]?.statusBadge, "Voided");
assert.equal(voidedAddon[0]?.paymentState, "voided");
assert.equal(voidedAddon[0]?.highlightLabel, "Payment");

assert.equal(
  shouldShowAfterTreatmentCard({
    isPrepayPaid: true,
    isInProgress: false,
    isCompleted: false,
    ended: true,
  }),
  false,
  "prepaid + clock ended alone must hide after-treatment",
);

assert.equal(
  shouldShowAfterTreatmentCard({
    isPrepayPaid: true,
    isInProgress: true,
    isCompleted: false,
    ended: true,
  }),
  true,
  "prepaid + in progress shows after-treatment",
);

assert.equal(
  shouldShowAfterTreatmentCard({
    isPrepayPaid: true,
    isInProgress: false,
    isCompleted: true,
    ended: true,
  }),
  true,
  "prepaid + completed shows after-treatment",
);

assert.equal(
  shouldShowAfterTreatmentCard({
    isPrepayPaid: false,
    isInProgress: false,
    isCompleted: false,
    ended: true,
  }),
  true,
  "no prepay + ended still shows after-treatment",
);

assert.equal(
  shouldShowAfterTreatmentCard({
    isPrepayPaid: true,
    isInProgress: false,
    isCompleted: false,
    ended: false,
    hasCollectedAfterTreatment: true,
  }),
  true,
  "already-collected after-treatment stays visible",
);

assert.equal(
  resolveProtectiveFeeSalesCardSpec({
    status: "Cancelled",
    showLateCancellation: false,
    lateCancellationFeePercent: 50,
    lineSubtotal: 100,
  }),
  null,
  "plain cancel without fee section yields no invoice",
);

const feeCard = resolveProtectiveFeeSalesCardSpec({
  status: "Cancelled",
  showLateCancellation: true,
  lateCancellationFeePercent: 50,
  lineSubtotal: 100,
  cancellationFeeAt: "2026-09-23T10:00:00.000Z",
  exceededCancellationWindow: true,
});
assert.ok(feeCard, "cancelled + active late fee builds invoice spec");
assert.equal(
  feeCard?.feeLabel,
  "Late Cancellation Booking Fee (50% Of €100)",
);
assert.equal(feeCard?.feeAmount, 50);
assert.equal(feeCard?.entryLabel, "Late Cancellation Booking Fee");
assert.equal(feeCard?.title, "Fee Summary");
assert.ok(
  feeCard?.metaLines.some((line) => line.startsWith("Cancellation time:")),
  "stamps cancellation time",
);
assert.ok(
  feeCard?.metaLines.includes("Breached preset cancellation window"),
  "stamps window breach",
);

const within = buildCancellationFeeInvoiceMetaLines({
  cancellationFeeAt: "2026-09-23T10:00:00.000Z",
  exceededCancellationWindow: false,
});
assert.ok(within.includes("Within preset cancellation window"));

const kmFee = resolveProtectiveFeeSalesCardSpec({
  status: "Cancelled",
  showLateCancellation: true,
  lateCancellationFeePercent: 50,
  lineSubtotal: 100,
  extrasAmount: 20,
});
assert.equal(kmFee?.feeAmount, 60, "km extras enter cancellation fee base");

// Cancelled + prepaid + late fee → prepaid receipt card + fee invoice card.
const cancelledPrepaidFeeEvent = {
  id: "b-cancel-fee-1",
  title: "Cut",
  date: "2026-07-25",
  start: "10:00",
  end: "11:00",
  status: "Cancelled",
  bookingCode: "BK-CANCEL-FEE",
  showClientName: "aliza",
  details: {
    showPrepayment: true,
    prepaymentPercent: "20",
    prepaymentStatus: "confirmed",
    showLateCancellation: true,
    lateCancellationFeePercent: "50",
    cancellationFeeAt: "2026-07-24T10:00:00.000Z",
    exceededCancellationWindow: true,
    paymentMethod: "onlineDirect",
    clientEmail: "aliza@example.com",
    clientSnapshot: {
      people: [{ id: "main", name: "aliza", isRequester: true }],
      services: [{ id: "dye", name: "hair dye", price: 100, guestId: null }],
    },
  },
} as unknown as CalendarEvent;

const cancelledPrepaidFeeCards = buildCardsForEvent({
  event: cancelledPrepaidFeeEvent,
  booking: {
    id: "cancel-fee-1",
    status: "cancelled",
    prepayment_status: "paid",
  } as never,
  clientName: "aliza",
  clientEmail: "aliza@example.com",
  ctx: { financeHints: [] },
});
assert.equal(
  cancelledPrepaidFeeCards.filter((c) => c.kind === "prepayment").length,
  1,
  "cancelled + prepaid still shows prepayment card",
);
assert.equal(
  cancelledPrepaidFeeCards.filter((c) => c.kind === "after_treatment").length,
  1,
  "cancelled + late fee shows fee invoice card",
);
const feeSummaryCard = cancelledPrepaidFeeCards.find(
  (c) => c.title === "Fee Summary",
);
assert.ok(feeSummaryCard, "Fee Summary card present");
assert.ok(
  feeSummaryCard?.lines.some((line) =>
    line.label.startsWith("Late Cancellation Booking Fee"),
  ),
  "fee card carries Late Cancellation Booking Fee line",
);
assert.equal(feeSummaryCard?.totalLabel, "Total");
assert.equal(feeSummaryCard?.highlightLabel, "Payment");
assert.equal(
  feeSummaryCard?.secondaryRows?.[0]?.label,
  "Prepaid",
  "prepaid credit on Fee Summary",
);
assert.equal(
  feeSummaryCard?.secondaryRows?.[0]?.amount,
  20,
  "prepaid credit capped to collected prepay (€20 of €100)",
);
assert.equal(
  feeSummaryCard?.highlightAmount,
  30,
  "Payment = fee €50 − prepaid €20",
);
assert.equal(feeSummaryCard?.showAddOns, false, "no Add-ons on Fee Summary");

const plainCancelCards = buildCardsForEvent({
  event: {
    ...cancelledPrepaidFeeEvent,
    details: {
      ...cancelledPrepaidFeeEvent.details,
      showLateCancellation: false,
      lateCancellationFeePercent: undefined,
      cancellationFeeAt: undefined,
      exceededCancellationWindow: undefined,
      prepaymentStatus: "none",
      showPrepayment: false,
    },
  } as unknown as CalendarEvent,
  booking: { id: "plain-cancel", status: "cancelled", prepayment_status: "none" } as never,
  clientName: "aliza",
  ctx: { financeHints: [] },
});
assert.equal(plainCancelCards.length, 0, "plain cancel without fee/prepaid stays empty");

// Stale calendar details + stamped booking.notes → still builds Fee Summary.
const notesStamp = `note\n---mollure-meta---\n${JSON.stringify({
  showLateCancellation: true,
  lateCancellationFeePercent: "50",
  cancellationFeeAt: "2026-07-24T10:00:00.000Z",
  exceededCancellationWindow: true,
})}`;
const staleEventFeeCards = buildCardsForEvent({
  event: {
    ...cancelledPrepaidFeeEvent,
    details: {
      ...cancelledPrepaidFeeEvent.details,
      showLateCancellation: false,
      lateCancellationFeePercent: undefined,
    },
  } as unknown as CalendarEvent,
  booking: {
    id: "cancel-fee-stale",
    status: "cancelled",
    prepayment_status: "paid",
    notes: notesStamp,
  } as never,
  clientName: "aliza",
  ctx: { financeHints: [] },
});
assert.equal(
  staleEventFeeCards.filter((c) => c.title === "Fee Summary").length,
  1,
  "booking.notes stamp heals Fee Summary when event.details lack flag",
);

// Finance LCF row heals Fee Summary when notes never got the stamp (pre-fix residual).
const financeHealCards = buildCardsForEvent({
  event: {
    ...cancelledPrepaidFeeEvent,
    details: {
      ...cancelledPrepaidFeeEvent.details,
      showLateCancellation: false,
      lateCancellationFeePercent: "50",
    },
  } as unknown as CalendarEvent,
  booking: {
    id: "cancel-fee-finance",
    status: "cancelled",
    prepayment_status: "paid",
  } as never,
  clientName: "aliza",
  ctx: {
    financeHints: [
      {
        bookingId: "cancel-fee-finance",
        bookingCode: "BK-CANCEL-FEE",
        phase: "full",
        status: "Paid",
        entryLabel: "Late Cancellation Booking Fee",
        amount: 50,
      },
    ],
  },
});
assert.equal(
  financeHealCards.filter((c) => c.title === "Fee Summary").length,
  1,
  "paid LCF finance hint heals Fee Summary without notes stamp",
);
assert.ok(
  financeHealCards.some((c) =>
    c.lines.some((line) => line.label.startsWith("Late Cancellation Booking Fee")),
  ),
);

// showLateCancellation stamped but service lines empty (fee-only total) → still Fee Summary via LCF hint.
const emptyLinesFeeCards = buildCardsForEvent({
  event: {
    ...cancelledPrepaidFeeEvent,
    details: {
      ...cancelledPrepaidFeeEvent.details,
      showLateCancellation: true,
      lateCancellationFeePercent: "10",
      clientSnapshot: { people: [], services: [] },
      services: [],
    },
  } as unknown as CalendarEvent,
  booking: {
    id: "cancel-fee-empty-lines",
    status: "cancelled",
    prepayment_status: "paid",
    total_price: 23,
  } as never,
  clientName: "aliza",
  ctx: {
    financeHints: [
      {
        bookingId: "cancel-fee-empty-lines",
        bookingCode: "BK-CANCEL-FEE",
        phase: "full",
        status: "Paid",
        entryLabel: "Late Cancellation Booking Fee",
        amount: 23,
      },
    ],
  },
});
assert.equal(
  emptyLinesFeeCards.filter((c) => c.title === "Fee Summary").length,
  1,
  "Fee Summary heals when line base is 0 but LCF finance hint exists",
);
assert.ok(
  emptyLinesFeeCards.some((c) =>
    c.lines.some(
      (line) => line.label === "Late Cancellation Booking Fee (10% Of €230)",
    ),
  ),
  "empty-base Fee Summary still shows percent line from hint",
);

// Aliza residual: cancelled + prepaid, no stamp / no LCF — heal Fee Summary from policy %.
const alizaHealEvent = {
  id: "b-aliza-heal",
  title: "Cut",
  date: "2026-10-09",
  start: "09:00",
  end: "09:45",
  status: "Cancelled",
  bookingCode: "BK-ALIZA",
  showClientName: "aliza",
  details: {
    showPrepayment: true,
    prepaymentPercent: "20",
    prepaymentStatus: "confirmed",
    showLateCancellation: false,
    paymentMethod: "onlineDirect",
    clientEmail: "alizaclient@yopmail.com",
    clientSnapshot: {
      people: [{ id: "main", name: "aliza", isRequester: true }],
      services: [
        { id: "dye1", name: "hair dye", price: 44, guestId: null },
        { id: "buzz", name: "buzz cutt", price: 44, guestId: null },
        { id: "dye2", name: "hair dye", price: 44, guestId: null },
      ],
    },
  },
} as unknown as CalendarEvent;

const alizaHealCards = buildSalesOverviewCards({
  bookings: [],
  currentEvent: alizaHealEvent,
  clientName: "aliza",
  clientEmail: "alizaclient@yopmail.com",
  financeHints: [],
  lateCancellationFeePercentDefault: "10",
});
assert.ok(
  alizaHealCards.some((c) => c.title === "Fee Summary"),
  "cancelled + prepaid + policy lateCancel% heals Fee Summary into cards array",
);
assert.ok(
  alizaHealCards.some((c) => c.title === "Prepayment Summary"),
  "Prepayment Summary still shown alongside Fee Summary",
);
assert.equal(
  alizaHealCards[0]?.title,
  "Fee Summary",
  "Fee Summary sorts above Prepayment Summary",
);
assert.equal(
  alizaHealCards.find((c) => c.title === "Fee Summary")?.highlightAmount,
  0,
  "aliza: €13.20 fee − €26.40 prepaid credit → Payment €0",
);
assert.ok(
  alizaHealCards
    .find((c) => c.title === "Fee Summary")
    ?.lines.some((line) =>
      line.label.startsWith("Late Cancellation Booking Fee (10% Of €132)"),
    ),
  "healed Fee Summary uses policy 10% of €132",
);

// Policy % alone without prepaid / stamp / LCF → still no Fee Summary (plain free cancel).
const plainPolicyCards = buildCardsForEvent({
  event: {
    ...alizaHealEvent,
    details: {
      ...alizaHealEvent.details,
      showPrepayment: false,
      prepaymentStatus: "none",
    },
  } as unknown as CalendarEvent,
  booking: {
    id: "plain-policy",
    status: "cancelled",
    prepayment_status: "none",
  } as never,
  clientName: "aliza",
  ctx: {
    financeHints: [],
    lateCancellationFeePercentDefault: "10",
  },
});
assert.equal(
  plainPolicyCards.filter((c) => c.title === "Fee Summary").length,
  0,
  "policy % without prepaid/stamp/LCF does not invent Fee Summary",
);

const baseCard: SalesOverviewCardData = {
  id: "b1-after-treatment",
  bookingId: "b1",
  bookingCode: "BK1",
  kind: "after_treatment",
  title: "After treatment Summary",
  clientName: "aliza",
  lines: [
    { id: "s1", label: "hair dye", amount: 44 },
    { id: "kilometer-allowance", label: "Kilometer Allowance", amount: 20 },
  ],
  total: 64,
  highlightLabel: "Payment",
  highlightAmount: 64,
  showAddOns: true,
  occurredAt: "2026-09-28T00:00:00.000Z",
};

const addon: SalesAddonRecord = {
  id: "a1",
  bookingId: "b1",
  bookingCode: "BK1",
  clientName: "aliza",
  lines: [
    {
      id: "l1",
      kind: "item",
      name: "Eye Lashes",
      quantity: 1,
      unitPrice: 50,
    },
  ],
  discount: null,
  discountAmount: 0,
  totalPrice: 50,
  paymentMethod: "onlineDirect",
  createdAt: "2026-09-28T01:00:00.000Z",
};

const merged = mergeAddonRecordsIntoCards([baseCard], [addon], {
  financeHints: [],
});
// Current helper appends one Add-ons Summary card per booking (does not fold lines).
assert.equal(merged.length, 2, "addon becomes its own summary card");
assert.equal(merged[0].kind, "after_treatment");
assert.equal(merged[1].kind, "addon");
assert.ok(
  merged[1].lines.some((line) => line.label === "Eye Lashes"),
  "addon lines live on the add-on card",
);
assert.ok(
  merged[0].lines.some((line) => line.id === "kilometer-allowance"),
  "km line preserved on after-treatment card",
);
assert.equal(merged[0].total, 64);
assert.equal(merged[1].total, 50);

// Split bill → separate After Treatment cards (main + guest), Add-Ons on after only.
const splitEvent = {
  id: "split-booking-1",
  title: "Cut",
  date: "2026-07-25",
  start: "10:00",
  end: "11:00",
  status: "In Progress",
  bookingCode: "BK-SPLIT",
  showClientName: "Sara Johnson",
  details: {
    showPrepayment: true,
    prepaymentPercent: "50",
    prepaymentStatus: "confirmed",
    paymentMethod: "onlineDirect",
    clientEmail: "sara@example.com",
    clientSnapshot: {
      people: [
        { id: "main", name: "Sara Johnson", isRequester: true },
        { id: "g1", name: "Guest", participantType: "guest" },
      ],
      services: [
        { id: "cut", name: "Scissor Cut", price: 20, guestId: null },
        { id: "blow1", name: "Blow Dry", price: 30, guestId: null },
        { id: "blow2", name: "Blow Dry", price: 30, guestId: "g1" },
      ],
    },
    splitBill: {
      mode: "split",
      prepaidAmount: 40,
      payers: [
        {
          key: "main",
          role: "main_client",
          label: "Sara Johnson",
          displayName: "Sara Johnson",
          subtotal: 50,
          paymentAmount: 10,
          lineIds: [],
          paid: true,
        },
        {
          key: "g1",
          role: "guest",
          label: "Guest",
          displayName: "Guest",
          subtotal: 30,
          paymentAmount: 30,
          lineIds: [],
          paid: false,
        },
      ],
    },
  },
} as unknown as CalendarEvent;

const splitCards = buildCardsForEvent({
  event: splitEvent,
  clientName: "Sara Johnson",
  clientEmail: "sara@example.com",
  ctx: { financeHints: [] },
});
const prepay = splitCards.filter((c) => c.kind === "prepayment");
const after = splitCards.filter((c) => c.kind === "after_treatment");
assert.equal(prepay.length, 1, "prepayment summary stays one card");
assert.equal(prepay[0]?.showAddOns, false, "no Add-Ons on prepayment");
assert.equal(after.length, 2, "main + guest each get After Treatment card");
assert.ok(after.every((c) => c.showAddOns), "Add-Ons on every after-treatment card");
assert.ok(after.every((c) => !c.subCards?.length), "guests are top-level, not nested subCards");
assert.equal(after[0]?.payerRole, "main_client");
assert.equal(after[1]?.payerRole, "guest");
assert.equal(after[1]?.payerLabel, "Guest");
assert.ok(
  after.every((c) => (c.highlightedLineIds?.length ?? 0) > 0),
  "dashed payer grouping via highlightedLineIds",
);

console.log("buildSalesOverviewCards.helpers.test.ts: all assertions passed");
