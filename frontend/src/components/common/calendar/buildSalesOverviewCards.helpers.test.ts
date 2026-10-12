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
import { hydrateSalesCardMetadata, upsertSalesCardMeta } from "./salesOverview.storage";
import {
  financeStatusToSalesPaymentState,
  salesPaymentBadge,
  type SalesAddonRecord,
  type SalesOverviewCardData,
  type SalesPaymentState,
} from "./salesOverview.types";

assert.equal(
  salesPaymentBadge("payment_due", "prepayment"),
  "Prepayment Due",
);
assert.equal(salesPaymentBadge("payment_due", "after_treatment"), "Payment Due");
assert.equal(salesPaymentBadge("payment_due"), "Payment Due");
assert.equal(salesPaymentBadge("voided"), "Voided");

// Finance status → Sales payment state (exact finance casing).
const financeStatusCases: Array<[string, SalesPaymentState | null, string?]> = [
  ["Paid", "paid"],
  ["Prepaid", "prepaid"],
  ["Pending", "pending"],
  ["Payment due", "payment_due"],
  ["Prepayment due", "payment_due"],
  ["Overdue", "overdue_invoice"],
  ["Overdue", "overdue", "prepayment"],
  ["Voided", "voided"],
  ["Void", "voided"],
  ["Refunded", "refunded"],
  ["Failed", "failed"],
  ["Unpaid", "unpaid"],
  ["unknown-xyz", null],
];
for (const [status, expected, kind] of financeStatusCases) {
  assert.equal(
    financeStatusToSalesPaymentState(status, kind as never),
    expected,
    `financeStatusToSalesPaymentState(${status})`,
  );
}

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

// Finance document.lineItems override calendar-derived lines (count sync).
const financeLineEvent = {
  id: "fin-sync-1",
  title: "Cut",
  date: "2026-07-25",
  start: "10:00",
  end: "11:00",
  status: "Completed",
  bookingCode: "BK-FIN",
  showClientName: "Ada",
  details: {
    paymentMethod: "onlineDirect",
    services: [
      { id: "s1", name: "Cut", price: 40 },
      { id: "s2", name: "Blow", price: 30 },
      { id: "s3", name: "Tone", price: 20 },
    ],
  },
} as unknown as CalendarEvent;

const calendarOnly = buildCardsForEvent({
  event: financeLineEvent,
  clientName: "Ada",
  ctx: { financeHints: [] },
});
const afterCalendar = calendarOnly.find((c) => c.kind === "after_treatment");
assert.equal(afterCalendar?.lines.length, 3, "calendar builds 3 service lines");

const financeSynced = buildCardsForEvent({
  event: financeLineEvent,
  clientName: "Ada",
  ctx: {
    financeHints: [
      {
        bookingId: "fin-sync-1",
        bookingCode: "BK-FIN",
        phase: "full",
        payerKey: "main-client",
        status: "Paid",
        lineItems: [
          { id: "s1", label: "Cut", amount: 40 },
          { id: "s2", label: "Blow", amount: 30 },
        ],
      },
    ],
  },
});
const afterFinance = financeSynced.find((c) => c.kind === "after_treatment");
assert.equal(
  afterFinance?.lines.length,
  2,
  "matched finance document.lineItems replace calendar lines",
);
assert.deepEqual(
  afterFinance?.lines.map((line) => line.id),
  ["s1", "s2"],
);

// Linked finance row is SSOT for status: booking would derive Payment Due /
// Pending, but matched finance statuses must win on the card badge.
const statusSyncEvent = {
  id: "status-sync-1",
  title: "Cut",
  date: "2026-07-25",
  start: "10:00",
  end: "11:00",
  status: "Completed",
  bookingCode: "BK-STATUS",
  showClientName: "Bea",
  details: {
    paymentMethod: "onlineDirect",
    bookingType: "online",
    services: [{ id: "s1", name: "Cut", price: 40 }],
  },
} as unknown as CalendarEvent;

const financeStatuses: Array<{
  status: string;
  badge: string;
  state: SalesPaymentState;
}> = [
  { status: "Paid", badge: "Paid", state: "paid" },
  { status: "Pending", badge: "Pending", state: "pending" },
  { status: "Payment due", badge: "Payment Due", state: "payment_due" },
  { status: "Overdue", badge: "!Overdue", state: "overdue_invoice" },
  { status: "Voided", badge: "Voided", state: "voided" },
  { status: "Refunded", badge: "Refunded", state: "refunded" },
];

const cardStatusCounts: Record<string, number> = {};
const financeStatusCounts: Record<string, number> = {};

for (const row of financeStatuses) {
  const cards = buildCardsForEvent({
    event: statusSyncEvent,
    clientName: "Bea",
    ctx: {
      financeHints: [
        {
          transactionId: `tx-${row.status}`,
          bookingId: "status-sync-1",
          bookingCode: "BK-STATUS",
          phase: "full",
          status: row.status,
          lineItems: [{ id: "s1", label: "Cut", amount: 40 }],
        },
      ],
    },
  });
  const after = cards.find((c) => c.kind === "after_treatment");
  assert.equal(after?.statusBadge, row.badge, `badge for finance ${row.status}`);
  assert.equal(after?.paymentState, row.state, `state for finance ${row.status}`);
  assert.equal(
    after?.financeTransactionId,
    `tx-${row.status}`,
    `financeTransactionId stamped for ${row.status}`,
  );
  cardStatusCounts[row.badge] = (cardStatusCounts[row.badge] ?? 0) + 1;
  financeStatusCounts[row.status] = (financeStatusCounts[row.status] ?? 0) + 1;
}

assert.equal(
  Object.values(cardStatusCounts).reduce((a, b) => a + b, 0),
  Object.values(financeStatusCounts).reduce((a, b) => a + b, 0),
  "card badge count matches finance row count for linked pairs",
);
assert.deepEqual(
  Object.keys(cardStatusCounts).sort(),
  ["!Overdue", "Paid", "Payment Due", "Pending", "Refunded", "Voided"],
);

// Linked finance payment_deadline wins over stale sales-card meta dueDate
// (status stays server Payment due — do not invent Overdue from meta clock).
hydrateSalesCardMetadata([]);
upsertSalesCardMeta({
  bookingId: "status-sync-1",
  cardKind: "after_treatment",
  cardId: "status-sync-1-after-treatment",
  dueDate: "2020-01-01",
  paymentMethod: "offlineNonDirect",
});
{
  const cards = buildCardsForEvent({
    event: {
      ...statusSyncEvent,
      details: {
        ...statusSyncEvent.details,
        paymentMethod: "offlineNonDirect",
      },
    } as unknown as CalendarEvent,
    clientName: "Bea",
    ctx: {
      financeHints: [
        {
          transactionId: "tx-deadline-ssot",
          bookingId: "status-sync-1",
          bookingCode: "BK-STATUS",
          phase: "full",
          status: "Payment due",
          dueDate: "2026-12-31",
          lineItems: [{ id: "s1", label: "Cut", amount: 40 }],
        },
      ],
    },
  });
  const after = cards.find((c) => c.kind === "after_treatment");
  assert.equal(after?.paymentState, "payment_due");
  assert.equal(after?.statusBadge, "Payment Due");
  assert.equal(after?.dueDate, "2026-12-31");
}
hydrateSalesCardMetadata([]);

console.log("buildSalesOverviewCards.helpers.test.ts: all assertions passed");
