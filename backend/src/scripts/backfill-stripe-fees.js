/**
 * Attempt to replace estimate stripe_fee/mollure_fee with live Stripe
 * balance_transaction fees for Paid/Prepaid online rows whose booking_id
 * matches a succeeded PaymentIntent metadata.bookingRef.
 *
 * Run: node src/scripts/backfill-stripe-fees.js
 */
import "../bootstrap-env.js";
import {
  applyLiveFeesToBookingFinance,
  fetchFeesForPaymentIntent,
  getStripeClient,
} from "../services/stripeFees.service.js";
import { query } from "../db/index.js";

const stripe = await getStripeClient();
if (!stripe) {
  console.error("STRIPE_SECRET_KEY missing — abort");
  process.exit(1);
}

const candidates = await query(`
  SELECT COUNT(*)::int AS n
  FROM finance_transactions
  WHERE status IN ('Paid', 'Prepaid')
    AND method_title ILIKE 'Online%'
    AND stripe_fee IS NOT NULL
    AND gross_amount > 0
`);
console.log("candidate_online_settled_rows", candidates.rows[0].n);

let starting_after;
const withRef = [];
for (let page = 0; page < 20; page++) {
  const list = await stripe.paymentIntents.list({
    limit: 100,
    ...(starting_after ? { starting_after } : {}),
  });
  for (const pi of list.data) {
    if (pi.status === "succeeded" && pi.metadata?.bookingRef) {
      withRef.push(pi);
    }
  }
  if (!list.has_more || !list.data.length) break;
  starting_after = list.data[list.data.length - 1].id;
}

console.log("succeeded_pis_with_bookingRef", withRef.length);

let updatedTotal = 0;
const samples = [];
for (const pi of withRef) {
  const live = await fetchFeesForPaymentIntent(pi.id, stripe);
  const result = await applyLiveFeesToBookingFinance({
    bookingRef: pi.metadata.bookingRef,
    paymentIntentId: live.paymentIntentId,
    stripeFee: live.stripeFee,
    mollureFee: live.mollureFee,
    chargeId: live.chargeId,
    balanceTransactionId: live.balanceTransactionId,
  });
  updatedTotal += result.updated;
  if (result.updated && samples.length < 5) {
    samples.push({ bookingRef: pi.metadata.bookingRef, ...result });
  }
}

console.log("rows_updated_with_live_fees", updatedTotal);
console.log("samples", JSON.stringify(samples, null, 2));
process.exit(0);
