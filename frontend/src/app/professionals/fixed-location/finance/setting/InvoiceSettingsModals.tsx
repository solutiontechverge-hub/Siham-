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
import { useGetBusinessSetupQuery } from "../../../../../store/services/businessApi";
import type { ProductDraft } from "./setting.types";

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
  addServiceDraft: { service: string; vat: string };
  setAddServiceDraft: React.Dispatch<
    React.SetStateAction<{ service: string; vat: string }>
  >;
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
  const { data: businessSetupResponse } = useGetBusinessSetupQuery({ includeDraft: false });
  const realServices = React.useMemo(() => {
    const rows = businessSetupResponse?.data?.service_categories ?? [];
    type ServicePickerOption = { id: string; label: string; category: string; group?: boolean };
    const grouped = new Map<string, ServicePickerOption[]>();
    rows.forEach((row) => {
      if (!row.service_id || !row.service_title) return;
      const category = row.category_title || "Other";
      const list = grouped.get(category) ?? [];
      if (!list.some((item) => item.id === row.service_id)) {
        list.push({ id: row.service_id, label: row.service_title, category });
      }
      grouped.set(category, list);
    });
    return Array.from(grouped.entries()).flatMap(([category, items]) => [
      { id: `group-${category}`, label: category, category, group: true },
      ...items,
    ]);
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
          {/* Same field set as calendar drawer BookingAddUniqueItemScreen. */}
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
                value={addServiceDraft.service}
                onChange={(e) =>
                  setAddServiceDraft((p) => ({
                    ...p,
                    service: String(e.target.value),
                  }))
                }
                SelectProps={{ native: true }}
              >
                {realServices.length ? realServices.map((opt) => (
                  opt.group ? (
                    <optgroup key={opt.id} label={opt.label}>
                      {realServices.filter((item) => !item.group && item.category === opt.category).map((item) => (
                        <option key={item.id} value={item.label}>{item.label}</option>
                      ))}
                    </optgroup>
                  ) : null
                )) : <option value="">No services configured</option>}
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
                  setAddServiceDraft((p) => ({ ...p, vat: e.target.value }))
                }
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
        profileData={profileResponse?.data ?? null}
        professionalBusinessOverride={professionalBusinessOverride}
      />
    </>
  );
}
