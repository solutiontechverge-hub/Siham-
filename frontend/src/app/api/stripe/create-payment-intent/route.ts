import { NextResponse } from "next/server";
import { getStripe } from "../../../../lib/stripe/server";

export const dynamic = "force-dynamic";

type CreatePaymentIntentBody = {
  amount?: number;
  currency?: string;
  bookingRef?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreatePaymentIntentBody;
    const amountEur = typeof body.amount === "number" ? body.amount : Number(body.amount);

    if (!Number.isFinite(amountEur) || amountEur <= 0) {
      return NextResponse.json({ error: "Invalid payment amount." }, { status: 400 });
    }

    const amountCents = Math.round(amountEur * 100);
    if (amountCents < 50) {
      return NextResponse.json({ error: "Amount must be at least €0.50." }, { status: 400 });
    }

    const currency = (body.currency ?? "eur").toLowerCase();
    const bookingRef = body.bookingRef?.trim() || "booking";

    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        bookingRef,
        type: "booking_prepayment",
      },
      description: `Booking prepayment #${bookingRef}`,
    });

    if (!paymentIntent.client_secret) {
      return NextResponse.json({ error: "Could not create payment session." }, { status: 500 });
    }

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Payment setup failed.";
    console.error("[stripe/create-payment-intent]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
