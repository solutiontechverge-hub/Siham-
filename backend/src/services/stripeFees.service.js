import { query } from "../db/index.js";
import {
  computeFinanceFees,
  feeMajorFromBalanceTransaction,
} from "../utils/financeFees.js";
import { normalizeMoneyJson, roundMoney } from "../utils/money.js";

const STRIPE_API_VERSION = "2024-11-20.acacia";

export async function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  const Stripe = (await import("stripe")).default;
  return new Stripe(key, { apiVersion: STRIPE_API_VERSION });
}

/**
 * Resolve Stripe processing fee (+ optional Connect application fee) for a PaymentIntent.
 * Returns major-unit amounts in the PaymentIntent currency, or nulls when unavailable.
 */
export async function fetchFeesForPaymentIntent(paymentIntentId, stripeClient = null) {
  const stripe = stripeClient || (await getStripeClient());
  if (!stripe || !paymentIntentId) {
    return {
      stripeFee: null,
      mollureFee: null,
      currency: null,
      chargeId: null,
      balanceTransactionId: null,
      paymentIntentId: paymentIntentId || null,
    };
  }

  const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ["latest_charge.balance_transaction"],
  });
  const currency = String(pi.currency || "eur").toLowerCase();
  const charge =
    pi.latest_charge && typeof pi.latest_charge === "object" ? pi.latest_charge : null;
  const bt =
    charge?.balance_transaction && typeof charge.balance_transaction === "object"
      ? charge.balance_transaction
      : null;

  const stripeFee = feeMajorFromBalanceTransaction(bt, currency);
  const mollureFee =
    pi.application_fee_amount != null && Number.isFinite(pi.application_fee_amount)
      ? roundMoney(pi.application_fee_amount / 100)
      : null;

  return {
    stripeFee,
    mollureFee,
    currency,
    chargeId: charge?.id ?? (typeof pi.latest_charge === "string" ? pi.latest_charge : null),
    balanceTransactionId: bt?.id ?? null,
    paymentIntentId: pi.id,
    bookingRef: pi.metadata?.bookingRef || null,
    amount: roundMoney((pi.amount_received || pi.amount || 0) / 100),
  };
}

/**
 * Write live Stripe / Mollure fees onto settled online finance rows for a bookingRef.
 * Leaves offline / voided / refunded rows alone.
 */
export async function applyLiveFeesToBookingFinance({
  bookingRef,
  paymentIntentId,
  stripeFee,
  mollureFee,
  chargeId = null,
  balanceTransactionId = null,
}) {
  const ref = String(bookingRef || "").trim();
  if (!ref) return { updated: 0, rows: [] };

  const existing = await query(
    `SELECT id, gross_amount, status, method_title, document
     FROM finance_transactions
     WHERE booking_id = $1
       AND status IN ('Paid', 'Prepaid')
       AND method_title ILIKE 'Online%'
     ORDER BY updated_at DESC NULLS LAST`,
    [ref],
  );

  const updated = [];
  for (const row of existing.rows) {
    const fees = computeFinanceFees(row.gross_amount, {
      isOnline: true,
      stripeFee,
      mollureFee,
    });
    const prevDoc =
      row.document && typeof row.document === "object" ? row.document : {};
    const nextDoc = {
      ...prevDoc,
      stripe: {
        ...(prevDoc.stripe && typeof prevDoc.stripe === "object" ? prevDoc.stripe : {}),
        paymentIntentId: paymentIntentId || null,
        chargeId,
        balanceTransactionId,
        feeSource: fees.source,
        stripeFee: fees.stripeFee,
        mollureFee: fees.mollureFee,
        updatedAt: new Date().toISOString(),
      },
    };

    await query(
      `UPDATE finance_transactions
       SET stripe_fee = $2,
           mollure_fee = $3,
           net_amount = $4,
           document = $5::jsonb,
           updated_at = NOW()
       WHERE id = $1`,
      [
        row.id,
        fees.stripeFee,
        fees.mollureFee,
        fees.net,
        JSON.stringify(normalizeMoneyJson(nextDoc)),
      ],
    );
    updated.push({
      id: row.id,
      gross: roundMoney(row.gross_amount),
      ...fees,
    });
  }

  return { updated: updated.length, rows: updated };
}
