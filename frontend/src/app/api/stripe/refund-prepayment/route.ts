import { NextResponse } from "next/server";
import { getStripe } from "../../../../lib/stripe/server";

export const dynamic = "force-dynamic";

const BOOKING_REF_RE = /^[A-Za-z0-9][A-Za-z0-9._:#-]{0,119}$/;
const MAX_AMOUNT_EUR = 50_000;

type RefundPrepaymentBody = {
  bookingRef?: unknown;
  amount?: unknown;
};

function reject(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

/**
 * Refund unused prepayment after cancellation fee is withheld.
 * Looks up the latest succeeded prepayment PaymentIntent for this bookingRef.
 */
export async function POST(request: Request) {
  try {
    let body: RefundPrepaymentBody;
    try {
      body = (await request.json()) as RefundPrepaymentBody;
    } catch {
      return reject("Invalid JSON body.");
    }

    if (typeof body.bookingRef !== "string" || !BOOKING_REF_RE.test(body.bookingRef.trim())) {
      return reject("bookingRef is required and must be 1–120 safe characters.");
    }
    const bookingRef = body.bookingRef.trim();

    if (typeof body.amount !== "number" || !Number.isFinite(body.amount)) {
      return reject("amount must be a finite number.");
    }
    if (body.amount <= 0 || body.amount > MAX_AMOUNT_EUR) {
      return reject(`amount must be between 0 and ${MAX_AMOUNT_EUR}.`);
    }

    const amountCents = Math.round(body.amount * 100);
    if (amountCents < 1) {
      return reject("Refund amount too small.");
    }

    const stripe = getStripe();
    const escapedRef = bookingRef.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    const search = await stripe.paymentIntents.search({
      query: `metadata['bookingRef']:'${escapedRef}' AND metadata['type']:'booking_prepayment' AND status:'succeeded'`,
      limit: 5,
    });

    const paymentIntent = search.data.find((pi) => (pi.amount_received ?? pi.amount ?? 0) > 0);
    if (!paymentIntent) {
      return NextResponse.json(
        { error: "No successful prepayment found to refund for this booking." },
        { status: 404 },
      );
    }

    const received = paymentIntent.amount_received ?? paymentIntent.amount ?? 0;
    // ponytail: PI search payload may include amount_refunded; Stripe typings omit it — widen if API drifts
    const alreadyRefunded = (paymentIntent as { amount_refunded?: number }).amount_refunded ?? 0;
    const refundable = received - alreadyRefunded;
    if (refundable <= 0) {
      return NextResponse.json({ error: "Prepayment has already been fully refunded." }, { status: 400 });
    }

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntent.id,
      amount: Math.min(amountCents, refundable),
      reason: "requested_by_customer",
      metadata: {
        bookingRef,
        type: "booking_cancellation_refund",
      },
    });

    return NextResponse.json({
      refundId: refund.id,
      amount: (refund.amount ?? 0) / 100,
      status: refund.status,
    });
  } catch (err) {
    console.error("[stripe/refund-prepayment]", err);
    return NextResponse.json({ error: "Refund failed." }, { status: 500 });
  }
}
