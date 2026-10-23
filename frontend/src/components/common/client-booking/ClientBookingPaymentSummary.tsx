"use client";

import { Box } from "@mui/material";
import BookingPaymentSummaryCard from "../booking-finance/BookingPaymentSummaryCard";
import type { BookingPaymentSummarySection } from "../booking-finance/bookingFinance.types";

type Props = {
  sections: BookingPaymentSummarySection[];
  onViewInvoice?: (lineId?: string) => void;
  onViewReceipt?: (lineId?: string) => void;
  onPayNow?: (lineId?: string) => void;
};

export default function ClientBookingPaymentSummary({
  sections,
  onViewInvoice,
  onViewReceipt,
  onPayNow,
}: Props) {
  if (!sections.length) return null;

  return (
    <Box sx={{ mt: 0 }}>
      <BookingPaymentSummaryCard
        sections={sections}
        onViewInvoice={onViewInvoice}
        onViewReceipt={onViewReceipt}
        onPayNow={onPayNow}
      />
    </Box>
  );
}
