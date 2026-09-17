import { NextResponse } from "next/server";
import { getStripe } from "../../../../lib/stripe/server";

export const dynamic = "force-dynamic";

const PAYMENT_TYPES = ["booking_prepayment", "booking_cancellation_fee"] as const;
type PaymentIntentType = (typeof PAYMENT_TYPES)[number];

const BOOKING_REF_RE = /^[A-Za-z0-9][A-Za-z0-9._:#-]{0,119}$/;
const MAX_AMOUNT_EUR = 50_000;

type CreatePaymentIntentBody = {
  amount?: unknown;
  currency?: unknown;
  bookingRef?: unknown;
  type?: unknown;
};

function reject(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(request: Request) {
  try {
    let body: CreatePaymentIntentBody;
    try {
      body = (await request.json()) as CreatePaymentIntentBody;
    } catch {
      return reject("Invalid JSON body.");
    }

    if (typeof body.amount !== "number" || !Number.isFinite(body.amount)) {
      return reject("amount must be a finite number.");
    }
    if (body.amount <= 0 || body.amount > MAX_AMOUNT_EUR) {
      return reject(`amount must be between 0 and ${MAX_AMOUNT_EUR}.`);
    }

    const amountCents = Math.round(body.amount * 100);
    if (amountCents < 50) {
      return reject("Amount must be at least €0.50.");
    }

    if (typeof body.currency !== "string" || body.currency.toLowerCase() !== "eur") {
      return reject("currency must be eur.");
    }

    if (typeof body.bookingRef !== "string" || !BOOKING_REF_RE.test(body.bookingRef.trim())) {
      return reject("bookingRef is required and must be 1–120 safe characters.");
    }
    const bookingRef = body.bookingRef.trim();

    if (typeof body.type !== "string" || !PAYMENT_TYPES.includes(body.type as PaymentIntentType)) {
      return reject("type must be booking_prepayment or booking_cancellation_fee.");
    }
    const type = body.type as PaymentIntentType;

    const description =
      type === "booking_cancellation_fee"
        ? `Booking cancellation fee #${bookingRef}`
        : `Booking prepayment #${bookingRef}`;

    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "eur",
      automatic_payment_methods: { enabled: true },
      metadata: {
        bookingRef,
        type,
      },
      description,
    });

    if (!paymentIntent.client_secret) {
      return NextResponse.json({ error: "Could not create payment session." }, { status: 500 });
    }

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error("[stripe/create-payment-intent]", err);
    return NextResponse.json({ error: "Payment setup failed." }, { status: 500 });
  }
}
