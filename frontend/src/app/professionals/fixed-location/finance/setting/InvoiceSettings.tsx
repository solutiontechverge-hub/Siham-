"use client";

import * as React from "react";
import { Stack, Box } from "@mui/material";
import {
  mollurePageTitleSx,
} from "../../../../../theme/mollureHierarchy";
import { SubHeading } from "../../../../../components/ui/typography";
import AppCard from "../../../../../components/common/AppCard";
import { useProfessionalBusinessOverride } from "../../../../../components/common/finance-documents";
import { useInvoiceSettingsSection } from "./useFinanceSettingPage";
import { createInvoiceSettingsSx } from "./invoiceSettings.styles";
import { InvoiceSettingsTemplates } from "./InvoiceSettingsTemplates";
import { InvoiceSettingsProducts } from "./InvoiceSettingsProducts";
import { InvoiceSettingsPayments } from "./InvoiceSettingsPayments";
import { InvoiceSettingsModals } from "./InvoiceSettingsModals";

export default function InvoiceSettings() {
  const section = useInvoiceSettingsSection();
  const {
    m,
    settings,
    profileResponse,
    showDueDateSettings,
    paymentsEditing,
    setPaymentsEditing,
    addProductOpen,
    setAddProductOpen,
    editingProductId,
    setEditingProductId,
    addProductDraft,
    setAddProductDraft,
    addProductErrors,
    addServiceOpen,
    setAddServiceOpen,
    editingServiceId,
    setEditingServiceId,
    addServiceDraft,
    setAddServiceDraft,
    logoInputRef,
    invoiceDrawerOpen,
    setInvoiceDrawerOpen,
    handleDeleteProduct,
    handleDeleteService,
    handleAddProductSaveOrUpdate,
    handleAddServiceSaveOrUpdate,
    openAddProduct,
    openEditProduct,
    openAddService,
    openEditService,
    updatePaymentTerm,
    updateReminder,
    handleLogoChange,
    selectIndividualInvoice,
    selectCompanyInvoice,
  } = section;
  const professionalBusinessOverride = useProfessionalBusinessOverride();
  const sx = createInvoiceSettingsSx(m);

  return (
    <Stack spacing={2}>
      <AppCard sx={{ ...sx.sectionCardSx, borderRadius: "10px" }}>
        <Box sx={sx.headerSx}>
          <SubHeading sx={mollurePageTitleSx(m.navy)}>
            Invoice Setting
          </SubHeading>
        </Box>
        <Box sx={{ p: 2 }}>
          <Stack spacing={2}>
            <InvoiceSettingsTemplates
              m={m}
              sx={sx}
              settings={settings}
              logoInputRef={logoInputRef}
              handleLogoChange={handleLogoChange}
              selectIndividualInvoice={selectIndividualInvoice}
              selectCompanyInvoice={selectCompanyInvoice}
            />
            <InvoiceSettingsProducts
              m={m}
              sx={sx}
              settings={settings}
              openAddProduct={openAddProduct}
              openEditProduct={openEditProduct}
              handleDeleteProduct={handleDeleteProduct}
              openAddService={openAddService}
              openEditService={openEditService}
              handleDeleteService={handleDeleteService}
            />
            <InvoiceSettingsPayments
              m={m}
              sx={sx}
              showDueDateSettings={showDueDateSettings}
              paymentsEditing={paymentsEditing}
              setPaymentsEditing={setPaymentsEditing}
              settings={settings}
              updatePaymentTerm={updatePaymentTerm}
              updateReminder={updateReminder}
            />
          </Stack>
        </Box>
      </AppCard>

      <InvoiceSettingsModals
        m={m}
        addProductOpen={addProductOpen}
        setAddProductOpen={setAddProductOpen}
        editingProductId={editingProductId}
        setEditingProductId={setEditingProductId}
        addProductDraft={addProductDraft}
        setAddProductDraft={setAddProductDraft}
        addProductErrors={addProductErrors}
        handleAddProductSaveOrUpdate={handleAddProductSaveOrUpdate}
        addServiceOpen={addServiceOpen}
        setAddServiceOpen={setAddServiceOpen}
        editingServiceId={editingServiceId}
        setEditingServiceId={setEditingServiceId}
        addServiceDraft={addServiceDraft}
        setAddServiceDraft={setAddServiceDraft}
        handleAddServiceSaveOrUpdate={handleAddServiceSaveOrUpdate}
        invoiceDrawerOpen={invoiceDrawerOpen}
        setInvoiceDrawerOpen={setInvoiceDrawerOpen}
        settings={settings}
        profileResponse={profileResponse}
        professionalBusinessOverride={professionalBusinessOverride}
      />
    </Stack>
  );
}
