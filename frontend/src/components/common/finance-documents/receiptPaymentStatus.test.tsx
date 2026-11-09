import assert from "node:assert/strict";
import type { ReactNode } from "react";
import { ThemeProvider } from "@mui/material/styles";
import theme from "../../../theme/theme";
import type { TransactionRow } from "../../../app/professionals/fixed-location/finance/data/transactions";
import { AppSnackbarProvider } from "../AppSnackbar";
import FinanceReceiptPreview from "./FinanceReceiptPreview";
import {
  displayReceiptNumber,
  receiptPaymentStatus,
  withLiveTransactionPaymentState,
} from "./financeDocumentUtils";

const { renderToStaticMarkup } = require("react-dom/server") as {
  renderToStaticMarkup(node: ReactNode): string;
};

const pending: TransactionRow = {
  id: "tx-main",
  bookingId: "booking-1",
  entryType: "onlineBooking",
  entryId: "BK-1",
  entryLabel: "After treatment · Main Client",
  date: "2026-11-03",
  clientName: "Client",
  clientEmail: "client@example.com",
  clientType: "mollure",
  netAmount: 103.2,
  methodTitle: "Online - Direct",
  methodDetail: "Card",
  status: "Pending",
  issuedDocument: {
    serviceDate: "2026-11-03",
    invoiceDate: "2026-11-03",
    dueDate: "2026-11-03",
    documentNumber: "INV-1-AT",
    paymentPhase: "full",
    payerKey: "main-client",
    totalPrice: 103.2,
    lineItems: [{ description: "Main client service", quantity: 1, vat: "0%", pricePerUnit: 103.2, totalPrice: 103.2 }],
  },
};
const paid: TransactionRow = {
  ...pending,
  status: "Paid",
  issuedDocument: {
    ...pending.issuedDocument!,
    receiptNumber: "RCP-1",
    paidAmount: 103.2,
    lineItems: [{ description: "Full booking services", quantity: 1, vat: "0%", pricePerUnit: 200, totalPrice: 200 }],
  },
};

assert.equal(receiptPaymentStatus("Prepaid"), "Paid");
assert.equal(receiptPaymentStatus("Completed"), "Paid");
assert.equal(receiptPaymentStatus("Pending"), "Pending");
assert.equal(receiptPaymentStatus("Failed"), "Failed");
assert.equal(receiptPaymentStatus("Refunded"), "Refunded");
assert.equal(receiptPaymentStatus(null), "Pending");
assert.equal(withLiveTransactionPaymentState(pending, [{ ...paid, id: "tx-guest" }]), pending, "another payer's payment must not settle this receipt");
assert.equal(withLiveTransactionPaymentState(pending, []), pending);

for (const transaction of [pending, paid]) {
  const refreshed = withLiveTransactionPaymentState(pending, [transaction])!;
  assert.equal(refreshed.status, transaction.status);
  assert.deepEqual(refreshed.issuedDocument?.lineItems, pending.issuedDocument?.lineItems, "retain the selected party's receipt lines");
  const html = renderToStaticMarkup(
    <ThemeProvider theme={theme}>
      <AppSnackbarProvider>
        <FinanceReceiptPreview row={refreshed} lineItems={[]} totalPriceLabel={103.2} />
      </AppSnackbarProvider>
    </ThemeProvider>,
  );
  assert.ok(html.includes("Payment Status"));
  assert.ok(html.includes(`>${transaction.status}<`), "receipt follows backend Pending → Paid updates");
  if (transaction.status === "Paid") {
    assert.ok(!html.includes(">Pending<"));
    assert.ok(html.includes("RCP-1"));
    assert.equal(displayReceiptNumber(refreshed.status, refreshed.issuedDocument), "RCP-1");
  }
}
console.log("receiptPaymentStatus.test.tsx: ok");
