"use client";

import AppButton from "../AppButton";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { Stack } from "@mui/material";
import BookingTotalPriceCard, {
  type BookingPriceSummaryLine,
} from "./BookingTotalPriceCard";

type BookingRequestAcceptedPanelProps = {
  totalPrice: number;
  originalPrice?: number | null;
  prepaymentPercent?: number;
  prepaymentAmount: number;
  remainingAmount: number;
  lines?: readonly BookingPriceSummaryLine[];
  discountAmount?: number;
  onOk: () => void;
};

export default function BookingRequestAcceptedPanel({
  totalPrice,
  originalPrice,
  prepaymentPercent,
  prepaymentAmount,
  remainingAmount,
  lines,
  discountAmount,
  onOk,
}: BookingRequestAcceptedPanelProps) {
  return (
    <Stack spacing={1.25}>
      <BookingTotalPriceCard
        totalPrice={totalPrice}
        originalPrice={originalPrice}
        prepaidPercent={prepaymentPercent}
        prepaidAmount={prepaymentAmount}
        remainingAmount={remainingAmount}
        lines={lines}
        discountAmount={discountAmount}
      />

      <AppButton
        tone="primary"
        fullWidth
        startIcon={<CheckRoundedIcon />}
        onClick={onOk}
        sx={{
          fontSize: 14,
          py: 1.25,
        }}
      >
        Ok
      </AppButton>
    </Stack>
  );
}
