"use client";

import AppButton from "../AppButton";
import * as React from "react";
import Image from "next/image";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { Box, Divider, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { TransactionRow } from "../../../app/professionals/fixed-location/finance/data/transactions";
import type { ProfileResponse } from "../../../store/services/profileApi";
import { useSnackbar } from "../AppSnackbar";
import { BodyText, SubHeading } from "../../ui/typography";
import {
  mollureBodyMutedSx,
  mollurePageTitleSx,
} from "../../../theme/mollureHierarchy";
import {
  formatDocumentDate,
  getIssuedDocument,
  hasStoredDocumentSnapshot,
  parseCurrencyValue,
  receiptNumberLabelForStatus,
  receiptTitleForStatus,
  receiptItemsTitleForStatus,
  displayReceiptNumber,
  financePreviewCardSx,
  formatCurrencyDisplay,
  formatPaymentMethod,
  resolveIssuedInvoiceSettings,
  type PreviewLineItem,
} from "./financeDocumentUtils";
import { FinancePreviewLabelValueRow } from "./FinancePreviewRows";
import type { FinanceProfessionalBusinessOverride } from "./financeDocumentTypes";
import type {
  FinanceInvoiceSettings,
  FinanceInvoiceTemplateType,
} from "./useFinanceInvoiceSettings";

type Props = {
  row: TransactionRow | null;
  lineItems: PreviewLineItem[];
  totalPriceLabel: number | string;
  settings?: FinanceInvoiceSettings | null;
  invoiceType?: FinanceInvoiceTemplateType;
  profileData?: ProfileResponse | null;
  professionalBusinessOverride?: FinanceProfessionalBusinessOverride | null;
  onDownload?: () => void;
};

export default function FinanceReceiptPreview({
  row,
  lineItems,
  totalPriceLabel,
  settings = null,
  onDownload,
}: Props) {
  const m = useTheme().palette.mollure;
  const { showSnackbar } = useSnackbar();
  const frozenDocument = hasStoredDocumentSnapshot(row);
  const document = getIssuedDocument(row);
  const logoDataUrl = settings
    ? resolveIssuedInvoiceSettings(row, settings).logoDataUrl || null
    : null;

  const isRefund = row?.status === "Refunded";
  const receiptTitle = receiptTitleForStatus(row?.status);
  const receiptNumberLabel = receiptNumberLabelForStatus(row?.status);
  const itemsTitle = receiptItemsTitleForStatus(row?.status);
  const amountLabel = isRefund
    ? "Total Amount (VAT included)"
    : "Amount (VAT included)";
  const invoiceNumber = document?.documentNumber || "N/A";
  const receiptNumber = displayReceiptNumber(row?.status, document) || "N/A";
  const date =
    formatDocumentDate(
      document?.refundedAt ||
        document?.serviceDate ||
        document?.invoiceDate ||
        row?.date,
    ) || "";
  const paymentMethod = frozenDocument
    ? [row?.methodTitle, row?.methodDetail].filter(Boolean).join(" ")
    : formatPaymentMethod(row);
  const paymentStatus = row?.status ?? "Paid";

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
        ["Payment Method", paymentMethod],
        ["Payment Status", paymentStatus],
      ] as const;
      metaRows.forEach(([label, value]) => {
        doc.setFont("helvetica", "normal");
        doc.text(label, left, y);
        doc.text(formatCurrencyDisplay(value), left + usableWidth, y, {
          align: "right",
        });
        y += 20;
      });

      if (isRefund && lineItems.length > 0) {
        y += 16;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(120);
        doc.text(itemsTitle, left, y);
        doc.setTextColor(0);
        y += 16;
        lineItems.forEach((item, index) => {
          if (index > 0) {
            doc.setDrawColor(220);
            doc.line(left, y, left + usableWidth, y);
            y += 16;
          }
          doc.setFont("helvetica", "normal");
          doc.text(item.description || "—", left, y);
          doc.setFont("helvetica", "bold");
          doc.text(
            formatCurrencyDisplay(item.totalPrice),
            left + usableWidth,
            y,
            { align: "right" },
          );
          y += 18;
        });
      }

      y += 12;
      doc.setDrawColor(220);
      doc.line(left, y, left + usableWidth, y);
      y += 20;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0);
      doc.text(amountLabel, left, y);
      doc.text(formatCurrencyDisplay(totalPriceLabel), left + usableWidth, y, {
        align: "right",
      });
      y += 14;
      doc.setDrawColor(220);
      doc.line(left, y, left + usableWidth, y);

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
    amountLabel,
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
    showSnackbar,
    totalPriceLabel,
  ]);

  return (
    <Box sx={financePreviewCardSx(m.navy, 2.5)}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        spacing={2}
        sx={{ mb: 2 }}
      >
        <SubHeading sx={mollurePageTitleSx(m.navy)}>
          {receiptTitle}
        </SubHeading>
        {logoDataUrl ? (
          <Box
            sx={{
              position: "relative",
              width: 48,
              height: 48,
              flexShrink: 0,
            }}
          >
            <Image
              src={logoDataUrl}
              alt="Invoice logo"
              fill
              unoptimized
              style={{ objectFit: "contain", borderRadius: "50%" }}
            />
          </Box>
        ) : null}
      </Stack>

      <Stack spacing={1.15}>
        <FinancePreviewLabelValueRow label="Invoice Number" value={invoiceNumber} />
        <FinancePreviewLabelValueRow
          label={receiptNumberLabel}
          value={receiptNumber}
        />
        <FinancePreviewLabelValueRow label="Date" value={date} />
        <FinancePreviewLabelValueRow
          label="Payment Method"
          value={paymentMethod}
        />
        <FinancePreviewLabelValueRow
          label="Payment Status"
          value={paymentStatus}
        />
      </Stack>

      {isRefund && lineItems.length > 0 ? (
        <Stack spacing={1.15} sx={{ mt: 2.25 }}>
          <BodyText sx={mollureBodyMutedSx(m.navy)}>{itemsTitle}</BodyText>
          {lineItems.map((item, index) => (
            <React.Fragment key={`${item.description}-${index}`}>
              {index > 0 ? (
                <Divider sx={{ borderColor: alpha(m.navy, 0.1) }} />
              ) : null}
              <FinancePreviewLabelValueRow
                label={item.description || "—"}
                value={formatCurrencyDisplay(item.totalPrice)}
                variant="line"
              />
            </React.Fragment>
          ))}
        </Stack>
      ) : null}

      <Divider sx={{ my: 1.75, borderColor: alpha(m.navy, 0.1) }} />

      <FinancePreviewLabelValueRow
        label={amountLabel}
        value={formatCurrencyDisplay(totalPriceLabel)}
        variant="total"
      />

      <Divider sx={{ my: 1.75, borderColor: alpha(m.navy, 0.1) }} />

      <Stack direction="row" justifyContent="center" sx={{ mt: 0.5 }}>
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
          Download Receipt
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
  if (row?.status === "Refunded" && document?.refundAmount != null) {
    return document.refundAmount;
  }
  if (document?.paidAmount) return document.paidAmount;
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
