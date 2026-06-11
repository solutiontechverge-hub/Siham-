"use client";

import * as React from "react";
import { Box, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type {
  TransactionDocumentParty,
  TransactionRow,
} from "../../../app/professionals/fixed-location/finance/data/transactions";
import type { ProfileResponse } from "../../../store/services/profileApi";
import FinanceDrawer from "../FinanceDrawer";
import MollureFormField from "../MollureFormField";
import { BodyText } from "../../ui/typography";
import FinanceInvoicePreview from "./FinanceInvoicePreview";
import FinanceReceiptPreview, { resolveReceiptTotalLabel } from "./FinanceReceiptPreview";
import { buildPreviewLineItems } from "./financeDocumentUtils";
import { canEditFinanceInvoiceClient, isMollureFinanceClient } from "./financeClientAccess";
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
  const canEditClient = documentType === "invoice" && canEditFinanceInvoiceClient(row);
  const isMollureClient = documentType === "invoice" && isMollureFinanceClient(row);

  const [clientDraft, setClientDraft] = React.useState<TransactionDocumentParty>(() => ({
    legalName: "",
    email: "",
    address: "",
    vatNumber: "",
    cocNumber: "",
  }));

  React.useEffect(() => {
    if (!open || documentType !== "invoice") return;
    const base = row?.document?.client;
    setClientDraft({
      legalName: base?.legalName ?? row?.clientName ?? "",
      email: base?.email ?? row?.clientEmail ?? "",
      address: base?.address ?? "",
      vatNumber: base?.vatNumber ?? "",
      cocNumber: base?.cocNumber ?? "",
    });
  }, [documentType, open, row]);

  const fieldSx = { "& .MuiOutlinedInput-root": { bgcolor: "#fff", borderRadius: "10px" } } as const;

  return (
    <FinanceDrawer
      open={open}
      onClose={onClose}
      title={`View ${titleLabel}`}
      size="wide"
      plain
      contentSx={{ px: 2.25, py: 2 }}
    >
      <Stack spacing={2}>
        {documentType === "receipt" ? (
          <FinanceReceiptPreview row={row} lineItems={lineItems} totalPriceLabel={totalPriceLabel} />
        ) : (
          <>
            {isMollureClient ? (
              <Box
                sx={{
                  px: 1.5,
                  py: 1.25,
                  borderRadius: "10px",
                  bgcolor: alpha(m.teal, 0.08),
                  border: `1px solid ${alpha(m.teal, 0.2)}`,
                }}
              >
                <BodyText sx={{ fontSize: 12.5, fontWeight: 700, color: alpha(m.navy, 0.72) }}>
                  This client is registered on Mollure. Invoice client details are read-only and come from their
                  account.
                </BodyText>
              </Box>
            ) : null}

            {canEditClient ? (
              <Box
                sx={{
                  p: 1.75,
                  borderRadius: "10px",
                  bgcolor: alpha(m.navy, 0.02),
                  border: `1px solid ${alpha(m.navy, 0.08)}`,
                }}
              >
                <BodyText sx={{ fontWeight: 900, color: alpha(m.navy, 0.78), mb: 1.25 }}>
                  {invoiceType === "company" ? "Edit company client details" : "Edit client details"}
                </BodyText>
                <Stack spacing={1.25}>
                  <MollureFormField
                    label="Legal name"
                    value={clientDraft.legalName}
                    onChange={(e) => setClientDraft((prev) => ({ ...prev, legalName: e.target.value }))}
                    fullWidth
                    sx={fieldSx}
                  />
                  <MollureFormField
                    label="Email"
                    value={clientDraft.email ?? ""}
                    onChange={(e) => setClientDraft((prev) => ({ ...prev, email: e.target.value }))}
                    fullWidth
                    sx={fieldSx}
                  />
                  <MollureFormField
                    label="Address"
                    value={clientDraft.address ?? ""}
                    onChange={(e) => setClientDraft((prev) => ({ ...prev, address: e.target.value }))}
                    fullWidth
                    sx={fieldSx}
                  />
                  {invoiceType === "company" ? (
                    <>
                      <MollureFormField
                        label="VAT number"
                        value={clientDraft.vatNumber ?? ""}
                        onChange={(e) => setClientDraft((prev) => ({ ...prev, vatNumber: e.target.value }))}
                        fullWidth
                        sx={fieldSx}
                      />
                      <MollureFormField
                        label="COC number"
                        value={clientDraft.cocNumber ?? ""}
                        onChange={(e) => setClientDraft((prev) => ({ ...prev, cocNumber: e.target.value }))}
                        fullWidth
                        sx={fieldSx}
                      />
                    </>
                  ) : null}
                </Stack>
              </Box>
            ) : null}

            <FinanceInvoicePreview
              row={row}
              settings={settings}
              invoiceType={invoiceType}
              profileData={profileData}
              professionalBusinessOverride={professionalBusinessOverride}
              clientPartyOverride={canEditClient ? clientDraft : null}
            />
          </>
        )}
      </Stack>
    </FinanceDrawer>
  );
}
