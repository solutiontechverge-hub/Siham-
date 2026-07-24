"use client";

import AppButton from "../AppButton";
import * as React from "react";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type { StripeElementsOptions } from "@stripe/stripe-js";
import { getStripeJs } from "../../../lib/stripe/client";
import AppModal from "../AppModal";

type Props = {
  open: boolean;
  amount: number;
  bookingRef: string;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  subtitlePrefix?: string;
  paymentType?: "booking_prepayment" | "booking_cancellation_fee";
};

function PaymentForm({
  amount,
  bookingRef,
  onClose,
  onSuccess,
}: {
  amount: number;
  bookingRef: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const m = useTheme().palette.mollure;
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setErrorMessage(null);

    const returnUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/clients/booking/checkout/prepaid?payment=success&ref=${encodeURIComponent(bookingRef)}`
        : undefined;

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: returnUrl ? { return_url: returnUrl } : {},
      redirect: "if_required",
    });

    setSubmitting(false);

    if (error) {
      setErrorMessage(error.message ?? "Payment could not be completed.");
      return;
    }

    onSuccess();
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />
      {errorMessage ? (
        <Typography
          sx={{ mt: 1.5, fontSize: 12.5, fontWeight: 700, color: "#C62828" }}
        >
          {errorMessage}
        </Typography>
      ) : null}
      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        <AppButton
          type="button"
          variant="outlined"
          onClick={onClose}
          disabled={submitting}
          sx={{
            flex: 1,
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 800,
          }}
        >
          Cancel
        </AppButton>
        <AppButton
          tone="primary"
          type="submit"
          disabled={!stripe || !elements || submitting}
          sx={{
            flex: 1.4,
          }}
        >
          {submitting ? "Processing…" : `Pay €${amount.toFixed(2)}`}
        </AppButton>
      </Stack>
    </Box>
  );
}

export default function StripePrepaymentDialog({
  open,
  amount,
  bookingRef,
  onClose,
  onSuccess,
  title = "Pay prepayment",
  subtitlePrefix = "Secure payment for booking",
  paymentType = "booking_prepayment",
}: Props) {
  const m = useTheme().palette.mollure;
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [setupError, setSetupError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setClientSecret(null);
      setSetupError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setSetupError(null);
    setClientSecret(null);

    fetch("/api/stripe/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        currency: "eur",
        bookingRef,
        type: paymentType,
      }),
    })
      .then(async (res) => {
        const data = (await res.json()) as {
          clientSecret?: string;
          error?: string;
        };
        if (!res.ok) {
          throw new Error(data.error ?? "Could not start payment.");
        }
        if (!data.clientSecret) {
          throw new Error("Missing payment session.");
        }
        if (!cancelled) setClientSecret(data.clientSecret);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setSetupError(
            err instanceof Error ? err.message : "Could not start payment.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, amount, bookingRef, paymentType]);

  const elementsOptions: StripeElementsOptions | undefined = clientSecret
    ? {
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: m.teal,
            borderRadius: "10px",
          },
        },
      }
    : undefined;

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={title}
      subtitle={`${subtitlePrefix} #${bookingRef} · €${amount.toFixed(2)}`}
      maxWidth="sm"
      contentSx={{ px: 2.5, pt: 1.5, pb: 2.5 }}
    >
      {loading ? (
        <Stack alignItems="center" py={4}>
          <CircularProgress size={32} sx={{ color: m.teal }} />
        </Stack>
      ) : setupError ? (
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#C62828" }}>
          {setupError}
        </Typography>
      ) : clientSecret && elementsOptions ? (
        <Elements stripe={getStripeJs()} options={elementsOptions}>
          <PaymentForm
            amount={amount}
            bookingRef={bookingRef}
            onClose={onClose}
            onSuccess={onSuccess}
          />
        </Elements>
      ) : null}
    </AppModal>
  );
}
