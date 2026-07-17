import { NextResponse } from "next/server";
import { getStripe } from "../../../../lib/stripe/server";

export const dynamic = "force-dynamic";

type RefundPrepaymentBody = {
  bookingRef?: string;
  amount?: number;
};

/**
 * Refund unused prepayment after cancellation fee is withheld.
 * Looks up the latest succeeded prepayment PaymentIntent for this bookingRef.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RefundPrepaymentBody;
    const bookingRef = body.bookingRef?.trim();
    const amountEur = typeof body.amount === "number" ? body.amount : Number(body.amount);

    if (!bookingRef) {
      return NextResponse.json({ error: "Missing booking reference." }, { status: 400 });
    }
    if (!Number.isFinite(amountEur) || amountEur <= 0) {
      return NextResponse.json({ error: "Invalid refund amount." }, { status: 400 });
    }

    const amountCents = Math.round(amountEur * 100);
    if (amountCents < 1) {
      return NextResponse.json({ error: "Refund amount too small." }, { status: 400 });
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
    const message = err instanceof Error ? err.message : "Refund failed.";
    console.error("[stripe/refund-prepayment]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
