"use client";

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
  ProfessionalProfile,
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
  parseCurrencyValue,
  professionalBusinessInfoLines,
  resolveProfessionalBusinessDisplay,
} from "./financeDocumentUtils";
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

function getProfessionalProfile(profileData?: ProfileResponse | null) {
  if (!profileData || profileData.user_type !== "professional") return null;
  return profileData.profile as ProfessionalProfile | null;
}

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
  const totalAmount = lineItems.reduce(
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
      const cols = [
        { label: "Description", w: 180 },
        { label: "Quantity", w: 70 },
        { label: "VAT %", w: 60 },
        { label: "Price/Unit", w: 100 },
        { label: "Total", w: 80 },
      ] as const;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      let x = left;
      cols.forEach((col) => {
        doc.text(col.label, x, tableTop);
        x += col.w;
      });
      doc.setDrawColor(220);
      doc.line(
        left,
        tableTop + 6,
        left + cols.reduce((sum, col) => sum + col.w, 0),
        tableTop + 6,
      );
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      lineItems.forEach((item, index) => {
        let cursorX = left;
        const rowY = tableTop + 26 + index * 18;
        [
          item.description,
          item.quantity,
          item.vat,
          item.pricePerUnit,
          item.totalPrice,
        ].forEach((cell, cellIndex) => {
          doc.text(cell, cursorX, rowY);
          cursorX += cols[cellIndex].w;
        });
      });
      doc.setFont("helvetica", "bold");
      let totalsY = tableTop + 26 + lineItems.length * 18 + 22;
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
    invoiceType,
    lineItems,
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
    <Box
      sx={{
        borderRadius: "10px",
        border: `1px solid ${alpha(m.navy, 0.1)}`,
        bgcolor: "#fff",
        p: 2,
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr auto 1fr" },
          alignItems: "start",
          columnGap: 2,
        }}
      >
        <Box>
          <SubHeading
            sx={{ fontSize: 18, fontWeight: 900, color: alpha(m.navy, 0.86) }}
          >
            Invoice
          </SubHeading>
          <BodyText
            sx={{ mt: 0.5, fontSize: 12.5, color: alpha(m.navy, 0.62) }}
          >
            Service Date: {serviceDate}
          </BodyText>
          <BodyText
            sx={{ mt: 0.2, fontSize: 12.5, color: alpha(m.navy, 0.62) }}
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
          <BodyText sx={{ fontSize: 12.5, color: alpha(m.navy, 0.62) }}>
            Invoice Date: {invoiceDate}
          </BodyText>
          <BodyText
            sx={{ mt: 0.2, fontSize: 12.5, color: alpha(m.navy, 0.62) }}
          >
            Invoice Number: {documentNumber}
          </BodyText>
        </Box>
      </Box>

      <BodyText sx={{ mt: 1.4, fontSize: 12.5, color: alpha(m.navy, 0.62) }}>
        {penaltySummary}
      </BodyText>

      <Stack spacing={1.25} sx={{ mt: 2 }}>
        <InfoBlock title="Professional's Business Info">
          {professionalLines.map((line) => (
            <BodyText
              key={line}
              sx={{ fontSize: 12.5, color: alpha(m.navy, 0.62) }}
            >
              {line}
            </BodyText>
          ))}
        </InfoBlock>
        <InfoBlock title={clientInfoTitle}>
          {clientLines.map((line) => (
            <BodyText
              key={line}
              sx={{ fontSize: 12.5, color: alpha(m.navy, 0.62) }}
            >
              {line}
            </BodyText>
          ))}
          {invoiceType === "company" ? (
            <>
              <BodyText sx={{ fontSize: 12.5, color: alpha(m.navy, 0.62) }}>
                Client VAT No: {clientParty?.vatNumber || "-"}
              </BodyText>
              <BodyText sx={{ fontSize: 12.5, color: alpha(m.navy, 0.62) }}>
                Client COC No: {clientParty?.cocNumber || "-"}
              </BodyText>
            </>
          ) : null}
        </InfoBlock>
      </Stack>

      <Box sx={{ mt: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {[
                "Description",
                "Quantity",
                "VAT %",
                "Price Per Unit",
                "Total Price",
              ].map((header) => (
                <TableCell
                  key={header}
                  sx={{
                    fontSize: 12,
                    fontWeight: 900,
                    color: alpha(m.navy, 0.65),
                    borderBottom: `1px solid ${alpha(m.navy, 0.08)}`,
                  }}
                >
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {lineItems.map((item, index) => (
              <TableRow key={`${item.description}-${index}`} hover>
                <TableCell sx={{ fontSize: 12.5, color: alpha(m.navy, 0.75) }}>
                  {item.description}
                </TableCell>
                <TableCell sx={{ fontSize: 12.5, color: alpha(m.navy, 0.75) }}>
                  {item.quantity}
                </TableCell>
                <TableCell sx={{ fontSize: 12.5, color: alpha(m.navy, 0.75) }}>
                  {item.vat}
                </TableCell>
                <TableCell sx={{ fontSize: 12.5, color: alpha(m.navy, 0.75) }}>
                  {item.pricePerUnit}
                </TableCell>
                <TableCell sx={{ fontSize: 12.5, color: alpha(m.navy, 0.75) }}>
                  {item.totalPrice}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Stack spacing={0.75} sx={{ mt: 1.5 }}>
          <Stack direction="row" justifyContent="space-between">
            <BodyText sx={{ fontSize: 12.5, color: alpha(m.navy, 0.65) }}>
              Total (incl. VAT)
            </BodyText>
            <BodyText
              sx={{
                fontSize: 12.5,
                fontWeight: 900,
                color: alpha(m.navy, 0.78),
              }}
            >
              {totalPriceLabel}
            </BodyText>
          </Stack>
          {prepaidAmountLabel && prepaidAmountValue > 0 ? (
            <>
              <Stack direction="row" justifyContent="space-between">
                <BodyText sx={{ fontSize: 12.5, color: alpha(m.navy, 0.65) }}>
                  Prepayment
                </BodyText>
                <BodyText
                  sx={{
                    fontSize: 12.5,
                    fontWeight: 900,
                    color: alpha(m.navy, 0.78),
                  }}
                >
                  {prepaidAmountLabel}
                </BodyText>
              </Stack>
              {remainingAfterPrepayment ? (
                <Stack direction="row" justifyContent="space-between">
                  <BodyText sx={{ fontSize: 12.5, color: alpha(m.navy, 0.65) }}>
                    Remaining
                  </BodyText>
                  <BodyText
                    sx={{
                      fontSize: 12.5,
                      fontWeight: 900,
                      color: alpha(m.navy, 0.78),
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

function InfoBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const m = useTheme().palette.mollure;
  return (
    <Box
      sx={{
        p: 1.75,
        borderRadius: "10px",
        bgcolor: alpha(m.navy, 0.015),
        border: `1px solid ${alpha(m.navy, 0.08)}`,
      }}
    >
      <BodyText sx={{ fontWeight: 900, color: alpha(m.navy, 0.78) }}>
        {title}
      </BodyText>
      <Stack spacing={0.5} sx={{ mt: 1.1 }}>
        {children}
      </Stack>
    </Box>
  );
}
