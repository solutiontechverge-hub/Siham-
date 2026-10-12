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
  resolveInvoiceLineItemLayout,
  resolveInvoiceTemplateType,
  resolveProfessionalBusinessDisplay,
  financeMutedTextSx,
  financePreviewCardSx,
  financePriceTextSx,
  formatInvoicePrepaymentLabel,
  INVOICE_PREPAID_GREEN,
  isInvoicePrepaymentCollected,
  toInvoiceDisplayLineItems,
} from "./financeDocumentUtils";
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
  const clientParty = clientPartyOverride ?? document?.client;
  // BC / vat/coc / snapshot company beat a wrong frozen "individual" default.
  const effectiveInvoiceType = resolveInvoiceTemplateType({
    fallback: invoiceType,
    invoiceType: document?.issuedSnapshot?.templateType ?? invoiceType,
    clientType: row?.clientType,
    vatNumber: clientParty?.vatNumber,
    cocNumber: clientParty?.cocNumber,
  });
  // Issued snapshot logo first (immutable); settings cover client draft rows + legacy.
  const snapshotLogo =
    document?.issuedSnapshot?.invoiceSettings &&
    typeof document.issuedSnapshot.invoiceSettings === "object"
      ? (document.issuedSnapshot.invoiceSettings as { logoDataUrl?: string | null })
          .logoDataUrl
      : null;
  const logoDataUrl = snapshotLogo || settings.logoDataUrl || null;
  const professionalProfile = React.useMemo(
    () => (frozenDocument ? null : getProfessionalProfile(profileData)),
    [profileData, row],
  );
  const lineItems = React.useMemo(
    () => buildPreviewLineItems(settings, row),
    [settings, row],
  );
  const lineItemLayout = resolveInvoiceLineItemLayout(effectiveInvoiceType);
  const displayLineItems = React.useMemo(
    // Stored document lines are already authoritative. Keep every row and its
    // original values; aggregation is only appropriate for derived data.
    () => toInvoiceDisplayLineItems(lineItems, effectiveInvoiceType, true),
    [effectiveInvoiceType, lineItems],
  );
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
        settings.paymentTerms.originalDueValue,
        settings.paymentTerms.originalDueUnit,
      );
  const documentNumber =
    document?.documentNumber || "";
  const totalAmount = displayLineItems.reduce(
    (sum, item) => sum + parseCurrencyValue(item.totalPrice),
    0,
  );
  const totalPriceLabel =
    document?.totalPrice ||
    formatCurrencyValue(
      (frozenDocument ? parseCurrencyValue(row?.grossAmount) : totalAmount || parseCurrencyValue(row?.grossAmount)) || 0,
    );
  const clientInfoTitle =
    effectiveInvoiceType === "company"
      ? "Company Clients Business Info"
      : "Client Info";
  const penaltySummary = frozenDocument
    ? document?.lateFeeNotice || ""
    : document?.lateFeeNotice ||
      (settings.paymentTerms.originalPenaltyValue
      ? `Late payment fee: ${settings.paymentTerms.originalPenaltyValue} ${settings.paymentTerms.originalPenaltyUnit} applies after the due date.`
      : "Late payment fee applies after the due date.");

  const professionalDisplay = resolveProfessionalBusinessDisplay(
    professionalBusinessOverride,
    professionalProfile,
  );
  const professionalLines = professionalBusinessInfoLines(
    professionalDisplay,
    effectiveInvoiceType,
  );
  const prepaidAmountLabel = document?.prepaymentAmount;
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
      ...(clientParty?.address
        ? [`Client Address: ${clientParty.address}`]
        : []),
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
      if (effectiveInvoiceType === "company") doc.text(`Due Date: ${dueDate}`, left, top + 34);
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
          `Total Price: ${formatCurrencyDisplay(totalPriceLabel)}`,
        ]);
      }

      const tableTop = y + 10;
      const cols = lineItemColumns;
      const tableWidth = cols.reduce((sum, col) => sum + col.pdfWidth, 0);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      let x = left;
      cols.forEach((col) => {
        doc.text(col.label, col.align === "right" ? x + col.pdfWidth : x, tableTop, {
          align: col.align === "right" ? "right" : "left",
        });
        x += col.pdfWidth;
      });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      displayLineItems.forEach((item, index) => {
        let cursorX = left;
        const rowY = tableTop + 26 + index * 18;
        cols.forEach((col) => {
          const cell = getInvoiceLineItemCellValue(item, col.key);
          doc.text(String(cell), col.align === "right" ? cursorX + col.pdfWidth : cursorX, rowY, {
            align: col.align === "right" ? "right" : "left",
          });
          cursorX += col.pdfWidth;
        });
        doc.setDrawColor(220);
        doc.line(left, rowY + 6, left + tableWidth, rowY + 6);
      });
      doc.setFont("helvetica", "bold");
      let totalsY = tableTop + 26 + displayLineItems.length * 18 + 22;
      doc.text("Total (Incl. VAT)", left, totalsY);
      doc.text(formatCurrencyDisplay(totalPriceLabel), left + usableWidth - 20, totalsY, {
        align: "right",
      });
      if (prepaidAmountLabel && prepaidAmountValue > 0) {
        totalsY += 18;
        doc.setFont("helvetica", "normal");
        if (prepaymentCollected) doc.setTextColor(0x22, 0xb5, 0x73);
        doc.text(prepaymentCollected ? "Prepaid" : "Prepayment", left, totalsY);
        doc.setTextColor(0);
        doc.text(formatCurrencyDisplay(prepaidAmountLabel), left + usableWidth - 20, totalsY, {
          align: "right",
        });
        if (remainingAfterPrepayment) {
          totalsY += 18;
          doc.setFont("helvetica", "bold");
          doc.text("Remaining", left, totalsY);
          doc.text(remainingAfterPrepayment, left + usableWidth - 20, totalsY, {
            align: "right",
          });
        }
      }

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
    serviceDate,
    logoDataUrl,
    showSnackbar,
    totalPriceLabel,
  ]);

  const professionalName =
    professionalDisplay.shopName !== "—"
      ? professionalDisplay.shopName
      : professionalDisplay.legalName;

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
            <BodyText
              sx={financeMutedTextSx(m.navy, { mt: 0.2 })}
            >
              {effectiveInvoiceType === "company" ? `Due Date: ${dueDate}` : null}
            </BodyText>
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
              <FinancePreviewLabelValueRow
                label="Total Price:"
                value={formatCurrencyDisplay(totalPriceLabel)}
                variant="total"
              />
            </FinanceInfoBlock>
          </Stack>
        ) : (
          <BodyText sx={financeMutedTextSx(m.navy, { mt: 1 })}>
            <Box component="span" sx={{ fontWeight: 600 }}>
              Professional Name:
            </Box>{" "}
            {professionalName}
          </BodyText>
        )}
      </Box>

      <Box sx={{ mt: 2 }}>
        <Table
          size="small"
          sx={{
            // Match summary stack (no horizontal pad) so price + totals share one right edge.
            "& .MuiTableCell-root:first-of-type": { pl: 0 },
            "& .MuiTableCell-root:last-of-type": { pr: 0 },
          }}
        >
          <TableHead>
            <TableRow>
              {lineItemColumns.map((column) => (
                <TableCell
                  key={column.key}
                  align={column.align === "right" ? "right" : "left"}
                  sx={{
                    ...mollureTableHeaderSx(m.navy),
                    borderBottom: "none",
                    pb: 0.5,
                    ...(column.align === "right" ? financePriceTextSx : null),
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {displayLineItems.map((item, index) => (
              <TableRow key={`${item.displayDescription}-${index}`} hover>
                {lineItemColumns.map((column) => (
                  <TableCell
                    key={column.key}
                    align={column.align === "right" ? "right" : "left"}
                    sx={mollureBodyMutedSx(m.navy, {
                      color: alpha(m.navy, 0.75),
                      // Divider under service row(s), not under Description header.
                      borderBottom: `1px solid ${alpha(m.navy, 0.08)}`,
                      py: 3,
                      ...(column.align === "right" ? financePriceTextSx : null),
                    })}
                  >
                    {getInvoiceLineItemCellValue(item, column.key)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Stack spacing={0.75} sx={{ mt: 1.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <BodyText sx={mollureBodyMutedSx(m.navy, { color: alpha(m.navy, 0.65) })}>
              Total (Incl. VAT)
            </BodyText>
            <BodyText sx={mollureLabelSx(m.navy, financePriceTextSx)}>
              {formatCurrencyDisplay(totalPriceLabel)}
            </BodyText>
          </Stack>
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
