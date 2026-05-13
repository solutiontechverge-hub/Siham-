"use client";

import * as React from "react";
import { Box, Button, Stack, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type {
  TransactionDocumentBookingItem,
  TransactionDocumentLineItem,
  TransactionRow,
} from "../../../app/professionals/fixed-location/finance/data/transactions";
import type { ProfessionalProfile, ProfileResponse } from "../../../store/services/profileApi";
import MollureDrawer from "../../common/MollureDrawer";
import { useSnackbar } from "../../common/AppSnackbar";
import { BodyText, SubHeading } from "../../ui/typography";
import type { FinanceInvoiceSettings, FinanceInvoiceTemplateType } from "./useFinanceInvoiceSettings";

type FinanceDocumentPreviewDrawerProps = {
  open: boolean;
  onClose: () => void;
  documentType: "invoice" | "receipt";
  invoiceType: FinanceInvoiceTemplateType;
  settings: FinanceInvoiceSettings;
  row?: TransactionRow | null;
  profileData?: ProfileResponse | null;
};

type PreviewLineItem = {
  description: string;
  quantity: string;
  vat: string;
  pricePerUnit: string;
  totalPrice: string;
};

function formatDate(value?: string | null) {
  if (!value) {
    return "";
  }

  const parts = value.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  return value;
}

function parseCurrencyValue(input?: string | null) {
  if (!input) {
    return 0;
  }

  const normalized = input.replace(/[^0-9.,-]/g, "").replace(/,/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrencyValue(amount: number) {
  return new Intl.NumberFormat("en-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function addDuration(dateText: string, value: string, unit: string) {
  const amount = Number(value);
  if (!dateText || !Number.isFinite(amount) || amount <= 0) {
    return "";
  }

  const next = new Date(dateText);
  if (Number.isNaN(next.getTime())) {
    return "";
  }

  const unitValue = unit.trim().toLowerCase();
  if (unitValue.startsWith("day")) {
    next.setDate(next.getDate() + amount);
  } else if (unitValue.startsWith("month")) {
    next.setMonth(next.getMonth() + amount);
  } else {
    next.setDate(next.getDate() + amount * 7);
  }

  return `${String(next.getDate()).padStart(2, "0")}/${String(next.getMonth() + 1).padStart(2, "0")}/${next.getFullYear()}`;
}

function getProfessionalProfile(profileData?: ProfileResponse | null) {
  if (!profileData || profileData.user_type !== "professional") {
    return null;
  }

  return profileData.profile as ProfessionalProfile | null;
}

function normalizePreviewLineItems(items: TransactionDocumentLineItem[]): PreviewLineItem[] {
  return items.map((item) => ({
    description: item.description,
    quantity: item.quantity,
    vat: item.vat,
    pricePerUnit: item.pricePerUnit,
    totalPrice: item.totalPrice,
  }));
}

function buildPreviewLineItems(settings: FinanceInvoiceSettings, row?: TransactionRow | null): PreviewLineItem[] {
  if (row?.document?.lineItems?.length) {
    return normalizePreviewLineItems(row.document.lineItems);
  }

  const templateItems = [
    ...settings.services.map((service) => ({
      description: service.service || service.category || "Service",
      vat: service.vat || "0%",
    })),
    ...settings.products.map((product) => ({
      description: product.name || "Product",
      vat: product.vat || "0%",
    })),
  ].filter((item) => item.description);

  const items = templateItems.length
    ? templateItems.slice(0, 4)
    : [{ description: row?.entryLabel || "Service", vat: "0%" }];

  const totalAmount = parseCurrencyValue(row?.netAmount) || 250;
  const perItemAmount = items.length ? totalAmount / items.length : totalAmount;

  return items.map((item, index) => {
    const amount = index === items.length - 1
      ? totalAmount - perItemAmount * (items.length - 1)
      : perItemAmount;

    return {
      description: item.description,
      quantity: "1",
      vat: item.vat,
      pricePerUnit: formatCurrencyValue(amount),
      totalPrice: formatCurrencyValue(amount),
    };
  });
}

function buildBookingItems(row: TransactionRow | null, lineItems: PreviewLineItem[]): TransactionDocumentBookingItem[] {
  if (row?.document?.bookingItems?.length) {
    return row.document.bookingItems;
  }

  return lineItems.map((item) => ({
    label: item.description,
    value: item.totalPrice,
  }));
}

export default function FinanceDocumentPreviewDrawer({
  open,
  onClose,
  documentType,
  invoiceType,
  settings,
  row = null,
  profileData = null,
}: FinanceDocumentPreviewDrawerProps) {
  const theme = useTheme();
  const m = theme.palette.mollure;
  const { showSnackbar } = useSnackbar();

  const professionalProfile = React.useMemo(() => getProfessionalProfile(profileData), [profileData]);
  const lineItems = React.useMemo(() => buildPreviewLineItems(settings, row), [settings, row]);
  const bookingItems = React.useMemo(() => buildBookingItems(row, lineItems), [lineItems, row]);
  const serviceDate = formatDate(row?.document?.serviceDate || row?.date) || "12/04/2023";
  const invoiceDate = formatDate(row?.document?.invoiceDate || row?.date) || serviceDate;
  const dueDate =
    formatDate(row?.document?.dueDate) ||
    addDuration(row?.date || "", settings.paymentTerms.originalDueValue, settings.paymentTerms.originalDueUnit) ||
    "12/04/2023";
  const documentNumber = row?.document?.documentNumber || row?.entryId || row?.id || "0535833";
  const totalAmount = lineItems.reduce((sum, item) => sum + parseCurrencyValue(item.totalPrice), 0);
  const totalPriceLabel =
    row?.document?.totalPrice ||
    formatCurrencyValue(totalAmount || parseCurrencyValue(row?.netAmount) || 250);
  const titleLabel = documentType === "receipt" ? "Receipt" : "Invoice";
  const clientInfoTitle = invoiceType === "company" ? "Company Clients Business Info" : "Client Info";
  const penaltySummary = row?.document?.lateFeeNotice || (
    settings.paymentTerms.originalPenaltyValue
      ? `Late payment fee: ${settings.paymentTerms.originalPenaltyValue} ${settings.paymentTerms.originalPenaltyUnit} applies after the due date.`
      : "Late payment fee applies after the due date."
  );

  const professionalAddress = [
    professionalProfile?.street,
    professionalProfile?.street_number,
    professionalProfile?.municipality,
    professionalProfile?.province,
  ]
    .filter(Boolean)
    .join(", ");

  const professionalName = professionalProfile?.legal_name || "Craig Martha";
  const professionalVat = professionalProfile?.vat_number || "-";
  const professionalCoc = professionalProfile?.ccc_number || "-";
  const clientParty = row?.document?.client;

  const clientLines = [
    `Legal Name: ${clientParty?.legalName || row?.clientName || "Sara Johnson"}`,
    ...(clientParty?.address ? [`Client Address: ${clientParty.address}`] : []),
    `Email: ${clientParty?.email || row?.clientEmail || "sarajohnson@gmail.com"}`,
  ];

  const downloadDocumentPdf = React.useCallback(async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });

      const left = 48;
      const right = 48;
      const top = 56;
      const pageWidth = doc.internal.pageSize.getWidth();
      const usableWidth = pageWidth - left - right;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(titleLabel, left, top);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.text(`Service Date: ${serviceDate}`, left, top + 18);
      doc.text(`Due Date: ${dueDate}`, left, top + 34);
      doc.text(`${titleLabel} Date: ${invoiceDate}`, left + usableWidth - 150, top + 18, { align: "left" });
      doc.text(`${titleLabel} Number: ${documentNumber}`, left + usableWidth - 150, top + 34, { align: "left" });

      if (settings.logoDataUrl) {
        const match = /^data:image\/(png|jpeg|jpg);base64,/.exec(settings.logoDataUrl);
        const format = match?.[1]?.toUpperCase() === "JPG" ? "JPEG" : match?.[1]?.toUpperCase();
        if (format === "PNG" || format === "JPEG") {
          doc.addImage(settings.logoDataUrl, format, left + usableWidth / 2 - 22, top - 6, 44, 44);
        }
      }

      doc.setTextColor(70);
      doc.setFontSize(10.5);
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

      drawBlock("Professional's Business Info", [
        `Legal Name: ${professionalName}`,
        `Professional Address: ${professionalAddress || "-"}`,
        ...(invoiceType === "company" ? [`Professional VAT No: ${professionalVat}`, `Professional COC No: ${professionalCoc}`] : []),
      ]);

      drawBlock(clientInfoTitle, [
        ...clientLines,
        ...(invoiceType === "company"
          ? [
              `Client VAT No: ${clientParty?.vatNumber || "-"}`,
              `Client COC No: ${clientParty?.cocNumber || "-"}`,
            ]
          : []),
      ]);

      drawBlock(
        "Booking Related Info",
        [...bookingItems.map((item) => `${item.label}: ${item.value}`), `Total Price: ${totalPriceLabel}`],
      );

      const tableTop = y + 10;
      const cols = [
        { label: "Description", w: 180 },
        { label: "Quantity", w: 70 },
        { label: "VAT %", w: 60 },
        { label: "Price/Unit", w: 100 },
        { label: "Total", w: 80 },
      ] as const;

      doc.setTextColor(40);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      let x = left;
      cols.forEach((col) => {
        doc.text(col.label, x, tableTop);
        x += col.w;
      });

      doc.setDrawColor(220);
      doc.line(left, tableTop + 6, left + cols.reduce((sum, col) => sum + col.w, 0), tableTop + 6);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      lineItems.forEach((item, index) => {
        let cursorX = left;
        const rowY = tableTop + 26 + index * 18;
        [item.description, item.quantity, item.vat, item.pricePerUnit, item.totalPrice].forEach((cell, cellIndex) => {
          doc.text(cell, cursorX, rowY);
          cursorX += cols[cellIndex].w;
        });
      });

      doc.setFont("helvetica", "bold");
      doc.text("Total (incl. VAT)", left, tableTop + 26 + lineItems.length * 18 + 22);
      doc.text(totalPriceLabel, left + usableWidth - 20, tableTop + 26 + lineItems.length * 18 + 22, { align: "right" });

      doc.save(`${documentType}-${documentNumber}.pdf`);
      showSnackbar({ severity: "success", message: `${titleLabel} downloaded successfully.` });
    } catch {
      showSnackbar({ severity: "error", message: `Failed to download ${documentType}.` });
    }
  }, [
    clientInfoTitle,
    clientLines,
    clientParty?.cocNumber,
    clientParty?.vatNumber,
    bookingItems,
    documentNumber,
    documentType,
    dueDate,
    invoiceDate,
    invoiceType,
    lineItems,
    penaltySummary,
    professionalAddress,
    professionalCoc,
    professionalName,
    professionalVat,
    serviceDate,
    settings.logoDataUrl,
    showSnackbar,
    titleLabel,
    totalPriceLabel,
  ]);

  return (
    <MollureDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      title={`View ${titleLabel}`}
      width={{ xs: "100%", sm: 560 }}
      contentSx={{ p: 2.25 }}
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={2} sx={{ borderBottom: `1px solid ${alpha(m.navy, 0.08)}`, pb: 1 }}>
          {["Booking", "Sales", "Activity"].map((tabLabel, index) => (
            <BodyText
              key={tabLabel}
              sx={{
                fontWeight: 800,
                fontSize: 12.5,
                color: index === 1 ? m.teal : alpha(m.navy, 0.55),
                borderBottom: index === 1 ? `2px solid ${m.teal}` : "2px solid transparent",
                pb: 0.75,
              }}
            >
              {tabLabel}
            </BodyText>
          ))}
        </Stack>

        <Box
          sx={{
            borderRadius: "10px",
            border: `1px solid ${alpha(m.navy, 0.10)}`,
            bgcolor: "#fff",
            p: 2,
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              alignItems: "start",
              columnGap: 2,
            }}
          >
            <Box>
              <SubHeading sx={{ fontSize: 18, fontWeight: 900, color: alpha(m.navy, 0.86) }}>{titleLabel}</SubHeading>
              <BodyText sx={{ mt: 0.5, fontSize: 12.5, color: alpha(m.navy, 0.62) }}>
                Service Date: {serviceDate}
              </BodyText>
              <BodyText sx={{ mt: 0.2, fontSize: 12.5, color: alpha(m.navy, 0.62) }}>Due Date: {dueDate}</BodyText>
            </Box>

            <Box sx={{ pt: 0.25, display: "flex", justifyContent: "center" }}>
              {settings.logoDataUrl ? (
                <Box
                  component="img"
                  src={settings.logoDataUrl}
                  alt={`${titleLabel} logo`}
                  sx={{ width: 48, height: 48, objectFit: "contain", borderRadius: "10px" }}
                />
              ) : null}
            </Box>

            <Box sx={{ textAlign: "right" }}>
              <BodyText sx={{ fontSize: 12.5, color: alpha(m.navy, 0.62) }}>{titleLabel} Date: {invoiceDate}</BodyText>
              <BodyText sx={{ mt: 0.2, fontSize: 12.5, color: alpha(m.navy, 0.62) }}>
                {titleLabel} Number: {documentNumber}
              </BodyText>
            </Box>
          </Box>

          <BodyText sx={{ mt: 1.4, fontSize: 12.5, color: alpha(m.navy, 0.62) }}>{penaltySummary}</BodyText>

          <Stack spacing={1.25} sx={{ mt: 2 }}>
            <Box
              sx={{
                p: 1.75,
                borderRadius: "10px",
                bgcolor: alpha(m.navy, 0.015),
                border: `1px solid ${alpha(m.navy, 0.08)}`,
              }}
            >
              <BodyText sx={{ fontWeight: 900, color: alpha(m.navy, 0.78) }}>Professional&apos;s Business Info</BodyText>
              <Stack spacing={0.5} sx={{ mt: 1.1 }}>
                <BodyText sx={{ fontSize: 12.5, color: alpha(m.navy, 0.62) }}>Legal Name: {professionalName}</BodyText>
                <BodyText sx={{ fontSize: 12.5, color: alpha(m.navy, 0.62) }}>
                  Professional Address: {professionalAddress || "-"}
                </BodyText>
                {invoiceType === "company" ? (
                  <>
                    <BodyText sx={{ fontSize: 12.5, color: alpha(m.navy, 0.62) }}>Professional VAT No: {professionalVat}</BodyText>
                    <BodyText sx={{ fontSize: 12.5, color: alpha(m.navy, 0.62) }}>Professional COC No: {professionalCoc}</BodyText>
                  </>
                ) : null}
              </Stack>
            </Box>

            <Box
              sx={{
                p: 1.75,
                borderRadius: "10px",
                bgcolor: alpha(m.navy, 0.015),
                border: `1px solid ${alpha(m.navy, 0.08)}`,
              }}
            >
              <BodyText sx={{ fontWeight: 900, color: alpha(m.navy, 0.78) }}>{clientInfoTitle}</BodyText>
              <Stack spacing={0.5} sx={{ mt: 1.1 }}>
                {clientLines.map((line) => (
                  <BodyText key={line} sx={{ fontSize: 12.5, color: alpha(m.navy, 0.62) }}>
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
              </Stack>
            </Box>

            <Box
              sx={{
                p: 1.75,
                borderRadius: "10px",
                bgcolor: alpha(m.navy, 0.015),
                border: `1px solid ${alpha(m.navy, 0.08)}`,
              }}
            >
              <BodyText sx={{ fontWeight: 900, color: alpha(m.navy, 0.78) }}>Booking Related Info</BodyText>
              <Stack spacing={0.75} sx={{ mt: 1.1 }}>
                {bookingItems.map((item) => (
                  <Stack key={`${item.label}-${item.value}`} direction="row" alignItems="center" justifyContent="space-between">
                    <BodyText sx={{ fontSize: 12.5, color: alpha(m.navy, 0.70) }}>{item.label}</BodyText>
                    <BodyText sx={{ fontSize: 12.5, color: alpha(m.navy, 0.70) }}>{item.value}</BodyText>
                  </Stack>
                ))}

                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 0.25 }}>
                  <BodyText sx={{ fontSize: 12.5, color: alpha(m.navy, 0.70) }}>Total Price:</BodyText>
                  <BodyText sx={{ fontSize: 18, fontWeight: 900, color: alpha(m.navy, 0.82) }}>{totalPriceLabel}</BodyText>
                </Stack>
              </Stack>
            </Box>
          </Stack>

          <Box sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {["Description", "Quantity", "VAT %", "Price Per Unit", "Total Price"].map((header) => (
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
                    <TableCell sx={{ fontSize: 12.5, color: alpha(m.navy, 0.75) }}>{item.description}</TableCell>
                    <TableCell sx={{ fontSize: 12.5, color: alpha(m.navy, 0.75) }}>{item.quantity}</TableCell>
                    <TableCell sx={{ fontSize: 12.5, color: alpha(m.navy, 0.75) }}>{item.vat}</TableCell>
                    <TableCell sx={{ fontSize: 12.5, color: alpha(m.navy, 0.75) }}>{item.pricePerUnit}</TableCell>
                    <TableCell sx={{ fontSize: 12.5, color: alpha(m.navy, 0.75) }}>{item.totalPrice}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Stack direction="row" justifyContent="space-between" sx={{ mt: 1.5 }}>
              <BodyText sx={{ fontSize: 12.5, color: alpha(m.navy, 0.65) }}>Total (incl. VAT)</BodyText>
              <BodyText sx={{ fontSize: 12.5, fontWeight: 900, color: alpha(m.navy, 0.78) }}>{totalPriceLabel}</BodyText>
            </Stack>
          </Box>

          <Stack direction="row" justifyContent="center" sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              onClick={downloadDocumentPdf}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 900,
                borderColor: alpha(m.navy, 0.16),
                color: alpha(m.navy, 0.70),
                "&:hover": { borderColor: alpha(m.navy, 0.24), bgcolor: alpha(m.navy, 0.02) },
              }}
            >
              Download {titleLabel}
            </Button>
          </Stack>
        </Box>
      </Stack>
    </MollureDrawer>
  );
}
