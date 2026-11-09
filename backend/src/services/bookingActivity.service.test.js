import assert from "node:assert/strict";
import { registerHooks } from "node:module";

// Isolate event persistence and sockets; these checks never connect to a database.
const events = new Map();
const ledger = [];
const emitted = [];
const booking = {
  id: "11111111-1111-4111-8111-111111111111",
  unique_code: "BK-ACTIVITY",
  customer_id: "22222222-2222-4222-8222-222222222222",
  business_setup_id: "33333333-3333-4333-8333-333333333333",
  status: "confirmed",
  prepayment_status: "paid",
  start_time: "2026-11-03T09:15:00.000Z",
  end_time: "2026-11-03T10:15:00.000Z",
};
globalThis.__activityTestEmit = (value) => emitted.push(value);
globalThis.__activityTestQuery = async (sql, params) => {
  if (sql.includes("INSERT INTO booking_activity_events")) {
    assert.ok(sql.includes("ON CONFLICT (id) DO NOTHING"), "retries must be conflict-safe");
    const [booking_id, booking_code, kind, action_type, title, actor, user_id, actor_label, subtitle, payload, occurred_at, key] = params;
    if (key && events.has(key)) return { rows: [] };
    const event = { id: key || `event-${events.size}`, booking_id, booking_code, kind, action_type, title, actor, user_id, actor_label, subtitle, payload: JSON.parse(payload), occurred_at };
    events.set(event.id, event);
    return { rows: [event] };
  }
  if (sql.includes("SELECT b.*, ft.method_title")) {
    return { rows: [{ ...booking, method_title: "Online - Direct", method_detail: "Card", finance_status: params[1] === "finance-stale-pending" ? "Pending" : "Paid", payer_name: params[1] === "finance-guest" ? "Guest Sam" : "Client Ali" }] };
  }
  if (sql.includes("SELECT * FROM bookings")) return { rows: [booking] };
  if (sql.includes("SELECT t.* FROM transactions")) {
    return { rows: ledger.filter((row) => row.type === "PAYMENT" && row.status === "completed" && !events.has(`booking-payment:${row.id}`)) };
  }
  if (sql.includes("FROM booking_activity_events")) return { rows: [...events.values()] };
  if (sql.includes("SELECT * FROM transactions")) {
    return { rows: ledger.filter((row) => row.finance_transaction_id === params[0] && row.type === params[1] && row.status !== "voided") };
  }
  if (sql.includes("INSERT INTO transactions")) {
    const [booking_id, client_id, professional_profile_id, finance_transaction_id, type, amount, status, metadata] = params;
    const row = { id: `ledger-${ledger.length}`, booking_id, client_id, professional_profile_id, finance_transaction_id, type, amount, status, metadata: JSON.parse(metadata), created_at: "2026-11-03T10:30:00.000Z" };
    ledger.push(row);
    return { rows: [row] };
  }
  throw new Error(`Unexpected test query: ${sql}`);
};
const hooks = registerHooks({
  load(url, context, nextLoad) {
    if (url === new URL("../db/index.js", import.meta.url).href) {
      return { format: "module", shortCircuit: true, source: "export const query = (...args) => globalThis.__activityTestQuery(...args);" };
    }
    if (url === new URL("../messaging/messagingSocket.js", import.meta.url).href) {
      return { format: "module", shortCircuit: true, source: "export const emitBookingChanged = (...args) => globalThis.__activityTestEmit(...args);" };
    }
    return nextLoad(url, context);
  },
});

try {
  const { logBookingStatusActivity, logScheduledBookingStatusActivity, listBookingActivityEvents } = await import("./bookingActivity.service.js");
  const { appendLedgerTransaction, mirrorSettledFinanceToLedger } = await import("./bookingTransactionLedger.service.js");
  await logScheduledBookingStatusActivity(booking, { now: new Date("2026-11-03T09:14:59Z") });
  assert.equal(events.size, 0, "no lifecycle events before service starts");
  await logScheduledBookingStatusActivity(booking, { now: new Date(booking.start_time) });
  assert.equal(events.size, 1);
  assert.equal([...events.values()][0].kind, "booking_in_progress");
  assert.equal([...events.values()][0].occurred_at, booking.start_time);
  await logScheduledBookingStatusActivity(booking, { now: new Date("2026-11-03T10:14:59Z") });
  assert.equal(events.size, 1, "Completed cannot appear during service");
  await logScheduledBookingStatusActivity(booking, { now: new Date(booking.end_time) });
  assert.equal(events.size, 2);
  assert.equal([...events.values()][1].kind, "booking_completed");
  assert.equal([...events.values()][1].occurred_at, booking.end_time);
  await logScheduledBookingStatusActivity(booking, { now: new Date(booking.end_time) });
  await logBookingStatusActivity({ ...booking, status: "completed" }, { previousStatus: "in_progress", previousPrepayment: "paid", actor: "professional" });
  await logScheduledBookingStatusActivity({ ...booking, status: "cancelled" });
  assert.equal(events.size, 2, "polling and manual completion cannot duplicate scheduled transitions");
  assert.ok(![...events.values()].some((row) => row.kind === "post_booking_paid"), "a completed service is not a payment");

  const paymentInput = { bookingId: booking.id, financeTransactionId: "finance-main", type: "PAYMENT", amount: 70.4, status: "completed", skipBalanceGuards: true };
  const main = await appendLedgerTransaction(paymentInput);
  assert.equal(events.size, 3);
  const paid = events.get(`booking-payment:${main.id}`);
  assert.equal(paid.title, "Client paid remaining portion");
  assert.equal(paid.payload.amount, 70.4);
  assert.equal(paid.occurred_at, main.created_at);
  assert.equal(paid.actor, "client");
  assert.ok(paid.subtitle.includes("70.40 EUR"));
  await appendLedgerTransaction(paymentInput);
  await mirrorSettledFinanceToLedger({ bookingId: booking.id, financeTransactionId: "finance-main", status: "Paid", amount: 70.4 });
  assert.equal(events.size, 3, "payment retries and ledger reconciliation create only one activity");
  await mirrorSettledFinanceToLedger({ bookingId: booking.id, financeTransactionId: "finance-pending", status: "Pending", amount: 50 });
  assert.equal(events.size, 3, "pending payment must not produce a paid activity");
  await appendLedgerTransaction({ ...paymentInput, financeTransactionId: "finance-guest", amount: 32.8, metadata: { payerKey: "guest-1", payerRole: "guest" } });
  assert.equal(events.size, 4);
  assert.equal([...events.values()][3].title, "Guest paid their portion");
  assert.equal([...events.values()][3].actor_label, "Guest Sam");
  await appendLedgerTransaction({ ...paymentInput, financeTransactionId: "finance-prepay", type: "PREPAYMENT" });
  await appendLedgerTransaction({ ...paymentInput, financeTransactionId: "finance-addon", metadata: { settlesAddon: true } });
  await appendLedgerTransaction({ ...paymentInput, financeTransactionId: "finance-stale-pending" });
  assert.equal(events.size, 4, "prepayment and add-on logs must not be mislabeled as remaining payments");

  events.delete(`booking-payment:${main.id}`);
  const restored = await listBookingActivityEvents({ bookingId: booking.id });
  assert.equal(restored.filter((row) => row.kind === "post_booking_paid").length, 2, "historical ledger payments are repaired without inventing payments");
  assert.ok(emitted.length > 0, "new payment logs notify open activity views");
  console.log("bookingActivity.service.test.js: ok");
} finally {
  hooks.deregister();
  delete globalThis.__activityTestQuery;
  delete globalThis.__activityTestEmit;
}
