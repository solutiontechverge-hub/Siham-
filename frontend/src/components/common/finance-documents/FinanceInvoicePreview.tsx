"use client";

import {
  mollureLabelSx,
  mollureBodyMutedSx,
  mollurePageTitleSx,
  mollureTableHeaderSx,
} from "../../../theme/mollureHierarchy";

import AppButton from "../AppButton";
import * as React from "react";
import Image from "next/image";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import {
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type {
  TransactionDocumentParty,
  TransactionRow,
} from "../../../app/professionals/fixed-location/finance/data/transactions";
import type {
  ProfileResponse,
} from "../../../store/services/profileApi";
import { useSnackbar } from "../AppSnackbar";
import { BodyText, SubHeading } from "../../ui/typography";
import {
  addDuration,
  buildBookingItems,
  buildPreviewLineItems,
  formatDocumentDate,
  formatDocumentDateTime,
  formatCurrencyDisplay,
  formatCurrencyValue,
  getInvoiceLineItemCellValue,
  getInvoiceLineItemColumns,
  getProfessionalProfile,
  getIssuedDocument,
  hasStoredDocumentSnapshot,
  parseCurrencyValue,
  professionalBusinessInfoLines,
  resolveIssuedInvoiceSettings,
  resolveInvoiceLineItemLayout,
  resolveInvoiceTemplateType,
  resolveProfessionalBusinessDisplay,
  financeMutedTextSx,
  financePreviewCardSx,
  financePriceTextSx,
  formatInvoicePrepaymentLabel,
  INVOICE_PREPAID_GREEN,
  INVOICE_TOTAL_VAT_INCLUDED_LABEL,
  isInvoicePrepaymentCollected,
  toInvoiceDisplayLineItems,
} from "./financeDocumentUtils";
import { isProtectiveFeeLineDescription } from "./protectiveFeeInvoice";
import FinanceInfoBlock from "./FinanceInfoBlock";
import {
  FinanceMutedLines,
  FinancePreviewLabelValueRow,
} from "./FinancePreviewRows";
import type {
  FinanceInvoiceSettings,
  FinanceInvoiceTemplateType,
} from "./useFinanceInvoiceSettings";
import type { FinanceProfessionalBusinessOverride } from "./financeDocumentTypes";

type Props = {
  row: TransactionRow | null;
  settings: FinanceInvoiceSettings;
  invoiceType: FinanceInvoiceTemplateType;
  profileData?: ProfileResponse | null;
  professionalBusinessOverride?: FinanceProfessionalBusinessOverride | null;
  clientPartyOverride?: TransactionDocumentParty | null;
};

export default function FinanceInvoicePreview({
  row,
  settings,
  invoiceType,
  profileData = null,
  professionalBusinessOverride = null,
  clientPartyOverride = null,
}: Props) {
  const m = useTheme().palette.mollure;
  const { showSnackbar } = useSnackbar();
  const document = getIssuedDocument(row);
  const frozenDocument = hasStoredDocumentSnapshot(row);
  // Issued snapshot paymentTerms/logo win; live settings only for drafts/legacy.
  const effectiveSettings = resolveIssuedInvoiceSettings(row, settings);
  const clientParty = clientPartyOverride ?? document?.client;
  // BC / vat/coc / snapshot company beat a wrong frozen "individual" default.
  const effectiveInvoiceType = resolveInvoiceTemplateType({
    fallback: invoiceType,
    invoiceType: document?.issuedSnapshot?.templateType ?? invoiceType,
    clientType: row?.clientType,
    vatNumber: clientParty?.vatNumber,
    cocNumber: clientParty?.cocNumber,
  });
  const logoDataUrl = effectiveSettings.logoDataUrl || null;
  const professionalProfile = React.useMemo(
    () => (frozenDocument ? null : getProfessionalProfile(profileData)),
    [profileData, row],
  );
  const lineItems = React.useMemo(
    () => buildPreviewLineItems(effectiveSettings, row),
    [effectiveSettings, row],
  );
  const lineItemLayout = resolveInvoiceLineItemLayout(effectiveInvoiceType);
  const displayLineItems = React.useMemo(() => {
    // Stored document lines are authoritative; keep protective fee lines last
    // (still before Grand Total / Stripe·Mollure fee breakdown).
    const display = toInvoiceDisplayLineItems(
      lineItems,
      effectiveInvoiceType,
      true,
    );
    return [...display].sort((a, b) => {
      const aFee = isProtectiveFeeLineDescription(a.displayDescription) ? 1 : 0;
      const bFee = isProtectiveFeeLineDescription(b.displayDescription) ? 1 : 0;
      return aFee - bFee;
    });
  }, [effectiveInvoiceType, lineItems]);
  const lineItemColumns = React.useMemo(
    () => getInvoiceLineItemColumns(lineItemLayout),
    [lineItemLayout],
  );
  const serviceDate =
    formatDocumentDateTime(
      document?.serviceDate || row?.date,
      document?.serviceTime,
    ) || "";
  const invoiceDate =
    formatDocumentDate(document?.invoiceDate || row?.date) ||
    formatDocumentDate(document?.serviceDate || row?.date) ||
    serviceDate;
  const dueDate = frozenDocument
    ? formatDocumentDate(document?.dueDate || row?.paymentDeadline)
    : formatDocumentDate(document?.dueDate || row?.paymentDeadline) || addDuration(
        row?.date || "",
        effectiveSettings.paymentTerms.originalDueValue,
        effectiveSettings.paymentTerms.originalDueUnit,
      );
  const documentNumber = document?.documentNumber || "N/A";
  const totalAmount = displayLineItems.reduce(
    (sum, item) => sum + parseCurrencyValue(item.totalPrice),
    0,
  );
  // Footer total always resolved — never leave Total (Incl. VAT) blank (BC mock).
  const resolvedFooterTotal =
    parseCurrencyValue(document?.totalPrice) ||
    totalAmount ||
    parseCurrencyValue(row?.grossAmount) ||
    0;
  const totalPriceLabel = formatCurrencyValue(resolvedFooterTotal);
  const clientInfoTitle =
    effectiveInvoiceType === "company"
      ? "Company Clients Business Info"
      : "Client Info";
  const penaltySummary =
    document?.lateFeeNotice ||
    (effectiveSettings.paymentTerms.originalPenaltyValue
      ? `Late payment fee: ${effectiveSettings.paymentTerms.originalPenaltyValue} ${effectiveSettings.paymentTerms.originalPenaltyUnit} applies after the due date.`
      : "Late payment fee applies after the due date.");

  const professionalDisplay = resolveProfessionalBusinessDisplay(
    professionalBusinessOverride,
    professionalProfile,
  );
  const professionalLines = professionalBusinessInfoLines(
    professionalDisplay,
    effectiveInvoiceType,
  );
  // PRE docs: heal missing snapshot prepaymentAmount from paid/gross (legacy rows).
  const docPhase = (document as { paymentPhase?: string } | null | undefined)
    ?.paymentPhase;
  const isPrepayDoc =
    docPhase === "prepay" ||
    String(row?.entryLabel ?? "").toLowerCase() === "prepayment";
  const prepaidAmountLabel =
    document?.prepaymentAmount ??
    (isPrepayDoc
      ? document?.paidAmount ?? row?.grossAmount ?? null
      : null);
  const prepaymentDateTime = row?.issuedAt
    ? new Date(row.issuedAt).toLocaleString()
    : row?.date;
  const prepaidAmountValue = parseCurrencyValue(prepaidAmountLabel);
  const prepaymentCollected = isInvoicePrepaymentCollected(row?.status);
  const prepaymentSummaryLabel = formatInvoicePrepaymentLabel(
    row?.status,
    prepaymentDateTime,
  );
  const remainingAfterPrepayment =
    prepaidAmountValue > 0
      ? formatCurrencyValue(
          Math.max(0, parseCurrencyValue(totalPriceLabel) - prepaidAmountValue),
        )
      : null;

  const clientLines = React.useMemo(
    () => [
      `Legal Name: ${clientParty?.legalName || row?.clientName || ""}`,
      `Client Address: ${clientParty?.address?.trim() || "-"}`,
    ],
    [clientParty, row?.clientName],
  );
  const bookingItems = React.useMemo(
    () => buildBookingItems(row, lineItems),
    [lineItems, row],
  );
  const companyCardSx = { bgcolor: "#fff" };

  const downloadInvoicePdf = React.useCallback(async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const left = 48;
      const top = 56;
      const pageWidth = doc.internal.pageSize.getWidth();
      const usableWidth = pageWidth - left * 2;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Invoice", left, top);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.text(`Service Date: ${serviceDate}`, left, top + 18);
      if (effectiveInvoiceType === "company" && dueDate) {
        doc.text(`Due Date: ${dueDate}`, left, top + 34);
      }
      doc.text(
        `Invoice Date: ${invoiceDate}`,
        left + usableWidth - 150,
        top + 18,
        { align: "left" },
      );
      doc.text(
        `Invoice Number: ${documentNumber}`,
        left + usableWidth - 150,
        top + 34,
        { align: "left" },
      );

      if (logoDataUrl) {
        const match = /^data:image\/(png|jpeg|jpg);base64,/.exec(
          logoDataUrl,
        );
        const format =
          match?.[1]?.toUpperCase() === "JPG"
            ? "JPEG"
            : match?.[1]?.toUpperCase();
        if (format === "PNG" || format === "JPEG") {
          doc.addImage(logoDataUrl, format, left + usableWidth - 44, top - 6, 44, 44);
        }
      }

      doc.setTextColor(70);
      doc.text(penaltySummary, left, top + 62);

      let y = top + 92;
      const drawBlock = (blockTitle: string, lines: string[]) => {
        const blockHeight = Math.max(64, 28 + lines.length * 16);
        doc.setDrawColor(220);
        doc.setFillColor("#FAFAFA");
        doc.roundedRect(left, y, usableWidth, blockHeight, 8, 8, "FD");
        doc.setTextColor(40);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(blockTitle, left + 14, y + 18);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10.5);
        lines.forEach((line, index) => {
          doc.text(line, left + 14, y + 36 + index * 16);
        });
        y += blockHeight + 10;
      };

      drawBlock("Professional's Business Info", professionalLines);
      if (effectiveInvoiceType === "company") {
        drawBlock(clientInfoTitle, [
          ...clientLines,
          `Client VAT No: ${clientParty?.vatNumber || "-"}`,
          `Client COC No: ${clientParty?.cocNumber || "-"}`,
        ]);
        drawBlock("Booking Related Info", [
          ...bookingItems.map(
            (item) => `${item.label}: ${formatCurrencyDisplay(item.value)}`,
          ),
        ]);
      }

      const tableTop = y + 10;
      const cols = lineItemColumns;
      const tableWidth = cols.reduce((sum, col) => sum + col.pdfWidth, 0);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      let x = left;
      cols.forEach((col) => {
        const centered = col.key === "vat" || col.key === "unit";
        const align = col.align === "right" ? "right" : centered ? "center" : "left";
        const tx =
          align === "right"
            ? x + col.pdfWidth
            : align === "center"
              ? x + col.pdfWidth / 2
              : x;
        doc.text(col.label, tx, tableTop, { align });
        x += col.pdfWidth;
      });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      displayLineItems.forEach((item, index) => {
        let cursorX = left;
        const rowY = tableTop + 26 + index * 18;
        cols.forEach((col) => {
          const cell = getInvoiceLineItemCellValue(item, col.key);
          const centered = col.key === "vat" || col.key === "unit";
          const align = col.align === "right" ? "right" : centered ? "center" : "left";
          const tx =
            align === "right"
              ? cursorX + col.pdfWidth
              : align === "center"
                ? cursorX + col.pdfWidth / 2
                : cursorX;
          doc.text(String(cell), tx, rowY, { align });
          cursorX += col.pdfWidth;
        });
        doc.setDrawColor(220);
        doc.line(left, rowY + 6, left + tableWidth, rowY + 6);
      });
      let totalsY = tableTop + 26 + displayLineItems.length * 18 + 22;
      const drawTotalRow = (
        label: string,
        value: string,
        opts?: { bold?: boolean; green?: boolean },
      ) => {
        doc.setFont("helvetica", opts?.bold ? "bold" : "normal");
        if (opts?.green) doc.setTextColor(0x22, 0xb5, 0x73);
        else doc.setTextColor(0);
        doc.text(label, left, totalsY);
        doc.setTextColor(0);
        doc.text(value, left + usableWidth - 20, totalsY, { align: "right" });
        totalsY += 18;
      };
      if (row?.grossAmount) {
        drawTotalRow("Gross amount", formatCurrencyDisplay(row.grossAmount));
      }
      if (row?.stripeFee) {
        drawTotalRow("Stripe fee", formatCurrencyDisplay(row.stripeFee));
      }
      if (row?.mollureFee) {
        drawTotalRow("Mollure fee", formatCurrencyDisplay(row.mollureFee));
      }
      if (prepaidAmountLabel && prepaidAmountValue > 0) {
        drawTotalRow(
          prepaymentCollected ? "Prepaid" : "Prepayment",
          formatCurrencyDisplay(prepaidAmountLabel),
          { green: prepaymentCollected },
        );
        if (remainingAfterPrepayment) {
          drawTotalRow("Remaining", remainingAfterPrepayment, { bold: true });
        }
      }
      drawTotalRow(
        INVOICE_TOTAL_VAT_INCLUDED_LABEL,
        formatCurrencyDisplay(totalPriceLabel),
        { bold: true },
      );

      doc.save(`invoice-${documentNumber}.pdf`);
      showSnackbar({
        severity: "success",
        message: "Invoice downloaded successfully.",
      });
    } catch {
      showSnackbar({
        severity: "error",
        message: "Failed to download invoice.",
      });
    }
  }, [
    bookingItems,
    clientInfoTitle,
    clientLines,
    clientParty?.cocNumber,
    clientParty?.vatNumber,
    documentNumber,
    dueDate,
    invoiceDate,
    displayLineItems,
    effectiveInvoiceType,
    lineItemColumns,
    penaltySummary,
    prepaidAmountLabel,
    prepaidAmountValue,
    prepaymentCollected,
    professionalLines,
    remainingAfterPrepayment,
    row?.grossAmount,
    row?.mollureFee,
    row?.stripeFee,
    serviceDate,
    logoDataUrl,
    showSnackbar,
    totalPriceLabel,
  ]);

  return (
    <Box sx={financePreviewCardSx(m.navy, 2)}>
      <Box sx={{ bgcolor: "#F9FAFB", borderRadius: "10px", p: 2 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          spacing={2}
        >
          <SubHeading sx={mollurePageTitleSx(m.navy)}>Invoice</SubHeading>
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
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            alignItems: "start",
            columnGap: 2,
            mt: 0.5,
          }}
        >
          <Box>
            <BodyText sx={financeMutedTextSx(m.navy)}>
              Service Date: {serviceDate}
            </BodyText>
            {effectiveInvoiceType === "company" && dueDate ? (
              <BodyText sx={financeMutedTextSx(m.navy, { mt: 0.2 })}>
                Due Date: {dueDate}
              </BodyText>
            ) : null}
          </Box>
          <Box sx={{ textAlign: { xs: "left", sm: "right" }, mt: { xs: 0.5, sm: 0 } }}>
            <BodyText sx={financeMutedTextSx(m.navy)}>
              Invoice Date: {invoiceDate}
            </BodyText>
            <BodyText
              sx={financeMutedTextSx(m.navy, { mt: 0.2 })}
            >
              Invoice Number: {documentNumber}
            </BodyText>
          </Box>
        </Box>

        {effectiveInvoiceType === "company" && penaltySummary ? (
          <BodyText sx={financeMutedTextSx(m.navy, { mt: 1.4 })}>
            {penaltySummary}
          </BodyText>
        ) : null}

        {effectiveInvoiceType === "company" ? (
          <Stack spacing={1.25} sx={{ mt: 1.5 }}>
            <FinanceInfoBlock title="Professional's Business Info" sx={companyCardSx}>
              <FinanceMutedLines lines={professionalLines} navy={m.navy} />
            </FinanceInfoBlock>
            <FinanceInfoBlock title={clientInfoTitle} sx={companyCardSx}>
              <FinanceMutedLines lines={clientLines} navy={m.navy} />
              <BodyText sx={financeMutedTextSx(m.navy)}>
                Client VAT No: {clientParty?.vatNumber || "-"}
              </BodyText>
              <BodyText sx={financeMutedTextSx(m.navy)}>
                Client COC No: {clientParty?.cocNumber || "-"}
              </BodyText>
            </FinanceInfoBlock>
            <FinanceInfoBlock title="Booking Related Info" sx={companyCardSx}>
              {bookingItems.map((item) => (
                <FinancePreviewLabelValueRow
                  key={item.label}
                  label={item.label}
                  value={formatCurrencyDisplay(item.value)}
                  variant="line"
                />
              ))}
            </FinanceInfoBlock>
          </Stack>
        ) : null}
      </Box>

      <Box sx={{ mt: 2 }}>
        <Table
          size="small"
          sx={{
            // IC + BC: fixed columns so long fee descriptions don't shove Price off the right edge.
            tableLayout: "fixed",
            width: "100%",
            // Match summary stack (no horizontal pad) so price + totals share one right edge.
            "& .MuiTableCell-root:first-of-type": { pl: 0 },
            "& .MuiTableCell-root:last-of-type": { pr: 0 },
          }}
        >
          <TableHead>
            <TableRow>
              {lineItemColumns.map((column) => {
                const isVat = column.key === "vat";
                const isQty = column.key === "unit";
                const cellAlign =
                  column.align === "right"
                    ? "right"
                    : isVat || isQty
                      ? "center"
                      : "left";
                return (
                <TableCell
                  key={column.key}
                  align={cellAlign}
                  sx={{
                    ...mollureTableHeaderSx(m.navy),
                    borderBottom: "none",
                    pb: 0.5,
                    whiteSpace: "nowrap",
                    // Qty/VAT: px widths so "Quantity" cannot overflow into "VAT %".
                    ...(lineItemLayout === "simplified"
                      ? {
                          width:
                            column.key === "description" ? "70%" : "30%",
                        }
                      : column.key === "unit"
                        ? { width: 88, minWidth: 88, px: 1 }
                        : column.key === "vat"
                          ? { width: 72, minWidth: 72, px: 1 }
                          : column.key === "description"
                            ? { width: "36%" }
                            : { width: "22%" }),
                    ...(column.align === "right"
                      ? financePriceTextSx
                      : null),
                  }}
                >
                  {column.label}
                </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {displayLineItems.map((item, index) => (
              <TableRow key={`${item.displayDescription}-${index}`} hover>
                {lineItemColumns.map((column) => {
                  const isVat = column.key === "vat";
                  const isQty = column.key === "unit";
                  const cellAlign =
                    column.align === "right"
                      ? "right"
                      : isVat || isQty
                        ? "center"
                        : "left";
                  return (
                  <TableCell
                    key={column.key}
                    align={cellAlign}
                    sx={mollureBodyMutedSx(m.navy, {
                      color: alpha(m.navy, 0.75),
                      // Divider under service row(s), not under Description header.
                      borderBottom: `1px solid ${alpha(m.navy, 0.08)}`,
                      py: 3,
                      ...(isQty
                        ? { width: 88, minWidth: 88, px: 1, whiteSpace: "nowrap" }
                        : isVat
                          ? { width: 72, minWidth: 72, px: 1, whiteSpace: "nowrap" }
                          : column.align === "right"
                            ? { ...financePriceTextSx, whiteSpace: "nowrap" }
                            : { wordBreak: "break-word" }),
                    })}
                  >
                    {getInvoiceLineItemCellValue(item, column.key)}
                  </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Stack spacing={0.75} sx={{ mt: 1.5 }}>
          {row?.grossAmount ? (
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <BodyText sx={mollureBodyMutedSx(m.navy, { color: alpha(m.navy, 0.65) })}>Gross amount</BodyText>
              <BodyText sx={mollureLabelSx(m.navy, financePriceTextSx)}>
                {formatCurrencyDisplay(row.grossAmount)}
              </BodyText>
            </Stack>
          ) : null}
          {row?.stripeFee ? (
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <BodyText sx={mollureBodyMutedSx(m.navy, { color: alpha(m.navy, 0.65) })}>Stripe fee</BodyText>
              <BodyText sx={mollureLabelSx(m.navy, financePriceTextSx)}>
                {formatCurrencyDisplay(row.stripeFee)}
              </BodyText>
            </Stack>
          ) : null}
          {row?.mollureFee ? (
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <BodyText sx={mollureBodyMutedSx(m.navy, { color: alpha(m.navy, 0.65) })}>Mollure fee</BodyText>
              <BodyText sx={mollureLabelSx(m.navy, financePriceTextSx)}>
                {formatCurrencyDisplay(row.mollureFee)}
              </BodyText>
            </Stack>
          ) : null}
          {prepaidAmountLabel && prepaidAmountValue > 0 ? (
            <>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <BodyText
                  sx={
                    prepaymentCollected
                      ? mollureBodyMutedSx(m.navy, {
                          color: INVOICE_PREPAID_GREEN,
                          fontWeight: 700,
                        })
                      : mollureBodyMutedSx(m.navy, { color: alpha(m.navy, 0.65) })
                  }
                >
                  {prepaymentSummaryLabel}
                </BodyText>
                <BodyText sx={mollureLabelSx(m.navy, financePriceTextSx)}>
                  {formatCurrencyDisplay(prepaidAmountLabel)}
                </BodyText>
              </Stack>
              {remainingAfterPrepayment ? (
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <BodyText sx={mollureBodyMutedSx(m.navy, { color: alpha(m.navy, 0.65) })}>
                    Remaining
                  </BodyText>
                  <BodyText sx={mollureLabelSx(m.navy, financePriceTextSx)}>
                    {remainingAfterPrepayment}
                  </BodyText>
                </Stack>
              ) : null}
            </>
          ) : null}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <BodyText sx={mollureBodyMutedSx(m.navy, { color: alpha(m.navy, 0.65) })}>
              {INVOICE_TOTAL_VAT_INCLUDED_LABEL}
            </BodyText>
            <BodyText sx={mollureLabelSx(m.navy, financePriceTextSx)}>
              {formatCurrencyDisplay(totalPriceLabel)}
            </BodyText>
          </Stack>
        </Stack>
      </Box>

      <Stack direction="row" justifyContent="center" sx={{ mt: 2 }}>
        <AppButton
          tone="secondary"
          startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: 18 }} />}
          onClick={downloadInvoicePdf}
        >
          Download Invoice
        </AppButton>
      </Stack>
    </Box>
  );
}
