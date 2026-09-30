"use client";

import AppButton from "../AppButton";
import * as React from "react";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { Box, Divider, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { TransactionRow } from "../../../app/professionals/fixed-location/finance/data/transactions";
import type { ProfileResponse } from "../../../store/services/profileApi";
import { useSnackbar } from "../AppSnackbar";
import { BodyText, SubHeading } from "../../ui/typography";
import {
  mollurePageTitleSx,
  mollureSectionTitleSx,
} from "../../../theme/mollureHierarchy";
import {
  formatDocumentDateTime,
  formatPaymentMethod,
  getIssuedDocument,
  getProfessionalProfile,
  hasStoredDocumentSnapshot,
  parseCurrencyValue,
  professionalBusinessInfoLines,
  receiptItemsTitleForStatus,
  receiptNumberLabelForStatus,
  receiptTitleForStatus,
  resolveProfessionalBusinessDisplay,
  financePreviewCardSx,
  toInvoiceDisplayLineItems,
  type PreviewLineItem,
} from "./financeDocumentUtils";
import FinanceInfoBlock from "./FinanceInfoBlock";
import {
  FinanceMutedLines,
  FinancePreviewLabelValueRow,
} from "./FinancePreviewRows";
import type { FinanceProfessionalBusinessOverride } from "./financeDocumentTypes";
import type { FinanceInvoiceTemplateType } from "./useFinanceInvoiceSettings";

type Props = {
  row: TransactionRow | null;
  lineItems: PreviewLineItem[];
  totalPriceLabel: string;
  invoiceType?: FinanceInvoiceTemplateType;
  profileData?: ProfileResponse | null;
  professionalBusinessOverride?: FinanceProfessionalBusinessOverride | null;
  onDownload?: () => void;
};

export default function FinanceReceiptPreview({
  row,
  lineItems,
  totalPriceLabel,
  invoiceType = "individual",
  profileData = null,
  professionalBusinessOverride = null,
  onDownload,
}: Props) {
  const m = useTheme().palette.mollure;
  const { showSnackbar } = useSnackbar();
  const frozenDocument = hasStoredDocumentSnapshot(row);
  const document = getIssuedDocument(row);
  const professionalProfile = frozenDocument ? null : getProfessionalProfile(profileData);
  const professionalDisplay = resolveProfessionalBusinessDisplay(
    professionalBusinessOverride,
    professionalProfile,
  );
  const professionalLines = professionalBusinessInfoLines(
    professionalDisplay,
    invoiceType,
  );
  const displayLineItems = React.useMemo(
    () => toInvoiceDisplayLineItems(lineItems, invoiceType, frozenDocument),
    [frozenDocument, invoiceType, lineItems],
  );

  const receiptTitle = receiptTitleForStatus(row?.status);
  const itemsTitle = receiptItemsTitleForStatus(row?.status);
  const receiptNumberLabel = receiptNumberLabelForStatus(row?.status);
  const invoiceNumber =
    document?.documentNumber || row?.entryId || row?.id || "—";
  const receiptNumber =
    document?.creditNoteNumber ||
    document?.receiptNumber ||
    row?.id ||
    "—";
  const date =
    formatDocumentDateTime(
      document?.refundedAt ||
        document?.serviceDate ||
        document?.invoiceDate ||
        row?.date,
        document?.serviceTime,
    ) || "";
  const paymentMethod = frozenDocument
    ? [row?.methodTitle, row?.methodDetail].filter(Boolean).join(" ")
    : formatPaymentMethod(row);
  const paymentStatus = row?.status ?? "Paid";
  const refundAmount = document?.refundAmount;
  const isRefund = row?.status === "Refunded";
  const prepaidAmountLabel = document?.prepaymentAmount;
  const prepaymentDateTime = row?.issuedAt
    ? new Date(row.issuedAt).toLocaleString()
    : row?.date;

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
        ["Date and time", date],
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

      y += 10;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Professional's Business Info", left, y);
      y += 16;
      doc.setFont("helvetica", "normal");
      professionalLines.forEach((line) => {
        doc.text(line, left, y);
        y += 16;
      });

      y += 12;
      doc.setFont("helvetica", "bold");
      doc.text(itemsTitle, left, y);
      y += 18;
      doc.setFont("helvetica", "normal");
      displayLineItems.forEach((item) => {
        doc.text(item.displayDescription, left, y);
        doc.text(item.totalPrice, left + usableWidth, y, { align: "right" });
        y += 18;
      });
      if (
        !frozenDocument && prepaidAmountLabel &&
        !displayLineItems.some((item) => item.description.toLowerCase() === "prepayment")
      ) {
        doc.text("Prepayment", left, y);
        doc.text(prepaidAmountLabel, left + usableWidth, y, { align: "right" });
        y += 18;
      }

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
    displayLineItems,
    onDownload,
    paymentMethod,
    paymentStatus,
    prepaidAmountLabel,
    professionalLines,
    receiptNumber,
    receiptNumberLabel,
    receiptTitle,
    refundAmount,
    showSnackbar,
    totalPriceLabel,
  ]);

  return (
    <Box sx={financePreviewCardSx(m.navy, 2.5)}>
      <SubHeading sx={mollurePageTitleSx(m.navy, { mb: 2 })}>
        {receiptTitle}
      </SubHeading>

      <Stack spacing={1.15}>
        <FinancePreviewLabelValueRow label="Invoice Number" value={invoiceNumber} />
        <FinancePreviewLabelValueRow
          label={receiptNumberLabel}
          value={receiptNumber}
        />
        <FinancePreviewLabelValueRow label="Date and time" value={date} />
        {isRefund && refundAmount ? (
          <FinancePreviewLabelValueRow
            label="Refund Amount"
            value={refundAmount}
          />
        ) : null}
        <FinancePreviewLabelValueRow
          label="Payment Method"
          value={paymentMethod}
        />
        <FinancePreviewLabelValueRow
          label="Payment Status"
          value={paymentStatus}
        />
      </Stack>

      <FinanceInfoBlock title="Professional's Business Info" sx={{ mt: 2 }}>
        <FinanceMutedLines lines={professionalLines} navy={m.navy} />
      </FinanceInfoBlock>

      <BodyText sx={mollureSectionTitleSx(m.navy, { mt: 2.25, mb: 1.1 })}>
        {itemsTitle}
      </BodyText>

      <Stack spacing={0.85}>
        {displayLineItems.map((item, index) => (
          <FinancePreviewLabelValueRow
            key={`${item.displayDescription}-${index}`}
            label={item.displayDescription}
            value={item.totalPrice}
            variant="line"
          />
        ))}
        {!frozenDocument && prepaidAmountLabel &&
        !displayLineItems.some(
          (item) => item.description.toLowerCase() === "prepayment",
        ) ? (
          <FinancePreviewLabelValueRow
            label={prepaymentDateTime ? `Prepayment · ${prepaymentDateTime}` : "Prepayment"}
            value={prepaidAmountLabel}
            variant="line"
          />
        ) : null}
      </Stack>

      <Divider sx={{ my: 1.75, borderColor: alpha(m.navy, 0.1) }} />

      <FinancePreviewLabelValueRow
        label="Total Amount (VAT included)"
        value={totalPriceLabel}
        variant="total"
      />

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
  const document = getIssuedDocument(row);
  if (document?.totalPrice) return document.totalPrice;
  if (hasStoredDocumentSnapshot(row)) return row?.grossAmount || row?.netAmount || "€0.00";
  const totalAmount = lineItems.reduce(
    (sum, item) => sum + parseCurrencyValue(item.totalPrice),
    0,
  );
  return (
    row?.netAmount || (totalAmount > 0 ? `€${totalAmount.toFixed(2)}` : "€0.00")
  );
}
