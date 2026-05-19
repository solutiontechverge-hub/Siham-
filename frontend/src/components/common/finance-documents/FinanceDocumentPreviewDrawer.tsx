"use client";

import * as React from "react";
import { Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { TransactionRow } from "../../../app/professionals/fixed-location/finance/data/transactions";
import type { ProfileResponse } from "../../../store/services/profileApi";
import MollureDrawer from "../MollureDrawer";
import { BodyText } from "../../ui/typography";
import FinanceInvoicePreview from "./FinanceInvoicePreview";
import FinanceReceiptPreview, { resolveReceiptTotalLabel } from "./FinanceReceiptPreview";
import { buildPreviewLineItems } from "./financeDocumentUtils";
import type { FinanceProfessionalBusinessOverride } from "./financeDocumentTypes";
import type { FinanceInvoiceSettings, FinanceInvoiceTemplateType } from "./useFinanceInvoiceSettings";

export type { FinanceProfessionalBusinessOverride };

export type FinanceDocumentPreviewDrawerProps = {
  open: boolean;
  onClose: () => void;
  documentType: "invoice" | "receipt";
  invoiceType: FinanceInvoiceTemplateType;
  settings: FinanceInvoiceSettings;
  row?: TransactionRow | null;
  profileData?: ProfileResponse | null;
  professionalBusinessOverride?: FinanceProfessionalBusinessOverride | null;
};

export default function FinanceDocumentPreviewDrawer({
  open,
  onClose,
  documentType,
  invoiceType,
  settings,
  row = null,
  profileData = null,
  professionalBusinessOverride = null,
}: FinanceDocumentPreviewDrawerProps) {
  const m = useTheme().palette.mollure;
  const lineItems = React.useMemo(() => buildPreviewLineItems(settings, row), [settings, row]);
  const totalPriceLabel = React.useMemo(() => resolveReceiptTotalLabel(row, lineItems), [lineItems, row]);
  const titleLabel = documentType === "receipt" ? "Receipt" : "Invoice";

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

        {documentType === "receipt" ? (
          <FinanceReceiptPreview row={row} lineItems={lineItems} totalPriceLabel={totalPriceLabel} />
        ) : (
          <FinanceInvoicePreview
            row={row}
            settings={settings}
            invoiceType={invoiceType}
            profileData={profileData}
            professionalBusinessOverride={professionalBusinessOverride}
          />
        )}
      </Stack>
    </MollureDrawer>
  );
}
