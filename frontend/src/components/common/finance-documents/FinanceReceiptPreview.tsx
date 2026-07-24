"use client";

import AppButton from "../AppButton";
import * as React from "react";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { Box, Divider, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { TransactionRow } from "../../../app/professionals/fixed-location/finance/data/transactions";
import { useSnackbar } from "../AppSnackbar";
import { BodyText, SubHeading } from "../../ui/typography";
import {
  formatDocumentDate,
  formatPaymentMethod,
  parseCurrencyValue,
  receiptItemsTitleForStatus,
  receiptNumberLabelForStatus,
  receiptTitleForStatus,
  type PreviewLineItem,
} from "./financeDocumentUtils";

type Props = {
  row: TransactionRow | null;
  lineItems: PreviewLineItem[];
  totalPriceLabel: string;
  onDownload?: () => void;
};

function ReceiptMetaRow({ label, value }: { label: string; value: string }) {
  const m = useTheme().palette.mollure;
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="flex-start"
      spacing={2}
    >
      <BodyText
        sx={{ fontSize: 13, fontWeight: 700, color: alpha(m.navy, 0.55) }}
      >
        {label}
      </BodyText>
      <BodyText
        sx={{
          fontSize: 13,
          fontWeight: 800,
          color: alpha(m.navy, 0.82),
          textAlign: "right",
        }}
      >
        {value}
      </BodyText>
    </Stack>
  );
}

