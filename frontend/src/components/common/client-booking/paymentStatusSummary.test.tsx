import assert from "node:assert/strict";
import type { ReactNode } from "react";
import { ThemeProvider } from "@mui/material/styles";
import theme from "../../../theme/theme";
import BookingRequestStatusRow from "./BookingRequestStatusRow";
import BookingTotalPriceCard from "../calendar/BookingTotalPriceCard";
import BookingPriceBreakdown from "../booking-finance/BookingPriceBreakdown";

const { renderToStaticMarkup } = require("react-dom/server") as {
  renderToStaticMarkup(node: ReactNode): string;
};

function status(paymentConfirmed: boolean, paymentDue = false) {
  return renderToStaticMarkup(
    <ThemeProvider theme={theme}>
      <BookingRequestStatusRow
        bookingStatus="completed"
        prepaymentPaid
        paymentConfirmed={paymentConfirmed}
        paymentDue={paymentDue}
      />
    </ThemeProvider>,
  );
}
for (const pending of [status(false), status(false, true), status(true, true)]) {
  assert.ok(pending.includes('aria-label="Waiting for payment"'));
  assert.ok(!pending.includes('aria-label="Paid"'));
}
const settled = status(true);
assert.ok(settled.includes('aria-label="Paid"'));
assert.ok(!settled.includes('aria-label="Waiting for payment"'));

for (const Component of [BookingTotalPriceCard, BookingPriceBreakdown]) {
  for (const totalPrice of [88, 70.4]) {
    const html = renderToStaticMarkup(
      <ThemeProvider theme={theme}>
        <Component
          totalPrice={totalPrice}
          originalPrice={100}
          prepaidPercent={20}
          prepaidAmount={17.6}
          remainingAmount={70.4}
        />
      </ThemeProvider>,
    );
    assert.ok(html.includes("Remaining (80%)"));
    assert.ok(/17[.,]60/.test(html), "prepaid amount remains visible");
    assert.ok(/70[.,]40/.test(html), "remaining amount remains visible even when it equals the displayed total");
    assert.ok(!html.includes("line-through"));
  }
}
console.log("paymentStatusSummary.test.tsx: ok");
