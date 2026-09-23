"use client";

import { mollureLabelSx } from "../../../theme/mollureHierarchy";

import { Box, CircularProgress, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppButton from "../AppButton";
import BookingTotalPriceCard from "../calendar/BookingTotalPriceCard";
import type { BookingPriceSummaryLine } from "../calendar/BookingTotalPriceCard";

type Props = {
  displayTotal: number;
  originalPrice?: number | null;
  discountAmount?: number;
  lines: readonly BookingPriceSummaryLine[];
  showPrepayRow: boolean;
  prepaymentPercent: number;
  prepayAmount: number;
  remainingAfterPrepayment?: number;
  showPayNowAction: boolean;
  isPaying: boolean;
  onPayNow: () => void;
  isPrepaymentPaid: boolean;
  isDesired: boolean;
  isSubmitting: boolean;
  mustPayBeforeBooking: boolean;
  onSubmit: () => void;
};

export default function ClientBookingCreateSummaryCheckoutPanel({
  displayTotal,
  originalPrice,
  discountAmount,
  lines,
  showPrepayRow,
  prepaymentPercent,
  prepayAmount,
  remainingAfterPrepayment,
  showPayNowAction,
  isPaying,
  onPayNow,
  isPrepaymentPaid,
  isDesired,
  isSubmitting,
  mustPayBeforeBooking,
  onSubmit,
}: Props) {
  const m = useTheme().palette.mollure;

  return (
    <>
      <Box sx={{ px: 0, pt: 1.75 }}>
        <BookingTotalPriceCard
          totalPrice={displayTotal}
          originalPrice={originalPrice}
          discountAmount={discountAmount}
          lines={lines}
          prepaidPercent={showPrepayRow ? prepaymentPercent : undefined}
          prepaidAmount={showPrepayRow ? prepayAmount : 0}
          remainingAmount={
            showPrepayRow ? remainingAfterPrepayment : undefined
          }
          prepaidAction={
            showPayNowAction ? (
              <Typography
                component="button"
                type="button"
                onClick={() => void onPayNow()}
                disabled={isPaying}
                sx={mollureLabelSx(m.navy, {
                  border: "none",
                  outline: "none",
                  boxShadow: "none",
                  bgcolor: "transparent",
                  p: 0,
                  m: 0,
                  cursor: isPaying ? "wait" : "pointer",
                  color: m.teal,
                  fontWeight: 900,
                  fontFamily: "inherit",
                  opacity: isPaying ? 0.7 : 1,
                  appearance: "none",
                  WebkitAppearance: "none",
                  "&:hover": { color: m.tealDark },
                  "&:focus": { outline: "none" },
                  "&:focus-visible": {
                    outline: `2px solid ${alpha(m.teal, 0.45)}`,
                    outlineOffset: 2,
                  },
                })}
              >
                {isPaying ? "Preparing…" : "Pay Now"}
              </Typography>
            ) : showPrepayRow && isPrepaymentPaid ? (
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: 12,
                  color: m.teal,
                }}
              >
                Paid
              </Typography>
            ) : undefined
          }
        />
        {isDesired && showPrepayRow && !isPrepaymentPaid ? (
          <Typography
            sx={{
              mt: 0.85,
              fontWeight: 700,
              fontSize: 11.5,
              color: alpha(m.navy, 0.5),
            }}
          >
            You can Pay Now, or send the request and pay after the professional
            accepts.
          </Typography>
        ) : null}
      </Box>

      <AppButton
        tone="primary"
        fullWidth
        disabled={isSubmitting || mustPayBeforeBooking}
        onClick={() => void onSubmit()}
        sx={{ mt: 2.25, height: 44 }}
      >
        {isSubmitting ? (
          <>
            <CircularProgress size={18} sx={{ mr: 1, color: "inherit" }} />
            {isDesired ? "Saving…" : "Booking…"}
          </>
        ) : isDesired ? (
          "Save"
        ) : (
          "Book Now"
        )}
      </AppButton>

      {mustPayBeforeBooking ? (
        <Typography
          sx={{
            mt: 1,
            textAlign: "center",
            fontSize: 12,
            fontWeight: 700,
            color: alpha(m.navy, 0.5),
          }}
        >
          Complete prepayment with Pay Now to enable booking.
        </Typography>
      ) : null}
    </>
  );
}