export default function FinanceReceiptPreview({
  row,
  lineItems,
  totalPriceLabel,
  onDownload,
}: Props) {
  const m = useTheme().palette.mollure;
  const { showSnackbar } = useSnackbar();

  const receiptTitle = receiptTitleForStatus(row?.status);
  const itemsTitle = receiptItemsTitleForStatus(row?.status);
  const receiptNumberLabel = receiptNumberLabelForStatus(row?.status);
  const invoiceNumber =
    row?.document?.documentNumber || row?.entryId || row?.id || "—";
  const receiptNumber =
    row?.document?.creditNoteNumber ||
    row?.document?.receiptNumber ||
    row?.id ||
    "—";
  const date =
    formatDocumentDate(
      row?.document?.refundedAt || row?.document?.invoiceDate || row?.date,
    ) || formatDocumentDate(new Date().toISOString().slice(0, 10));
  const paymentMethod = formatPaymentMethod(row);
  const paymentStatus = row?.status ?? "Paid";
  const refundAmount = row?.document?.refundAmount;
  const isRefund = row?.status === "Refunded";

  const downloadReceiptPdf = React.useCallback(async () => {
    if (onDownload) {
      onDownload();
      return;
    }
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const left = 48;
      const top = 56;
      const pageWidth = doc.internal.pageSize.getWidth();
      const usableWidth = pageWidth - left * 2;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text(receiptTitle, left, top);

      let y = top + 32;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      const metaRows = [
        ["Invoice Number", invoiceNumber],
        [receiptNumberLabel, receiptNumber],
        ["Date", date],
        ...(isRefund && refundAmount
          ? [["Refund Amount", refundAmount] as const]
          : []),
        ["Payment Method", paymentMethod],
        ["Payment Status", paymentStatus],
      ] as const;
      metaRows.forEach(([label, value]) => {
        doc.setFont("helvetica", "normal");
        doc.text(label, left, y);
        doc.text(value, left + usableWidth, y, { align: "right" });
        y += 20;
      });

      y += 12;
      doc.setFont("helvetica", "bold");
      doc.text(itemsTitle, left, y);
      y += 18;
      doc.setFont("helvetica", "normal");
      lineItems.forEach((item) => {
        doc.text(item.description, left, y);
        doc.text(item.totalPrice, left + usableWidth, y, { align: "right" });
        y += 18;
      });

      y += 8;
      doc.setDrawColor(220);
      doc.line(left, y, left + usableWidth, y);
      y += 20;
      doc.setFont("helvetica", "bold");
      doc.text("Total Amount (VAT included)", left, y);
      doc.text(totalPriceLabel, left + usableWidth, y, { align: "right" });

      doc.save(`receipt-${receiptNumber}.pdf`);
      showSnackbar({
        severity: "success",
        message: "Receipt downloaded successfully.",
      });
    } catch {
      showSnackbar({
        severity: "error",
        message: "Failed to download receipt.",
      });
    }
  }, [
    date,
    invoiceNumber,
    isRefund,
    itemsTitle,
    lineItems,
    onDownload,
    paymentMethod,
    paymentStatus,
    receiptNumber,
    receiptNumberLabel,
    receiptTitle,
    refundAmount,
    showSnackbar,
    totalPriceLabel,
  ]);

  return (
    <Box
      sx={{
        borderRadius: "10px",
        border: `1px solid ${alpha(m.navy, 0.1)}`,
        bgcolor: "#fff",
        p: 2.5,
      }}
    >
      <SubHeading
        sx={{
          fontSize: 20,
          fontWeight: 900,
          color: alpha(m.navy, 0.88),
          mb: 2,
        }}
      >
        {receiptTitle}
      </SubHeading>

      <Stack spacing={1.15}>
        <ReceiptMetaRow label="Invoice Number" value={invoiceNumber} />
        <ReceiptMetaRow label={receiptNumberLabel} value={receiptNumber} />
        <ReceiptMetaRow label="Date" value={date} />
        {isRefund && refundAmount ? (
          <ReceiptMetaRow label="Refund Amount" value={refundAmount} />
        ) : null}
        <ReceiptMetaRow label="Payment Method" value={paymentMethod} />
        <ReceiptMetaRow label="Payment Status" value={paymentStatus} />
      </Stack>

      <BodyText
        sx={{
          mt: 2.25,
          mb: 1.1,
          fontWeight: 900,
          fontSize: 13.5,
          color: alpha(m.navy, 0.78),
        }}
      >
        {itemsTitle}
      </BodyText>

      <Stack spacing={0.85}>
        {lineItems.map((item, index) => (
          <Stack
            key={`${item.description}-${index}`}
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <BodyText
              sx={{ fontSize: 13, fontWeight: 700, color: alpha(m.navy, 0.72) }}
            >
              {item.description}
            </BodyText>
            <BodyText
              sx={{ fontSize: 13, fontWeight: 800, color: alpha(m.navy, 0.82) }}
            >
              {item.totalPrice}
            </BodyText>
          </Stack>
        ))}
      </Stack>

      <Divider sx={{ my: 1.75, borderColor: alpha(m.navy, 0.1) }} />

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <BodyText
          sx={{ fontSize: 13, fontWeight: 800, color: alpha(m.navy, 0.72) }}
        >
          Total Amount (VAT included)
        </BodyText>
        <BodyText
          sx={{ fontSize: 15, fontWeight: 1000, color: alpha(m.navy, 0.88) }}
        >
          {totalPriceLabel}
        </BodyText>
      </Stack>

      <Stack direction="row" justifyContent="center" sx={{ mt: 2.5 }}>
        <AppButton
          variant="outlined"
          startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: 18 }} />}
          onClick={downloadReceiptPdf}
          sx={{
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 900,
            borderColor: alpha(m.navy, 0.16),
            color: alpha(m.navy, 0.7),
            px: 2.5,
            "&:hover": {
              borderColor: alpha(m.navy, 0.24),
              bgcolor: alpha(m.navy, 0.02),
            },
          }}
        >
          Download {isRefund ? "Credit Note" : "Receipt"}
        </AppButton>
      </Stack>
    </Box>
  );
}

export function resolveReceiptTotalLabel(
  row: TransactionRow | null,
  lineItems: PreviewLineItem[],
) {
  if (row?.document?.totalPrice) return row.document.totalPrice;
  const totalAmount = lineItems.reduce(
    (sum, item) => sum + parseCurrencyValue(item.totalPrice),
    0,
  );
  return (
    row?.netAmount || (totalAmount > 0 ? `€${totalAmount.toFixed(2)}` : "€0.00")
  );
}
