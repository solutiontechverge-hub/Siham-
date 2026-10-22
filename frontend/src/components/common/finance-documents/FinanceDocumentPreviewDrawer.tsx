"use client";

import { mollureBodySx } from "../../../theme/mollureHierarchy";

import * as React from "react";
import { Box, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type {
  TransactionRow,
} from "../../../app/professionals/fixed-location/finance/data/transactions";
import type { ProfileResponse } from "../../../store/services/profileApi";
import AppDrawer from "../AppDrawer";
import { BodyText } from "../../ui/typography";
import FinanceInvoicePreview from "./FinanceInvoicePreview";
import FinanceReceiptPreview, {
  resolveReceiptTotalLabel,
} from "./FinanceReceiptPreview";
import { buildPreviewLineItems, getIssuedDocument, getIssuedDocumentSnapshot, hasStoredDocumentSnapshot, resolveInvoiceTemplateType } from "./financeDocumentUtils";
import { isMollureFinanceClient } from "./financeClientAccess";
import type { FinanceProfessionalBusinessOverride } from "./financeDocumentTypes";
import type {
  FinanceInvoiceSettings,
  FinanceInvoiceTemplateType,
} from "./useFinanceInvoiceSettings";

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
  const frozenDocument = hasStoredDocumentSnapshot(row);
  const renderRow = row && row.issuedDocument
    ? { ...row, document: getIssuedDocument(row) ?? row.document }
    : row;
  const issuedSnapshot = getIssuedDocumentSnapshot(row);
  const issuedBusinessOverride = issuedSnapshot?.professionalBusiness
    ? {
        legalName: issuedSnapshot.professionalBusiness.legalName ?? "",
        shopName:
          issuedSnapshot.professionalBusiness.shopName ??
          issuedSnapshot.professionalBusiness.legalName ??
          undefined,
        phone: issuedSnapshot.professionalBusiness.phone ?? undefined,
        address: issuedSnapshot.professionalBusiness.address ?? undefined,
        vatNumber: issuedSnapshot.professionalBusiness.vatNumber ?? undefined,
        cocNumber: issuedSnapshot.professionalBusiness.cocNumber ?? undefined,
      }
    : null;
  // Never trust frozen templateType alone — BC rows were often snapshotted as
  // "individual" from defaultInvoiceType. Client/business signals win.
  const resolvedInvoiceType = React.useMemo(() => {
    const document = getIssuedDocument(row);
    return resolveInvoiceTemplateType({
      fallback: invoiceType,
      invoiceType: issuedSnapshot?.templateType ?? invoiceType,
      clientType: row?.clientType,
      vatNumber: document?.client?.vatNumber,
      cocNumber: document?.client?.cocNumber,
    });
  }, [invoiceType, issuedSnapshot, row]);
  const lineItems = React.useMemo(
    () => buildPreviewLineItems(settings, renderRow),
    [renderRow, settings],
  );
  const totalPriceLabel = React.useMemo(
    () => resolveReceiptTotalLabel(row, lineItems),
    [lineItems, row],
  );
  const titleLabel = documentType === "receipt" ? "Receipt" : "Invoice";
  const isMollureClient =
    !frozenDocument && documentType === "invoice" && isMollureFinanceClient(row);

  return (
    <AppDrawer
      open={open}
      onClose={onClose}
      title={`View ${titleLabel}`}
      contentSx={{ px: 2.25, py: 2 }}
    >
      <Stack spacing={2}>
        {documentType === "receipt" ? (
          <FinanceReceiptPreview
            row={renderRow}
            lineItems={lineItems}
            totalPriceLabel={totalPriceLabel}
            settings={settings}
            invoiceType={resolvedInvoiceType}
            profileData={frozenDocument ? null : profileData}
            professionalBusinessOverride={frozenDocument ? issuedBusinessOverride : professionalBusinessOverride}
          />
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
                <BodyText
                  sx={{
                    ...mollureBodySx(m.navy),
                  }}
                >
                  This client is registered on Mollure. Invoice client details
                  are read-only and come from their account.
                </BodyText>
              </Box>
            ) : null}

            <FinanceInvoicePreview
              row={renderRow}
              settings={settings}
              invoiceType={resolvedInvoiceType}
              profileData={frozenDocument ? null : profileData}
              professionalBusinessOverride={frozenDocument ? issuedBusinessOverride : professionalBusinessOverride}
              clientPartyOverride={null}
            />
          </>
        )}
      </Stack>
    </AppDrawer>
  );
}
