"use client";

import * as React from "react";
import { Box, Stack } from "@mui/material";
import {
  mollureLabelSx,
} from "../../../../../theme/mollureHierarchy";
import { BodyText } from "../../../../../components/ui/typography";
import AppButton from "../../../../../components/common/AppButton";
import AppTextField from "../../../../../components/common/AppTextField";
import MollureFormField from "../../../../../components/common/MollureFormField";
import AppModal from "../../../../../components/common/AppModal";
import BookingCatalogItemFields from "../../../../../components/common/calendar/BookingCatalogItemFields";
import FinanceDocumentPreviewDrawer from "../../../../../components/sections/finance/FinanceDocumentPreviewDrawer";
import { buildInvoiceTemplatePreviewRow } from "../../../../../components/common/finance-documents/financeDocumentUtils";
import { useGetBusinessSetupQuery } from "../../../../../store/services/businessApi";
import { sanitizeDecimalInput } from "../../../../../lib/field-input";
import type { ProductDraft, ServiceDraft } from "./setting.types";

export function InvoiceSettingsModals(props: {
  m: { navy: string };
  addProductOpen: boolean;
  setAddProductOpen: (v: boolean) => void;
  editingProductId: string | null;
  setEditingProductId: (v: string | null) => void;
  addProductDraft: ProductDraft;
  setAddProductDraft: React.Dispatch<React.SetStateAction<ProductDraft>>;
  addProductErrors: Partial<Record<"productName" | "price", string>>;
  handleAddProductSaveOrUpdate: () => void;
  addServiceOpen: boolean;
  setAddServiceOpen: (v: boolean) => void;
  editingServiceId: string | null;
  setEditingServiceId: (v: string | null) => void;
  addServiceDraft: ServiceDraft;
  setAddServiceDraft: React.Dispatch<React.SetStateAction<ServiceDraft>>;
  handleAddServiceSaveOrUpdate: () => void;
  invoiceDrawerOpen: boolean;
  setInvoiceDrawerOpen: (v: boolean) => void;
  settings: any;
  profileResponse: any;
  professionalBusinessOverride: any;
}) {
  const {
    m,
    addProductOpen,
    setAddProductOpen,
    editingProductId,
    setEditingProductId,
    addProductDraft,
    setAddProductDraft,
    addProductErrors,
    handleAddProductSaveOrUpdate,
    addServiceOpen,
    setAddServiceOpen,
    editingServiceId,
    setEditingServiceId,
    addServiceDraft,
    setAddServiceDraft,
    handleAddServiceSaveOrUpdate,
    invoiceDrawerOpen,
    setInvoiceDrawerOpen,
    settings,
    profileResponse,
    professionalBusinessOverride,
  } = props;
  const { data: businessSetupResponse } = useGetBusinessSetupQuery({
    includeDraft: false,
  });
  const serviceGroups = React.useMemo(() => {
    const rows = businessSetupResponse?.data?.service_categories ?? [];
    const grouped = new Map<string, { id: string; label: string }[]>();
    rows.forEach((row) => {
      if (!row.service_id || !row.service_title) return;
      const category = row.category_title || "Other";
      const list = grouped.get(category) ?? [];
      if (!list.some((item) => item.id === row.service_id)) {
        list.push({ id: row.service_id, label: row.service_title });
      }
      grouped.set(category, list);
    });
    return Array.from(grouped.entries());
  }, [businessSetupResponse?.data?.service_categories]);

  const patchProductDraft = (patch: Partial<ProductDraft>) => {
    setAddProductDraft((prev) => ({ ...prev, ...patch }));
  };

  return (
    <>
      <AppModal
        open={addProductOpen}
        onClose={() => {
          setAddProductOpen(false);
          setEditingProductId(null);
        }}
        title={editingProductId ? "Edit Product" : "Add Product"}
        PaperProps={{
          sx: { width: { xs: "92vw", sm: 560 }, maxWidth: "92vw" },
        }}
        footer={
          <Stack
            direction="row"
            spacing={1.25}
            justifyContent="flex-end"
            sx={{ px: 2.5, py: 1.75 }}
          >
            <AppButton
              tone="secondary"
              onClick={() => setAddProductOpen(false)}
              sx={{
                px: 3,
              }}
            >
              Cancel
            </AppButton>
            <AppButton
              tone="primary"
              onClick={handleAddProductSaveOrUpdate}
              sx={{
                px: 4,
              }}
            >
              {editingProductId ? "Update" : "Save"}
            </AppButton>
          </Stack>
        }
      >
        <Box sx={{ px: 2.5, py: 2 }}>
          {/* Product name is a plain input — not a service dropdown. */}
          <Stack spacing={1.6}>
            <AppTextField
              label="Product Name"
              placeholder="Enter product name"
              value={addProductDraft.productName}
              onChange={(e) => patchProductDraft({ productName: e.target.value })}
              fullWidth
              error={Boolean(addProductErrors.productName)}
              helperText={addProductErrors.productName}
            />
            <BookingCatalogItemFields
              draft={addProductDraft}
              errors={addProductErrors}
              onChange={patchProductDraft}
              showUnit
            />
          </Stack>
        </Box>
      </AppModal>

      <AppModal
        open={addServiceOpen}
        onClose={() => {
          setAddServiceOpen(false);
          setEditingServiceId(null);
        }}
        title={editingServiceId ? "Edit Service" : "Add Service"}
        PaperProps={{
          sx: { width: { xs: "92vw", sm: 560 }, maxWidth: "92vw" },
        }}
        footer={
          <Stack
            direction="row"
            spacing={1.25}
            justifyContent="flex-end"
            sx={{ px: 2.5, py: 1.75 }}
          >
            <AppButton
              tone="secondary"
              onClick={() => setAddServiceOpen(false)}
              sx={{
                px: 3,
              }}
            >
              Cancel
            </AppButton>
            <AppButton
              tone="primary"
              onClick={handleAddServiceSaveOrUpdate}
              sx={{
                px: 4,
              }}
            >
              {editingServiceId ? "Update" : "Save"}
            </AppButton>
          </Stack>
        }
      >
        <Box sx={{ px: 2.5, py: 2 }}>
          <Stack spacing={1.5}>
            <Box>
              <BodyText
                sx={mollureLabelSx(m.navy, { mb: 0.5 })}
              >
                Select Service
              </BodyText>
              <MollureFormField
                select
                value={addServiceDraft.serviceId}
                onChange={(e) => {
                  const serviceId = String(e.target.value);
                  const match = serviceGroups
                    .flatMap(([category, items]) =>
                      items.map((item) => ({ ...item, category })),
                    )
                    .find((item) => item.id === serviceId);
                  setAddServiceDraft((p) => ({
                    ...p,
                    serviceId,
                    category: match?.category ?? "",
                    service: match?.label ?? "",
                  }));
                }}
                SelectProps={{ native: true }}
              >
                <option value="">Select a service</option>
                {serviceGroups.length ? (
                  serviceGroups.map(([category, items]) => (
                    <optgroup key={category} label={category}>
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </optgroup>
                  ))
                ) : (
                  <option value="" disabled>
                    No services configured
                  </option>
                )}
              </MollureFormField>
            </Box>

            <Box>
              <BodyText
                sx={mollureLabelSx(m.navy, { mb: 0.5 })}
              >
                VAT
              </BodyText>
              <MollureFormField
                value={addServiceDraft.vat}
                onChange={(e) =>
                  setAddServiceDraft((p) => ({
                    ...p,
                    vat: sanitizeDecimalInput(e.target.value),
                  }))
                }
                placeholder="e.g. 9"
                inputProps={{ inputMode: "decimal" }}
              />
            </Box>
          </Stack>
        </Box>
      </AppModal>

      <FinanceDocumentPreviewDrawer
        open={invoiceDrawerOpen}
        onClose={() => setInvoiceDrawerOpen(false)}
        documentType="invoice"
        invoiceType={settings.defaultInvoiceType}
        settings={settings}
        row={buildInvoiceTemplatePreviewRow(
          settings.defaultInvoiceType,
          professionalBusinessOverride,
        )}
        profileData={profileResponse?.data ?? null}
        professionalBusinessOverride={professionalBusinessOverride}
      />
    </>
  );
}
