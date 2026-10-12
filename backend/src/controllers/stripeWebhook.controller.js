import { logError } from "../utils/httpError.js";
import {
  applyLiveFeesToBookingFinance,
  fetchFeesForPaymentIntent,
  getStripeClient,
} from "../services/stripeFees.service.js";

/**
 * Stripe → finance fee pipeline.
 * payment_intent.succeeded: pull balance_transaction.fee (+ application_fee) and
 * write stripe_fee / mollure_fee / net_amount on matching Paid/Prepaid online rows.
 */
export const handleStripeWebhook = async (req, res) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripe = await getStripeClient();

  if (!stripe) {
    return res.status(503).json({ received: false, error: "stripe_not_configured" });
  }
  if (!webhookSecret) {
    // ponytail: unsigned ingest is unsafe — set STRIPE_WEBHOOK_SECRET in deploy.
    return res.status(503).json({ received: false, error: "webhook_secret_missing" });
  }

  let event;
  try {
    const signature = req.headers["stripe-signature"];
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (error) {
    logError("stripe.webhook.verify", error);
    return res.status(400).json({ received: false, error: "invalid_signature" });
  }

  try {
    if (
      event.type === "payment_intent.succeeded" ||
      event.type === "payment_intent.amount_capturable_updated"
    ) {
      const pi = event.data.object;
      const bookingRef = pi?.metadata?.bookingRef;
      if (bookingRef && pi?.id) {
        const live = await fetchFeesForPaymentIntent(pi.id, stripe);
        if (live.stripeFee != null || live.mollureFee != null) {
          await applyLiveFeesToBookingFinance({
            bookingRef,
            paymentIntentId: live.paymentIntentId,
            stripeFee: live.stripeFee,
            mollureFee: live.mollureFee,
            chargeId: live.chargeId,
            balanceTransactionId: live.balanceTransactionId,
          });
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    logError("stripe.webhook.handle", error);
    // Acknowledge to avoid Stripe retry storms on app bugs; fees can be backfilled.
    return res.status(200).json({ received: true, error: "handler_failed" });
  }
};
