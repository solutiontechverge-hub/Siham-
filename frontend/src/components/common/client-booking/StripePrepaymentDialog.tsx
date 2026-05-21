"use client";

import * as React from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import type { StripeElementsOptions } from "@stripe/stripe-js";
import { getStripeJs } from "../../../lib/stripe/client";

type Props = {
  open: boolean;
  amount: number;
  bookingRef: string;
  onClose: () => void;
  onSuccess: () => void;
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
        <Typography sx={{ mt: 1.5, fontSize: 12.5, fontWeight: 700, color: "#C62828" }}>{errorMessage}</Typography>
      ) : null}
      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        <Button
          type="button"
          variant="outlined"
          onClick={onClose}
          disabled={submitting}
          sx={{ flex: 1, borderRadius: "10px", textTransform: "none", fontWeight: 800 }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disableElevation
          disabled={!stripe || !elements || submitting}
          sx={{
            flex: 1.4,
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 900,
            bgcolor: m.teal,
            "&:hover": { bgcolor: m.tealDark },
          }}
        >
          {submitting ? "Processing…" : `Pay €${amount.toFixed(2)}`}
        </Button>
      </Stack>
    </Box>
  );
}

export default function StripePrepaymentDialog({ open, amount, bookingRef, onClose, onSuccess }: Props) {
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
      }),
    })
      .then(async (res) => {
        const data = (await res.json()) as { clientSecret?: string; error?: string };
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
          setSetupError(err instanceof Error ? err.message : "Could not start payment.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, amount, bookingRef]);

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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: "14px" } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontWeight: 900,
          fontSize: 16,
          color: alpha(m.navy, 0.88),
          pr: 1,
        }}
      >
        Pay prepayment
        <IconButton aria-label="Close" onClick={onClose} size="small" disabled={loading}>
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 0, pb: 2.5 }}>
        <Typography sx={{ mb: 2, fontSize: 13, fontWeight: 700, color: alpha(m.navy, 0.55) }}>
          Secure payment for booking #{bookingRef} · €{amount.toFixed(2)}
        </Typography>

        {loading ? (
          <Stack alignItems="center" py={4}>
            <CircularProgress size={32} sx={{ color: m.teal }} />
          </Stack>
        ) : setupError ? (
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#C62828" }}>{setupError}</Typography>
        ) : clientSecret && elementsOptions ? (
          <Elements stripe={getStripeJs()} options={elementsOptions}>
            <PaymentForm amount={amount} bookingRef={bookingRef} onClose={onClose} onSuccess={onSuccess} />
          </Elements>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
