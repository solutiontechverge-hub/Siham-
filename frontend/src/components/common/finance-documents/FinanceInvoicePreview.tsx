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
  buildPreviewLineItems,
  formatDocumentDate,
  formatDocumentDateTime,
  formatCurrencyValue,
  getInvoiceLineItemCellValue,
  getInvoiceLineItemColumns,
  getProfessionalProfile,
  parseCurrencyValue,
  professionalBusinessInfoLines,
  resolveInvoiceLineItemLayout,
  resolveProfessionalBusinessDisplay,
  financeMutedTextSx,
  financePreviewCardSx,
  toInvoiceDisplayLineItems,
} from "./financeDocumentUtils";
import FinanceInfoBlock from "./FinanceInfoBlock";
import { FinanceMutedLines } from "./FinancePreviewRows";
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
  const professionalProfile = React.useMemo(
    () => getProfessionalProfile(profileData),
    [profileData],
  );
  const lineItems = React.useMemo(
    () => buildPreviewLineItems(settings, row),
    [settings, row],
  );
  const lineItemLayout = resolveInvoiceLineItemLayout(invoiceType);
  const displayLineItems = React.useMemo(
    () => toInvoiceDisplayLineItems(lineItems, invoiceType),
    [invoiceType, lineItems],
  );
  const lineItemColumns = React.useMemo(
    () => getInvoiceLineItemColumns(lineItemLayout),
    [lineItemLayout],
  );
  const serviceDate =
    formatDocumentDateTime(
      row?.document?.serviceDate || row?.date,
      row?.document?.serviceTime,
    ) || "12/04/2023";
  const invoiceDate =
    formatDocumentDate(row?.document?.invoiceDate || row?.date) ||
    formatDocumentDate(row?.document?.serviceDate || row?.date) ||
    serviceDate;
  const dueDate =
    formatDocumentDate(row?.document?.dueDate) ||
    addDuration(
      row?.date || "",
      settings.paymentTerms.originalDueValue,
      settings.paymentTerms.originalDueUnit,
    ) ||
    "12/04/2023";
  const documentNumber =
    row?.document?.documentNumber || row?.entryId || row?.id || "0535833";
  const totalAmount = displayLineItems.reduce(
    (sum, item) => sum + parseCurrencyValue(item.totalPrice),
    0,
  );
  const totalPriceLabel =
    row?.document?.totalPrice ||
    formatCurrencyValue(
      totalAmount || parseCurrencyValue(row?.netAmount) || 250,
    );
  const clientInfoTitle =
    invoiceType === "company" ? "Company Clients Business Info" : "Client Info";
  const penaltySummary =
    row?.document?.lateFeeNotice ||
    (settings.paymentTerms.originalPenaltyValue
      ? `Late payment fee: ${settings.paymentTerms.originalPenaltyValue} ${settings.paymentTerms.originalPenaltyUnit} applies after the due date.`
      : "Late payment fee applies after the due date.");

  const professionalDisplay = resolveProfessionalBusinessDisplay(
    professionalBusinessOverride,
    professionalProfile,
  );
  const professionalLines = professionalBusinessInfoLines(
    professionalDisplay,
    invoiceType,
  );
  const prepaidAmountLabel = row?.document?.prepaymentAmount;
  const prepaidAmountValue = parseCurrencyValue(prepaidAmountLabel);
  const remainingAfterPrepayment =
    prepaidAmountValue > 0
      ? formatCurrencyValue(
          Math.max(0, parseCurrencyValue(totalPriceLabel) - prepaidAmountValue),
        )
      : null;
  const clientParty = clientPartyOverride ?? row?.document?.client;

  const clientLines = React.useMemo(
    () => [
      `Legal Name: ${clientParty?.legalName || row?.clientName || "Sara Johnson"}`,
      ...(clientParty?.address
        ? [`Client Address: ${clientParty.address}`]
        : []),
    ],
    [clientParty, row?.clientName],
  );

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
      doc.text(`Due Date: ${dueDate}`, left, top + 34);
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

      if (settings.logoDataUrl) {
        const match = /^data:image\/(png|jpeg|jpg);base64,/.exec(
          settings.logoDataUrl,
        );
        const format =
          match?.[1]?.toUpperCase() === "JPG"
            ? "JPEG"
            : match?.[1]?.toUpperCase();
        if (format === "PNG" || format === "JPEG") {
          doc.addImage(
            settings.logoDataUrl,
            format,
            left + usableWidth / 2 - 22,
            top - 6,
            44,
            44,
          );
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
      drawBlock(clientInfoTitle, [
        ...clientLines,
        ...(invoiceType === "company"
          ? [
              `Client VAT No: ${clientParty?.vatNumber || "-"}`,
              `Client COC No: ${clientParty?.cocNumber || "-"}`,
            ]
          : []),
      ]);

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
      doc.setDrawColor(220);
      doc.line(left, tableTop + 6, left + tableWidth, tableTop + 6);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      displayLineItems.forEach((item, index) => {
        let cursorX = left;
        const rowY = tableTop + 26 + index * 18;
        cols.forEach((col) => {
          const cell = getInvoiceLineItemCellValue(item, col.key);
          doc.text(cell, col.align === "right" ? cursorX + col.pdfWidth : cursorX, rowY, {
            align: col.align === "right" ? "right" : "left",
          });
          cursorX += col.pdfWidth;
        });
      });
      doc.setFont("helvetica", "bold");
      let totalsY = tableTop + 26 + displayLineItems.length * 18 + 22;
      doc.text("Total (incl. VAT)", left, totalsY);
      doc.text(totalPriceLabel, left + usableWidth - 20, totalsY, {
        align: "right",
      });
      if (prepaidAmountLabel && prepaidAmountValue > 0) {
        totalsY += 18;
        doc.setFont("helvetica", "normal");
        doc.text("Prepayment", left, totalsY);
        doc.text(prepaidAmountLabel, left + usableWidth - 20, totalsY, {
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
    clientInfoTitle,
    clientLines,
    clientParty?.cocNumber,
    clientParty?.vatNumber,
    documentNumber,
    dueDate,
    invoiceDate,
    displayLineItems,
    invoiceType,
    lineItemColumns,
    penaltySummary,
    prepaidAmountLabel,
    prepaidAmountValue,
    professionalLines,
    remainingAfterPrepayment,
    serviceDate,
    settings.logoDataUrl,
    showSnackbar,
    totalPriceLabel,
  ]);

  return (
    <Box sx={financePreviewCardSx(m.navy, 2)}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr auto 1fr" },
          alignItems: "start",
          columnGap: 2,
        }}
      >
        <Box>
          <SubHeading sx={mollurePageTitleSx(m.navy)}>Invoice</SubHeading>
          <BodyText
            sx={financeMutedTextSx(m.navy, { mt: 0.5 })}
          >
            Service Date: {serviceDate}
          </BodyText>
          <BodyText
            sx={financeMutedTextSx(m.navy, { mt: 0.2 })}
          >
            Due Date: {dueDate}
          </BodyText>
        </Box>
        <Box
          sx={{
            pt: 0.25,
            display: "flex",
            justifyContent: "center",
            width: 48,
            height: 48,
            flexShrink: 0,
          }}
        >
          {settings.logoDataUrl ? (
            <Box sx={{ position: "relative", width: 48, height: 48 }}>
              <Image
                src={settings.logoDataUrl}
                alt="Invoice logo"
                fill
                unoptimized
                style={{ objectFit: "contain", borderRadius: "10px" }}
              />
            </Box>
          ) : null}
        </Box>
        <Box sx={{ textAlign: { xs: "left", sm: "right" }, mt: { xs: 1.5, sm: 0 } }}>
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

      <BodyText sx={financeMutedTextSx(m.navy, { mt: 1.4 })}>
        {penaltySummary}
      </BodyText>

      <Stack spacing={1.25} sx={{ mt: 2 }}>
        <FinanceInfoBlock title="Professional's Business Info">
          <FinanceMutedLines lines={professionalLines} navy={m.navy} />
        </FinanceInfoBlock>
        <FinanceInfoBlock title={clientInfoTitle}>
          <FinanceMutedLines lines={clientLines} navy={m.navy} />
          {invoiceType === "company" ? (
            <>
              <BodyText sx={financeMutedTextSx(m.navy)}>
                Client VAT No: {clientParty?.vatNumber || "-"}
              </BodyText>
              <BodyText sx={financeMutedTextSx(m.navy)}>
                Client COC No: {clientParty?.cocNumber || "-"}
              </BodyText>
            </>
          ) : null}
        </FinanceInfoBlock>
      </Stack>

      <Box sx={{ mt: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {lineItemColumns.map((column) => (
                <TableCell
                  key={column.key}
                  align={column.align === "right" ? "right" : "left"}
                  sx={{
                    ...mollureTableHeaderSx(m.navy),
                    borderBottom: `1px solid ${alpha(m.navy, 0.08)}`,
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
          <Stack direction="row" justifyContent="space-between">
            <BodyText sx={mollureBodyMutedSx(m.navy, { color: alpha(m.navy, 0.65) })}>
              Total (incl. VAT)
            </BodyText>
            <BodyText
              sx={{
                ...mollureLabelSx(m.navy),
              }}
            >
              {totalPriceLabel}
            </BodyText>
          </Stack>
          {prepaidAmountLabel && prepaidAmountValue > 0 ? (
            <>
              <Stack direction="row" justifyContent="space-between">
                <BodyText sx={mollureBodyMutedSx(m.navy, { color: alpha(m.navy, 0.65) })}>
                  Prepayment
                </BodyText>
                <BodyText
                  sx={{
                    ...mollureLabelSx(m.navy),
                  }}
                >
                  {prepaidAmountLabel}
                </BodyText>
              </Stack>
              {remainingAfterPrepayment ? (
                <Stack direction="row" justifyContent="space-between">
                  <BodyText sx={mollureBodyMutedSx(m.navy, { color: alpha(m.navy, 0.65) })}>
                    Remaining
                  </BodyText>
                  <BodyText
                    sx={{
                      ...mollureLabelSx(m.navy),
                    }}
                  >
                    {remainingAfterPrepayment}
                  </BodyText>
                </Stack>
              ) : null}
            </>
          ) : null}
        </Stack>
      </Box>

      <Stack direction="row" justifyContent="center" sx={{ mt: 2 }}>
        <AppButton tone="secondary" onClick={downloadInvoicePdf}>
          Download Invoice
        </AppButton>
      </Stack>
    </Box>
  );
}
