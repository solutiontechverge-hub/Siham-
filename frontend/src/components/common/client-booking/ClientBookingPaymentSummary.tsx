"use client";

import { Box } from "@mui/material";
import BookingPaymentSummaryCard from "../booking-finance/BookingPaymentSummaryCard";
import type { BookingPaymentSummarySection } from "../booking-finance/bookingFinance.types";

type Props = {
  sections: BookingPaymentSummarySection[];
  headerTotal: number;
  onViewInvoice?: (lineId?: string) => void;
  onViewReceipt?: (lineId?: string) => void;
  onPayNow?: (lineId?: string) => void;
};

export default function ClientBookingPaymentSummary({
  sections,
  headerTotal,
  onViewInvoice,
  onViewReceipt,
  onPayNow,
}: Props) {
  if (!sections.length) return null;

  return (
    <Box sx={{ mt: 0 }}>
      <BookingPaymentSummaryCard
        headerTotal={headerTotal}
        sections={sections}
        onViewInvoice={onViewInvoice}
        onViewReceipt={onViewReceipt}
        onPayNow={onPayNow}
      />
    </Box>
  );
}
