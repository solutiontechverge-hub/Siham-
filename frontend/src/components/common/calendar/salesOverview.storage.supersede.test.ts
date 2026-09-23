/**
 * Run with: npx --yes tsx src/components/common/calendar/salesOverview.storage.supersede.test.ts
 */
import {
  getSalesCardMeta,
  resolveLiveCardId,
  supersedeOpenSalesCardsForBooking,
  upsertSalesCardMeta,
} from "./salesOverview.storage";

const bookingId = "booking-supersede-test";

const mem = new Map<string, string>();
(globalThis as { window?: Window }).window = {
  localStorage: {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => {
      mem.set(k, v);
    },
    removeItem: (k: string) => {
      mem.delete(k);
    },
  },
  dispatchEvent: () => true,
} as unknown as Window;

mem.clear();

upsertSalesCardMeta({
  bookingId,
  cardId: `${bookingId}-prepayment`,
  cardKind: "prepayment",
  totalPrice: 50,
  editedLines: [
    {
      id: "1",
      kind: "product",
      name: "Old",
      quantity: 1,
      unitPrice: 50,
    },
  ],
});

supersedeOpenSalesCardsForBooking(bookingId);

const old = getSalesCardMeta(`${bookingId}-prepayment`);
if (!old?.canceled) throw new Error("expected old prepayment meta canceled");

const live = resolveLiveCardId(bookingId, `${bookingId}-prepayment`);
if (live !== `${bookingId}-prepayment-v1`) {
  throw new Error(`expected -v1 live id, got ${live}`);
}

mem.clear();
upsertSalesCardMeta({
  bookingId,
  cardId: `${bookingId}-prepayment`,
  cardKind: "prepayment",
  paidAt: "2026-01-01",
  totalPrice: 50,
});
const beforePaid = resolveLiveCardId(bookingId, `${bookingId}-prepayment`);
supersedeOpenSalesCardsForBooking(bookingId);
const afterPaid = resolveLiveCardId(bookingId, `${bookingId}-prepayment`);
if (beforePaid !== afterPaid) {
  throw new Error("must not supersede paid/prepaid cards");
}
if (getSalesCardMeta(`${bookingId}-prepayment`)?.canceled) {
  throw new Error("paid card meta must stay uncanceled");
}

console.log("salesOverview.storage.supersede.test.ts: all assertions passed");
